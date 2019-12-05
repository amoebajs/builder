import webpack from "webpack";
import { WebpackBuild, IWebpackOptions } from "../contracts";

export class WebpackBuildProvider extends WebpackBuild {
  public async buildSource(options: IWebpackOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      webpack(this.config.getConfigs(options), (err, stats) => {
        if (err) {
          return reject({ type: "error", error: err });
        }
        if (stats.hasErrors()) {
          return reject({ type: "warning", error: stats.toString() });
        }
        return resolve();
      });
    });
  }
}
