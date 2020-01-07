import ts from "typescript";
import { Component, Input } from "../../core/decorators";
import { ReactComponent } from "../../providers";
import { IJsxAttrs } from "../../utils";

export const enum SupportedFormFields {
  Input = "FormInputField",
}

export interface IFormFieldOptions {
  type: SupportedFormFields;
  props: IJsxAttrs;
}

@Component({ name: "zent-form", dependencies: { zent: "^7.1.0" } })
export class ZentFormComponent extends ReactComponent {
  @Input("fields")
  fields: IFormFieldOptions[] = [];

  protected async onInit() {
    await super.onInit();
    const COMPONENT_NAME = "Form";
    const helper = this.helper;
    this.addImports([helper.createImport("zent", [COMPONENT_NAME, "FormStrategy"])]);
    this.setState("rootElement", {
      ...this.getState("rootElement"),
      name: COMPONENT_NAME,
      attrs: {
        layout: helper.resolvePropState("layout", { defaultValue: "horizontal" }),
        form: helper.createMethodCall("Form.useForm", [helper.createPropertyAccess("FormStrategy.View")]),
      },
    });
    this.setState("rootChildren", [ts.createJsxExpression(undefined, helper.resolvePropState("children"))]);
  }
}
