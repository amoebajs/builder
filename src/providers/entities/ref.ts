import { InjectScope } from "@bonbons/di";
import {
  BasicChildRef,
  IComponentChildRefPrivates,
  IDirectiveChildRefPrivates,
  IInnerComponent,
  IInnerDirective,
  IPureObject,
  Injectable,
  callComponentLifecycle,
} from "../../core";

@Injectable(InjectScope.New)
export abstract class BasicDirectiveChildRef<T extends IPureObject = IPureObject> extends BasicChildRef<T> {
  protected __options: IDirectiveChildRefPrivates["__options"] = {
    input: {},
  };

  public get entityInputs(): IDirectiveChildRefPrivates["__options"]["input"] {
    return this.__options.input;
  }

  constructor() {
    super();
    this["__etype"] = "directiveChildRef";
  }

  protected async bootstrap() {
    const instance: IInnerDirective = await super.bootstrap();
    await instance.onInit();
    await instance.onPreAttach();
    await instance.onAttach();
    await instance.onPostAttach();
    return instance;
  }
}

@Injectable(InjectScope.New)
export abstract class BasicComponentChildRef<T extends IPureObject = IPureObject> extends BasicChildRef<T> {
  protected __options: IComponentChildRefPrivates["__options"] = {
    input: {},
    attach: {},
    props: {},
  };
  protected __refComponents: IComponentChildRefPrivates["__refComponents"] = [];
  protected __refDirectives: IComponentChildRefPrivates["__refDirectives"] = [];

  constructor() {
    super();
    this["__etype"] = "componentChildRef";
  }

  protected async bootstrap() {
    const instance: IInnerComponent = await super.bootstrap();
    await callComponentLifecycle(instance);
    return instance;
  }
}
