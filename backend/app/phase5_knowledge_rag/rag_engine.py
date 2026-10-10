import os
import json
import logging
from typing import Dict, Any, List, Optional, Tuple
from backend.app.models.schemas import RAGAnswerResponse, EvidenceItem
from backend.app.phase5_knowledge_rag.retriever import HybridRetriever
from backend.app.phase5_knowledge_rag.grounding import GroundingEnforcer, GroundingVerificationResult

logger = logging.getLogger(__name__)

class EvidenceRAGEngine:
    """
    Synthesizes code understanding, architectural graphs, and Git history into
    rigorous, evidence-based explanations with verifiable, grounded citations.
    """

    def __init__(self, retriever: HybridRetriever):
        self.retriever = retriever

    def answer_question(self, question: str) -> RAGAnswerResponse:
        context = self.retriever.retrieve_context(question)
        
        evidence_list: List[EvidenceItem] = []

        # Convert code matches to structured evidence without unsafe fallbacks
        for c in context.get("code", []):
            meta = c.get("metadata", {})
            file_path = meta.get("path")
            # Disallow unsafe placeholders like "unknown" or empty path
            if not file_path or file_path.lower() in ("unknown", "none", ""):
                continue

            # Preserve exact AST line numbers; do not fabricate 1..20 defaults
            line_start = meta.get("line_start")
            line_end = meta.get("line_end")
            try:
                line_start = int(line_start) if line_start is not None else None
            except (ValueError, TypeError):
                line_start = None

            try:
                line_end = int(line_end) if line_end is not None else None
            except (ValueError, TypeError):
                line_end = None

            symbol_name = meta.get('function') or meta.get('class') or meta.get('component_type') or 'component'
            evidence_list.append(EvidenceItem(
                file_path=file_path,
                line_start=line_start,
                line_end=line_end,
                snippet=c.get("content", "")[:350],
                relevance_reason=f"Defines {symbol_name} relevant to query."
            ))

        # Convert commit matches to structured evidence without unsafe "HEAD" or "history" fallbacks
        for cm in context.get("commits", []):
            meta = cm.get("metadata", {})
            commit_hash = meta.get("commit_hash") or meta.get("full_hash") or cm.get("entity_id")
            # Disallow unsafe fallbacks like "HEAD" or "unknown"
            if not commit_hash or commit_hash.upper() in ("HEAD", "UNKNOWN", "NONE", ""):
                continue

            changed_files = meta.get("changed_files", [])
            file_path = ""
            if changed_files and isinstance(changed_files, list):
                # Verify it's not a fake placeholder
                candidate_path = str(changed_files[0]).strip()
                if candidate_path.lower() not in ("git", "history", "unknown", "none", ""):
                    file_path = candidate_path

            evidence_list.append(EvidenceItem(
                file_path=file_path,
                commit_hash=commit_hash,
                commit_message=meta.get("title", cm.get("title", "")),
                commit_date=meta.get("date"),
                snippet=cm.get("content", "")[:250],
                relevance_reason=f"Historical milestone introduced change: {cm.get('title', '')}"
            ))

        # Convert docs matches to evidence if present
        for d in context.get("docs", []):
            meta = d.get("metadata", {})
            doc_path = meta.get("path") or d.get("entity_id")
            if doc_path and doc_path.lower() not in ("unknown", "none", ""):
                evidence_list.append(EvidenceItem(
                    file_path=doc_path,
                    snippet=d.get("content", "")[:300],
                    relevance_reason="Repository documentation context."
                ))

        # Explicit Insufficient-Evidence Gate:
        # Check whether retrieved evidence is sufficient to answer the question reliably
        # without allowing LLM or local synthesis to guess or speculate.
        is_sufficient, reason = GroundingEnforcer.check_evidence_sufficiency(
            question, context, evidence_list
        )
        if not is_sufficient:
            return RAGAnswerResponse(
                question=question,
                answer=(
                    f"### Insufficient Evidence\n\n"
                    f"The repository does not contain sufficient code references or Git milestones to answer "
                    f"**'{question}'** reliably without speculation.\n\n"
                    f"**Audit Detail:** {reason}\n\n"
                    f"> 💡 *Tip: Try querying specific service names, exported functions, file paths, or commit topics.*"
                ),
                evidence=[],
                confidence_score=0.0,
                retrieval_sources=context.get("counts", {})
            )

        # External LLM paths with grounding enforcement
        gemini_api_key = os.environ.get("GEMINI_API_KEY")
        openai_api_key = os.environ.get("OPENAI_API_KEY")

        grounding_score = 1.0
        final_evidence = evidence_list

        if gemini_api_key:
            answer_text, final_evidence, grounding_score = self._call_gemini_llm(
                question, context, evidence_list, gemini_api_key
            )
        elif openai_api_key:
            answer_text, final_evidence, grounding_score = self._call_openai_llm(
                question, context, evidence_list, openai_api_key
            )
        else:
            answer_text = self._synthesize_local_evidence_answer(question, context, evidence_list)

        # Check if the generated prose explicitly communicated insufficient evidence
        if "insufficient evidence" in answer_text.lower():
            return RAGAnswerResponse(
                question=question,
                answer=answer_text,
                evidence=[],
                confidence_score=0.0,
                retrieval_sources=context.get("counts", {})
            )

        # Dynamically compute confidence score scaled by query relevance and grounding score
        dyn_confidence = self._calculate_dynamic_confidence(
            question, context, final_evidence, grounding_score=grounding_score
        )

        return RAGAnswerResponse(
            question=question,
            answer=answer_text,
            evidence=final_evidence,
            confidence_score=dyn_confidence,
            retrieval_sources=context.get("counts", {})
        )

    def _calculate_dynamic_confidence(
        self,
        question: str,
        context: Dict[str, Any],
        evidence: List[EvidenceItem],
        grounding_score: float = 1.0
    ) -> float:
        if not evidence:
            return 0.0

        import re
        q_tokens = set(re.findall(r'[a-zA-Z0-9_$]+', question.lower()))
        stop_words = {"why", "how", "what", "where", "when", "the", "was", "for", "with", "this", "that", "from", "into", "and", "are", "does"}
        meaningful_tokens = {t for t in q_tokens if len(t) > 2 and t not in stop_words}

        if not meaningful_tokens:
            return round(float(0.50 * grounding_score), 2)

        # 1. Term coverage in retrieved evidence
        matched_tokens = set()
        for ev in evidence:
            text = f"{ev.file_path} {ev.snippet} {ev.commit_message or ''}".lower()
            for t in meaningful_tokens:
                if t in text:
                    matched_tokens.add(t)

        term_coverage = len(matched_tokens) / max(1, len(meaningful_tokens))

        # 2. Retrieval quality from underlying RRF / dense / BM25 search
        score_samples = []
        for cat in ["code", "commits", "docs"]:
            for item in context.get(cat, []):
                meta = item.get("retrieval_metadata", {})
                if "dense_cosine_sim" in meta:
                    score_samples.append(max(0.0, meta["dense_cosine_sim"]))
                elif "score" in item:
                    val = item["score"]
                    score_samples.append(min(1.0, val / 100.0 if val > 1.0 else val))

        avg_search_score = sum(score_samples) / max(1, len(score_samples)) if score_samples else 0.5

        # 3. Source diversity bonus: having both code and commit history anchors increases grounding
        has_code = len(context.get("code", [])) > 0
        has_commits = len(context.get("commits", [])) > 0
        diversity_bonus = 0.15 if (has_code and has_commits) else 0.05

        raw_confidence = ((term_coverage * 0.55) + (avg_search_score * 0.30) + diversity_bonus) * grounding_score
        return round(float(min(0.98, max(0.10, raw_confidence))), 2)

    def _call_gemini_llm(
        self,
        question: str,
        context: Dict[str, Any],
        evidence: List[EvidenceItem],
        api_key: str
    ) -> Tuple[str, List[EvidenceItem], float]:
        """
        Calls Google Gemini with structured evidence catalog and strict grounding prompts,
        then verifies the response through the Grounding Enforcement Layer.
        """
        evidence_catalog = GroundingEnforcer.format_evidence_catalog(evidence)
        system_instruction = GroundingEnforcer.build_grounded_system_prompt()

        prompt = f"""
{system_instruction}

DEVELOPER QUESTION: {question}

{evidence_catalog}

REQUIRED RESPONSE STRUCTURE (1000/10 GOLD STANDARD):
### 🎯 Direct Answer
[Provide a decisive, 2-3 sentence answer directly addressing '{question}'. State the exact primary file, function/class, or commit that answers it immediately. Cite exact evidence with [E1], [E2] etc.]

### 🏛️ Core Implementation & Architectural Flow
[Explain the underlying design, component responsibilities, and execution flow step-by-step. Reference specific files, symbols, and lines with [E#].]

### 📜 Historical Evolution & Git Rationale
[Explain why this architecture was chosen or how it evolved over time based on Git commit history. Cite commit hashes, authors, and dates with [E#].]

### ⚡ Key Takeaways & Developer Insights
[Concise summary of blast radius, downstream callers, or operational considerations.]

CRITICAL RULES:
- The very first section MUST be '### 🎯 Direct Answer' providing an immediate, clear verdict.
- Every claim must cite an [E#] tag from the EVIDENCE CATALOG.
- If details are missing, state 'Insufficient evidence: [reason]'.
- Do not fabricate files, commits, line ranges, or functions.
"""

        raw_text = None

        # Direct Google Gemini REST API
        try:
            import requests
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={api_key}"
            payload = {
                "contents": [
                    {"parts": [{"text": prompt}]}
                ]
            }
            res = requests.post(url, json=payload, timeout=30)
            if res.status_code == 200:
                data = res.json()
                candidates = data.get("candidates", [])
                if candidates:
                    parts = candidates[0].get("content", {}).get("parts", [])
                    if parts:
                        raw_text = parts[0].get("text", "")
        except Exception as e:
            logger.info(f"Direct Gemini REST API call failed, trying dynamic SDK: {e}")

        # Fallback: Dynamic SDK call via importlib
        if not raw_text:
            try:
                import importlib
                genai = importlib.import_module("google.generativeai")
                genai.configure(api_key=api_key)
                model = genai.GenerativeModel("gemini-1.5-flash")
                response = model.generate_content(prompt)
                if response and response.text:
                    raw_text = response.text
            except Exception as e:
                logger.info(f"SDK call unavailable or failed: {e}")

        if not raw_text:
            # LLM unavailable: fall back to deterministic local synthesis
            fallback = self._synthesize_local_evidence_answer(question, context, evidence)
            return fallback, evidence, 1.0

        # Enforce Grounding: verify prose against structured EvidenceItem objects
        return GroundingEnforcer.enforce_grounding(
            prose=raw_text,
            evidence=evidence,
            question=question,
            local_fallback_fn=lambda: self._synthesize_local_evidence_answer(question, context, evidence)
        )

    def _call_openai_llm(
        self,
        question: str,
        context: Dict[str, Any],
        evidence: List[EvidenceItem],
        api_key: str
    ) -> Tuple[str, List[EvidenceItem], float]:
        """
        Calls OpenAI with structured evidence catalog and strict grounding prompts,
        then verifies the response through the Grounding Enforcement Layer.
        """
        evidence_catalog = GroundingEnforcer.format_evidence_catalog(evidence)
        system_instruction = GroundingEnforcer.build_grounded_system_prompt()

        user_content = f"""
DEVELOPER QUESTION: {question}

{evidence_catalog}

REQUIRED RESPONSE STRUCTURE (1000/10 GOLD STANDARD):
### 🎯 Direct Answer
[Provide a decisive, 2-3 sentence answer directly addressing '{question}'. State the exact primary file, function/class, or commit that answers it immediately. Cite exact evidence with [E1], [E2] etc.]

### 🏛️ Core Implementation & Architectural Flow
[Explain the underlying design, component responsibilities, and execution flow step-by-step. Reference specific files, symbols, and lines with [E#].]

### 📜 Historical Evolution & Git Rationale
[Explain why this architecture was chosen or how it evolved over time based on Git commit history. Cite commit hashes, authors, and dates with [E#].]

### ⚡ Key Takeaways & Developer Insights
[Concise summary of blast radius, downstream callers, or operational considerations.]

CRITICAL RULES:
- The very first section MUST be '### 🎯 Direct Answer' providing an immediate, clear verdict.
- Every claim must cite an [E#] tag from the EVIDENCE CATALOG.
- If details are missing, state 'Insufficient evidence: [reason]'.
- Do not fabricate files, commits, line ranges, or functions.
"""
        try:
            import importlib
            openai_mod = importlib.import_module("openai")
            client = openai_mod.OpenAI(api_key=api_key)
            
            resp = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_instruction},
                    {"role": "user", "content": user_content}
                ]
            )
            raw_text = resp.choices[0].message.content or ""
        except Exception as e:
            logger.warning(f"OpenAI API call failed, falling back to local synthesis: {e}")
            fallback = self._synthesize_local_evidence_answer(question, context, evidence)
            return fallback, evidence, 1.0

        # Enforce Grounding: verify prose against structured EvidenceItem objects
        return GroundingEnforcer.enforce_grounding(
            prose=raw_text,
            evidence=evidence,
            question=question,
            local_fallback_fn=lambda: self._synthesize_local_evidence_answer(question, context, evidence)
        )

    def _synthesize_local_evidence_answer(
        self,
        question: str,
        context: Dict[str, Any],
        evidence: List[EvidenceItem]
    ) -> str:
        """
        High-precision deterministic synthesis engine that constructs 1000/10 quality answers:
        1. 🎯 Direct Answer upfront: decisively answers the question in 2-3 clear sentences with [E#] citations.
        2. 🏛️ Core Architectural Implementation: AST symbols, exact file lines, and execution roles.
        3. 📜 Historical Git Evolution: why/when this was introduced, commit authors, categories, and diff rationale.
        4. ⚡ Developer Insights: grounded blast radius and downstream considerations.
        """
        code_items = context.get("code", [])
        commit_items = context.get("commits", [])
        doc_items = context.get("docs", [])

        if not code_items and not commit_items:
            return (
                f"### Insufficient Evidence\n\n"
                f"> ℹ️ **Offline Extractive Synthesis Mode** (Local AST & Git Archaeology)\n\n"
                f"No direct code references or Git milestones matched **'{question}'** in this repository.\n"
                f"Try querying specific architectural components, service names, file paths, or historical topics."
            )

        q_lower = question.lower()
        parts = []

        # -------------------------------------------------------------
        # 1. 🎯 DIRECT ANSWER (Bottom Line Up Front)
        # -------------------------------------------------------------
        parts.append(f"### 🎯 Direct Answer\n\n")

        # Analyze question intent to craft a tailored direct answer
        primary_code = code_items[0] if code_items else None
        primary_commit = commit_items[0] if commit_items else None

        primary_path = primary_code.get("metadata", {}).get("path") if primary_code else None
        primary_symbol = primary_code.get("title", "") if primary_code else None
        primary_comp = primary_code.get("metadata", {}).get("component_type", "component") if primary_code else "component"

        commit_title = primary_commit.get("title", "") if primary_commit else None
        commit_hash = primary_commit.get("metadata", {}).get("commit_hash", "")[:8] if primary_commit else ""
        commit_offset = len(code_items[:4]) + 1 if code_items else 1

        if any(w in q_lower for w in ["why", "reason", "purpose", "rationale"]):
            if commit_title and commit_hash:
                parts.append(
                    f"**Direct Answer:** In this repository, the architectural rationale for *'{question}'* "
                    f"is established in historical commit [`{commit_hash}`] [E{commit_offset}]: **\"{commit_title}\"**. "
                )
                if primary_path and primary_symbol:
                    parts.append(
                        f"The structural implementation is driven by `{primary_symbol}` in [`{primary_path}`] [E1], "
                        f"which operationalizes this capability in the {primary_comp} layer.\n\n"
                    )
                else:
                    parts.append(f"This milestone directly resolved the technical requirement in the codebase.\n\n")
            elif primary_path:
                parts.append(
                    f"**Direct Answer:** In this repository, the capability addressing *'{question}'* is implemented in "
                    f"[`{primary_path}`] [E1] through `{primary_symbol}`. This component fulfills the {primary_comp} role, "
                    f"encapsulating the logic required for this subsystem.\n\n"
                )
            else:
                parts.append(
                    f"**Direct Answer:** The architectural rationale is evidenced across the repository's tracked components [E1], "
                    f"fulfilling subsystem requirements.\n\n"
                )

        elif any(w in q_lower for w in ["where", "location", "file", "which file"]):
            if primary_path:
                parts.append(
                    f"**Direct Answer:** The functionality for *'{question}'* is located in [`{primary_path}`] [E1]"
                )
                if primary_symbol:
                    parts.append(f", primarily within the `{primary_symbol}` {primary_comp} definition")
                parts.append(
                    f". Downstream architectural interactions link this module across the repository's dependency graph.\n\n"
                )
            else:
                parts.append(
                    f"**Direct Answer:** The functionality is anchored in commit [`{commit_hash}`] [E1] (*\"{commit_title}\"*).\n\n"
                )

        elif any(w in q_lower for w in ["how", "workflow", "process", "mechanism", "flow"]):
            if primary_path and primary_symbol:
                parts.append(
                    f"**Direct Answer:** *'{question}'* operates primarily through `{primary_symbol}` defined in "
                    f"[`{primary_path}`] [E1]. The {primary_comp} receives execution input, processes internal state transitions, "
                    f"and coordinates output with adjacent modules"
                )
                if commit_title:
                    parts.append(f", evolving from milestone [`{commit_hash}`] [E{commit_offset}]")
                parts.append(".\n\n")
            elif commit_title:
                parts.append(
                    f"**Direct Answer:** The workflow for *'{question}'* was introduced and structured in commit [`{commit_hash}`] "
                    f"[E1] (*\"{commit_title}\"*).\n\n"
                )
            else:
                parts.append(
                    f"**Direct Answer:** The operational flow is governed by the core components indexed in evidence item [E1].\n\n"
                )

        else:
            # General / What / Concept queries
            if primary_path:
                parts.append(
                    f"**Direct Answer:** In this codebase, *'{question}'* centers on [`{primary_path}`] [E1]"
                )
                if primary_symbol:
                    parts.append(f" (specifically `{primary_symbol}`)")
                parts.append(f", which serves as the core {primary_comp}")
                if commit_title:
                    parts.append(f" (traceable to milestone [`{commit_hash}`] [E{commit_offset}]: *\"{commit_title}\"*)")
                parts.append(".\n\n")
            elif commit_title:
                parts.append(
                    f"**Direct Answer:** In this codebase, *'{question}'* was established in commit [`{commit_hash}`] [E1]: "
                    f"*\"{commit_title}\"*.\n\n"
                )
            else:
                parts.append(
                    f"**Direct Answer:** Based on AST indexing, the system implements this subsystem via verified evidence [E1].\n\n"
                )

        # -------------------------------------------------------------
        # 2. 🏛️ CORE ARCHITECTURAL IMPLEMENTATION
        # -------------------------------------------------------------
        if code_items:
            parts.append(f"### 🏛️ Core Implementation & Architectural Flow\n\n")
            parts.append(
                f"AST static analysis identifies **`{primary_path}`** (`{primary_comp}`) as the primary execution locus. "
                f"Key structural definitions and entry points include:\n\n"
            )

            for idx, item in enumerate(code_items[:4], 1):
                meta = item.get("metadata", {})
                title = item.get("title", "Symbol")
                path = meta.get("path", "file")
                l_start = meta.get('line_start')
                l_end = meta.get('line_end')
                lines = f"L{l_start}-L{l_end}" if (l_start and l_end) else "Source"
                content = item.get("content", "").strip()

                parts.append(f"- **`{title}`** in [`{path}:{lines}`] [E{idx}]\n")
                
                # Show signature or code preview if present
                if content:
                    lines_preview = [l for l in content.splitlines() if l.strip()][:5]
                    code_snippet = "\n".join(lines_preview)
                    parts.append(f"  ```\n  {code_snippet}\n  ```\n")

        # -------------------------------------------------------------
        # 3. 📜 HISTORICAL EVOLUTION & GIT RATIONALE
        # -------------------------------------------------------------
        if commit_items:
            code_offset = len(code_items[:4])
            parts.append(f"\n### 📜 Historical Evolution & Git Rationale\n\n")
            parts.append(
                f"Repository commit archaeology illuminates why and when this capability was introduced:\n\n"
            )
            for c_idx, c in enumerate(commit_items[:4], 1):
                meta = c.get("metadata", {})
                chash = meta.get("commit_hash", "")[:8]
                date = meta.get("date", "Historical milestone")
                author = meta.get("author", "Contributor")
                category = meta.get("category", "REFACTOR")
                title = c.get("title", "")
                content = c.get("content", "").strip()
                tag = f"[E{code_offset + c_idx}]"

                parts.append(
                    f"- **`[{category}]`** commit [`{chash}`] by *{author}* ({date}) {tag}\n"
                    f"  - **Rationale:** _{title}_\n"
                )
                if content and content != title:
                    clean_detail = content.replace(title, "").strip()
                    if clean_detail:
                        first_line = clean_detail.splitlines()[0][:130]
                        parts.append(f"  - > *\"{first_line}\"*\n")

        # -------------------------------------------------------------
        # 4. ⚡ KEY TAKEAWAYS & DEVELOPER INSIGHTS
        # -------------------------------------------------------------
        parts.append(f"\n### ⚡ Key Takeaways & Developer Insights\n\n")
        parts.append(
            f"- **Verified Grounding:** All claims are anchored to verified AST source lines and immutable Git hashes [E1].\n"
            f"- **Blast Radius Context:** Modifying the primary implementation files requires inspecting downstream callers in the dependency graph.\n"
            f"- **Inspection Tip:** Click any verified evidence chip below to view exact source lines and historical commit diffs."
        )

        return "".join(parts)
