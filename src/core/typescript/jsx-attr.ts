import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator } from "./declaration";
import { IJsxElementDefine, createJsxElement } from "./jsx-element";

export type IJsxAttrDefine = string | IJsxElementDefine | (() => ts.Expression);

@Injectable(InjectScope.New)
export class JsxAttrGenerator extends DeclarationGenerator<ts.JsxAttributeLike> {
  protected jsxAttr?: IJsxAttrDefine;

  public setValue(value: IJsxAttrDefine) {
    this.jsxAttr = value;
    return this;
  }

  protected create(): ts.JsxAttributeLike {
    return ts.createJsxAttribute(
      this.getName(),
      ts.createJsxExpression(
        undefined,
        this.jsxAttr === void 0
          ? void 0
          : typeof this.jsxAttr === "string"
          ? ts.createIdentifier(this.jsxAttr)
          : typeof this.jsxAttr === "function"
          ? this.jsxAttr()
          : createJsxElement(this.jsxAttr).emit(),
      ),
    );
  }
}
