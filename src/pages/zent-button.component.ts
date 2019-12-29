import ts from "typescript";
import { Component, Input, ReactProp } from "../decorators";
import { ReactVbRef } from "../core/base";
import { BasicReactContainer } from "../core/component";

@Component({ name: "zent-button", dependencies: { zent: "^7.1.0" } })
export class ZentButtonComponent extends BasicReactContainer {
  @ReactProp({ name: "loading" })
  zenBtnLoading: ReactVbRef = ReactVbRef.UseProps("loading");

  @Input({ name: "disabled" })
  zenBtnDisabled: ReactVbRef = ReactVbRef.UseProps("disabled");

  @Input({ name: "type" })
  zenBtnType: ReactVbRef = ReactVbRef.UseProps("type");

  @Input({ name: "html-type" })
  zenBtnHtmlType: ReactVbRef = ReactVbRef.UseProps("htmlType");

  @Input({ name: "size" })
  zenBtnSize: ReactVbRef = ReactVbRef.UseProps("size");

  @Input({ name: "bordered" })
  zenBtnBordered: ReactVbRef = ReactVbRef.UseProps("bordered");

  @Input({ name: "content" })
  zenBtnContent: ReactVbRef = ReactVbRef.UseProps("content");

  @Input({ name: "href" })
  zenBtnHref: ReactVbRef = ReactVbRef.UseProps("href");

  @Input({ name: "target" })
  zenBtnTarget: ReactVbRef = ReactVbRef.UseProps("target");

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
      attrs: this.resolveJsxAttrs({
        loading: this.resolveRef("zenBtnLoading")
      })
    });
  }
}
