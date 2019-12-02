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

  @Input({ displayName: "组件默认状态" })
  public defaultComponentState: any = {};

  @Input({ name: "useGridRowRepeat", displayName: "使用Grid行重复" })
  public use_GridRowRepeat: boolean = true;

  @Input({ displayName: "使用Grid列重复" })
  public use_GridColumnRepeat: boolean = true;

  @Input({ displayName: "Grid行数量" })
  public gridTemplateRowsCount: number = 1;

  @Input({ displayName: "Grid列数量" })
  public gridTemplateColumnsCount: number = 1;

  @Input({ displayName: "Grid行重复比例" })
  public gridTemplateRowsFrs: number[] = [1];

  @Input({ displayName: "Grid列重复比例" })
  public gridTemplateColumnsFrs: number[] = [1];

  @Input({ displayName: "Grid行尺寸" })
  public gridTemplateRowsSizes: (number | string)[] = ["50vh", "50vh"];

  @Input({ displayName: "Grid列尺寸" })
  public gridTemplateColumnsSizes: (number | string)[] = ["50vw", "50vw"];

  @Input({ displayName: "Grid行间隔(px)" })
  public gridRowGap: number = 0;

  @Input({ displayName: "Grid列间隔(px)" })
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

  public createFields() {
    const fields = super.createFields();
    if (
      this.useComponentState &&
      typeof this.defaultComponentState === "object"
    ) {
      const state = this.defaultComponentState || {};
      fields.unshift(
        ts.createProperty(
          [],
          [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
          ts.createIdentifier("state"),
          undefined,
          TYPES.Any,
          ts.createObjectLiteral(
            Object.keys(state).map(n =>
              ts.createPropertyAssignment(
                n,
                typeof state[n] === "number"
                  ? ts.createNumericLiteral(state[n])
                  : state[n] === true
                  ? ts.createTrue()
                  : state[n] === false
                  ? ts.createFalse()
                  : typeof state[n] === "string"
                  ? ts.createStringLiteral(state[n])
                  : ts.createStringLiteral(state[n])
              )
            )
          )
        )
      );
    }
    return fields;
  }
}

class A {
  a = { name: 4, b: false, c: "@342", d: Symbol("dfa") };
}
