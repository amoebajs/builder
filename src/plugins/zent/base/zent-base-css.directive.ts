import { Directive, Input } from "#core";
import { ReactDirective } from "#providers";

@Directive({ name: "zent-base-css" })
export class ZentBaseCssDirective extends ReactDirective {
  @Input()
  public target: string = "base";

  protected async onAttach() {
    try {
      this.addImports([this.createNode("import").setModulePath(`zent/css/${this.target}.css`)]);
    } catch (error) {
      /** ignore */
    }
  }
}
