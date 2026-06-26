# Decision Tree

Use this decision tree when you are unsure how to approach a task or which playbook, review, or checklist to use.

---

## What am I doing?

```
├── Starting a new session
│   └── → AI_SESSION/SESSION_START.md
│
├── Implementing a new ERP feature
│   └── → PLAYBOOKS/Feature_Playbook.md
│       → SPRINT_PROMPTS/Sprint_{N}_{Name}.md
│
├── Fixing a bug
│   ├── Critical / production-blocking
│   │   └── → PLAYBOOKS/Emergency_Fix_Playbook.md
│   └── Non-critical
│       └── → PLAYBOOKS/Bugfix_Playbook.md
│
├── Refactoring existing code
│   └── → PLAYBOOKS/Refactoring_Playbook.md
│
├── Changing the database schema
│   └── → PLAYBOOKS/Database_Playbook.md
│       → PLAYBOOKS/Migration_Playbook.md
│
├── Completing a sprint
│   └── → CHECKLISTS/Sprint_Checklist.md
│       → REVIEW_PROMPTS/Acceptance_Review.md
│       → RELEASE_PROMPTS/Release.md
│
└── Ending a session
    └── → AI_SESSION/SESSION_END.md
```

---

## Do I need an ADR?

```
Is this decision...
├── A new technology or library?                              → YES, ADR required
├── A new architectural pattern?                             → YES, ADR required
├── A change to an existing ADR's decision?                  → YES, superseding ADR required
├── A cross-module dependency rule change?                   → YES, ADR required
├── A security model change?                                 → YES, ADR required
├── A database schema design decision (naming, indexes)?     → YES, ADR required
├── A choice of algorithm or data structure?                 → MAYBE (if long-term)
├── Implementation detail within an existing pattern?        → NO
└── Bug fix with no architectural impact?                    → NO
```

---

## Which review do I need?

```
After implementing a sprint:
  → Architecture Review (always)
  → Security Review (if auth/data access/dependencies changed)
  → Performance Review (always)
  → Code Quality Review (always)
  → Documentation Review (always)
  → Acceptance Review (always, last)

At a major milestone:
  → ERP Readiness Review

Before releasing:
  → All of the above must show PASS or CONDITIONAL PASS
```

---

## Which quality gate is failing?

```
├── npm run lint fails
│   └── Fix lint errors → see error output for specific rules
│       Common: unbound-method (use spec override), require-await (add eslint-disable or remove async)
│
├── npm run build fails
│   └── TypeScript errors → read error output
│       Common: missing type, BigInt/number mismatch, missing import
│
├── npm run test fails
│   └── Test failures → read test output
│       Common: mock not configured, use case logic error, DTO validation mismatch
│
├── Architecture Gate fails
│   └── → QUALITY_GATES/Architecture_Gate.md for the specific violation
│
├── Security Gate fails
│   └── → QUALITY_GATES/Security_Gate.md for the specific finding
│
└── Documentation Gate fails
    └── → CHECKLISTS/Documentation_Checklist.md to identify missing items
```

---

## How do I handle a conflict?

```
Conflict: An ADR says X but the business requires Y
  → Write a superseding ADR proposing Y
  → Get Architecture Review on the new ADR
  → Only then implement Y

Conflict: Documents say different things about current state
  → Priority: MASTER_PROMPT > ADRs (newest) > PROJECT_MEMORY > CLAUDE.md > conversations
  → Trust the most recently updated repository document

Conflict: A technical requirement conflicts with Clean Architecture
  → Do not bypass the architecture
  → Look for a pattern that satisfies both
  → If genuinely impossible: write an ADR explaining the exception
```
