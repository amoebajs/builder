import { Directive, Input } from "../../core/decorators";
import { ReactDirective } from "../../providers";
import ts = require("typescript");

const COMPONENT_NAME = "Button";
const generateOnSubmitFunction = (form: string, url: string) => `
async () => {
  const valid = await ${form}.validate(Form.ValidateOption.IncludeUntouched);
  if (valid.filter(Boolean).length) return;
  const data = ${form}.getValue();
  await ajax({
    method: 'post',
    url: '${url}',
    data,
  }).catch(e => {
    Notify.error(e.message);
    throw new Error(e.message);
  });
}
`;

@Directive({ name: "zent-action-button" })
export class ZentActionButtonDirective extends ReactDirective {
  @Input()
  formId: string = "";

  @Input()
  text: string = "提交";

  ON_CLICK_CALLBACK_NAME = `${this.entityId}_onClick`;

  protected async onAttach() {
    this.addImports(
      this.helper.createFrontLibImports({
        libRoot: "es",
        styleRoot: "css",
        module: "zent",
        imports: ["Button", "Notify"],
      }),
    );
    let form = this.render.getElementById(this.formId);
    if (form) {
      const formAttribute = form.openingElement.attributes.properties.find(
        attr => ts.isJsxAttribute(attr) && attr.name.text === "form",
      ) as ts.JsxAttribute | undefined;
      const formName = ((formAttribute?.initializer as ts.JsxExpression).expression as ts.Identifier).text;
      this.render.appendRootCallback(
        this.ON_CLICK_CALLBACK_NAME,
        generateOnSubmitFunction(formName, "https://www.youzan.com"),
        [formName],
      );
      form = ts.updateJsxElement(
        form,
        form.openingElement,
        [...form.children, this.createSubmitButtonJsxElement()],
        form.closingElement,
      );
      this.render.setElementById(this.formId, form);
    }
  }

  private createSubmitButtonJsxElement() {
    return this.helper.createJsxElement(COMPONENT_NAME, [], {
      children: this.text,
      htmlType: "submit",
      type: "primary",
      onClick: ts.createIdentifier(this.ON_CLICK_CALLBACK_NAME),
    });
  }
}
