import { IInnerDirective as IDirective } from "./directive";
import {
  BasicCompilationEntity,
  IComponentPropMap,
  IEwsEntity,
  IEwsEntityPrivates,
  IEwsEntityProtectedHooks,
  IPureObject,
} from "./base";

export interface IComponent extends IEwsEntity {}

export interface IComponentProtectedHooks extends IEwsEntityProtectedHooks {
  onChildrenRender(): Promise<void>;
  onRender(): Promise<void>;
}

export interface IComponentPrivates extends IEwsEntityPrivates<"component"> {
  readonly __rendered: boolean;
  readonly __children: IChildElement[];
  readonly __components: IInnerComponent[];
  readonly __directives: IDirective[];
}

export interface IInnerComponent extends IComponent, IComponentPrivates, IComponentProtectedHooks {}

export interface IChildElement {
  component: string;
  id: string;
  props: IComponentPropMap;
}

export interface IAfterInit {
  afterInit(): Promise<void> | void;
}

export interface IAfterRequiresInit {
  afterRequiresInit(): Promise<void> | void;
}

export interface IAfterChildrenRender {
  afterChildrenRender(): Promise<void> | void;
}

export interface IAfterRender {
  afterRender(): Promise<void> | void;
}

export interface IAfterDirectivesAttach {
  afterDirectivesAttach(): Promise<void> | void;
}

export abstract class BasicComponent<T extends IPureObject = IPureObject> extends BasicCompilationEntity<T> {
  private readonly __children: IChildElement[] = [];
  // private readonly __compositions: BasicComposition[] = [];

  protected getChildren(): IChildElement[] {
    return [...this.__children];
  }

  constructor() {
    super();
    this["__etype"] = "component";
  }

  //#region hooks

  /** @override */
  protected async onInit(): Promise<void> {
    await super.onInit();
  }

  /** @override */
  protected async onChildrenRender(): Promise<void> {}

  /** @override */
  protected async onRender(): Promise<void> {}

  //#endregion
}
