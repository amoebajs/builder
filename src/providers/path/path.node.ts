import * as path from "path";
import { Injectable } from "#core";
import { Path } from "./path.contract";

@Injectable()
export class PathNodeProvider implements Path {
  public join(...paths: string[]): string {
    return path.join(...paths);
  }

  public resolve(...paths: string[]): string {
    return path.resolve(...paths);
  }
}
