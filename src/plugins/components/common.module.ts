import { Module } from "../../core/decorators";
import { CssGridContainer } from "./css-grid.component";
import { ZentButtonComponent } from "./zent-button.component";
import { ZentInputComponent } from "./zent-input.component";

@Module({
  name: "ambjs-common-component-module",
  displayName: "基础组件模块",
  provider: "react",
  components: [CssGridContainer, ZentButtonComponent, ZentInputComponent],
})
export class CommonComponentModule {}
