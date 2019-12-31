import { Injectable } from "../core/decorators";

@Injectable()
export class Path {
  public join(...paths: string[]): string {
    return require("path").join(...paths);
  }

  public resolve(...paths: string[]): string {
    return require("path").resolve(...paths);
  }
}
