import ts from "typescript";
import {
  createExportModifier,
  TYPES,
  createConstVariableStatement,
  REACT,
  THIS,
  createJsxElement
} from "./base";

export function createCustomPureClass(name: string, isExport = false) {
  return ts.createClassDeclaration(
    [],
    createExportModifier(isExport),
    ts.createIdentifier(name),
    [],
    [
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        TYPES.PureComponent
      ])
    ],
    [
      ts.createMethod(
        [],
        [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
        undefined,
        ts.createIdentifier(REACT.Render),
        undefined,
        [],
        [],
        undefined,
        ts.createBlock([
          createConstVariableStatement(
            REACT.Props,
            false,
            undefined,
            THIS.Props
          ),
          ts.createReturn(
            ts.createParen(
              createJsxElement(REACT.Fragment, [], {}, /* views*/ [])
            )
          )
        ])
      )
    ]
  );
}
