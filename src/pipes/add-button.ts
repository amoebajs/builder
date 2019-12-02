import ts from "typescript";
import {
  ExtensivePageProcessor,
  IExtensivePageContext
} from "../plugins/pages";
import {
  createNamedImport,
  createPublicArrow,
  createAnyParameter,
  createJsxElement,
  createThisAccess,
  createValueAttr
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

export const AddButton: ExtensivePageProcessor = (
  context,
  {
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
  }: IAddButtonProps,
  update
) => {
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
    update([createNamedImport("zent", ["Notify"])]);
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
  update([createNamedImport("zent", [jsxButtonName])]);
  // create clicn event handler
  if (eventNameExist(context, buttonOnClick)) {
    throw new Error(
      `event handler [${buttonOnClick.eventName}] is already exist.`
    );
  }
  context.fields.push(
    createPublicArrow(
      buttonOnClick.eventName,
      [createAnyParameter(eName)],
      statements
    )
  );
  // create Button jsx element in render with handler
  context.rootChildren.push(
    createJsxElement(
      "div",
      [],
      {
        key,
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
  return context;
};

function eventNameExist(
  context: IExtensivePageContext,
  buttonOnClick: IAddButtonProps["buttonOnClick"]
) {
  return (
    context.fields.findIndex(
      i => ts.isIdentifier(i.name) && i.name.text === buttonOnClick!.eventName
    ) >= 0
  );
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
