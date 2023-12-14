import { HttpError } from 'src/model/error/HttpError';

/**
 * Conflit error class (409)
 */
export class ConflictError extends HttpError {
  constructor(message?: string) {
    super(409, message ?? 'Conflict');
    this.name = 'ConflictError';
  }
}
