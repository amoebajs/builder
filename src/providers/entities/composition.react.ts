import { InjectScope } from "@bonbons/di";
import { BasicComposition, IInnerCompositionChildRef, IPureObject, Injectable } from "../../core";
import { ReactHelper } from "../entity-helper";

@Injectable(InjectScope.New)
export abstract class ReactComposition<T extends IPureObject = IPureObject> extends BasicComposition<T> {
  constructor(protected readonly helper: ReactHelper) {
    super();
  }

  protected async onEmit(options: IInnerCompositionChildRef) {
    const result = await this.onRender();
    if (result) {
      const instance = this.__context.reconciler.createEngine({ context: this.__context }).parseComposite(result, {
        parent: options.__parentRef,
        key: options.__entityId,
        children: options.__refComponents || [],
      });
      instance.setScopeId(options.__entityId);
      (<any>instance).__entityId = options.__entityId;
      return instance;
    }
  }

  protected childKey(childId: string) {
    return this.entityId + "_" + childId;
  }
}
