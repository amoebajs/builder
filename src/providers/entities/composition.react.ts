import { InjectScope } from "@bonbons/di";
import { IPureObject, Injectable, BasicComposition } from "../../core";
import { ReactHelper } from "../entity-helper";

@Injectable(InjectScope.New)
export abstract class ReactComposition<T extends IPureObject = IPureObject> extends BasicComposition<T> {
  constructor(protected readonly helper: ReactHelper) {
    super();
  }

  protected async onEmit() {
    const result = await this.onRender();
    if (result) {
      const ref = this.__context.reconciler
        .createEngine({ context: this.__context })
        .parseComposite(result, this.entityId);
      // console.log(ref);
      await ref.onInit();
      await ref.bootstrap();
    }
  }
}
