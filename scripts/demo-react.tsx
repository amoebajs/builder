import React from "react";
import ts from "typescript";
import {
  Factory,
  ReconcilerEngine,
  SourceFileContext,
  Utils,
  Component,
  ReactComponent,
  Group,
  Input,
  useReconciler,
  Module,
} from "../src";

const DemoText = (props: any) => {
  return props.children;
};

const DemoContainer = ({ children }: any) => {
  return <React.Fragment>{children}</React.Fragment>;
};

export enum Position {
  All = "all",
  Top = "top",
  Bottom = "bottom",
  Left = "left",
  Right = "right",
}

export const PositionStringRules = {
  key: Utils.getEnumValues(Position),
  value: "string",
};

interface IPositionData extends Record<typeof Position[keyof typeof Position], string | undefined> {
  all: string;
}

function readBorderPosData(
  width: IPositionData,
  style: IPositionData,
  color: IPositionData,
  key: keyof Omit<IPositionData, "all">,
) {
  return `${width[key] || width.all} ${style[key] || style.all} ${color[key] || color.all}`;
}

@Component({
  name: "basic-element",
  displayName: "基础组件",
  version: "0.0.1-beta.0",
})
@Group({ name: "basic", displayName: "基础属性" })
export class BasicElement extends ReactComponent {
  @Input({ name: "width", group: "basic", displayName: "组件宽度" })
  layoutWidth!: string;

  @Input({ name: "height", group: "basic", displayName: "组件高度" })
  layoutHeight!: string;

  @Input({ name: "background", group: "basic", displayName: "背景色" })
  layoutBackground: string = "transparent";

  @Input({
    name: "borderStyle",
    group: "basic",
    displayName: "边框风格",
    useMap: PositionStringRules,
  })
  layoutBorderStyle: Array<[Position, string]> = [[Position.All, "solid"]];

  @Input({
    name: "borderColor",
    group: "basic",
    displayName: "边框颜色",
    useMap: PositionStringRules,
  })
  layoutBorderColor: Array<[Position, string]> = [[Position.All, "transparent"]];

  @Input({
    name: "borderWidth",
    group: "basic",
    displayName: "边框尺寸",
    useMap: PositionStringRules,
  })
  layoutBorderWidth: Array<[Position, string]> = [];

  @Input({
    name: "padding",
    group: "basic",
    displayName: "内边距",
    useMap: PositionStringRules,
  })
  layoutPadding: Array<[Position, string]> = [];

  @Input({
    name: "margin",
    group: "basic",
    displayName: "外边距",
    useMap: PositionStringRules,
  })
  layoutMargin: Array<[Position, string]> = [];

  protected async onInit() {
    await super.onInit();
    this.setTagName(Utils.DOMS.Div);
    this.addAttributesWithMap({ style: this.resolveRootElementStyle() });
  }

  protected resolveRootElementStyle() {
    return this.helper.createReactPropsMixinAccess("style", this.getElementSelfStyle());
  }

  protected getElementSelfStyle(): Record<string, string | number> {
    return {
      display: "block",
      height: this.layoutHeight,
      width: this.layoutWidth,
      background: this.layoutBackground,
      ...this.getElementBorder(),
      ...this.getElementMargin(),
      ...this.getElementPadding(),
    };
  }

  protected resolvePositionData(pos: [Position, string][]): IPositionData {
    const positionAll = pos.find(i => i[0] === Position.All);
    const defaults = (positionAll && positionAll[1]) ?? "0px";
    return {
      ...pos.reduce<any>((p, c) => ({ ...p, [c[0]]: c[1] }), {}),
      all: defaults,
    };
  }

  protected resolvePositions(pos: [Position, string][]) {
    const { all, top, bottom, left, right } = this.resolvePositionData(pos);
    return `${top || all} ${right || all} ${bottom || all} ${left || all}`;
  }

  protected getElementBorder() {
    const borderWidth = this.resolvePositionData(this.layoutBorderWidth);
    const borderStyle = this.resolvePositionData(this.layoutBorderStyle);
    const borderColor = this.resolvePositionData(this.layoutBorderColor);
    return {
      borderTop: readBorderPosData(borderWidth, borderStyle, borderColor, Position.Top),
      borderBottom: readBorderPosData(borderWidth, borderStyle, borderColor, Position.Bottom),
      borderLeft: readBorderPosData(borderWidth, borderStyle, borderColor, Position.Left),
      borderRight: readBorderPosData(borderWidth, borderStyle, borderColor, Position.Right),
    };
  }

  protected getElementMargin() {
    return {
      margin: this.resolvePositions(this.layoutMargin),
    };
  }

  protected getElementPadding() {
    return {
      padding: this.resolvePositions(this.layoutPadding),
    };
  }
}

@Module({
  name: "?????????",
  provider: "react",
  components: [BasicElement],
})
class DemoModule {}

const BasicEle = useReconciler(BasicElement);

async function run() {
  const fac = new Factory().useModule(DemoModule).parse();
  const context = fac.builder.get(SourceFileContext).setProvider("react");
  const newEngine = fac.builder.get(ReconcilerEngine);
  const Engine = newEngine.createEngine({ context });
  const container = Engine.parseComposite(
    <BasicEle
      layoutBackground="#ececec"
      layoutHeight="100vh"
      layoutWidth="100vw"
      layoutMargin={{ all: "4px" }}
      layoutPadding={{ all: "8px" }}
      layoutBorderWidth={{ left: "40px", right: "40px" }}
      layoutBorderStyle={{ left: "solid", right: "dashed" }}
      layoutBorderColor={{ left: "#fea500", right: "#585858" }}
    >
      <BasicEle></BasicEle>
      <BasicEle></BasicEle>
      <BasicEle></BasicEle>
    </BasicEle>,
  );
  // console.log(container);
  context["rootSlot"] = "app";
  context["root"] = container;
  await context.callCompilation();
  const sourceFile = await context.createSourceFile();
  const result = ts.createPrinter({}).printFile(sourceFile);
  console.log(result);
}

run();
