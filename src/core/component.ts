import { IInnerDirective as IDirective } from "./directive";
import {
  BasicCompilationEntity,
  IComponentPropMap,
  IEwsEntity,
  IEwsEntityPrivates,
  IEwsEntityProtectedHooks,
  IPureObject,
  SourceFileContext,
} from "./base";
import { IInnerCompnentChildRef as IChildRef } from "./child-ref";
import { BasicComposition, IInnerComposite } from "./libs";

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
  readonly __compositions: IInnerComposite[];
}

export interface IInnerComponent extends IComponent, IComponentPrivates, IComponentProtectedHooks {}

export interface IChildElement {
  component: string;
  id: string;
  props: IComponentPropMap;
}

export async function callOnInit(model: IInnerComponent) {
  // pre compositions init
  for (const iterator of model.__compositions) {
    iterator.setParent(model);
    iterator.setBootstrapHook(directive => model.__directives.push(directive));
  }
  await model.onInit();
  // post compositions init
  for (const iterator of model.__compositions) {
    iterator.init();
  }
  for (const iterator of model.__components) {
    await callOnInit(iterator);
    await iterator.onInit();
  }
  for (const iterator of model.__children) {
    await iterator.onInit();
  }
  for (const iterator of model.__directives) {
    await iterator.onInit();
  }
}

export async function callOnComponentsPreRender(model: IInnerComponent) {
  for (const iterator of model.__components) {
    // composites support
    await callOnDirectivesPreAttach(iterator);
    await callOnDirectivesAttach(iterator);
    await callOnDirectivesPostAttach(iterator);
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

// export async function callOnChildrenPreEmit(model: IInnerComponent) {
//   for (const iterator of model.__children) {
//     await iterator.bootstrap();
//   }
//   await model.onChildrenPreRender();
// }

export async function callOnChildrenEmit(model: IInnerComponent) {
  for (const iterator of model.__children) {
    await iterator.bootstrap();
  }
  await model.onChildrenRender();
}

// export async function callOnChildrenPostEmit(model: IInnerComponent) {
//   for (const iterator of model.__children) {
//     await iterator.onPostEmit();
//   }
//   await model.onChildrenPostRender();
// }

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
  // await callOnChildrenPreEmit(model);
  await callOnChildrenEmit(model);
  // await callOnChildrenPostEmit(model);
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
  private readonly __compositions: BasicComposition[] = [];

  public get rendered() {
    return this.__rendered;
  }

  protected getChildren(): IChildElement[] {
    return this.__children.map(i => ({
      component: decideComponentName(this.__context, i),
      id: i.__entityId,
      props: { ...i.__options.props },
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

/**
 * ## 优化代码：决定是否可以移除重复的组件
 *
 * - 不可以移除：defaultEntityId === __entityId
 *
 * @author Big Mogician
 * @export
 * @param {SourceFileContext<any>} context
 * @param {IChildRef} i
 * @returns
 */
export function decideComponentName(context: SourceFileContext<any>, i: IChildRef) {
  const inputLen = Object.keys(i.__options.input).length;
  let defaultEntityId = i.__entityId;
  // inputs 参数未定义，不重复生成组件
  if (inputLen === 0) {
    defaultEntityId = context.defaultCompRefRecord[i.__refId];
    if (defaultEntityId === void 0) {
      defaultEntityId = i.__entityId;
      context.defaultCompRefRecord[i.__refId] = i.__entityId;
    }
  }
  return defaultEntityId;
}
