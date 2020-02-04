import { Module } from "#core";
import { CustomClickDirective } from "./directives/custom-click.directive";
import { GlobalStateDirective } from "./directives/global-state.directive";

@Module({
  name: "ambjs-common-module",
  displayName: "Amoebajs基础模块",
  provider: "react",
  components: [],
  directives: [GlobalStateDirective, CustomClickDirective],
})
export class CommonModule {}

export { GlobalStateDirective, CustomClickDirective };
