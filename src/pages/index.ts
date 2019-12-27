import { Module } from "../decorators";
import { ExtensivePage } from "./basic";
import { ForkSlotPage } from "./fork-slot";
import { CssGridPage } from "./css-grid";
import { CssGridContainer } from "./css-grid2";

@Module({
  name: "ambjs_common_page_module",
  displayName: "基础页面模块",
  pages: [ExtensivePage, ForkSlotPage, CssGridPage]
})
export class CommonPageModule {}

@Module({
  name: "ambjs_common_component_module",
  displayName: "基础组件模块",
  pages: [CssGridContainer]
})
export class CommonComponentModule {}
