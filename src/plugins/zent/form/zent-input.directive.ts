import { Directive, Input } from "#core";
import { ReactDirective } from "#providers";

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
    const form = this.render.getElementById(this.formId);
    if (form) {
      form.addJsxChild(
        this.createNode("jsx-element")
          .setTagName(COMPONENT_NAME)
          .addJsxAttrs({
            name: `"${this.name}"`,
            label: `"${this.label}"`,
            required: String(this.required),
            props: () =>
              this.helper.createObjectLiteral({
                placeholder: this.placeholder,
              }),
          }),
        // .addJsxAttr("name", `"${this.name}"`)
        // .addJsxAttr("label", `"${this.label}"`)
        // .addJsxAttr("required", this.required.toString())
        // .addJsxAttr("props", () =>
        //   this.helper.createObjectLiteral({
        //     placeholder: this.placeholder,
        //   }),
        // ),
      );
    }
  }
}
