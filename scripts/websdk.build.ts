import webpack, { ProgressPlugin } from "webpack";
import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
const config = require("../webpack.config");

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
    console.log(err);
  }
  if (stats.hasErrors()) {
    console.log(stats.toString());
  }
  console.log("success");
  const packagejson = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "..", "package.json"), { encoding: "utf8" }).toString(),
  );
  packagejson.name += "-websdk";
  packagejson.scripts = undefined;
  packagejson.devDependencies = undefined;
  fs.writeFileSync(
    path.resolve(__dirname, "..", "websdk-dist", "package.json"),
    JSON.stringify(packagejson, null, "  "),
    {
      encoding: "utf8",
      flag: "w+",
    },
  );
});
