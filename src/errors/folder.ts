import { IGlobalError } from "./contract";

export class FolderError extends Error implements IGlobalError {
  public code = 4001001;
  constructor(message?: string) {
    super(message);
  }
}
