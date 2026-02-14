const httpConfig = () => ({
  // Success responses
  /** 200 - The request succeeded */
  OK: 200,
  /** 201 - The request succeeded and a new resource was created */
  CREATED: 201,
  /** 202 - The request has been accepted for processing, but processing has not been completed */
  ACCEPTED: 202,
  /** 204 - The request succeeded but there's no content to return */
  NO_CONTENT: 204,

  // Client error responses
  /** 400 - The server cannot process the request due to client error (e.g., malformed syntax, invalid request) */
  BAD_REQUEST: 400,
  /** 401 - Authentication is required and has failed or has not been provided */
  UNAUTHORIZED: 401,
  /** 403 - The server understood the request but refuses to authorize it (insufficient permissions) */
  FORBIDDEN: 403,
  /** 404 - The requested resource could not be found */
  NOT_FOUND: 404,
  /** 405 - The request method is not supported for the requested resource */
  METHOD_NOT_ALLOWED: 405,
  /** 409 - The request conflicts with the current state of the server (e.g., duplicate resource) */
  CONFLICT: 409,
  /** 413 - The request conflicts indicates that the request entity was larger than limits defined by server. */
  CONTENT_TOO_LARGE: 413,
  /** 422 - The request was well-formed but contains semantic errors */
  UNPROCESSABLE_ENTITY: 422,
  /** 429 - The user has sent too many requests in a given amount of time (rate limiting) */
  TOO_MANY_REQUESTS: 429,

  // Server error responses
  /** 500 - The server encountered an unexpected condition that prevented it from fulfilling the request */
  INTERNAL_SERVER_ERROR: 500,
  /** 501 - The server does not support the functionality required to fulfill the request */
  NOT_IMPLEMENTED: 501,
  /** 502 - The server received an invalid response from an upstream server */
  BAD_GATEWAY: 502,
  /** 503 - The server is temporarily unable to handle the request (maintenance or overload) */
  SERVICE_UNAVAILABLE: 503,
  /** 504 - The server did not receive a timely response from an upstream server */
  GATEWAY_TIMEOUT: 504,
});

export const HTTPSTATUS = httpConfig();

export type HttpStatusCode = (typeof HTTPSTATUS)[keyof typeof HTTPSTATUS];
