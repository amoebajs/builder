import { Directive } from "../../core/decorators";
import { ReactDirective } from "../../providers";
import ts = require("typescript");

const FORM_NAME = "form";

@Directive({ name: "zent-form" })
export class ZentFormDirective extends ReactDirective {
  protected async onAttach() {
    this.addImports([
      ...this.helper.createFrontLibImports({
        libRoot: "es",
        styleRoot: "css",
        module: "zent",
        imports: ["Form"],
      }),
      this.helper.createImport("zent/es/form", ["FormStrategy"]),
    ]);
    this.render.appendRootVariable(FORM_NAME, ts.createIdentifier("Form.useForm(FormStrategy.View)"));
  }
}
