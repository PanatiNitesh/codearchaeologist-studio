import pytest
from backend.app.phase8_modernization.systemdna_engine import SystemDNAEngine

def test_systemdna_scenarios_available():
    engine = SystemDNAEngine()
    scenarios = engine.get_available_scenarios()
    assert len(scenarios) >= 4
    scenario_ids = [s["id"] for s in scenarios]
    assert "scenario_rename_customer_id" in scenario_ids
    assert "scenario_enum_payment_status" in scenario_ids

def test_systemdna_simulation_precision_matrix():
    engine = SystemDNAEngine()
    result = engine.simulate_refactor("scenario_rename_customer_id")
    
    assert result["risk_score"] > 80.0
    assert result["target_symbol"] == "customer_id"
    
    # Verify Grep vs AST Precision Matrix
    grep = result["grep_comparison"]
    assert grep["grep_raw_matches_count"] > grep["ast_compiler_references_count"]
    assert grep["precision_rate_pct"] == 100.0
    assert len(grep["false_positives_avoided"]) >= 2
    assert len(grep["false_negatives_rescued"]) >= 2

def test_systemdna_waves_topological_guarantee():
    engine = SystemDNAEngine()
    result = engine.simulate_refactor("scenario_rename_customer_id")
    
    waves = result["waves"]
    assert len(waves) == 4
    
    # Wave 1 must be Database migration (provider before consumer)
    assert waves[0]["wave_number"] == 1
    assert "Database" in waves[0]["wave_title"]
    assert "migrations/" in waves[0]["files"][0]
    
    # Wave 4 must be Frontend / Consumer
    assert waves[3]["wave_number"] == 4
    assert "Frontend" in waves[3]["wave_title"]

def test_systemdna_scoped_permits_and_agents():
    engine = SystemDNAEngine()
    result = engine.simulate_refactor("scenario_rename_customer_id")
    
    agents = result["agents"]
    assert len(agents) >= 4
    
    # Ensure Cartographer, Planner, Scoped Fixer, and Inspector are present
    roles = [ag["role"] for ag in agents]
    assert any("Symbol Resolution" in r for r in roles)
    assert any("Topological" in r for r in roles)
    assert any("Safety Rollback Sentinel" in r for r in roles)

def test_systemdna_backward_compatible_sql():
    engine = SystemDNAEngine()
    result = engine.simulate_refactor("scenario_rename_customer_id")
    
    sql = result["generated_migration_sql"]
    assert "ALTER TABLE customers" in sql
    assert "account_uuid" in sql
    assert "CREATE OR REPLACE VIEW" in sql # Backward-compatible legacy view
    assert "TRIGGER" in sql # Bidirectional synchronization trigger

def test_cloud_migration_fleet_scale_1000_apps():
    engine = SystemDNAEngine()
    fleet = engine.get_fleet_scale_data()
    
    overview = fleet["estate_overview"]
    assert overview["total_applications"] == 1000
    assert overview["golden_tier_count"] == 540
    assert overview["gray_tier_count"] == 320
    assert overview["red_tier_count"] == 140
    
    # Tiers must sum to 1000
    assert overview["golden_tier_count"] + overview["gray_tier_count"] + overview["red_tier_count"] == 1000
    
    # Cutover canary stages
    cutover = fleet["cutover_pipeline"]
    assert cutover["auto_rollback_window_seconds"] == 30
    assert "10%" in cutover["canary_stage_1"]
    assert "100%" in cutover["stage_3"]
