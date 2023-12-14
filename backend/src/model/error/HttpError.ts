/**
 * custom Http error class for all Lambda functions
 */
export class HttpError extends Error {
  public status: number;

  constructor(status?: number, message?: string) {
    super(message ?? 'Unknown Error');
    this.status = status ?? 500;
    this.name = 'UnknonwError';
  }
}
