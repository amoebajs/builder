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
  protected __refId!: IDirectiveChildRefPrivates["__refId"];
  protected __refOptions: IDirectiveChildRefPrivates["__refOptions"] = {
    input: {},
  };

  constructor() {
    super();
    this["__etype"] = "directiveChildRef";
  }
}

@Injectable(InjectScope.New)
export abstract class BasicComponentChildRef<T extends IPureObject = IPureObject> extends BasicChildRef<T> {
  protected __refId!: IComponentChildRefPrivates["__refId"];
  protected __refOptions: IComponentChildRefPrivates["__refOptions"] = {
    input: {},
    attach: {},
    props: {},
  };
  protected __refComponnents: IComponentChildRefPrivates["__refComponnents"] = [];
  protected __refDirectives: IComponentChildRefPrivates["__refDirectives"] = [];

  constructor() {
    super();
    this["__etype"] = "componentChildRef";
  }
}
