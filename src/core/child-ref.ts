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
  onInit(): Promise<void>;
}

export interface IBasicChildRefPrivates {
  readonly __refId: string;
  readonly refId: string;
  readonly __refConstructor: EntityConstructor<any>;
  readonly refTemplate: EntityConstructor<any>;
  readonly __entityId: string;
  readonly entityId: string;
  readonly __options: {};
}

export interface IComponentChildRefPrivates extends IBasicChildRefPrivates, IEwsEntityPrivates<"componentChildRef"> {
  readonly __options: {
    input: IComponentInputMap;
    attach: IComponentAttachMap;
    props: IComponentPropMap;
  };
  readonly entityInputs: IComponentInputMap;
  readonly entityAttaches: IComponentAttachMap;
  readonly entityProps: IComponentPropMap;
  readonly __refComponents: IInnerCompnentChildRef[];
  readonly __refDirectives: IInnerDirectiveChildRef[];
  readonly children: IInnerCompnentChildRef[];
  readonly directives: IInnerDirectiveChildRef[];
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

  public get refId(): IBasicChildRefPrivates["refId"] {
    return this.__refId;
  }

  public get refTemplate(): IBasicChildRefPrivates["refTemplate"] {
    return this.__refConstructor;
  }

  public get entityId(): IBasicChildRefPrivates["entityId"] {
    return this.__entityId;
  }

  constructor() {
    super();
    this["__etype"] = "childref";
  }

  protected async onInit() {
    return Promise.resolve();
  }
}
