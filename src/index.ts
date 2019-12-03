import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {
  emitSourceFileSync,
  createReactSourceFile,
  createJsxElement
} from "./utils";
import { useModule, createModuleStatements } from "./core";
import {
  AddButtonPipe,
  ButtonTextType,
  ButtonOnClickType,
  ButtonStyleType
} from "./pipes/add-button.pipe";
import { CommonPipeModule } from "./pipes";
import { CommonPageModule } from "./pages";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

const buildSrcFolder = path.resolve(process.cwd(), "build", "src");

if (!fs.existsSync(buildSrcFolder)) fs.mkdirSync(buildSrcFolder);

useModule(CommonPageModule);
useModule(CommonPipeModule);

// emitSourceFileSync({
//   folder: "build/src",
//   filename: "extensive-component.tsx",
//   statements: createReactSourceFile(
//     createModuleStatements({
//       name: "MyComponent",
//       page: "ambjs_common_page_module@basic_extensive_page"
//     })
//   )
// });

// emitSourceFileSync({
//   folder: "build/src",
//   filename: "forkslot-component.tsx",
//   statements: createReactSourceFile(
//     createModuleStatements({
//       name: "MyComponent",
//       page: "ambjs_common_page_module@fork_slot_page"
//     })
//   )
// });

emitSourceFileSync({
  folder: "build/src",
  filename: "cssgrid-component.tsx",
  statements: createReactSourceFile(
    createModuleStatements({
      name: "MyComponent",
      page: "ambjs_common_page_module@css_grid_page",
      options: {
        basic: {
          useComponentState: true,
          defaultComponentState: { btn01Text: "10002" }
        },
        gridTemplateColumnsCount: 2,
        gridTemplateRowsFrs: [1, 2]
      },
      // 后处理
      post: [
        {
          name: "ambjs_common_pipe_module@AddButtonPipe",
          args: {
            buttonText: {
              type: ButtonTextType.PlainText,
              data: "按钮01"
            },
            buttonOnClick: {
              type: ButtonOnClickType.ConsoleLog,
              eventName: "onFuckingBtnClick",
              data: "woshinidie!"
            }
          }
        },
        {
          name: "ambjs_common_pipe_module@AddButtonPipe",
          args: {
            buttonText: {
              type: ButtonTextType.StateKey,
              data: "btn01Text"
            },
            buttonType: ButtonStyleType.Danger,
            buttonOnClick: {
              type: ButtonOnClickType.NotifyMessage,
              eventName: "onCustomBtnClick",
              data: "通知。。。。。"
            }
          }
        }
      ]
    })
  )
});

emitSourceFileSync({
  folder: "build/src",
  filename: "main.tsx",
  statements: [
    ts.createImportDeclaration(
      [],
      [],
      ts.createImportClause(ts.createIdentifier("React"), undefined),
      ts.createStringLiteral("react")
    ),
    ts.createImportDeclaration(
      [],
      [],
      ts.createImportClause(ts.createIdentifier("ReactDOM"), undefined),
      ts.createStringLiteral("react-dom")
    ),
    ts.createImportDeclaration(
      [],
      [],
      ts.createImportClause(
        undefined,
        ts.createNamedImports([
          ts.createImportSpecifier(
            undefined,
            ts.createIdentifier("MyComponent")
          )
        ])
      ),
      ts.createStringLiteral("./cssgrid-component")
    ),
    ts.createExpressionStatement(
      ts.createCall(
        ts.createPropertyAccess(
          ts.createIdentifier("ReactDOM"),
          ts.createIdentifier("render")
        ),
        [],
        [
          createJsxElement("MyComponent", [], {}),
          ts.createCall(
            ts.createPropertyAccess(
              ts.createIdentifier("document"),
              ts.createIdentifier("getElementById")
            ),
            [],
            [ts.createStringLiteral("app")]
          )
        ]
      )
    )
  ]
});
