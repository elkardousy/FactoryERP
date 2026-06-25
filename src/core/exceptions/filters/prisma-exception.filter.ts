import {
  ArgumentsHost,
  Catch,
  ConflictException,
  ExceptionFilter,
  HttpStatus,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';
import { ErrorResponse } from '../../responses/error-response';
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  catch(
    exception: Prisma.PrismaClientKnownRequestError,
    host: ArgumentsHost,
  ): void {
    const ctx = host.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let error: Error;

    switch (exception.code) {
      case 'P2002':
        error = new ConflictException('Record already exists.');
        break;

      case 'P2025':
        error = new NotFoundException('Record not found.');
        break;

      case 'P2003':
        error = new BadRequestException('Foreign key constraint failed.');
        break;

      case 'P2014':
        error = new ConflictException('Relation constraint failed.');
        break;

      default:
        response.status(HttpStatus.INTERNAL_SERVER_ERROR).json(
          new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR,
            'DatabaseError',
            exception.message,
            request.url,
          ),
        );
        return;
    }

    response.status((error as any).getStatus()).json(
      new ErrorResponse(
        (error as any).getStatus(),
        error.name,
        (error as any).message,
        request.url,
      ),
    );
  }
}