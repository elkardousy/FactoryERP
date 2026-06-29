import { AccountabilityClosureEnum, TxnTypeEnum } from '@prisma/client';
import { InventoryReportingService } from '../services/inventory-reporting.service';

const makeBag = (overrides: Partial<any> = {}) => ({
  bag_id: BigInt(1),
  warehouse_id: BigInt(1),
  model_id: BigInt(1),
  part_id: BigInt(2),
  dozens_on_hand: '50.000',
  version: BigInt(0),
  last_updated: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const makeInvestigation = (overrides: Partial<any> = {}) => ({
  investigation_id: BigInt(1),
  investigation_number: 'CC-001',
  warehouse_id: BigInt(1),
  model_id: BigInt(1),
  part_id: BigInt(2),
  description: 'variance',
  closure_status: AccountabilityClosureEnum.OPEN,
  investigation_type: 'INVENTORY_VARIANCE',
  reported_at: new Date('2026-01-01T00:00:00Z'),
  root_cause_category: null,
  corrective_action: null,
  preventive_action: null,
  reported_by: BigInt(10),
  closed_by: null,
  closed_at: null,
  responsible_department_id: null,
  responsible_employee_id: null,
  container_id: null,
  bag_id: null,
  ...overrides,
});

describe('InventoryReportingService', () => {
  let service: InventoryReportingService;
  let reportingRepo: jest.Mocked<any>;

  beforeEach(() => {
    reportingRepo = {
      getTransactionVolume: jest.fn().mockResolvedValue([
        { txn_type: TxnTypeEnum.RECEIVING, count: 5 },
        { txn_type: TxnTypeEnum.ADJUSTMENT, count: 2 },
      ]),
      getStockPosition: jest
        .fn()
        .mockResolvedValue([
          makeBag({ dozens_on_hand: '50.000' }),
          makeBag({ warehouse_id: BigInt(2), dozens_on_hand: '30.500' }),
        ]),
      getVarianceReport: jest.fn().mockResolvedValue([
        makeInvestigation({ closure_status: AccountabilityClosureEnum.OPEN }),
        makeInvestigation({
          closure_status: AccountabilityClosureEnum.CLOSED,
        }),
      ]),
    };

    service = new InventoryReportingService(reportingRepo);
  });

  it('getTransactionVolumeReport maps volumes and sums total', async () => {
    const from = new Date('2026-01-01');
    const to = new Date('2026-01-31');
    const result = await service.getTransactionVolumeReport(from, to);
    expect(result.volumes).toHaveLength(2);
    expect(result.total_transactions).toBe(7);
    expect(result.from_date).toBe(from.toISOString());
  });

  it('getTransactionVolumeReport returns empty volumes when no transactions', async () => {
    (reportingRepo.getTransactionVolume as jest.Mock).mockResolvedValue([]);
    const result = await service.getTransactionVolumeReport(
      new Date(),
      new Date(),
    );
    expect(result.total_transactions).toBe(0);
    expect(result.volumes).toHaveLength(0);
  });

  it('getStockPositionReport sums total_dozens_on_hand correctly', async () => {
    const result = await service.getStockPositionReport();
    expect(result.total_skus).toBe(2);
    expect(result.total_dozens_on_hand).toBe('80.500');
  });

  it('getStockPositionReport filters by warehouse when provided', async () => {
    await service.getStockPositionReport(BigInt(1));
    expect(reportingRepo.getStockPosition).toHaveBeenCalledWith(BigInt(1));
  });

  it('getVarianceSummaryReport counts open and closed correctly', async () => {
    const result = await service.getVarianceSummaryReport();
    expect(result.total).toBe(2);
    expect(result.open).toBe(1);
    expect(result.closed).toBe(1);
  });

  it('getVarianceSummaryReport passes closureStatus filter to repo', async () => {
    await service.getVarianceSummaryReport(AccountabilityClosureEnum.OPEN);
    expect(reportingRepo.getVarianceReport).toHaveBeenCalledWith(
      AccountabilityClosureEnum.OPEN,
    );
  });
});
