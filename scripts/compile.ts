import * as fs from "fs";
import * as path from "path";
import jsyaml from "js-yaml";
import chalk from "chalk";
import { Factory } from "../src";

const demoConf = jsyaml.load(
  fs.readFileSync(path.resolve(__dirname, "demo.yaml")).toString()
);

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

const buildSrcFolder = path.resolve(process.cwd(), "build", "src");

if (!fs.existsSync(buildSrcFolder)) fs.mkdirSync(buildSrcFolder);

const outDir = path.resolve(process.cwd(), "build", "src");

// new Factory().builder
const builder = new Factory().builder;
// console.log(JSON.stringify(builder["globalMap"].maps, null, "  "));
builder
  .createSource({ configs: demoConf })
  .then(sourceString => {
    fs.writeFileSync(path.resolve(outDir, "main.tsx"), sourceString, {
      encoding: "utf8"
    });
    console.log("emit ---> " + path.resolve(outDir, "main.tsx"));
  })
  .catch(error => {
    console.log(error);
    console.log(chalk.red(error));
  });
