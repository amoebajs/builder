import { ReactComponent } from "#providers";
import { Component, Input } from "#core";

export enum StackDirection {
  Horizontal = "horizontal",
  Vertical = "vertical",
}

@Component({ name: "stack-layout", version: "0.0.1-beta.0" })
export class StackLayout extends ReactComponent {
  @Input({
    name: "direction",
    useEnums: {
      allowValues: [StackDirection.Horizontal, StackDirection.Vertical],
      // validate: v => v === StackDirection.Horizontal || v === StackDirection.Vertical,
    },
  })
  stackDirection: StackDirection = StackDirection.Vertical;
}
