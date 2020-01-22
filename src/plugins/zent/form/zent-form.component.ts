import { Component, Input } from "#core";
import { ReactComponent } from "#providers";
import { IJsxAttrs } from "../../../utils";
// import { CompositionList } from "#core";
// import { ZentBaseCssDirective } from "../base/zent-base-css.directive";

export const enum SupportedFormFields {
  Input = "FormInputField",
}

export interface IFormFieldOptions {
  type: SupportedFormFields;
  props: IJsxAttrs;
}

@Component({ name: "zent-form" })
export class ZentFormComponent extends ReactComponent {
  @Input("fields")
  fields: IFormFieldOptions[] = [];

  @Input()
  backgroundColor: string = "#fff";

  @Input()
  margin: string = "8px";

  @Input()
  padding: string = "12px";

  @Input()
  apiUrl: string = "";

  // @Composite(ZentBaseCssDirective)
  // // customClick: Composition = new Composition({ target: "base" });
  // customClick: CompositionList = new CompositionList([{ target: "base" }]);

  protected async onInit() {
    await super.onInit();
    const COMPONENT_NAME = "Form";
    this.addImports(
      this.helper.createFrontLibImports({
        module: "zent",
        styleRoot: "css",
        libRoot: "es",
        imports: [COMPONENT_NAME],
      }),
    );
    this.setTagName(COMPONENT_NAME);
    this.addAttributesWithMap({
      style: this.helper.createReactPropsMixinAccess("style", {
        backgroundColor: this.backgroundColor,
        padding: this.padding,
        margin: this.margin,
      }),
      layout: this.helper.createReactPropsAccess("layout", { defaultValue: "horizontal" }),
      form: this.helper.createReactPropsAccess("form"),
    });
    this.addRenderPushedChild(this.createNode("jsx-expression").setExpression("props.children"));
  }
}
