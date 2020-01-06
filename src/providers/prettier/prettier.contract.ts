import { Injectable } from "../../core/decorators";

@Injectable()
export abstract class Prettier {
  public abstract format(sourceString: string, options?: { [prop: string]: any }): string;
}
