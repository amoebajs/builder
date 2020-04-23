import { InjectScope } from "@bonbons/di";
import {
  BasicChildRef,
  IAfterChildrenRender,
  IAfterCreate,
  IAfterDirectivesAttach,
  IAfterInit,
  IAfterRender,
  IAfterRequiresInit,
  IComponentChildRefPrivates,
  ICompositionChildRefPrivates,
  IDirectiveChildRefPrivates,
  IInnerCompnentChildRef,
  IInnerComponent,
  IInnerDirectiveChildRef,
  IInnerSolidEntity,
  IPureObject,
  Injectable,
  SourceFileContext,
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

  protected __instanceRef!: ICompositionChildRefPrivates["__instanceRef"];

  constructor() {
    super();
    this["__etype"] = "compositionChildRef";
  }

  protected async bootstrap() {
    const compRef = await this.__instanceRef.onEmit(<any>this);
    // 非根组件，尝试优化shake重复代码
    if (this.__context.root.__entityId !== this.__entityId) {
      const componentName = decideComponentName(this.__context, {
        target: <any>this,
        components: (compRef && compRef.__refComponents) || [],
        directives: (compRef && compRef.__refDirectives) || [],
      });
      if (componentName !== this.__entityId) {
        return this.__instanceRef;
      }
    }
    if (compRef) {
      await compRef.onInit();
      await compRef.bootstrap();
    }
    return this.__instanceRef;
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

  private __allDirectives: IComponentChildRefPrivates["__refDirectives"] = [];

  constructor() {
    super();
    this["__etype"] = "componentChildRef";
  }

  protected async onInit() {
    await super.onInit();
    this.__allDirectives.push(...this.__refDirectives);
    for (const func of this.__refRequires) {
      this.__allDirectives.push(func(this.__instanceRef));
    }
    // 新增afterReqsInit钩子
    if (hasAfterReqsInit(this.__instanceRef)) {
      await this.__instanceRef.afterRequiresInit();
    }
    const refs: (IInnerSolidEntity | IInnerDirectiveChildRef)[] = [...this.__refComponents, ...this.__allDirectives];
    for (const ref of refs) {
      await ref.onInit();
    }
  }

  protected async bootstrap() {
    const instance: IInnerComponent = this.__instanceRef;
    if (hasAfterCreate(instance)) {
      await instance.afterCreate();
    }
    await instance.onInit();
    // 新增afterInit钩子
    if (hasAfterInit(instance)) {
      await instance.afterInit();
    }
    for (const directive of this.__allDirectives) {
      await directive.__instanceRef.onInit();
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
      component.__instanceRef.onInit();
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
    if (hasAfterChildrenRender(instance)) {
      await instance.afterChildrenRender();
    }
    for (const directive of this.__allDirectives) {
      await directive.__instanceRef.onAttach();
    }
    if (hasAfterDirecsAttach(instance)) {
      await instance.afterDirectivesAttach();
    }
    await instance.onRender();
    if (hasAfterRender(instance)) {
      await instance.afterRender();
    }
    return instance;
  }
}

function hasAfterCreate(instance: any): instance is IAfterCreate {
  return "afterCreate" in instance && typeof instance["afterCreate"] === "function";
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
  const defaultEntityId = i.__entityId;
  if (!context["useCodeShakes"]) return defaultEntityId;
  if (compsLen !== 0 || direcLen !== 0) return defaultEntityId;
  // 参数未定义，不重复生成组件
  return context.getDefaultEntityId(i);
}
