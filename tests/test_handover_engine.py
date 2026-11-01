import pytest
from backend.app.phase8_modernization.handover_engine import ShiftHandoverEngine

def test_handover_engine_real_git_wip():
    engine = ShiftHandoverEngine("d:/hackproject/CodeArchaeologist")
    git_info = engine.get_git_wip_diff()
    assert "diff" in git_info
    assert "source" in git_info

    briefing = engine.audit_wip()
    assert briefing.title.startswith("Shift Handover:")
    assert len(briefing.recommended_next_steps) > 0
    assert len(briefing.markdown_briefing) > 100


def test_handover_broken_caller_contract_flagging():
    """
    Simulates a WIP diff where a symbol 'verifySession' is renamed to 'verifyAuthToken',
    and downstream controller still calls 'verifySession'.
    The engine must flag the caller with CRITICAL/HIGH risk and generate a patch.
    """
    files = [
        {
            "path": "src/auth/authService.ts",
            "content": "export function verifyAuthToken(t: string) { return true; }",
            "component_type": "Service"
        },
        {
            "path": "src/controllers/authController.ts",
            "content": "export function login() { return verifySession('sample_token'); }",
            "component_type": "Controller"
        }
    ]

    sample_diff = """--- a/src/auth/authService.ts
+++ b/src/auth/authService.ts
@@ -1,1 +1,1 @@
-export function verifySession(t: string) { return true; }
+export function verifyAuthToken(t: string) { return true; }
"""

    engine = ShiftHandoverEngine("d:/hackproject/CodeArchaeologist", files_data=files)
    briefing = engine.audit_wip(custom_diff=sample_diff)

    assert len(briefing.incomplete_items) >= 1
    broken_item = next(i for i in briefing.incomplete_items if "authController.ts" in i.file)
    assert broken_item.risk == "CRITICAL"
    assert "verifySession" in broken_item.desc
    assert broken_item.patch_diff is not None


def test_handover_systematic_edit_inference():
    """
    Tests systematic edit rule inference (LASE / Getafix / Refazer algorithm).
    Extracts the transformation rule from diff and finds unapplied sites.
    """
    files = [
        {
            "path": "src/payment/processor.ts",
            "content": "function pay(account_uuid: string) { return account_uuid; }",
            "component_type": "Service"
        },
        {
            "path": "src/orders/checkout.ts",
            "content": "function checkout(customer_id: string) { return customer_id; }",
            "component_type": "Service"
        }
    ]

    rename_diff = """--- a/src/payment/processor.ts
+++ b/src/payment/processor.ts
@@ -1,1 +1,1 @@
-function pay(customer_id: string) { return customer_id; }
+function pay(account_uuid: string) { return account_uuid; }
"""

    engine = ShiftHandoverEngine("d:/hackproject/CodeArchaeologist", files_data=files)
    briefing = engine.audit_wip(custom_diff=rename_diff)

    assert len(briefing.systematic_edits) >= 1
    rule = briefing.systematic_edits[0]
    assert rule.antecedent_pattern == "customer_id"
    assert rule.consequent_pattern == "account_uuid"
    assert rule.pending_count >= 1
    assert any("checkout.ts" in s["file"] for s in rule.pending_sites)


def test_handover_authentic_scenarios_fallback():
    engine = ShiftHandoverEngine("d:/hackproject/CodeArchaeologist")
    atc_briefing = engine._build_authentic_scenario_briefing("atc_equipment_status")
    assert atc_briefing.domain == "Mission-Critical Aerospace"
    assert len(atc_briefing.completed_items) == 3
    assert len(atc_briefing.incomplete_items) == 3
    assert len(atc_briefing.safety_invariants) == 3

    # Check evidence and test status
    assert all(c.test_status == "VERIFIED" for c in atc_briefing.completed_items)
    assert any(i.risk == "CRITICAL" for i in atc_briefing.incomplete_items)
