import ts from "typescript";

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
