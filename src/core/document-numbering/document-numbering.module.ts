import { Global, Module } from '@nestjs/common';
import { DocumentNumberingRepository } from './document-numbering.repository';
import { DocumentNumberingService } from './document-numbering.service';

@Global()
@Module({
  providers: [DocumentNumberingRepository, DocumentNumberingService],
  exports: [DocumentNumberingRepository, DocumentNumberingService],
})
export class DocumentNumberingModule {}
