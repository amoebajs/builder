import { IPureObject } from "../base";
import { BasicDirective } from "./basic";
import { BasicReactContainer } from "../component";
import { ReactRender, ReactHelper } from "../libs";

export abstract class ReactDirective<
  T extends IPureObject = IPureObject
> extends BasicDirective<T> {
  private readonly __parentId!: string;
  private readonly __parentRef!: BasicReactContainer;
  protected helper = new ReactHelper();
  protected render!: ReactRender;

  protected async onInit() {
    await super.onInit();
    this.render = new ReactRender(this.__parentRef);
  }
}
