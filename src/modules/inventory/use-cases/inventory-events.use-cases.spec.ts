import { InventoryEventPublisher } from '../events/inventory-event.publisher';
import { InventoryEventListener } from '../events/inventory-event.listener';
import {
  GoodsReceivedEvent,
  BagReservedEvent,
  ReservationReleasedEvent,
  InventoryAdjustedEvent,
} from '../events/inventory.events';

const mockEmitter = () => ({ emit: jest.fn() });
const mockLogger = () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
});

describe('InventoryEventPublisher', () => {
  let publisher: InventoryEventPublisher;
  let emitter: ReturnType<typeof mockEmitter>;

  beforeEach(() => {
    emitter = mockEmitter();
    publisher = new InventoryEventPublisher(emitter as any);
  });

  it('emits goods_received event with correct name', () => {
    const event = new GoodsReceivedEvent(
      '1',
      'TXN-001',
      '10',
      null,
      '5',
      10,
      '99',
      new Date(),
    );
    publisher.emitGoodsReceived(event);
    expect(emitter.emit).toHaveBeenCalledWith(
      'inventory.goods_received',
      event,
    );
  });

  it('emits bag_reserved event with correct name', () => {
    const event = new BagReservedEvent('1', '5', '10', 5, '99', new Date());
    publisher.emitBagReserved(event);
    expect(emitter.emit).toHaveBeenCalledWith('inventory.bag_reserved', event);
  });

  it('emits reservation_released event with correct name', () => {
    const event = new ReservationReleasedEvent(
      '1',
      '5',
      '10',
      '99',
      new Date(),
    );
    publisher.emitReservationReleased(event);
    expect(emitter.emit).toHaveBeenCalledWith(
      'inventory.reservation_released',
      event,
    );
  });

  it('emits inventory_adjusted event with correct name', () => {
    const event = new InventoryAdjustedEvent(
      '1',
      'ADJ-001',
      '5',
      '10',
      '2',
      -3,
      'DAMAGE',
      '99',
      new Date(),
    );
    publisher.emitInventoryAdjusted(event);
    expect(emitter.emit).toHaveBeenCalledWith('inventory.adjusted', event);
  });
});

describe('InventoryEventListener', () => {
  let listener: InventoryEventListener;
  let logger: ReturnType<typeof mockLogger>;

  beforeEach(() => {
    logger = mockLogger();
    listener = new InventoryEventListener(logger as any);
  });

  it('handles GoodsReceived event and logs debug message', () => {
    const event = new GoodsReceivedEvent(
      '1',
      'TXN-001',
      '10',
      null,
      '5',
      10,
      '99',
      new Date(),
    );
    listener.onGoodsReceived(event);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('[EVT-001]'),
    );
  });

  it('handles BagReserved event and logs debug message', () => {
    const event = new BagReservedEvent('1', '5', '10', 5, '99', new Date());
    listener.onBagReserved(event);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('[EVT-003]'),
    );
  });

  it('handles ReservationReleased event and logs debug message', () => {
    const event = new ReservationReleasedEvent(
      '1',
      '5',
      '10',
      '99',
      new Date(),
    );
    listener.onReservationReleased(event);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('[EVT-004]'),
    );
  });

  it('handles InventoryAdjusted event and logs debug message', () => {
    const event = new InventoryAdjustedEvent(
      '1',
      'ADJ-001',
      '5',
      '10',
      '2',
      -3,
      'DAMAGE',
      '99',
      new Date(),
    );
    listener.onInventoryAdjusted(event);
    expect(logger.debug).toHaveBeenCalledWith(
      expect.stringContaining('[EVT-008]'),
    );
  });
});

describe('Inventory Event Classes', () => {
  it('GoodsReceivedEvent has correct event name', () => {
    const event = new GoodsReceivedEvent(
      '1',
      'TXN-001',
      '10',
      null,
      '5',
      10,
      '99',
      new Date(),
    );
    expect(event.event).toBe('inventory.goods_received');
  });

  it('BagReservedEvent has correct event name', () => {
    const event = new BagReservedEvent('1', '5', '10', 5, '99', new Date());
    expect(event.event).toBe('inventory.bag_reserved');
  });

  it('ReservationReleasedEvent has correct event name', () => {
    const event = new ReservationReleasedEvent(
      '1',
      '5',
      '10',
      '99',
      new Date(),
    );
    expect(event.event).toBe('inventory.reservation_released');
  });

  it('InventoryAdjustedEvent has correct event name', () => {
    const event = new InventoryAdjustedEvent(
      '1',
      'ADJ-001',
      '5',
      '10',
      '2',
      -3,
      'DAMAGE',
      '99',
      new Date(),
    );
    expect(event.event).toBe('inventory.adjusted');
  });
});
