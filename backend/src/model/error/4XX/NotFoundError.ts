import { HttpError } from 'src/model/error/HttpError';

/**
 * Not found error class (404)
 */
export class NotFoundError extends HttpError {
  constructor(message?: string) {
    super(404, message ?? 'Not Found');
    this.name = 'NotFoundError';
  }
}
