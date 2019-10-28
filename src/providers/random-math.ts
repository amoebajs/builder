import ts from "typescript";
import { createJsxElement } from "../utils";
import { BasicProcessor } from "./base";

export class RandomMathProcessor extends BasicProcessor {
  private _value = Math.floor(Math.random() * 1000);

  public getAppendViews() {
    return [
      createJsxElement("div", [], {}, [
        createJsxElement("span", [], {}, [this._value.toString()])
      ])
    ];
  }

  public getAppendMethods() {
    return this._value > 250
      ? [
          ts.createMethod(
            [],
            [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
            undefined,
            ts.createIdentifier("calcFn" + this._value.toString()),
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
                      "value is " + this._value.toString() + " !"
                    )
                  ]
                )
              )
            ])
          )
        ]
      : [];
  }
}
