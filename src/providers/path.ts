import { Path } from "../contracts";

export class PathNodeProvider extends Path {
  public join(...paths: string[]): string {
    return require("path").join(...paths);
  }

  public resolve(...paths: string[]): string {
    return require("path").resolve(...paths);
  }
}
