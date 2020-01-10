import { Directive, Input } from "../../core/decorators";
import { ReactDirective } from "../../providers";
import ts = require("typescript");

const COMPONENT_NAME = "FormSwitchField";

@Directive({ name: "zent-switch" })
export class ZentSwitchDirective extends ReactDirective {
  @Input({ displayName: "表单ID" })
  formId: string = "";

  @Input({ displayName: "字段名称" })
  name: string = this.entityId;

  @Input({ displayName: "标签" })
  label: string = "标签：";

  @Input({ displayName: "必填" })
  required: boolean = false;

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
      this.helper.createImport("zent/css/switch.css"),
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

  private createFormFieldJsxElement() {
    return this.helper.createJsxElement(COMPONENT_NAME, [], {
      name: this.name,
      label: this.label,
      required: this.required,
    });
  }
}
