import { IPureObject } from "../base";
import { BasicDirective } from "./basic";
import { BasicReactContainer } from "../component";

export abstract class ReactDirective<
  T extends IPureObject = IPureObject
> extends BasicDirective<T> {
  private readonly __parentId!: string;
  private readonly __parentRef!: BasicReactContainer;

  protected getElementById(entityId: string) {
    const map = this.__parentRef["__elementMap"];
    return map.get(entityId) || null;
  }

  protected setElementById(entityId: string, element: any) {
    const map = this.__parentRef["__elementMap"];
    map.set(entityId, element);
  }
}
