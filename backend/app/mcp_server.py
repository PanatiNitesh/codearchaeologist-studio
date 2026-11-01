import os
import sys
import json
import logging
from typing import Dict, Any, List, Optional
from pathlib import Path

# Ensure workspace root is in sys.path
_repo_root = str(Path(__file__).resolve().parent.parent.parent)
if _repo_root not in sys.path:
    sys.path.insert(0, _repo_root)

# Use lightweight MCP protocol server
try:
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("CodeArchaeologist")
except ImportError:
    mcp = None

from backend.app.phase8_modernization.handover_engine import ShiftHandoverEngine
from backend.app.phase4_archaeology.chesterton_engine import ChestertonFenceEngine
from backend.app.phase2_ast.parser import CodeASTParser
from backend.app.phase1_ingestion.extractor import RepoExtractor

logger = logging.getLogger(__name__)

def _get_engine(repo_path: str) -> ShiftHandoverEngine:
    extractor = RepoExtractor(repo_path)
    raw_files = extractor.extract_files()
    parser = CodeASTParser()
    files_data = []
    for rf in raw_files:
        if rf["extension"] in {".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go"}:
            res = parser.parse_file(rf["rel_path"], rf["content"])
            res.update(rf)
            files_data.append(res)
    return ShiftHandoverEngine(repo_path, files_data=files_data)

if mcp:
    @mcp.tool()
    def get_shift_handover(repo_path: str = ".", scenario_id: Optional[str] = None) -> str:
        """
        Extracts uncommitted Git WIP or branch diffs, traces the AST call graph to flag callers
        that still invoke old contracts, and produces a 3-column Shift Handover briefing.
        """
        engine = _get_engine(repo_path)
        briefing = engine.audit_wip(scenario_id=scenario_id)
        return briefing.markdown_briefing

    @mcp.tool()
    def calculate_blast_radius(repo_path: str, target_file: str) -> str:
        """
        Calculates architectural blast radius and downstream callers for target_file.
        """
        engine = _get_engine(repo_path)
        fence_engine = ChestertonFenceEngine([], engine.files_data)
        fence = fence_engine.calculate_fence_score(target_file)
        return json.dumps(fence, indent=2)

    @mcp.tool()
    def get_chesterton_fence_score(repo_path: str, target_file: str) -> str:
        """
        Evaluates Chesterton's Fence score: quantifies the risk of deleting or refactoring
        code based on author departures, quiescence, change coupling, and test coverage.
        """
        engine = _get_engine(repo_path)
        fence_engine = ChestertonFenceEngine([], engine.files_data)
        return json.dumps(fence_engine.calculate_fence_score(target_file), indent=2)

    @mcp.tool()
    def mine_safety_invariants(repo_path: str, changed_files: List[str]) -> str:
        """
        Mines Daikon-style safety invariants from Git commits and checks if changed_files violate them.
        """
        engine = _get_engine(repo_path)
        invariants = engine.mine_invariants(changed_files)
        return json.dumps([inv.dict() for inv in invariants], indent=2)


def main():
    if mcp:
        mcp.run()
    else:
        print("MCP SDK not installed. Please install with: pip install mcp")

if __name__ == "__main__":
    main()
