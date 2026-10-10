import os
from pathlib import Path
from typing import List, Dict, Any, Generator

IGNORE_DIRS = {
    "node_modules",
    ".git",
    "dist",
    "build",
    "coverage",
    ".next",
    "out",
    ".cache",
    ".vscode",
    ".idea",
    "vendor",
    "tmp",
    "temp",
    "__pycache__",
    ".venv",
    "venv",
    "env",
    ".yarn",
    ".pnpm",
    ".output",
    ".nuxt",
    ".svelte-kit",
    "target",
    "bin",
    "obj",
    ".gradle",
    "Pods",
    "cloned_repos",
    ".turbo",
    "storybook-static"
}

IGNORE_FILENAMES = {
    "package-lock.json",
    "npm-shrinkwrap.json",
    "yarn.lock",
    "pnpm-lock.yaml",
    "composer.lock",
    "Cargo.lock",
    "poetry.lock",
    "Pipfile.lock"
}

ALLOWED_EXTENSIONS = {
    # Modern Web & Backend
    ".js", ".jsx", ".ts", ".tsx", ".py", ".mjs", ".cjs",
    # Systems & Enterprise Legacy
    ".java", ".go", ".rs", ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp",
    ".cs", ".php", ".rb", ".kt", ".swift", ".scala",
    # Scripts & Data
    ".sh", ".bash", ".sql",
    # Markup & Config
    ".json", ".md", ".yaml", ".yml", ".xml", ".html", ".css"
}

class RepoExtractor:
    def __init__(self, repo_path: str):
        self.repo_path = Path(repo_path)

    def extract_files(self) -> List[Dict[str, Any]]:
        """
        Traverses the repository and collects target files,
        ignoring specified directories, lockfiles, and minified bundles.
        Uses a two-phase scan: collects file metadata first, prioritizes source files,
        and only reads contents for the capped file set to minimize RAM usage.
        """
        candidate_files = []

        for root, dirs, files in os.walk(self.repo_path):
            # Modify dirs in-place to avoid descending into ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith(".")]

            for file in files:
                if file in IGNORE_FILENAMES:
                    continue
                lower_f = file.lower()
                if lower_f.endswith((".min.js", ".min.css", ".bundle.js", ".chunk.js", ".map")):
                    continue

                ext = Path(file).suffix.lower()
                if ext in ALLOWED_EXTENSIONS:
                    full_path = Path(root) / file
                    try:
                        size = full_path.stat().st_size
                        # Guard against OOM memory spikes: skip oversized files (> 200 KB)
                        if size > 200 * 1024 or size == 0:
                            continue
                        rel_path = full_path.relative_to(self.repo_path).as_posix()
                        
                        candidate_files.append({
                            "rel_path": rel_path,
                            "name": file,
                            "extension": ext,
                            "size_bytes": size,
                            "full_path": full_path
                        })
                    except Exception:
                        continue

        # Cap extracted files count (max 120 on Render / constrained memory, 200 default)
        is_render = os.environ.get("RENDER", "").lower() == "true"
        max_files = 120 if is_render else 200

        def file_priority(f):
            ext = f["extension"]
            # Prioritize core application code over json / docs / configs
            if ext in {".py", ".ts", ".tsx", ".js", ".jsx", ".java", ".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".cs", ".go", ".rs", ".php", ".rb"}:
                return (0, f["rel_path"])
            if ext in {".sh", ".bash", ".sql"}:
                return (1, f["rel_path"])
            if ext in {".json", ".md", ".yaml", ".yml", ".xml", ".html", ".css"}:
                return (3, f["rel_path"])
            return (2, f["rel_path"])

        candidate_files.sort(key=file_priority)
        selected_candidates = candidate_files[:max_files]
        selected_candidates.sort(key=lambda x: x["rel_path"])

        collected_files = []
        for cand in selected_candidates:
            try:
                full_path = cand["full_path"]
                with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()

                lines = content.splitlines()
                # Skip minified files disguised with standard extensions (e.g. single line > 5000 chars)
                if len(lines) <= 2 and len(content) > 5000:
                    continue

                # Truncate oversized source files in memory to first 1200 lines to prevent OOM
                if len(lines) > 1200:
                    lines = lines[:1200]
                    content = "\n".join(lines)

                loc = len([line for line in lines if line.strip() != ""])

                collected_files.append({
                    "rel_path": cand["rel_path"],
                    "name": cand["name"],
                    "extension": cand["extension"],
                    "size_bytes": cand["size_bytes"],
                    "loc": loc,
                    "content": content,
                    "full_path": str(full_path)
                })
            except Exception:
                continue

        return collected_files
