import ts from "typescript";
import { PureComponent, ReactText } from "react";
import { IBasicEntityProvider, SourceFileContext } from "./base";
import { IInnerComponent } from "./component";
import { IConstructor } from "./decorators";
import { IInnerDirective } from "./directive";
import { IInnerCompnentChildRef, IInnerCompositionChildRef } from "./child-ref";
import { PropAttach } from "./libs";

export type IChildNodes<T> = T | T[];

export type ReconcilerInputMap<T> = T extends [infer K, infer V][]
  ? K extends string | number | symbol
    ? Partial<Record<K, V>> | [K, V][]
    : never
  : never;

export type ReconcilerInputValue<T> = T extends PropAttach<infer P> ? P : T;

export interface IReconcilerChildNode<T>
  extends IConstructor<
    React.PureComponent<
      {
        value?: ReconcilerInputValue<T>;
        map?: ReconcilerInputMap<T>;
        children?: ReconcilerInputValue<T>;
      },
      {},
      {}
    >
  > {}

export type ReconcilerChildNodes<T> = {
  [key in keyof T]: IReconcilerChildNode<T[key]>;
};

export interface IReconcilerContainer {
  /**
   * ## Children Attach Properties Container
   */
  Attaches: IConstructor<React.PureComponent<{}, {}, {}>>;
  /**
   * ## Template Input Properties Container
   */
  Inputs: IConstructor<React.PureComponent<{}, {}, {}>>;
}

export interface IReconcilerDefinition extends IConstructor<React.PureComponent<any, {}, {}>>, IReconcilerContainer {}

export type ReconcilerElement<T> = ReconcilerChildNodes<T> & IReconcilerDefinition;

export interface IProxyEntity {
  __useReconciler?: true;
  __key?: string;
  __parent?: IConstructor<IInnerComponent | IInnerDirective>;
  __target: IConstructor<IInnerComponent | IInnerDirective>;
}

export interface IEngineOptions {
  context: SourceFileContext<IBasicEntityProvider>;
}

export interface IReactEntityPayload {
  $$typeof: symbol;
  type: IProxyEntity;
  key: string | null;
  ref: null;
  props: Record<string, IChildNodes<IReactEntityPayload | ReactText>>;
  _owner: null;
  _store: null;
}

export interface IReconcilerExtends {
  parent?: IInnerCompnentChildRef;
  children?: (IInnerCompnentChildRef | IInnerCompositionChildRef)[];
  key?: string;
}

export interface IEngine {
  parseComposite(element: JSX.Element, options?: IReconcilerExtends): IInnerCompnentChildRef;
  parseGenerator(element: JSX.Element): ts.Node;
}

export function useReconciler<T>(ctor: IConstructor<T>): ReconcilerElement<T> {
  const innerMap: Record<string, Function> = {};
  return new Proxy<any>(ctor, {
    get(target, key: string) {
      if (key === "__useReconciler") {
        return true;
      }
      if (key === "__target") {
        return target;
      }
      if (!innerMap[key]) {
        const proxy: any = function() {};
        Object.defineProperties(proxy, {
          __key: { value: key },
          __parent: { value: target },
          __target: { value: proxy },
          __useReconciler: { value: true },
        });
        innerMap[key] = proxy;
      }
      return innerMap[key];
    },
    set(_, __, ___) {
      return false;
    },
  });
}

export class ChildrenSlotComponent extends PureComponent<{}, {}, {}> {}

/**
 * ## Reconciler ChildNodes Slot Container
 * @support `Component` | `Composition`
 **/
export const ChildrenSlot = useReconciler(ChildrenSlotComponent);

export abstract class ReconcilerEngine {
  abstract createEngine(options: IEngineOptions): IEngine;
}
