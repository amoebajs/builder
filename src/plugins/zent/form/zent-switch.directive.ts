import { Directive, Input } from "../../../core/decorators";
import { ReactDirective } from "../../../providers";
import ts from "typescript";

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
    const form = this.render.getElementById(this.formId);
    if (form) {
      form.addJsxChild(
        this.createNode("jsx-element")
          .setTagName(COMPONENT_NAME)
          .addJsxAttrs({
            name: `"${this.name}"`,
            label: `"${this.label}"`,
            required: String(this.required),
          }),
      );
    }
  }
}
