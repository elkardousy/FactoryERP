import { TxnTypeEnum } from '@prisma/client';
import { InventoryPerformanceService } from '../services/inventory-performance.service';

describe('InventoryPerformanceService', () => {
  let service: InventoryPerformanceService;
  let perfRepo: jest.Mocked<any>;

  beforeEach(() => {
    perfRepo = {
      getStockHealth: jest
        .fn()
        .mockResolvedValue({ total_skus: 50, zero_stock_skus: 5 }),
      getCycleCountMetrics: jest
        .fn()
        .mockResolvedValue({ total: 10, open: 3, closed: 7 }),
      getTransactionActivity30d: jest.fn().mockResolvedValue([
        { txn_type: TxnTypeEnum.RECEIVING, count: 12 },
        { txn_type: TxnTypeEnum.ADJUSTMENT, count: 3 },
      ]),
      getBagStatusDistribution: jest.fn().mockResolvedValue([
        { status: 'AVAILABLE', count: 30 },
        { status: 'IN_WIP', count: 10 },
      ]),
    };

    service = new InventoryPerformanceService(perfRepo);
  });

  it('getSummary returns correct stock_health fields', async () => {
    const result = await service.getSummary();
    expect(result.stock_health.total_skus).toBe(50);
    expect(result.stock_health.zero_stock_skus).toBe(5);
  });

  it('getSummary returns correct cycle_count_metrics', async () => {
    const result = await service.getSummary();
    expect(result.cycle_count_metrics.total_investigations).toBe(10);
    expect(result.cycle_count_metrics.open_investigations).toBe(3);
    expect(result.cycle_count_metrics.closed_investigations).toBe(7);
    expect(result.cycle_count_metrics.resolution_rate).toBe(70);
  });

  it('getSummary returns 100 resolution_rate when no investigations exist', async () => {
    (perfRepo.getCycleCountMetrics as jest.Mock).mockResolvedValue({
      total: 0,
      open: 0,
      closed: 0,
    });
    const result = await service.getSummary();
    expect(result.cycle_count_metrics.resolution_rate).toBe(100);
  });

  it('getSummary maps transaction_activity_30d correctly', async () => {
    const result = await service.getSummary();
    expect(result.transaction_activity_30d).toHaveLength(2);
    expect(result.transaction_activity_30d[0].txn_type).toBe(
      TxnTypeEnum.RECEIVING,
    );
    expect(result.transaction_activity_30d[0].count).toBe(12);
  });

  it('getSummary includes computed_at timestamp', async () => {
    const result = await service.getSummary();
    expect(result.computed_at).toBeTruthy();
    expect(new Date(result.computed_at).getTime()).toBeGreaterThan(0);
  });

  it('getBagStatusDistribution returns mapped rows', async () => {
    const result = await service.getBagStatusDistribution();
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('AVAILABLE');
    expect(result[0].count).toBe(30);
  });
});
