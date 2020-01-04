import { Injectable } from "../core/decorators";

@Injectable()
export class Prettier {
  public format(sourceString: string, options: { [prop: string]: any } = {}) {
    return require("prettier").format(sourceString, options);
  }
}
