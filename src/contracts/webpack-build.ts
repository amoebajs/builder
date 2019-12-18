import { Injectable } from "../decorators";
import { Path } from "./path";
import { Fs } from "./fs";
import { WebpackConfig, IWebpackOptions } from "./webpack-config";

@Injectable()
export abstract class WebpackBuild {
  constructor(
    protected path: Path,
    protected fs: Fs,
    protected config: WebpackConfig
  ) {}
  public abstract buildSource(options: IWebpackOptions): Promise<void>;
}
