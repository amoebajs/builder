import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {
  createTextDivBlock,
  emitSourceFileSync,
  createReactNamespaceImport,
  createStatelessReactCompTypeNode,
  createConstVariableStatement
} from "./utils";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

// 将语法块赋值给const变量component，并输出源代码到`build/demo.tsx`
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
      createTextDivBlock("demo", "onButtonClick")
    )
  ]
});
