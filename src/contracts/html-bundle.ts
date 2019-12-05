import { Injectable } from "../decorators";
import { Path } from "./path";
import { Fs } from "./fs";

export interface IHtmlEleMatch {
  match: string | RegExp;
  path: string | ((pathname: string) => string);
}

export interface IBundleOptions {
  path: string;
  outPath?: string;
  checkUnchange?: (match: string | RegExp, value: string) => boolean;
  shouldBundle?: (promises: Promise<any>[]) => boolean;
  scripts?: IHtmlEleMatch[];
  styles?: IHtmlEleMatch[];
}

@Injectable()
export abstract class HtmlBundle {
  constructor(protected path: Path, protected fs: Fs) {}
  public abstract build(options: IBundleOptions): Promise<void>;
}
