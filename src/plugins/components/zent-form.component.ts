import ts from "typescript";
import { Component, Composite, Input } from "../../core/decorators";
import { ReactComponent } from "../../providers";
import { IJsxAttrs } from "../../utils";
import { CompositionList } from "../../core";
import { ZentBaseCssDirective } from "../directives/zent-base-css.directive";

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

  @Input()
  apiUrl: string = "";

  @Composite(ZentBaseCssDirective)
  // customClick: Composition = new Composition({ target: "base" });
  customClick: CompositionList = new CompositionList([{ target: "base" }]);

  protected async onInit() {
    await super.onInit();
    const COMPONENT_NAME = "Form";
    const helper = this.helper;
    this.setState("rootElement", {
      ...this.getState("rootElement"),
      name: COMPONENT_NAME,
      attrs: {
        layout: helper.createReactPropsAccess("layout", { defaultValue: "horizontal" }),
        form: helper.createReactPropsAccess("form"),
      },
    });
    this.setState("rootChildren", [ts.createJsxExpression(undefined, helper.createReactPropsAccess("children"))]);
  }
}
