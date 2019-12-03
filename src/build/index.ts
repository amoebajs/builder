import webpack from "webpack";
import fn, { IOptions } from "./webpack.config";

export function buildSource(options: IOptions) {
  return new Promise((resolve, reject) => {
    webpack(fn(options), (err, stats) => {
      if (err) {
        return Promise.reject({ type: "error", error: err });
      }
      if (stats.hasErrors()) {
        return Promise.reject({ type: "warning", error: stats.toString() });
      }
      return Promise.resolve();
    });
  });
}
