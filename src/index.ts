import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {
  createTextDivBlockArrowFn,
  emitSourceFileSync,
  createTextDivBlockClass,
  createCustomPureClass,
  createReactSourceFile,
  useClassProcessors,
  createSelectPage
} from "./utils";
import { RandomMathProcessor } from "./providers";
import { ExtensivePage, ForkSlotPage } from "./core";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

emitSourceFileSync({
  folder: "build",
  filename: "stateless-component.tsx",
  statements: createReactSourceFile([
    // 创建一个Jsx语法块的demo组件
    createTextDivBlockArrowFn(
      "MyArrowComponent",
      "stateless-demo",
      "onButtonClick",
      true
    )
  ])
});

emitSourceFileSync({
  folder: "build",
  filename: "class-component.tsx",
  statements: createReactSourceFile([
    createTextDivBlockClass(
      "MyClassComponent",
      "class-demo",
      "onButtonClick",
      true
    )
  ])
});

emitSourceFileSync({
  folder: "build",
  filename: "custom-component.tsx",
  statements: useClassProcessors(
    "MyCustomComponent",
    createReactSourceFile([createCustomPureClass("MyCustomComponent", true)]),
    [
      RandomMathProcessor,
      RandomMathProcessor,
      RandomMathProcessor,
      RandomMathProcessor
    ]
  )
});

emitSourceFileSync({
  folder: "build",
  filename: "allin-component.tsx",
  statements: useClassProcessors(
    "MyCustomComponent",
    createReactSourceFile([
      createTextDivBlockArrowFn(
        "MyArrowComponent",
        "stateless-demo",
        "onButtonClick",
        true
      ),
      createTextDivBlockClass(
        "MyClassComponent",
        "class-demo",
        "onButtonClick",
        true
      ),
      createCustomPureClass("MyCustomComponent", true)
    ]),
    [
      RandomMathProcessor,
      RandomMathProcessor,
      RandomMathProcessor,
      RandomMathProcessor
    ]
  )
});

emitSourceFileSync({
  folder: "build",
  filename: "extensive-component.tsx",
  statements: createReactSourceFile([
    createSelectPage("MyComponent", ExtensivePage, true)
  ])
});

emitSourceFileSync({
  folder: "build",
  filename: "forkslot-component.tsx",
  statements: createReactSourceFile([
    createSelectPage("MyComponent", ForkSlotPage, true)
  ])
});
