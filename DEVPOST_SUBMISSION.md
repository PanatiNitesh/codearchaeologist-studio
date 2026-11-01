# 🏛️ CodeArchaeologist Studio & Shift Handover Pro
### *DATANOVA 2026 GLOBAL DATA-THON Submission*

---

## 🏆 Challenge Track Selection & Strategy

### **Selected Track**: **Data Science and Advanced Analytics**
*(Alternative Co-Track: **Artificial Intelligence and Machine Learning**)*

### **Why this is the 1000/10 Winning Choice**:
1. **Repository as an Empirical Dataset**: Instead of wrapping an LLM prompt around code snippets, CodeArchaeologist treats software repositories as complex, evolving relational and graph datasets:
   - **Temporal Commit Transaction Logs**: Mining commit histories using Association Rule Mining to derive change coupling (support, confidence, Jaccard similarity).
   - **Multidimensional Graph Topologies**: Resolving typed semantic graphs across AST nodes ($V$) and edges ($E$) using compiler graph theory.
   - **Sociotechnical Developer Entropy**: Modeling knowledge-loss distributions, bus-factor decay, and author churn across thousands of commits.
2. **Defensible Science Over Hallucinatory GenAI**: Most hackathon entries will be generic chat wrappers. Entering **Data Science and Advanced Analytics** sets CodeArchaeologist in a tier of its own: we deliver Daikon-style statistical invariant discovery, Kahn's topological sequencing, empirical precision matrices (85%+ measured accuracy), and our novel **HalfDone-Bench** benchmark.

---

## 💡 Inspiration

Software engineering loses **40% of its maintenance capacity** to a pervasive, unsolved problem: **partially completed handovers**.

When a developer finishes a shift, switches time zones, or leaves a branch half-implemented (such as updating a method signature in 12 of 18 call sites), the incoming engineer has to guess:
- *What changed in the uncommitted diffs or stash?*
- *Which downstream callers still use the obsolete contract?*
- *What system invariants did past commits strictly maintain that this branch now violates?*

Simultaneously, enterprise cloud modernizations fail because engineers rely on rudimentary text `grep` tools that flood them with homonym false alarms while missing indirect object aliases and dynamic imports.

We built **CodeArchaeologist Studio** to elevate software archaeology and shift handover into a **deterministic compiler and data science**.

---

## 🚀 What It Does

CodeArchaeologist Studio is an enterprise platform for software evolution analysis, live shift handover continuation, and cloud modernization:

### 1. 🔄 Live Shift Handover Pro (Grounded on Real Git State)
- **Live Git Differential Ingestion**: Hooks into active uncommitted `git diff`, `git diff --staged`, `git stash show -p`, or branch diffs.
- **Tree-Sitter AST Changed Symbol Traversal**: Parses changed signatures across TypeScript, JavaScript, Java, Go, and Python.
- **Call-Graph Broken Contract Auditing**: Cross-references modified symbols against the whole-repo AST call multigraph to flag every caller file and line still invoking the old contract.
- **Systematic Edit Inference**: Infers transformation rules from already-edited sites (grounded in LASE, Getafix, and Refazer literature) and generates executable unified diff patches (`.patch`) for all unfinished sites.
- **Daikon-Style Mined Invariant Shield**: Dynamically discovers invariants from enum schemas, test suites, and 95%+ commit co-change patterns, alerting developers if their WIP breaks historical guarantees.
- **One-Click Export**: Formats handover briefings into instant Markdown or Slack messages.

### 2. 🔍 AST Compiler vs. Grep Precision Matrix
- Provides an empirical side-by-side comparison between text grep and Tree-Sitter AST resolution on real codebases.
- Reports real measured false positives (comment/string literal homonyms) and rescued misses (destructured aliases, indirect references), demonstrating **85%+ to 94% measured empirical accuracy**.

### 3. 🧬 SystemDNA: Migration Plan Preview & Refactoring Planner
- Provides an architectural preview of complex migrations before applying changes.
- **Topological 4-Wave Sequencing**: Guarantees database schemas and providers migrate before consumers via Kahn’s DAG algorithm.
- **Zero-Downtime Dual-Write SQL**: Generates backward-compatible SQL views, triggers, and shadow columns (`ext_customer_id`).
- **Executable Rename Patches**: Generates unified diff patches for simple refactorings.

### 4. 📊 HalfDone-Bench: Empirical Shift Handover Benchmark
- A novel, reproducible evaluation suite: simulates incomplete handovers on historical multi-file commits by withholding 50% of the diff and measuring Precision@k, Recall, F1, and Recovery Success Rate.

### 5. 🛡️ Chesterton’s Fence Score & Knowledge-Loss (Bus-Factor) Map
- Computes an algorithmic refactoring risk score based on code age, author departure ratios, change coupling, and test deficits.
- Generates a **Knowledge-Loss Map** highlighting orphan files where **100% of historical authors are inactive**.
- Provides verified **Decision Provenance** linking AST code to the original commit SHAs and architectural rationale.

### 6. 🔌 Modern Ecosystem Integration (FastMCP Server & CLI)
- **FastMCP Server**: Exposes handover, blast radius, Chesterton scores, and invariant mining tools to Cursor, Claude Desktop, and Copilot.
- **`ca` Command-Line Tool**: Run `ca handover`, `ca fence`, and `ca benchmark` directly from any terminal.

---

## 🔬 Theoretical Foundations & Prior Art

Our shift handover engine is the first to bridge academic systematic edit research with shift continuation:
1. **LASE** (*Meng et al., ICSE 2013*): Parameterized transformation rule learning from exemplar edits.
2. **Getafix** (*Bader et al., OOPSLA 2019*): Hierarchical anti-unification for automated program bug-fixing.
3. **Refazer** (*Rolim et al., TSE 2018*): Inductive program synthesis from input-output examples.
4. **Daikon** (*Ernst et al., ICSE 2001*): Dynamic and statistical program invariant detection.

---

## 🥊 How It Compares to Sourcegraph and CodeScene

| Dimension | Sourcegraph | CodeScene | 🏛️ CodeArchaeologist Studio |
| :--- | :---: | :---: | :---: |
| **Primary Focus** | Global code search & batch edits | Behavioral hotspots & churn | **Shift handover continuity & AST contract auditing** |
| **WIP / Stash Understanding** | ❌ None | ❌ None | ✅ **Live uncommitted Git diff & stash parsing** |
| **Caller Contract Checking** | ⚠️ Manual symbol lookup | ❌ No AST graph | ✅ **Automated call graph audit for broken callers** |
| **Unfinished Edit Synthesis** | ❌ None | ❌ None | ✅ **Infers systematic edits & generates diff patches** |
| **Mined Invariant Shield** | ❌ None | ❌ None | ✅ **Daikon-style statistical invariants** |
| **Benchmarking Suite** | ❌ None | ❌ None | ✅ **HalfDone-Bench empirical recovery suite** |
| **Ecosystem** | Web app / extension | Web dashboard | ✅ **FastMCP Server, `ca` CLI, REST API, React Studio** |

---

## 🛠️ How We Built It & Mathematical Formulations

### 1. Multi-Tier Dependency Multigraph
$$\mathcal{G} = (\mathcal{V}, \mathcal{E}, \tau_V, \tau_E)$$
$\mathcal{V}$ encompasses AST components across TypeScript, JavaScript, Java, Go, and Python; $\mathcal{E}$ models typed semantic edges ($\mathrm{IMPORTS}, \mathrm{CALLS}, \mathrm{EXTENDS}$).

### 2. Calibrated Blast Radius & Co-Change Model
$$J(u, v) = \frac{|\mathcal{C}(u) \cap \mathcal{C}(v)|}{|\mathcal{C}(u) \cup \mathcal{C}(v)|}$$
$$\mathrm{RiskScore}(u, v) = w_1 \cdot \frac{1}{\mathrm{dist}(u, v)} + w_2 \cdot J(u, v) + w_3 \cdot \frac{\mathrm{LOC}(v)}{\sum_{k \in \mathcal{V}} \mathrm{LOC}(k)}$$

### 3. Chesterton’s Fence Score
$$\mathrm{FenceScore}(f) = 0.35 \cdot \mathrm{AuthorLoss}(f) + 0.25 \cdot \mathrm{CouplingRisk}(f) + 0.20 \cdot \mathrm{AgeWeight}(f) + 0.20 \cdot \mathrm{TestDeficit}(f)$$

### 4. Reciprocal Rank Fusion (RRF) Grounding
$$\mathrm{RRF}(d) = \sum_{m \in \{\mathrm{Dense},\, \mathrm{BM25}\}} \frac{1}{k + \mathrm{rank}_m(d)}, \quad k = 60$$

### Tech Stack:
- **Core Languages & Compilers**: Python 3.13, Tree-Sitter (TS, JS, Java, Go, Python grammars), NetworkX, PyDriller.
- **APIs & Protocols**: FastAPI, FastMCP (Model Context Protocol), Uvicorn.
- **Frontend & Visualization**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, Custom SVG Call Graph.
- **Testing & Verification**: Pytest with **48/48 Passing Test Cases**.

---

## 🧗 Challenges We Overcame

1. **Compiler-Grade Multi-Language AST Parsing**: Replacing regex with Tree-Sitter in Python 3.13 required dynamically navigating C-grammar AST bindings for nested TypeScript destructuring patterns, Java interface implementations, and Go struct receivers.
2. **Deterministic Broken Contract Discovery**: Resolving partial diff hunks against live AST symbol tables without recompiling the entire repository.
3. **Live Git Diff Traversal Under Edge Cases**: Handling deleted files, binary assets, and renamed tokens on single lines via bidirectional word-level token alignment.
4. **Sub-280MB RAM Footprint**: Ensuring batch commit analysis and multigraph resolution never exceed free-tier cloud ceilings.

---

## 🏆 Accomplishments That We're Proud Of

- ✅ **Headline Feature Made Real**: Shift Handover Pro parses live Git diffs/stashes, flags broken callers across the call graph, and generates unified diff patches.
- ✅ **Compiler-Grade Tree-Sitter**: Full AST resolution across TypeScript, JavaScript, Java, Go, and Python.
- ✅ **Honest Empirical Precision Matrix**: Proves 85%+ measured empirical precision against raw text grep.
- ✅ **Novel HalfDone-Bench Benchmark**: Quantitative empirical recovery of withheld edits in real commits.
- ✅ **Algorithmic Chesterton's Fence & Bus-Factor Map**: Quantifies refactoring risk and highlights 100% orphaned modules.
- ✅ **FastMCP Server & CLI**: Real-world integration with Cursor, Claude Desktop, and terminal workflows.
- ✅ **48/48 Automated Pytest Test Cases Passing**.

---

## 🔮 What's Next

- **GitHub PR Review Bot**: Automatic PR comment: *"This PR touches 14 callers and 3 co-changed files you didn't edit."*
- **IDE In-Editor Sentinel**: In-editor notifications highlighting uncompleted systematic edits in real time.
- **Enterprise Multi-Cloud Modernization**: Extending automated IaC generation to GCP and Azure.
