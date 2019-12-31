import { Module } from "../../core/decorators";
import { CssGridContainer } from "./css-grid.component";
import { ZentButtonComponent } from "./zent-button.component";

@Module({
  name: "ambjs-common-component-module",
  displayName: "基础组件模块",
  provider: "react",
  components: [CssGridContainer, ZentButtonComponent]
})
export class CommonComponentModule {}
