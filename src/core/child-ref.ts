import {
  BasicCompilationEntity,
  IComponentAttachMap,
  IComponentInputMap,
  IComponentPropMap,
  IDirectiveInputMap,
  IEwsEntity,
  IEwsEntityPrivates,
  IEwsEntityProtectedHooks,
  IPureObject,
} from "./base";
import { EntityConstructor } from "./decorators";

export interface IBasicChildRef extends IEwsEntity {
  readonly componentRef: string;
}

export interface IBasicChildRefProtectedHooks extends IEwsEntityProtectedHooks {
  onPreEmit(): Promise<void>;
  onEmit(): Promise<void>;
  onPostEmit(): Promise<void>;
}

export interface IBasicChildRefPrivates {
  readonly __refId: string;
  readonly __refConstructor: EntityConstructor<any>;
  readonly __entityId: string;
  readonly __options: {};
}

export interface IComponentChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"componentChildRef"> {
  readonly __options: {
    input: IComponentInputMap;
    attach: IComponentAttachMap;
    props: IComponentPropMap;
  };
  readonly __refComponnents: IInnerCompnentChildRef[];
  readonly __refDirectives: IInnerDirectiveChildRef[];
}

export interface IDirectiveChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"directiveChildRef"> {
  readonly __options: {
    input: IDirectiveInputMap;
  };
}

export interface IInnerCompnentChildRef
  extends IBasicChildRef,
    IComponentChildRefPrivates,
    IBasicChildRefProtectedHooks {}

export interface IInnerDirectiveChildRef
  extends IBasicChildRef,
    IDirectiveChildRefPrivates,
    IBasicChildRefProtectedHooks {}

export abstract class BasicChildRef<T extends IPureObject = IPureObject> extends BasicCompilationEntity<T> {
  protected __refId!: IBasicChildRefPrivates["__refId"];
  protected __refConstructor!: IBasicChildRefPrivates["__refConstructor"];
  protected __entityId!: IBasicChildRefPrivates["__entityId"];
  protected __refOptions: IBasicChildRefPrivates["__options"] = {};

  public get enntityRefId() {
    return this.__refId;
  }

  constructor() {
    super();
    this["__etype"] = "childref";
  }

  /** @override */
  protected async onInit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onPreEmit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onEmit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onPostEmit(): Promise<void> {
    return Promise.resolve();
  }
}
