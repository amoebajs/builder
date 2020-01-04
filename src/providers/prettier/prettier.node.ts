import { Injectable } from "../../core/decorators";
import { Prettier } from "./prettier.contract";

@Injectable()
export class PrettierNodeProvider implements Prettier {
  public format(sourceString: string, options: { [prop: string]: any } = {}) {
    return require("prettier").format(sourceString, options);
  }
}
