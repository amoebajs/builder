import * as path from "path";
import webpack from "webpack";
// import CopyPlugin from "copy-webpack-plugin";
import transformerFactory from "ts-import-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";

export interface IOptions {
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

export default (options: IOptions) =>
  <webpack.Configuration>{
    entry: {
      app: "./build/src/main.tsx",
      vendor: ["react", "react-dom"],
      ...options.entry
    },
    output: {
      path: path.resolve(__dirname, "build", "output"),
      filename: "[name].js",
      ...options.output
    },
    mode: options.mode ?? "production",
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx", ".json"]
    },
    optimization: {
      minimize: options.minimize ?? true
    },
    module: {
      rules: [
        { test: /\.css/, use: ["style-loader", "css-loader"] },
        {
          test: /\.tsx?$/,
          use: [
            {
              loader: "ts-loader",
              options: {
                transpileOnly: true,
                configFile: options.typescript?.tsconfig ?? "tsconfig.jsx.json",
                compilerOptions: { module: "es2015" },
                getCustomTransformers: () => ({
                  before: [
                    transformerFactory(
                      options.typescript?.importPlugins ?? [
                        {
                          libraryName: "zent",
                          libraryDirectory: "es",
                          style: n => n.replace("zent/es", "zent/css") + ".css"
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
          path.resolve(__dirname, "..", "assets", "index.html"),
        title: options.template?.title ?? "Index"
      })
    ].concat(options.plugins ?? [])
  };
