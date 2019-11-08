# builder

## Demo

实现了些简单的逻辑，但 AST 能做的远不止这么简单，场景越复杂越有意义

### 定义页面容器

```typescript
@Page({
  name: "css_grid_page",
  displayName: "网格容器页面"
})
export class CssGridPage extends ExtensivePage {
  @Input({ displayName: "是否使用组件状态" })
  public useComponentState: boolean = false;

  @Input({ name: "grid-template-columns", displayName: "Grid列数量" })
  public gridTemplateColumnsCount: number = 3;

  @Input({ name: "grid-auto-row-min-width", displayName: "Grid行最小宽度" })
  public gridAutoRowMinWidth: string = "100px";

  @Input({ name: "grid-auto-row-max-width", displayName: "Grid行最大宽度" })
  public gridAutoRowMaxWidth: string = "auto";

  protected onInit() {
    this.state.rootElement.name = DOMS.Div;
    this.state.rootElement.attrs["style"] = ts.createJsxExpression(
      undefined,
      createValueAttr({
        display: "grid",
        gridTemplateColumns: `repeat(${this.gridTemplateColumnsCount}, 1fr)`,
        gridAutoRows: `minmax(${this.gridAutoRowMinWidth}, ${this.gridAutoRowMaxWidth})`
      })
    );
  }

  public createExtendParent() {
    if (this.useComponentState) {
      return ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        TYPES.Component
      ]);
    } else {
      return super.createExtendParent();
    }
  }
}
```

### 设置后处理

```typescript
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
```

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
