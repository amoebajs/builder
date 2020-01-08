import { BasicCompilationEntity, IEwsEntity, IEwsEntityPrivates, IEwsEntityProtectedHooks, IPureObject } from "./base";

export interface IDirective extends IEwsEntity {}

export interface IDirectiveProtectedHooks extends IEwsEntityProtectedHooks {
  onPreAttach(): Promise<void>;
  onAttach(): Promise<void>;
  onPostAttach(): Promise<void>;
}

export interface IDirectivePrivates extends IEwsEntityPrivates<"directive"> {
  readonly __refId: string;
  readonly __refOptions: { [name: string]: any };
}

export interface IInnerDirective extends IDirective, IDirectivePrivates, IDirectiveProtectedHooks {}

export abstract class BasicDirective<T extends IPureObject = IPureObject> extends BasicCompilationEntity<T> {
  constructor() {
    super();
    this["__etype"] = "directive";
  }

  /** @override */
  protected async onInit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onPreAttach(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onAttach(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onPostAttach(): Promise<void> {
    return Promise.resolve();
  }
}
