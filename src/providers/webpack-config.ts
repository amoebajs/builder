import { WebpackConfig, IWebpackOptions, Path } from "../contracts";
import transformerFactory from "ts-import-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";
import { Injectable } from "../core/decorators";

@Injectable()
export class WebpackConfigProvider implements WebpackConfig {
  constructor(protected path: Path) {}

  public getConfigs(options: IWebpackOptions) {
    const node_modules = options.sandbox
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
        modules: node_modules
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
                            resolveContext: node_modules,
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
          title: options.template?.title ?? "Index"
        })
      ].concat(options.plugins ?? [])
    };
  }
}
