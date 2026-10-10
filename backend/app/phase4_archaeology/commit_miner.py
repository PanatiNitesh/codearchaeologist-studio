import os
import re
import gc
import git
import json
import logging
from datetime import datetime
from typing import List, Dict, Any, Optional
from backend.app.models.schemas import CommitRecord, CommitCategory
from backend.app.models.database import db
from backend.app.phase4_archaeology.commit_classifier import CommitClassifier

logger = logging.getLogger(__name__)

class CommitMiner:
    def __init__(self):
        self.classifier = CommitClassifier()

    def mine_commits(self, repo_id: str, repo_path: str, max_commits: Optional[int] = 100) -> List[CommitRecord]:
        """
        Extracts historical git commits, changes, rename events, and categorizes intent.
        Strictly capped to keep peak RAM well below Render's 512MB ceiling.
        """
        try:
            repo = git.Repo(repo_path)
        except Exception as e:
            logger.error(f"Failed to open repo at {repo_path}: {e}")
            return []

        commits = []
        is_render = os.environ.get("RENDER", "").lower() == "true"
        effective_max = 35 if is_render else min(max_commits or 60, 60)

        # 1. Batch extract commit headers, changed files, and rename statuses in a single git log call
        parsed_commits: List[Dict[str, Any]] = []
        try:
            log_output = repo.git.log(
                '-n', str(effective_max),
                '--name-status', '-M',
                '--pretty=format:COMMIT:%H|%an|%ae|%at|%s'
            )
            curr = None
            for line in log_output.splitlines():
                line = line.strip()
                if not line:
                    continue
                if line.startswith("COMMIT:"):
                    parts = line[7:].split("|", 4)
                    curr = {
                        "hexsha": parts[0],
                        "author": parts[1] if len(parts) > 1 and parts[1] else "Unknown",
                        "email": parts[2] if len(parts) > 2 else "",
                        "timestamp": int(parts[3]) if len(parts) > 3 and parts[3].isdigit() else 0,
                        "message": parts[4] if len(parts) > 4 else "",
                        "changed_files": [],
                        "file_statuses": {}
                    }
                    parsed_commits.append(curr)
                elif curr:
                    tokens = line.split("\t")
                    code = tokens[0]
                    # Cap files per commit to 25 to protect RAM on massive merges/initial commits
                    if len(curr["changed_files"]) >= 25:
                        continue
                    if code.startswith("R") and len(tokens) >= 3:
                        old_p, new_p = tokens[1].replace("\\", "/"), tokens[2].replace("\\", "/")
                        curr["file_statuses"][new_p] = f"renamed_from:{old_p}"
                        curr["file_statuses"][old_p] = f"renamed_to:{new_p}"
                        if new_p not in curr["changed_files"]:
                            curr["changed_files"].append(new_p)
                        if old_p not in curr["changed_files"]:
                            curr["changed_files"].append(old_p)
                    elif code.startswith("A") and len(tokens) >= 2:
                        p = tokens[1].replace("\\", "/")
                        curr["file_statuses"][p] = "added"
                        if p not in curr["changed_files"]:
                            curr["changed_files"].append(p)
                    elif code.startswith("D") and len(tokens) >= 2:
                        p = tokens[1].replace("\\", "/")
                        curr["file_statuses"][p] = "deleted"
                        if p not in curr["changed_files"]:
                            curr["changed_files"].append(p)
                    elif len(tokens) >= 2:
                        p = tokens[1].replace("\\", "/")
                        curr["file_statuses"][p] = "modified"
                        if p not in curr["changed_files"]:
                            curr["changed_files"].append(p)
        except Exception as e:
            logger.warning(f"Failed to extract git log name-status: {e}")
            return []

        # 2. Batch extract line insertion/deletion stats in a single git log subprocess call
        stats_map = {}
        try:
            shortstat_output = repo.git.log('-n', str(effective_max), '--shortstat', '--pretty=format:COMMIT:%H')
            current_hash = None
            for line in shortstat_output.splitlines():
                line = line.strip()
                if line.startswith("COMMIT:"):
                    current_hash = line.split(":", 1)[1].strip()
                elif current_hash and "changed" in line:
                    m_ins = re.search(r'(\d+)\s+insertion', line)
                    m_del = re.search(r'(\d+)\s+deletion', line)
                    ins = int(m_ins.group(1)) if m_ins else 0
                    dels = int(m_del.group(1)) if m_del else 0
                    stats_map[current_hash] = (ins, dels)
        except Exception:
            pass

        for c_data in parsed_commits:
            hexsha = c_data["hexsha"]
            changed_files = c_data["changed_files"]
            file_statuses = c_data["file_statuses"]
            ts = c_data["timestamp"]
            dt = datetime.fromtimestamp(ts) if ts else datetime.now()
            date_str = dt.strftime("%Y-%m-%d %H:%M:%S")

            added, deleted = stats_map.get(hexsha, (len(changed_files) * 12, len(changed_files) * 4))
            category = self.classifier.classify_commit(c_data["message"], changed_files)

            record = CommitRecord(
                commit_id=hexsha,
                short_hash=hexsha[:7],
                author=c_data["author"],
                author_email=c_data["email"],
                date=date_str,
                timestamp=ts,
                message=c_data["message"].strip(),
                category=category,
                changed_files=changed_files,
                added_lines=added,
                deleted_lines=deleted,
                file_statuses=file_statuses
            )
            commits.append(record)

        self._save_commits_to_db(repo_id, commits)
        gc.collect()
        return commits

    def _save_commits_to_db(self, repo_id: str, commits: List[CommitRecord]):
        with db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
            INSERT OR IGNORE INTO repositories (id, name, path)
            VALUES (?, ?, ?)
            """, (repo_id, repo_id, ""))
            cursor.execute("DELETE FROM commits WHERE repo_id = ?", (repo_id,))
            cursor.execute("DELETE FROM commit_files WHERE repo_id = ?", (repo_id,))

            commit_rows = []
            file_rows = []

            for c in commits:
                commit_rows.append((
                    c.commit_id,
                    repo_id,
                    c.commit_id,
                    c.author,
                    c.author_email,
                    c.date,
                    c.timestamp,
                    c.message,
                    c.category.value,
                    c.added_lines,
                    c.deleted_lines,
                    json.dumps(c.changed_files)
                ))
                for f in c.changed_files:
                    status = c.file_statuses.get(f, "modified")
                    file_rows.append((repo_id, c.commit_id, f, status))

            cursor.executemany("""
            INSERT OR REPLACE INTO commits (id, repo_id, hash, author, email, date_str, timestamp, message, category, added_lines, deleted_lines, changed_files_json)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, commit_rows)

            cursor.executemany("""
            INSERT INTO commit_files (repo_id, commit_id, file_path, status)
            VALUES (?, ?, ?, ?)
            """, file_rows)

            conn.commit()
