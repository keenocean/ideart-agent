export class AgentRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly data?: unknown;
  readonly headers?: HeadersInit;

  constructor(
    status: number,
    code: string,
    message: string,
    options: { data?: unknown; headers?: HeadersInit } = {}
  ) {
    super(message);
    this.name = 'AgentRequestError';
    this.status = status;
    this.code = code;
    this.data = options.data;
    this.headers = options.headers;
  }
}

export function agentErrorResponse(error: AgentRequestError): Response {
  const headers = new Headers(error.headers);
  headers.set('Content-Type', 'application/json');
  return new Response(
    JSON.stringify({
      code: error.code,
      message: error.message,
      ...(error.data === undefined ? {} : { data: error.data }),
    }),
    { status: error.status, headers }
  );
}
