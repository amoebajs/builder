import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import jsyaml from "js-yaml";
import chalk from "chalk";
import { Factory } from "../src";

// import demo_conf = require("./assets/demo.json");
const demo_conf = jsyaml.load(
  fs.readFileSync("src/assets/demo.yaml").toString()
);

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

const buildSrcFolder = path.resolve(process.cwd(), "build", "src");

if (!fs.existsSync(buildSrcFolder)) fs.mkdirSync(buildSrcFolder);

new Factory().builder
  // const builder = new Factory().builder;
  // console.log(JSON.stringify(builder["globalMap"].maps, null, "  "));
  // builder
  .createSource(
    path.resolve(process.cwd(), "build", "src"),
    "cssgrid-component",
    demo_conf
  )
  .catch(error => {
    console.log(chalk.red(error));
  });
