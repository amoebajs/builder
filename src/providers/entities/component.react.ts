import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { capitalize } from "lodash";
import { IPureObject } from "../../core/base";
import { REACT, TYPES } from "../../utils";
import { BasicComponent } from "../../core/component";
import { Injectable } from "../../core/decorators";
import { ReactHelper, ReactRender } from "../entity-helper";
import { JsxAttrGenerator, JsxElementGenerator, StatementGenerator, VariableGenerator } from "../../core/typescript";

export enum BasicState {
  TagName = "renderTageName",
  TagAttrs = "renderTagAttrs",
  UnshiftNodes = "renderUnshiftNodes",
  PushedNodes = "renderPushedNodes",
  UseStates = "compUseStates",
  UseCallbacks = "compUseCallbacks",
  UseEffects = "compUseEffects",
  CommonVariables = "compVariables",
}

export type IBasicReactContainerState<T = IPureObject> = T & {
  [BasicState.TagName]: string;
  [BasicState.TagAttrs]: JsxAttrGenerator[];
  [BasicState.UnshiftNodes]: JsxElementGenerator[];
  [BasicState.PushedNodes]: JsxElementGenerator[];
  [BasicState.UseStates]: VariableGenerator[];
  [BasicState.UseCallbacks]: VariableGenerator[];
  [BasicState.UseEffects]: VariableGenerator[];
  [BasicState.CommonVariables]: VariableGenerator[];
};

type TP = IBasicReactContainerState<IPureObject>;
type TY = IBasicReactContainerState<{}>;

@Injectable(InjectScope.New)
export abstract class ReactComponent<T extends TP = TY> extends BasicComponent<T> {
  private __elementMap: Map<string | symbol, JsxElementGenerator> = new Map();

  constructor(protected readonly helper: ReactHelper, protected readonly render: ReactRender) {
    super();
  }

  protected async onInit() {
    await super.onInit();
    this.render["parentRef"] = this;
    this.setState(BasicState.TagName, REACT.Fragment);
    this.setState(BasicState.TagAttrs, []);
    this.setState(BasicState.UnshiftNodes, []);
    this.setState(BasicState.PushedNodes, []);
    this.setState(BasicState.UseStates, []);
    this.setState(BasicState.UseCallbacks, []);
    this.setState(BasicState.UseEffects, []);
    this.setState(BasicState.CommonVariables, []);
  }

  protected async onChildrenPostRender() {
    await super.onChildrenPostRender();
    const children = this.getChildren();
    for (const child of children) {
      const ele = this.helper.createViewElement(child.component, { key: child.id });
      const props = child.props || {};
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          const element = props[key];
          switch (element.type) {
            case "state":
              ele.addJsxAttr(key, element.expression);
              break;
            case "props":
              ele.addJsxAttr(key, "props." + element.expression);
              break;
            case "literal":
              ele.addJsxAttr(key, element.expression);
              break;
            default:
              break;
          }
        }
      }
      this.addRenderChildren(child.id, this.helper.createViewElement(child.component, { key: child.id }));
    }
  }

  protected async onRender() {
    await super.onRender();
    this.createFunctionRender([]);
  }

  private createFunctionRender(statements: StatementGenerator[] = []) {
    const { states, callbacks, effects } = this.getReactUsesImports();
    this.addFunctions([
      this.createNode("function")
        .setName("render")
        .pushParam({ name: "props", type: "any" })
        .pushTransformerBeforeEmit(node => {
          node.body = this.createComponentBlock(
            this.createNode("jsx-element")
              .setTagName(this.getState(BasicState.TagName))
              .addJsxAttrs(this.getState(BasicState.TagAttrs))
              .addJsxChildren([
                ...this.getState(BasicState.UnshiftNodes),
                ...this.getRenderChildren(),
                ...this.getState(BasicState.PushedNodes),
              ]),
            (<StatementGenerator<any>[]>[])
              .concat(states)
              .concat(callbacks)
              .concat(effects)
              .concat(statements),
          );
          return node;
        }),
    ]);
  }

  protected getReactUsesImports() {
    const states = this.getState(BasicState.UseStates);
    const callbacks = this.getState(BasicState.UseCallbacks);
    const effects = this.getState(BasicState.UseEffects);
    const imports: string[] = [];
    if (states.length > 0) imports.push(REACT.UseState);
    if (callbacks.length > 0) imports.push(REACT.UseCallback);
    if (effects.length > 0) imports.push(REACT.UseEffect);
    this.addImports(
      imports.map(name =>
        this.createNode("import")
          .addNamedBinding(name)
          .setModulePath(REACT.NS),
      ),
    );
    return { states, callbacks, effects };
  }

  protected visitAndChangeChildNode(visitor: (key: string, node: JsxElementGenerator) => void) {
    const childNodes = Array.from(this.__elementMap.entries());
    for (const [key, node] of childNodes) {
      visitor(<string>key, node);
    }
  }

  protected visitAndNotifyChildKey(visitor: (key: string) => void) {
    const childNodes = Array.from(this.__elementMap.keys());
    for (const key of childNodes) {
      visitor(<string>key);
    }
  }

  protected addRenderAttrs(obj: Record<string, number | string | boolean | ts.Expression>) {
    const entries = Object.entries(obj);
    const existAttrs = this.getState(BasicState.TagAttrs);
    for (const [name, attr] of entries) {
      const valueExpression =
        typeof attr === "number" || typeof attr === "boolean"
          ? attr.toString()
          : typeof attr === "string"
          ? JSON.stringify(attr)
          : () => attr;
      const target = existAttrs.find(i => i["name"] === name);
      if (target) {
        target.setValue(valueExpression);
        continue;
      }
      existAttrs.push(
        this.createNode("jsx-attribute")
          .setName(name)
          .setValue(valueExpression),
      );
    }
  }

  protected addRenderChildren(id: string, element: JsxElementGenerator) {
    this.__elementMap.set(id, element);
  }

  protected getRenderChildren() {
    return Array.from(this.__elementMap.values());
  }

  protected addComponentUseState(name: string, defaultValue: unknown) {
    this.setState(BasicState.UseStates, [
      ...this.getState(BasicState.UseStates),
      this.createNode("variable").addField({
        arrayBinding: [name, "set" + capitalize(name)],
        initValue: () =>
          ts.createCall(ts.createIdentifier(REACT.UseState), [TYPES.Any], [this.helper.createLiteral(defaultValue)]),
      }),
    ]);
  }

  protected addComponentUseCallback(name: string, callback: Function | string, deps: string[] = []) {
    this.setState(BasicState.UseCallbacks, [
      ...this.getState(BasicState.UseCallbacks),
      this.createNode("variable").addField({
        name: callback.toString(),
        initValue: () =>
          this.helper.createFunctionCall(REACT.UseCallback, [
            ts.createIdentifier(callback.toString()),
            ts.createArrayLiteral(deps.map(dep => ts.createIdentifier(dep))),
          ]),
      }),
    ]);
  }

  protected addComponnentVariable(name: string, initilizer: ts.Expression) {
    this.setState(BasicState.CommonVariables, [
      ...this.getState(BasicState.CommonVariables),
      this.createNode("variable").addField({
        name,
        initValue: () => initilizer,
      }),
    ]);
  }

  private createComponentBlock(render: JsxElementGenerator, statements: StatementGenerator[] = []) {
    return ts.createBlock(statements.map(i => i.emit()).concat(this.createComponentRenderReturn(render)));
  }

  private createComponentRenderReturn(rootEle: JsxElementGenerator) {
    return ts.createReturn(rootEle.emit());
  }
}
