import ts from "typescript";
import { Component } from "../../core/decorators";
import { ReactComponent } from "../../providers";

@Component({ name: "zent-button", dependencies: { zent: "^7.1.0" } })
export class ZentButtonComponent extends ReactComponent {
  protected async onInit() {
    await super.onInit();
    const ButtonRefName = "Button";
    const helper = this.helper;
    this.addImports([helper.createImport("zent", [ButtonRefName])]);
    this.setState("rootElement", {
      ...this.getState("rootElement"),
      name: ButtonRefName,
      attrs: {
        type: helper.resolvePropState("type", { defaultValue: "default" }),
        size: helper.resolvePropState("size", { defaultValue: "medium" }),
        htmlType: helper.resolvePropState("htmlType", {
          defaultValue: "button",
        }),
        block: helper.resolvePropState("block", { defaultValue: false }),
        disabled: helper.resolvePropState("disabled", { defaultValue: false }),
        loading: helper.resolvePropState("loading", { defaultValue: false }),
        outline: helper.resolvePropState("outline", { defaultValue: false }),
        bordered: helper.resolvePropState("bordered", {
          defaultValue: true,
          defaultCheck: "??",
        }),
        href: helper.resolvePropState("href"),
        target: helper.resolvePropState("target", { defaultValue: "" }),
        download: helper.resolvePropState("download"),
        onClick: helper.resolvePropState("onClick"),
      },
    });
    this.setState("rootChildren", [ts.createJsxExpression(undefined, helper.resolvePropState("content"))]);
  }
}
