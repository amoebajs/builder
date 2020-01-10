import ts from "typescript";
import { Directive, Input } from "../../core/decorators";
import { ReactDirective } from "../../providers";

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
    let form = this.render.getElementById(this.formId);
    if (form) {
      form = ts.updateJsxElement(
        form,
        form.openingElement,
        [
          ...form.children,
          helper.createJsxElement(COMPONENT_NAME, [], {
            name: this.name,
            label: this.label,
            required: this.required,
            props: helper.createObjectLiteral({
              placeholder: this.placeholder,
              data: this.data,
            }),
          }),
        ],
        form.closingElement,
      );
      this.render.setElementById(this.formId, form);
    }
  }
}
