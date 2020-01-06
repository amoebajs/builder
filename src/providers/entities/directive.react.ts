import { InjectScope } from "@bonbons/di";
import { IPureObject } from "../../core/base";
import { BasicDirective } from "../../core/directive";
import { ReactComponent } from "./component.react";
import { Injectable } from "../../core/decorators";
import { ReactHelper, ReactRender } from "../entity-helper";

@Injectable(InjectScope.New)
export abstract class ReactDirective<T extends IPureObject = IPureObject> extends BasicDirective<T> {
  private readonly __parentRef!: ReactComponent;

  constructor(protected readonly helper: ReactHelper, protected readonly render: ReactRender) {
    super();
  }

  protected async onInit() {
    await super.onInit();
    this.render["parentRef"] = this.__parentRef;
  }
}
