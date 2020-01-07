import { IInnerDirective as IDirective } from "./directive";
import { BasicCompilationEntity, IEwsEntity, IEwsEntityPrivates, IEwsEntityProtectedHooks, IPureObject } from "./base";
import { IInnerChildRef as IChildRef } from "./child-ref";

export interface IComponent extends IEwsEntity {}

export interface IComponentProtectedHooks extends IEwsEntityProtectedHooks {
  onComponentsPreRender(): Promise<void>;
  onComponentsRender(): Promise<void>;
  onComponentsPostRender(): Promise<void>;
  onChildrenPreRender(): Promise<void>;
  onChildrenRender(): Promise<void>;
  onChildrenPostRender(): Promise<void>;
  onDirectivesPreAttach(): Promise<void>;
  onDirectivesAttach(): Promise<void>;
  onDirectivesPostAttach(): Promise<void>;
  onPreRender(): Promise<void>;
  onRender(): Promise<void>;
  onPostRender(): Promise<void>;
}

export interface IComponentPrivates extends IEwsEntityPrivates<"component"> {
  readonly __rendered: boolean;
  readonly __children: IChildRef[];
  readonly __components: IInnerComponent[];
  readonly __directives: IDirective[];
}

export interface IInnerComponent extends IComponent, IComponentPrivates, IComponentProtectedHooks {}

export async function callOnInit(model: IInnerComponent) {
  for (const iterator of model.__components) {
    await iterator.onInit();
  }
  for (const iterator of model.__children) {
    await iterator.onInit();
  }
  for (const iterator of model.__directives) {
    await iterator.onInit();
  }
  await model.onInit();
}

export async function callOnComponentsPreRender(model: IInnerComponent) {
  for (const iterator of model.__components) {
    await iterator.onPreRender();
  }
  await model.onComponentsPreRender();
}

export async function callOnComponentsRender(model: IInnerComponent) {
  for (const iterator of model.__components) {
    await iterator.onRender();
  }
  await model.onComponentsRender();
}

export async function callOnComponentsPostRender(model: IInnerComponent) {
  for (const iterator of model.__components) {
    await iterator.onPostRender();
  }
  await model.onComponentsPostRender();
}

export async function callOnChildrenPreEmit(model: IInnerComponent) {
  for (const iterator of model.__children) {
    await iterator.onPreEmit();
  }
  await model.onChildrenPreRender();
}

export async function callOnChildrenEmit(model: IInnerComponent) {
  for (const iterator of model.__children) {
    await iterator.onEmit();
  }
  await model.onChildrenRender();
}

export async function callOnChildrenPostEmit(model: IInnerComponent) {
  for (const iterator of model.__children) {
    await iterator.onPostEmit();
  }
  await model.onChildrenPostRender();
}

export async function callOnDirectivesPreAttach(model: IInnerComponent) {
  for (const iterator of model.__directives) {
    await iterator.onPreAttach();
  }
  await model.onDirectivesPreAttach();
}

export async function callOnDirectivesAttach(model: IInnerComponent) {
  for (const iterator of model.__directives) {
    await iterator.onAttach();
  }
  await model.onDirectivesAttach();
}

export async function callOnDirectivesPostAttach(model: IInnerComponent) {
  for (const iterator of model.__directives) {
    await iterator.onPostAttach();
  }
  await model.onDirectivesPostAttach();
}

export async function callComponentRenderLifecycle(model: IInnerComponent) {
  await model.onPreRender();
  await model.onRender();
  await model.onPostRender();
}

export async function callComponentLifecycle(model: IInnerComponent) {
  await callOnInit(model);
  await callOnComponentsPreRender(model);
  await callOnComponentsRender(model);
  await callOnComponentsPostRender(model);
  await callOnChildrenPreEmit(model);
  await callOnChildrenEmit(model);
  await callOnChildrenPostEmit(model);
  await callOnDirectivesPreAttach(model);
  await callOnDirectivesAttach(model);
  await callOnDirectivesPostAttach(model);
  await callComponentRenderLifecycle(model);
}

export abstract class BasicComponent<T extends IPureObject = IPureObject> extends BasicCompilationEntity<T> {
  private __rendered: boolean = false;
  private readonly __children: IChildRef[] = [];
  private readonly __components: IInnerComponent[] = [];
  private readonly __directives: IDirective[] = [];

  public get rendered() {
    return this.__rendered;
  }

  protected getChildren() {
    return this.__children.map(i => ({
      component: i.componentRef,
      id: i.entityId,
      options: i.__refOptions,
    }));
  }

  constructor() {
    super();
    this["__etype"] = "component";
  }

  //#region hooks

  /** @override */
  protected async onInit(): Promise<void> {}

  /** @override */
  protected async onComponentsPreRender(): Promise<void> {}

  /** @override */
  protected async onComponentsRender(): Promise<void> {}

  /** @override */
  protected async onComponentsPostRender(): Promise<void> {}

  /** @override */
  protected async onChildrenPreRender(): Promise<void> {}

  /** @override */
  protected async onChildrenRender(): Promise<void> {}

  /** @override */
  protected async onChildrenPostRender(): Promise<void> {}

  /** @override */
  protected async onDirectivesPreAttach(): Promise<void> {}

  /** @override */
  protected async onDirectivesAttach(): Promise<void> {}

  /** @override */
  protected async onDirectivesPostAttach(): Promise<void> {}

  /** @override */
  protected async onPreRender(): Promise<void> {}

  /** @override */
  protected async onRender(): Promise<void> {}

  /** @override */
  protected async onPostRender(): Promise<void> {
    this.__rendered = true;
  }

  //#endregion
}
