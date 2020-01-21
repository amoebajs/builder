import { is } from "../../utils/is";
import { EntityConstructor } from "../decorators";
import { IDirectivePluginOptions, ITypedSyntaxExpressionMap, createEntityId } from "../base";
import { BasicDirective } from "../directive";

export type ICompositionCreateQuickOptions = Record<string, unknown>;

export type ICompositionCreateFnType = (model: any, iterator: IDirectivePluginOptions<any>) => BasicDirective<any>;

export interface IInnerComposite {
  readonly enabled: boolean;
  readonly isInit: boolean;
  setCreateFn(fn: ICompositionCreateFnType): void;
  setEntity(entity: EntityConstructor<any>): void;
  setParent(parent: any): void;
  setProvider(provider: string): void;
  setBootstrapHook(startHook: (result: any) => void): void;
  init(): void;
}

export abstract class BasicComposition {
  protected _enabled: boolean = true;
  protected _init: boolean = false;
  protected inputs: Record<string, any> = {};
  protected parent!: any;
  protected provider!: string;
  protected createFn!: ICompositionCreateFnType;
  protected startHook!: (result: any) => void;
  protected entity!: EntityConstructor<any>;

  public get enabled() {
    return this._enabled;
  }

  public get isInit() {
    return this._init;
  }

  protected setEntity(entity: EntityConstructor<any>) {
    this.entity = entity;
  }

  protected setCreateFn(fn: ICompositionCreateFnType) {
    this.createFn = fn;
  }

  protected setParent(parent: any) {
    this.parent = parent;
  }

  protected setProvider(provider: string) {
    this.provider = provider;
  }

  protected setBootstrapHook(startHook: (result: any) => void) {
    this.startHook = startHook;
  }

  public init() {
    if (!this._enabled) return;
    if (this._init) return;
    this._init = true;
    this.startHook(
      this.createFn(this.parent, {
        provider: <any>this.provider,
        template: this.entity,
        input: this.inputs,
        id: createEntityId(),
      }),
    );
  }
}

export class Composition extends BasicComposition {
  constructor(options?: ICompositionCreateQuickOptions) {
    super();
    if (!is.nullOrUndefined(options)) {
      this.changeInputs(options);
    }
  }

  public changeEnabled(enabled: boolean) {
    this._enabled = enabled;
    return this;
  }

  public changeInputs(options: Record<string, unknown>) {
    const inputs: ITypedSyntaxExpressionMap<"literal"> = {};
    Object.entries(options).forEach(([k, t]) => {
      inputs[k] = {
        type: "literal",
        expression: t,
      };
    });
    this.inputs = inputs;
    return this;
  }
}

export class CompositionList extends BasicComposition {
  protected _listComposites: { enabled: boolean; options: Record<string, any> }[] = [];

  constructor(optionsList: Record<string, unknown>[] = []) {
    super();
    for (let index = 0; index < optionsList.length; index++) {
      this._listComposites.push({ enabled: true, options: {} });
      this.changeInputs(index, optionsList[index]);
    }
  }

  public addComposition(options: Record<string, unknown>, enabled = true) {
    this._listComposites.push({ enabled, options: {} });
    this.changeInputs(this._listComposites.length, options);
    return this;
  }

  public changeEnabled(index: number, enabled: boolean) {
    this._listComposites[index].enabled = enabled;
    return this;
  }

  public changeInputs(index: number, options: Record<string, unknown>) {
    const inputs: ITypedSyntaxExpressionMap<"literal"> = {};
    Object.entries(options).forEach(([k, t]) => {
      inputs[k] = {
        type: "literal",
        expression: t,
      };
    });
    this._listComposites[index].options = inputs;
    return this;
  }

  public init() {
    if (this._init) return;
    this._init = true;
    for (const iterator of this._listComposites) {
      if (!iterator.enabled) continue;
      this.startHook(
        this.createFn(this.parent, {
          provider: <any>this.provider,
          template: this.entity,
          input: iterator.options,
          id: createEntityId(),
        }),
      );
    }
  }
}
