import { Injectable } from "../../core/decorators";
import { Path } from "./path.contract";

@Injectable()
export class PathNodeProvider implements Path {
  public join(...paths: string[]): string {
    return require("path").join(...paths);
  }

  public resolve(...paths: string[]): string {
    return require("path").resolve(...paths);
  }
}
