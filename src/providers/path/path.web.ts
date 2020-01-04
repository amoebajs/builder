import { Injectable } from "../../core/decorators";
import { Path } from "./path.contract";

@Injectable()
export class PathWebProvider implements Path {
  public join(...paths: string[]): string {
    throw new Error("not implemented.");
  }

  public resolve(...paths: string[]): string {
    throw new Error("not implemented.");
  }
}
