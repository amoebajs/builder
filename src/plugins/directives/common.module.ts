import { Module } from "../../core/decorators";
import { CustomClickDirective } from "./custom-click.directive";
import { ZentBaseCssDirective } from "./zent-base-css.directive";
import { ZentInputDirective } from "./zent-input.directive";
import { ZentSelectDirective } from "./zent-select.directive";
import { ZentSubmitButtonDirective } from "./zent-submit.directive";
import { ZentFormDirective } from "./zent-form.directive";

@Module({
  name: "ambjs-common-directive-module",
  displayName: "基础指令模块",
  provider: "react",
  directives: [
    CustomClickDirective,
    ZentBaseCssDirective,
    ZentInputDirective,
    ZentSelectDirective,
    ZentSubmitButtonDirective,
    ZentFormDirective,
  ],
})
export class CommonDirectiveModule {}
