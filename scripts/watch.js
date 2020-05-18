const chokidar = require("chokidar");
const chalk = require("chalk");
const path = require("path");
const fs = require("fs-extra");
const child_process = require("child_process");

const yarn = /^win/.test(process.platform) ? "yarn.cmd" : "yarn";

const output = process.argv.find(i => i.startsWith("--output="));

function resolvePaths(paths) {
  return paths.map(i => path.resolve(__dirname, "..", i));
}

function runCompilation() {
  return new Promise(resolve => {
    const start = new Date().getTime();
    child_process
      .spawn(yarn, ["build"], {
        env: process.env,
        cwd: process.cwd(),
        stdio: ["pipe", process.stdout, process.stderr],
      })
      .on("exit", () => {
        console.log(chalk.green(`done in ${((new Date().getTime() - start) / 1000).toFixed(2)}s.`));
        if (output) {
          const [, target] = output.split("=");
          fs.copySync(path.resolve(__dirname, "..", "dist"), path.resolve(__dirname, "..", ...target.split("/")));
        }
        resolve();
      });
  });
}

let watcher;

function fn(files) {
  console.log(chalk.yellow(`file changed --> ${files}`));
  watcher.removeListener("change", fn);
  runCompilation().then(() => watcher.addListener("change", fn));
}

runCompilation().then(() => {
  watcher = chokidar.watch(resolvePaths(["src"]));
  watcher.addListener("change", fn);
});
