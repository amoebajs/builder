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
  console.log("emit --> " + sourceFile.fileName);
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

export function createReactNamespaceImport() {
  return ts.createImportDeclaration(
    [],
    [],
    ts.createImportClause(ts.createIdentifier("React"), undefined),
    ts.createStringLiteral("react")
  );
}

export function createStatelessReactCompTypeNode() {
  return ts.createTypeReferenceNode(
    ts.createQualifiedName(
      ts.createIdentifier("React"),
      ts.createIdentifier("StatelessComponent")
    ),
    [ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)]
  );
}

export function createConstVariableStatement(
  name: string,
  isExport = false,
  typeNode?: ts.TypeNode,
  initializer?: ts.Expression
) {
  return ts.createVariableStatement(
    isExport ? [ts.createModifier(ts.SyntaxKind.ExportKeyword)] : [],
    ts.createVariableDeclarationList(
      [
        ts.createVariableDeclaration(
          ts.createIdentifier(name),
          typeNode,
          initializer
        )
      ],
      ts.NodeFlags.Const
    )
  );
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

function createTextDivBlockParenExpression(
  text: string,
  onClickRefName: string
) {
  return ts.createParen(
    createJsxElement("div", [], {}, [
      createJsxElement("span", [], {}, [text]),
      createJsxElement("br", [], {}),
      createJsxElement("button", [], {
        onClick: ts.createJsxExpression(
          undefined,
          ts.createPropertyAccess(
            ts.createIdentifier("props"),
            ts.createIdentifier(onClickRefName)
          )
        )
      })
    ])
  );
}

export function createTextDivBlockArrowFn(
  name: string,
  text: string,
  onClickRefName: string,
  isExport = false
) {
  return createConstVariableStatement(
    name,
    isExport,
    createStatelessReactCompTypeNode(),
    ts.createArrowFunction(
      [],
      [],
      [
        ts.createParameter(
          [],
          [],
          undefined,
          ts.createIdentifier("props"),
          undefined,
          ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
        )
      ],
      undefined,
      ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      createTextDivBlockParenExpression(text, onClickRefName)
    )
  );
}

export function createTextDivBlockClass(
  name: string,
  text: string,
  onClickRefName: string,
  isExport = false
) {
  const _ANY = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  return ts.createClassDeclaration(
    [],
    isExport ? [ts.createModifier(ts.SyntaxKind.ExportKeyword)] : [],
    ts.createIdentifier(name),
    [],
    [
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        ts.createExpressionWithTypeArguments(
          [_ANY, _ANY, _ANY],
          ts.createPropertyAccess(
            ts.createIdentifier("React"),
            ts.createIdentifier("PureComponent")
          )
        )
      ])
    ],
    [
      ts.createMethod(
        [],
        [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
        undefined,
        ts.createIdentifier("render"),
        undefined,
        [],
        [],
        undefined,
        ts.createBlock([
          createConstVariableStatement(
            "props",
            false,
            undefined,
            ts.createPropertyAccess(
              ts.createThis(),
              ts.createIdentifier("props")
            )
          ),
          ts.createReturn(
            createTextDivBlockParenExpression(text, onClickRefName)
          )
        ])
      )
    ]
  );
}
