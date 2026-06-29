import { InventoryIntegrationService } from '../services/inventory-integration.service';

const makeBag = (overrides: Partial<any> = {}) => ({
  bag_id: BigInt(1),
  bag_code: 'BAG-001',
  container_id: BigInt(1),
  audit_item_id: null,
  customer_id: BigInt(1),
  model_id: BigInt(1),
  part_id: BigInt(2),
  received_dozens: '10.000',
  current_dozens: '10.000',
  current_warehouse_id: null,
  current_order_id: BigInt(5),
  status: 'IN_WIP',
  received_date: new Date('2026-01-01'),
  created_by: BigInt(10),
  created_at: new Date('2026-01-01T00:00:00Z'),
  updated_at: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

const makeWip = (overrides: Partial<any> = {}) => ({
  wip_id: BigInt(1),
  order_id: BigInt(5),
  line_id: BigInt(3),
  part_id: BigInt(2),
  dozens_in_wip: '10.000',
  version: BigInt(0),
  last_updated: new Date('2026-01-01T00:00:00Z'),
  ...overrides,
});

describe('InventoryIntegrationService', () => {
  let service: InventoryIntegrationService;
  let integrationRepo: jest.Mocked<any>;

  beforeEach(() => {
    integrationRepo = {
      findPhysicalBagsForOrder: jest.fn().mockResolvedValue([makeBag()]),
      findWipPositionsForOrder: jest.fn().mockResolvedValue([makeWip()]),
      findAllWipPositions: jest.fn().mockResolvedValue([makeWip()]),
    };

    service = new InventoryIntegrationService(integrationRepo);
  });

  it('getOrderInventoryContext returns combined context with totals', async () => {
    const result = await service.getOrderInventoryContext(BigInt(5));
    expect(result.order_id).toBe('5');
    expect(result.physical_bags).toHaveLength(1);
    expect(result.physical_bags[0].bag_code).toBe('BAG-001');
    expect(result.wip_positions).toHaveLength(1);
    expect(result.total_bags_in_wip).toBe(1);
    expect(result.total_dozens_in_wip).toBe('10.000');
  });

  it('getOrderInventoryContext with no bags returns zero totals', async () => {
    (integrationRepo.findPhysicalBagsForOrder as jest.Mock).mockResolvedValue(
      [],
    );
    (integrationRepo.findWipPositionsForOrder as jest.Mock).mockResolvedValue(
      [],
    );
    const result = await service.getOrderInventoryContext(BigInt(99));
    expect(result.total_bags_in_wip).toBe(0);
    expect(result.total_dozens_in_wip).toBe('0.000');
    expect(result.physical_bags).toHaveLength(0);
    expect(result.wip_positions).toHaveLength(0);
  });

  it('getOrderInventoryContext maps bag fields correctly', async () => {
    const bag = makeBag({ current_warehouse_id: BigInt(7) });
    (integrationRepo.findPhysicalBagsForOrder as jest.Mock).mockResolvedValue([
      bag,
    ]);
    const result = await service.getOrderInventoryContext(BigInt(5));
    const mapped = result.physical_bags[0];
    expect(mapped.bag_id).toBe('1');
    expect(mapped.part_id).toBe('2');
    expect(mapped.status).toBe('IN_WIP');
    expect(mapped.current_warehouse_id).toBe('7');
  });

  it('getOrderInventoryContext sums multiple wip positions', async () => {
    (integrationRepo.findWipPositionsForOrder as jest.Mock).mockResolvedValue([
      makeWip({ dozens_in_wip: '10.000' }),
      makeWip({
        wip_id: BigInt(2),
        part_id: BigInt(3),
        dozens_in_wip: '5.500',
      }),
    ]);
    const result = await service.getOrderInventoryContext(BigInt(5));
    expect(result.total_dozens_in_wip).toBe('15.500');
  });

  it('listWipPositions returns all positions', async () => {
    const result = await service.listWipPositions();
    expect(result).toHaveLength(1);
    expect(result[0].wip_id).toBe('1');
    expect(result[0].order_id).toBe('5');
    expect(result[0].dozens_in_wip).toBe('10.000');
    expect(integrationRepo.findAllWipPositions).toHaveBeenCalledWith(undefined);
  });

  it('listWipPositions passes orderId filter to repo', async () => {
    await service.listWipPositions(BigInt(5));
    expect(integrationRepo.findAllWipPositions).toHaveBeenCalledWith(BigInt(5));
  });
});
