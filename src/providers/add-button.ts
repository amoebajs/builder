import ts from "typescript";
import { ExtensivePageProcessor } from "../plugins/pages";
import {
  createNamedImport,
  createPublicArrow,
  createAnyParameter,
  createJsxElement,
  createThisAccess
} from "../utils";

export const AddButton: ExtensivePageProcessor = (
  context,
  {
    buttonText = "确认",
    buttonEventName = "onButtonClick",
    buttonClickOutput = "btn is clicked"
  },
  update
) => {
  // import Button from zent package
  update([createNamedImport("zent", ["Button"])]);
  // create clicn event handler
  context.fields.push(
    createPublicArrow(
      buttonEventName,
      [createAnyParameter("e")],
      [
        ts.createExpressionStatement(
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier("console"),
              ts.createIdentifier("log")
            ),
            [],
            [ts.createStringLiteral(buttonClickOutput)]
          )
        )
      ]
    )
  );
  // create Button jsx element in render with handler
  context.rootChildren.push(
    createJsxElement(
      "Button",
      [],
      {
        type: "primary",
        onClick: createThisAccess(buttonEventName)
      },
      [buttonText]
    )
  );
  return context;
};
