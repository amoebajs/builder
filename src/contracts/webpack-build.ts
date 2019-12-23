import { Injectable } from "../decorators";
import { IWebpackOptions } from "./webpack-config";

@Injectable()
export abstract class WebpackBuild {
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
