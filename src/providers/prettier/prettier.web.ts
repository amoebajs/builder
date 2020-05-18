import { Injectable } from "../../core";
import { Prettier } from "./prettier.contract";

/* eslint-disable @typescript-eslint/no-unused-vars */

@Injectable()
export class PrettierWebProvider implements Prettier {
  public format(sourceString: string, options: { [prop: string]: any } = {}): string {
    throw new Error("not implemented.");
  }
}
