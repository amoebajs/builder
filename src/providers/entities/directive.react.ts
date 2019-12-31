import { InjectScope } from "@bonbons/di";
import { IPureObject } from "../../core/base";
import { BasicDirective } from "../../core/directive";
import { ReactRender, ReactHelper } from "../../core/libs";
import { ReactComponent } from "./component.react";
import { Injectable } from "../../core/decorators";

@Injectable(InjectScope.New)
export abstract class ReactDirective<
  T extends IPureObject = IPureObject
> extends BasicDirective<T> {
  private readonly __parentId!: string;
  private readonly __parentRef!: ReactComponent;
  protected helper = new ReactHelper();
  protected render!: ReactRender;

  protected async onInit() {
    await super.onInit();
    this.render = new ReactRender(this.__parentRef);
  }
}
