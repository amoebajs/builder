import { BasicCompilationEntity, IEwsEntity, IEwsEntityPrivates, IEwsEntityProtectedHooks, IPureObject } from "./base";

export interface IComposition extends IEwsEntity {}

export interface ICompositionProtectedHooks extends IEwsEntityProtectedHooks {
  onEmit(): Promise<void>;
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
  protected async onInit(): Promise<void> {}

  /** @override */
  protected async onRender(): Promise<JSX.Element | void> {}

  /** @override */
  protected async onEmit(): Promise<void> {}
}
