import { ReactComponent } from "#providers";
import { Attach, Component, Input, JsxElementGenerator, PropAttach } from "#core";
import { DOMS } from "#utils/index";

@Component({ name: "grid-layout", version: "0.0.1-beta.0" })
export class GridLayout extends ReactComponent {
  @Input({ name: "width" })
  gridWidth: string = "100%";

  @Input({ name: "height" })
  gridHeight: string = "100%";

  @Input({ name: "backgroundColor" })
  gridBackgroundColor: string = "transparent";

  @Input({ name: "rowCount" })
  gridRowCount: number = 1;

  @Input({ name: "columnCount" })
  gridColumnCount: number = 1;

  @Input({ name: "rowGap", displayName: "Grid行间隔" })
  gridRowGap: string = "0px";

  @Input({ name: "columnGap", displayName: "Grid列间隔" })
  gridColumnGap: string = "0px";

  @Input({
    name: "rowSizes",
    useMap: {
      key: v => Number.isInteger(v) && v >= 1,
      value: v => v >= 0 && v <= 100,
    },
  })
  gridRowSizes: Array<[number, number]> = [[1, 100]];

  @Input({
    name: "columnSizes",
    useMap: {
      key: v => Number.isInteger(v) && v >= 1,
      value: v => v >= 0 && v <= 100,
    },
  })
  gridColumnSizes: Array<[number, number]> = [[1, 100]];

  @Attach({ name: "rowSpan" })
  childRowSpan: PropAttach<number> = new PropAttach(1);

  @Attach({ name: "columnSpan" })
  childColumnSpan: PropAttach<number> = new PropAttach(1);

  @Attach({ name: "rowStart" })
  childRowStart: PropAttach<number> = new PropAttach(1);

  @Attach({ name: "columnStart" })
  childColumnStart: PropAttach<number> = new PropAttach(1);

  async onInit() {
    await super.onInit();
    this.setTagName(DOMS.Div);
    this.addAttributesWithMap({
      style: this.helper.createReactPropsMixinAccess("style", {
        display: "grid",
        height: this.gridHeight,
        width: this.gridWidth,
        backgroundColor: this.gridBackgroundColor,
        gridTemplateColumns: this.calcColumnsSize(),
        gridTemplateRows: this.calcRowsSize(),
        gridRowGap: this.gridRowGap,
        gridColumnGap: this.gridColumnGap,
      }),
    });
  }

  protected onChildrenVisit(key: string, _: JsxElementGenerator) {
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
    console.log(styles);
    this.render.appendJsxStyles(key, styles);
    // 后续支持非ast修改
    // _.addJsxAttr("style");
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
