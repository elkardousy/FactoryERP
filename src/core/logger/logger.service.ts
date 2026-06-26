import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

@Injectable()
export class LoggerService {
  constructor(private readonly logger: PinoLogger) {}

  info(message: string, context?: string): void {
    this.logger.info({ context }, message);
  }

  warn(message: string, context?: string): void {
    this.logger.warn({ context }, message);
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error({ context, trace }, message);
  }

  debug(message: string, context?: string): void {
    this.logger.debug({ context }, message);
  }
}
