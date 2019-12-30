import webpack from "webpack";
import { Injectable } from "../core/decorators";

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
  sandbox?: Partial<{
    rootPath: string;
    dependencies: { [prop: string]: string };
  }>;
}

@Injectable()
export abstract class WebpackConfig {
  public abstract getConfigs(options: IWebpackOptions): webpack.Configuration;
}
