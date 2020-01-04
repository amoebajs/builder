import webpack, { ProgressPlugin } from "webpack";
import chalk from "chalk";
import * as fs from "fs-extra";
import * as path from "path";
const config = require("../../webpack.config");

const typings = [`import * as BuilderSdk from "./index.websdk";`, `export { BuilderSdk };`];

function createrPlugin() {
  const buildingStatus = {
    percent: "0",
    stamp: <number | null>null,
  };
  return new ProgressPlugin((percentage, msg) => {
    const percent = (percentage * 100).toFixed(2);
    const stamp = new Date().getTime();
    if (buildingStatus.percent === percent) return;
    if (buildingStatus.stamp === null) {
      buildingStatus.stamp = new Date().getTime();
    }
    const usage = stamp - buildingStatus.stamp;
    buildingStatus.percent = percent;
    console.log(`[${(usage / 1000).toFixed(2)}s] ${chalk.green(buildingStatus.percent + "%")} ${msg}`);
    if (percent === "100.00") {
      buildingStatus.stamp = null;
      console.log(chalk.blue("[webpack] compile successfully\n"));
    }
  });
}

webpack({ ...config, plugins: [...config.plugins, createrPlugin()] }, (err, stats) => {
  if (err) {
    throw err;
  }
  if (stats.hasErrors()) {
    throw new Error(stats.toString());
  }

  fs.writeFileSync(path.resolve(__dirname, "..", "..", "websdk-dist", "index.d.ts"), typings.join("\n"), {
    encoding: "utf8",
    flag: "w+",
  });
});
