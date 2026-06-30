import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  SupplementaryStatusEnum,
  SupplementaryReasonEnum,
} from '@prisma/client';
import { ProductionSupplementaryRepository } from '../repositories/production-supplementary.repository';
import { ProductionEventPublisher } from '../events/production-event.publisher';
import { AuditService } from '../../../core/audit/audit.service';
import { DocumentNumberingService } from '../../../core/document-numbering/document-numbering.service';
import { CreateSupplementaryRequestUseCase } from './create-supplementary-request/create-supplementary-request.use-case';
import { ApproveSupplementaryRequestUseCase } from './approve-supplementary-request/approve-supplementary-request.use-case';
import { RejectSupplementaryRequestUseCase } from './reject-supplementary-request/reject-supplementary-request.use-case';
import { CancelSupplementaryRequestUseCase } from './cancel-supplementary-request/cancel-supplementary-request.use-case';
import { TransferSupplementaryMaterialUseCase } from './transfer-supplementary-material/transfer-supplementary-material.use-case';
import { GetSupplementaryRequestUseCase } from './get-supplementary-request/get-supplementary-request.use-case';
import { ListSupplementaryRequestsUseCase } from './list-supplementary-requests/list-supplementary-requests.use-case';
import { GetSupplementaryHistoryUseCase } from './get-supplementary-history/get-supplementary-history.use-case';
import { GetSupplementarySummaryUseCase } from './get-supplementary-summary/get-supplementary-summary.use-case';
import { SupplementaryDashboardUseCase } from './supplementary-dashboard/supplementary-dashboard.use-case';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const MOCK_ORDER_IN_PRODUCTION = {
  order_id: BigInt(1),
  status: 'IN_PRODUCTION',
  model_id: BigInt(10),
};

const MOCK_ORDER_PLANNED = {
  order_id: BigInt(1),
  status: 'PLANNED',
  model_id: BigInt(10),
};

const MOCK_LINE = {
  line_id: BigInt(1),
  request_id: BigInt(50),
  order_part_id: BigInt(11),
  part_id: BigInt(22),
  source_warehouse_id: BigInt(3),
  requested_dozens: 5.0,
  approved_dozens: null as number | null,
  transferred_dozens: null as number | null,
  line_notes: null as string | null,
};

const MOCK_LINE_APPROVED = { ...MOCK_LINE, approved_dozens: 5.0 };
const MOCK_LINE_TRANSFERRED = {
  ...MOCK_LINE_APPROVED,
  transferred_dozens: 5.0,
};

const MOCK_REQUEST_PENDING: any = {
  request_id: BigInt(50),
  request_number: 'SUP-2026-00001',
  order_id: BigInt(1),
  reason_type: SupplementaryReasonEnum.GENUINE_SHORTAGE,
  status: SupplementaryStatusEnum.PENDING_APPROVAL,
  justification: 'Genuine material shortage on line 3',
  requested_by: BigInt(99),
  requested_at: new Date('2026-07-01T10:00:00Z'),
  transferred_by: null,
  transferred_at: null,
  notes: null,
  supplementary_request_lines: [MOCK_LINE],
  supplementary_request_negligence: [],
};

const MOCK_REQUEST_APPROVED: any = {
  ...MOCK_REQUEST_PENDING,
  status: SupplementaryStatusEnum.APPROVED,
  supplementary_request_lines: [MOCK_LINE_APPROVED],
};

const MOCK_REQUEST_REJECTED: any = {
  ...MOCK_REQUEST_PENDING,
  status: SupplementaryStatusEnum.REJECTED,
};

const MOCK_REQUEST_TRANSFERRED: any = {
  ...MOCK_REQUEST_APPROVED,
  status: SupplementaryStatusEnum.TRANSFERRED,
  transferred_by: BigInt(99),
  transferred_at: new Date('2026-07-01T11:00:00Z'),
  supplementary_request_lines: [MOCK_LINE_TRANSFERRED],
};

const MOCK_REQUEST_CANCELLED: any = {
  ...MOCK_REQUEST_PENDING,
  status: SupplementaryStatusEnum.CANCELLED,
};

const MOCK_ACTOR = { sub: BigInt(99) } as any;

const MOCK_CREATE_DTO = {
  order_id: '1',
  reason_type: 'GENUINE_SHORTAGE',
  justification: 'Genuine material shortage on line 3',
  lines: [
    {
      order_part_id: '11',
      part_id: '22',
      source_warehouse_id: '3',
      requested_dozens: 5.0,
    },
  ],
};

// ─── Module builder ───────────────────────────────────────────────────────────

async function buildModule() {
  const mockRepo = {
    findProductionOrderById: jest.fn(),
    createSupplementaryRequest: jest.fn(),
    approveSupplementaryRequest: jest.fn(),
    rejectSupplementaryRequest: jest.fn(),
    cancelSupplementaryRequest: jest.fn(),
    transferSupplementaryMaterial: jest.fn(),
    findById: jest.fn(),
    findMany: jest.fn(),
    findPage: jest.fn(),
    findByOrder: jest.fn(),
    getDashboardAggregates: jest.fn(),
  };

  const mockPublisher = {
    emitSupplementaryRequested: jest.fn(),
    emitSupplementaryApproved: jest.fn(),
    emitSupplementaryRejected: jest.fn(),
    emitSupplementaryTransferred: jest.fn(),
    emitSupplementarySummaryUpdated: jest.fn(),
  };

  const mockAudit = { log: jest.fn() };
  const mockDocNumbering = {
    generate: jest.fn().mockResolvedValue('SUP-2026-00001'),
  };

  const module: TestingModule = await Test.createTestingModule({
    providers: [
      CreateSupplementaryRequestUseCase,
      ApproveSupplementaryRequestUseCase,
      RejectSupplementaryRequestUseCase,
      CancelSupplementaryRequestUseCase,
      TransferSupplementaryMaterialUseCase,
      GetSupplementaryRequestUseCase,
      ListSupplementaryRequestsUseCase,
      GetSupplementaryHistoryUseCase,
      GetSupplementarySummaryUseCase,
      SupplementaryDashboardUseCase,
      { provide: ProductionSupplementaryRepository, useValue: mockRepo },
      { provide: ProductionEventPublisher, useValue: mockPublisher },
      { provide: AuditService, useValue: mockAudit },
      { provide: DocumentNumberingService, useValue: mockDocNumbering },
    ],
  }).compile();

  return {
    module,
    mockRepo,
    mockPublisher,
    mockAudit,
    mockDocNumbering,
    createUC: module.get(CreateSupplementaryRequestUseCase),
    approveUC: module.get(ApproveSupplementaryRequestUseCase),
    rejectUC: module.get(RejectSupplementaryRequestUseCase),
    cancelUC: module.get(CancelSupplementaryRequestUseCase),
    transferUC: module.get(TransferSupplementaryMaterialUseCase),
    getUC: module.get(GetSupplementaryRequestUseCase),
    listUC: module.get(ListSupplementaryRequestsUseCase),
    historyUC: module.get(GetSupplementaryHistoryUseCase),
    summaryUC: module.get(GetSupplementarySummaryUseCase),
    dashboardUC: module.get(SupplementaryDashboardUseCase),
  };
}

// ─── CreateSupplementaryRequestUseCase ────────────────────────────────────────

describe('CreateSupplementaryRequestUseCase', () => {
  it('creates request with GENUINE_SHORTAGE reason (no negligence)', async () => {
    const { createUC, mockRepo, mockPublisher, mockAudit, mockDocNumbering } =
      await buildModule();
    mockRepo.findProductionOrderById.mockResolvedValue(
      MOCK_ORDER_IN_PRODUCTION,
    );
    mockRepo.createSupplementaryRequest.mockResolvedValue(MOCK_REQUEST_PENDING);

    const result = await createUC.execute(MOCK_CREATE_DTO, MOCK_ACTOR);

    expect(result.request_id).toBe('50');
    expect(result.request_number).toBe('SUP-2026-00001');
    expect(result.status).toBe(SupplementaryStatusEnum.PENDING_APPROVAL);
    expect(mockDocNumbering.generate).toHaveBeenCalledWith(
      'SUP_REQUEST',
      expect.any(Date),
    );
    expect(mockPublisher.emitSupplementaryRequested).toHaveBeenCalledTimes(1);
    expect(mockPublisher.emitSupplementarySummaryUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(mockAudit.log).toHaveBeenCalledTimes(1);
  });

  it('creates request with NEGLIGENCE reason and negligence payload', async () => {
    const { createUC, mockRepo } = await buildModule();
    const negligenceRequest = {
      ...MOCK_REQUEST_PENDING,
      reason_type: SupplementaryReasonEnum.NEGLIGENCE,
      supplementary_request_negligence: [
        {
          negligence_id: BigInt(1),
          request_id: BigInt(50),
          responsible_employee_id: BigInt(77),
          negligence_type: 'MATERIAL_WASTE',
          stage_id: BigInt(5),
          incident_description: 'Employee discarded materials',
          warning_issued: false,
          warning_reference: null,
          reported_by: BigInt(99),
          reported_at: new Date(),
          root_cause_category: null,
          corrective_action: null,
          preventive_action: null,
          closure_status: 'OPEN',
          closed_by: null,
          closed_at: null,
        },
      ],
    };
    mockRepo.findProductionOrderById.mockResolvedValue(
      MOCK_ORDER_IN_PRODUCTION,
    );
    mockRepo.createSupplementaryRequest.mockResolvedValue(negligenceRequest);

    const dto = {
      ...MOCK_CREATE_DTO,
      reason_type: 'NEGLIGENCE',
      negligence: {
        responsible_employee_id: '77',
        negligence_type: 'MATERIAL_WASTE',
        stage_id: '5',
        incident_description: 'Employee discarded materials',
      },
    };

    const result = await createUC.execute(dto, MOCK_ACTOR);

    expect(result.reason_type).toBe(SupplementaryReasonEnum.NEGLIGENCE);
    expect(result.negligence).not.toBeNull();
    expect(result.negligence?.responsible_employee_id).toBe('77');
    expect(mockRepo.createSupplementaryRequest).toHaveBeenCalledWith(
      expect.objectContaining({
        negligence: expect.objectContaining({
          responsibleEmployeeId: BigInt(77),
        }),
      }),
    );
  });

  it('throws NotFoundException when production order not found', async () => {
    const { createUC, mockRepo } = await buildModule();
    mockRepo.findProductionOrderById.mockResolvedValue(null);

    await expect(createUC.execute(MOCK_CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when order is not IN_PRODUCTION (BR-Sup04)', async () => {
    const { createUC, mockRepo } = await buildModule();
    mockRepo.findProductionOrderById.mockResolvedValue(MOCK_ORDER_PLANNED);

    await expect(createUC.execute(MOCK_CREATE_DTO, MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('throws BadRequestException when no lines provided', async () => {
    const { createUC, mockRepo } = await buildModule();
    mockRepo.findProductionOrderById.mockResolvedValue(
      MOCK_ORDER_IN_PRODUCTION,
    );

    await expect(
      createUC.execute({ ...MOCK_CREATE_DTO, lines: [] }, MOCK_ACTOR),
    ).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when NEGLIGENCE reason has no negligence data (BR-Sup01)', async () => {
    const { createUC, mockRepo } = await buildModule();
    mockRepo.findProductionOrderById.mockResolvedValue(
      MOCK_ORDER_IN_PRODUCTION,
    );

    await expect(
      createUC.execute(
        { ...MOCK_CREATE_DTO, reason_type: 'NEGLIGENCE' },
        MOCK_ACTOR,
      ),
    ).rejects.toThrow(BadRequestException);
  });
});

// ─── ApproveSupplementaryRequestUseCase ──────────────────────────────────────

describe('ApproveSupplementaryRequestUseCase', () => {
  it('approves a PENDING_APPROVAL request', async () => {
    const { approveUC, mockRepo, mockPublisher, mockAudit } =
      await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_PENDING);
    mockRepo.approveSupplementaryRequest.mockResolvedValue(
      MOCK_REQUEST_APPROVED,
    );

    const result = await approveUC.execute('50', MOCK_ACTOR);

    expect(result.status).toBe(SupplementaryStatusEnum.APPROVED);
    expect(mockPublisher.emitSupplementaryApproved).toHaveBeenCalledTimes(1);
    expect(mockPublisher.emitSupplementarySummaryUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(mockAudit.log).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when request not found', async () => {
    const { approveUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(null);

    await expect(approveUC.execute('999', MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when request is not PENDING_APPROVAL', async () => {
    const { approveUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_APPROVED);

    await expect(approveUC.execute('50', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── RejectSupplementaryRequestUseCase ───────────────────────────────────────

describe('RejectSupplementaryRequestUseCase', () => {
  it('rejects a PENDING_APPROVAL request', async () => {
    const { rejectUC, mockRepo, mockPublisher, mockAudit } =
      await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_PENDING);
    mockRepo.rejectSupplementaryRequest.mockResolvedValue(
      MOCK_REQUEST_REJECTED,
    );

    const result = await rejectUC.execute('50', {}, MOCK_ACTOR);

    expect(result.status).toBe(SupplementaryStatusEnum.REJECTED);
    expect(mockPublisher.emitSupplementaryRejected).toHaveBeenCalledTimes(1);
    expect(mockAudit.log).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when request not found', async () => {
    const { rejectUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(null);

    await expect(rejectUC.execute('999', {}, MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when request is TRANSFERRED', async () => {
    const { rejectUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_TRANSFERRED);

    await expect(rejectUC.execute('50', {}, MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── CancelSupplementaryRequestUseCase ───────────────────────────────────────

describe('CancelSupplementaryRequestUseCase', () => {
  it('cancels a PENDING_APPROVAL request', async () => {
    const { cancelUC, mockRepo, mockPublisher, mockAudit } =
      await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_PENDING);
    mockRepo.cancelSupplementaryRequest.mockResolvedValue(
      MOCK_REQUEST_CANCELLED,
    );

    const result = await cancelUC.execute('50', {}, MOCK_ACTOR);

    expect(result.status).toBe(SupplementaryStatusEnum.CANCELLED);
    expect(mockPublisher.emitSupplementarySummaryUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(mockAudit.log).toHaveBeenCalledTimes(1);
  });

  it('throws NotFoundException when request not found', async () => {
    const { cancelUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(null);

    await expect(cancelUC.execute('999', {}, MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when request is TRANSFERRED', async () => {
    const { cancelUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_TRANSFERRED);

    await expect(cancelUC.execute('50', {}, MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── TransferSupplementaryMaterialUseCase ────────────────────────────────────

describe('TransferSupplementaryMaterialUseCase', () => {
  it('transfers an APPROVED request and creates inventory transactions', async () => {
    const { transferUC, mockRepo, mockPublisher, mockAudit } =
      await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_APPROVED);
    mockRepo.transferSupplementaryMaterial.mockResolvedValue(
      MOCK_REQUEST_TRANSFERRED,
    );

    const result = await transferUC.execute('50', MOCK_ACTOR);

    expect(result.status).toBe(SupplementaryStatusEnum.TRANSFERRED);
    expect(result.transferred_by).toBe('99');
    expect(mockPublisher.emitSupplementaryTransferred).toHaveBeenCalledTimes(1);
    expect(mockPublisher.emitSupplementarySummaryUpdated).toHaveBeenCalledTimes(
      1,
    );
    expect(mockAudit.log).toHaveBeenCalledTimes(1);
    expect(mockRepo.transferSupplementaryMaterial).toHaveBeenCalledWith(
      BigInt(50),
      MOCK_ACTOR.sub,
      expect.any(Date),
    );
  });

  it('throws NotFoundException when request not found', async () => {
    const { transferUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(null);

    await expect(transferUC.execute('999', MOCK_ACTOR)).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when request is not APPROVED', async () => {
    const { transferUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_PENDING);

    await expect(transferUC.execute('50', MOCK_ACTOR)).rejects.toThrow(
      BadRequestException,
    );
  });
});

// ─── GetSupplementaryRequestUseCase ──────────────────────────────────────────

describe('GetSupplementaryRequestUseCase', () => {
  it('returns mapped supplementary request by id', async () => {
    const { getUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(MOCK_REQUEST_PENDING);

    const result = await getUC.execute('50');

    expect(result.request_id).toBe('50');
    expect(result.request_number).toBe('SUP-2026-00001');
    expect(result.lines).toHaveLength(1);
    expect(result.negligence).toBeNull();
  });

  it('throws NotFoundException when request not found', async () => {
    const { getUC, mockRepo } = await buildModule();
    mockRepo.findById.mockResolvedValue(null);

    await expect(getUC.execute('999')).rejects.toThrow(NotFoundException);
  });
});

// ─── ListSupplementaryRequestsUseCase ────────────────────────────────────────

describe('ListSupplementaryRequestsUseCase', () => {
  it('returns filtered list of requests', async () => {
    const { listUC, mockRepo } = await buildModule();
    mockRepo.findMany.mockResolvedValue([MOCK_REQUEST_PENDING]);

    const result = await listUC.execute({ order_id: '1' });

    expect(result).toHaveLength(1);
    expect(result[0].order_id).toBe('1');
    expect(mockRepo.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ order_id: BigInt(1) }),
    );
  });

  it('returns empty array when no requests match', async () => {
    const { listUC, mockRepo } = await buildModule();
    mockRepo.findMany.mockResolvedValue([]);

    const result = await listUC.execute({});

    expect(result).toHaveLength(0);
  });
});

// ─── GetSupplementaryHistoryUseCase ──────────────────────────────────────────

describe('GetSupplementaryHistoryUseCase', () => {
  it('returns paginated supplementary history', async () => {
    const { historyUC, mockRepo } = await buildModule();
    mockRepo.findPage.mockResolvedValue({
      items: [MOCK_REQUEST_PENDING],
      meta: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    const result = await historyUC.execute({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.meta.total).toBe(1);
    expect(result.meta.page).toBe(1);
  });

  it('caps limit at 100', async () => {
    const { historyUC, mockRepo } = await buildModule();
    mockRepo.findPage.mockResolvedValue({
      items: [],
      meta: { page: 1, limit: 100, total: 0, totalPages: 0 },
    });

    await historyUC.execute({ page: 1, limit: 500 });

    expect(mockRepo.findPage).toHaveBeenCalledWith(1, 100);
  });
});

// ─── GetSupplementarySummaryUseCase ──────────────────────────────────────────

describe('GetSupplementarySummaryUseCase', () => {
  it('returns summary aggregated by order_id', async () => {
    const { summaryUC, mockRepo } = await buildModule();
    mockRepo.findByOrder.mockResolvedValue([
      MOCK_REQUEST_PENDING,
      MOCK_REQUEST_APPROVED,
      MOCK_REQUEST_TRANSFERRED,
    ]);

    const result = await summaryUC.execute({ order_id: '1' });

    expect(result.order_id).toBe('1');
    expect(result.total_requests).toBe(3);
    expect(result.pending).toBe(1);
    expect(result.approved).toBe(1);
    expect(result.transferred).toBe(1);
    expect(result.rejected).toBe(0);
    expect(result.cancelled).toBe(0);
    expect(result.requests).toHaveLength(3);
  });

  it('returns zero counts when order has no supplementary requests', async () => {
    const { summaryUC, mockRepo } = await buildModule();
    mockRepo.findByOrder.mockResolvedValue([]);

    const result = await summaryUC.execute({ order_id: '99' });

    expect(result.total_requests).toBe(0);
    expect(result.pending).toBe(0);
    expect(result.requests).toHaveLength(0);
  });
});

// ─── SupplementaryDashboardUseCase ───────────────────────────────────────────

describe('SupplementaryDashboardUseCase', () => {
  it('returns dashboard aggregates', async () => {
    const { dashboardUC, mockRepo } = await buildModule();
    const dashboardData = {
      total_requests: 10,
      by_status: [
        { status: 'PENDING_APPROVAL', count: 4 },
        { status: 'APPROVED', count: 3 },
        { status: 'TRANSFERRED', count: 3 },
      ],
      by_reason: [
        { reason_type: 'GENUINE_SHORTAGE', count: 7 },
        { reason_type: 'NEGLIGENCE', count: 3 },
      ],
    };
    mockRepo.getDashboardAggregates.mockResolvedValue(dashboardData);

    const result = await dashboardUC.execute();

    expect(result.total_requests).toBe(10);
    expect(result.by_status).toHaveLength(3);
    expect(result.by_reason).toHaveLength(2);
  });

  it('returns empty dashboard when no requests exist', async () => {
    const { dashboardUC, mockRepo } = await buildModule();
    mockRepo.getDashboardAggregates.mockResolvedValue({
      total_requests: 0,
      by_status: [],
      by_reason: [],
    });

    const result = await dashboardUC.execute();

    expect(result.total_requests).toBe(0);
    expect(result.by_status).toHaveLength(0);
    expect(result.by_reason).toHaveLength(0);
  });
});
