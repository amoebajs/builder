import ts from "typescript";
import { Directive, Input } from "../../../core/decorators";
import { ReactDirective } from "../../../providers";

export interface ISelectData {
  value: any;
  text: string;
}

@Directive({ name: "zent-select" })
export class ZentSelectDirective extends ReactDirective {
  @Input()
  formId: string = "";

  @Input()
  name: string = "";

  @Input()
  label: string = "标签：";

  @Input()
  required: boolean = false;

  @Input()
  placeholder: string = "请输入";

  @Input()
  data: ISelectData[] = [];

  protected async onAttach() {
    const { helper } = this;
    const COMPONENT_NAME = "FormSelectField";
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
      helper.createImport("zent/css/select.css"),
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
              helper.createObjectLiteral({
                placeholder: this.placeholder,
                data: this.data,
              }),
          }),
      );
    }
  }
}
