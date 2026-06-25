import { ApiError } from '../interfaces/api-error.interface';

export class ErrorResponse implements ApiError {
readonly success: false = false;  constructor(
    public readonly statusCode: number,
    public readonly error: string,
    public readonly message: string | string[],
    public readonly path: string,
    public readonly timestamp: string = new Date().toISOString(),
  ) {}
}