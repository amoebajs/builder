import webpack from "webpack";
import { WebpackBuild, IWebpackOptions } from "../contracts";
import { BasicError } from "../errors";

export class WebpackBuildProvider extends WebpackBuild {
  public async buildSource(options: IWebpackOptions): Promise<void> {
    return new Promise((resolve, reject) => {
      webpack(this.config.getConfigs(options), (err, stats) => {
        if (err) {
          return reject(new BasicError(err));
        }
        if (stats.hasErrors()) {
          return reject(new BasicError(stats.toString()));
        }
        return resolve();
      });
    });
  }
}
