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
        loading: ts.createPropertyAccess(
          ts.createIdentifier("props"),
          "loading"
        ),
        type: ts.createPropertyAccess(ts.createIdentifier("props"), "type"),
        size: ts.createPropertyAccess(ts.createIdentifier("props"), "size"),
        onClick: ts.createPropertyAccess(
          ts.createIdentifier("props"),
          "onClick"
        )
      }
    });
    this.setState("rootChildren", [
      ts.createJsxExpression(
        undefined,
        ts.createPropertyAccess(ts.createIdentifier("props"), "content")
      )
    ]);
  }
}
