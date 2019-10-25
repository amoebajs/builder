import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { createTextDivBlock, emitSourceFileSync } from "./utils";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

// 创建一个Jsx语法块的demo
const block = createTextDivBlock("demo", "onClick");

// 将语法块赋值给const变量component，并输出源代码到`build/demo.tsx`
emitSourceFileSync({
  folder: "build",
  filename: "demo.tsx",
  statements: [
    ts.createVariableStatement(
      [],
      ts.createVariableDeclarationList(
        [
          ts.createVariableDeclaration(
            ts.createIdentifier("component"),
            undefined,
            block
          )
        ],
        ts.NodeFlags.Const
      )
    )
  ]
});
