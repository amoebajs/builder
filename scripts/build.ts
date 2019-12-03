import * as path from "path";
import chalk from "chalk";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { buildSource } from "../src/build";
import fn, { IOptions } from "../src/build/webpack.config";

const ENV_MODE = process.env.ENV_MODE || "build";

const configs: IOptions = { template: { title: "测试" } };

const output = path.resolve(__dirname, "..", "build", "output");

if (ENV_MODE === "watch") {
  const server = new WebpackDevServer(
    webpack(fn({ ...configs, minimize: false, mode: "development" })),
    {
      contentBase: output,
      compress: true
    }
  );
  server.listen(9000, "localhost");
} else {
  buildSource({
    ...configs,
    showProgress: true,
    output: { path: output }
  }).catch(({ type, error }) => {
    console.log(chalk[type === "errror" ? "red" : "yellow"](error));
  });
}
