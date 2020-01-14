import { is } from "../../utils/is";
import { EntityConstructor } from "../decorators";
import { createEntityId } from "../base";
import { IDirectivePluginOptions } from "../../providers";
import { BasicDirective } from "../directive";

export interface ICompositionBootstrapOptions {
  enabled: () => boolean;
  bootstrapOptions: () => Record<string, unknown>;
}

export type ICompositionCreateQuickOptions = () => Record<string, unknown>;

export interface IInnerComposite {
  setCreateFn(fn: (model: any, iterator: IDirectivePluginOptions<any>) => BasicDirective<any>): void;
  setEntity(entity: EntityConstructor<any>): void;
}

export class Composition {
  public static create(enabled: boolean | (() => boolean), options: ICompositionCreateQuickOptions): Composition;
  public static create(options: ICompositionCreateQuickOptions): Composition;
  public static create(): Composition;
  public static create(...args: any[]) {
    let [enabled, options] = args;
    if (typeof enabled !== "boolean") {
      options = enabled;
      enabled = true;
    }
    return new Composition({ enabled, bootstrapOptions: options });
  }

  private createFn!: Function;
  private compositeEntity!: EntityConstructor<any>;
  private inputs: Record<string, unknown> = {};

  public changeEnabled(enabled: boolean) {
    this.options.enabled = () => enabled;
  }

  public changeInputs(options: Record<string, unknown> | (() => Record<string, unknown>)) {
    const optFn: () => Record<string, unknown> = is.object(options) ? () => <any>options : options;
    this.options.bootstrapOptions = optFn;
  }

  constructor(private options: ICompositionBootstrapOptions) {}

  protected setEntity(entity: EntityConstructor<any>) {
    this.compositeEntity = entity;
    this.inputs = this.options.bootstrapOptions();
  }

  protected setCreateFn(fn: (model: any, iterator: IDirectivePluginOptions<any>) => BasicDirective<any>) {
    this.createFn = fn;
  }

  protected bootstrap(parent: any) {
    this.inputs = this.options.bootstrapOptions();
    return this.createFn(parent, {
      template: this.compositeEntity,
      input: this.inputs,
      id: createEntityId(),
    });
  }
}
