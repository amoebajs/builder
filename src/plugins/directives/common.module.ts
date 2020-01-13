import { Module } from "../../core/decorators";
import { CustomClickDirective } from "./custom-click.directive";
import { ZentBaseCssDirective } from "./zent-base-css.directive";
import { ZentInputDirective } from "./zent-input.directive";
import { ZentSelectDirective } from "./zent-select.directive";
import { ZentFormDirective } from "./zent-form.directive";
import { ZentActionButtonDirective } from "./zent-action-button.directive";
import { ZentSwitchDirective } from "./zent-switch.directive";

@Module({
  name: "ambjs-common-directive-module",
  displayName: "基础指令模块",
  provider: "react",
  directives: [
    CustomClickDirective,
    ZentBaseCssDirective,
    ZentInputDirective,
    ZentSelectDirective,
    ZentActionButtonDirective,
    ZentFormDirective,
    ZentSwitchDirective,
  ],
})
export class CommonDirectiveModule {}
