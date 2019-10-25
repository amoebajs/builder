import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import { PROJ_ROOT } from "./env";
import { FolderError } from "../errors/folder";

export interface IFileCreateOptions {
  folder: string;
  filename: string;
  statements: ts.Statement[];
}

export function emitSourceFileSync(options: IFileCreateOptions) {
  const dir = path.resolve(process.cwd(), PROJ_ROOT, options.folder);
  if (!fs.existsSync(dir))
    throw new FolderError(`folder [${options.folder}] is not exist.`);
  const printer = ts.createPrinter();
  const sourceFile = createSourceFile(options);
  fs.writeFileSync(sourceFile.fileName, printer.printFile(sourceFile), {
    flag: "w+"
  });
}

export function createSourceFile(options: IFileCreateOptions) {
  const dir = path.resolve(process.cwd(), PROJ_ROOT, options.folder);
  if (!fs.existsSync(dir))
    throw new FolderError(`folder [${options.folder}] is not exist.`);
  const sourceFile = ts.createSourceFile(
    path.join(dir, options.filename),
    "",
    ts.ScriptTarget.ES2017
  );
  return ts.updateSourceFileNode(sourceFile, options.statements);
}

interface IJsxAttrs {
  [key: string]: ts.JsxExpression | string;
}

export function createJsxElement(
  tagName: string,
  types: ts.TypeNode[],
  attrs: IJsxAttrs,
  children?: (ts.JsxChild | string)[]
) {
  return ts.createJsxElement(
    ts.createJsxOpeningElement(
      ts.createIdentifier(tagName),
      types,
      ts.createJsxAttributes(
        Object.keys(attrs).map(k =>
          ts.createJsxAttribute(
            ts.createIdentifier(k),
            typeof attrs[k] === "string"
              ? ts.createStringLiteral(<string>attrs[k])
              : <ts.JsxExpression>attrs[k]
          )
        )
      )
    ),
    (children || []).map(i =>
      typeof i === "string" ? ts.createJsxText(i) : i
    ),
    ts.createJsxClosingElement(ts.createIdentifier(tagName))
  );
}

export function createTextDivBlock(text: string, onClickRefName: string) {
  return ts.createParen(
    createJsxElement("div", [], {}, [
      createJsxElement("span", [], {}, [text]),
      createJsxElement("br", [], {}),
      createJsxElement("button", [], {
        onClick: ts.createJsxExpression(
          undefined,
          ts.createPropertyAccess(
            ts.createThis(),
            ts.createIdentifier(onClickRefName)
          )
        )
      })
    ])
  );
}
