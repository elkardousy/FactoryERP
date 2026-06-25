import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface ApiResponse<T> {
  data: T;
  statusCode: number;
  timestamp: string;
  path: string;
}

export function serializeBigInts(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, v) => (typeof v === 'bigint' ? v.toString() : v)),
  );
}

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http     = context.switchToHttp();
    const request  = http.getRequest<Request>();
    const response = http.getResponse<Response>();

    return next.handle().pipe(
      map((data: unknown) => {
        if (data === undefined) return undefined;

        return {
          data:       serializeBigInts(data),
          statusCode: response.statusCode,
          timestamp:  new Date().toISOString(),
          path:       request.url,
        };
      }),
    );
  }
}
