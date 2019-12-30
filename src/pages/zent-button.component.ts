import ts from "typescript";
import { Component, Input, ReactProp } from "../decorators";
import { BasicReactContainer } from "../core/component";

@Component({ name: "zent-button", dependencies: { zent: "^7.1.0" } })
export class ZentButtonComponent extends BasicReactContainer {
  protected async onInit() {
    await super.onInit();
    this.addImports([
      ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(
          undefined,
          ts.createNamedImports([
            ts.createImportSpecifier(undefined, ts.createIdentifier("Button"))
          ])
        ),
        ts.createStringLiteral("zent")
      )
    ]);
    const rootEle = this.getState("rootElement");
    this.setState("rootElement", {
      ...rootEle,
      name: "Button",
      attrs: {
        loading: this.resolvePropState("loading"),
        type: this.resolvePropState("type"),
        size: this.resolvePropState("size"),
        onClick: this.resolvePropState("onClick")
      }
    });
    this.setState("rootChildren", [
      ts.createJsxExpression(undefined, this.resolvePropState("content"))
    ]);
  }
}
