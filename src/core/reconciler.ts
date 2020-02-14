import { ReactNode } from "react";
import { FiberRoot } from "react-reconciler";
import { SourceFileContext, IBasicEntityProvider } from "./base";
import { IInnerComponent } from "./component";
import { IConstructor } from "./decorators";

export type ReconcilerTarget<T> = {
  [key in keyof T]: T[key] extends [infer K, infer V][]
    ? K extends string | number | symbol
      ? Partial<Record<K, V>> | [K, V][]
      : [K, V][]
    : T[key];
};

export interface IProxyComponent {
  __useReconciler?: true;
  __target: IConstructor<IInnerComponent>;
}

export type IType = IProxyComponent;

export interface IProps {
  props: Record<string, any>;
  inputs: Record<string, any>;
  attaches: Record<string, any>;
}

export interface IContainer {
  _rootContainer?: FiberRoot;
}

export interface IInstance {}

export interface ITextInstance {}

export interface IHydratableInstance {}

export interface IPublicInstance {}

export interface IHostContext {}

export interface IUpdatePayload {}

export interface IChildSet {}

export interface ITimeoutHandle {}

export interface INoTimeout {}

export interface IEngineOptions {
  context: SourceFileContext<IBasicEntityProvider>;
}

export interface IEngine {
  render(element: JSX.Element): Promise<any>;
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
