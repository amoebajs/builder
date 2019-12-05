import { Injectable } from "../decorators";
import { Path } from "./path";
import { WebpackConfig, IWebpackOptions } from "./webpack-config";

@Injectable()
export abstract class WebpackBuild {
  constructor(protected path: Path, protected config: WebpackConfig) {}
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
