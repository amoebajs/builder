import { Injectable } from "../core/decorators";
import { IWebpackOptions } from "./webpack-config";

@Injectable()
export abstract class WebpackBuild {
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
