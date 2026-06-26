import { Injectable, NotFoundException } from '@nestjs/common';
import { DocumentNumberingRepository } from './document-numbering.repository';

@Injectable()
export class DocumentNumberingService {
  constructor(private readonly repo: DocumentNumberingRepository) {}

  async generate(
    sequenceCode: string,
    date: Date = new Date(),
  ): Promise<string> {
    const seq = await this.repo.findByCode(sequenceCode);
    if (!seq) {
      throw new NotFoundException(
        `Number sequence '${sequenceCode}' not found.`,
      );
    }
    const nextVal = await this.repo.nextValue(sequenceCode);
    return this.applyTemplate(seq.pattern_template, nextVal, date);
  }

  private applyTemplate(template: string, value: bigint, date: Date): string {
    const yyyy = date.getFullYear().toString();
    const yy = yyyy.slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');

    return template
      .replace(/\{YYYY\}/g, yyyy)
      .replace(/\{YY\}/g, yy)
      .replace(/\{MM\}/g, mm)
      .replace(/\{DD\}/g, dd)
      .replace(/\{SEQ:(\d+)\}/g, (_match, width: string) =>
        value.toString().padStart(Number(width), '0'),
      );
  }
}
