import * as path from "path";
import chalk from "chalk";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { createProgressPlugin, buildHtmlBundle } from "../src/build";
import { Factory } from "../src";
import fn, { IOptions } from "../src/build/webpack.config";

const ENV_MODE = process.env.ENV_MODE || "build";

const configs: IOptions = { template: { title: "测试" } };

const output = path.resolve(__dirname, "..", "build", "output");

async function build() {
  const factory = new Factory();

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
    await factory.builder
      .buildSource({
        ...configs,
        output: { path: output },
        plugins: [createProgressPlugin()]
      })
      .catch(({ type, error }) => {
        console.log(chalk[type === "errror" ? "red" : "yellow"](error));
      });
    await buildHtmlBundle({
      path: path.join(output, "index.html"),
      scripts: [
        { match: "app.js", path: path.join(output, "app.js") },
        { match: "vendor.js", path: path.join(output, "vendor.js") }
      ]
    });
  }
}

build();
