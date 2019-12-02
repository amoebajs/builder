import ts from "typescript";
import { RenderPipe } from "./base";
import {
  createNamedImport,
  createPublicArrow,
  createAnyParameter,
  createJsxElement,
  createValueAttr,
  createThisAccess
} from "../utils";

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

export interface IAddButtonProps {
  key: string;
  buttonText?: {
    type: ButtonTextType;
    data: any;
  };
  buttonType?: ButtonStyleType;
  buttonOnClick?: {
    type: ButtonOnClickType;
    eventName: string;
    data: any;
  };
}

export class AddButtonPipe extends RenderPipe<IAddButtonProps> {
  onInit() {
    const {
      key,
      buttonType = ButtonStyleType.Primary,
      buttonText = {
        type: ButtonTextType.PlainText,
        data: "确认"
      },
      buttonOnClick = {
        type: ButtonOnClickType.ConsoleLog,
        eventName: "onButtonClick",
        data: "btn is clicked"
      }
    } = this.params;

    const eName = "e";
    const jsxButtonName = "Button";
    const buttonName = resolveButtonName(buttonText);
    const statements: ts.Statement[] = [];
    if (buttonOnClick.type === ButtonOnClickType.ConsoleLog) {
      statements.push(
        ts.createExpressionStatement(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier("console"),
              ts.createIdentifier("log")
            ),
            [],
            [ts.createStringLiteral(buttonOnClick.data)]
          )
        )
      );
    }
    if (buttonOnClick.type === ButtonOnClickType.NotifyMessage) {
      this.updateImport([createNamedImport("zent", ["Notify"])]);
      statements.push(
        ts.createExpressionStatement(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier("Notify"),
              ts.createIdentifier("success")
            ),
            [],
            [ts.createStringLiteral(buttonOnClick.data)]
          )
        )
      );
    }
    // import Button from zent package
    this.updateImport([createNamedImport("zent", [jsxButtonName])]);
    // create clicn event handler
    if (this.existField(buttonOnClick.eventName)) {
      throw new Error(
        `event handler [${buttonOnClick.eventName}] is already exist.`
      );
    }
    this.addField(
      createPublicArrow(
        buttonOnClick.eventName,
        [createAnyParameter(eName)],
        statements
      )
    );
    // create Button jsx element in render with handler
    this.addChildNode(
      key,
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
              type: buttonType,
              onClick: createThisAccess(buttonOnClick.eventName)
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

function resolveButtonName(buttonText: IAddButtonProps["buttonText"]) {
  if (typeof buttonText !== "string") {
    const { type, data } = buttonText!;
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
}
