import { Injectable } from "../../core";

@Injectable()
export abstract class Prettier {
  public abstract format(sourceString: string, options?: { [prop: string]: any }): string;
}
