import {
  BasicChildRef,
  IComponentChildRefPrivates,
  IDirectiveChildRefPrivates,
  IPureObject,
  Injectable,
} from "../../core";
import { InjectScope } from "@bonbons/di";

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

  public get entityInputs(): IComponentChildRefPrivates["__options"]["input"] {
    return this.__options.input;
  }

  public get entityAttaches(): IComponentChildRefPrivates["__options"]["attach"] {
    return this.__options.attach;
  }

  public get entityProps(): IComponentChildRefPrivates["__options"]["props"] {
    return this.__options.props;
  }

  public get children(): IComponentChildRefPrivates["__refComponents"] {
    return this.__refComponents;
  }

  public get directives(): IComponentChildRefPrivates["__refDirectives"] {
    return this.__refDirectives;
  }

  constructor() {
    super();
    this["__etype"] = "componentChildRef";
  }
}
