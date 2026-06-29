import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  AccountabilityClosureEnum,
  RootCauseCategoryEnum,
} from '@prisma/client';
import { CycleCountService } from '../services/cycle-count.service';
import { OpenCycleCountCommand } from './open-cycle-count/commands/open-cycle-count.command';
import { ListCycleCountsQuery } from './list-cycle-counts/queries/list-cycle-counts.query';
import { GetCycleCountQuery } from './get-cycle-count/queries/get-cycle-count.query';
import { AddCycleCountActionCommand } from './add-cycle-count-action/commands/add-cycle-count-action.command';
import { CloseCycleCountCommand } from './close-cycle-count/commands/close-cycle-count.command';

const makeInvestigation = (
  overrides: Partial<any> = {},
): Record<string, any> => ({
  investigation_id: BigInt(1),
  investigation_number: 'CC-001',
  investigation_type: 'INVENTORY_VARIANCE',
  warehouse_id: BigInt(1),
  model_id: BigInt(1),
  part_id: BigInt(2),
  description:
    'System balance: 100 doz | Physical count: 90 doz | Variance: -10 doz',
  closure_status: AccountabilityClosureEnum.OPEN,
  root_cause_category: null,
  corrective_action: null,
  preventive_action: null,
  reported_by: BigInt(10),
  reported_at: new Date('2026-01-01T00:00:00Z'),
  closed_by: null,
  closed_at: null,
  responsible_department_id: null,
  responsible_employee_id: null,
  container_id: null,
  bag_id: null,
  ...overrides,
});

describe('CycleCountService', () => {
  let service: CycleCountService;
  let cycleCountRepo: jest.Mocked<any>;
  let bagsRepo: jest.Mocked<any>;
  let logger: jest.Mocked<any>;

  beforeEach(() => {
    cycleCountRepo = {
      create: jest.fn().mockResolvedValue(makeInvestigation()),
      findById: jest.fn().mockResolvedValue(makeInvestigation()),
      findMany: jest.fn().mockResolvedValue([makeInvestigation()]),
      addAction: jest.fn().mockResolvedValue({
        action_id: BigInt(1),
        performed_at: new Date('2026-01-01T00:00:00Z'),
      }),
      close: jest.fn().mockResolvedValue(
        makeInvestigation({
          closure_status: AccountabilityClosureEnum.CLOSED,
        }),
      ),
    };
    bagsRepo = {
      findByKey: jest.fn().mockResolvedValue({
        dozens_on_hand: '100',
      }),
    };
    logger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    service = new CycleCountService(cycleCountRepo, bagsRepo, logger);
  });

  const makeOpenCmd = (actualDozens: number) =>
    new OpenCycleCountCommand(
      'CC-001',
      BigInt(1),
      BigInt(1),
      BigInt(2),
      actualDozens,
      null,
      BigInt(10),
    );

  it('returns has_variance=false when actual matches system balance', async () => {
    const result = await service.openCycleCount(makeOpenCmd(100));
    expect(result.has_variance).toBe(false);
    expect(result.variance_dozens).toBe('0');
    expect(cycleCountRepo.create).not.toHaveBeenCalled();
  });

  it('creates investigation when variance detected', async () => {
    const result = await service.openCycleCount(makeOpenCmd(90));
    expect(result.has_variance).toBe(true);
    expect(result.variance_dozens).toBe('-10');
    expect(cycleCountRepo.create).toHaveBeenCalled();
    expect(result.investigation).toBeDefined();
  });

  it('treats missing ledger entry as system balance of 0', async () => {
    (bagsRepo.findByKey as jest.Mock).mockResolvedValue(null);
    const result = await service.openCycleCount(makeOpenCmd(5));
    expect(result.system_dozens).toBe('0');
    expect(result.has_variance).toBe(true);
  });

  it('listCycleCounts returns array of DTOs', async () => {
    const results = await service.listCycleCounts(
      new ListCycleCountsQuery(null, null, null, 1, 20),
    );
    expect(Array.isArray(results)).toBe(true);
    expect(results[0].investigation_number).toBe('CC-001');
  });

  it('getCycleCount throws NotFoundException when not found', async () => {
    (cycleCountRepo.findById as jest.Mock).mockResolvedValue(null);
    await expect(
      service.getCycleCount(new GetCycleCountQuery(BigInt(999))),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('addAction throws UnprocessableEntityException when investigation is closed', async () => {
    (cycleCountRepo.findById as jest.Mock).mockResolvedValue(
      makeInvestigation({ closure_status: AccountabilityClosureEnum.CLOSED }),
    );
    await expect(
      service.addAction(
        new AddCycleCountActionCommand(BigInt(1), 'note', BigInt(10)),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('addAction succeeds on open investigation', async () => {
    const result = await service.addAction(
      new AddCycleCountActionCommand(
        BigInt(1),
        'Recount confirmed',
        BigInt(10),
      ),
    );
    expect(result.action_id).toBe('1');
  });

  it('closeCycleCount throws UnprocessableEntityException when already closed', async () => {
    (cycleCountRepo.findById as jest.Mock).mockResolvedValue(
      makeInvestigation({ closure_status: AccountabilityClosureEnum.CLOSED }),
    );
    await expect(
      service.closeCycleCount(
        new CloseCycleCountCommand(
          BigInt(1),
          RootCauseCategoryEnum.COUNTING_ERROR,
          null,
          null,
          BigInt(10),
        ),
      ),
    ).rejects.toBeInstanceOf(UnprocessableEntityException);
  });

  it('closeCycleCount returns closed DTO', async () => {
    const result = await service.closeCycleCount(
      new CloseCycleCountCommand(
        BigInt(1),
        RootCauseCategoryEnum.COUNTING_ERROR,
        'Posted correction adjustment',
        null,
        BigInt(10),
      ),
    );
    expect(result.closure_status).toBe(AccountabilityClosureEnum.CLOSED);
  });
});
