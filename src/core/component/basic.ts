import { BasicDirective } from "../directive";
import { IPureObject, BasicCompilationEntity } from "../base";
import { BasicChildRef } from "../childref";

export abstract class BasicComponent<
  T extends IPureObject = IPureObject
> extends BasicCompilationEntity<T> {
  private __rendered: boolean = false;
  private __children: BasicChildRef[] = [];
  private __components: BasicComponent[] = [];
  private __directives: BasicDirective[] = [];

  public get rendered() {
    return this.__rendered;
  }

  protected getChildren() {
    return this.__children.map(i => ({
      component: i.componentRef,
      id: i.entityId,
      options: i["__refOptions"]
    }));
  }

  constructor() {
    super();
    this["__etype"] = "component";
  }

  //#region hooks

  /** @override */
  protected async onInit(): Promise<void> {
    for (const iterator of this.__components) {
      await iterator["onInit"]();
    }
    for (const iterator of this.__directives) {
      await iterator["onInit"]();
    }
    for (const iterator of this.__children) {
      await iterator["onInit"]();
    }
  }

  /** @override */
  protected async onComponentsEmitted() {
    await this.onComponentsPreRender();
    await this.onComponentsRender();
    await this.onComponentsPostRender();
  }

  /** @override */
  protected async onComponentsPreRender(): Promise<void> {
    for (const iterator of this.__components) {
      await iterator["onPreRender"]();
    }
  }

  /** @override */
  protected async onComponentsRender(): Promise<void> {
    for (const iterator of this.__components) {
      await iterator["onRender"]();
    }
  }

  /** @override */
  protected async onComponentsPostRender(): Promise<void> {
    for (const iterator of this.__components) {
      await iterator["onPostRender"]();
    }
  }

  /** @override */
  protected async onChildrenPreRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onPreEmit"]();
    }
  }

  /** @override */
  protected async onChildrenRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onEmit"]();
    }
  }

  /** @override */
  protected async onChildrenPostRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onPostEmit"]();
    }
  }

  /** @override */
  protected async onDirectivesPreAttach(): Promise<void> {
    for (const iterator of this.__directives) {
      await iterator["onPreAttach"]();
    }
  }

  /** @override */
  protected async onDirectivesAttach(): Promise<void> {
    for (const iterator of this.__directives) {
      await iterator["onAttach"]();
    }
  }

  /** @override */
  protected async onDirectivesPostAttach(): Promise<void> {
    for (const iterator of this.__directives) {
      await iterator["onPostAttach"]();
    }
  }

  /** @override */
  protected async onPreRender(): Promise<void> {
    await this.onChildrenPreRender();
    await this.onChildrenRender();
    await this.onChildrenPostRender();
  }

  /** @override */
  protected async onRender(): Promise<void> {
    await this.onDirectivesPreAttach();
    await this.onDirectivesAttach();
    await this.onDirectivesPostAttach();
    return Promise.resolve();
  }

  /** @override */
  protected async onPostRender(): Promise<void> {
    this.__rendered = true;
  }

  //#endregion

  //#region  pretected methods

  //#endregion

  //#region private methods

  //#endregion
}
