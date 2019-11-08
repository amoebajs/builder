import ts from "typescript";
import * as fs from "fs";
import * as path from "path";
import {
  createTextDivBlockArrowFn,
  emitSourceFileSync,
  createTextDivBlockClass,
  createCustomPureClass,
  createReactSourceFile,
  useClassProcessors
} from "./utils";
import { RandomMathProcessor } from "./providers";
import { CommonModule } from "./plugins";
import { useModule, createModuleStatements } from "./core";

const buildFolder = path.resolve(process.cwd(), "build");

if (!fs.existsSync(buildFolder)) fs.mkdirSync(buildFolder);

// emitSourceFileSync({
//   folder: "build",
//   filename: "stateless-component.tsx",
//   statements: createReactSourceFile([
//     // 创建一个Jsx语法块的demo组件
//     createTextDivBlockArrowFn(
//       "MyArrowComponent",
//       "stateless-demo",
//       "onButtonClick",
//       true
//     )
//   ])
// });

// emitSourceFileSync({
//   folder: "build",
//   filename: "class-component.tsx",
//   statements: createReactSourceFile([
//     createTextDivBlockClass(
//       "MyClassComponent",
//       "class-demo",
//       "onButtonClick",
//       true
//     )
//   ])
// });

// emitSourceFileSync({
//   folder: "build",
//   filename: "custom-component.tsx",
//   statements: useClassProcessors(
//     "MyCustomComponent",
//     createReactSourceFile([createCustomPureClass("MyCustomComponent", true)]),
//     [
//       RandomMathProcessor,
//       RandomMathProcessor,
//       RandomMathProcessor,
//       RandomMathProcessor
//     ]
//   )
// });

// emitSourceFileSync({
//   folder: "build",
//   filename: "allin-component.tsx",
//   statements: useClassProcessors(
//     "MyCustomComponent",
//     createReactSourceFile([
//       createTextDivBlockArrowFn(
//         "MyArrowComponent",
//         "stateless-demo",
//         "onButtonClick",
//         true
//       ),
//       createTextDivBlockClass(
//         "MyClassComponent",
//         "class-demo",
//         "onButtonClick",
//         true
//       ),
//       createCustomPureClass("MyCustomComponent", true)
//     ]),
//     [
//       RandomMathProcessor,
//       RandomMathProcessor,
//       RandomMathProcessor,
//       RandomMathProcessor
//     ]
//   )
// });

useModule(CommonModule);

emitSourceFileSync({
  folder: "build",
  filename: "extensive-component.tsx",
  statements: createReactSourceFile(
    createModuleStatements({
      rootName: "MyComponent",
      rootPage: "ambjs_common_module@basic_extensive_page"
    })
  )
});

emitSourceFileSync({
  folder: "build",
  filename: "forkslot-component.tsx",
  statements: createReactSourceFile(
    createModuleStatements({
      rootName: "MyComponent",
      rootPage: "ambjs_common_module@fork_slot_page"
    })
  )
});

emitSourceFileSync({
  folder: "build",
  filename: "cssgrid-component.tsx",
  statements: createReactSourceFile(
    createModuleStatements({
      rootName: "MyComponent",
      rootPage: "ambjs_common_module@css_grid_page",
      rootProcessors: [],
      rootOptions: {
        useComponentState: true,
        "grid-template-columns": 6,
        "grid-auto-row-min-width": "200px",
        "grid-auto-row-max-width": "400px"
      }
    })
  )
});
