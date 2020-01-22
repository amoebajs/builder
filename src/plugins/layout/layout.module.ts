import { Module } from "#core";
import { GridLayout } from "./grid-layout.component";
import { StackLayout } from "./stack-layout.component";

@Module({
  name: "ambjs-layout-module",
  displayName: "Amoebajs布局模块",
  provider: "react",
  components: [GridLayout, StackLayout],
  directives: [],
})
export class LayoutModule {}
