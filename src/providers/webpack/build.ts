import webpack from "webpack";
import { spawn } from "child_process";
import { BasicError } from "../../errors";
import { Injectable } from "../../core/decorators";
import { Path } from "../path";
import { Fs } from "../fs";
import { IWebpackOptions, WebpackConfig } from "./config";

const yarn = /^win/.test(process.platform) ? "yarn.cmd" : "yarn";

@Injectable()
export class WebpackBuild {
  constructor(
    protected path: Path,
    protected fs: Fs,
    protected config: WebpackConfig
  ) {}

  public async buildSource(options: IWebpackOptions): Promise<void> {
    let promise = Promise.resolve(0);
    if (options.sandbox) {
      const sandbox = options.sandbox;
      promise = this.fs
        .writeFile(
          this.path.join(sandbox.rootPath!, "package.json"),
          JSON.stringify(
            {
              dependencies: sandbox.dependencies || {}
            },
            null,
            "  "
          )
        )
        .then(
          () =>
            new Promise((resolve, reject) => {
              spawn(yarn, {
                env: { ...process.env },
                cwd: sandbox.rootPath!,
                stdio: ["pipe", process.stdout, process.stderr]
              }).on("exit", (code, signal) => {
                if (code === 0) {
                  resolve(code);
                } else {
                  reject(
                    new Error(
                      `child process exit with code ${code} [${signal || "-"}]`
                    )
                  );
                }
              });
            })
        );
    }
    return promise.then(
      () =>
        new Promise((resolve, reject) => {
          webpack(this.config.getConfigs(options), (err, stats) => {
            if (err) {
              return reject(new BasicError(err));
            }
            if (stats.hasErrors()) {
              return reject(new BasicError(stats.toString()));
            }
            return resolve();
          });
        })
    );
  }
}
