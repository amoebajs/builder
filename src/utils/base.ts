import * as fs from "fs-extra";
import * as path from "path";
import ts from "typescript";
import chalk from "chalk";
import prettier from "prettier";
import { NotFoundError, BasicError } from "../errors";

export interface IFileCreateOptions {
  folder?: string;
  filename?: string;
  emit?: (str: string) => void;
  statements: ts.Statement[] | ts.NodeArray<ts.Statement>;
}

export interface IPrettierFileCreateOptions extends IFileCreateOptions {
  prettier?: boolean;
}

export const REACT = {
  NS: "React",
  DomNS: "ReactDOM",
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

export async function emitSourceFileSync(options: IPrettierFileCreateOptions) {
  return new Promise<void>(async (resolve, reject) => {
    if (!options.folder) {
      const sourceString = await compileAndPrettier(options, () => {}, reject);
      options.emit && options.emit(sourceString);
    } else {
      fs.pathExists(options.folder).then(async exist => {
        if (!exist) {
          reject(new NotFoundError(`folder [${options.folder}] is not exist.`));
        } else {
          let sourceFile!: ts.SourceFile;
          const sourceString = await compileAndPrettier(
            options,
            s => (sourceFile = s),
            reject
          );
          fs.writeFile(
            sourceFile.fileName,
            sourceString,
            { flag: "w+" },
            error => {
              if (error) {
                console.log(sourceString);
                console.log(chalk.red("write source file failed"));
                return reject(new BasicError(error));
              }
              console.log("emit --> " + sourceFile.fileName);
              resolve();
            }
          );
        }
      });
    }
  });
}

async function compileAndPrettier(
  options: IPrettierFileCreateOptions,
  onEmit: (sourceFile: ts.SourceFile) => void,
  onError: (reason?: any) => void
) {
  const printer = ts.createPrinter();
  const sourceFile = await createSourceFile(options);
  onEmit(sourceFile);
  let sourceString = printer.printFile(sourceFile);
  try {
    return getPrettierAfterString(options, sourceString);
  } catch (error) {
    onError(error);
    return sourceString;
  }
}

function getPrettierAfterString(
  options: IPrettierFileCreateOptions,
  sourceString: string
) {
  try {
    if (options.prettier !== false) {
      return prettier.format(sourceString, {
        printWidth: 120,
        parser: "typescript"
      });
    }
    return sourceString;
  } catch (error) {
    console.log(sourceString);
    console.log(chalk.red("format source file failed"));
    throw new BasicError(error);
  }
}

export async function createSourceFile(options: IFileCreateOptions) {
  return new Promise<ts.SourceFile>((resolve, reject) => {
    if (options.folder) {
      fs.pathExists(options.folder).then(async exist => {
        if (!exist) {
          reject(new NotFoundError(`folder [${options.folder}] is not exist.`));
        } else {
          createSourceDirectly(options, resolve, reject);
        }
      });
    } else {
      createSourceDirectly(
        { ...options, filename: "undefined.tsx", folder: "." },
        resolve,
        reject
      );
    }
  });
}

function createSourceDirectly(
  options: IFileCreateOptions,
  resolve: (
    value?: ts.SourceFile | PromiseLike<ts.SourceFile> | undefined
  ) => void,
  reject: (reason?: any) => void
) {
  try {
    const sourceFile = ts.createSourceFile(
      path.join(options.folder!, options.filename!),
      "",
      ts.ScriptTarget.ES2017
    );
    resolve(ts.updateSourceFileNode(sourceFile, options.statements));
  } catch (error) {
    reject(new BasicError(error));
  }
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
