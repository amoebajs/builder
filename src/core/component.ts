import ts from "typescript";
import { BasicDirective } from "./directive";
import { resolveInputProperties } from "../decorators/property";
import { TYPES } from "../utils/base";

export interface IBasicComponentContext {
  extendParent: ts.HeritageClause | null;
  implementParents: ts.HeritageClause[];
  fields: ts.PropertyDeclaration[];
  properties: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  rootChildren: ts.JsxElement[];
}

export type IBasicComponentAppendType = "push" | "unshift" | "reset";

export abstract class BasicComponent {
  private __rendered: boolean = false;
  private __source: ts.SourceFile | null = null;
  private __children: BasicComponent[] = [];
  private __directives: BasicDirective[] = [];
  private __state: { [prop: string]: any } = {};
  private __context: IBasicComponentContext = {
    extendParent: null,
    implementParents: [],
    fields: [],
    properties: [],
    methods: [],
    rootChildren: []
  };

  public isComponentRendered() {
    return this.__rendered;
  }

  public getRenderedSourceCode() {
    return this.__source;
  }

  private __addChildElements<T extends any>(
    target: keyof IBasicComponentContext,
    args: T[],
    type: IBasicComponentAppendType
  ) {
    if (target === "extendParent") {
      this.__context[target] = args[0];
      return;
    }
    if (type === "reset") {
      (<unknown>this.__context[target]) = args;
    } else {
      this.__context[target][type](...(<any>args));
    }
  }

  private __getChildElements<T extends keyof IBasicComponentContext>(
    target: T
  ) {
    return this.__context[target];
  }

  protected setState<T>(key: string, value: T) {
    this.__state[key] = value;
  }

  protected getState<T>(key: string, defaultValue: any = null) {
    return this.__state[key] || defaultValue;
  }

  protected addRootChildren(
    args: ts.JsxElement[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("rootChildren", args, type);
  }

  protected getRootChildren() {
    return this.__getChildElements("rootChildren");
  }

  protected addMethods(
    args: ts.MethodDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("methods", args, type);
  }

  protected getMethods() {
    return this.__getChildElements("methods");
  }

  protected addProperties(
    args: ts.PropertyDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("properties", args, type);
  }

  protected getProperties() {
    return this.__getChildElements("properties");
  }

  protected addFields(
    args: ts.PropertyDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("fields", args, type);
  }

  protected getFields() {
    return this.__getChildElements("fields");
  }

  protected addImplementParents(
    args: ts.HeritageClause[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("implementParents", args, type);
  }

  protected getImplementParents() {
    return this.__getChildElements("implementParents");
  }

  protected setExtendParent(arg: ts.HeritageClause) {
    return this.__addChildElements("implementParents", [arg], "reset");
  }

  protected getExtendParent() {
    return this.__getChildElements("extendParent");
  }

  protected async onInit(): Promise<void> {
    await this.onRenderStart();
    await this.onChildrenStartRender();
    for (const childNode of this.__children) {
      await childNode.onInit();
    }
    await this.onChildrenRendered();
    await this.onDirectivesStartEmit();
    for (const childNode of this.__directives) {
      await childNode["onInit"]();
    }
    await this.onDirectivesEmitted();
    // Generate Source Code here
    this.__rendered = true;
    await this.onRendered();
  }

  protected onChildrenStartRender(): Promise<void> {
    return Promise.resolve();
  }

  protected onChildrenRendered(): Promise<void> {
    return Promise.resolve();
  }

  protected onDirectivesStartEmit(): Promise<void> {
    return Promise.resolve();
  }

  protected onDirectivesEmitted(): Promise<void> {
    return Promise.resolve();
  }

  protected onRenderStart(): Promise<void> {
    return Promise.resolve();
  }

  protected onRendered(): Promise<void> {
    return Promise.resolve();
  }
}

export class BasicReactComponent extends BasicComponent {
  protected async onRenderStart() {
    this.setExtendParent(
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        TYPES.PureComponent
      ])
    );
    await super.onRenderStart();
  }
}

export async function createTemplateInstance<T extends typeof BasicComponent>(
  template: T,
  options: any
) {
  const model = inputProperties<BasicComponent>(template, options);
  await model["onInit"]();
  return model;
}

function inputProperties<T = any>(template: any, options: any): T {
  const model = "prototype" in template ? new (<any>template)() : template;
  const ctor =
    "prototype" in template
      ? template
      : Object.getPrototypeOf(template).constructor;
  const props = resolveInputProperties(ctor);
  for (const key in props) {
    if (props.hasOwnProperty(key)) {
      const prop = props[key];
      const group = prop.group;
      if (
        group &&
        options.hasOwnProperty(group) &&
        options[group].hasOwnProperty(prop.name.value!)
      ) {
        (<any>model)[prop.realName] = options[group][prop.name.value!];
      } else if (options.hasOwnProperty(prop.name!)) {
        (<any>model)[prop.realName] = options[prop.name.value!];
      }
    }
  }
  return model;
}
