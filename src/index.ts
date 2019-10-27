import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {
  createTextDivBlockArrowFn,
  emitSourceFileSync,
  createReactNamespaceImport,
  createStatelessReactCompTypeNode,
  createConstVariableStatement,
  createTextDivBlockClass
} from "./utils";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

emitSourceFileSync({
  folder: "build",
  filename: "stateless-component.tsx",
  statements: [
    // 创建React导入声明语句
    createReactNamespaceImport(),
    // 创建一个Jsx语法块的demo组件
    createConstVariableStatement(
      // 组件名称
      "MyCompnent",
      // named导出组件
      true,
      // 创建stateless组件类型node
      createStatelessReactCompTypeNode(),
      // 组件逻辑
      createTextDivBlockArrowFn("stateless-demo", "onButtonClick")
    )
  ]
});

emitSourceFileSync({
  folder: "build",
  filename: "class-component.tsx",
  statements: [
    // 创建React导入声明语句
    createReactNamespaceImport(),
    createTextDivBlockClass(
      "MyClassComponent",
      "class-demo",
      "onButtonClick",
      true
    )
  ]
});
