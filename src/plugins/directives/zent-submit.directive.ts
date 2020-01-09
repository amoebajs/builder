import { Directive, Input } from "../../core/decorators";
import { ReactDirective } from "../../providers";
import ts = require("typescript");

const COMPONENT_NAME = "Button";

const ON_CLICK_CALLBACK_NAME = "onClick";

@Directive({ name: "zent-submit-button" })
export class ZentSubmitButtonDirective extends ReactDirective {
  @Input()
  formId: string = "";

  @Input()
  text: string = "提交";

  protected async onAttach() {
    const { helper } = this;
    this.addImports([helper.createImport("zent", [COMPONENT_NAME])]);
    let form = this.render.getElementById(this.formId);
    if (form) {
      this.render.appendRootCallback(ON_CLICK_CALLBACK_NAME, () => console.log(1));
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
      children: this.text,
      htmlType: "submit",
      onClick: ts.createIdentifier(ON_CLICK_CALLBACK_NAME),
    });
  }
}
