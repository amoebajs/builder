import * as path from "path";
import * as fs from "fs";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { Factory, IWebpackOptions } from "../src";
import chalk from "chalk";

const ENV_MODE = process.env.ENV_MODE || "build";

const configs: IWebpackOptions = { template: { title: "测试" } };

const src = path.resolve(__dirname, "..", "build", "src");
const output = path.resolve(__dirname, "..", "build", "output");

async function build() {
  const builder = new Factory().builder;

  if (ENV_MODE === "watch") {
    const { webpackConfig: config } = builder;

    const server = new WebpackDevServer(
      webpack(
        config.getConfigs({
          ...configs,
          minimize: false,
          mode: "development"
        })
      ),
      {
        contentBase: output,
        compress: true
      }
    );

    server.listen(9000, "localhost");
  } else {
    const { webpackPlugins: plugins, htmlBundle: bundle } = builder;

    try {
      await builder.buildSource({
        ...configs,
        output: { path: output },
        plugins: [plugins.createProgressPlugin()],
        sandbox: {
          rootPath: path.resolve(__dirname, "..", "build"),
          dependencies: JSON.parse(
            fs.readFileSync(path.resolve(src, "dependencies.json")).toString()
          )
        }
      });

      await bundle.build({
        path: path.join(output, "index.html"),
        scripts: [
          { match: "app.js", path: path.join(output, "app.js") },
          { match: "vendor.js", path: path.join(output, "vendor.js") }
        ]
      });
    } catch (error) {
      console.log(chalk.red(error));
    }
  }
}

build();
