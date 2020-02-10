import { Plugin } from "webpack";
import { Injectable } from "../../core";
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
  compilerOptions: Record<string, any>;
}

export interface IWebpackSandboxOptions {
  rootPath: string;
  dependencies: { [prop: string]: string };
  registry: string;
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
                  compilerOptions: {
                    target: "es5",
                    module: "commonjs",
                    lib: ["es5", "es6", "dom"],
                    jsx: "react",
                    sourceMap: true,
                    esModuleInterop: true,
                    skipLibCheck: true,
                    importHelpers: true,
                    outDir: "build/output",
                    ...options.typescript?.compilerOptions,
                  },
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
