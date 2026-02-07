/**
 * Custom error classes for the LogicBoxes API client.
 */

/** Options for constructing a LogicBoxesError. */
export interface LogicBoxesErrorOptions {
  statusCode?: number;
  apiStatus?: string;
  apiMessage?: string;
}

/**
 * Base error class for all LogicBoxes API errors.
 */
export class LogicBoxesError extends Error {
  /** HTTP status code, if available. */
  statusCode?: number;

  /** API status field (e.g., "ERROR"). */
  apiStatus?: string;

  /** API error message returned by the LogicBoxes API. */
  apiMessage?: string;

  constructor(message: string, options?: LogicBoxesErrorOptions) {
    super(message);
    this.name = 'LogicBoxesError';
    this.statusCode = options?.statusCode;
    this.apiStatus = options?.apiStatus;
    this.apiMessage = options?.apiMessage;
  }
}

/**
 * Thrown when authentication fails (invalid credentials or IP whitelist rejection).
 */
export class AuthenticationError extends LogicBoxesError {
  constructor(message: string, options?: LogicBoxesErrorOptions) {
    super(message, options);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when a requested entity or record is not found.
 */
export class NotFoundError extends LogicBoxesError {
  constructor(message: string, options?: LogicBoxesErrorOptions) {
    super(message, options);
    this.name = 'NotFoundError';
  }
}

/**
 * Thrown when request parameters are invalid (bad TTL, missing required fields, etc.).
 */
export class ValidationError extends LogicBoxesError {
  constructor(message: string, options?: LogicBoxesErrorOptions) {
    super(message, options);
    this.name = 'ValidationError';
  }
}

/**
 * General API error for cases not covered by a more specific error class.
 */
export class ApiError extends LogicBoxesError {
  constructor(message: string, options?: LogicBoxesErrorOptions) {
    super(message, options);
    this.name = 'ApiError';
  }
}

/**
 * Creates the appropriate LogicBoxesError subclass from an API error response.
 *
 * Inspects the response `status` and `message` fields to determine the error type.
 *
 * @param response - The parsed API response object.
 * @returns A typed LogicBoxesError subclass instance.
 */
export function createErrorFromResponse(
  response: Record<string, unknown>,
): LogicBoxesError {
  const status = response.status as string | undefined;
  const message =
    (response.message as string) ?? 'Unknown API error';
  const options: LogicBoxesErrorOptions = {
    apiStatus: status,
    apiMessage: message,
  };

  if (status !== 'ERROR') {
    return new ApiError(message, options);
  }

  const lowerMessage = message.toLowerCase();

  if (
    lowerMessage.includes('authentication') ||
    lowerMessage.includes('invalid credentials')
  ) {
    return new AuthenticationError(message, options);
  }

  if (
    lowerMessage.includes('no entity found') ||
    lowerMessage.includes('not found')
  ) {
    return new NotFoundError(message, options);
  }

  if (lowerMessage.includes('invalid')) {
    return new ValidationError(message, options);
  }

  return new ApiError(message, options);
}
