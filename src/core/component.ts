import ts from "typescript";
import { BasicDirective } from "./directive";
import { IBasicCompilationContext, IPureObject, MapValueType } from "./base";
import { resolveInputProperties } from "../decorators/property";
import {
  createJsxElement,
  createConstVariableStatement,
  TYPES,
  REACT,
  THIS
} from "../utils/base";

export interface IJsxAttrs {
  [key: string]: ts.JsxExpression | string;
}

export type IBasicComponentAppendType = "push" | "unshift" | "reset";

export abstract class BasicComponent<T extends IPureObject = IPureObject> {
  private __scope = Symbol(new Date().getTime());
  private __rendered: boolean = false;
  private __children: BasicComponent[] = [];
  private __directives: BasicDirective[] = [];
  private __state: T = <T>{};
  private __context!: IBasicCompilationContext;

  public get rendered() {
    return this.__rendered;
  }

  //#region hooks

  /** @override */
  protected async onInit(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onChildrenStartRender(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onChildrenRendered(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onDirectivesStartAttach(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onDirectivesAttached(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onRenderStart(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onRendered(): Promise<void> {
    return Promise.resolve();
  }

  //#endregion

  //#region  pretected methods

  protected setState<K extends keyof T>(key: K, value: T[K]): void {
    this.__state[key] = value;
  }

  protected getState<K extends keyof T>(
    key: K,
    defaultValue: T[K] | null = null
  ): T[K] | null {
    return this.__state[key] || defaultValue;
  }

  protected addMethods(
    args: ts.MethodDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("methods", args, type);
  }

  protected getMethods() {
    return this.__getChildElements("methods") || [];
  }

  protected addProperties(
    args: ts.PropertyDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("properties", args, type);
  }

  protected getProperties() {
    return this.__getChildElements("properties") || [];
  }

  protected addFields(
    args: ts.PropertyDeclaration[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("fields", args, type);
  }

  protected getFields() {
    return this.__getChildElements("fields") || [];
  }

  protected addImplementParents(
    args: ts.HeritageClause[],
    type: IBasicComponentAppendType = "push"
  ) {
    return this.__addChildElements("implementParents", args, type);
  }

  protected getImplementParents() {
    return this.__getChildElements("implementParents") || [];
  }

  protected setExtendParent(arg: ts.HeritageClause) {
    return this.__addChildElements("implementParents", [arg], "reset");
  }

  protected getExtendParent() {
    return this.__getChildElements("extendParent") || null;
  }

  //#endregion

  //#region private methods

  private __addChildElements<A extends any>(
    target: keyof IBasicCompilationContext,
    args: A[],
    type: IBasicComponentAppendType
  ) {
    const host: Map<string | symbol, any> = this.__context[target];
    if (target === "extendParent") {
      host.set(this.__scope, args[0]);
      return;
    }
    if (type === "reset") {
      host.set(this.__scope, args);
    } else {
      const oldValues = <unknown[]>host.get(this.__scope) || [];
      host.set(this.__scope, [...oldValues][type](...args));
    }
  }

  private __getChildElements<K extends keyof IBasicCompilationContext>(
    target: K
  ): MapValueType<IBasicCompilationContext[K]> {
    return this.__context[target].get(this.__scope) as any;
  }

  // 外部调用
  private async __syncChildrenHook(
    process: (childNode: BasicComponent) => Promise<void>
  ) {
    for (const childNode of this.__children) {
      await process(childNode);
    }
  }

  // 外部调用
  private async __syncDirectivesnHook(
    process: (childNode: BasicDirective) => Promise<void>
  ) {
    for (const childNode of this.__directives) {
      await process(childNode);
    }
  }

  //#endregion
}

export class BasicReactContainer extends BasicComponent {
  protected addRootChildren(
    args: ts.JsxElement[],
    type: IBasicComponentAppendType = "push"
  ) {
    const rootChildren: ts.JsxElement[] = this.getState("rootChildren");
    if (type === "reset") {
      this.setState("rootChildren", args);
    } else {
      const newChildren = [...rootChildren][type](...args);
      this.setState("rootChildren", newChildren);
    }
  }

  protected getRootChildren(): ts.JsxElement[] {
    return this.getState("rootChildren");
  }

  protected setRootElement(tagName: string, attrs: IJsxAttrs) {
    this.setState("rootElement", {
      name: tagName,
      attrs,
      types: []
    });
  }

  protected async onInit() {
    await super.onInit();
    this.setState("rootChildren", []);
  }

  protected async onRenderStart() {
    await super.onRenderStart();
    this.setExtendParent(
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        TYPES.PureComponent
      ])
    );
    this.setRootElement(REACT.Fragment, {});
  }

  protected async onRendered() {
    await super.onRendered();
    const root = this.getState("rootElement");
    const children = this.getRootChildren();
    const renderMethod = ts.createMethod(
      [],
      [ts.createModifier(ts.SyntaxKind.PublicKeyword)],
      undefined,
      ts.createIdentifier(REACT.Render),
      undefined,
      [],
      [],
      undefined,
      ts.createBlock([
        createConstVariableStatement(REACT.Props, false, undefined, THIS.Props),
        ts.createReturn(
          ts.createParen(
            createJsxElement(root.name, root.types, root.attrs, children)
          )
        )
      ])
    );
    this.addMethods([renderMethod]);
  }
}

export async function createTemplateInstance<T extends typeof BasicComponent>(
  template: T,
  options: any
) {
  const model = inputProperties<BasicComponent>(template, options);
  await onInitInvoke(model);
  await onRenderInvoke(model);
  return model;
}

async function onInitInvoke(model: BasicComponent) {
  await model["onInit"]();
  await model["__syncChildrenHook"](onInitInvoke);
  await model["__syncDirectivesnHook"](onDirectiveInitInvoke);
}

async function onRenderInvoke(model: BasicComponent) {
  await model["onRenderStart"]();
  await model["onDirectivesStartAttach"]();
  await model["__syncDirectivesnHook"](onDirectiveAttachInvoke);
  await model["onDirectivesAttached"]();
  await model["onChildrenStartRender"]();
  await model["__syncChildrenHook"](onRenderInvoke);
  await model["onChildrenRendered"]();
  await model["onRendered"]();
}

async function onDirectiveInitInvoke(model: BasicDirective) {
  await model["onInit"]();
}

async function onDirectiveAttachInvoke(model: BasicDirective) {
  await model["onAttachStart"]();
  await model["onAttached"]();
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
