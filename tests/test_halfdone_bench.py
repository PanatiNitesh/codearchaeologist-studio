import pytest
from backend.app.phase7_evaluation.halfdone_bench import HalfDoneBenchEvaluator
from backend.app.models.schemas import CommitRecord, CommitCategory

def test_halfdone_bench_evaluation():
    files = [
        {"path": "src/payment/processor.ts", "content": "export function pay(id: string) { return id; }"},
        {"path": "src/orders/checkout.ts", "content": "export function checkout(id: string) { return id; }"}
    ]
    commits = [
        CommitRecord(
            commit_id="c_1",
            short_hash="h123",
            author="Dev",
            author_email="dev@co.io",
            date="2024-01-01",
            timestamp=1704067200,
            message="refactor: rename id across payment and checkout",
            category=CommitCategory.REFACTOR,
            changed_files=["src/payment/processor.ts", "src/orders/checkout.ts"],
            added_lines=10,
            deleted_lines=10
        )
    ]
    evaluator = HalfDoneBenchEvaluator("d:/hackproject/CodeArchaeologist", files, commits)
    bench_results = evaluator.run_benchmark(max_tasks=1)

    assert bench_results["benchmark_name"].startswith("HalfDone-Bench")
    assert bench_results["evaluated_tasks_count"] >= 1
    assert bench_results["mean_precision"] > 0.6
    assert bench_results["mean_recall"] > 0.6
    assert bench_results["success_rate_pct"] > 50.0
