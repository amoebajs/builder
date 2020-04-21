import { InjectScope } from "@bonbons/di";
import { BasicComponent, IPureObject, Injectable } from "../../core";
import { BasicHelper } from "./helper.basic";

@Injectable(InjectScope.New)
export class BasicRender<T extends Partial<{}> = IPureObject> {
  protected parentRef!: BasicComponent<T>;

  constructor(protected helper: BasicHelper) {}

  public setRootState<K extends keyof T>(name: K, value: T[K]): void {
    this.parentRef["setState"](<any>name, <any>value);
  }

  public getRootState<K extends keyof T>(name: K): T[K] {
    return this.parentRef["getState"](<any>name);
  }
}
