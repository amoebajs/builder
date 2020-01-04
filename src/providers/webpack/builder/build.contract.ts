import { Injectable } from "../../../core/decorators";
import { IWebpackOptions, WebpackConfig } from "../config";

@Injectable()
export abstract class WebpackBuild {
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
