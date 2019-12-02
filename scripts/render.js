const path = require("path");
const chalk = require("chalk");
const webpack = require("webpack");
const WebpackDevServer = require("webpack-dev-server");

const ENV_MODE = process.env.ENV_MODE || "build";

const configs = { title: "测试" };

if (ENV_MODE === "watch") {
  const server = new WebpackDevServer(
    webpack(require("../webpack.dev")(configs)),
    {
      contentBase: "./build/output",
      compress: true
    }
  );
  server.listen(9000, "localhost");
} else {
  webpack(require("../webpack.config")(configs), (err, stats) => {
    if (err) {
      console.log(chalk.red(err));
      return;
    }
    if (stats.hasErrors()) {
      const err = stats.toString();
      console.log(chalk.yellow(err));
      return;
    }
  });
}
