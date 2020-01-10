import ts from "typescript";
import { Attach, Component, Group, Input } from "../../core/decorators";
import { DOMS, TYPES } from "../../utils";
import { ReactComponent } from "../../providers";
import { PropAttach } from "../../core/libs/attach.basic";

@Component({ name: "css-grid-container", displayName: "网格容器页面" })
@Group({ name: "basic", displayName: "基础设置" })
export class CssGridContainer extends ReactComponent {
  @Input({ group: "basic", displayName: "是否使用组件状态" })
  public useComponentState: boolean = false;

  @Input({ group: "basic", displayName: "组件默认状态" })
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
    const rootElement = this.getState("rootElement");
    rootElement.name = DOMS.Div;
    rootElement.attrs["style"] = this.helper.createObjectAttr({
      height: "100vh",
      display: "grid",
      gridTemplateColumns: this.use_GridRowRepeat ? this.calcColnmnsRepeat() : this.calcColumnsSize(),
      gridTemplateRows: this.use_GridColumnRepeat ? this.calcRowsRepeat() : this.calcRowsSize(),
      gridRowGap: `${this.gridRowGap}px`,
      gridColumnGap: `${this.gridColumnGap}px`,
    });
    this.setState("rootElement", rootElement);
    this.initState();
    this.initExtends();
  }

  protected async onPreRender() {
    await super.onPreRender();
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
      this.addImports([this.helper.createImport("react", ["useState"])]);
      const state = this.defaultComponentState || {};
      for (const [key, value] of Object.entries(state)) {
        this.addReactUseState(key, value, "any");
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

  public initExtends() {
    if (this.useComponentState) {
      this.setExtendParent(ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [TYPES.Component]));
    }
  }
}
