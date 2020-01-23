import { Module } from "#core";
import { CssGridContainer } from "./components/css-grid.component";
import { CustomClickDirective } from "./directives/custom-click.directive";
import { GlobalStateDirective } from "./directives/global-state.directive";

@Module({
  name: "ambjs-common-module",
  displayName: "基础模块",
  provider: "react",
  components: [CssGridContainer],
  directives: [GlobalStateDirective, CustomClickDirective],
})
export class CommonModule {}
