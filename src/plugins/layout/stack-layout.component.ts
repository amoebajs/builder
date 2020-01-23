import { ReactComponent } from "#providers";
import { Component, Input } from "#core";
import { DOMS } from "#utils/index";

export enum StackDirection {
  Horizontal = "row",
  Vertical = "column",
}

export enum StackScroll {
  Disabled = "hidden",
  Auto = "auto",
  Display = "scroll",
}

export enum ContentAlign {
  Center = "center",
  Start = "start",
  End = "end",
}

export enum Position {
  Top = "top",
  Bottom = "bottom",
  Left = "left",
  Right = "right",
}

@Component({ name: "stack-layout", version: "0.0.1-beta.0" })
export class StackLayout extends ReactComponent {
  @Input({ name: "width" })
  stackWidth!: string;

  @Input({ name: "height" })
  stackHeight!: string;

  @Input({ name: "backgroundColor" })
  stackBackgroundColor: string = "transparent";

  @Input({
    name: "contentAlign",
    useEnums: [ContentAlign.Center, ContentAlign.Start, ContentAlign.End],
  })
  stackContentAlign: ContentAlign = ContentAlign.Start;

  @Input({
    name: "margin",
    useMap: {
      key: [Position.Bottom, Position.Left, Position.Right, Position.Top],
      value: "string",
    },
  })
  stackMargin: Array<[Position, string]> = [];

  @Input({
    name: "padding",
    useMap: {
      key: [Position.Bottom, Position.Left, Position.Right, Position.Top],
      value: "string",
    },
  })
  stackPadding: Array<[Position, string]> = [];

  @Input({
    name: "direction",
    useEnums: v => v === StackDirection.Horizontal || v === StackDirection.Vertical,
  })
  stackDirection: StackDirection = StackDirection.Vertical;

  @Input({
    name: "scroll",
    useEnums: [StackScroll.Auto, StackScroll.Disabled, StackScroll.Display],
  })
  stackScroll: StackScroll = StackScroll.Auto;

  async onInit() {
    await super.onInit();
    this.setTagName(DOMS.Div);
    this.addAttributesWithMap({
      style: this.helper.createReactPropsMixinAccess("style", {
        display: "flex",
        flexDirection: this.stackDirection,
        justifyContent: this.calcContentAlign(),
        height: this.stackHeight,
        width: this.stackWidth,
        margin: calcPosition(this.stackMargin),
        padding: calcPosition(this.stackPadding),
        backgroundColor: this.stackBackgroundColor,
        overflowX: "hidden",
        overflowY: this.stackScroll,
      }),
    });
  }

  private calcContentAlign() {
    switch (this.stackContentAlign) {
      case ContentAlign.Start:
        return "flex-start";
      case ContentAlign.End:
        return "flex-end";
      default:
        return "center";
    }
  }
}

export function calcPosition(pos: [Position, string][]) {
  const { top = "0px", bottom = "0px", left = "0px", right = "0px" } = pos.reduce<any>(
    (p, c) => ({ ...p, [c[0]]: c[1] }),
    {},
  );
  return `${top} ${right} ${bottom} ${left}`;
}
