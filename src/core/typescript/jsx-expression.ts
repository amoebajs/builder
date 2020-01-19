import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { ExpressionGenerator } from "./expression";
import { IJsxAttrDefine } from "./jsx-attribute";

export interface IJsxElementDefine {
  tagName: string;
  attrs?: Record<string, IJsxAttrDefine>;
  children?: Array<string | IJsxElementDefine>;
}

@Injectable(InjectScope.New)
export class JsxExpressionGenerator extends ExpressionGenerator<ts.JsxExpression> {
  protected isSpread = false;
  protected innerExpression!: string | (() => ts.Expression);

  public setExpression(value: string | (() => ts.Expression)) {
    this.innerExpression = value;
    return this;
  }

  protected create(): ts.JsxExpression {
    return ts.createJsxExpression(
      this.isSpread ? ts.createToken(ts.SyntaxKind.DotDotDotToken) : undefined,
      !this.innerExpression
        ? undefined
        : typeof this.innerExpression === "string"
        ? ts.createIdentifier(this.innerExpression)
        : this.innerExpression(),
    );
  }
}
