import { IGlobalError } from "./contract";

export * from "./contract";

function getMessage(message: string | Error): string | undefined {
  return typeof message === "string" ? message : (message && message.message) || "";
}

export class BasicError extends Error implements IGlobalError {
  public code = 4001000;

  constructor(message: Error);
  constructor(message: string);
  constructor(message: string, data: any);
  constructor(message: string | Error, public readonly data?: any) {
    super(getMessage(message));
    if (message instanceof Error) {
      this.stack = message.stack;
    }
  }
}

export class NotFoundError extends BasicError {
  public code = 4001001;
}

export class InvalidOperationError extends BasicError {
  public code = 4001002;
}
