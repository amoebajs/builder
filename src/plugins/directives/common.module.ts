import { Module } from "../../core/decorators";
import { CustomClickDirective } from "./custom-click.directive";

@Module({
  name: "ambjs-common-directive-module",
  displayName: "基础指令模块",
  provider: "react",
  directives: [CustomClickDirective]
})
export class CommonDirectiveModule {}
