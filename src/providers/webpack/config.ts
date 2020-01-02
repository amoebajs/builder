import webpack from "webpack";
import transformerFactory from "ts-import-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";
import { Injectable } from "../../core/decorators";
import { Path } from "../path";

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
    charset: string;
    stylesheets: { href: string }[];
    scripts: { src: string }[];
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

const defaultScripts: any[] = [];

const defaultStyleSheets = [
  {
    href:
      "https://cdnjs.cloudflare.com/ajax/libs/normalize/8.0.1/normalize.min.css"
  }
];

@Injectable()
export class WebpackConfig {
  constructor(protected path: Path) {}

  public getConfigs(options: IWebpackOptions) {
    const nodeModules = options.sandbox
      ? [this.path.resolve(options.sandbox.rootPath!, "node_modules")]
      : undefined;
    return {
      entry: {
        app: "./build/src/main.tsx",
        vendor: ["react", "react-dom"],
        ...options.entry
      },
      output: {
        path: this.path.resolve(__dirname, "build", "output"),
        filename: "[name].js",
        ...options.output
      },
      mode: options.mode ?? "production",
      resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        modules: nodeModules
      },
      optimization: {
        minimize: options.minimize ?? true
      },
      module: {
        rules: [
          {
            test: /\.css/,
            use: [
              require.resolve("style-loader"),
              require.resolve("css-loader")
            ]
          },
          {
            test: /\.tsx?$/,
            use: [
              {
                loader: require.resolve("ts-loader"),
                options: {
                  transpileOnly: true,
                  configFile:
                    options.typescript?.tsconfig ?? "tsconfig.jsx.json",
                  compilerOptions: { module: "es2015" },
                  getCustomTransformers: () => ({
                    before: [
                      transformerFactory(
                        options.typescript?.importPlugins ?? [
                          {
                            libraryName: "zent",
                            libraryDirectory: "es",
                            resolveContext: nodeModules,
                            style: n =>
                              n.replace("zent/es", "zent/css") + ".css"
                          }
                        ]
                      )
                    ]
                  })
                }
              }
            ]
          }
        ]
      },

      plugins: [
        new HtmlWebPackPlugin({
          template:
            options.template?.path ??
            this.path.resolve(__dirname, "..", "assets", "index.html"),
          title: options.template?.title ?? "Index",
          charset: options.template?.charset ?? "utf-8",
          stylesheets: (options.template?.stylesheets ?? defaultStyleSheets)
            .map(sheet => `<link rel="stylesheet" href="${sheet.href}"/>`)
            .join("\n"),
          scriptList: (options.template?.scripts ?? defaultScripts)
            .map(script => `<script src="${script.src}"></script>`)
            .join("\n")
        })
      ].concat(options.plugins ?? [])
    };
  }
}
