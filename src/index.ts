import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import { emitSourceFileSync, createReactSourceFile } from "./utils";
import { CommonModule } from "./plugins";
import { useModule, createModuleStatements } from "./core";
import { AddButton } from "./providers";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

useModule(CommonModule);

emitSourceFileSync({
  folder: "build",
  filename: "extensive-component.tsx",
  statements: createReactSourceFile(
    createModuleStatements({
      name: "MyComponent",
      page: "ambjs_common_module@basic_extensive_page"
    })
  )
});

emitSourceFileSync({
  folder: "build",
  filename: "forkslot-component.tsx",
  statements: createReactSourceFile(
    createModuleStatements({
      name: "MyComponent",
      page: "ambjs_common_module@fork_slot_page"
    })
  )
});

emitSourceFileSync({
  folder: "build",
  filename: "cssgrid-component.tsx",
  statements: createReactSourceFile(
    createModuleStatements({
      name: "MyComponent",
      page: "ambjs_common_module@css_grid_page",
      options: {
        useComponentState: true,
        "grid-template-columns": 6,
        "grid-auto-row-min-width": "200px",
        "grid-auto-row-max-width": "400px"
      },
      // 后处理
      post: {
        processors: {
          post01: AddButton,
          post02: AddButton
        },
        options: {
          post01: {
            buttonText: "balabala按钮",
            buttonEventName: "onFuckingBtnClick",
            buttonClickOutput: "woshinidie!"
          },
          post02: {
            buttonText: "6666666666",
            buttonClickOutput: "9999999999!"
          }
        }
      }
    })
  )
});
