import ts from "typescript";
import { createJsxElement, createConstVariableStatement } from "./base";
import { ICustomProvider } from "../providers";

export * from "./base";

export const REACT = {
  NS: "React",
  PackageName: "react",
  Props: "props",
  State: "state",
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

export const TYPES = {
  Any: AnyType,
  StatelessComponent: ts.createTypeReferenceNode(
    ts.createQualifiedName(
      ts.createIdentifier(REACT.NS),
      ts.createIdentifier(REACT.StatelessComponent)
    ),
    [AnyType]
  ),
  PureComponent: ts.createExpressionWithTypeArguments(
    [AnyType, AnyType, AnyType],
    ts.createPropertyAccess(
      ts.createIdentifier(REACT.NS),
      ts.createIdentifier(REACT.PureComponent)
    )
  )
};

export const THIS = {
  Props: ts.createPropertyAccess(
    ts.createThis(),
    ts.createIdentifier(REACT.Props)
  ),
  STATE: ts.createPropertyAccess(
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

function createExportModifier(isExport = false) {
  return !!isExport ? [ts.createModifier(ts.SyntaxKind.ExportKeyword)] : [];
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

export function createCustomPureClass(
  name: string,
  providers: ICustomProvider[],
  isExport = false
) {
  const views: ts.JsxElement[] = [];
  const methods: ts.MethodDeclaration[] = [];
  for (const p of providers) {
    const { view, method } = p();
    views.push(view);
    if (method) methods.push(method);
  }
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
      ...methods,
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
            ts.createParen(createJsxElement(REACT.Fragment, [], {}, views))
          )
        ])
      )
    ]
  );
}
