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
  IInnerCompositionChildRef,
} from "../../core";
import { IInnerComposition } from "../../core/composition";

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
    // 后续考虑优化办法
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

  constructor() {
    super();
    this["__etype"] = "componentChildRef";
  }

  protected async onInit() {
    await super.onInit();
    const refs: (IInnerCompnentChildRef | IInnerDirectiveChildRef | IInnerCompositionChildRef)[] = [
      ...this.__refComponents,
      ...this.__refDirectives,
    ];
    for (const ref of refs) {
      await ref.onInit();
    }
  }

  protected async bootstrap() {
    const instance: IInnerComponent = await super.bootstrap();
    await instance.onInit();
    // 非根组件，尝试优化shake重复代码
    // 后续考虑优化办法
    if (this.__context.root.__entityId !== this.__entityId) {
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
        // 后续考虑优化办法
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
    for (const directive of this.__refDirectives) {
      await directive.bootstrap();
    }
    await instance.onChildrenRender();
    await instance.onRender();
    return instance;
  }
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
    target: IInnerCompnentChildRef | IInnerCompositionChildRef;
    components?: any[];
    directives?: any[];
  },
) {
  const i = options.target;
  const inputLen = Object.keys(i.__options.input).length;
  const attachLen = (<any>i.__options).attach && Object.keys((<any>i.__options).attach).length;
  const compsLen = (options.components || []).length;
  const direcLen = (options.directives || []).length;
  let defaultEntityId = i.__entityId;
  if (!context["useCodeShakes"]) return defaultEntityId;
  // 参数未定义，不重复生成组件
  if (![inputLen, attachLen, compsLen, direcLen].some(i => i > 0)) {
    defaultEntityId = context["defaultCompRefRecord"][i.__refId];
    if (defaultEntityId === void 0) {
      defaultEntityId = i.__entityId;
      context["defaultCompRefRecord"][i.__refId] = i.__entityId;
    }
  }
  return defaultEntityId;
}
