import { BasicCompilationEntity, IPureObject } from "../base";

export abstract class BasicChildRef<
  T extends IPureObject = IPureObject
> extends BasicCompilationEntity<T> {
  private __refId!: string;
  private __refOptions: { [name: string]: any } = {};

  public get componentRef() {
    return this.__refId;
  }

  constructor() {
    super();
    this["__etype"] = "childref";
  }

  public setRefComponentId(refEntityId: string) {
    this.__refId = refEntityId;
    return this;
  }

  public setRefOptions(options: { [name: string]: any }) {
    this.__refOptions = options;
    return this;
  }

  /** @override */
  protected async onInit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onPreEmit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onEmit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onPostEmit(): Promise<void> {
    return Promise.resolve();
  }
}
