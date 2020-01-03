import { Directive } from "../../core/decorators";
import { ReactDirective } from "../../providers";

@Directive({ name: "zent-base-css" })
export class ZentBaseCssDirective extends ReactDirective {
  protected async onAttach() {
    try {
      this.addImports([this.helper.createImport("zent/css/base.css")]);
    } catch (error) {
      /** ignore */
    }
  }
}
