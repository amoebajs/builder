export interface IGlobalError extends Error {
  readonly code: number;
  readonly message: string;
  readonly data?: any;
}
