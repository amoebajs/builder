import { Module } from "../decorators";
import { CssGridContainer } from "./css-grid2";

@Module({
  name: "ambjs-common-component-module",
  displayName: "基础组件模块",
  components: [CssGridContainer]
})
export class CommonComponentModule {}
