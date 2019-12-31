import chalk from "chalk";
import { ProgressPlugin, Plugin } from "webpack";
import { Injectable } from "../core/decorators";
import { Path } from "./path";
import { Fs } from "./fs";
import { WebpackConfig } from "./webpack-config";

@Injectable()
export class WebpackPlugins {
  constructor(
    protected path: Path,
    protected fs: Fs,
    protected config: WebpackConfig
  ) {}

  public createProgressPlugin(): Plugin {
    const buildingStatus = {
      percent: "0",
      stamp: <number | null>null
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
      console.log(
        `[${(usage / 1000).toFixed(2)}s] ${chalk.green(
          buildingStatus.percent + "%"
        )} ${msg}`
      );
      if (percent === "100.00") {
        buildingStatus.stamp = null;
        console.log(chalk.blue("[webpack] compile successfully\n"));
      }
    });
  }
}
