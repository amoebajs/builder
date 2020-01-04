import { InjectScope } from "@bonbons/di";
import { BasicCompilationEntity, IPureObject } from "../../core/base";
import { IChildRefPrivates } from "../../core/child-ref";
import { Injectable } from "../../core/decorators";

@Injectable(InjectScope.New)
export abstract class BasicChildRef<T extends IPureObject = IPureObject> extends BasicCompilationEntity<T> {
  private __refId!: IChildRefPrivates["__refId"];
  private __refOptions: IChildRefPrivates["__refOptions"] = {};

  public get componentRef() {
    return this.__refId;
  }

  constructor() {
    super();
    this["__etype"] = "childref";
  }

  public setRefComponentId(refEntityId: IChildRefPrivates["__refId"]) {
    this.__refId = refEntityId;
    return this;
  }

  public setRefOptions(options: IChildRefPrivates["__refOptions"]) {
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
