import { Module } from "../decorators";
import { ExtensivePage } from "./basic";
import { ForkSlotPage } from "./fork-slot";
import { CssGridPage } from "./css-grid";

@Module({
  name: "ambjs_common_page_module",
  displayName: "基础页面模块",
  pages: [ExtensivePage, ForkSlotPage, CssGridPage]
})
export class CommonPageModule {}
