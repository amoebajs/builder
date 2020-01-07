import { Component } from "../../core/decorators";
import { ReactComponent } from "../../providers";

@Component({ name: "zent-input", dependencies: { zent: "^7.1.0" } })
export class ZentInputComponent extends ReactComponent {
  protected async onInit() {
    await super.onInit();
    const COMPONENT_NAME = "FormInputField";
    const helper = this.helper;
    this.addImports([helper.createImport("zent", [COMPONENT_NAME])]);
    this.setState("rootElement", {
      ...this.getState("rootElement"),
      name: COMPONENT_NAME,
      attrs: {
        label: helper.createReactPropsAccess("label", { defaultValue: "标签：" }),
        name: helper.createReactPropsAccess("name", { defaultValue: this.entityId }),
        required: helper.createReactPropsAccess("required"),
        defaultValue: helper.createReactPropsAccess("defaultValue"),
        props: helper.createReactPropsAccess("placeholder", {
          defaultValue: {
            placeholder: "请输入",
          },
        }),
      },
    });
  }
}
