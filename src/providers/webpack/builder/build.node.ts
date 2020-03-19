import webpack from "webpack";
import { spawn } from "child_process";
import { BasicError } from "../../../errors";
import { Injectable } from "../../../core";
import { Path } from "../../path/path.contract";
import { Fs } from "../../fs/fs.contract";
import { IWebpackOptions, WebpackConfig, IWebpackInstallOptions, IWebpackSandboxOptions } from "../config";
import { WebpackBuild } from "./build.contract";

const yarn = /^win/.test(process.platform) ? "yarn.cmd" : "yarn";

@Injectable()
export class WebpackBuildNodeProvider implements WebpackBuild {
  constructor(protected path: Path, protected fs: Fs, protected config: WebpackConfig) {}

  public async buildSource(options: IWebpackOptions): Promise<void> {
    if (options.sandbox !== void 0) {
      await initSandbox(this.fs, this.path, options.sandbox);
    }
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

export async function initSandbox(fs: Fs, path: Path, sandbox: Partial<IWebpackSandboxOptions>) {
  return fs
    .writeFile(
      path.join(sandbox.rootPath!, "package.json"),
      JSON.stringify({ dependencies: sandbox.dependencies! }, null, "  "),
    )
    .then(() => callYarnInstall(sandbox.rootPath!, sandbox.install));
}

function callYarnInstall(root: string, options: Partial<IWebpackInstallOptions> = {}): number | PromiseLike<number> {
  const args: string[] = [];
  if (options.registry !== void 0) args.push(`--registry=${options.registry}`);
  if (options.disturl !== void 0) args.push(`--disturl=${options.disturl}`);
  return new Promise((resolve, reject) => {
    if (options.type === "trigger") {
      const cp = spawn(yarn, args, {
        env: Object.assign({}, process.env),
        cwd: root,
      });
      cp.stdout.on("data", data => {
        options.trigger && options.trigger(data, "stdout");
      });
      cp.stderr.on("data", data => {
        options.trigger && options.trigger(data, "stderr");
      });
      cp.on("exit", (code, signal) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`child process exit with code ${code} [${signal || "-"}]`));
        }
      });
    } else {
      spawn(yarn, args, {
        env: { ...process.env },
        cwd: root,
        stdio: ["pipe", process.stdout, process.stderr],
      }).on("exit", (code, signal) => {
        if (code === 0) {
          resolve(code);
        } else {
          reject(new Error(`child process exit with code ${code} [${signal || "-"}]`));
        }
      });
    }
  });
}
