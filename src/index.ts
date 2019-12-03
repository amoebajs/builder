import ts from "typescript";
import {
  emitSourceFileSync,
  createReactSourceFile,
  createReactMainFile
} from "./utils";
import { useModule, createModuleStatements } from "./core";
import { CommonPipeModule } from "./pipes";
import { CommonPageModule } from "./pages";

export { buildSource } from "./build";
export { IOptions as IBuildOptions } from "./build/webpack.config";

useModule(CommonPageModule);
useModule(CommonPipeModule);

export interface IPageCreateOptions {
  page: {
    module: string;
    name: string;
    options?: { [name: string]: any };
    post: Array<{
      module: string;
      name: string;
      args?: { [name: string]: any };
    }>;
  };
}

export async function createSource(
  outDir: string,
  fileName: string,
  configs: IPageCreateOptions
) {
  const compName = "App";
  await emitSourceFileSync({
    folder: outDir,
    filename: fileName + ".tsx",
    statements: createReactSourceFile(
      createModuleStatements({
        module: configs.page.module,
        name: configs.page.name,
        component: compName,
        options: configs.page.options || {},
        post: configs.page.post || []
      })
    )
  });
  await emitSourceFileSync({
    folder: outDir,
    filename: "main.tsx",
    statements: createReactMainFile(compName, fileName)
  });
}
