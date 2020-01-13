import ts from "typescript";

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
  Render: "render",
  UseState: "useState",
  UseCallback: "useCallback",
};

export interface IJsxAttrs {
  [key: string]: ts.Expression | string | number | boolean | undefined;
}

const AnyType = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);

export const IMPORTS = {
  React: ts.createImportDeclaration(
    [],
    [],
    ts.createImportClause(ts.createIdentifier(REACT.NS), undefined),
    ts.createStringLiteral(REACT.PackageName),
  ),
};

export const GenericGen = {
  StatelessComponent(props?: ts.TypeNode) {
    return ts.createTypeReferenceNode(
      ts.createQualifiedName(ts.createIdentifier(REACT.NS), ts.createIdentifier(REACT.StatelessComponent)),
      [props || AnyType],
    );
  },
  Component(props?: ts.TypeNode, state?: ts.TypeNode, ss?: ts.TypeNode) {
    return ts.createExpressionWithTypeArguments(
      [props || AnyType, state || AnyType, ss || AnyType],
      ts.createPropertyAccess(ts.createIdentifier(REACT.NS), ts.createIdentifier(REACT.Component)),
    );
  },
  PureComponent(props?: ts.TypeNode, state?: ts.TypeNode, ss?: ts.TypeNode) {
    return ts.createExpressionWithTypeArguments(
      [props || AnyType, state || AnyType, ss || AnyType],
      ts.createPropertyAccess(ts.createIdentifier(REACT.NS), ts.createIdentifier(REACT.PureComponent)),
    );
  },
};

export const TYPES = {
  Any: AnyType,
  StatelessComponent: GenericGen.StatelessComponent(),
  Component: GenericGen.Component(),
  PureComponent: GenericGen.PureComponent(),
};

export const THIS = {
  Props: ts.createPropertyAccess(ts.createThis(), ts.createIdentifier(REACT.Props)),
  State: ts.createPropertyAccess(ts.createThis(), ts.createIdentifier(REACT.State)),
};

export const DOMS = {
  Div: "div",
  Span: "span",
  Button: "button",
  Br: "br",
};

export function createExportModifier(isExport = false) {
  return !!isExport ? [ts.createModifier(ts.SyntaxKind.ExportKeyword)] : [];
}

export function createConstVariableStatement(
  name: string,
  isExport = false,
  typeNode?: ts.TypeNode,
  initializer?: ts.Expression,
) {
  return ts.createVariableStatement(
    isExport ? [ts.createModifier(ts.SyntaxKind.ExportKeyword)] : [],
    ts.createVariableDeclarationList(
      [ts.createVariableDeclaration(ts.createIdentifier(name), typeNode, initializer)],
      ts.NodeFlags.Const,
    ),
  );
}

export function createThisAccess(name: string): string | ts.JsxExpression {
  return ts.createJsxExpression(undefined, ts.createPropertyAccess(ts.createThis(), ts.createIdentifier(name)));
}

export function createPublicArrow(
  name: string,
  params: ts.ParameterDeclaration[],
  statements: ts.Statement[],
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
      ts.createBlock(statements),
    ),
  );
}

export function createAnyParameter(name: string): ts.ParameterDeclaration {
  return ts.createParameter(
    [],
    [],
    undefined,
    ts.createIdentifier(name),
    undefined,
    ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword),
  );
}

export function exists<T>(arr: T[]) {
  return arr.filter(i => !!i);
}
