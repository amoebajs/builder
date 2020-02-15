import { BasicCompilationEntity, IEwsEntity, IEwsEntityPrivates, IEwsEntityProtectedHooks, IPureObject } from "./base";
import { BasicChildRef, IInnerCompositionChildRef, IInnerCompnentChildRef } from "./child-ref";

export interface IComposition extends IEwsEntity {}

export interface ICompositionProtectedHooks extends IEwsEntityProtectedHooks {
  onRender(): Promise<JSX.Element | void>;
  onEmit(options: IInnerCompositionChildRef): Promise<IInnerCompnentChildRef | void>;
}

export interface ICompositionPrivates extends IEwsEntityPrivates<"composition"> {
  readonly __refId: string;
  readonly __refOptions: { [name: string]: any };
}

export interface IInnerComposition extends IComposition, ICompositionPrivates, ICompositionProtectedHooks {}

export abstract class BasicComposition<T extends IPureObject = IPureObject> extends BasicCompilationEntity<T> {
  constructor() {
    super();
    this["__etype"] = "composition";
  }

  /** @override */
  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  /** @override */
  protected async onRender(): Promise<JSX.Element | void> {}

  /** @override */
  protected async onEmit(options: IInnerCompositionChildRef): Promise<IInnerCompnentChildRef | void> {}
}
