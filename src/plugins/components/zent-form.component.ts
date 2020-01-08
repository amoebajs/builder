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
  protected propType = "Partial<IFormProps<any, any>>";

  @Input("fields")
  fields: IFormFieldOptions[] = [];

  protected async onInit() {
    await super.onInit();
    const COMPONENT_NAME = "Form";
    const helper = this.helper;
    this.addImports([helper.createImport("zent", [COMPONENT_NAME, "FormStrategy", "IFormProps"])]);
    this.setState("rootElement", {
      ...this.getState("rootElement"),
      name: COMPONENT_NAME,
      attrs: {
        layout: helper.createReactPropsAccess("layout", { defaultValue: "horizontal" }),
        form: helper.createFunctionCall("Form.useForm", [ts.createIdentifier("FormStrategy.View")]),
      },
    });
    this.setState("rootChildren", [ts.createJsxExpression(undefined, helper.createReactPropsAccess("children"))]);
  }
}
