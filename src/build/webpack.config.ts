import * as path from "path";
import chalk from "chalk";
import webpack from "webpack";
import CopyPlugin from "copy-webpack-plugin";
import transformerFactory from "ts-import-plugin";
import HtmlWebPackPlugin from "html-webpack-plugin";
import { ProgressPlugin } from "webpack";

export interface IOptions {
  entry?: Partial<{
    app: string;
  }>;
  output?: Partial<{
    path: string;
    filename: string;
  }>;
  template?: Partial<{
    title: string;
    path: string;
  }>;
  mode?: "production" | "development";
  minimize?: boolean;
  tsconfig?: string;
  showProgress?: boolean;
}

const buildingStatus = {
  percent: "0",
  stamp: <number | null>null
};

export default (options: IOptions) =>
  <webpack.Configuration>{
    entry: {
      app: options.entry?.app ?? "./build/src/main.tsx",
      vendor: ["react", "react-dom"]
    },
    output: {
      path: options.output?.path ?? path.resolve(__dirname, "build", "output"),
      filename: options.output?.filename ?? "[name].js"
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
                configFile: options.tsconfig ?? "tsconfig.jsx.json",
                getCustomTransformers: () => ({
                  before: [
                    transformerFactory([
                      {
                        libraryName: "zent",
                        libraryDirectory: "es",
                        style: n => n.replace("zent/es", "zent/css") + ".css"
                      }
                    ])
                  ]
                }),
                compilerOptions: {
                  module: "es2015"
                }
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
    ].concat(
      options.showProgress
        ? [
            new ProgressPlugin((percentage, msg) => {
              const percent = (percentage * 100).toFixed(2);
              const stamp = new Date().getTime();
              if (buildingStatus.percent === percent) return;
              if (buildingStatus.stamp === null) {
                buildingStatus.stamp = new Date().getTime();
              }
              const usage = stamp - buildingStatus.stamp;
              buildingStatus.percent = percent;
              console.log(
                `[${(usage / 1000).toFixed(2)}s] ${chalk.green(
                  buildingStatus.percent + "%"
                )} ${msg}`
              );
              if (percent === "100.00") {
                buildingStatus.stamp = null;
                console.log(chalk.blue("[webpack] compile successfully\n"));
              }
            })
          ]
        : []
    )
  };
