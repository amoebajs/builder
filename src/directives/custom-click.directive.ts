import { Directive } from "../decorators";
import { BasicDirective } from "../core/directive";

@Directive({ name: "custom-click" })
export class CustomClickDirective extends BasicDirective {}
