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
} from "../../core";
import { BasicComponentChildRef, BasicDirectiveChildRef } from "../entities";
import { setBaseChildRefInfo } from "./context";
import { createEntityId, is } from "../../utils";
import { GlobalMap } from "../global-map";

interface IResolve {
  context: SourceFileContext<IBasicEntityProvider>;
  element: IReactEntityPayload;
  parent?: IInnerCompnentChildRef;
  refId?: string;
}

@Injectable(InjectScope.New)
export class ReactReconcilerEngine extends ReconcilerEngine {
  private engine!: IEngine;
  private context!: SourceFileContext<IBasicEntityProvider>;

  constructor(protected injector: Injector, protected globalMap: GlobalMap) {
    super();
  }

  private resolveEntity({
    element,
    context,
    parent,
    refId,
  }: IResolve): IInnerCompnentChildRef | IInnerDirectiveChildRef {
    if (parent) {
      console.log({ element, context, parent, refId });
    }
    const { $$typeof, type: token, props } = element;
    const isReactElement = $$typeof.toString() === "Symbol(react.element)";
    const isValidProxy = token.__useReconciler === true;
    if (!isReactElement || !isValidProxy) throw new Error("invalid entity composition.");
    const ctor = token.__target;
    const compMeta = resolveComponent(ctor);
    if (compMeta.name) {
      const inputs = resolveInputProperties(ctor);
      const inputEntries = Object.entries(inputs);
      const ref = this.injector.get(BasicComponentChildRef);
      const { key: entityId, children, ...otherProps } = props;
      const options: ICompChildRefPluginOptions = {
        entityName: <string>entityId || createEntityId(),
        refEntityId: refId || "[none]",
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
      setBaseChildRefInfo(context, <any>ref, options, ctor, parent);
      const childNodes = (<IReactEntityPayload[]>(
        ((is.array(children) ? children : [children]).filter(i => typeof i === "object") as unknown[])
      )).map(e => this.resolveEntity({ context, element: e, parent: <IInnerCompnentChildRef>(<unknown>ref) }));
      ref["__refComponents"] = childNodes.filter(c => c["__etype"] === "componentChildRef") as IInnerCompnentChildRef[];
      ref["__refDirectives"] = childNodes.filter(
        c => c["__etype"] === "directiveChildRef",
      ) as IInnerDirectiveChildRef[];
      return <IInnerCompnentChildRef>(<unknown>ref);
    }
    const direMeta = resolveDirective(ctor);
    if (direMeta.name) {
      const ref = this.injector.get(BasicDirectiveChildRef);
      const options: IDirecChildRefPluginOptions = {
        entityName: createEntityId(),
        refEntityId: refId || "[none]",
        options: { input: {} },
      };
      setBaseChildRefInfo(context, <any>ref, options, ctor, parent);
      return <IInnerDirectiveChildRef>(<unknown>ref);
    }
    throw new Error("invalid directive or component.");
  }

  public createEngine(options: IEngineOptions): IEngine {
    if (this.context === options.context && this.engine) {
      return this.engine;
    }
    this.context = options.context;
    return (this.engine = {
      parseComposite: (element: JSX.Element, refId?: string) =>
        <IInnerCompnentChildRef>this.resolveEntity({ context: this.context, element: <any>element, refId }),
      parseGenerator(element: JSX.Element) {
        throw new Error("not implemented.");
      },
    });
  }
}
