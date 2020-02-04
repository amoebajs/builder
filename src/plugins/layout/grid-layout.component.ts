import { Attach, Component, Input, JsxElementGenerator, PropAttach, Extends } from "#core";
import { BasicLayout } from "./basic-layout.component";

@Component({ name: "grid-layout", displayName: "网格布局", version: "0.0.1-beta.0" })
@Extends(BasicLayout)
export class GridLayout extends BasicLayout {
  @Input({ name: "rowCount", displayName: "行数量" })
  gridRowCount: number = 1;

  @Input({ name: "columnCount", displayName: "列数量" })
  gridColumnCount: number = 1;

  @Input({ name: "rowGap", displayName: "行间隔" })
  gridRowGap: string = "0px";

  @Input({ name: "columnGap", displayName: "列间隔" })
  gridColumnGap: string = "0px";

  @Input({
    name: "rowSizes",
    displayName: "行尺寸",
    useMap: {
      key: v => Number.isInteger(v) && v >= 1,
      value: v => v >= 0 && v <= 100,
    },
  })
  gridRowSizes: Array<[number, number]> = [[1, 100]];

  @Input({
    name: "columnSizes",
    displayName: "列尺寸",
    useMap: {
      key: v => Number.isInteger(v) && v >= 1,
      value: v => v >= 0 && v <= 100,
    },
  })
  gridColumnSizes: Array<[number, number]> = [[1, 100]];

  @Attach({ name: "rowSpan", displayName: "行跨度" })
  childRowSpan: PropAttach<number> = new PropAttach(1);

  @Attach({ name: "columnSpan", displayName: "列跨度" })
  childColumnSpan: PropAttach<number> = new PropAttach(1);

  @Attach({ name: "rowStart", displayName: "行起始位置" })
  childRowStart: PropAttach<number> = new PropAttach(1);

  @Attach({ name: "columnStart", displayName: "行结束位置" })
  childColumnStart: PropAttach<number> = new PropAttach(1);

  protected getElementSelfStyle() {
    return {
      ...super.getElementSelfStyle(),
      display: "grid",
      gridTemplateColumns: this.calcColumnsSize(),
      gridTemplateRows: this.calcRowsSize(),
      gridRowGap: this.gridRowGap,
      gridColumnGap: this.gridColumnGap,
    };
  }

  protected onChildrenVisit(key: string, generator: JsxElementGenerator) {
    const styles: Record<string, string> = {};
    const cStart = this.childColumnStart.get(key)!;
    const cSpan = this.childColumnSpan.get(key)!;
    const rStart = this.childRowStart.get(key)!;
    const rSpan = this.childRowSpan.get(key)!;
    if (cStart) {
      styles["gridColumn"] = `${cStart} / span ${cSpan}`;
    }
    if (rStart) {
      styles["gridRow"] = `${rStart} / span ${rSpan}`;
    }
    const styleAttr = generator.getJsxAttr("style");
    // 没有style参数，直接创建
    if (styleAttr === null) {
      generator.addJsxAttr("style", () => this.helper.createObjectLiteral(styles));
      return;
    }
    const style = styleAttr.getValue();
    // style参数通过函数创建，这里使用后处理来直接修改AST结构
    if (typeof style === "function") {
      this.render.appendJsxStyles(generator, styles);
    } else {
      // 不存在或者不支持处理其他的情况
    }
  }

  private calcRowsSize() {
    return this.gridRowSizes
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v + "%")
      .join(" ");
  }

  private calcColumnsSize() {
    return this.gridColumnSizes
      .sort((a, b) => a[0] - b[0])
      .map(([, v]) => v + "%")
      .join(" ");
  }
}
