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

export type ReconcilerElement<T> = IConstructor<
  React.PureComponent<Partial<ReconcilerTarget<T & { children: ReactNode | ReactNode[] }>>, {}>
> &
  Record<string, IConstructor<React.PureComponent<any>>>;

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
  key?: string;
}

export interface IEngine {
  parseComposite(element: JSX.Element, options?: IReconcilerExtends): IInnerCompnentChildRef;
  parseGenerator(element: JSX.Element): ts.Node;
}

export function useReconciler<T, A>(ctor: IConstructor<T>): ReconcilerElement<T> {
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
        const proxy = (innerMap[key] = useReconciler(<any>function() {}));
        innerMap[key] = new Proxy(proxy, {
          get(_target, _key: string) {
            if (_key === "__key") {
              return key;
            }
            if (_key === "__parent") {
              return target;
            }
            return _target[_key];
          },
        });
      }
      return innerMap[key];
    },
    set(target, key, value) {
      return false;
    },
  });
}

export abstract class ReconcilerEngine {
  abstract createEngine(options: IEngineOptions): IEngine;
}
