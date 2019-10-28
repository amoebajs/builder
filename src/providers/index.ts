import ts from "typescript";
import { createJsxElement } from "../utils";

export interface ICustomProvider {
  (): {
    view: ts.JsxElement;
    method?: ts.MethodDeclaration;
  };
}

export function RandomMathProvider() {
  const value = Math.floor(Math.random() * 1000);
  return {
    view: createJsxElement("div", [], {}, [
      createJsxElement("span", [], {}, [value.toString()])
    ]),
    method:
      value > 250
        ? ts.createMethod(
            [],
            [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            ts.createIdentifier("calcFn" + value.toString()),
            undefined,
            [],
            [],
            undefined,
            ts.createBlock([
              ts.createExpressionStatement(
                ts.createCall(
                  ts.createPropertyAccess(
                    ts.createIdentifier("console"),
                    ts.createIdentifier("log")
                  ),
                  [],
                  [
                    ts.createStringLiteral(
                      "value is " + value.toString() + " !"
                    )
                  ]
                )
              )
            ])
          )
        : undefined
  };
}
