import { Attach, Component, Group, Input, PropAttach } from "#core";
import { BasicState, ReactComponent } from "#providers";
import { DOMS } from "../../../utils";

@Component({ name: "css-grid-container", displayName: "网格容器页面" })
@Group({ name: "basic", displayName: "基础设置" })
export class CssGridContainer extends ReactComponent {
  @Input({ group: "basic", displayName: "是否使用组件状态" })
  public useComponentState: boolean = false;

  @Input({ group: "basic", displayName: "组件默认状态" })
  public defaultComponentState: any = {};

  @Input({ group: "basic", displayName: "背景色" })
  public backgroundColor: string = "#fcfcfc";

  @Input({ group: "basic", displayName: "宽度" })
  public width: string = "100%";

  @Input({ group: "basic", displayName: "高度" })
  public height: string = "100vh";

  @Input({ name: "useGridRowRepeat", displayName: "使用Grid行重复" })
  public useGridRowRepeat: boolean = true;

  @Input({ displayName: "使用Grid列重复" })
  public useGridColumnRepeat: boolean = true;

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

  @Attach({ displayName: "占据的行数" })
  public childRowSpan: PropAttach<number> = new PropAttach(1);

  @Attach({ displayName: "占据的列数" })
  public childColumnSpan: PropAttach<number> = new PropAttach(1);

  @Attach({ displayName: "行起点" })
  public childRowStart: PropAttach<number> = new PropAttach(1);

  @Attach({ displayName: "列起点" })
  public childColumnStart: PropAttach<number> = new PropAttach(1);

  protected async onInit() {
    await super.onInit();
    this.addRenderAttrWithObject("style", {
      display: "grid",
      height: this.height,
      width: this.width,
      backgroundColor: this.backgroundColor,
      gridTemplateColumns: this.useGridRowRepeat ? this.calcColnmnsRepeat() : this.calcColumnsSize(),
      gridTemplateRows: this.useGridColumnRepeat ? this.calcRowsRepeat() : this.calcRowsSize(),
      gridRowGap: `${this.gridRowGap}px`,
      gridColumnGap: `${this.gridColumnGap}px`,
    });
    this.setState(BasicState.TagName, DOMS.Div);
    this.initState();
  }

  protected async onChildrenRender() {
    await super.onChildrenRender();
    this.visitAndNotifyChildKey(key => {
      const styles: Record<string, unknown> = {};
      const cStart = this.childColumnStart.get(key);
      if (cStart) {
        styles["gridColumnStart"] = cStart;
      }
      const rStart = this.childRowStart.get(key);
      if (rStart) {
        styles["gridRowStart"] = rStart;
      }
      this.render.appendJsxStyles(key, styles);
    });
  }

  private initState() {
    if (this.useComponentState && typeof this.defaultComponentState === "object") {
      const state = this.defaultComponentState || {};
      for (const [key, value] of Object.entries(state)) {
        this.addUseState(key, value);
      }
    }
  }

  private calcColumnsSize(): string | number {
    return this.gridTemplateColumnsSizes.map(i => (typeof i === "number" ? `${i}px` : i)).join(" ");
  }

  private calcRowsSize(): string | number {
    return this.gridTemplateRowsSizes.map(i => (typeof i === "number" ? `${i}px` : i)).join(" ");
  }

  private calcColnmnsRepeat(): string | number {
    return `repeat(${this.gridTemplateColumnsCount}, ${this.gridTemplateColumnsFrs.map(i => `${i}fr`).join(" ")})`;
  }

  private calcRowsRepeat(): string | number {
    return `repeat(${this.gridTemplateRowsCount}, ${this.gridTemplateRowsFrs.map(i => `${i}fr`).join(" ")})`;
  }
}
