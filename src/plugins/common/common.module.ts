import { Module } from "../../core/decorators";
import { CssGridContainer } from "./components/css-grid.component";
import { CustomClickDirective } from "./directives/custom-click.directive";

@Module({
  name: "ambjs-common-module",
  displayName: "基础模块",
  provider: "react",
  components: [CssGridContainer],
  directives: [CustomClickDirective],
})
export class CommonModule {}
