import { Injectable } from "../decorators";

@Injectable()
export abstract class Path {
  public abstract join(...paths: string[]): string;
  public abstract resolve(...paths: string[]): string;
}
