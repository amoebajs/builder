import { Directive, Input } from "#core";
import { ReactDirective } from "#providers";
import ts from "typescript";

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

  ON_CLICK_CALLBACK_NAME = () => `${this.entityId}_onClick`;

  protected async onAttach() {
    this.addImports(
      this.helper.createFrontLibImports({
        libRoot: "es",
        styleRoot: "css",
        module: "zent",
        imports: ["Button", "Notify"],
      }),
    );
    const { form, formName } = this.getFormVariableName();
    if (!formName) return;
    this.render.appendRootCallback(
      this.ON_CLICK_CALLBACK_NAME(),
      generateOnSubmitFunction(formName, "https://www.youzan.com"),
      [formName],
    );
    form!.addJsxChild(
      this.createNode("jsx-element")
        .setTagName(COMPONENT_NAME)
        .addJsxAttrs({
          children: `"${this.text}"`,
          htmlType: '"submit"',
          type: '"primary"',
          onClick: () => ts.createIdentifier(this.ON_CLICK_CALLBACK_NAME()),
        }),
    );
  }

  private getFormVariableName() {
    const form = this.render.getElementById(this.formId);
    if (!form) return { form: null, formName: null };
    const formAttrGen = form.getJsxAttr("form")!;
    const value = formAttrGen.getValue();
    let formName!: string;
    if (typeof value === "string") {
      formName = value;
    } else if (typeof value === "function") {
      const expre: any = value();
      if (expre.text && typeof expre.text === "string") {
        formName = expre.text;
      }
    }
    return { form, formName: formName || null };
  }
}
