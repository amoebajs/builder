import { InjectScope } from "@bonbons/di";
import {
  BasicChildRef,
  IComponentChildRefPrivates,
  IDirectiveChildRefPrivates,
  IInnerCompnentChildRef,
  IInnerComponent,
  IInnerDirective,
  IInnerDirectiveChildRef,
  IPureObject,
  Injectable,
  SourceFileContext,
  ICompositionChildRefPrivates,
  IInnerSolidEntity,
  IInnerComposition,
  IAfterInit,
  IAfterRequiresInit,
  IAfterRender,
  IAfterDirectivesAttach,
  IAfterChildrenRender,
} from "../../core";

@Injectable(InjectScope.New)
export abstract class BasicDirectiveChildRef<T extends IPureObject = IPureObject> extends BasicChildRef<T> {
  protected __options: IDirectiveChildRefPrivates["__options"] = {
    input: {},
  };

  public get entityInputs(): IDirectiveChildRefPrivates["__options"]["input"] {
    return this.__options.input;
  }

  constructor() {
    super();
    this["__etype"] = "directiveChildRef";
  }

  protected async bootstrap() {
    const instance: IInnerDirective = await super.bootstrap();
    await instance.onInit();
    await instance.onAttach();
    return instance;
  }
}

@Injectable(InjectScope.New)
export abstract class BasicCompositionChildRef<T extends IPureObject = IPureObject> extends BasicChildRef<T> {
  protected __options: ICompositionChildRefPrivates["__options"] = {
    input: {},
  };
  protected __refComponents: ICompositionChildRefPrivates["__refComponents"] = [];

  public get entityInputs(): ICompositionChildRefPrivates["__options"]["input"] {
    return this.__options.input;
  }

  constructor() {
    super();
    this["__etype"] = "compositionChildRef";
  }

  protected async bootstrap() {
    const instance: IInnerComposition = await super.bootstrap();
    await instance.onInit();
    const compRef = await instance.onEmit(<any>this);
    // 非根组件，尝试优化shake重复代码
    if (this.__context.root.__entityId !== this.__entityId) {
      const componentName = decideComponentName(this.__context, {
        target: <any>this,
        components: (compRef && compRef.__refComponents) || [],
        directives: (compRef && compRef.__refDirectives) || [],
      });
      if (componentName !== this.__entityId) {
        return instance;
      }
    }
    if (compRef) {
      await compRef.onInit();
      await compRef.bootstrap();
    }
    return instance;
  }
}

@Injectable(InjectScope.New)
export abstract class BasicComponentChildRef<T extends IPureObject = IPureObject> extends BasicChildRef<T> {
  protected __options: IComponentChildRefPrivates["__options"] = {
    input: {},
    attach: {},
    props: {},
  };
  protected __refComponents: IComponentChildRefPrivates["__refComponents"] = [];
  protected __refDirectives: IComponentChildRefPrivates["__refDirectives"] = [];
  protected __refRequires: IComponentChildRefPrivates["__refRequires"] = [];

  constructor() {
    super();
    this["__etype"] = "componentChildRef";
  }

  protected async onInit() {
    await super.onInit();
    const refs: (IInnerSolidEntity | IInnerDirectiveChildRef)[] = [...this.__refComponents, ...this.__refDirectives];
    for (const ref of refs) {
      await ref.onInit();
    }
  }

  protected async bootstrap() {
    const instance: IInnerComponent = await super.bootstrap();
    await instance.onInit();
    const postDirectives: IInnerDirectiveChildRef[] = [];
    // 新增afterInit钩子
    if (hasAfterInit(instance)) {
      await instance.afterInit();
    }
    for (const func of this.__refRequires) {
      postDirectives.push(func(instance));
    }
    // 新增afterReqsInit钩子
    if (hasAfterReqsInit(instance)) {
      await instance.afterRequiresInit();
    }
    // __entityId与root.__entityId不同，证明是非根组件
    // entityId和__entityId相同，无法证明是否已经执行过代码优化
    // 满足上面两个条件，尝试优化shake重复代码
    if (this.__context.root.__entityId !== this.__entityId && this.__entityId === this.entityId) {
      const componentName = decideComponentName(this.__context, {
        target: <any>this,
        directives: this.__refDirectives,
        components: this.__refComponents,
      });
      if (componentName !== this.__entityId) {
        return instance;
      }
    }
    for (const component of this.__refComponents) {
      instance.__children.push({
        // 尝试优化shake重复代码
        // 优化成功后，entityId和__entityId将会不在相同
        // entityId代表当前范围，表现为element的key字段
        // __entityId则表现为真正引用的组件名称
        component: decideComponentName(this.__context, {
          target: component,
          directives: (<IInnerCompnentChildRef>component).__refDirectives,
          components: (<IInnerCompnentChildRef>component).__refComponents,
        }),
        id: component.__entityId,
        props: { ...(<any>component.__options).props },
      });
      await component.bootstrap();
    }
    await instance.onChildrenRender();
    this.__refDirectives.push(...postDirectives);
    for (const directive of this.__refDirectives) {
      await directive.bootstrap();
    }
    if (hasAfterDirecsAttach(instance)) {
      await instance.afterDirectivesAttach();
    }
    if (hasAfterChildrenRender(instance)) {
      await instance.afterChildrenRender();
    }
    await instance.onRender();
    if (hasAfterRender(instance)) {
      await instance.afterRender();
    }
    return instance;
  }
}

function hasAfterInit(instance: any): instance is IAfterInit {
  return "afterInit" in instance && typeof instance["afterInit"] === "function";
}

function hasAfterReqsInit(instance: any): instance is IAfterRequiresInit {
  return "afterRequiresInit" in instance && typeof instance["afterRequiresInit"] === "function";
}

function hasAfterChildrenRender(instance: any): instance is IAfterChildrenRender {
  return "afterChildrenRender" in instance && typeof instance["afterChildrenRender"] === "function";
}

function hasAfterRender(instance: any): instance is IAfterRender {
  return "afterRender" in instance && typeof instance["afterRender"] === "function";
}

function hasAfterDirecsAttach(instance: any): instance is IAfterDirectivesAttach {
  return "afterDirectivesAttach" in instance && typeof instance["afterDirectivesAttach"] === "function";
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
function decideComponentName(
  context: SourceFileContext<any>,
  options: {
    target: IInnerSolidEntity;
    components?: any[];
    directives?: any[];
  },
) {
  const i = options.target;
  const compsLen = (options.components || []).length;
  const direcLen = (options.directives || []).length;
  let defaultEntityId = i.__entityId;
  if (!context["useCodeShakes"]) return defaultEntityId;
  if (compsLen !== 0 || direcLen !== 0) return defaultEntityId;
  // 参数未定义，不重复生成组件
  return context.getDefaultEntityId(i);
}
