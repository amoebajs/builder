import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {
  emitSourceFileSync,
  createReactSourceFile,
  createReactMainFile
} from "./utils";
import { useModule, createModuleStatements } from "./core";
import { CommonPipeModule } from "./pipes";
import { CommonPageModule } from "./pages";

import demo_conf = require("./assets/demo.json");

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

const buildSrcFolder = path.resolve(process.cwd(), "build", "src");

if (!fs.existsSync(buildSrcFolder)) fs.mkdirSync(buildSrcFolder);

useModule(CommonPageModule);
useModule(CommonPipeModule);

export interface IPageCreateOptions {
  page: {
    template: string;
    name: string;
    options?: { [name: string]: any };
    post: Array<{
      name: string;
      args?: { [name: string]: any };
    }>;
  };
}

function createSource(
  outDir: string,
  fileName: string,
  configs: IPageCreateOptions
) {
  emitSourceFileSync({
    folder: outDir,
    filename: fileName + ".tsx",
    statements: createReactSourceFile(
      createModuleStatements({
        name: configs.page.name,
        page: configs.page.template,
        options: configs.page.options || {},
        post: configs.page.post || []
      })
    )
  });
  emitSourceFileSync({
    folder: outDir,
    filename: "main.tsx",
    statements: createReactMainFile(configs.page.name, fileName)
  });
}

createSource(path.join("build", "src"), "cssgrid-component", demo_conf);
