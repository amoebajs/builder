import { BasicDirective } from "../directive";
import { IPureObject, BasicCompilationEntity } from "../base";

export abstract class BasicComponent<
  T extends IPureObject = IPureObject
> extends BasicCompilationEntity<T> {
  private __rendered: boolean = false;
  private __children: BasicComponent[] = [];
  private __directives: BasicDirective[] = [];

  public get rendered() {
    return this.__rendered;
  }

  public get componentId() {
    return "C" + this.entityId;
  }

  //#region hooks

  /** @override */
  protected async onInit(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onInit"]();
    }
    for (const iterator of this.__directives) {
      await iterator["onInit"]();
    }
  }

  /** @override */
  protected async onChildrenPreRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onPreRender"]();
    }
  }

  /** @override */
  protected async onChildrenRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onRender"]();
    }
  }

  /** @override */
  protected async onChildrenPostRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onPostRender"]();
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
    return Promise.resolve();
  }

  /** @override */
  protected async onPostRender(): Promise<void> {
    await this.onDirectivesPreAttach();
    await this.onDirectivesAttach();
    await this.onDirectivesPostAttach();
  }

  //#endregion

  //#region  pretected methods

  //#endregion

  //#region private methods

  //#endregion
}
