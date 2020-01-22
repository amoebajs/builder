import { Component } from "#core";
import { ReactComponent } from "#providers";

@Component({ name: "zent-button" })
export class ZentButtonComponent extends ReactComponent {
  protected async onInit() {
    await super.onInit();
    const ButtonRefName = "Button";
    this.addImports(
      this.helper.createFrontLibImports({
        libRoot: "es",
        styleRoot: "css",
        module: "zent",
        imports: [ButtonRefName],
      }),
    );
    this.setTagName(ButtonRefName);
    // this.addAttributesWithMap({
    //   style: helper.createReactPropsAccess("style", { defaultValue: false }),
    //   className: helper.createReactPropsAccess("className", { defaultValue: "" }),
    //   type: helper.createReactPropsAccess("type", { defaultValue: "default" }),
    //   size: helper.createReactPropsAccess("size", { defaultValue: "medium" }),
    //   htmlType: helper.createReactPropsAccess("htmlType", {
    //     defaultValue: "button",
    //   }),
    //   block: helper.createReactPropsAccess("block", { defaultValue: false }),
    //   disabled: helper.createReactPropsAccess("disabled", { defaultValue: false }),
    //   loading: helper.createReactPropsAccess("loading", { defaultValue: false }),
    //   outline: helper.createReactPropsAccess("outline", { defaultValue: false }),
    //   bordered: helper.createReactPropsAccess("bordered", {
    //     defaultValue: true,
    //     checkOperatorForDefaultValue: "??",
    //   }),
    //   href: helper.createReactPropsAccess("href"),
    //   target: helper.createReactPropsAccess("target", { defaultValue: "" }),
    //   download: helper.createReactPropsAccess("download"),
    //   onClick: helper.createReactPropsAccess("onClick"),
    // });
    this.addAttributesWithSyntaxMap({
      // 覆盖zent按钮的组合样式
      style: "{ marginLeft: 0, ...props.style }",
      className: 'props.className || ""',
      type: 'props.type || "default"',
      size: 'props.size || "medium"',
      htmlType: 'props.htmlType || "button"',
      block: "props.block || false",
      disabled: "props.disabled || false",
      loading: "props.loading || false",
      outline: "props.outline || false",
      bordered: "props.bordered ?? true",
      href: "props.href",
      target: 'props.target || ""',
      download: "props.download",
      onClick: "props.onClick",
    });
    this.addRenderPushedChild(this.createNode("jsx-expression").setExpression("props.children"));
  }
}
