import { Plugin } from "webpack";
import { Injectable } from "#core/decorators";
import { Path } from "../path/path.contract";
import { IWebpackTemplateOptions, WebpackPlugins } from "./plugins/plugins.contract";

export interface IWebpackEntryOptions {
  app: string;
  vendor: string[];
}

export interface IWebpackOutputOptions {
  path: string;
  filename: string;
}

export interface IWebpackTypeScriptOptions {
  tsconfig: string;
  importPlugins: any[];
}

export interface IWebpackSandboxOptions {
  rootPath: string;
  dependencies: { [prop: string]: string };
}

export interface IWebpackOptions {
  entry?: Partial<IWebpackEntryOptions>;
  output?: Partial<IWebpackOutputOptions>;
  template?: Partial<IWebpackTemplateOptions>;
  typescript?: Partial<IWebpackTypeScriptOptions>;
  sandbox?: Partial<IWebpackSandboxOptions>;
  mode?: "production" | "development";
  minimize?: boolean;
  plugins?: Plugin[];
}

@Injectable()
export class WebpackConfig {
  constructor(protected path: Path, protected plugins: WebpackPlugins) {}

  public getConfigs(options: IWebpackOptions) {
    const projectNodeModules = "node_modules";
    const nodeModules = options.sandbox
      ? [this.path.resolve(options.sandbox.rootPath!, "node_modules"), projectNodeModules]
      : [projectNodeModules];
    return {
      entry: {
        app: "./build/src/main.tsx",
        vendor: ["react", "react-dom"],
        ...options.entry,
      },
      output: {
        path: this.path.resolve(__dirname, "build", "output"),
        filename: "[name].js",
        ...options.output,
      },
      mode: options.mode ?? "production",
      resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        modules: nodeModules,
      },
      optimization: {
        minimize: options.minimize ?? true,
      },
      module: {
        rules: [
          {
            test: /\.css/,
            use: [require.resolve("style-loader"), require.resolve("css-loader")],
          },
          {
            test: /\.tsx?$/,
            use: [
              {
                loader: require.resolve("ts-loader"),
                options: {
                  transpileOnly: true,
                  configFile: options.typescript?.tsconfig ?? "tsconfig.jsx.json",
                  compilerOptions: { module: "es2015" },
                },
              },
            ],
          },
        ],
      },

      plugins: [this.plugins.createTemplatePlugin(options.template)].concat(options.plugins ?? []),
    };
  }
}
