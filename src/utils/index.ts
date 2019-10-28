import ts from "typescript";
import {
  createJsxElement,
  createConstVariableStatement,
  DOMS,
  REACT,
  TYPES,
  THIS,
  createExportModifier
} from "./base";

export * from "./base";
export * from "./container";

function createTextDivBlock(
  text: string,
  onClickRefName: string
): ts.Expression {
  return createJsxElement(DOMS.Div, [], {}, [
    createJsxElement(DOMS.Span, [], {}, [text]),
    createJsxElement(DOMS.Br, [], {}),
    createJsxElement(DOMS.Button, [], {
      onClick: ts.createJsxExpression(
        undefined,
        ts.createPropertyAccess(
          ts.createIdentifier(REACT.Props),
          ts.createIdentifier(onClickRefName)
        )
      )
    })
  ]);
}

function createTextDivBlockParenExpression(
  text: string,
  onClickRefName: string
) {
  return ts.createParen(createTextDivBlock(text, onClickRefName));
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
    TYPES.StatelessComponent,
    ts.createArrowFunction(
      [],
      [],
      [
        ts.createParameter(
          [],
          [],
          undefined,
          ts.createIdentifier(REACT.Props),
          undefined,
          TYPES.Any
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
            createTextDivBlockParenExpression(text, onClickRefName)
          )
        ])
      )
    ]
  );
}
