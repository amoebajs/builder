import { Directive, Input } from "../../core/decorators";
import { ReactDirective } from "../../providers";
import ts = require("typescript");

const COMPONENT_NAME = "FormInputField";

@Directive({ name: "zent-input" })
export class ZentInputDirective extends ReactDirective {
  @Input({ displayName: "表单ID" })
  formId: string = "";

  @Input({ displayName: "字段名称" })
  name: string = this.entityId;

  @Input({ displayName: "标签" })
  label: string = "标签：";

  @Input({ displayName: "必填" })
  required: boolean = false;

  @Input({ displayName: "占位符" })
  placeholder: string = "请输入";

  @Input()
  relatedFieldName: string = "";

  protected async onAttach() {
    const { helper } = this;
    this.addImports([
      ...helper.createFrontLibImports({
        libRoot: "es",
        styleRoot: "css",
        module: "zent",
        libName: "form",
        imports: {
          named: [COMPONENT_NAME],
        },
      }),
      this.helper.createImport("zent/css/input.css"),
    ]);
    let form = this.render.getElementById(this.formId);
    if (form) {
      form = ts.updateJsxElement(
        form,
        form.openingElement,
        [...form.children, this.createFormFieldJsxElement()],
        form.closingElement,
      );
      this.render.setElementById(this.formId, form);
    }
  }

  // protected async onPostAttach() {
  //   if (this.relatedFieldName) {
  //     const { helper } = this;
  //     const form = this.render.getElementById(this.formId);
  //     if (form) {
  //       const fieldValueElement = helper.createJsxElement("FieldValue", [], { name: this.relatedFieldName }, [
  //         ts.createJsxExpression(
  //           undefined,
  //           ts.createArrowFunction(
  //             undefined,
  //             undefined,
  //             [ts.createParameter(undefined, undefined, undefined, "value")],
  //             undefined,
  //             undefined,
  //             ts.createParen(this.createFormFieldJsxElement()),
  //           ),
  //         ),
  //       ]);
  //       // ts.updateJsxElement();
  //     }
  //   }
  // }

  private createFormFieldJsxElement() {
    return this.helper.createJsxElement(COMPONENT_NAME, [], {
      name: this.name,
      label: this.label,
      required: this.required,
      props: this.helper.createObjectLiteral({
        placeholder: this.placeholder,
      }),
    });
  }
}
