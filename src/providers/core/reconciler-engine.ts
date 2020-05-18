import { InjectScope, Injector } from "@bonbons/di";
import {
  ChildrenSlotComponent,
  IChildNodes,
  ICompChildRefPluginOptions,
  IComponentProp,
  ICompositeChildRefPluginOptions,
  IConstructor,
  IDirecChildRefPluginOptions,
  IEngine,
  IEngineOptions,
  IInnerCompnentChildRef,
  IInnerCompositionChildRef,
  IInnerDirectiveChildRef,
  IProxyEntity,
  IReactEntityPayload,
  IReconcilerExtends,
  Injectable,
  ReconcilerEngine,
  resolveAttachProperties,
  resolveComponent,
  resolveComposition,
  resolveDirective,
  resolveInputProperties,
} from "../../core";
import { BasicComponentChildRef, BasicCompositionChildRef, BasicDirectiveChildRef } from "../entities";
import { SourceFileBasicContext, setBaseChildRefInfo } from "./context";
import { createEntityId, is } from "../../utils";
import { GlobalMap } from "../global-map";
import { BasicEntityProvider } from "../entity-parser";

interface IParent {
  target: IInnerCompnentChildRef | IInnerDirectiveChildRef | IInnerCompositionChildRef;
  parent?: IParent;
}

interface IResolve {
  context: SourceFileBasicContext<BasicEntityProvider>;
  element: IReactEntityPayload;
  parent?: IParent;
  key?: string;
  childIndex?: number;
  compositionKey?: string;
  contextChildren?: (IInnerCompnentChildRef | IInnerCompositionChildRef)[];
}

interface IChildPass {
  // entity key of scope
  entityId: string;
  compoid: string;
  // jsx key field
  elementKey: string | null;
  ctor: IConstructor<any>;
  props: IReactEntityPayload["props"];
  parent: IResolve["parent"];
  contextChildren?: any[];
  childidx?: number;
}

const STATE_PROP_REF_VARIABLE = /^(!)?([0-9a-zA-Z_\.]+)\s*\|\s*bind:(state|props)$/;

@Injectable(InjectScope.New)
export class ReactReconcilerEngine extends ReconcilerEngine {
  private engine!: IEngine;
  private context!: SourceFileBasicContext<BasicEntityProvider>;

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
    const { parent, key: entityId, compositionKey: compId, contextChildren, childIndex } = resolves;
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
        const ref = this[fn]({
          entityId: id,
          compoid: compId!,
          elementKey: id,
          ctor: <any>child.__refConstructor,
          props: {},
          parent,
          contextChildren: [],
          childidx: children.indexOf(child),
        });
        // hack readonly
        (<any>ref).__options = child.__options;
        return ref;
      }
      return null;
    }

    const cpass: IChildPass = {
      entityId: entityId!,
      compoid: compId!,
      elementKey: key,
      ctor,
      props,
      parent,
      contextChildren,
      childidx: childIndex,
    };

    // 标准指令生成器
    const direMeta = resolveDirective(ctor);
    if (direMeta.name) {
      return this.resolveDirective(cpass);
    }
    // 标准组件生成器
    const compMeta = resolveComponent(ctor);
    if (compMeta.name) {
      return this.resolveComponent(cpass);
    }
    // 标准捆绑
    const compsiMeta = resolveComposition(ctor);
    if (compsiMeta.name) {
      return this.resolveComposition(cpass);
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

  private resolveComposition(pass: IChildPass) {
    const { elementKey, compoid, ctor, entityId, childidx, props, parent, contextChildren } = pass;
    const { entityName, imported } = this.resolveEntityName("cs", ctor, {
      elementKey,
      compoid,
      entityId,
      compoIdx: childidx,
    });
    const options: ICompositeChildRefPluginOptions = {
      entityName,
      refEntityId: imported.importId,
      components: [],
      options: { input: {} },
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key: _, children } = props;
    const ref = this.injector.get(BasicCompositionChildRef);
    setBaseChildRefInfo(this.context, <any>ref, options, ctor, <any>parent?.target);
    this.resolveComponentChildNodes({ type: "composition", ref, ctor, children, compoid, parent, contextChildren });
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private resolveComponent(pass: IChildPass) {
    const { elementKey, compoid, ctor, entityId, childidx, props, parent, contextChildren } = pass;
    const { entityName, imported } = this.resolveEntityName("c", ctor, {
      elementKey,
      compoid,
      entityId,
      compoIdx: childidx,
    });
    const options: ICompChildRefPluginOptions = {
      entityName,
      refEntityId: imported.importId,
      directives: [],
      components: [],
      options: { input: {}, attach: {}, props: {} },
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key: _, children, ...otherProps } = props;
    options.options.props = this.resolveProps(otherProps);
    const ref = this.injector.get(BasicComponentChildRef);
    setBaseChildRefInfo(this.context, <any>ref, options, ctor, <any>parent?.target);
    this.resolveComponentChildNodes({ type: "component", ref, ctor, children, compoid, parent, contextChildren });
    // console.log(ref.entityId);
    return <IInnerCompnentChildRef>(<unknown>ref);
  }

  private resolveDirective(pass: IChildPass) {
    const { elementKey, compoid, ctor, entityId, childidx, props, parent } = pass;
    const { entityName, imported } = this.resolveEntityName("d", ctor, {
      elementKey,
      compoid,
      entityId,
      compoIdx: childidx,
    });
    const options: IDirecChildRefPluginOptions = {
      entityName,
      refEntityId: imported.importId,
      options: { input: {} },
    };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { key: _, children } = props;
    const ref = this.injector.get(BasicDirectiveChildRef);
    setBaseChildRefInfo(this.context, <any>ref, options, ctor, <any>parent?.target);
    this.resolveComponentChildNodes({
      type: "directive",
      ctor,
      ref,
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
    payload: {
      elementKey: string | null;
      entityId: string;
      compoid: string;
      compoIdx?: number;
    },
  ) {
    const typedf = type === "c" ? "components" : type === "cs" ? "compositions" : "directives";
    const getFnN = type === "c" ? "getComponentByType" : type === "cs" ? "getCompositionByType" : "getDirectiveByType";
    const imtFnN = type === "c" ? "importComponents" : type === "cs" ? "importCompositions" : "importDirectives";
    const { moduleName, name } = this.globalMap[getFnN](ctor);
    let imported = (<any[]>this.context[typedf]).find(i => i.moduleName === moduleName && i.templateName === name);
    if (!imported) {
      imported = { moduleName: moduleName!, templateName: name, type: <any>ctor, importId: createEntityId() };
      this.context[imtFnN]([<any>imported]);
    }
    const prefix = payload.compoid ? `${payload.compoid}_` : "";
    return {
      entityName: payload.entityId ?? `${prefix}_${payload.elementKey ?? `ChildEntity${payload.compoIdx ?? 0}`}`,
      imported,
    };
  }

  private resolveProps(otherProps: { [x: string]: IChildNodes<string | number | IReactEntityPayload> }) {
    const entries = Object.entries(otherProps);
    const newProps: Record<string, IComponentProp> = {};
    for (const [key, value] of entries) {
      const prop = (newProps[key] = <IComponentProp>{
        type: "literal",
        expression: value,
        extensions: {},
      });
      // 解析props状态绑定
      if (typeof value === "string") {
        const result = STATE_PROP_REF_VARIABLE.exec(value);
        if (result !== null) {
          prop.expression = result[2];
          prop.extensions = { reverse: result[1] === "!" };
          prop.type = <"state" | "props">result[3];
        }
      }
    }
    return newProps;
  }

  private resolveComponentChildNodes(state: {
    type: "component" | "composition" | "directive";
    ctor: IConstructor<any>;
    ref: BasicComponentChildRef<any> | BasicCompositionChildRef<any> | BasicDirectiveChildRef<any>;
    children: IChildNodes<string | number | IReactEntityPayload>;
    compoid?: string;
    parent?: IParent;
    contextChildren?: any[];
  }) {
    const { type, children, ref, ctor, contextChildren, parent } = state;
    const childNodes = (<IReactEntityPayload[]>(
      ((is.array(children) ? children : [children]).filter(i => typeof i === "object") as unknown[])
    ))
      .map((e, idx) =>
        this.resolveEntity({
          context: this.context,
          element: e,
          parent: { target: <IInnerCompnentChildRef>(<unknown>ref), parent },
          compositionKey: ref.entityId,
          contextChildren,
          childIndex: idx,
        }),
      )
      .filter(i => !!i);
    if (type !== "directive") {
      (<any>ref)["__refComponents"] = childNodes.filter(
        c => c!.__etype === "componentChildRef" || c!.__etype === "compositionChildRef",
      );
      (<any>ref)["__refDirectives"] = childNodes.filter(c => c!.__etype === "directiveChildRef");
      if (type === "component") {
        // 支持Require语法
        this.context["_resolveComponentRequires"](<any>ref, ctor);
      }
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
        // eslint-disable-next-line prefer-const
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
    this.context = <any>options.context;
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
      parseGenerator(_: JSX.Element) {
        throw new Error("not implemented.");
      },
    });
  }
}
