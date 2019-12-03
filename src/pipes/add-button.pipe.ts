import ts from "typescript";
import { Pipe, Input } from "../decorators";
import {
  createNamedImport,
  createPublicArrow,
  createAnyParameter,
  createJsxElement,
  createValueAttr,
  createThisAccess
} from "../utils";
import { RenderPipe } from "./base";

export enum ButtonTextType {
  PlainText,
  ThisKey,
  PropsKey,
  StateKey
}

export enum ButtonOnClickType {
  ConsoleLog,
  NotifyMessage
}

export enum ButtonStyleType {
  Primary = "primary",
  Danger = "danger"
}

@Pipe("AddButtonPipe")
export class AddButtonPipe extends RenderPipe {
  @Input({
    name: "type",
    group: "buttonText",
    description: "the type of this button's text."
  })
  private buttonTextType: ButtonTextType = ButtonTextType.PlainText;

  @Input({
    name: "data",
    group: "buttonText",
    description: "this info is decided by button's text type."
  })
  private buttonTextData: any = "确认";

  @Input({ description: "the type of this button." })
  private buttonType: ButtonStyleType = ButtonStyleType.Primary;

  @Input({
    name: "type",
    group: "buttonOnClick",
    description: "the type of this button's click."
  })
  private buttonOnClickType: ButtonOnClickType = ButtonOnClickType.ConsoleLog;

  @Input({
    name: "eventName",
    group: "buttonOnClick",
    description: "the name of this button's click handler."
  })
  private buttonOnClickEventName: string = "onButtonClick";

  @Input({
    name: "data",
    group: "buttonOnClick",
    description: "this info is decided by button's click type."
  })
  private buttonOnClickData: any = "btn is clicked";

  onInit() {
    const eName = "e";
    const jsxButtonName = "Button";
    const buttonName = resolveButtonName(
      this.buttonTextType,
      this.buttonTextData
    );
    const statements: ts.Statement[] = [];
    if (this.buttonOnClickType === ButtonOnClickType.ConsoleLog) {
      statements.push(
        ts.createExpressionStatement(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier("console"),
              ts.createIdentifier("log")
            ),
            [],
            [ts.createStringLiteral(this.buttonOnClickData)]
          )
        )
      );
    }
    if (this.buttonOnClickType === ButtonOnClickType.NotifyMessage) {
      this.updateImport([createNamedImport("zent", ["Notify"])]);
      statements.push(
        ts.createExpressionStatement(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier("Notify"),
              ts.createIdentifier("success")
            ),
            [],
            [ts.createStringLiteral(this.buttonOnClickData)]
          )
        )
      );
    }
    // import Button from zent package
    this.updateImport([createNamedImport("zent", [jsxButtonName])]);
    // create clicn event handler
    if (this.existField(this.buttonOnClickEventName)) {
      throw new Error(
        `event handler [${this.buttonOnClickEventName}] is already exist.`
      );
    }
    this.addField(
      createPublicArrow(
        this.buttonOnClickEventName,
        [createAnyParameter(eName)],
        statements
      )
    );
    // create Button jsx element in render with handler
    this.addChildNode(
      createJsxElement(
        "div",
        [],
        {
          style: ts.createJsxExpression(
            undefined,
            createValueAttr({
              textAlign: "center"
            })
          )
        },
        [
          createJsxElement(
            jsxButtonName,
            [],
            {
              type: this.buttonType,
              onClick: createThisAccess(this.buttonOnClickEventName)
            },
            [
              typeof buttonName === "string"
                ? buttonName
                : ts.createJsxExpression(undefined, buttonName)
            ]
          )
        ]
      )
    );
  }
}

function resolveButtonName(type: ButtonTextType, data: any) {
  if (type === ButtonTextType.PlainText) return data;
  return ts.createPropertyAccess(
    ts.createThis(),
    ts.createIdentifier(
      type === ButtonTextType.ThisKey
        ? data
        : (type === ButtonTextType.StateKey ? "state." : "props.") + data
    )
  );
}
