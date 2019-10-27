import ts from "typescript";
import { createJsxElement, createConstVariableStatement } from "./base";
import { ICustomProvider } from "../providers";

export * from "./base";

const REACT_NS = "React";
const REACT_PROPS = "props";

export function createReactNamespaceImport() {
  return ts.createImportDeclaration(
    [],
    [],
    ts.createImportClause(ts.createIdentifier(REACT_NS), undefined),
    ts.createStringLiteral("react")
  );
}

export function createStatelessReactCompTypeNode() {
  return ts.createTypeReferenceNode(
    ts.createQualifiedName(
      ts.createIdentifier(REACT_NS),
      ts.createIdentifier("StatelessComponent")
    ),
    [ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword)]
  );
}

function createTextDivBlock(
  text: string,
  onClickRefName: string
): ts.Expression {
  return createJsxElement("div", [], {}, [
    createJsxElement("span", [], {}, [text]),
    createJsxElement("br", [], {}),
    createJsxElement("button", [], {
      onClick: ts.createJsxExpression(
        undefined,
        ts.createPropertyAccess(
          ts.createIdentifier(REACT_PROPS),
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
    createStatelessReactCompTypeNode(),
    ts.createArrowFunction(
      [],
      [],
      [
        ts.createParameter(
          [],
          [],
          undefined,
          ts.createIdentifier(REACT_PROPS),
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
            ts.createIdentifier(REACT_NS),
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
            REACT_PROPS,
            false,
            undefined,
            ts.createPropertyAccess(
              ts.createThis(),
              ts.createIdentifier(REACT_PROPS)
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

export function createCustomPureClass(
  name: string,
  providers: ICustomProvider[],
  isExport = false
) {
  const _ANY = ts.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
  const views: ts.JsxElement[] = [];
  const methods: ts.MethodDeclaration[] = [];
  for (const p of providers) {
    const { view, method } = p();
    views.push(view);
    if (method) methods.push(method);
  }
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
            ts.createIdentifier(REACT_NS),
            ts.createIdentifier("PureComponent")
          )
        )
      ])
    ],
    [
      ...methods,
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
            REACT_PROPS,
            false,
            undefined,
            ts.createPropertyAccess(
              ts.createThis(),
              ts.createIdentifier(REACT_PROPS)
            )
          ),
          ts.createReturn(
            ts.createParen(createJsxElement("React.Fragment", [], {}, views))
          )
        ])
      )
    ]
  );
}
