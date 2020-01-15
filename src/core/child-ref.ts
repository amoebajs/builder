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
  readonly __refOptions: {};
}

export interface IComponentChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"componentChildRef"> {
  readonly __refOptions: {
    input: IComponentInputMap;
    attach: IComponentAttachMap;
    props: IComponentPropMap;
  };
  readonly __refComponnents: IInnerCompnentChildRef[];
  readonly __refDirectives: IInnerDirectiveChildRef[];
}

export interface IDirectiveChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"directiveChildRef"> {
  readonly __refOptions: {
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
  protected __refOptions: IBasicChildRefPrivates["__refOptions"] = {};

  public get refType() {
    return this.__refId;
  }

  constructor() {
    super();
    this["__etype"] = "childref";
  }

  public setRefComponentId(refEntityId: IBasicChildRefPrivates["__refId"]) {
    this.__refId = refEntityId;
    return this;
  }

  public setRefOptions(options: IBasicChildRefPrivates["__refOptions"]) {
    this.__refOptions = options;
    return this;
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
