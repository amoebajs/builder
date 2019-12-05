import webpack from "webpack";
import { Injectable } from "../decorators";
import { WebpackConfig } from "./webpack-config";
import { Path } from "./path";
import { Fs } from "./fs";

@Injectable()
export abstract class WebpackPlugins {
  constructor(
    protected path: Path,
    protected fs: Fs,
    protected config: WebpackConfig
  ) {}

  public abstract createProgressPlugin(): webpack.Plugin;
}
