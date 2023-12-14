import { HttpError } from 'src/model/error/HttpError';

/**
 * Bad request error class (400)
 */
export class BadRequestError extends HttpError {
  constructor(message?: string) {
    super(400, message ?? 'Bad Request');
    this.name = 'BadRequestError';
  }
}
