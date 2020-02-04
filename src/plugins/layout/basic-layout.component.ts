import { Component, Extends } from "#core";
import { BasicElement } from "./basic-element.component";

@Component({ name: "basic-layout", displayName: "基础布局", version: "0.0.1-beta.0" })
@Extends(BasicElement)
export class BasicLayout extends BasicElement {}
