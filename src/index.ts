import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {
  createTextDivBlockArrowFn,
  emitSourceFileSync,
  createReactNamespaceImport,
  createTextDivBlockClass,
  createCustomPureClass
} from "./utils";
import { RandomMathProvider } from "./providers";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

emitSourceFileSync({
  folder: "build",
  filename: "stateless-component.tsx",
  statements: [
    // 创建React导入声明语句
    createReactNamespaceImport(),
    // 创建一个Jsx语法块的demo组件
    createTextDivBlockArrowFn(
      "MyArrowComponent",
      "stateless-demo",
      "onButtonClick",
      true
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

emitSourceFileSync({
  folder: "build",
  filename: "custom-component.tsx",
  statements: [
    // 创建React导入声明语句
    createReactNamespaceImport(),
    createCustomPureClass(
      "MyCustomComponent",
      [
        RandomMathProvider,
        RandomMathProvider,
        RandomMathProvider,
        RandomMathProvider
      ],
      true
    )
  ]
});
