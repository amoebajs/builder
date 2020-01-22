import webpack from "webpack";
import { spawn } from "child_process";
import { BasicError } from "#errors";
import { Injectable } from "#core";
import { Path } from "../../path/path.contract";
import { Fs } from "../../fs/fs.contract";
import { IWebpackOptions, WebpackConfig } from "../config";
import { WebpackBuild } from "./build.contract";

const yarn = /^win/.test(process.platform) ? "yarn.cmd" : "yarn";

@Injectable()
export class WebpackBuildNodeProvider implements WebpackBuild {
  constructor(protected path: Path, protected fs: Fs, protected config: WebpackConfig) {}

  public async buildSource(options: IWebpackOptions): Promise<void> {
    let promise = Promise.resolve(0);
    if (options.sandbox) {
      const sandbox = options.sandbox;
      promise = writeDeptsFile(this.fs, this.path, sandbox.rootPath!, sandbox.dependencies, sandbox.registry);
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
        }),
    );
  }
}

export async function writeDeptsFile(
  fs: Fs,
  path: Path,
  rootPath: string,
  dependencies: { [prop: string]: string } = {},
  registry?: string,
) {
  return fs
    .writeFile(path.join(rootPath, "package.json"), JSON.stringify({ dependencies }, null, "  "))
    .then(() => callYarnInstall(rootPath, registry));
}

function callYarnInstall(sandboxPath: string, registry?: string): number | PromiseLike<number> {
  const args: string[] = [];
  if (registry) args.push(`--registry=${registry}`);
  return new Promise((resolve, reject) => {
    spawn(yarn, args, {
      env: { ...process.env },
      cwd: sandboxPath,
      stdio: ["pipe", process.stdout, process.stderr],
    }).on("exit", (code, signal) => {
      if (code === 0) {
        resolve(code);
      } else {
        reject(new Error(`child process exit with code ${code} [${signal || "-"}]`));
      }
    });
  });
}
