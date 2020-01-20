import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { capitalize } from "lodash";
import { IPureObject, resolveSyntaxInsert } from "../../core/base";
import { REACT, TYPES } from "../../utils";
import { BasicComponent } from "../../core/component";
import { Injectable } from "../../core/decorators";
import { ReactHelper, ReactRender } from "../entity-helper";
import {
  JsxAttributeGenerator,
  JsxElementGenerator,
  JsxExpressionGenerator,
  StatementGenerator,
  VariableGenerator,
} from "../../core/typescript";

export type JsxAttributeValueType = number | string | boolean | ts.Expression;
export type JsxAttributeSyntaxTextType = string | ts.Expression;
export type JsxAttributeType = JsxAttributeValueType | Record<string, JsxAttributeValueType>;
export type JsxAttributeSyntaxType = JsxAttributeSyntaxTextType | Record<string, JsxAttributeSyntaxTextType>;

export enum BasicState {
  TagName = "renderTageName",
  TagAttrs = "renderTagAttrs",
  UnshiftNodes = "renderUnshiftNodes",
  PushedNodes = "renderPushedNodes",
  UseStates = "compUseStates",
  UseCallbacks = "compUseCallbacks",
  UseEffects = "compUseEffects",
  CommonStatements = "compStatements",
}

export type IBasicReactContainerState<T = IPureObject> = T & {
  [BasicState.TagName]: string;
  [BasicState.TagAttrs]: JsxAttributeGenerator[];
  [BasicState.UnshiftNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.PushedNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.UseStates]: VariableGenerator[];
  [BasicState.UseCallbacks]: VariableGenerator[];
  [BasicState.UseEffects]: VariableGenerator[];
  [BasicState.CommonStatements]: StatementGenerator<any>[];
};

type TP = IBasicReactContainerState<IPureObject>;
type TY = IBasicReactContainerState<{}>;

@Injectable(InjectScope.New)
export abstract class ReactComponent<T extends TP = TY> extends BasicComponent<T> {
  private __elementMap: Map<string | symbol, JsxElementGenerator> = new Map();

  protected get statements() {
    return this.getState(BasicState.CommonStatements);
  }

  protected get useStates() {
    return this.getState(BasicState.UseStates);
  }

  protected get useCallbacks() {
    return this.getState(BasicState.UseCallbacks);
  }

  protected get useEffects() {
    return this.getState(BasicState.UseEffects);
  }

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
    this.setState(BasicState.CommonStatements, []);
  }

  protected async onRender() {
    await super.onRender();
    this.createFunctionRender([]);
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

  protected addRenderAttrWithObject(name: string, obj: Record<string, JsxAttributeValueType>) {
    this.getState(BasicState.TagAttrs).push(
      this.createNode("jsx-attribute")
        .setName(name)
        .setValue(() => this.helper.createObjectAttr(obj)),
    );
  }

  protected addAttributeWithValue(name: string, value: JsxAttributeValueType) {
    this.getState(BasicState.TagAttrs).push(
      this.createNode("jsx-attribute")
        .setName(name)
        .setValue(() => resolveSyntaxInsert(typeof value, value, (_, e) => e)),
    );
  }

  protected addAttributeWithSyntaxText(name: string, value: JsxAttributeSyntaxTextType) {
    this.getState(BasicState.TagAttrs).push(
      this.createNode("jsx-attribute")
        .setName(name)
        .setValue(typeof value === "string" ? value : () => value),
    );
  }

  protected addAttributesWithMap(map: Record<string, JsxAttributeType>) {
    const entries = Object.entries(map);
    for (const [name, attr] of entries) {
      typeof attr === "object" && !ts.isJsxExpression(<any>attr)
        ? this.addRenderAttrWithObject(name, <any>attr)
        : this.addAttributeWithValue(name, <any>attr);
    }
  }

  protected addAttributesWithSyntaxMap(map: Record<string, JsxAttributeSyntaxType>) {
    const entries = Object.entries(map);
    for (const [name, attr] of entries) {
      typeof attr === "object"
        ? this.addRenderAttrWithObject(name, <any>attr)
        : this.addAttributeWithSyntaxText(name, attr);
    }
  }

  protected addRenderChildren(id: string, element: JsxElementGenerator) {
    this.__elementMap.set(id, element);
  }

  protected getRenderChildren() {
    return Array.from(this.__elementMap.values());
  }

  protected addUseState(name: string, defaultValue: unknown) {
    this.useStates.push(
      this.createNode("variable").addField({
        arrayBinding: [name, "set" + capitalize(name)],
        initValue: () =>
          ts.createCall(ts.createIdentifier(REACT.UseState), [TYPES.Any], [this.helper.createLiteral(defaultValue)]),
      }),
    );
  }

  protected addUseCallback(name: string, callback: Function | string, deps: string[] = []) {
    this.useCallbacks.push(
      this.createNode("variable").addField({
        name,
        initValue: () =>
          this.helper.createFunctionCall(REACT.UseCallback, [
            ts.createIdentifier(callback.toString()),
            ts.createArrayLiteral(deps.map(dep => ts.createIdentifier(dep))),
          ]),
      }),
    );
  }

  protected addCommonStatement(name: string, initilizer: ts.Expression) {
    this.statements.push(
      this.createNode("variable").addField({
        name,
        initValue: () => initilizer,
      }),
    );
  }

  private createFunctionRender(statements: StatementGenerator<any>[] = []) {
    this.initReact16UseHooks();
    this.addFunctions([
      this.createNode("function")
        .setName(this.entityId)
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
              .concat(this.useStates)
              .concat(this.useCallbacks)
              .concat(this.useEffects)
              .concat(statements),
          );
          return node;
        }),
    ]);
  }

  protected async onChildrenRender() {
    const children = this.getChildren();
    for (const child of children) {
      const ele = this.helper.createViewElement(child.component, { key: `"${child.id}"` });
      const props = child.props || {};
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          const element = props[key];
          switch (element.type) {
            case "state":
              ele.addJsxAttr(key, <string>element.expression);
              break;
            case "props":
              ele.addJsxAttr(key, "props." + <string>element.expression);
              break;
            case "literal":
              ele.addJsxAttr(key, () => this.helper.createLiteral(element.expression));
              break;
            default:
              break;
          }
        }
      }
      this.addRenderChildren(child.id, ele);
    }
  }

  private initReact16UseHooks() {
    const imports: string[] = [];
    if (this.useStates.length > 0) imports.push(REACT.UseState);
    if (this.useCallbacks.length > 0) imports.push(REACT.UseCallback);
    if (this.useEffects.length > 0) imports.push(REACT.UseEffect);
    this.addImports(
      imports.map(name =>
        this.createNode("import")
          .addNamedBinding(name)
          .setModulePath(REACT.PackageName),
      ),
    );
  }

  private createComponentBlock(render: JsxElementGenerator, statements: StatementGenerator[] = []) {
    return ts.createBlock(statements.map(i => i.emit()).concat(this.createComponentRenderReturn(render)));
  }

  private createComponentRenderReturn(rootEle: JsxElementGenerator) {
    return ts.createReturn(rootEle.emit());
  }
}
