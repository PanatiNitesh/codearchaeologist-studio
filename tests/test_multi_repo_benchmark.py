import pytest
from backend.app.phase7_evaluation.multi_repo_benchmark import MultiRepoBlastBenchmark
from fastapi.testclient import TestClient
from backend.app.main import app

def test_multi_repo_blast_benchmark_runs():
    bench = MultiRepoBlastBenchmark()
    res = bench.run_benchmark(max_commits_per_repo=3)
    
    assert res["repositories_evaluated"] >= 1
    assert "macro_metrics" in res
    assert "precision" in res["macro_metrics"]
    assert "recall" in res["macro_metrics"]
    assert "f1_score" in res["macro_metrics"]
    assert len(res["per_repository"]) >= 1

def test_api_multi_repo_benchmark_endpoint():
    client = TestClient(app)
    response = client.get("/api/benchmark/multi-repo?commits_per_repo=2")
    assert response.status_code == 200
    data = response.json()
    assert data["repositories_evaluated"] >= 1
    assert "macro_metrics" in data
    assert "summary" in data

