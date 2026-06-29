# FEOS — FactoryERP Engineering Operating System

**Version:** 1.0  
**Status:** ACTIVE  
**Authority:** Highest engineering authority for the FactoryERP project  
**Owner:** Chief Software Architect  
**Effective:** 2026-06-29  
**Review Cycle:** Per major phase completion

---

## Purpose

The FactoryERP Engineering Operating System (FEOS) is the permanent engineering governance framework for the FactoryERP project. FEOS defines how engineering is conducted, not what is built. It establishes authority, standards, workflows, and compliance requirements that all contributors — human and AI — must follow throughout the project lifecycle.

FEOS does not describe implementation details. Implementation details are documented in the Knowledge Extraction & Engineering Baseline (KEB) at `docs/knowledge/`. FEOS governs the process by which implementation decisions are made, reviewed, and accepted.

---

## Mission

To ensure that FactoryERP is engineered with consistency, integrity, security, and quality across its full lifecycle — from first commit to production retirement — regardless of the number of contributors, sprints, or AI sessions that participate.

---

## Vision

A codebase and engineering practice that:

1. Any competent engineer or authorized AI agent can enter and contribute correctly without causing regression.
2. Produces no undocumented architectural decisions.
3. Maintains a verifiable, auditable record of every significant change.
4. Can be extended into new modules without degrading existing ones.
5. Remains operational, testable, and deployable at every commit on the main branch.

---

## Engineering Philosophy

**Correctness before velocity.** A feature that is incomplete but correct is preferable to a feature that is fast but wrong. Build states, lint states, and test states are non-negotiable.

**Explicit over implicit.** Every constraint, every prohibition, every exception must be documented. If a rule is not written, it does not exist.

**Layer discipline is not optional.** The Clean Architecture layer ordering is enforced at code review, not just recommended. Violations are not merged.

**Schema is sovereign.** The PostgreSQL schema and `prisma/schema.prisma` are the authoritative record of the data model. No engineer or AI agent modifies either without a documented rationale and an explicit migration workflow execution.

**Documentation is engineering work.** ADRs, governance documents, and knowledge baselines are engineering deliverables, not optional artifacts. They are required for sprint acceptance.

---

## FEOS Authority Hierarchy

```
FEOS (Engineering Operating System)
    │  governs
    ▼
KEB (Knowledge Extraction & Engineering Baseline)  ← docs/knowledge/
    │  documents
    ▼
ADRs (Architecture Decision Records)               ← docs/architecture/adr/
    │  record
    ▼
Implementation (Source Code, Tests, Schema)        ← src/, prisma/, migrations/
```

FEOS governs the process. KEB documents the current state. ADRs record decisions. Implementation delivers value.

In any conflict between these layers, the higher layer takes precedence.

---

## Reading Order

### For New Engineers (Human)

1. `00_FEOS_HOME.md` (this document)
2. `01_ENGINEERING_CONSTITUTION.md`
3. `19_ONBOARDING_GUIDE.md`
4. `03_ARCHITECTURE_GOVERNANCE.md`
5. `07_CODE_GOVERNANCE.md`
6. `10_GIT_GOVERNANCE.md`
7. KEB `02_ARCHITECTURE_BASELINE.md`
8. KEB `07_MODULE_STATUS.md`

### For AI Agents

1. `12_AI_GOVERNANCE.md` (mandatory first read)
2. `01_ENGINEERING_CONSTITUTION.md`
3. `03_ARCHITECTURE_GOVERNANCE.md`
4. `05_DATABASE_GOVERNANCE.md`
5. `06_PRISMA_GOVERNANCE.md`
6. `07_CODE_GOVERNANCE.md`
7. KEB `13_AI_EXECUTION_RULES.md`
8. KEB `02_ARCHITECTURE_BASELINE.md`

### For Architects and Reviewers

1. `01_ENGINEERING_CONSTITUTION.md`
2. `02_PROJECT_GOVERNANCE.md`
3. `03_ARCHITECTURE_GOVERNANCE.md`
4. `17_ENGINEERING_METRICS.md`
5. `18_ENGINEERING_CHECKLISTS.md`

### For Sprint Execution

1. `04_IMPLEMENTATION_GOVERNANCE.md`
2. `11_MODULE_GOVERNANCE.md`
3. `08_TEST_GOVERNANCE.md`
4. `14_OPERATIONAL_PLAYBOOK.md`
5. KEB `08_IMPLEMENTATION_STATUS.md`

---

## Document Map

| Document | Category | When to Read |
|----------|----------|--------------|
| 00_FEOS_HOME.md | Navigation | Entry point, always |
| 01_ENGINEERING_CONSTITUTION.md | Governance | Every sprint kickoff |
| 02_PROJECT_GOVERNANCE.md | Governance | Decision-making, escalation |
| 03_ARCHITECTURE_GOVERNANCE.md | Architecture | New features, ADR creation |
| 04_IMPLEMENTATION_GOVERNANCE.md | Process | Sprint execution |
| 05_DATABASE_GOVERNANCE.md | Database | Schema changes, migrations |
| 06_PRISMA_GOVERNANCE.md | Database | Any Prisma operation |
| 07_CODE_GOVERNANCE.md | Code | Implementation, review |
| 08_TEST_GOVERNANCE.md | Testing | Writing tests, quality gates |
| 09_SECURITY_GOVERNANCE.md | Security | Auth/AuthZ, sensitive data |
| 10_GIT_GOVERNANCE.md | Version Control | Commits, branching, releases |
| 11_MODULE_GOVERNANCE.md | Architecture | Creating new modules |
| 12_AI_GOVERNANCE.md | AI | Every AI session |
| 13_ENGINEERING_STANDARDS.md | Standards | Performance, reliability |
| 14_OPERATIONAL_PLAYBOOK.md | Operations | Daily engineering workflow |
| 15_RECOVERY_PLAYBOOK.md | Recovery | Failures, emergencies |
| 16_RELEASE_PLAYBOOK.md | Release | Version releases |
| 17_ENGINEERING_METRICS.md | Metrics | Health assessment |
| 18_ENGINEERING_CHECKLISTS.md | Quality | Sprint gates, reviews |
| 19_ONBOARDING_GUIDE.md | Onboarding | New contributors |
| 20_FEOS_MASTER_INDEX.md | Navigation | Cross-reference |

---

## KEB Cross-Reference

FEOS references the Knowledge Extraction & Engineering Baseline (KEB) at `docs/knowledge/` as its primary source of verified engineering facts.

| KEB Document | FEOS Reference |
|-------------|----------------|
| KEB 00 — Repository Inventory | FEOS 02, 11 |
| KEB 01 — Technology Stack | FEOS 01, 13 |
| KEB 02 — Architecture Baseline | FEOS 03, 07 |
| KEB 03 — Business Knowledge | FEOS 04, 11 |
| KEB 04 — Database Knowledge | FEOS 05 |
| KEB 05 — Prisma Knowledge | FEOS 06 |
| KEB 06 — API Knowledge | FEOS 07 |
| KEB 07 — Module Status | FEOS 11 |
| KEB 08 — Implementation Status | FEOS 04, 16 |
| KEB 09 — Testing Baseline | FEOS 08 |
| KEB 10 — Engineering Decisions | FEOS 03 |
| KEB 11 — Risk Register | FEOS 09, 15 |
| KEB 12 — Git Baseline | FEOS 10 |
| KEB 13 — AI Execution Rules | FEOS 12 |
| KEB 14 — Project Timeline | FEOS 02, 04 |
| KEB 15 — Engineering Glossary | FEOS 01, 19 |
| KEB 16 — Dependency Graph | FEOS 03, 11 |
| KEB 17 — Cross Reference | FEOS 07, 11 |
| KEB 18 — Repository Statistics | FEOS 17 |
| KEB 19 — Knowledge Gaps | FEOS 15, 17 |
| KEB 20 — Engineering Baseline | FEOS 01, 17 |

---

## Current FEOS Version

| Property | Value |
|----------|-------|
| Version | 1.0 |
| Baseline commit | 5a5e3d6 (Sprint 11.3) |
| Schema models covered | 98 |
| Active NestJS modules | 10 |
| Test baseline | 197 tests |
| Build state | PASSING |
| Lint state | CLEAN |
| Next review trigger | Sprint 12 completion or major architectural change |
