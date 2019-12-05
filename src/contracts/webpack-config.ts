import webpack from "webpack";
import { Injectable } from "../decorators";
import { Path } from "./path";

export interface IWebpackOptions {
  entry?: Partial<{
    app: string;
    vendor: string[];
  }>;
  output?: Partial<{
    path: string;
    filename: string;
  }>;
  template?: Partial<{
    title: string;
    path: string;
  }>;
  typescript?: Partial<{
    tsconfig: string;
    importPlugins: any[];
  }>;
  mode?: "production" | "development";
  minimize?: boolean;
  plugins?: webpack.Plugin[];
}

@Injectable()
export abstract class WebpackConfig {
  constructor(protected path: Path) {}
  public abstract getConfigs(options: IWebpackOptions): webpack.Configuration;
}
