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
  IChildNodes,
  ChildrenSlotComponent,
  IInnerCompositionChildRef,
  resolveComposition,
  ICompositeChildRefPluginOptions,
} from "../../core";
import { BasicComponentChildRef, BasicDirectiveChildRef, BasicCompositionChildRef } from "../entities";
import { setBaseChildRefInfo } from "./context";
import { createEntityId, is } from "../../utils";
import { GlobalMap } from "../global-map";

interface IParent {
  target: IInnerCompnentChildRef | IInnerDirectiveChildRef | IInnerCompositionChildRef;
  parent?: IParent;
}

interface IResolve {
  context: SourceFileContext<IBasicEntityProvider>;
  element: IReactEntityPayload;
  parent?: IParent;
  key?: string;
  compositionKey?: string;
  contextChildren?: (IInnerCompnentChildRef | IInnerCompositionChildRef)[];
}

@Injectable(InjectScope.New)
export class ReactReconcilerEngine extends ReconcilerEngine {
  private engine!: IEngine;
  private context!: SourceFileContext<IBasicEntityProvider>;

  constructor(protected injector: Injector, protected globalMap: GlobalMap) {
    super();
  }

  private resolveEntity(
    resolves: IResolve,
  ): IInnerCompnentChildRef | IInnerDirectiveChildRef | IInnerCompositionChildRef | null {
    const { $$typeof, type: token, props, key } = resolves.element;
    const isReactElement = $$typeof.toString() === "Symbol(react.element)";
    const isValidProxy = token.__useReconciler === true;
    if (!isReactElement || !isValidProxy) throw new Error("invalid entity composition.");
    const ctor = token.__target;
    const { context, parent, key: entityId, compositionKey: compId, contextChildren } = resolves;
    // 附加属性
    if (this.ifIsAttachExpression(token, parent)) {
      return this.resolveAttachProperty(props, parent!);
    }
    // 模板属性
    if (this.ifIsInputExpression(token, parent)) {
      return this.resolveInputProperty(props, parent!);
    }
    // 子节点插槽
    if (this.ifIsChildrenSlotExpression(token)) {
      const children = resolves.contextChildren || [];
      for (const child of children) {
        const fn = child.__etype === "componentChildRef" ? "resolveComponent" : "resolveComposition";
        const id = child.__entityId;
        const ref = this[fn](id, compId!, id, <any>child.__refConstructor, context, {}, parent, []);
        // hack readonly
        (<any>ref).__options = child.__options;
        return ref;
      }
      return null;
    }
    // 标准指令生成器
    const direMeta = resolveDirective(ctor);
    if (direMeta.name) {
      return this.resolveDirective(entityId!, compId!, key, ctor, context, props, parent);
    }
    // 标准组件生成器
    const compMeta = resolveComponent(ctor);
    if (compMeta.name) {
      return this.resolveComponent(entityId!, compId!, key, ctor, context, props, parent, contextChildren);
    }
    // 标准捆绑
    const compsiMeta = resolveComposition(ctor);
    if (compsiMeta.name) {
      return this.resolveComposition(entityId!, compId!, key, ctor, context, props, parent, contextChildren);
    }
    throw new Error("invalid directive or component.");
  }

  private ifIsChildrenSlotExpression(token: IProxyEntity) {
    return <any>token.__target === ChildrenSlotComponent;
  }

  private ifIsAttachExpression(token: IProxyEntity, parent: IParent | undefined) {
    return parent && token.__parent && token.__parent !== parent.target.__refConstructor && token.__key === "Attaches";
  }

  private ifIsInputExpression(token: IProxyEntity, parent: IParent | undefined) {
    return parent && token.__parent && token.__parent === parent.target.__refConstructor && token.__key === "Inputs";
  }

  private resolveComposition(
    entityId: string,
    compoid: string,
    elementKey: string | null,
    ctor: IConstructor<any>,
    context: IResolve["context"],
    props: IReactEntityPayload["props"],
    parent: IResolve["parent"],
    contextChildren?: any[],
  ) {
    const { entityName, imported } = this.resolveEntityName("cs", ctor, context, { elementKey, compoid, entityId });
    const options: ICompositeChildRefPluginOptions = {
      entityName,
      refEntityId: imported.importId,
      components: [],
      options: { input: {} },
    };
    const { key: _, children } = props;
    const ref = this.injector.get(BasicCompositionChildRef);
    setBaseChildRefInfo(context, <any>ref, options, ctor, <any>parent?.target);
    this.resolveComponentChildNodes({ type: "composition", ref, context, children, compoid, parent, contextChildren });
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private resolveComponent(
    entityId: string,
    compoid: string,
    elementKey: string | null,
    ctor: IConstructor<any>,
    context: IResolve["context"],
    props: IReactEntityPayload["props"],
    parent: IResolve["parent"],
    contextChildren?: any[],
  ) {
    const { entityName, imported } = this.resolveEntityName("c", ctor, context, { elementKey, compoid, entityId });
    const options: ICompChildRefPluginOptions = {
      entityName,
      refEntityId: imported.importId,
      directives: [],
      components: [],
      options: { input: {}, attach: {}, props: {} },
    };
    const { key: _, children, ...otherProps } = props;
    options.options.props = this.resolveProps(otherProps);
    const ref = this.injector.get(BasicComponentChildRef);
    setBaseChildRefInfo(context, <any>ref, options, ctor, <any>parent?.target);
    this.resolveComponentChildNodes({ type: "component", ref, context, children, compoid, parent, contextChildren });
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private resolveDirective(
    entityId: string,
    compoid: string,
    elementKey: string | null,
    ctor: IConstructor<any>,
    context: IResolve["context"],
    props: IReactEntityPayload["props"],
    parent: IResolve["parent"],
  ) {
    const { entityName, imported } = this.resolveEntityName("d", ctor, context, { elementKey, compoid, entityId });
    const options: IDirecChildRefPluginOptions = {
      entityName,
      refEntityId: imported.importId,
      options: { input: {} },
    };
    const { key: _, children } = props;
    const ref = this.injector.get(BasicDirectiveChildRef);
    setBaseChildRefInfo(context, <any>ref, options, ctor, <any>parent?.target);
    this.resolveComponentChildNodes({
      type: "directive",
      ref,
      context,
      children,
      compoid,
      parent,
      contextChildren: [],
    });
    return <IInnerDirectiveChildRef>(<unknown>ref);
  }

  private resolveEntityName(
    type: "c" | "cs" | "d",
    ctor: IConstructor<any>,
    context: IResolve["context"],
    payload: { elementKey: string | null; entityId: string; compoid: string },
  ) {
    const typedf = type === "c" ? "components" : type === "cs" ? "compositions" : "directives";
    const getFnN = type === "c" ? "getComponentByType" : type === "cs" ? "getCompositionByType" : "getDirectiveByType";
    const imtFnN = type === "c" ? "importComponents" : type === "cs" ? "importCompositions" : "importDirectives";
    const { moduleName, name } = this.globalMap[getFnN](ctor);
    let imported = (<any[]>context[typedf]).find(i => i.moduleName === moduleName && i.templateName === name);
    if (!imported) {
      imported = { moduleName: moduleName!, templateName: name, type: <any>ctor, importId: createEntityId() };
      context[imtFnN]([<any>imported]);
    }
    const prefix = payload.compoid ? `${payload.compoid}_` : "";
    return {
      entityName: payload.entityId || `${prefix}${payload.elementKey || createEntityId()}`,
      imported,
    };
  }

  private resolveProps(otherProps: { [x: string]: IChildNodes<string | number | IReactEntityPayload> }) {
    const entries = Object.entries(otherProps);
    const newProps: Record<string, any> = {};
    for (const [key, value] of entries) {
      const prop = (newProps[key] = {
        type: "literal",
        expression: value,
        syntaxExtends: {},
      });
      // 解析props状态绑定
      if (typeof value === "string") {
        const result = /^(!)?([0-9a-zA-Z_\.]+)\s*\|\s*bind:(state|props)$/.exec(value);
        if (result !== null) {
          const reverse = result[1];
          const vname = result[2];
          const type = result[3];
          prop.expression = vname;
          prop.syntaxExtends = { reverse: reverse === "!" };
          prop.type = type;
        }
      }
    }
    return newProps;
  }

  private resolveComponentChildNodes(state: {
    type: "component" | "composition" | "directive";
    ref: BasicComponentChildRef<any> | BasicCompositionChildRef<any> | BasicDirectiveChildRef<any>;
    context: IResolve["context"];
    children: IChildNodes<string | number | IReactEntityPayload>;
    compoid?: string;
    parent?: IParent;
    contextChildren?: any[];
  }) {
    const { type, children, context, ref, contextChildren, compoid, parent } = state;
    const childNodes = (<IReactEntityPayload[]>(
      ((is.array(children) ? children : [children]).filter(i => typeof i === "object") as unknown[])
    ))
      .map(e =>
        this.resolveEntity({
          context,
          element: e,
          parent: { target: <IInnerCompnentChildRef>(<unknown>ref), parent },
          compositionKey: compoid,
          contextChildren,
        }),
      )
      .filter(i => !!i);
    if (type !== "directive") {
      (<any>ref)["__refComponents"] = childNodes.filter(
        c => c!.__etype === "componentChildRef" || c!.__etype === "compositionChildRef",
      );
      (<any>ref)["__refDirectives"] = childNodes.filter(c => c!.__etype === "directiveChildRef");
    }
  }

  private resolveAttachProperty(props: IReactEntityPayload["props"], parent: IParent) {
    // 附加属性
    if (!parent.parent?.target) throw new Error("attach property invalid.");
    const host = parent.parent.target;
    const attaches = resolveAttachProperties(host.__refConstructor);
    const { children } = props;
    const childNodes = is.array(children) ? children : [children];
    for (const node of childNodes) {
      if (!is.object(node)) continue;
      const attachName = node.type.__key!;
      const attachValue = node.props.value || node.props.children;
      const found = Object.entries(attaches).find(i => i[1].realName === attachName);
      if (found && "attach" in host.__options) {
        const propName = found[1].name.value;
        const attach = host.__options.attach[propName] || {
          type: "childRefs",
          expression: [],
        };
        attach.expression.push({ id: parent.target.__entityId, value: <any>attachValue });
        host.__options.attach[propName] = attach;
      }
    }
    return <any>null;
  }

  private resolveInputProperty(props: IReactEntityPayload["props"], parent: IParent) {
    // 附加属性
    if (!parent.target) throw new Error("input property invalid.");
    const host = parent.target;
    const inputs = resolveInputProperties(host.__refConstructor);
    const { children } = props;
    const childNodes = is.array(children) ? children : [children];
    for (const node of childNodes) {
      if (!is.object(node)) continue;
      const inputName = node.type.__key!;
      let inputValue: any = node.props.value || node.props.children;
      const found = Object.entries(inputs).find(i => i[1].realName === inputName);
      if (found) {
        const [propName, foundDefine] = found;
        let [group, pName] = propName.split(".");
        let container: Record<string, any>;
        if (pName) {
          container = host.__options.input[group] || (host.__options.input[group] = {});
        } else {
          pName = group;
          container = host.__options.input || (host.__options.input = {});
        }
        const input = container[pName] || {
          type: "literal",
          expression: null,
        };
        if (foundDefine.type.meta === "map") {
          inputValue = node.props.map ? Object.entries(node.props.map) : inputValue;
        }
        input.expression = inputValue;
        container[pName] = input;
      }
    }
    return <any>null;
  }

  public createEngine(options: IEngineOptions): IEngine {
    if (this.context === options.context && this.engine) {
      return this.engine;
    }
    this.context = options.context;
    return (this.engine = {
      parseComposite: (element: JSX.Element, { parent, key, children }: IReconcilerExtends = {}) =>
        <IInnerCompnentChildRef>this.resolveEntity({
          context: this.context,
          element: <any>element,
          parent: !!parent ? { target: parent } : undefined,
          contextChildren: children,
          compositionKey: key,
          key,
        }),
      parseGenerator(element: JSX.Element) {
        throw new Error("not implemented.");
      },
    });
  }
}
