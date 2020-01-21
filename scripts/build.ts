import * as path from "path";
import * as fs from "fs-extra";
import chalk from "chalk";
import webpack from "webpack";
import WebpackDevServer from "webpack-dev-server";
import { Factory } from "../src";
import { IWebpackOptions } from "../src";
import { writeDeptsFile } from "../src/providers/webpack/builder/build.node";

const ENV_MODE = process.env.ENV_MODE || "build";

const configs: IWebpackOptions = { template: { title: "测试" } };

const src = path.resolve(__dirname, "..", "build", "src");
const output = path.resolve(__dirname, "..", "build", "output");

async function build() {
  const builder = new Factory().builder;

  const sandbox = {
    rootPath: path.resolve(__dirname, "..", "build"),
    dependencies: JSON.parse(fs.readFileSync(path.resolve(src, "dependencies.json")).toString()),
  };

  if (ENV_MODE === "watch") {
    const { webpackConfig: config } = builder;

    writeDeptsFile(<any>fs, path, sandbox.rootPath, sandbox.dependencies).then(() => {
      const server = new WebpackDevServer(
        webpack(
          config.getConfigs({
            ...configs,
            minimize: false,
            mode: "development",
            sandbox,
          }),
        ),
        {
          contentBase: output,
          compress: true,
        },
      );

      server.listen(9000, "localhost");
    });
  } else {
    const { webpackPlugins: plugins, htmlBundle: bundle } = builder;

    try {
      await builder.buildSource({
        ...configs,
        output: { path: output },
        plugins: [plugins.createProgressPlugin()],
        sandbox,
      });

      await bundle.build({
        path: path.join(output, "index.html"),
        scripts: [
          { match: "app.js", path: path.join(output, "app.js") },
          { match: "vendor.js", path: path.join(output, "vendor.js") },
        ],
      });
    } catch (error) {
      console.log(chalk.red(error));
    }
  }
}

build();
