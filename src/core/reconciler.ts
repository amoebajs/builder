import ts from "typescript";
import { ReactNode, ReactText } from "react";
import { SourceFileContext, IBasicEntityProvider } from "./base";
import { IInnerComponent } from "./component";
import { IConstructor } from "./decorators";
import { IInnerDirective } from "./directive";
import { IInnerCompnentChildRef } from "./child-ref";

type IChildNodes<T> = T | T[];

export type ReconcilerTarget<T> = {
  [key in keyof T]: T[key] extends [infer K, infer V][]
    ? K extends string | number | symbol
      ? Partial<Record<K, V>> | [K, V][]
      : [K, V][]
    : T[key];
};

export interface IProxyEntity {
  __useReconciler?: true;
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

export interface IEngine {
  parseComposite(element: JSX.Element, refId?: string): IInnerCompnentChildRef;
  parseGenerator(element: JSX.Element): ts.Node;
}

export function useReconciler<T>(
  ctor: IConstructor<T>,
): IConstructor<React.PureComponent<Partial<ReconcilerTarget<T & { children: ReactNode | ReactNode[] }>>, {}>> {
  return new Proxy<any>(ctor, {
    get(target, key) {
      if (key === "__useReconciler") {
        return true;
      }
      if (key === "__target") {
        return target;
      }
      return undefined;
    },
    set(target, key, value) {
      return false;
    },
  });
}

export abstract class ReconcilerEngine {
  abstract createEngine(options: IEngineOptions): IEngine;
}
