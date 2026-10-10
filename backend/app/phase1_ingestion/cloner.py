import os
import re
import git
import shutil
import logging
from pathlib import Path
from typing import Tuple, Dict, Any, Optional

logger = logging.getLogger(__name__)

CACHE_DIR = Path(os.environ.get("CLONED_REPOS_DIR", str(Path(__file__).resolve().parent.parent.parent / "cloned_repos")))

class RepoCloner:
    def __init__(self, storage_dir: Optional[Path] = None):
        self.storage_dir = storage_dir or CACHE_DIR
        self.storage_dir.mkdir(parents=True, exist_ok=True)

    @staticmethod
    def sanitize_repo_name(url_or_path: str) -> str:
        # e.g. https://github.com/user/project.git -> user_project
        cleaned = url_or_path.strip().rstrip("/")
        if cleaned.endswith(".git"):
            cleaned = cleaned[:-4]
        match = re.search(r"[:/]([^/:]+)/([^/:]+)$", cleaned)
        if match:
            return f"{match.group(1)}_{match.group(2)}"
        return re.sub(r'[^a-zA-Z0-9_\-]', '_', Path(cleaned).name)

    def normalize_url(self, repo_url_or_path: str) -> str:
        url = repo_url_or_path.strip()
        local_candidate = Path(url)
        if local_candidate.exists():
            return url
        if url.startswith("gh_"):
            # Format: gh_Owner_Repo -> https://github.com/Owner/Repo.git
            parts = url[3:].split("_", 1)
            if len(parts) == 2:
                return f"https://github.com/{parts[0]}/{parts[1]}.git"
        if not url.startswith("http://") and not url.startswith("https://") and not url.startswith("git@"):
            if url.startswith("github.com/"):
                url = f"https://{url}"
            elif url.startswith("gitlab.com/"):
                url = f"https://{url}"
            elif "/" in url and not url.startswith(".") and not url.startswith("/"):
                url = f"https://github.com/{url}"
        if not url.endswith(".git") and (url.startswith("https://github.com") or url.startswith("https://gitlab.com")):
            url = f"{url}.git"
        return url

    def clone_or_load(self, repo_url_or_path: str, force_reclone: bool = False) -> Tuple[str, str, Dict[str, Any]]:
        """
        Accepts either a GitHub URL, shorthand (owner/repo), or a local repository path.
        Returns (repo_id, local_path, metadata)
        """
        normalized_url = self.normalize_url(repo_url_or_path)
        local_path_candidate = Path(repo_url_or_path.strip())

        if local_path_candidate.exists() and (local_path_candidate / ".git").exists():
            # It's an existing local repository!
            logger.info(f"Using local repository directly: {local_path_candidate}")
            repo_name = local_path_candidate.name
            repo_id = f"local_{self.sanitize_repo_name(str(local_path_candidate))}"
            repo = git.Repo(local_path_candidate)
            default_branch = repo.active_branch.name if not repo.head.is_detached else "main"
            return repo_id, str(local_path_candidate), {
                "name": repo_name,
                "url": repo_url_or_path,
                "default_branch": default_branch,
                "is_local": True
            }

        repo_name = self.sanitize_repo_name(normalized_url)
        repo_id = f"gh_{repo_name}"
        destination = self.storage_dir / repo_name

        if destination.exists():
            if force_reclone:
                logger.info(f"Removing existing directory {destination} for reclone")
                shutil.rmtree(destination, ignore_errors=True)
            else:
                logger.info(f"Repository already cloned at {destination}")
                try:
                    repo = git.Repo(destination)
                    default_branch = repo.active_branch.name if not repo.head.is_detached else "main"
                    return repo_id, str(destination), {
                        "name": repo_name,
                        "url": normalized_url,
                        "default_branch": default_branch,
                        "is_local": False
                    }
                except Exception as e:
                    logger.warning(f"Corrupted existing clone at {destination}, recloning... {e}")
                    shutil.rmtree(destination, ignore_errors=True)

        # Check for GitHub token in environment to support private repository ingestion
        clone_url = normalized_url
        gh_token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
        if gh_token and "github.com" in clone_url and "@" not in clone_url:
            clone_url = clone_url.replace("https://github.com", f"https://x-access-token:{gh_token}@github.com")

        logger.info(f"Cloning {normalized_url} into {destination} (shallow clone depth=30)...")
        git_env = {
            "GIT_TERMINAL_PROMPT": "0",
            "GIT_CONFIG_COUNT": "4",
            "GIT_CONFIG_KEY_0": "pack.windowMemory",
            "GIT_CONFIG_VALUE_0": "32m",
            "GIT_CONFIG_KEY_1": "pack.packSizeLimit",
            "GIT_CONFIG_VALUE_1": "64m",
            "GIT_CONFIG_KEY_2": "core.packedGitWindowSize",
            "GIT_CONFIG_VALUE_2": "16m",
            "GIT_CONFIG_KEY_3": "core.deltaBaseCacheLimit",
            "GIT_CONFIG_VALUE_3": "16m"
        }
        try:
            repo = git.Repo.clone_from(
                clone_url,
                destination,
                depth=30,
                single_branch=True,
                multi_options=["--no-tags"],
                env=git_env
            )
        except Exception as e:
            err_str = str(e)
            if any(term in err_str for term in ["could not read Username", "Repository not found", "Authentication failed", "404", "401", "403"]):
                shutil.rmtree(destination, ignore_errors=True)
                raise ValueError(
                    f"Repository '{repo_name}' is private or does not exist on GitHub. "
                    f"Please verify the repository URL or ensure the repository is public."
                )

            logger.info(f"Shallow clone depth=30 failed ({e}), cleaning destination and attempting bounded depth=50 fallback...")
            shutil.rmtree(destination, ignore_errors=True)
            try:
                repo = git.Repo.clone_from(
                    clone_url,
                    destination,
                    depth=50,
                    single_branch=True,
                    multi_options=["--no-tags"],
                    env=git_env
                )
            except Exception as e2:
                shutil.rmtree(destination, ignore_errors=True)
                err2_str = str(e2)
                if any(term in err2_str for term in ["could not read Username", "Repository not found", "Authentication failed", "404", "401", "403"]):
                    raise ValueError(
                        f"Repository '{repo_name}' is private or does not exist on GitHub. "
                        f"Please verify the repository URL or ensure the repository is public."
                    )
                raise RuntimeError(f"Failed to clone repository '{repo_name}': {e2}")
        default_branch = repo.active_branch.name if not repo.head.is_detached else "main"

        return repo_id, str(destination), {
            "name": repo_name,
            "url": normalized_url,
            "default_branch": default_branch,
            "is_local": False
        }
