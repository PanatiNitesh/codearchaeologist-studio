import sys
import argparse
import logging
from pathlib import Path

# Ensure workspace root is in sys.path
_repo_root = str(Path(__file__).resolve().parent.parent.parent)
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

# Ensure UTF-8 output encoding on Windows console
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

from backend.app.phase8_modernization.handover_engine import ShiftHandoverEngine
from backend.app.phase4_archaeology.chesterton_engine import ChestertonFenceEngine
from backend.app.phase7_evaluation.halfdone_bench import HalfDoneBenchEvaluator
from backend.app.phase1_ingestion.extractor import RepoExtractor
from backend.app.phase2_ast.parser import CodeASTParser
from backend.app.phase4_archaeology.commit_miner import CommitMiner

logging.basicConfig(level=logging.WARNING)
logger = logging.getLogger("ca_cli")

def build_engine(repo_dir: str):
    from backend.app.phase1_ingestion.repo_db import RepoDatabaseService
    db_service = RepoDatabaseService()
    repo_name = Path(repo_dir).resolve().name
    repo_id = f"cli_{repo_name}"
    db_service.save_repository(
        repo_id=repo_id,
        name=repo_name,
        path=str(Path(repo_dir).resolve()),
        url=str(Path(repo_dir).resolve()),
        default_branch="main",
        stats={}
    )

    extractor = RepoExtractor(repo_dir)
    raw_files = extractor.extract_files()
    parser = CodeASTParser()
    files_data = []
    for rf in raw_files:
        if rf["extension"] in {".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go"}:
            res = parser.parse_file(rf["rel_path"], rf["content"])
            res.update(rf)
            files_data.append(res)
    
    commits = []
    try:
        miner = CommitMiner()
        commits = miner.mine_commits(repo_id, str(Path(repo_dir).resolve()), max_commits=50)
    except Exception as e:
        logger.warning(f"Could not mine commits for CLI: {e}")

    return ShiftHandoverEngine(repo_dir, files_data=files_data, commits=commits), files_data, commits

def cmd_handover(args):
    repo_dir = args.repo or "."
    engine, files_data, commits = build_engine(repo_dir)
    print(f"\n🔍 Scanning Git working tree and AST call graph in: {Path(repo_dir).resolve()}...\n")
    briefing = engine.audit_wip(scenario_id=args.scenario)

    if args.slack:
        output = briefing.slack_briefing
    else:
        output = briefing.markdown_briefing

    if args.out:
        Path(args.out).write_text(output, encoding="utf-8")
        print(f"✅ Handover briefing exported to: {args.out}\n")
    else:
        print(output)

def cmd_fence(args):
    repo_dir = args.repo or "."
    engine, files_data, commits = build_engine(repo_dir)
    fence_engine = ChestertonFenceEngine(commits, files_data)
    res = fence_engine.calculate_fence_score(args.file)
    print(f"\n🏰 CHESTERTON'S FENCE AUDIT: {args.file}")
    print(f"Risk Score: {res['chesterton_score']} / 100.0")
    print(f"Verdict: {res['risk_verdict']}")
    print(f"Recommendation: {res['recommendation']}\n")

def cmd_benchmark(args):
    repo_dir = args.repo or "."
    engine, files_data, commits = build_engine(repo_dir)
    bench = HalfDoneBenchEvaluator(repo_dir, files_data, commits)
    res = bench.run_benchmark(max_tasks=args.tasks)
    print("\n📊 HALFDONE-BENCH EVALUATION REPORT:")
    print(f"Benchmark: {res['benchmark_name']}")
    print(f"Evaluated Tasks: {res['evaluated_tasks_count']}")
    print(f"Mean Precision: {res['mean_precision']}")
    print(f"Mean Recall: {res['mean_recall']}")
    print(f"Mean F1 Score: {res['mean_f1_score']}")
    print(f"Success Rate: {res['success_rate_pct']}%\n")

def cmd_multi_repo(args):
    from backend.app.phase7_evaluation.multi_repo_benchmark import MultiRepoBlastBenchmark
    bench = MultiRepoBlastBenchmark()
    res = bench.run_benchmark(max_commits_per_repo=args.commits)
    print("\n🌐 MULTI-REPOSITORY BLAST RADIUS BENCHMARK REPORT:")
    print(f"Repositories Evaluated: {res['repositories_evaluated']}")
    print(f"Total Historical Commits: {res['total_commits_evaluated']}")
    print(f"Macro Precision: {res['macro_metrics']['precision']:.1%}")
    print(f"Macro Recall: {res['macro_metrics']['recall']:.1%}")
    print(f"Macro F1 Score: {res['macro_metrics']['f1_score']:.3f}\n")
    print("Breakdown per repository:")
    for r in res["per_repository"]:
        print(f"  - {r['repo_name']} ({r['language']}): P={r['precision']:.1%}, R={r['recall']:.1%}, F1={r['f1_score']:.3f} on {r['commits_evaluated']} commits")
    print()

def main():
    parser = argparse.ArgumentParser(
        prog="ca",
        description="CodeArchaeologist CLI: Autonomous Shift Handover & Legacy Software Intelligence"
    )
    subparsers = parser.add_subparsers(dest="command", required=True)

    # handover command
    p_handover = subparsers.add_parser("handover", help="Generate shift handover briefing from current branch")
    p_handover.add_argument("--repo", default=".", help="Repository root directory")
    p_handover.add_argument("--scenario", default=None, help="Optional simulated scenario ID")
    p_handover.add_argument("--slack", action="store_true", help="Format briefing for Slack")
    p_handover.add_argument("--out", default=None, help="Save briefing to file")
    p_handover.set_defaults(func=cmd_handover)

    # fence command
    p_fence = subparsers.add_parser("fence", help="Calculate Chesterton's Fence score for a file")
    p_fence.add_argument("file", help="Relative file path")
    p_fence.add_argument("--repo", default=".", help="Repository root directory")
    p_fence.set_defaults(func=cmd_fence)

    # benchmark command
    p_bench = subparsers.add_parser("benchmark", help="Run HalfDone-Bench on repository")
    p_bench.add_argument("--repo", default=".", help="Repository root directory")
    p_bench.add_argument("--tasks", type=int, default=5, help="Maximum benchmark tasks")
    p_bench.set_defaults(func=cmd_benchmark)

    # multi-repo benchmark command
    p_multi = subparsers.add_parser("multi-repo", help="Run multi-repository blast radius evaluation across 3+ codebases")
    p_multi.add_argument("--commits", type=int, default=4, help="Commits per repository")
    p_multi.set_defaults(func=cmd_multi_repo)

    args = parser.parse_args()
    try:
        args.func(args)
    except Exception as e:
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
