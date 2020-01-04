import { Module } from "../../core/decorators";
import { CustomClickDirective } from "./custom-click.directive";
import { ZentBaseCssDirective } from "./zent-base-css.directive";

@Module({
  name: "ambjs-common-directive-module",
  displayName: "基础指令模块",
  provider: "react",
  directives: [CustomClickDirective, ZentBaseCssDirective],
})
export class CommonDirectiveModule {}
