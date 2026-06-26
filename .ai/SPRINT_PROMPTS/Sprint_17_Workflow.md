# Sprint 17 — Workflow Engine

**Version target:** v0.10.0-workflow-engine
**Prerequisite:** Sprints 12–16 complete (operational domains established)

---

## Objectives

Implement the configurable multi-step approval workflow engine. The workflow engine is used by production orders, CMO approvals, supplementary material requests, and purchase orders. Workflows are configured in the database — adding a new workflow requires no code deployment.

---

## Scope

### New Domain Module: `src/modules/workflow/`

**Schema entities (already in schema):**
- `workflow_templates` — define approval step sequences
- `workflow_template_steps` — individual steps with SLA timers
- `workflow_instances` — runtime instances of a template
- `workflow_steps` — individual step states per instance
- `approval_permissions` — time-bounded approval rights per user

### Use Cases to Implement

| Use Case | Description |
|----------|-------------|
| `CreateWorkflowTemplateUseCase` | Define a new approval workflow template |
| `GetWorkflowTemplateUseCase` | Retrieve template with steps |
| `ListWorkflowTemplatesUseCase` | List all templates |
| `StartWorkflowUseCase` | Instantiate a workflow template for an entity |
| `ApproveStepUseCase` | Approve the current step |
| `RejectStepUseCase` | Reject with reason — terminates workflow |
| `GetWorkflowStatusUseCase` | Current step, elapsed time, pending approvers |
| `GrantApprovalPermissionUseCase` | Grant time-bounded approval right to a user |
| `RevokeApprovalPermissionUseCase` | Revoke approval permission |

---

## Architecture Constraints

- `ApproveStepUseCase` must validate that the requesting user has `approval_permissions` for this step type
- Step advancement is atomic: mark current step approved + activate next step
- Final step approval triggers callback to the originating entity (e.g., CMO status → APPROVED)
- Workflow state machine: PENDING → IN_PROGRESS → APPROVED / REJECTED
- SLA breach tracking must be queryable but does not block approval
- `@Roles`: template management = system_admin; workflow execution = any authenticated user (with permission check)

---

## Testing Requirements

- All 9 use cases must have test suites
- Step approval: valid approver, unauthorized approver (no permission), out-of-order step
- Workflow state machine transitions: all valid + all invalid
- Minimum new tests: 45

---

## Acceptance Criteria

- [ ] `npm run lint` exits 0, `npm run build` clean, all tests passing
- [ ] Approval permission validation enforced — unauthorized step approval throws 403
- [ ] Workflow state machine: invalid transitions throw 422
- [ ] SLA breach is tracked without blocking approvals
- [ ] ADR-032 written (Workflow Engine Architecture)

---

## Exit Criteria

Sprint 17 complete when all acceptance criteria checked, quality gates pass, `v0.10.0-workflow-engine` released.
