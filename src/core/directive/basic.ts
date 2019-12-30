import { BasicCompilationEntity, IPureObject } from "../base";

export abstract class BasicDirective<
  T extends IPureObject = IPureObject
> extends BasicCompilationEntity<T> {
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
