import { Component, Input, Extends } from "#core";
import { BasicLayout } from "./basic-layout.component";

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

@Component({ name: "stack-layout", version: "0.0.1-beta.0" })
@Extends(BasicLayout)
export class StackLayout extends BasicLayout {
  @Input({
    name: "contentAlign",
    useEnums: [ContentAlign.Center, ContentAlign.Start, ContentAlign.End],
  })
  stackContentAlign: ContentAlign = ContentAlign.Start;

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

  protected getLayoutSelfStyle() {
    return {
      ...super.getLayoutSelfStyle(),
      display: "flex",
      flexDirection: this.stackDirection,
      justifyContent: this.getContentAlign(),
      overflowX: "hidden",
      overflowY: this.stackScroll,
    };
  }

  private getContentAlign() {
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
