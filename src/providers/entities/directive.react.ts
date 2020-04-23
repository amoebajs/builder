import { InjectScope } from "@bonbons/di";
import { BasicDirective, IPureObject, Injectable } from "../../core";
import { IBasicReactContainerState, ReactComponent } from "./component.react";
import { ReactHelper, ReactRender } from "../entity-helper";

@Injectable(InjectScope.New)
export abstract class ReactDirective<T extends Partial<IBasicReactContainerState> = IPureObject> extends BasicDirective<
  IBasicReactContainerState & T
> {
  private readonly __parentRef!: ReactComponent<IBasicReactContainerState & T>;
  private readonly __rootRef!: ReactComponent<IBasicReactContainerState & T>;

  constructor(
    protected readonly helper: ReactHelper,
    protected readonly render: ReactRender<IBasicReactContainerState & T>,
  ) {
    super();
  }

  protected async onInit() {
    await super.onInit();
    this.render["parentRef"] = <any>this.__parentRef;
    this.render["rootRef"] = <any>this.__rootRef;
    this.render["beforeInit"]();
  }
}
