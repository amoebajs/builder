import { ReactComponent } from "#providers";
import { Component, Input } from "#core";
import { DOMS } from "#utils/index";

export enum Position {
  Top = "top",
  Bottom = "bottom",
  Left = "left",
  Right = "right",
}

@Component({ name: "basic-layout", version: "0.0.1-beta.0" })
export class BasicLayout extends ReactComponent {
  @Input({ name: "width" })
  layoutWidth!: string;

  @Input({ name: "height" })
  layoutHeight!: string;

  @Input({ name: "backgroundColor" })
  layoutBackgroundColor: string = "transparent";

  @Input({
    name: "padding",
    useMap: {
      key: [Position.Bottom, Position.Left, Position.Right, Position.Top],
      value: "string",
    },
  })
  layoutPadding: Array<[Position, string]> = [];

  @Input({
    name: "margin",
    useMap: {
      key: [Position.Bottom, Position.Left, Position.Right, Position.Top],
      value: "string",
    },
  })
  layoutMargin: Array<[Position, string]> = [];

  async onInit() {
    await super.onInit();
    this.setTagName(DOMS.Div);
    this.addAttributesWithMap({ style: this.getLayoutStyle() });
  }

  protected getLayoutStyle() {
    return this.helper.createReactPropsMixinAccess("style", this.getLayoutSelfStyle());
  }

  protected getLayoutSelfStyle() {
    return {
      display: "block",
      height: this.layoutHeight,
      width: this.layoutWidth,
      margin: this.getPosition(this.layoutMargin),
      padding: this.getPosition(this.layoutPadding),
      backgroundColor: this.layoutBackgroundColor,
    };
  }

  protected getPosition(pos: [Position, string][]) {
    const { top = "0px", bottom = "0px", left = "0px", right = "0px" } = pos.reduce<any>(
      (p, c) => ({ ...p, [c[0]]: c[1] }),
      {},
    );
    return `${top} ${right} ${bottom} ${left}`;
  }
}
