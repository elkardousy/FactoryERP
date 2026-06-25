import { of } from 'rxjs';
import type { ExecutionContext, CallHandler } from '@nestjs/common';
import { ResponseInterceptor, serializeBigInts } from './response.interceptor';

function makeContext(url = '/v1/auth/login', statusCode = 200): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest:  () => ({ url }),
      getResponse: () => ({ statusCode }),
    }),
  } as unknown as ExecutionContext;
}

function makeHandler(data: unknown): CallHandler {
  return { handle: () => of(data) } as CallHandler;
}

describe('serializeBigInts', () => {
  it('converts a top-level BigInt to string', () => {
    expect(serializeBigInts({ id: BigInt(42) })).toEqual({ id: '42' });
  });

  it('converts nested BigInt values', () => {
    const input  = { user: { userId: BigInt(1), name: 'alice' }, sessionId: BigInt(99) };
    const output = serializeBigInts(input);
    expect(output).toEqual({ user: { userId: '1', name: 'alice' }, sessionId: '99' });
  });

  it('converts BigInt values inside arrays', () => {
    expect(serializeBigInts({ ids: [BigInt(1), BigInt(2)] })).toEqual({ ids: ['1', '2'] });
  });

  it('passes non-BigInt primitives through unchanged', () => {
    expect(serializeBigInts({ n: 42, s: 'hello', b: true, nil: null })).toEqual({
      n: 42, s: 'hello', b: true, nil: null,
    });
  });
});

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
  });

  it('wraps a success response in an envelope with data, statusCode, timestamp, and path', (done) => {
    const data    = { userId: '1', username: 'alice' };
    const context = makeContext('/v1/auth/login', 200);
    const handler = makeHandler(data);

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toMatchObject({
        data:       data,
        statusCode: 200,
        path:       '/v1/auth/login',
      });
      expect(typeof (result as { timestamp: string }).timestamp).toBe('string');
      done();
    });
  });

  it('serializes BigInt values inside the response data', (done) => {
    const data    = { userId: BigInt(1), sessionId: BigInt(42) };
    const context = makeContext('/v1/auth/login', 200);
    const handler = makeHandler(data);

    interceptor.intercept(context, handler).subscribe((result) => {
      expect((result as { data: { userId: string; sessionId: string } }).data).toEqual({
        userId:    '1',
        sessionId: '42',
      });
      done();
    });
  });

  it('passes through undefined (204 No Content — no body)', (done) => {
    const context = makeContext('/v1/auth/logout', 204);
    const handler = makeHandler(undefined);

    interceptor.intercept(context, handler).subscribe((result) => {
      expect(result).toBeUndefined();
      done();
    });
  });
});
