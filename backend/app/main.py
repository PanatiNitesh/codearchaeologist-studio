import os
import uuid
import logging
from typing import Dict, Any, Optional

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass
import hashlib
import zipfile
import io
import re
import shutil
import git
import threading
from fastapi import FastAPI, HTTPException, Query, BackgroundTasks, Request, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from backend.app.phase1_ingestion.cloner import RepoCloner
from backend.app.phase1_ingestion.repo_db import RepoDatabaseService
from backend.app.phase8_modernization.systemdna_engine import SystemDNAEngine
from backend.app.pipeline import CodeArchaeologistPipeline
from backend.app.utils.sample_generator import create_sample_repository
from backend.app.models.schemas import (
    RAGAnswerResponse,
    BlastRadiusResult,
    ChangeImpactPrediction,
    OverallEvaluation,
    SoftwareGraph,
    SoftwareTimeline,
    FileEvolution
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("CodeArchaeologist")

app = FastAPI(
    title="CodeArchaeologist API",
    description="AI-Powered Software Evolution & Legacy Code Intelligence Engine",
    version="1.0.0"
)

from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pathlib import Path

# Enable CORS for developer dashboard
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIST = Path(__file__).resolve().parent.parent.parent / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/assets", StaticFiles(directory=str(FRONTEND_DIST / "assets")), name="assets")

# In-memory pipeline cache
pipelines: Dict[str, CodeArchaeologistPipeline] = {}
db_service = RepoDatabaseService()
cloner = RepoCloner()

class IngestRequest(BaseModel):
    repo_url_or_path: str
    force_reclone: bool = False

class ChatRequest(BaseModel):
    question: str

class SimulateRefactorRequest(BaseModel):
    scenario_id: Optional[str] = None
    custom_change: Optional[str] = None

class AnalyticsTrackRequest(BaseModel):
    event_type: str
    session_id: Optional[str] = None
    visitor_id: Optional[str] = None
    repo_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None

def get_client_hash(request: Request, visitor_id: Optional[str] = None) -> str:
    if visitor_id and visitor_id.strip():
        return visitor_id.strip()
    ip = request.client.host if request.client else "127.0.0.1"
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        ip = forwarded.split(",")[0].strip()
    ua = request.headers.get("user-agent", "unknown")
    raw = f"{ip}:{ua}"
    return "vis_" + hashlib.sha256(raw.encode()).hexdigest()[:12]

tasks_status: Dict[str, Dict[str, Any]] = {}
_pipeline_load_lock = threading.Lock()

def set_active_pipeline(repo_id: str, pipeline: CodeArchaeologistPipeline):
    """
    Enforces a single-active-pipeline memory model on Render (512MB RAM ceiling).
    Evicts any other loaded pipeline instances to release heap memory immediately.
    """
    import gc
    for old_repo in list(pipelines.keys()):
        if old_repo != repo_id:
            del pipelines[old_repo]
    pipelines[repo_id] = pipeline
    gc.collect()

def get_or_load_pipeline(repo_id: str, force_reanalyze: bool = False) -> CodeArchaeologistPipeline:
    # Fast-path check without lock
    if repo_id in pipelines and not force_reanalyze:
        return pipelines[repo_id]

    with _pipeline_load_lock:
        # Re-check under lock in case another concurrent request just finished loading
        if repo_id in pipelines and not force_reanalyze:
            return pipelines[repo_id]

        # 1. Check SQLite database
        repo_info = db_service.get_repository(repo_id)
        
        # 2. If not in DB, check if existing folder exists on disk in cloner.storage_dir
        if not repo_info:
            raw_name = repo_id.replace("gh_", "").replace("local_", "")
            candidate_dirs = [
                cloner.storage_dir / raw_name,
                cloner.storage_dir / repo_id,
            ]
            for cdir in candidate_dirs:
                if cdir.exists() and (cdir / ".git").exists():
                    logger.info(f"Found existing repository on disk for '{repo_id}' at {cdir}. Auto-registering in DB.")
                    db_service.save_repository(
                        repo_id=repo_id,
                        name=raw_name,
                        path=str(cdir),
                        url=cloner.normalize_url(repo_id),
                        default_branch="main",
                        stats={}
                    )
                    repo_info = db_service.get_repository(repo_id)
                    break

        # 3. If still not in DB, auto-clone on demand if it's a GitHub repo (gh_*) or generate sample
        if not repo_info:
            if repo_id.startswith("gh_") or "/" in repo_id:
                logger.info(f"Auto-cloning and indexing repository '{repo_id}' on demand...")
                try:
                    cloned_id, local_path, meta = cloner.clone_or_load(repo_id, force_reclone=False)
                    db_service.save_repository(
                        repo_id=cloned_id,
                        name=meta.get("name", repo_id),
                        path=local_path,
                        url=meta.get("url", repo_id),
                        default_branch=meta.get("default_branch", "main"),
                        stats={}
                    )
                    pipeline = CodeArchaeologistPipeline(cloned_id, local_path)
                    pipeline.run_full_pipeline()
                    set_active_pipeline(cloned_id, pipeline)
                    return pipeline
                except Exception as e:
                    logger.warning(f"Could not auto-clone repository '{repo_id}': {e}")
            elif repo_id in ("ecommerce_2022_2026", "sample_enterprise_ecommerce"):
                logger.info(f"Auto-generating sample repository for '{repo_id}' on demand...")
                sample_path = create_sample_repository()
                sample_repo_id = "sample_enterprise_ecommerce"
                db_service.save_repository(
                    repo_id=sample_repo_id,
                    name="Enterprise E-Commerce (2022-2026)",
                    path=sample_path,
                    url="sample://enterprise_ecommerce",
                    default_branch="main",
                    stats={}
                )
                pipeline = CodeArchaeologistPipeline(sample_repo_id, sample_path)
                pipeline.run_full_pipeline()
                set_active_pipeline(sample_repo_id, pipeline)
                return pipeline

        # 4. If STILL not in DB, gracefully fallback to the latest active repo or auto-generate sample repo
        if not repo_info:
            available_repos = db_service.list_repositories()
            if available_repos:
                fallback_repo = available_repos[0]
                logger.warning(f"Repository '{repo_id}' not found. Falling back to active repository '{fallback_repo['id']}'.")
                return get_or_load_pipeline(fallback_repo["id"], force_reanalyze=False)
            else:
                logger.warning(f"No repositories registered. Auto-generating default enterprise sample repository.")
                sample_path = create_sample_repository()
                sample_repo_id = "sample_enterprise_ecommerce"
                db_service.save_repository(
                    repo_id=sample_repo_id,
                    name="Enterprise E-Commerce (2022-2026)",
                    path=sample_path,
                    url="sample://enterprise_ecommerce",
                    default_branch="main",
                    stats={}
                )
                pipeline = CodeArchaeologistPipeline(sample_repo_id, sample_path)
                pipeline.run_full_pipeline()
                set_active_pipeline(sample_repo_id, pipeline)
                return pipeline

        pipeline = CodeArchaeologistPipeline(repo_id, repo_info["path"])
        if not force_reanalyze:
            loaded = pipeline.load_from_db()
            if loaded:
                logger.info(f"Loaded existing pipeline state for '{repo_id}' directly from SQLite database.")
                set_active_pipeline(repo_id, pipeline)
                return pipeline

        logger.info(f"Running full pipeline analysis for '{repo_id}'...")
        pipeline.run_full_pipeline()
        set_active_pipeline(repo_id, pipeline)
        return pipeline

def _run_ingest_background(task_id: str, repo_url_or_path: str, force_reclone: bool):
    tasks_status[task_id] = {"status": "processing", "progress": "Cloning repository..."}
    db_service.db.save_task(task_id, status="processing", progress="Cloning repository...")
    try:
        repo_id, local_path, meta = cloner.clone_or_load(repo_url_or_path, force_reclone)
        db_service.save_repository(
            repo_id=repo_id,
            name=meta.get("name", repo_id),
            path=local_path,
            url=meta.get("url", repo_url_or_path),
            default_branch=meta.get("default_branch", "main"),
            stats={}
        )
        def on_progress(step_text: str):
            tasks_status[task_id]["progress"] = f"{step_text} ({repo_id})"
            db_service.db.save_task(task_id, status="processing", progress=f"{step_text} ({repo_id})", repo_id=repo_id)

        import gc
        gc.collect()

        pipeline = CodeArchaeologistPipeline(repo_id, local_path)
        summary = pipeline.run_full_pipeline(progress_callback=on_progress)
        set_active_pipeline(repo_id, pipeline)

        tasks_status[task_id] = {
            "status": "completed",
            "repo_id": repo_id,
            "summary": summary,
            "meta": meta
        }
        db_service.db.save_task(task_id, status="completed", progress="Completed", repo_id=repo_id, summary=summary)
        db_service.db.record_analytics_event(
            event_type="repo_ingest",
            repo_id=repo_id,
            details={"url": meta.get("url", repo_url_or_path), "name": meta.get("name", repo_id), "async": True}
        )
    except Exception as e:
        logger.error(f"Async ingestion task {task_id} failed: {e}", exc_info=True)
        err_msg = str(e)
        if "is private or does not exist" in err_msg:
            clean_err = err_msg
        elif "could not read Username" in err_msg or "exit code(128)" in err_msg:
            clean_err = "Repository is private or could not be found. Please ensure the repository is public or verify the URL."
        else:
            clean_err = err_msg
        tasks_status[task_id] = {"status": "failed", "error": clean_err}
        db_service.db.save_task(task_id, status="failed", error=clean_err)
    finally:
        import gc
        gc.collect()

@app.get("/")
def root():
    index_html = FRONTEND_DIST / "index.html"
    if index_html.exists():
        return FileResponse(str(index_html))
    return {
        "system": "CodeArchaeologist",
        "tagline": "AI-Powered Software Evolution & Legacy Code Intelligence",
        "status": "ready"
    }

@app.get("/api/health")
@app.get("/api/ping")
def health():
    return {
        "system": "CodeArchaeologist",
        "tagline": "AI-Powered Software Evolution & Legacy Code Intelligence",
        "status": "ready",
        "phases_active": [
            "Phase 1: Repository Ingestion",
            "Phase 2: Code Understanding & AST",
            "Phase 3: Architecture & Call Graph",
            "Phase 4: Software Archaeology",
            "Phase 5: Knowledge Layer & Evidence RAG",
            "Phase 6: Blast Radius & ML Prediction",
            "Phase 7: Evaluation Engine",
            "Phase 8: Developer Dashboard"
        ]
    }

@app.post("/api/analytics/track")
def track_analytics(req: AnalyticsTrackRequest, request: Request):
    visitor_id = get_client_hash(request, req.visitor_id)
    ip = request.headers.get("x-forwarded-for", request.client.host if request.client else None)
    ua = request.headers.get("user-agent")
    event_id = db_service.db.record_analytics_event(
        event_type=req.event_type,
        session_id=req.session_id,
        visitor_id=visitor_id,
        repo_id=req.repo_id,
        details=req.details,
        client_ip=ip,
        user_agent=ua
    )
    return {"success": True, "event_id": event_id, "visitor_id": visitor_id}

@app.get("/api/analytics/stats")
def get_analytics_stats():
    return db_service.db.get_analytics_stats()

@app.post("/api/ingest")
def ingest_repository(req: IngestRequest):
    try:
        repo_id, local_path, meta = cloner.clone_or_load(req.repo_url_or_path, req.force_reclone)
        db_service.save_repository(
            repo_id=repo_id,
            name=meta.get("name", repo_id),
            path=local_path,
            url=meta.get("url", req.repo_url_or_path),
            default_branch=meta.get("default_branch", "main"),
            stats={}
        )
        pipeline = CodeArchaeologistPipeline(repo_id, local_path)
        summary = pipeline.run_full_pipeline()
        pipelines[repo_id] = pipeline
        db_service.db.record_analytics_event(
            event_type="repo_ingest",
            repo_id=repo_id,
            details={"url": meta.get("url", req.repo_url_or_path), "name": meta.get("name", repo_id)}
        )
        return {
            "success": True,
            "repo_id": repo_id,
            "meta": meta,
            "summary": summary
        }
    except Exception as e:
        logger.error(f"Ingestion failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/ingest/async")
def ingest_repository_async(req: IngestRequest):
    import uuid
    import threading
    task_id = f"task_{uuid.uuid4().hex[:8]}"
    tasks_status[task_id] = {"status": "queued", "progress": "Queued for processing"}
    db_service.db.save_task(task_id, status="queued", progress="Queued for processing")
    
    # Run in dedicated thread so FastAPI event loop remains completely unblocked for polling requests
    worker = threading.Thread(
        target=_run_ingest_background,
        args=(task_id, req.repo_url_or_path, req.force_reclone),
        daemon=True
    )
    worker.start()
    return {"task_id": task_id, "status": "queued"}

@app.post("/api/ingest/upload")
async def upload_repository_zip(file: UploadFile = File(...)):
    """
    Accepts a .zip archive of a local codebase, extracts it safely,
    initializes git tracking if needed, and runs full pipeline analysis.
    """
    import threading
    if not file.filename or not file.filename.lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only .zip archive files are supported.")
    
    # Generate clean repo name from filename
    raw_name = Path(file.filename).stem
    clean_name = re.sub(r'[^a-zA-Z0-9_\-]', '_', raw_name).strip("_") or "uploaded_project"
    repo_name = f"upload_{clean_name}_{uuid.uuid4().hex[:6]}"
    repo_id = f"local_{repo_name}"
    destination = cloner.storage_dir / repo_name

    # Read zip bytes and check size (limit to 35 MB to protect memory)
    content = await file.read()
    if len(content) > 35 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="ZIP archive exceeds 35MB maximum upload limit.")

    destination.mkdir(parents=True, exist_ok=True)
    try:
        with zipfile.ZipFile(io.BytesIO(content)) as zf:
            for member in zf.infolist():
                # Prevent Zip Slip directory traversal vulnerability
                filename = member.filename
                if "__MACOSX" in filename or Path(filename).name.startswith("._"):
                    continue
                target_path = (destination / filename).resolve()
                if not str(target_path).startswith(str(destination.resolve())):
                    continue
                if member.is_dir():
                    target_path.mkdir(parents=True, exist_ok=True)
                else:
                    target_path.parent.mkdir(parents=True, exist_ok=True)
                    with zf.open(member) as src, open(target_path, "wb") as dst:
                        shutil.copyfileobj(src, dst)
    except zipfile.BadZipFile:
        shutil.rmtree(destination, ignore_errors=True)
        raise HTTPException(status_code=400, detail="Corrupted or invalid ZIP file.")
    except Exception as e:
        shutil.rmtree(destination, ignore_errors=True)
        raise HTTPException(status_code=500, detail=f"Failed to extract ZIP archive: {e}")

    # If the zip extracted into a single root folder (e.g. my-app/src/...), unwrap it
    extracted_entries = [p for p in destination.iterdir() if p.name not in ("__MACOSX", ".DS_Store")]
    if len(extracted_entries) == 1 and extracted_entries[0].is_dir():
        single_dir = extracted_entries[0]
        for sub_p in list(single_dir.iterdir()):
            shutil.move(str(sub_p), str(destination / sub_p.name))
        single_dir.rmdir()

    # If no .git exists in the uploaded directory, initialize a git repo for archaeology
    git_dir = destination / ".git"
    if not git_dir.exists():
        try:
            repo = git.Repo.init(destination)
            repo.git.add(all=True)
            repo.git.commit("-m", f"Initial upload import: {clean_name}")
        except Exception as e:
            logger.warning(f"Could not initialize git for uploaded archive: {e}")

    task_id = f"task_{uuid.uuid4().hex[:8]}"
    tasks_status[task_id] = {"status": "queued", "progress": "Queued for processing"}
    db_service.db.save_task(task_id, status="queued", progress="Queued for processing")

    worker = threading.Thread(
        target=_run_ingest_background,
        args=(task_id, str(destination), False),
        daemon=True
    )
    worker.start()
    return {"task_id": task_id, "status": "queued", "repo_id": repo_id}

@app.get("/api/tasks/{task_id}")
def get_task_status(task_id: str):
    if task_id in tasks_status:
        return tasks_status[task_id]
    
    # Fallback to persistent SQLite task store
    db_task = db_service.db.get_task(task_id)
    if db_task:
        # If task was marked 'processing' or 'queued' but is not in memory tasks_status,
        # the container rebooted mid-job. Mark it as failed gracefully so UI doesn't hang.
        if db_task.get("status") in ("processing", "queued"):
            err_msg = "Ingestion task was interrupted by a cloud container restart. Please submit ingestion again."
            db_task["status"] = "failed"
            db_task["error"] = err_msg
            db_service.db.save_task(task_id, status="failed", error=err_msg)
        tasks_status[task_id] = db_task
        return db_task
    
    # Return graceful terminal status instead of hard 404 to cleanly end client polling
    return {
        "task_id": task_id,
        "status": "failed",
        "error": "Task not found or expired. Please submit ingestion again."
    }

@app.post("/api/load-sample")
def load_sample():
    """
    Creates and analyzes the rich 2022-2026 enterprise ecommerce repository.
    """
    try:
        sample_path = create_sample_repository()
        repo_id = "sample_enterprise_ecommerce"
        if repo_id in pipelines:
            return {
                "success": True,
                "repo_id": repo_id,
                "summary": {"total_files": len(pipelines[repo_id].files_data)}
            }
        
        pipeline = CodeArchaeologistPipeline(repo_id, sample_path)
        if pipeline.load_from_db():
            set_active_pipeline(repo_id, pipeline)
            return {
                "success": True,
                "repo_id": repo_id,
                "summary": {"total_files": len(pipeline.files_data)}
            }

        summary = pipeline.run_full_pipeline()
        set_active_pipeline(repo_id, pipeline)
        db_service.db.record_analytics_event(
            event_type="load_sample",
            repo_id=repo_id,
            details={"sample": True}
        )
        return {
            "success": True,
            "repo_id": repo_id,
            "summary": summary
        }
    except Exception as e:
        logger.error(f"Sample load failed: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/repositories")
def list_repositories():
    return db_service.list_repositories()

@app.get("/api/repo/{repo_id}/files")
def get_files(repo_id: str):
    pipeline = get_or_load_pipeline(repo_id)
    return {
        "repo_id": repo_id,
        "files": pipeline.files_data
    }

@app.get("/api/repo/{repo_id}/file-content")
def get_file_content(repo_id: str, path: str = Query(...)):
    content_info = db_service.get_file_content(repo_id, path)
    if not content_info:
        raise HTTPException(status_code=404, detail="File not found")
    return content_info

@app.get("/api/repo/{repo_id}/graph", response_model=SoftwareGraph)
def get_graph(repo_id: str):
    pipeline = get_or_load_pipeline(repo_id)
    return pipeline.software_graph

@app.get("/api/repo/{repo_id}/timeline", response_model=SoftwareTimeline)
def get_timeline(repo_id: str):
    pipeline = get_or_load_pipeline(repo_id)
    return pipeline.timeline

@app.get("/api/repo/{repo_id}/file-intelligence", response_model=FileEvolution)
def get_file_intelligence(repo_id: str, file_path: str = Query(...)):
    pipeline = get_or_load_pipeline(repo_id)
    return pipeline.evolution_archaeologist.get_file_evolution(repo_id, file_path)

@app.get("/api/repo/{repo_id}/blast-radius", response_model=BlastRadiusResult)
def calculate_blast_radius(repo_id: str, target_file: str = Query(...)):
    pipeline = get_or_load_pipeline(repo_id)
    db_service.db.record_analytics_event(
        event_type="blast_radius",
        repo_id=repo_id,
        details={"target_file": target_file}
    )
    return pipeline.blast_calculator.calculate_blast_radius(target_file)

@app.get("/api/repo/{repo_id}/predict-impact", response_model=ChangeImpactPrediction)
def predict_change_impact(repo_id: str, target_file: str = Query(...)):
    pipeline = get_or_load_pipeline(repo_id)
    db_service.db.record_analytics_event(
        event_type="impact_predict",
        repo_id=repo_id,
        details={"target_file": target_file}
    )
    return pipeline.change_predictor.predict_impact(target_file)

@app.post("/api/repo/{repo_id}/ask", response_model=RAGAnswerResponse)
def ask_ai(repo_id: str, req: ChatRequest):
    pipeline = get_or_load_pipeline(repo_id)
    db_service.db.record_analytics_event(
        event_type="ai_query",
        repo_id=repo_id,
        details={"question": req.question[:120]}
    )
    return pipeline.rag_engine.answer_question(req.question)

@app.get("/api/repo/{repo_id}/evaluation", response_model=OverallEvaluation)
def get_evaluation(repo_id: str):
    pipeline = get_or_load_pipeline(repo_id)
    return pipeline.evaluation_result

@app.get("/api/repo/{repo_id}/refactor-scenarios")
def get_refactor_scenarios(repo_id: str):
    pipeline = get_or_load_pipeline(repo_id)
    if not pipeline.systemdna_engine:
        pipeline.systemdna_engine = SystemDNAEngine(pipeline.software_graph, pipeline.files_data)
    return pipeline.systemdna_engine.get_available_scenarios()

@app.post("/api/repo/{repo_id}/simulate-refactor")
def simulate_refactor(repo_id: str, req: SimulateRefactorRequest):
    pipeline = get_or_load_pipeline(repo_id)
    if not pipeline.systemdna_engine:
        pipeline.systemdna_engine = SystemDNAEngine(pipeline.software_graph, pipeline.files_data)
    db_service.db.record_analytics_event(
        event_type="systemdna_simulate",
        repo_id=repo_id,
        details={"scenario_id": req.scenario_id, "custom_change": req.custom_change}
    )
    return pipeline.systemdna_engine.simulate_refactor(req.scenario_id, req.custom_change)

@app.get("/api/repo/{repo_id}/fleet-scale")
def get_fleet_scale(repo_id: str):
    pipeline = get_or_load_pipeline(repo_id)
    if not pipeline.systemdna_engine:
        pipeline.systemdna_engine = SystemDNAEngine(pipeline.software_graph, pipeline.files_data)
    db_service.db.record_analytics_event(
        event_type="fleet_scale_view",
        repo_id=repo_id,
        details={}
    )
    return pipeline.systemdna_engine.get_fleet_scale_data()

@app.get("/{full_path:path}")
def catch_all(full_path: str):
    if full_path.startswith("api"):
        raise HTTPException(status_code=404, detail="API endpoint not found")
    file_candidate = FRONTEND_DIST / full_path
    if file_candidate.exists() and file_candidate.is_file():
        return FileResponse(str(file_candidate))
    index_html = FRONTEND_DIST / "index.html"
    if index_html.exists():
        return FileResponse(str(index_html))
    return {
        "system": "CodeArchaeologist",
        "tagline": "AI-Powered Software Evolution & Legacy Code Intelligence",
        "status": "ready"
    }
