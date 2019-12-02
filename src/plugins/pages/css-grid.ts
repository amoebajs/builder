import ts from "typescript";
import { DOMS, createValueAttr, TYPES } from "../../utils";
import { Page, Input } from "../../decorators";
import { ExtensivePage } from "./basic";

@Page({
  name: "css_grid_page",
  displayName: "网格容器页面"
})
export class CssGridPage extends ExtensivePage {
  @Input({ displayName: "是否使用组件状态" })
  public useComponentState: boolean = false;

  @Input({ name: "use-grid-row-repeat", displayName: "使用Grid行重复" })
  public use_GridRowRepeat: boolean = true;

  @Input({ name: "use-grid-column-repeat", displayName: "使用Grid列重复" })
  public use_GridColumnRepeat: boolean = true;

  @Input({ name: "grid-template-rows-count", displayName: "Grid行数量" })
  public gridTemplateRowsCount: number = 1;

  @Input({ name: "grid-template-columns-count", displayName: "Grid列数量" })
  public gridTemplateColumnsCount: number = 1;

  @Input({ name: "grid-template-rows-frs", displayName: "Grid行重复比例" })
  public gridTemplateRowsFrs: number[] = [1];

  @Input({ name: "grid-template-columns-frs", displayName: "Grid列重复比例" })
  public gridTemplateColumnsFrs: number[] = [1];

  @Input({ name: "grid-template-rows-sizes", displayName: "Grid行尺寸" })
  public gridTemplateRowsSizes: (number | string)[] = ["50vh", "50vh"];

  @Input({ name: "grid-template-columns-sizes", displayName: "Grid列尺寸" })
  public gridTemplateColumnsSizes: (number | string)[] = ["50vw", "50vw"];

  @Input({ name: "grid-row-gap", displayName: "Grid行间隔(px)" })
  public gridRowGap: number = 0;

  @Input({ name: "grid-column-gap", displayName: "Grid列间隔(px)" })
  public gridColumnGap: number = 0;

  protected onInit() {
    this.state.rootElement.name = DOMS.Div;
    this.state.rootElement.attrs["style"] = ts.createJsxExpression(
      undefined,
      createValueAttr({
        height: "100vh",
        display: "grid",
        gridTemplateColumns: this.use_GridRowRepeat
          ? this.calcColnmnsRepeat()
          : this.calcColumnsSize(),
        gridTemplateRows: this.use_GridColumnRepeat
          ? this.calcRowsRepeat()
          : this.calcRowsSize(),
        gridRowGap: `${this.gridRowGap}px`,
        gridColumnGap: `${this.gridColumnGap}px`
      })
    );
  }

  private calcColumnsSize(): string | number {
    return this.gridTemplateColumnsSizes
      .map(i => (typeof i === "number" ? `${i}px` : i))
      .join(" ");
  }

  private calcRowsSize(): string | number {
    return this.gridTemplateRowsSizes
      .map(i => (typeof i === "number" ? `${i}px` : i))
      .join(" ");
  }

  private calcColnmnsRepeat(): string | number {
    return `repeat(${
      this.gridTemplateColumnsCount
    }, ${this.gridTemplateColumnsFrs.map(i => `${i}fr`).join(" ")})`;
  }

  private calcRowsRepeat(): string | number {
    return `repeat(${
      this.gridTemplateRowsCount
    }, ${this.gridTemplateRowsFrs.map(i => `${i}fr`).join(" ")})`;
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
