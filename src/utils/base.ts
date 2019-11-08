import * as fs from "fs";
import * as path from "path";
import ts from "typescript";
import prettier from "prettier";
import { PROJ_ROOT } from "./env";
import { FolderError } from "../errors/folder";

export interface IFileCreateOptions {
  folder: string;
  filename: string;
  statements: ts.Statement[];
}

export interface IPrettierFileCreateOptions extends IFileCreateOptions {
  prettier?: boolean;
}

export const REACT = {
  NS: "React",
  PackageName: "react",
  Props: "props",
  State: "state",
  Component: "Component",
  PureComponent: "PureComponent",
  StatelessComponent: "StatelessComponent",
  Fragment: "React.Fragment",
  Render: "render"
};

const AnyType = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

export const IMPORTS = {
  React: ts.createImportDeclaration(
    [],
    [],
    ts.createImportClause(ts.createIdentifier(REACT.NS), undefined),
    ts.createStringLiteral(REACT.PackageName)
  )
};

export const GenericGen = {
  StatelessComponent(props?: ts.TypeNode) {
    return ts.createTypeReferenceNode(
      ts.createQualifiedName(
        ts.createIdentifier(REACT.NS),
        ts.createIdentifier(REACT.StatelessComponent)
      ),
      [props || AnyType]
    );
  },
  Component(props?: ts.TypeNode, state?: ts.TypeNode, ss?: ts.TypeNode) {
    return ts.createExpressionWithTypeArguments(
      [props || AnyType, state || AnyType, ss || AnyType],
      ts.createPropertyAccess(
        ts.createIdentifier(REACT.NS),
        ts.createIdentifier(REACT.Component)
      )
    );
  },
  PureComponent(props?: ts.TypeNode, state?: ts.TypeNode, ss?: ts.TypeNode) {
    return ts.createExpressionWithTypeArguments(
      [props || AnyType, state || AnyType, ss || AnyType],
      ts.createPropertyAccess(
        ts.createIdentifier(REACT.NS),
        ts.createIdentifier(REACT.PureComponent)
      )
    );
  }
};

export const TYPES = {
  Any: AnyType,
  StatelessComponent: GenericGen.StatelessComponent(),
  Component: GenericGen.Component(),
  PureComponent: GenericGen.PureComponent()
};

export const THIS = {
  Props: ts.createPropertyAccess(
    ts.createThis(),
    ts.createIdentifier(REACT.Props)
  ),
  State: ts.createPropertyAccess(
    ts.createThis(),
    ts.createIdentifier(REACT.State)
  )
};

export const DOMS = {
  Div: "div",
  Span: "span",
  Button: "button",
  Br: "br"
};

export function createReactSourceFile(statements: ts.Statement[]) {
  return (<ts.Statement[]>[IMPORTS.React]).concat(statements);
}

export function emitSourceFileSync(options: IPrettierFileCreateOptions) {
  const dir = path.resolve(process.cwd(), PROJ_ROOT, options.folder);
  if (!fs.existsSync(dir))
    throw new FolderError(`folder [${options.folder}] is not exist.`);
  const printer = ts.createPrinter();
  const sourceFile = createSourceFile(options);
  let sourceString = printer.printFile(sourceFile);
  if (options.prettier !== false) {
    sourceString = prettier.format(sourceString, {
      printWidth: 120,
      parser: "typescript"
    });
  }
  fs.writeFileSync(sourceFile.fileName, sourceString, { flag: "w+" });
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

export function createExportModifier(isExport = false) {
  return !!isExport ? [ts.createModifier(ts.SyntaxKind.ExportKeyword)] : [];
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

export function createValueAttr(value: { [prop: string]: number | string }) {
  const kvs: [string, string | number][] = Object.keys(value).map(k => [
    k,
    value[k]
  ]);
  return ts.createObjectLiteral(
    kvs.map(([n, v]) =>
      typeof v === "number"
        ? ts.createPropertyAssignment(
            ts.createIdentifier(n),
            ts.createNumericLiteral(v.toString())
          )
        : ts.createPropertyAssignment(
            ts.createIdentifier(n),
            ts.createStringLiteral(v)
          )
    ),
    true
  );
}

export function createNamedImport(moduleName: string, names: string[]) {
  return ts.createImportDeclaration(
    [],
    [],
    ts.createImportClause(
      undefined,
      ts.createNamedImports(
        names.map(n =>
          ts.createImportSpecifier(undefined, ts.createIdentifier(n))
        )
      )
    ),
    ts.createStringLiteral(moduleName)
  );
}

export function createDefaultImport(moduleName: string, name: string) {
  return ts.createImportDeclaration(
    [],
    [],
    ts.createImportClause(ts.createIdentifier(name), undefined),
    ts.createStringLiteral(moduleName)
  );
}

export function createThisAccess(name: string): string | ts.JsxExpression {
  return ts.createJsxExpression(
    undefined,
    ts.createPropertyAccess(ts.createThis(), ts.createIdentifier(name))
  );
}

export function createPublicArrow(
  name: string,
  params: ts.ParameterDeclaration[],
  statements: ts.Statement[]
): ts.PropertyDeclaration {
  return ts.createProperty(
    [],
    [],
    ts.createIdentifier(name),
    undefined,
    undefined,
    ts.createArrowFunction(
      [],
      [],
      params,
      undefined,
      ts.createToken(ts.SyntaxKind.EqualsGreaterThanToken),
      ts.createBlock(statements)
    )
  );
}

export function createAnyParameter(name: string): ts.ParameterDeclaration {
  return ts.createParameter(
    [],
    [],
    undefined,
    ts.createIdentifier(name),
    undefined,
    ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)
  );
}

export function exists<T>(arr: T[]) {
  return arr.filter(i => !!i);
}
