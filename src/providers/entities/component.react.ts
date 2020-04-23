import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import {
  BasicComponent,
  BasicState,
  IAfterChildrenRender,
  IAfterCreate,
  IAfterDirectivesAttach,
  IComponentProp,
  IPureObject,
  Injectable,
  JsxAttributeGenerator,
  JsxElementGenerator,
  JsxExpressionGenerator,
  StatementGenerator,
  VariableGenerator,
  resolveSyntaxInsert,
} from "../../core";
import { REACT, TYPES, classCase } from "../../utils";
import { ReactHelper, ReactRender } from "../entity-helper";

export type JsxAttributeValueType = number | string | boolean | ts.Expression;
export type JsxAttributeSyntaxTextType = string | ts.Expression;
export type JsxAttributeType = JsxAttributeValueType | Record<string, JsxAttributeValueType>;
export type JsxAttributeSyntaxType = JsxAttributeSyntaxTextType | Record<string, JsxAttributeSyntaxTextType>;

export interface IVisitResult {
  newElement?: JsxElementGenerator;
  newDisplayRule?: any;
}

export interface IBasicReactContainerState {
  [BasicState.RenderTagName]: string;
  [BasicState.RenderTagAttrs]: JsxAttributeGenerator[];
  [BasicState.RenderChildrenMap]: Map<string | symbol, JsxElementGenerator>;
  [BasicState.RenderChildrenRuleMap]: Map<string | symbol, string>;
  [BasicState.UnshiftNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.PushedNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.UseStates]: VariableGenerator[];
  [BasicState.UseCallbacks]: VariableGenerator[];
  [BasicState.UseEffects]: VariableGenerator[];
  [BasicState.UseRefs]: VariableGenerator[];
  [BasicState.UseMemos]: VariableGenerator[];
  [BasicState.ContextInfo]: { name: string; emit: boolean };
  [BasicState.PushedVariables]: StatementGenerator<any>[];
  [BasicState.UnshiftVariables]: StatementGenerator<any>[];
  [BasicState.FnsBeforeRender]: Function[];
  [BasicState.RootElementChangeFns]: ((gen: JsxElementGenerator) => JsxElementGenerator)[];
  [BasicState.AppendChildrenHooks]: { key: string; func: (node: any) => any }[];
}

@Injectable(InjectScope.New)
export abstract class ReactComponent<T extends Partial<IBasicReactContainerState> = IPureObject>
  extends BasicComponent<IBasicReactContainerState & T>
  implements IAfterCreate, IAfterChildrenRender, IAfterDirectivesAttach {
  protected get isRoot() {
    return this.__context.root.__entityId === this.__scope;
  }

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
    return Array.from(this.getState(BasicState.RenderChildrenMap).entries());
  }

  protected get renderChildNodeRules() {
    return Array.from(this.getState(BasicState.RenderChildrenRuleMap).entries());
  }

  protected get appendChildrenHooks() {
    return this.getState(BasicState.AppendChildrenHooks);
  }

  protected get renderUnshiftChildNodes() {
    return this.getState(BasicState.UnshiftNodes);
  }

  protected get renderPushedChildNodes() {
    return this.getState(BasicState.PushedNodes);
  }

  constructor(
    protected readonly helper: ReactHelper,
    protected readonly render: ReactRender<IBasicReactContainerState & T>,
  ) {
    super();
  }

  public afterCreate() {
    this.render["parentRef"] = <any>this;
    this.render["rootRef"] = <any>this.__context.root.__instanceRef;
    this.render["beforeInit"]();
  }

  protected async onInit() {
    await super.onInit();
    const { DEFAULT_ROOT_CONTEXT_NAME: rname, DEFAULT_CONTEXT_NAME: cname } = this.helper;
    this.setState(BasicState.RenderTagName, REACT.Fragment);
    this.setState(BasicState.RenderTagAttrs, []);
    this.setState(BasicState.RenderChildrenMap, new Map());
    this.setState(BasicState.RenderChildrenRuleMap, new Map());
    this.setState(BasicState.UnshiftNodes, []);
    this.setState(BasicState.PushedNodes, []);
    this.setState(BasicState.UseStates, []);
    this.setState(BasicState.UseCallbacks, []);
    this.setState(BasicState.UseEffects, []);
    this.setState(BasicState.UseRefs, []);
    this.setState(BasicState.UseMemos, []);
    this.setState(BasicState.UnshiftVariables, []);
    this.setState(BasicState.PushedVariables, []);
    this.setState(BasicState.FnsBeforeRender, []);
    this.setState(BasicState.RootElementChangeFns, []);
    this.setState(BasicState.AppendChildrenHooks, []);
    this.setState(BasicState.ContextInfo, { name: this.isRoot ? rname : cname, emit: this.isRoot });
  }

  protected async onRender() {
    await super.onRender();
    this.createRootContextState();
    this.createFunctionRender();
  }

  /** @override */
  public afterDirectivesAttach(): void | Promise<void> {
    this.initFnsBeforeRender();
  }

  /** @override */
  public afterChildrenRender() {
    const children = this.getChildren();
    const context = this.getState(BasicState.ContextInfo);
    for (const child of children) {
      const defaultAttrs = { CONTEXT: `${context.name}`, key: `"${child.id}"` };
      const element = this.helper.createViewElement(child.component, defaultAttrs);
      // push children directives hooks
      this.appendChildrenHooks.filter(i => i.key === child.id).forEach(({ func }) => func(element));
      Object.entries(child.props || {}).forEach(([key, prop]) => this.onChildrenPropResolved(key, prop, element));
      this.addRenderChildren(child.id, element);
      if (this.onChildrenVisit) {
        const result = this.onChildrenVisit(child.id, element);
        if (!result) continue;
        if (result.newElement) {
          this.addRenderChildren(child.id, result.newElement.addJsxAttrs(defaultAttrs));
        }
        if (result.newDisplayRule) {
          this.getState(BasicState.RenderChildrenRuleMap).set(child.id, result.newDisplayRule);
        }
      }
    }
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
        arrayBinding: [name, "set" + classCase(name)],
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
        type: "any",
        initValue: initilizer && (() => initilizer),
      }),
    );
  }

  protected addPushedVariable(name: string, initilizer?: ts.Expression) {
    this.pushedVariables.push(
      this.createNode("variable").addField({
        name,
        type: "any",
        initValue: initilizer && (() => initilizer),
      }),
    );
  }

  private createFunctionRender() {
    this.addFunctions([
      this.createNode("function")
        .setName(this.entityId)
        .pushParam({ name: REACT.Props, type: "any" })
        .pushTransformerBeforeEmit(node => {
          node.body = this.createComponentBlock(
            this.onRootElementVisit(
              this.createNode("jsx-element")
                .setTagName(this.renderTagName)
                .addJsxAttrs(this.renderAttributes)
                .addJsxChildren(this.renderUnshiftChildNodes)
                .addJsxChildren(this.resolveChildNodeRender())
                .addJsxChildren(this.renderPushedChildNodes),
            ),
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

  protected onRootElementVisit(root: JsxElementGenerator): JsxElementGenerator | JsxExpressionGenerator {
    const fns = this.getState(BasicState.RootElementChangeFns);
    let realGen = root;
    for (const fn of fns) {
      realGen = fn(realGen);
    }
    return realGen;
  }

  protected onChildrenVisit(_: string | symbol, __: JsxElementGenerator): IVisitResult | void {}

  protected onChildrenPropResolved(name: string, prop: IComponentProp, element: JsxElementGenerator) {
    const context = this.getState(BasicState.ContextInfo);
    let resolved = true;
    switch (prop.type) {
      case "state":
        element.addJsxAttr(name, this.helper.useStateExpression(prop, context.name));
        break;
      case "props":
        element.addJsxAttr(name, this.helper.usePropExpression(prop));
        break;
      case "literal":
        element.addJsxAttr(name, () => this.helper.createLiteral(prop.expression));
        break;
      // 引用指令内容，暂时没有实现Output相关功能
      case "directiveRef":
        element.addJsxAttr(name, () =>
          this.helper.createLiteral(prop.expression.ref + "_" + prop.expression.expression),
        );
        break;
      // 复杂逻辑，用来支持自定义语法块的解析
      case "complexLogic":
        element.addJsxAttr(name, () => this.helper.createLiteral(prop.expression));
        break;
      default:
        element.addJsxAttr(name, () =>
          this.helper.createJsxArrowEventHandler(
            ts.createIdentifier(this.helper.useComplexLogicExpression(prop, context.name)),
          ),
        );
        resolved = false;
        break;
    }
    return resolved;
  }

  protected resolveChildNodeRender() {
    const rules = this.getState(BasicState.RenderChildrenRuleMap);
    const children = this.renderChildNodes;
    const childNodes: (JsxExpressionGenerator | JsxElementGenerator)[] = [];
    for (const [k, v] of children) {
      const rule = rules.get(k);
      if (!rule) {
        childNodes.push(v);
        continue;
      }
      childNodes.push(
        this.createNode("jsx-expression").setExpression(() => ts.createLogicalAnd(ts.createIdentifier(rule), v.emit())),
      );
    }
    return childNodes;
  }

  private initFnsBeforeRender() {
    const fns = this.getState(BasicState.FnsBeforeRender);
    for (const fn of fns) {
      fn();
    }
  }

  private createComponentBlock(
    render: JsxElementGenerator | JsxExpressionGenerator,
    statements: StatementGenerator[] = [],
  ) {
    return ts.createBlock(statements.map(i => i.emit()).concat(this.createComponentRenderReturn(render)));
  }

  private createComponentRenderReturn(rootEle: JsxElementGenerator | JsxExpressionGenerator) {
    return ts.createReturn(rootEle.emit());
  }

  private createRootContextState() {
    const { name, emit } = this.getState(BasicState.ContextInfo);
    if (!emit) return;
    const body = ts.createObjectLiteral(
      this.useStates.map(i => {
        const name = getReactStateName(i);
        return ts.createPropertyAssignment(
          name,
          ts.createObjectLiteral([
            ts.createPropertyAssignment("value", ts.createIdentifier(name)),
            ts.createPropertyAssignment("setState", ts.createIdentifier("set" + classCase(name))),
          ]),
        );
      }),
    );
    this.render.component.appendVariable(
      name,
      ts.createObjectLiteral([ts.createPropertyAssignment(REACT.State, body)]),
    );
  }
}

function getReactStateName(variable: VariableGenerator) {
  // 获取第一个变量内部名（arrayBinding形式的变量是没有名字的，是一个_nxxx的内部名）
  const placeholder = Object.keys(variable["variables"])[0];
  // 获取真实的react组件state名称
  return variable["variables"][placeholder].arrayBinding[0];
}
