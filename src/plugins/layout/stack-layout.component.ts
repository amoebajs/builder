import { Component, Input, Extends, Group } from "#core";
import { getEnumValues } from "#utils/enums";
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

@Component({ name: "stack-layout", displayName: "线性布局", version: "0.0.1-beta.0" })
@Group({ name: "stack", displayName: "线性属性" })
@Extends(BasicLayout)
export class StackLayout extends BasicLayout {
  @Input({ name: "contentAlign", displayName: "内容排布样式", group: "stack", useEnums: getEnumValues(ContentAlign) })
  stackContentAlign: ContentAlign = ContentAlign.Start;

  @Input({ name: "direction", displayName: "布局方向", group: "stack", useEnums: getEnumValues(StackDirection) })
  stackDirection: StackDirection = StackDirection.Vertical;

  @Input({ name: "scroll", displayName: "滚动条样式", group: "stack", useEnums: getEnumValues(StackScroll) })
  stackScroll: StackScroll = StackScroll.Auto;

  protected getElementSelfStyle() {
    return {
      ...super.getElementSelfStyle(),
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
