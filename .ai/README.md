# AI Engineering Operating System (AI-EOS)

> **Every future AI session must read this file before beginning any work.**

The AI-EOS is the permanent engineering framework governing how AI contributes to FactoryERP. It defines startup procedures, workflows, quality gates, sprint prompts, review prompts, playbooks, checklists, and templates. It is a production asset — governed, versioned, and reviewed under the same standards as the application itself.

---

## Mandatory Session Startup Sequence

Every AI session must execute this reading sequence before any implementation:

| # | File | Purpose |
|---|------|---------|
| 1 | [README_ARCHITECTURE.md](../README_ARCHITECTURE.md) | Repository entry point — architecture, modules, current status |
| 2 | [docs/PROJECT_MEMORY.md](../docs/PROJECT_MEMORY.md) | Full operational memory — phase, metrics, risks, technical debt |
| 3 | [docs/checkpoints/PROJECT_CHECKPOINT.md](../docs/checkpoints/PROJECT_CHECKPOINT.md) | Sprint snapshot — what is done, what is not |
| 4 | [docs/architecture/ADR_INDEX.md](../docs/architecture/ADR_INDEX.md) | All active architectural decisions |
| 5 | [.ai/MASTER_PROMPT.md](MASTER_PROMPT.md) | Project identity, architecture invariants, AI behavior policy |
| 6 | [.ai/GOVERNANCE_PROMPT.md](GOVERNANCE_PROMPT.md) | Engineering governance, approval flows, lifecycle rules |

See [AI_SESSION/SESSION_START.md](AI_SESSION/SESSION_START.md) for the complete startup checklist.

---

## Directory Structure

```
.ai/
├── README.md                    ← This file — AI-EOS entry point
├── MASTER_PROMPT.md             ← Immutable project identity and AI behavior policy
├── GOVERNANCE_PROMPT.md         ← Engineering governance rules
├── WORKFLOW.md                  ← Complete engineering workflow with diagrams
│
├── SPRINT_PROMPTS/              ← Operational prompts for each planned sprint
│   ├── Sprint_11_Inventory_Engine.md
│   ├── Sprint_12_CMO.md
│   ├── Sprint_13_Production.md
│   ├── Sprint_14_Quality.md
│   ├── Sprint_15_Purchasing.md
│   ├── Sprint_16_Shipping.md
│   ├── Sprint_17_Workflow.md
│   ├── Sprint_18_Reporting.md
│   ├── Sprint_19_Dashboard.md
│   └── Sprint_20_Production_Readiness.md
│
├── REVIEW_PROMPTS/              ← Structured review procedures
│   ├── Architecture_Review.md
│   ├── Security_Review.md
│   ├── Performance_Review.md
│   ├── Acceptance_Review.md
│   ├── Documentation_Review.md
│   ├── Database_Review.md
│   ├── Code_Quality_Review.md
│   └── ERP_Readiness_Review.md
│
├── RELEASE_PROMPTS/             ← Release execution procedures
│   ├── Release.md
│   ├── Checkpoint.md
│   ├── Git_Tag.md
│   ├── GitHub_Release.md
│   └── Governance_Update.md
│
├── TEMPLATES/                   ← Reusable document templates
│   ├── Sprint_Template.md
│   ├── ADR_Template.md
│   ├── Acceptance_Template.md
│   ├── Release_Template.md
│   ├── Checkpoint_Template.md
│   └── Review_Template.md
│
├── CHECKLISTS/                  ← Mandatory engineering checklists
│   ├── Definition_of_Done.md
│   ├── Sprint_Checklist.md
│   ├── Architecture_Checklist.md
│   ├── Security_Checklist.md
│   ├── Performance_Checklist.md
│   ├── Documentation_Checklist.md
│   ├── Release_Checklist.md
│   └── Decision_Tree.md
│
├── PLAYBOOKS/                   ← Step-by-step operational playbooks
│   ├── Feature_Playbook.md
│   ├── Bugfix_Playbook.md
│   ├── Refactoring_Playbook.md
│   ├── Database_Playbook.md
│   ├── Migration_Playbook.md
│   └── Emergency_Fix_Playbook.md
│
├── AI_SESSION/                  ← AI session lifecycle management
│   ├── SESSION_START.md
│   ├── SESSION_END.md
│   └── CONTEXT_RECOVERY.md
│
└── QUALITY_GATES/               ← Mandatory quality gates
    ├── Build_Gate.md
    ├── Testing_Gate.md
    ├── Architecture_Gate.md
    ├── Security_Gate.md
    ├── Performance_Gate.md
    ├── Documentation_Gate.md
    └── Release_Gate.md
```

---

## How to Use AI-EOS

### Starting a new sprint

1. Complete the session startup sequence above
2. Open the relevant sprint prompt from `SPRINT_PROMPTS/`
3. Follow the sprint prompt's objectives, constraints, and acceptance criteria
4. Use the `CHECKLISTS/Sprint_Checklist.md` to track progress
5. Upon completion, execute the `RELEASE_PROMPTS/` sequence

### Performing a review

1. Open the relevant review prompt from `REVIEW_PROMPTS/`
2. Follow the evaluation criteria and scoring rubric
3. Record outcomes using `TEMPLATES/Review_Template.md`

### Creating an ADR

1. Use `TEMPLATES/ADR_Template.md`
2. Place the file in `docs/architecture/adr/`
3. Add it to `docs/architecture/ADR_INDEX.md`

### Completing a release

1. Verify all quality gates in `QUALITY_GATES/`
2. Execute `RELEASE_PROMPTS/Release.md`
3. Create tag via `RELEASE_PROMPTS/Git_Tag.md`
4. Publish via `RELEASE_PROMPTS/GitHub_Release.md`
5. Update governance via `RELEASE_PROMPTS/Governance_Update.md`

---

## AI-EOS Governance

AI-EOS is a production asset. Changes require:

1. Architecture Review
2. ADR (if architectural change)
3. Acceptance Review
4. Documentation update
5. Checkpoint update

See [GOVERNANCE_PROMPT.md](GOVERNANCE_PROMPT.md) for full governance rules.

---

## Version

| Field | Value |
|-------|-------|
| AI-EOS Version | 1.0.0 |
| Created | 2026-06-26 |
| Repository Version | v0.3.0-business-foundation |
| Status | Active |
