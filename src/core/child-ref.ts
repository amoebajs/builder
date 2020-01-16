import {
  BasicCompilationEntity,
  IBasicEntityProvider,
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

export interface IBasicChildRef extends IEwsEntity {}

export interface IBasicChildRefProtectedHooks extends IEwsEntityProtectedHooks {
  onInit(): Promise<void>;
  bootstrap(): Promise<any>;
}

export interface IBasicChildRefPrivates {
  readonly __refId: string;
  readonly __refConstructor: EntityConstructor<any>;
  readonly __entityId: string;
  readonly __options: {};
  readonly __provider: IBasicEntityProvider;
  readonly __parentRef: IInnerCompnentChildRef | undefined;
}

export interface IComponentChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"componentChildRef"> {
  readonly __options: {
    input: IComponentInputMap;
    attach: IComponentAttachMap;
    props: IComponentPropMap;
  };
  readonly __refComponents: IInnerCompnentChildRef[];
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
  protected __options: IBasicChildRefPrivates["__options"] = {};
  protected __provider!: IBasicChildRefPrivates["__provider"];
  protected __parentRef!: IBasicChildRefPrivates["__parentRef"];

  constructor() {
    super();
    this["__etype"] = "childref";
  }

  protected async onInit() {
    return Promise.resolve();
  }

  protected async bootstrap(): Promise<any> {
    return await this.__provider.attachInstance(<any>this);
  }
}
