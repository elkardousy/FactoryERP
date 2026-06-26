import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentNumberingService } from './document-numbering.service';
import { DocumentNumberingRepository } from './document-numbering.repository';

const MOCK_SEQ = {
  sequence_id: BigInt(1),
  sequence_code: 'PO',
  applies_to_table: 'production_orders',
  pattern_template: 'PO-{YYYY}{MM}-{SEQ:5}',
  reset_frequency: 'MONTHLY',
};

describe('DocumentNumberingService', () => {
  let service: DocumentNumberingService;
  let repo: jest.Mocked<DocumentNumberingRepository>;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        DocumentNumberingService,
        {
          provide: DocumentNumberingRepository,
          useValue: {
            findByCode: jest.fn(),
            nextValue: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(DocumentNumberingService);
    repo = module.get(DocumentNumberingRepository);
  });

  it('throws NotFoundException when sequence code is unknown', async () => {
    repo.findByCode.mockResolvedValue(null);

    await expect(service.generate('UNKNOWN')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('applies template with YYYY, MM, and zero-padded sequence', async () => {
    repo.findByCode.mockResolvedValue(MOCK_SEQ as any);
    repo.nextValue.mockResolvedValue(BigInt(42));

    const result = await service.generate('PO', new Date('2026-06-25'));

    expect(result).toBe('PO-202606-00042');
  });

  it('applies {DD} template token', async () => {
    repo.findByCode.mockResolvedValue({
      ...MOCK_SEQ,
      pattern_template: 'ORD-{YY}{MM}{DD}-{SEQ:4}',
    } as any);
    repo.nextValue.mockResolvedValue(BigInt(7));

    const result = await service.generate('PO', new Date('2026-06-05'));

    expect(result).toBe('ORD-260605-0007');
  });
});
