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
  compositionKey?: string;
}

@Injectable(InjectScope.New)
export class ReactReconcilerEngine extends ReconcilerEngine {
  private engine!: IEngine;
  private context!: SourceFileContext<IBasicEntityProvider>;

  constructor(protected injector: Injector, protected globalMap: GlobalMap) {
    super();
  }

  private resolveEntity(resolves: IResolve): IInnerCompnentChildRef | IInnerDirectiveChildRef {
    const { $$typeof, type: token, props, key } = resolves.element;
    const isReactElement = $$typeof.toString() === "Symbol(react.element)";
    const isValidProxy = token.__useReconciler === true;
    if (!isReactElement || !isValidProxy) throw new Error("invalid entity composition.");
    const ctor = token.__target;
    const { context, parent, key: entityId, compositionKey: compId } = resolves;
    const compMeta = resolveComponent(ctor);
    if (compMeta.name) {
      // 标准组件生成器
      return this.resolveComponent(entityId!, compId!, key, ctor, context, props, parent);
    }
    const direMeta = resolveDirective(ctor);
    // 标准指令生成器
    if (direMeta.name) {
      return this.resolveDirective(ctor, context, parent);
    }
    // 附加属性
    if (this.ifIsAttachExpression(token, parent)) {
      return this.resolveAttachProperty(props, parent!);
    }
    // 附加属性
    if (this.ifIsInputExpression(token, parent)) {
      return this.resolveInputProperty(props, parent!);
    }
    throw new Error("invalid directive or component.");
  }

  private ifIsAttachExpression(token: IProxyEntity, parent: IParent | undefined) {
    return parent && token.__parent && token.__parent !== parent.target.__refConstructor && token.__key === "Attaches";
  }

  private ifIsInputExpression(token: IProxyEntity, parent: IParent | undefined) {
    return parent && token.__parent && token.__parent === parent.target.__refConstructor && token.__key === "Inputs";
  }

  private resolveComponent(
    entityId: string,
    compoid: string,
    elementKey: string | null,
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
    const prefix = compoid ? `${compoid}_` : "";
    const ref = this.injector.get(BasicComponentChildRef);
    const { key: _, children, ...otherProps } = props;
    const options: ICompChildRefPluginOptions = {
      entityName: entityId || `${prefix}${elementKey || createEntityId()}`,
      refEntityId: imported.importId,
      directives: [],
      components: [],
      options: { input: {}, attach: {}, props: {} },
    };
    options.options.props = this.resolveProps(otherProps);
    setBaseChildRefInfo(context, <any>ref, options, ctor, parent?.target);
    this.resolveComponentChildNodes(ref, context, children, compoid, parent);
    return <IInnerCompnentChildRef>(<unknown>ref);
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

  private resolveComponentChildNodes(
    ref: BasicComponentChildRef<any>,
    context: IResolve["context"],
    children: IChildNodes<string | number | IReactEntityPayload>,
    compoid?: string,
    parent?: IParent,
  ) {
    const childNodes = (<IReactEntityPayload[]>(
      ((is.array(children) ? children : [children]).filter(i => typeof i === "object") as unknown[])
    ))
      .map(e =>
        this.resolveEntity({
          context,
          element: e,
          parent: { target: <IInnerCompnentChildRef>(<unknown>ref), parent },
          compositionKey: compoid,
        }),
      )
      .filter(i => !!i);
    ref["__refComponents"] = childNodes.filter(c => c["__etype"] === "componentChildRef") as IInnerCompnentChildRef[];
    ref["__refDirectives"] = childNodes.filter(c => c["__etype"] === "directiveChildRef") as IInnerDirectiveChildRef[];
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
      if (found) {
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
    if (!parent.target) throw new Error("attach property invalid.");
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
      parseComposite: (element: JSX.Element, { parent, key }: IReconcilerExtends = {}) =>
        <IInnerCompnentChildRef>this.resolveEntity({
          context: this.context,
          element: <any>element,
          parent: !!parent ? { target: parent } : undefined,
          key,
          compositionKey: key,
        }),
      parseGenerator(element: JSX.Element) {
        throw new Error("not implemented.");
      },
    });
  }
}
