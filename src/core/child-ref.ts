import {
  IEwsEntity,
  IEwsEntityProtectedHooks,
  IEwsEntityPrivates
} from "./base";

export interface IChildRef extends IEwsEntity {
  readonly componentRef: string;
}

export interface IChildRefProtectedHooks extends IEwsEntityProtectedHooks {
  onPreEmit(): Promise<void>;
  onEmit(): Promise<void>;
  onPostEmit(): Promise<void>;
}

export interface IChildRefPrivates extends IEwsEntityPrivates<"childref"> {
  readonly __refId: string;
  readonly __refOptions: { [name: string]: any };
}

export interface IInnerChildRef
  extends IChildRef,
    IChildRefPrivates,
    IChildRefProtectedHooks {}
