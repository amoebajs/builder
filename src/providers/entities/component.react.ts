import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { capitalize } from "lodash";
import {
  BasicComponent,
  BasicState,
  IComponentPropMap,
  IPureObject,
  Injectable,
  JsxAttributeGenerator,
  JsxElementGenerator,
  JsxExpressionGenerator,
  RecordValue,
  StatementGenerator,
  VariableGenerator,
  resolveSyntaxInsert,
} from "#core";
import { ReactHelper, ReactRender } from "../entity-helper";
import { REACT, TYPES } from "../../utils";

export type JsxAttributeValueType = number | string | boolean | ts.Expression;
export type JsxAttributeSyntaxTextType = string | ts.Expression;
export type JsxAttributeType = JsxAttributeValueType | Record<string, JsxAttributeValueType>;
export type JsxAttributeSyntaxType = JsxAttributeSyntaxTextType | Record<string, JsxAttributeSyntaxTextType>;

export type IBasicReactContainerState<T = IPureObject> = T & {
  [BasicState.RenderTagName]: string;
  [BasicState.RenderTagAttrs]: JsxAttributeGenerator[];
  [BasicState.RenderChildrenMap]: Map<string | symbol, JsxElementGenerator>;
  [BasicState.UnshiftNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.PushedNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.UseStates]: VariableGenerator[];
  [BasicState.UseCallbacks]: VariableGenerator[];
  [BasicState.UseEffects]: VariableGenerator[];
  [BasicState.UseRefs]: VariableGenerator[];
  [BasicState.UseMemos]: VariableGenerator[];
  [BasicState.ContextInfo]: { name: string };
  [BasicState.PushedVariables]: StatementGenerator<any>[];
  [BasicState.UnshiftVariables]: StatementGenerator<any>[];
};

type TP = IBasicReactContainerState<IPureObject>;
type TY = IBasicReactContainerState<{}>;

@Injectable(InjectScope.New)
export abstract class ReactComponent<T extends TP = TY> extends BasicComponent<T> {
  protected get unshiftVariables() {
    return this.getState(BasicState.UnshiftVariables);
  }

  protected get pushedVariables() {
    return this.getState(BasicState.PushedVariables);
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

  protected get useRefs() {
    return this.getState(BasicState.UseRefs);
  }

  protected get useMemos() {
    return this.getState(BasicState.UseMemos);
  }

  protected get renderTagName() {
    return this.getState(BasicState.RenderTagName);
  }

  protected get renderAttributes() {
    return this.getState(BasicState.RenderTagAttrs);
  }

  protected get renderChildMap() {
    return this.getState(BasicState.RenderChildrenMap);
  }

  protected get renderChildNodes() {
    return Array.from(this.getState(BasicState.RenderChildrenMap).values());
  }

  protected get renderUnshiftChildNodes() {
    return this.getState(BasicState.UnshiftNodes);
  }

  protected get renderPushedChildNodes() {
    return this.getState(BasicState.PushedNodes);
  }

  constructor(protected readonly helper: ReactHelper, protected readonly render: ReactRender) {
    super();
  }

  protected async onInit() {
    await super.onInit();
    this.render["parentRef"] = this;
    this.setState(BasicState.RenderTagName, REACT.Fragment);
    this.setState(BasicState.RenderTagAttrs, []);
    this.setState(BasicState.RenderChildrenMap, new Map());
    this.setState(BasicState.UnshiftNodes, []);
    this.setState(BasicState.PushedNodes, []);
    this.setState(BasicState.UseStates, []);
    this.setState(BasicState.UseCallbacks, []);
    this.setState(BasicState.UseEffects, []);
    this.setState(BasicState.UseRefs, []);
    this.setState(BasicState.UseMemos, []);
    this.setState(BasicState.UnshiftVariables, []);
    this.setState(BasicState.PushedVariables, []);
    this.setState(BasicState.ContextInfo, { name: "props.CONTEXT" });
  }

  protected async onRender() {
    await super.onRender();
    this.createFunctionRender();
  }

  protected setTagName(tagName: string) {
    this.setState(BasicState.RenderTagName, tagName);
  }

  protected addAttributeWithObject(name: string, obj: Record<string, JsxAttributeValueType>) {
    this.renderAttributes.push(
      this.createNode("jsx-attribute")
        .setName(name)
        .setValue(() => this.helper.createObjectAttr(obj)),
    );
  }

  protected addAttributeWithValue(name: string, value: JsxAttributeValueType) {
    this.renderAttributes.push(
      this.createNode("jsx-attribute")
        .setName(name)
        .setValue(() => resolveSyntaxInsert(typeof value, value, (_, e) => e)),
    );
  }

  protected addAttributeWithSyntaxText(name: string, value: JsxAttributeSyntaxTextType) {
    this.renderAttributes.push(
      this.createNode("jsx-attribute")
        .setName(name)
        .setValue(typeof value === "string" ? value : () => value),
    );
  }

  protected addAttributesWithMap(map: Record<string, JsxAttributeType>) {
    const entries = Object.entries(map);
    for (const [name, attr] of entries) {
      this.addAttributeWithValue(name, <any>attr);
    }
  }

  protected addAttributesWithSyntaxMap(map: Record<string, JsxAttributeSyntaxType>) {
    const entries = Object.entries(map);
    for (const [name, attr] of entries) {
      typeof attr === "object"
        ? this.addAttributeWithObject(name, <any>attr)
        : this.addAttributeWithSyntaxText(name, attr);
    }
  }

  protected addRenderChildren(id: string, element: JsxElementGenerator) {
    this.getState(BasicState.RenderChildrenMap).set(id, element);
  }

  protected addRenderPushedChild(element: JsxElementGenerator | JsxExpressionGenerator) {
    this.renderPushedChildNodes.push(element);
  }

  protected addRenderUnshiftChild(element: JsxElementGenerator | JsxExpressionGenerator) {
    this.renderUnshiftChildNodes.push(element);
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

  protected addUseRef(name: string, defaultValue: unknown) {
    this.useRefs.push(
      this.createNode("variable").addField({
        name,
        // 临时支持对象表达式
        initValue: () =>
          ts.createCall(
            ts.createIdentifier(REACT.UseRef),
            [TYPES.Any],
            [
              "kind" in <any>defaultValue && ts.isObjectLiteralExpression(<any>defaultValue)
                ? <ts.ObjectLiteralExpression>defaultValue
                : this.helper.createLiteral(defaultValue),
            ],
          ),
      }),
    );
  }

  protected addUnshiftVariable(name: string, initilizer?: ts.Expression) {
    this.unshiftVariables.push(
      this.createNode("variable").addField({
        name,
        initValue: initilizer && (() => initilizer),
      }),
    );
  }

  protected addPushedVariable(name: string, initilizer?: ts.Expression) {
    this.pushedVariables.push(
      this.createNode("variable").addField({
        name,
        initValue: initilizer && (() => initilizer),
      }),
    );
  }

  private createFunctionRender() {
    this.initReact16UseHooks();
    this.addFunctions([
      this.createNode("function")
        .setName(this.entityId)
        .pushParam({ name: "props", type: "any" })
        .pushTransformerBeforeEmit(node => {
          node.body = this.createComponentBlock(
            this.createNode("jsx-element")
              .setTagName(this.renderTagName)
              .addJsxAttrs(this.renderAttributes)
              .addJsxChildren(this.renderUnshiftChildNodes)
              .addJsxChildren(this.renderChildNodes)
              .addJsxChildren(this.renderPushedChildNodes),
            (<StatementGenerator<any>[]>[])
              .concat(this.unshiftVariables)
              .concat(this.useStates)
              .concat(this.useCallbacks)
              .concat(this.useEffects)
              .concat(this.useRefs)
              .concat(this.useMemos)
              .concat(this.pushedVariables),
          );
          return node;
        }),
    ]);
  }

  protected async onChildrenRender() {
    const children = this.getChildren();
    const context = this.getState(BasicState.ContextInfo);
    for (const child of children) {
      const defaultAttrs = { CONTEXT: `${context.name}`, key: `"${child.id}"` };
      const element = this.helper.createViewElement(child.component, defaultAttrs);
      Object.entries(child.props || {}).forEach(([key, prop]) => this.onChildrenPropResolved(key, prop, element));
      this.addRenderChildren(child.id, element);
      if (this.onChildrenVisit) {
        const newElement = this.onChildrenVisit(child.id, element);
        if (newElement) {
          this.addRenderChildren(child.id, newElement.addJsxAttrs(defaultAttrs));
        }
      }
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected onChildrenVisit(scope: string | symbol, element: JsxElementGenerator): JsxElementGenerator | void {
    // can be overrided
  }

  protected onChildrenPropResolved(name: string, prop: RecordValue<IComponentPropMap>, element: JsxElementGenerator) {
    const { type: propType, expression: e } = prop;
    const context = this.getState(BasicState.ContextInfo);
    switch (propType) {
      case "state":
        const [p01, ...ps] = String(e).split(".");
        element.addJsxAttr(name, `${context.name}.state.` + [p01, "value", ...ps].join("."));
        break;
      case "props":
        element.addJsxAttr(name, "props." + e);
        break;
      case "literal":
        element.addJsxAttr(name, () => this.helper.createLiteral(e));
        break;
      // 引用指令内容，暂时没有实现Output相关功能
      case "directiveRef":
        element.addJsxAttr(name, () => this.helper.createLiteral(e.ref + "_" + e.expression));
        break;
      default:
        break;
    }
  }

  private initReact16UseHooks() {
    const imports: string[] = [];
    if (this.useStates.length > 0) imports.push(REACT.UseState);
    if (this.useCallbacks.length > 0) imports.push(REACT.UseCallback);
    if (this.useEffects.length > 0) imports.push(REACT.UseEffect);
    if (this.useRefs.length > 0) imports.push(REACT.UseRef);
    if (this.useMemos.length > 0) imports.push(REACT.UseMemo);
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
