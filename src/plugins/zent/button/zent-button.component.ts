import ts from "typescript";
import { Component } from "../../../core/decorators";
import { BasicState, ReactComponent } from "../../../providers";

@Component({ name: "zent-button", dependencies: { zent: "^7.1.0" } })
export class ZentButtonComponent extends ReactComponent {
  protected async onInit() {
    await super.onInit();
    const ButtonRefName = "Button";
    const helper = this.helper;
    this.addImports(
      helper.createFrontLibImports({
        libRoot: "es",
        styleRoot: "css",
        module: "zent",
        imports: [ButtonRefName],
      }),
    );
    this.setState(BasicState.TagName, ButtonRefName);
    this.addRenderAttrsWithMap({
      style: helper.createReactPropsAccess("style", { defaultValue: false }),
      className: helper.createReactPropsAccess("className", { defaultValue: "" }),
      type: helper.createReactPropsAccess("type", { defaultValue: "default" }),
      size: helper.createReactPropsAccess("size", { defaultValue: "medium" }),
      htmlType: helper.createReactPropsAccess("htmlType", {
        defaultValue: "button",
      }),
      block: helper.createReactPropsAccess("block", { defaultValue: false }),
      disabled: helper.createReactPropsAccess("disabled", { defaultValue: false }),
      loading: helper.createReactPropsAccess("loading", { defaultValue: false }),
      outline: helper.createReactPropsAccess("outline", { defaultValue: false }),
      bordered: helper.createReactPropsAccess("bordered", {
        defaultValue: true,
        checkOperatorForDefaultValue: "??",
      }),
      href: helper.createReactPropsAccess("href"),
      target: helper.createReactPropsAccess("target", { defaultValue: "" }),
      download: helper.createReactPropsAccess("download"),
      onClick: helper.createReactPropsAccess("onClick"),
    });
    this.setState(BasicState.PushedNodes, [this.createNode("jsx-expression").setExpression("props.children")]);
  }
}
