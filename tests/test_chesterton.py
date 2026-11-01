import pytest
from backend.app.phase4_archaeology.chesterton_engine import ChestertonFenceEngine
from backend.app.models.schemas import CommitRecord, CommitCategory

def test_chesterton_fence_score_calculation():
    files = [
        {"path": "src/legacy/oldAuth.ts", "component_type": "Service"},
        {"path": "tests/test_auth.py", "component_type": "Test"}
    ]
    commits = [
        CommitRecord(
            commit_id="c1",
            short_hash="c1a2b3",
            author="Departed Engineer",
            author_email="departed@old.com",
            date="2022-01-01",
            timestamp=1640995200,
            message="Initial legacy auth module (#101)",
            category=CommitCategory.FEATURE,
            changed_files=["src/legacy/oldAuth.ts"],
            added_lines=50,
            deleted_lines=0
        ),
        CommitRecord(
            commit_id="c2",
            short_hash="c2d3e4",
            author="Active Maintainer",
            author_email="active@now.com",
            date="2026-03-01",
            timestamp=1772323200,
            message="Update active system",
            category=CommitCategory.REFACTOR,
            changed_files=["src/other/system.ts"],
            added_lines=10,
            deleted_lines=2
        )
    ]

    engine = ChestertonFenceEngine(commits, files)
    fence = engine.calculate_fence_score("src/legacy/oldAuth.ts")

    assert fence["chesterton_score"] > 50.0
    assert "FENCE" in fence["risk_verdict"]
    assert fence["factors"]["total_authors"] == 1
    assert "Departed Engineer" in fence["factors"]["departed_authors"]


def test_knowledge_loss_orphan_detection():
    files = [
        {"path": "src/zombie/orphan.ts", "component_type": "Service"},
        {"path": "src/active/active.ts", "component_type": "Controller"}
    ]
    commits = [
        CommitRecord(
            commit_id="c1",
            short_hash="c111",
            author="Past Contributor",
            author_email="past@corp.com",
            date="2022-06-01",
            timestamp=1654041600,
            message="Create zombie module",
            category=CommitCategory.FEATURE,
            changed_files=["src/zombie/orphan.ts"],
            added_lines=100,
            deleted_lines=0
        ),
        CommitRecord(
            commit_id="c2",
            short_hash="c222",
            author="Current Dev",
            author_email="current@corp.com",
            date="2026-04-01",
            timestamp=1775001600,
            message="Modernize active component",
            category=CommitCategory.REFACTOR,
            changed_files=["src/active/active.ts"],
            added_lines=20,
            deleted_lines=5
        )
    ]

    engine = ChestertonFenceEngine(commits, files)
    kl_map = engine.get_knowledge_loss_map()

    assert kl_map["orphan_files_count"] >= 1
    orphan = next(o for o in kl_map["orphan_modules"] if "orphan.ts" in o["file"])
    assert orphan["knowledge_loss_pct"] == 100
    assert orphan["bus_factor_status"] == "ORPHAN_ZERO_KNOWLEDGE"


def test_decision_provenance():
    files = [{"path": "src/auth/jwt.ts", "component_type": "Service"}]
    commits = [
        CommitRecord(
            commit_id="c1",
            short_hash="f1e2d3c",
            author="Sarah Chen",
            author_email="sarah@archaeo.io",
            date="2024-02-15",
            timestamp=1707955200,
            message="feat: migrate to RS256 JWT tokens (#412)",
            category=CommitCategory.FEATURE,
            changed_files=["src/auth/jwt.ts"],
            added_lines=45,
            deleted_lines=0
        )
    ]
    engine = ChestertonFenceEngine(commits, files)
    prov = engine.get_decision_provenance("src/auth/jwt.ts")

    assert prov["total_provenance_records"] == 1
    record = prov["milestones"][0]
    assert record["commit_hash"] == "f1e2d3c"
    assert record["pr_reference"] == "PR #412"
    assert record["grounding_status"] == "VERIFIED_GIT_IMMUTABLE"


def test_calibrated_blast_radius():
    files = [{"path": f"src/mod_{i}.ts"} for i in range(10)]
    commits = [
        CommitRecord(
            commit_id=f"c_{i}",
            short_hash=f"h_{i}",
            author="Dev",
            author_email="dev@archaeo.io",
            date="2023-01-01",
            timestamp=1672531200 + i * 86400,
            message=f"commit {i}",
            category=CommitCategory.FEATURE,
            changed_files=[f"src/mod_{i%4}.ts", f"src/mod_{(i+1)%4}.ts"],
            added_lines=10,
            deleted_lines=5
        )
        for i in range(12)
    ]
    engine = ChestertonFenceEngine(commits, files)
    res = engine.evaluate_calibrated_blast_radius()

    assert res["calibrated_model"] is not None
    assert res["precision_at_1"] > 0.6
    assert res["mean_reciprocal_rank_mrr"] > 0.6
    assert res["empirical_measurement"] is True
