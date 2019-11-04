import { Module } from "../decorators";
import { ExtensivePage, ForkSlotPage, CssGridPage } from "./pages";

@Module({
  name: "ambjs_common_module",
  displayName: "基础模块",
  pages: [ExtensivePage, ForkSlotPage, CssGridPage]
})
export class CommonModule {}
