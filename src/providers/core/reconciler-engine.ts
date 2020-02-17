import { Injector, InjectScope } from "@bonbons/di";
import {
  ReconcilerEngine,
  IEngineOptions,
  Injectable,
  IEngine,
  IReactEntityPayload,
  resolveComponent,
  resolveDirective,
  SourceFileContext,
  IBasicEntityProvider,
  IDirecChildRefPluginOptions,
  ICompChildRefPluginOptions,
  IInnerCompnentChildRef,
  IInnerDirectiveChildRef,
  resolveInputProperties,
  IReconcilerExtends,
  resolveAttachProperties,
  IProxyEntity,
  IConstructor,
} from "../../core";
import { BasicComponentChildRef, BasicDirectiveChildRef } from "../entities";
import { setBaseChildRefInfo } from "./context";
import { createEntityId, is } from "../../utils";
import { GlobalMap } from "../global-map";

interface IParent {
  target: IInnerCompnentChildRef;
  parent?: IParent;
}

interface IResolve {
  context: SourceFileContext<IBasicEntityProvider>;
  element: IReactEntityPayload;
  parent?: IParent;
  key?: string;
}

@Injectable(InjectScope.New)
export class ReactReconcilerEngine extends ReconcilerEngine {
  private engine!: IEngine;
  private context!: SourceFileContext<IBasicEntityProvider>;

  constructor(protected injector: Injector, protected globalMap: GlobalMap) {
    super();
  }

  private resolveEntity(resolves: IResolve): IInnerCompnentChildRef | IInnerDirectiveChildRef {
    const { $$typeof, type: token, props } = resolves.element;
    const isReactElement = $$typeof.toString() === "Symbol(react.element)";
    const isValidProxy = token.__useReconciler === true;
    if (!isReactElement || !isValidProxy) throw new Error("invalid entity composition.");
    const ctor = token.__target;
    const { context, parent, key: entityId } = resolves;
    const compMeta = resolveComponent(ctor);
    if (compMeta.name) {
      // 标准组件生成器
      return this.resolveComponent(entityId!, ctor, context, props, parent);
    }
    const direMeta = resolveDirective(ctor);
    // 标准指令生成器
    if (direMeta.name) {
      return this.resolveDirective(ctor, context, parent);
    }
    // 附加属性
    if (this.ifIsAttachExpression(token, parent)) {
      return this.resolveAttachProperty(token.__key!, props.value, parent!);
    }
    throw new Error("invalid directive or component.");
  }

  private ifIsAttachExpression(token: IProxyEntity, parent: IParent | undefined) {
    return parent && token.__parent && token.__parent !== parent.target.__refConstructor;
  }

  private resolveComponent(
    entityId: string,
    ctor: IConstructor<any>,
    context: IResolve["context"],
    props: IReactEntityPayload["props"],
    parent: IResolve["parent"],
  ) {
    const { moduleName, name } = this.globalMap.getComponentByType(ctor);
    let imported = context.components.find(i => i.moduleName === moduleName && i.templateName === name);
    if (!imported) {
      imported = { moduleName: moduleName!, templateName: name, type: <any>ctor, importId: createEntityId() };
      context.importComponents([imported]);
    }
    const inputs = resolveInputProperties(ctor);
    const inputEntries = Object.entries(inputs);
    const ref = this.injector.get(BasicComponentChildRef);
    const { key: _, children, ...otherProps } = props;
    const options: ICompChildRefPluginOptions = {
      entityName: entityId || createEntityId(),
      refEntityId: imported.importId,
      directives: [],
      components: [],
      options: { input: {}, attach: {}, props: {} },
    };
    // props into inputs
    const entries = Object.entries(otherProps);
    const newInputs: Record<string, any> = {};
    for (const [key, value] of entries) {
      const found = inputEntries.find(i => i[1].realName === key);
      if (!found) continue;
      const [, define] = found;
      let insertTarget = newInputs[define.name.value];
      if (define.group) {
        insertTarget = newInputs[define.group] || (newInputs[define.group] = {});
      }
      let expr: any = value;
      if (is.object(value) && define.type.meta === "map") {
        expr = Object.entries(value);
      }
      insertTarget[define.name.value] = {
        type: "literal",
        expression: expr,
      };
    }
    options.options.input = newInputs;
    setBaseChildRefInfo(context, <any>ref, options, ctor, parent?.target);
    const childNodes = (<IReactEntityPayload[]>(
      ((is.array(children) ? children : [children]).filter(i => typeof i === "object") as unknown[])
    ))
      .map(e =>
        this.resolveEntity({
          context,
          element: e,
          parent: { target: <IInnerCompnentChildRef>(<unknown>ref), parent },
        }),
      )
      .filter(i => !!i);
    ref["__refComponents"] = childNodes.filter(c => c["__etype"] === "componentChildRef") as IInnerCompnentChildRef[];
    ref["__refDirectives"] = childNodes.filter(c => c["__etype"] === "directiveChildRef") as IInnerDirectiveChildRef[];
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private resolveDirective(ctor: IConstructor<any>, context: IResolve["context"], parent: IResolve["parent"]) {
    const { moduleName, name } = this.globalMap.getDirectiveByType(ctor);
    let imported = context.directives.find(i => i.moduleName === moduleName && i.templateName === name);
    if (!imported) {
      imported = { moduleName: moduleName!, templateName: name, type: <any>ctor, importId: createEntityId() };
      context.importDirectives([imported]);
    }
    const ref = this.injector.get(BasicDirectiveChildRef);
    const options: IDirecChildRefPluginOptions = {
      entityName: createEntityId(),
      refEntityId: imported.importId,
      options: { input: {} },
    };
    setBaseChildRefInfo(context, <any>ref, options, ctor, parent?.target);
    return <IInnerDirectiveChildRef>(<unknown>ref);
  }

  private resolveAttachProperty(attachName: string, value: any, parent: IParent) {
    // 附加属性
    if (!parent.parent?.target) throw new Error("attach property invalid.");
    const host = parent.parent.target;
    const attaches = resolveAttachProperties(host.__refConstructor);
    const found = Object.entries(attaches).find(i => i[1].name.value === attachName);
    if (found) {
      const attach = host.__options.attach[attachName] || {
        type: "childRefs",
        expression: [],
      };
      attach.expression.push({ id: parent.target.__entityId, value });
      host.__options.attach[attachName] = attach;
    }
    return <any>null;
  }

  public createEngine(options: IEngineOptions): IEngine {
    if (this.context === options.context && this.engine) {
      return this.engine;
    }
    this.context = options.context;
    return (this.engine = {
      parseComposite: (element: JSX.Element, { parent, key }: IReconcilerExtends = {}) =>
        <IInnerCompnentChildRef>this.resolveEntity({
          context: this.context,
          element: <any>element,
          parent: !!parent ? { target: parent } : undefined,
          key,
        }),
      parseGenerator(element: JSX.Element) {
        throw new Error("not implemented.");
      },
    });
  }
}
