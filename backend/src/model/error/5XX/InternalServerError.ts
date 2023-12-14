import { HttpError } from 'src/model/error/HttpError';

/**
 * Internal server error class (500)
 */
export class InternalServerError extends HttpError {
  constructor(message?: string) {
    super(500, message ?? 'Internal Server Error');
    this.name = 'InternalServerError';
  }
}
