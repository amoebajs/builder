import { Directive, Input } from "../../../core/decorators";
import { ReactDirective } from "../../../providers";
import ts from "typescript";

@Directive({ name: "zent-form", dependencies: { "zan-pc-ajax": "^4.0.0" } })
export class ZentFormDirective extends ReactDirective {
  @Input({ displayName: "表单ID" })
  formId: string = "";

  FORM_NAME = () => this.entityId + "_form";

  protected async onAttach() {
    const form = this.render.getElementById(this.formId);
    if (form) {
      this.addImports([
        ...this.helper.createFrontLibImports({
          libRoot: "es",
          styleRoot: "css",
          module: "zent",
          imports: {
            default: "Form",
            named: ["FormStrategy"],
          },
        }),
        this.helper.createImport("zan-pc-ajax", "ajax"),
      ]);
      this.render.appendRootVariable(
        this.FORM_NAME(),
        ts.createIdentifier("Form.useForm(FormStrategy.View)"),
        "unshift",
      );
    }
  }
}
