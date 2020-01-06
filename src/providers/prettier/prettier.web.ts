import { Injectable } from "../../core/decorators";
import { Prettier } from "./prettier.contract";

@Injectable()
export class PrettierWebProvider implements Prettier {
  public format(sourceString: string, options: { [prop: string]: any } = {}): string {
    throw new Error("not implemented.");
  }
}
