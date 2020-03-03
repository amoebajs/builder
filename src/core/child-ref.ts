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
  readonly __instanceRef: any;
}

export interface IComponentChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"componentChildRef"> {
  readonly __options: {
    input: IComponentInputMap;
    attach: IComponentAttachMap;
    props: IComponentPropMap;
  };
  readonly __refComponents: (IInnerCompnentChildRef | IInnerCompositionChildRef)[];
  readonly __refDirectives: IInnerDirectiveChildRef[];
  readonly __refRequires: ((context: any) => IInnerDirectiveChildRef)[];
}

export interface IDirectiveChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"directiveChildRef"> {
  readonly __options: {
    input: IDirectiveInputMap;
  };
}

export interface ICompositionChildRefPrivates
  extends IBasicChildRefPrivates,
    IEwsEntityPrivates<"compositionChildRef"> {
  readonly __options: {
    input: IDirectiveInputMap;
  };
  readonly __refComponents: (IInnerCompnentChildRef | IInnerCompositionChildRef)[];
}

export interface IInnerCompnentChildRef
  extends IBasicChildRef,
    IComponentChildRefPrivates,
    IBasicChildRefProtectedHooks {}

export interface IInnerDirectiveChildRef
  extends IBasicChildRef,
    IDirectiveChildRefPrivates,
    IBasicChildRefProtectedHooks {}

export interface IInnerCompositionChildRef
  extends IBasicChildRef,
    ICompositionChildRefPrivates,
    IBasicChildRefProtectedHooks {}

export abstract class BasicChildRef<T extends IPureObject = IPureObject> extends BasicCompilationEntity<T> {
  protected __refId!: IBasicChildRefPrivates["__refId"];
  protected __refConstructor!: IBasicChildRefPrivates["__refConstructor"];
  protected __entityId!: IBasicChildRefPrivates["__entityId"];
  protected __options: IBasicChildRefPrivates["__options"] = {};
  protected __provider!: IBasicChildRefPrivates["__provider"];
  protected __parentRef!: IBasicChildRefPrivates["__parentRef"];
  protected __instanceRef!: IBasicChildRefPrivates["__instanceRef"];

  constructor() {
    super();
    this["__etype"] = "childref";
  }

  protected async bootstrap(): Promise<any> {
    const instance = await this.__provider.attachInstance(this.__context, <any>this);
    this.__instanceRef = instance;
    return instance;
  }
}
