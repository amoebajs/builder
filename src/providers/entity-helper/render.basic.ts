import { InjectScope } from "@bonbons/di";
import { BasicComponent, IPureObject, Injectable } from "../../core";
import { BasicHelper } from "./helper.basic";

@Injectable(InjectScope.New)
export class EntityRenderDelegate<T> {
  protected ref!: BasicComponent<T>;
  protected helper!: BasicHelper;

  constructor() {}

  public setState<K extends keyof T>(name: K, value: T[K]): void {
    this.ref["setState"](<any>name, <any>value);
  }

  public getState<K extends keyof T>(name: K): T[K] {
    return this.ref["getState"](<any>name);
  }
}

@Injectable(InjectScope.New)
export class BasicRender<T extends Partial<{}> = IPureObject> {
  protected parentRef!: BasicComponent<T>;
  protected rootRef!: BasicComponent<T>;

  constructor(
    protected readonly helper: BasicHelper,
    public readonly component: EntityRenderDelegate<T>,
    public readonly root: EntityRenderDelegate<T>,
  ) {}

  protected beforeInit() {
    this.component["ref"] = this.parentRef;
    this.root["ref"] = this.rootRef;
    this.component["helper"] = this.helper;
    this.root["helper"] = this.helper;
  }
}
