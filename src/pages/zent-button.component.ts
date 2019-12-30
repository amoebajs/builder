import ts from "typescript";
import { Component, Input, ReactProp } from "../decorators";
import { BasicReactContainer } from "../core/component";

@Component({ name: "zent-button", dependencies: { zent: "^7.1.0" } })
export class ZentButtonComponent extends BasicReactContainer {
  protected async onInit() {
    await super.onInit();
    const ButtonRefName = "Button";
    this.addImports([this.createImport("zent", [ButtonRefName])]);
    this.setState("rootElement", {
      ...this.getState("rootElement"),
      name: ButtonRefName,
      attrs: {
        type: this.resolvePropState("type", { defaultValue: "default" }),
        size: this.resolvePropState("size", { defaultValue: "medium" }),
        htmlType: this.resolvePropState("htmlType", { defaultValue: "button" }),
        block: this.resolvePropState("block", { defaultValue: false }),
        disabled: this.resolvePropState("disabled", { defaultValue: false }),
        loading: this.resolvePropState("loading", { defaultValue: false }),
        outline: this.resolvePropState("outline", { defaultValue: false }),
        bordered: this.resolvePropState("bordered", {
          defaultValue: true,
          defaultCheck: "??"
        }),
        href: this.resolvePropState("href"),
        target: this.resolvePropState("target", { defaultValue: "" }),
        download: this.resolvePropState("download"),
        onClick: this.resolvePropState("onClick")
      }
    });
    this.setState("rootChildren", [
      ts.createJsxExpression(undefined, this.resolvePropState("content"))
    ]);
  }
}
