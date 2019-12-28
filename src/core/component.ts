import ts from "typescript";
import { InjectDIToken } from "@bonbons/di";
import { IConstructor } from "../decorators";
import { BasicDirective } from "./directive";
import {
  IBasicCompilationContext,
  IPureObject,
  BasicCompilationEntity,
  IBasicComponentAppendType
} from "./base";
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

export abstract class BasicComponent<
  T extends IPureObject = IPureObject
> extends BasicCompilationEntity<T> {
  private __rendered: boolean = false;
  private __children: BasicComponent[] = [];
  private __directives: BasicDirective[] = [];

  public get rendered() {
    return this.__rendered;
  }

  //#region hooks

  /** @override */
  protected async onInit(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onInit"]();
    }
    for (const iterator of this.__directives) {
      await iterator["onInit"]();
    }
  }

  /** @override */
  protected async onChildrenPreRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onPreRender"]();
    }
  }

  /** @override */
  protected async onChildrenRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onRender"]();
    }
  }

  /** @override */
  protected async onChildrenPostRender(): Promise<void> {
    for (const iterator of this.__children) {
      await iterator["onPostRender"]();
    }
  }

  /** @override */
  protected async onDirectivesPreAttach(): Promise<void> {
    for (const iterator of this.__directives) {
      await iterator["onPreAttach"]();
    }
  }

  /** @override */
  protected async onDirectivesAttach(): Promise<void> {
    for (const iterator of this.__directives) {
      await iterator["onAttach"]();
    }
  }

  /** @override */
  protected async onDirectivesPostAttach(): Promise<void> {
    for (const iterator of this.__directives) {
      await iterator["onPostAttach"]();
    }
  }

  /** @override */
  protected onPreRender(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onRender(): Promise<void> {
    return Promise.resolve();
  }

  /** @override */
  protected onPostRender(): Promise<void> {
    return Promise.resolve();
  }

  //#endregion

  //#region  pretected methods

  //#endregion

  //#region private methods

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

  protected async onPreRender() {
    await super.onPreRender();
    this.setExtendParent(
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        TYPES.PureComponent
      ])
    );
    this.setRootElement(REACT.Fragment, {});
  }

  protected async onRender() {
    await super.onPostRender();
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

export interface IComponentPluginOptions {
  type: typeof BasicComponent;
  options: { [prop: string]: any };
  components: IComponentPluginOptions[];
  directives: IDirectivePluginOptions[];
}

export interface IDirectivePluginOptions {
  type: typeof BasicDirective;
  options: { [prop: string]: any };
}

export interface IInstanceCreateOptions<T extends InjectDIToken<any>> {
  template: T;
  options?: { [prop: string]: any };
  components?: IComponentPluginOptions[];
  directives?: IDirectivePluginOptions[];
  passContext?: IBasicCompilationContext;
}

export function createTemplateInstance<T extends typeof BasicComponent>({
  template,
  options = {},
  components = [],
  directives = [],
  passContext
}: IInstanceCreateOptions<T>) {
  const context: IBasicCompilationContext = passContext || {
    extendParent: new Map(),
    implementParents: new Map(),
    fields: new Map(),
    properties: new Map(),
    methods: new Map()
  };
  const model = initPropsContextIst(template, options, context);
  for (const iterator of components) {
    model["__children"].push(
      createTemplateInstance({
        template: iterator.type,
        options: iterator.options,
        components: iterator.components,
        directives: iterator.directives,
        passContext: context
      })
    );
  }
  for (const iterator of directives) {
    model["__directives"].push(
      initPropsContextIst(iterator.type, iterator.options, context)
    );
  }
  return model;
}

function initPropsContextIst<T extends BasicCompilationEntity>(
  template: InjectDIToken<T>,
  options: { [prop: string]: any },
  context: IBasicCompilationContext
): T {
  const model = inputProperties(new (<any>template)(), options);
  Object.defineProperty(model, "__context", {
    enumerable: true,
    configurable: false,
    get() {
      return context;
    }
  });
  return model;
}

function inputProperties<T extends any>(model: T, options: any): T {
  const props = resolveInputProperties(
    Object.getPrototypeOf(model).constructor
  );
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
