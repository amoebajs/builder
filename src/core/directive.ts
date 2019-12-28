import { BasicCompilationEntity, IPureObject } from "./base";

export abstract class BasicDirective<
  T extends IPureObject = IPureObject
> extends BasicCompilationEntity<T> {
  protected async onInit(): Promise<void> {
    await this.onAttachStart();
    await this.onAttached();
  }

  protected onAttachStart(): Promise<void> {
    return Promise.resolve();
  }

  protected onAttached(): Promise<void> {
    return Promise.resolve();
  }
}
