import { Injectable } from "../../core";
import { Path } from "./path.contract";

/* eslint-disable @typescript-eslint/no-unused-vars */

@Injectable()
export class PathWebProvider implements Path {
  public join(...paths: string[]): string {
    throw new Error("not implemented.");
  }

  public resolve(...paths: string[]): string {
    throw new Error("not implemented.");
  }
}
