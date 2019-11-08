# builder

## Demo

实现了些简单的逻辑，但 AST 能做的远不止这么简单，场景越复杂越有意义

### 输入

```typescript
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
```

### 输出

```typescript
import React from "react";
import { Button } from "zent";
export class MyComponent extends React.Component<any, any, any> {
  onFuckingBtnClick = (e: any) => {
    console.log("woshinidie!");
  };
  onButtonClick = (e: any) => {
    console.log("9999999999!");
  };
  public render() {
    const props = this.props;
    return (
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gridAutoRows: "minmax(200px, 400px)"
        }}
      >
        <Button type="primary" onClick={this.onFuckingBtnClick}>
          balabala按钮
        </Button>
        <Button type="primary" onClick={this.onButtonClick}>
          6666666666
        </Button>
      </div>
    );
  }
}
```
