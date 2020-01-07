import { Directive, Input } from "../../core/decorators";
import { ReactDirective } from "../../providers";
import ts = require("typescript");

@Directive({ name: "zent-field-value", displayName: "关联显示" })
class ZentFieldValueComponent extends ReactDirective {
  @Input()
  formId: string = "";

  @Input()
  hostFieldId: string = "";

  @Input()
  relatedFieldId: string = "";

  protected async onPostAttach() {
    if (this.relatedFieldId) {
      const { helper } = this;
      const form = this.render.getElementById(this.formId);
      if (form) {
        const host = 
        const fieldValueElement = helper.createJsxElement("FieldValue", [], { name: this.relatedFieldName }, [
          ts.createJsxExpression(
            undefined,
            ts.createArrowFunction(
              undefined,
              undefined,
              [ts.createParameter(undefined, undefined, undefined, "value")],
              undefined,
              undefined,
              ts.createParen(this.createFormFieldJsxElement()),
            ),
          ),
        ]);
        // ts.updateJsxElement();
      }
    }
  }
}
