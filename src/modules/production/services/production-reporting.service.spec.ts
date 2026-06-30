import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ProductionReportingService } from './production-reporting.service';
import { ProductionReportingRepository } from '../repositories/production-reporting.repository';
import type {
  DashboardRawData,
  OrderSummaryRaw,
  KPIRawData,
} from '../repositories/production-reporting.repository';
import { OrderStatusEnum, StageStatusEnum } from '@prisma/client';
import { buildPaginationMeta } from '../../../common/interfaces/paginated-result.interface';

// ── Mock repository ────────────────────────────────────────────────────────────

const mockRepo: jest.Mocked<ProductionReportingRepository> = {
  getDashboardData: jest.fn(),
  getOrderSummaryData: jest.fn(),
  getKPIData: jest.fn(),
  findOrdersReport: jest.fn(),
  findStageReport: jest.fn(),
  findWipReport: jest.fn(),
  findScrapReport: jest.fn(),
  findQualityReport: jest.fn(),
  findPackingReport: jest.fn(),
  findFGReport: jest.fn(),
  findSupplementaryReport: jest.fn(),
  findHistoricalReport: jest.fn(),
} as any;

// ── Shared fixtures ────────────────────────────────────────────────────────────

const orderRaw = {
  order_id: BigInt(1),
  order_number: 'ORD-001',
  status: 'IN_PRODUCTION',
  model_id: BigInt(10),
  line_id: BigInt(2),
  release_type: 'STANDARD',
  target_dozens: { toString: () => '100' },
  created_at: new Date('2026-01-01'),
  closed_at: null,
};

const emptyMeta = buildPaginationMeta(1, 20, 0);
const oneItemMeta = buildPaginationMeta(1, 20, 1);

// ── Test module builder ────────────────────────────────────────────────────────

async function buildModule(): Promise<ProductionReportingService> {
  const module: TestingModule = await Test.createTestingModule({
    providers: [
      ProductionReportingService,
      { provide: ProductionReportingRepository, useValue: mockRepo },
    ],
  }).compile();
  return module.get<ProductionReportingService>(ProductionReportingService);
}

// ─────────────────────────────────────────────────────────────────────────────

describe('ProductionReportingService', () => {
  let svc: ProductionReportingService;

  beforeAll(async () => {
    svc = await buildModule();
  });

  beforeEach(() => jest.clearAllMocks());

  // ── getDashboard ────────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    const dashData: DashboardRawData = {
      ordersByStatus: [
        { status: OrderStatusEnum.IN_PRODUCTION, _count: { order_id: 3 } },
        { status: OrderStatusEnum.CLOSED, _count: { order_id: 10 } },
      ],
      totalWipDozens: 50,
      totalFGDozens: 200,
      totalScrapDozens: 5,
      recentOrders: [orderRaw],
    };

    it('returns correct dashboard aggregates', async () => {
      mockRepo.getDashboardData.mockResolvedValue(dashData);

      const result = await svc.getDashboard();

      expect(result.total_orders).toBe(13);
      expect(result.active_orders).toBe(3);
      expect(result.total_wip_dozens).toBe(50);
      expect(result.total_fg_dozens).toBe(200);
      expect(result.total_scrap_dozens).toBe(5);
      expect(result.by_status).toHaveLength(2);
      expect(result.recent_orders).toHaveLength(1);
      expect(result.recent_orders[0].order_id).toBe('1');
    });

    it('handles empty data (no orders)', async () => {
      mockRepo.getDashboardData.mockResolvedValue({
        ordersByStatus: [],
        totalWipDozens: 0,
        totalFGDozens: 0,
        totalScrapDozens: 0,
        recentOrders: [],
      });

      const result = await svc.getDashboard();
      expect(result.total_orders).toBe(0);
      expect(result.active_orders).toBe(0);
    });
  });

  // ── getSummary ──────────────────────────────────────────────────────────────

  describe('getSummary', () => {
    const summaryRaw: OrderSummaryRaw = {
      order: orderRaw,
      stageCounts: { total: 5, completed: 3, in_progress: 1, pending: 1 },
      wipDozens: 20,
      qualityDozens: 60,
      scrapDozens: 2,
      incompleteDozens: 1,
      returnDozens: 0,
      supplementaryCount: 2,
      packing: {
        packing_order_id: BigInt(100),
        packing_order_no: 'PKG-001',
        production_order_id: BigInt(1),
        status: 'POSTED',
        target_dozens: { toString: () => '100' },
        assembled_dozens: { toString: () => '98' },
        verified_dozens: { toString: () => '98' },
        created_at: new Date('2026-01-10'),
        posted_at: new Date('2026-01-15'),
      },
    };

    it('returns composite order summary', async () => {
      mockRepo.getOrderSummaryData.mockResolvedValue(summaryRaw);

      const result = await svc.getSummary({ order_id: '1' });

      expect(result.order.order_id).toBe('1');
      expect(result.stage_stats.total).toBe(5);
      expect(result.stage_stats.completed).toBe(3);
      expect(result.wip_dozens).toBe(20);
      expect(result.quality_dozens).toBe(60);
      expect(result.supplementary_count).toBe(2);
      expect(result.packing).not.toBeNull();
      expect(result.packing?.packing_order_id).toBe('100');
    });

    it('returns null packing when no packing order exists', async () => {
      mockRepo.getOrderSummaryData.mockResolvedValue({
        ...summaryRaw,
        packing: null,
      });
      const result = await svc.getSummary({ order_id: '1' });
      expect(result.packing).toBeNull();
    });

    it('throws NotFoundException for unknown order', async () => {
      mockRepo.getOrderSummaryData.mockResolvedValue({
        ...summaryRaw,
        order: null,
      });
      await expect(svc.getSummary({ order_id: '999' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  // ── getKPIs ─────────────────────────────────────────────────────────────────

  describe('getKPIs', () => {
    const kpiData: KPIRawData = {
      totalOrders: 100,
      activeOrders: 20,
      completedOrders: 70,
      totalTargetDozens: 1000,
      totalScrapDozens: 50,
      totalWipDozens: 200,
      totalFGDozens: 800,
      totalReturnedDozens: 10,
    };

    it('calculates completion rate and scrap rate correctly', async () => {
      mockRepo.getKPIData.mockResolvedValue(kpiData);

      const result = await svc.getKPIs();

      expect(result.total_orders).toBe(100);
      expect(result.active_orders).toBe(20);
      expect(result.completed_orders).toBe(70);
      expect(result.completion_rate_pct).toBe(70);
      expect(result.scrap_rate_pct).toBe(5);
    });

    it('handles zero totals without division errors', async () => {
      mockRepo.getKPIData.mockResolvedValue({
        ...kpiData,
        totalOrders: 0,
        totalTargetDozens: 0,
      });

      const result = await svc.getKPIs();
      expect(result.completion_rate_pct).toBe(0);
      expect(result.scrap_rate_pct).toBe(0);
    });
  });

  // ── getOrdersReport ─────────────────────────────────────────────────────────

  describe('getOrdersReport', () => {
    it('returns paginated order items', async () => {
      mockRepo.findOrdersReport.mockResolvedValue({
        items: [orderRaw],
        meta: oneItemMeta,
      });

      const result = await svc.getOrdersReport({
        status: 'IN_PRODUCTION',
        page: 1,
        limit: 20,
      });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].order_id).toBe('1');
      expect(result.meta.total).toBe(1);
    });

    it('caps limit at MAX_PAGE_SIZE', async () => {
      mockRepo.findOrdersReport.mockResolvedValue({
        items: [],
        meta: emptyMeta,
      });

      await svc.getOrdersReport({ page: 1, limit: 9999 });

      expect(mockRepo.findOrdersReport).toHaveBeenCalledWith(
        expect.anything(),
        1,
        100,
      );
    });
  });

  // ── getStageReport ──────────────────────────────────────────────────────────

  describe('getStageReport', () => {
    it('returns paginated stage report items', async () => {
      const stageRaw = {
        log_id: BigInt(1),
        order_id: BigInt(1),
        stage_id: BigInt(5),
        line_id: BigInt(2),
        status: StageStatusEnum.COMPLETE,
        input_dozens: { toString: () => '100' },
        output_dozens: { toString: () => '98' },
        scrap_dozens: { toString: () => '2' },
        incomplete_dozens: { toString: () => '0' },
        started_at: new Date(),
        completed_at: new Date(),
      };

      mockRepo.findStageReport.mockResolvedValue({
        items: [stageRaw],
        meta: oneItemMeta,
      });

      const result = await svc.getStageReport({ order_id: '1' });

      expect(result.items).toHaveLength(1);
      expect(result.items[0].log_id).toBe('1');
      expect(result.items[0].scrap_dozens).toBe(2);
    });
  });

  // ── getWipReport ────────────────────────────────────────────────────────────

  describe('getWipReport', () => {
    it('returns paginated WIP items', async () => {
      const wipRaw = {
        wip_id: BigInt(1),
        order_id: BigInt(1),
        line_id: BigInt(2),
        part_id: BigInt(7),
        dozens_in_wip: { toString: () => '30' },
        last_updated: new Date(),
      };

      mockRepo.findWipReport.mockResolvedValue({
        items: [wipRaw],
        meta: oneItemMeta,
      });

      const result = await svc.getWipReport({ order_id: '1' });

      expect(result.items[0].dozens_in_wip).toBe(30);
    });
  });

  // ── getScrapReport ──────────────────────────────────────────────────────────

  describe('getScrapReport', () => {
    it('returns scrap items and total dozens', async () => {
      const scrapRaw = {
        scrap_id: BigInt(1),
        order_id: BigInt(1),
        stage_id: BigInt(3),
        scrap_type: 'DEFECT',
        dozens_scrapped: { toString: () => '5' },
        recorded_at: new Date(),
      };

      mockRepo.findScrapReport.mockResolvedValue({
        items: [scrapRaw],
        total_dozens: 5,
        meta: oneItemMeta,
      });

      const result = await svc.getScrapReport({ order_id: '1' });

      expect(result.items[0].dozens_scrapped).toBe(5);
      expect(result.total_dozens_scrapped).toBe(5);
    });
  });

  // ── getQualityReport ────────────────────────────────────────────────────────

  describe('getQualityReport', () => {
    it('returns paginated quality box items', async () => {
      const boxRaw = {
        box_id: BigInt(1),
        order_id: BigInt(1),
        model_id: BigInt(10),
        color_id: BigInt(3),
        size_id: BigInt(4),
        dozens_available: { toString: () => '60' },
        last_updated: new Date(),
      };

      mockRepo.findQualityReport.mockResolvedValue({
        items: [boxRaw],
        meta: oneItemMeta,
      });

      const result = await svc.getQualityReport({ order_id: '1' });

      expect(result.items[0].dozens_available).toBe(60);
    });
  });

  // ── getPackingReport ────────────────────────────────────────────────────────

  describe('getPackingReport', () => {
    it('returns paginated packing items', async () => {
      const packRaw = {
        packing_order_id: BigInt(100),
        packing_order_no: 'PKG-001',
        production_order_id: BigInt(1),
        status: 'POSTED',
        target_dozens: { toString: () => '100' },
        assembled_dozens: { toString: () => '98' },
        verified_dozens: null,
        created_at: new Date(),
        posted_at: null,
      };

      mockRepo.findPackingReport.mockResolvedValue({
        items: [packRaw],
        meta: oneItemMeta,
      });

      const result = await svc.getPackingReport({ status: 'POSTED' });

      expect(result.items[0].packing_order_no).toBe('PKG-001');
      expect(result.items[0].verified_dozens).toBeNull();
    });
  });

  // ── getFGReport ─────────────────────────────────────────────────────────────

  describe('getFGReport', () => {
    it('returns FG items with totals', async () => {
      const fgRaw = {
        fg_bag_id: BigInt(1),
        model_id: BigInt(10),
        customer_id: BigInt(5),
        warehouse_id: BigInt(2),
        dozens_qty: { toString: () => '200' },
        created_at: new Date(),
      };

      mockRepo.findFGReport.mockResolvedValue({
        items: [fgRaw],
        total_bags: 1,
        total_dozens: 200,
        meta: oneItemMeta,
      });

      const result = await svc.getFGReport({});

      expect(result.items[0].dozens_qty).toBe(200);
      expect(result.total_bags).toBe(1);
      expect(result.total_dozens).toBe(200);
    });
  });

  // ── getSupplementaryReport ──────────────────────────────────────────────────

  describe('getSupplementaryReport', () => {
    it('returns paginated supplementary items with line counts', async () => {
      const supRaw = {
        request_id: BigInt(1),
        request_number: 'SUP-00001',
        order_id: BigInt(1),
        reason_type: 'GENUINE_SHORTAGE',
        status: 'TRANSFERRED',
        requested_at: new Date(),
        transferred_at: new Date(),
        _count: { supplementary_request_lines: 3 },
      };

      mockRepo.findSupplementaryReport.mockResolvedValue({
        items: [supRaw],
        meta: oneItemMeta,
      });

      const result = await svc.getSupplementaryReport({ order_id: '1' });

      expect(result.items[0].request_number).toBe('SUP-00001');
      expect(result.items[0].lines_count).toBe(3);
    });
  });

  // ── getHistoricalReport ─────────────────────────────────────────────────────

  describe('getHistoricalReport', () => {
    it('returns paginated historical orders', async () => {
      mockRepo.findHistoricalReport.mockResolvedValue({
        items: [orderRaw],
        meta: oneItemMeta,
      });

      const result = await svc.getHistoricalReport({
        date_from: '2026-01-01',
        date_to: '2026-12-31',
        status: 'CLOSED',
      });

      expect(result.items[0].order_number).toBe('ORD-001');
    });

    it('passes parsed Date objects to repository', async () => {
      mockRepo.findHistoricalReport.mockResolvedValue({
        items: [],
        meta: emptyMeta,
      });

      await svc.getHistoricalReport({
        date_from: '2026-01-01',
        date_to: '2026-06-30',
      });

      const call = mockRepo.findHistoricalReport.mock.calls[0][0];
      expect(call.date_from).toBeInstanceOf(Date);
      expect(call.date_to).toBeInstanceOf(Date);
    });
  });
});
