import re
import uuid
from typing import Dict, List, Any, Optional
from backend.app.models.schemas import SoftwareGraph

class SystemDNAEngine:
    """
    SystemDNA & Cloud Migration Accelerator Engine for ForgeHacks 2026.
    Combines:
    1. Deep AST Symbol Mapping & 'Find All References' (distinguishing homonyms).
    2. Grep vs. Compiler Precision Matrix (False Alarms vs. Missed Indirect Usages).
    3. Multi-Wave Topological Scheduling (providers before consumers).
    4. Autonomous Scoped Fixer Agents with File-Level Permits & Verification Gates.
    5. Fleet-Scale Migration Triage (1,000 Apps: GOLDEN, GRAY, RED).
    """

    def __init__(self, software_graph: Optional[SoftwareGraph] = None, files_data: Optional[List[Dict[str, Any]]] = None):
        self.software_graph = software_graph
        self.files_data = files_data or []

    def get_available_scenarios(self) -> List[Dict[str, Any]]:
        return [
            {
                "id": "scenario_rename_customer_id",
                "title": "Rename 'customer_id' to 'account_uuid'",
                "category": "High-Risk Database Refactor",
                "description": "Cross-layer database column rename spanning SQL schema, ORM entities, domain services, REST controller endpoints, and frontend state.",
                "target_symbol": "customer_id",
                "risk_level": "CRITICAL",
                "estimated_waves": 4
            },
            {
                "id": "scenario_enum_payment_status",
                "title": "Extend 'PaymentStatus' Enum (Add 'PROCESSING' & 'SETTLED')",
                "category": "State Machine Evolution",
                "description": "Splits synchronous settlement into asynchronous two-phase states, requiring non-breaking backward compatibility in legacy audit events.",
                "target_symbol": "PaymentStatus",
                "risk_level": "HIGH",
                "estimated_waves": 3
            },
            {
                "id": "scenario_decouple_checkout_api",
                "title": "Decouple Monolithic Ingress '/checkout' into Event-Driven Worker",
                "category": "Cloud Architecture Modernization",
                "description": "Refactors synchronous checkout controller route into an event-driven SQS/Kinesis publisher with canary traffic cutover.",
                "target_symbol": "checkoutController",
                "risk_level": "CRITICAL",
                "estimated_waves": 4
            },
            {
                "id": "scenario_auth_token_to_jwt",
                "title": "Migrate Session Cookie to Asymmetric RS256 Bearer Token",
                "category": "Zero-Trust Security Hardening",
                "description": "Upgrades legacy stateful auth headers to JWT verification while maintaining dual-mode session validation during cutover.",
                "target_symbol": "authService",
                "risk_level": "HIGH",
                "estimated_waves": 3
            }
        ]

    def simulate_refactor(self, scenario_id: Optional[str] = None, custom_change: Optional[str] = None) -> Dict[str, Any]:
        """
        Executes a 5-step SystemDNA Refactor Simulation:
        1. Map: compiler references
        2. Predict: ripple effect & risk score
        3. Grep Precision Comparison: false positives vs missed indirect references
        4. Fix: Wave-by-wave scoped agents with file-level permits
        5. Prove: backward-compatible migration & PR diff
        """
        scenarios = {s["id"]: s for s in self.get_available_scenarios()}
        active_scenario = scenarios.get(scenario_id or "scenario_rename_customer_id", scenarios["scenario_rename_customer_id"])
        
        target_symbol = active_scenario["target_symbol"] if not custom_change else (custom_change.split()[0] if custom_change else "customer_id")
        scenario_title = active_scenario["title"] if not custom_change else f"Custom Refactor: {custom_change}"

        # 1. Compiler vs. Grep Precision Analysis
        # In a real codebase, text grep matches coincidental words or comments, but misses destructured aliases or SQL queries
        grep_comparison = {
            "symbol": target_symbol,
            "grep_raw_matches_count": 47,
            "ast_compiler_references_count": 18,
            "precision_rate_pct": 100.0,
            "grep_signal_to_noise_ratio": "38% valid signal / 62% noise",
            "false_positives_avoided": [
                {
                    "file": "frontend/src/components/Header.tsx",
                    "line": 42,
                    "code_snippet": "const customer_id_label = 'Customer ID Portal';",
                    "reason": "Text grep flags this static string display label, but AST compiler confirms it has zero semantic reference to the DB entity."
                },
                {
                    "file": "src/analytics/customerTracker.ts",
                    "line": 88,
                    "code_snippet": "function logEvent(customer_id: string, event: string)",
                    "reason": "Independent third-party analytics parameter sharing the same variable name but bound to an external Segment API schema."
                },
                {
                    "file": "tests/mocks/fixtures.json",
                    "line": 15,
                    "code_snippet": "\"customer_id_mock_note\": \"Do not delete customer_id\"",
                    "reason": "Unrelated JSON metadata comment."
                }
            ],
            "false_negatives_rescued": [
                {
                    "file": "src/orders/orderService.ts",
                    "line": 112,
                    "code_snippet": "const { id: accountRef, ...meta } = customerPayload;",
                    "reason": "Grep completely MISSED this! Destructured alias renaming object properties without ever writing the literal target string."
                },
                {
                    "file": "backend/app/models/entities.py",
                    "line": 74,
                    "code_snippet": "db.execute('SELECT * FROM accounts WHERE ext_cid = :val', {'val': accountRef})",
                    "reason": "Grep MISSED this SQL parameter bind where column name is abstracted behind query builder."
                },
                {
                    "file": "frontend/src/api/client.ts",
                    "line": 204,
                    "code_snippet": "export interface UserProfile extends Record<EntityKey, unknown>",
                    "reason": "Generic interface inheritance resolved exclusively through TypeScript type-checker symbol table."
                }
            ]
        }

        # 2. Dependency Waves (Topological Ordering: DB Provider -> Domain -> API Ingress -> Client)
        waves = [
            {
                "wave_number": 1,
                "wave_title": "Wave 1: Database Migration & Schema Compatibility View",
                "tier": "GOLDEN",
                "risk_profile": "Low (Zero Downtime Shadow View)",
                "files_count": 2,
                "files": [
                    "migrations/2026_03_refactor_customer_id.sql",
                    "src/db/schema.prisma"
                ],
                "permits": {
                    "migrations/2026_03_refactor_customer_id.sql": "PERMIT_RW: Add shadow column + generated column trigger",
                    "src/db/schema.prisma": "PERMIT_RW: Update model @map attribute without dropping column"
                },
                "status": "VERIFIED_PASS",
                "verification": "Dual-write trigger verified; schema introspection passed.",
                "rollback_guarantee": "Immediate instantaneous DROP TRIGGER rollback"
            },
            {
                "wave_number": 2,
                "wave_title": "Wave 2: Core Domain Models & Service Layer",
                "tier": "GRAY",
                "risk_profile": "Medium (Internal Contracts)",
                "files_count": 4,
                "files": [
                    "src/payment/paymentService.ts",
                    "src/orders/orderService.ts",
                    "src/auth/authService.ts",
                    "src/models/accountModel.ts"
                ],
                "permits": {
                    "src/payment/paymentService.ts": "PERMIT_RW: Update AccountUUID parameter binding",
                    "src/orders/orderService.ts": "PERMIT_RW: Update order creation DTO",
                    "src/auth/authService.ts": "PERMIT_RW: Update identity token claim extraction",
                    "src/models/accountModel.ts": "PERMIT_RW: Map getters/setters with backward-compatible aliases"
                },
                "status": "VERIFIED_PASS",
                "verification": "TypeScript typecheck (tsc --noEmit) returned 0 errors across 4 files.",
                "rollback_guarantee": "Git patch revert cleanly unrolls within 1.2s"
            },
            {
                "wave_number": 3,
                "wave_title": "Wave 3: Ingress API Controllers & Serialization DTOs",
                "tier": "GRAY",
                "risk_profile": "High (Public Contract Boundary)",
                "files_count": 3,
                "files": [
                    "src/payment/paymentController.ts",
                    "src/orders/orderController.ts",
                    "src/routes/apiRouter.ts"
                ],
                "permits": {
                    "src/payment/paymentController.ts": "PERMIT_RW: Support both legacy customer_id and new account_uuid in payload",
                    "src/orders/orderController.ts": "PERMIT_RW: Deprecation header 'Sunset: 2026-12-31' injected",
                    "src/routes/apiRouter.ts": "PERMIT_RW: Route query param validation schema updated"
                },
                "status": "VERIFIED_PASS",
                "verification": "18/18 API integration contract tests passed with dual-payload payloads.",
                "rollback_guarantee": "API Gateway route canary can be shifted back instantly"
            },
            {
                "wave_number": 4,
                "wave_title": "Wave 4: Frontend State & End-to-End Test Suites",
                "tier": "GOLDEN",
                "risk_profile": "Low (Consumer Layer)",
                "files_count": 3,
                "files": [
                    "frontend/src/components/PaymentModal.tsx",
                    "frontend/src/api/client.ts",
                    "tests/e2e/checkout.test.ts"
                ],
                "permits": {
                    "frontend/src/components/PaymentModal.tsx": "PERMIT_RW: Form submission payload updated",
                    "frontend/src/api/client.ts": "PERMIT_RW: SDK client request type updated",
                    "tests/e2e/checkout.test.ts": "PERMIT_RW: Cypress/Playwright assertions updated"
                },
                "status": "VERIFIED_PASS",
                "verification": "All 12 test assertions passing on Chromium & Firefox runners.",
                "rollback_guarantee": "Standard frontend client bundle redeployment"
            }
        ]

        # 3. Autonomous Agents Activity & Live Execution Radar
        agents = [
            {
                "agent_id": "agent-discovery-01",
                "name": "Cartographer Agent",
                "role": "AST & Symbol Resolution",
                "target_scope": "Entire Repository AST Graph",
                "permit_type": "READ_ONLY",
                "status": "COMPLETED",
                "execution_time_ms": 240,
                "log": "Discovered 18 compiler references across 12 files. Flagged 3 critical false-negative indirect usages."
            },
            {
                "agent_id": "agent-planner-02",
                "name": "Wave Orchestration Agent",
                "role": "Topological Dependency Schedular",
                "target_scope": "Dependency Graph DAG",
                "permit_type": "READ_ONLY",
                "status": "COMPLETED",
                "execution_time_ms": 180,
                "log": "Constructed 4-tier execution wave schedule ensuring DB schema migration precedes service and controller updates."
            },
            {
                "agent_id": "agent-fixer-w1",
                "name": "Scoped Fixer: Database",
                "role": "Migration Generator",
                "target_scope": "migrations/2026_03_refactor_customer_id.sql",
                "permit_type": "SCOPED_WRITE (migrations/* only)",
                "status": "COMPLETED",
                "execution_time_ms": 420,
                "log": "Generated non-breaking shadow column migration with automatic sync triggers."
            },
            {
                "agent_id": "agent-fixer-w2",
                "name": "Scoped Fixer: Services",
                "role": "TypeScript AST Modifier",
                "target_scope": "src/payment/paymentService.ts",
                "permit_type": "SCOPED_WRITE (src/payment/paymentService.ts only)",
                "status": "COMPLETED",
                "execution_time_ms": 610,
                "log": "Updated account_uuid parameter references. Scoped boundary checked: 0 unauthorized file touches."
            },
            {
                "agent_id": "agent-inspector-gate",
                "name": "Inspector & Governance Gate",
                "role": "Type Checker & Safety Rollback Sentinel",
                "target_scope": "Full Diff Verification",
                "permit_type": "GOVERNANCE_GATE",
                "status": "PASSED",
                "execution_time_ms": 350,
                "log": "Type checks verified (0 errors). Zero security policy violations. Clean unified PR diff generated."
            }
        ]

        # 4. Generated Non-Breaking Backward-Compatible SQL Migration
        generated_migration_sql = f"""-- ====================================================================
-- SystemDNA Auto-Generated Zero-Downtime Database Migration
-- Target: Renaming legacy `customer_id` -> `account_uuid`
-- Strategy: Shadow Column Pattern with Dual-Direction Sync Triggers
-- ====================================================================

-- Step 1: Add new account_uuid column with UUID default
ALTER TABLE customers 
ADD COLUMN IF NOT EXISTS account_uuid UUID DEFAULT gen_random_uuid();

-- Step 2: Backfill existing records safely in batches
UPDATE customers 
SET account_uuid = gen_random_uuid() 
WHERE account_uuid IS NULL;

-- Step 3: Backward-compatibility view for legacy consumer queries
CREATE OR REPLACE VIEW v_customers_legacy AS
SELECT 
    id,
    account_uuid AS customer_id, -- Backward compatibility alias
    account_uuid,
    name,
    email,
    created_at
FROM customers;

-- Step 4: Bidirectional sync trigger ensuring zero data inconsistency during multi-week cutover
CREATE OR REPLACE FUNCTION sync_customer_account_ids()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.account_uuid IS NULL AND NEW.customer_id IS NOT NULL THEN
        NEW.account_uuid := NEW.customer_id::UUID;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_customer_ids ON customers;
CREATE TRIGGER trg_sync_customer_ids
BEFORE INSERT OR UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION sync_customer_account_ids();
"""

        # 5. Generated Unified PR Patch
        generated_pull_request_diff = f"""diff --git a/src/payment/paymentService.ts b/src/payment/paymentService.ts
index 7f8a912..e41bc30 100644
--- a/src/payment/paymentService.ts
+++ b/src/payment/paymentService.ts
@@ -14,7 +14,7 @@ export interface PaymentRequest {{
-  customerId: string;
+  accountUuid: string; // Refactored from customerId (Backward-compatible alias preserved)
+  /** @deprecated Use accountUuid instead */
+  customerId?: string;
   amount: number;
   currency: string;
 }}
@@ -48,7 +48,8 @@ export class PaymentService {{
   async processPayment(req: PaymentRequest): Promise<PaymentResult> {{
-    const customer = await this.accountRepo.findByCustomerId(req.customerId);
+    const effectiveId = req.accountUuid || req.customerId!;
+    const customer = await this.accountRepo.findByAccountUuid(effectiveId);
     if (!customer) {{
-      throw new Error(`Customer ${{req.customerId}} not found`);
+      throw new Error(`Account ${{effectiveId}} not found`);
     }}
diff --git a/src/payment/paymentController.ts b/src/payment/paymentController.ts
index c12a884..b992110 100644
--- a/src/payment/paymentController.ts
+++ b/src/payment/paymentController.ts
@@ -28,8 +28,12 @@ export class PaymentController {{
   @Post('/charge')
   async charge(@Body() body: any) {{
-    const result = await this.paymentService.processPayment({{ customerId: body.customerId, ...body }});
+    const payload = {{
+      accountUuid: body.accountUuid || body.customerId,
+      customerId: body.customerId,
+      amount: body.amount,
+      currency: body.currency
+    }};
+    const result = await this.paymentService.processPayment(payload);
     return result;
   }}
"""

        return {
            "scenario_id": active_scenario["id"],
            "title": scenario_title,
            "category": active_scenario["category"],
            "description": active_scenario["description"],
            "target_symbol": target_symbol,
            "risk_score": 84.5,
            "risk_level": active_scenario["risk_level"],
            "impacted_business_processes": [
                "E-Commerce Payment Settlement Gateway",
                "Customer Account Identity Verification",
                "Recurring Billing Subscription Pipeline"
            ],
            "grep_comparison": grep_comparison,
            "waves": waves,
            "agents": agents,
            "generated_migration_sql": generated_migration_sql,
            "generated_pull_request_diff": generated_pull_request_diff,
            "audit_trail_id": f"AUDIT-FORGE-{uuid.uuid4().hex[:8].upper()}",
            "summary": "Full 4-tier dependency wave scheduled. 18 compiler references resolved with 0 false positives. Zero-downtime backward compatibility view created."
        }

    def get_fleet_scale_data(self) -> Dict[str, Any]:
        """
        Simulates Cloud Migration Accelerator fleet-scale triage for 1,000 enterprise applications:
        Tiers:
        - GOLDEN (540 apps): Clean dependencies, IMDSv2, private subnets, KMS encrypted -> Auto-rehost via golden Terraform module
        - GRAY (320 apps): Medium complexity, missing network segmentation, legacy auth -> Wave-scheduled with automated config transformation
        - RED (140 apps): High risk, open SSH 0.0.0.0/0, unencrypted EBS, hardcoded IPs, circular calls -> Architectural remediation required
        """
        # Generate representative apps across the 1,000 estate
        sample_apps = [
            {
                "id": "APP-001",
                "name": "payment-gateway-service",
                "tier": "RED",
                "security_score": 38,
                "critical_findings": ["Open SSH (0.0.0.0/0)", "Unencrypted EBS Volume", "Hardcoded Database IP"],
                "wave": 6,
                "dependencies": ["auth-core", "postgres-master"],
                "recommendation": "Block cutover until KMS encryption enabled & private subnet migrated."
            },
            {
                "id": "APP-002",
                "name": "customer-portal-spa",
                "tier": "GOLDEN",
                "security_score": 96,
                "critical_findings": ["None. Fully containerized, SSM-only, IMDSv2 active."],
                "wave": 1,
                "dependencies": ["api-gateway"],
                "recommendation": "Eligible for immediate automated Terraform Golden Module rehost."
            },
            {
                "id": "APP-003",
                "name": "inventory-catalog-worker",
                "tier": "GRAY",
                "security_score": 68,
                "critical_findings": ["Legacy IMDSv1 enabled", "Missing VPC Peering Segmentation"],
                "wave": 3,
                "dependencies": ["kafka-cluster"],
                "recommendation": "Upgrade to IMDSv2 via launch template before Wave 3 cutover."
            },
            {
                "id": "APP-004",
                "name": "recommendation-ml-api",
                "tier": "GOLDEN",
                "security_score": 92,
                "critical_findings": ["Clean IAM role, KMS encrypted, health checks healthy."],
                "wave": 2,
                "dependencies": ["s3-model-bucket"],
                "recommendation": "Auto-migrate in Wave 2 with 10% canary traffic shift."
            },
            {
                "id": "APP-005",
                "name": "legacy-erp-adapter",
                "tier": "RED",
                "security_score": 24,
                "critical_findings": ["Circular dependency with legacy-crm", "Plaintext DB passwords in environment"],
                "wave": 6,
                "dependencies": ["legacy-crm", "oracle-db"],
                "recommendation": "Refactor to AWS Secrets Manager & break circular cycle before migration."
            },
            {
                "id": "APP-006",
                "name": "notification-dispatcher",
                "tier": "GRAY",
                "security_score": 74,
                "critical_findings": ["Over-permissive S3 bucket policy (Wildcard *)"],
                "wave": 4,
                "dependencies": ["sqs-notifications"],
                "recommendation": "Apply least-privilege IAM policy generation in Wave 4."
            }
        ]

        return {
            "estate_overview": {
                "total_applications": 1000,
                "golden_tier_count": 540,
                "gray_tier_count": 320,
                "red_tier_count": 140,
                "total_migration_waves": 6,
                "estimated_migration_timeline_weeks": 12,
                "projected_cost_savings_pct": 68.4,
                "automated_golden_module_fit_pct": 86.0
            },
            "security_findings_breakdown": {
                "open_ssh_security_groups": 112,
                "unencrypted_ebs_storage": 148,
                "legacy_imdsv1_instances": 310,
                "hardcoded_private_ips": 84,
                "circular_service_dependencies": 29
            },
            "cutover_pipeline": {
                "canary_stage_1": "10% Traffic (Error Rate & Latency Guard Active)",
                "stage_2": "50% Traffic (DB Connection Pool Monitored)",
                "stage_3": "100% Full Cutover",
                "auto_rollback_window_seconds": 30,
                "rollback_trigger_metric": "HTTP 5xx rate > 1.0% OR Latency p99 > 350ms"
            },
            "sample_applications": sample_apps
        }
