import ts from "typescript";
import { createJsxElement, DOMS, createValueAttr, TYPES } from "../../utils";
import { Page, Input } from "../../decorators";
import { ExtensivePage } from "./basic";

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
