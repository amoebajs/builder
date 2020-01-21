import { Injectable } from "#core";
import { IWebpackOptions } from "../config";

@Injectable()
export abstract class WebpackBuild {
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
