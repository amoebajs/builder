import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import {
  BasicComponent,
  BasicState,
  IAfterChildrenRender,
  IAfterCreate,
  IAfterDirectivesAttach,
  IAfterInit,
  IComponentProp,
  IPureObject,
  Injectable,
  JsxAttributeGenerator,
  JsxElementGenerator,
  JsxExpressionGenerator,
  Observer,
  StatementGenerator,
  VariableGenerator,
  VariableRef,
  resolveObservables,
  resolveSyntaxInsert,
} from "../../core";
import { REACT, TYPES, classCase, is } from "../../utils";
import { ReactHelper, ReactRender } from "../entity-helper";

export type VariableRefName = string | VariableRef | Observer;
export type JsxAttributeValueType = number | string | boolean | ts.Expression;
export type JsxAttributeSyntaxTextType = VariableRefName | ts.Expression;
export type JsxAttributeType = JsxAttributeValueType | Record<string, JsxAttributeValueType>;
export type JsxAttributeSyntaxType = JsxAttributeSyntaxTextType | Record<string, JsxAttributeSyntaxTextType>;

export interface IVisitResult {
  newElement?: JsxElementGenerator;
  newDisplayRule?: any;
}

export interface IChildrenHook {
  key: string;
  func: (node: any) => any;
}

export interface IContextInfo {
  name: string;
  emit: boolean;
}

export interface IObserverUse {
  value: VariableGenerator;
  type: "subject" | "behavior";
}

export interface IAttrUse {
  name: string;
  type: "object" | "value";
  value: Function | Record<string, any>;
  node: JsxAttributeGenerator;
}

export interface IBasicReactContainerState {
  [BasicState.RenderTagName]: string;
  [BasicState.RenderTagAttrs]: IAttrUse[];
  [BasicState.RenderChildrenMap]: Map<string | symbol, JsxElementGenerator>;
  [BasicState.RenderChildrenRuleMap]: Map<string | symbol, string>;
  [BasicState.UnshiftNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.PushedNodes]: (JsxElementGenerator | JsxExpressionGenerator)[];
  [BasicState.UseStates]: VariableGenerator[];
  [BasicState.UseObservers]: IObserverUse[];
  [BasicState.UseObservables]: StatementGenerator<any>[];
  [BasicState.UseCallbacks]: VariableGenerator[];
  [BasicState.UseEffects]: VariableGenerator[];
  [BasicState.UseRefs]: VariableGenerator[];
  [BasicState.UseMemos]: VariableGenerator[];
  [BasicState.ContextInfo]: IContextInfo;
  [BasicState.PushedVariables]: StatementGenerator<any>[];
  [BasicState.UnshiftVariables]: StatementGenerator<any>[];
  [BasicState.FnsBeforeRender]: Function[];
  [BasicState.RootElementChangeFns]: ((gen: JsxElementGenerator) => JsxElementGenerator)[];
  [BasicState.AppendChildrenHooks]: IChildrenHook[];
}

@Injectable(InjectScope.New)
export abstract class ReactComponent<T extends Partial<IBasicReactContainerState> = IPureObject>
  extends BasicComponent<IBasicReactContainerState & T>
  implements IAfterCreate, IAfterInit, IAfterChildrenRender, IAfterDirectivesAttach {
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

  protected get useObservers() {
    return this.getState(BasicState.UseObservers);
  }

  protected get useObservables() {
    return this.getState(BasicState.UseObservables);
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
    this.setState(BasicState.UseObservers, []);
    this.setState(BasicState.UseObservables, []);
    this.setState(BasicState.UnshiftVariables, []);
    this.setState(BasicState.PushedVariables, []);
    this.setState(BasicState.FnsBeforeRender, []);
    this.setState(BasicState.RootElementChangeFns, []);
    this.setState(BasicState.AppendChildrenHooks, []);
    this.setState(BasicState.ContextInfo, { name: this.isRoot ? rname : cname, emit: this.isRoot });
    this.addAttributeWithSyntaxText("style", "props.style");
  }

  public afterInit() {
    const template = Object.getPrototypeOf(this).constructor;
    const observables = resolveObservables(template).observables;
    for (const key in observables) {
      if (!observables.hasOwnProperty(key)) continue;
      this.render.root.appendObserver((<any>this)[key].name, (<any>this)[key].default);
    }
  }

  protected async onRender() {
    await super.onRender();
    this.createRootContext();
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

  protected getNamedObserver(name: VariableRefName, target?: "observable" | "next" | "data") {
    const { name: context } = this.getState(BasicState.ContextInfo);
    return `${context}.data.${this.getRefName(name)}${is.nullOrUndefined(target) ? "" : "."}${target ?? ""}`;
  }

  protected setTagName(tagName: VariableRefName) {
    this.setState(BasicState.RenderTagName, this.getRefName(tagName));
  }

  private createUpdateAttrUse(name: VariableRefName) {
    const key: string = this.getRefName(name);
    const index = this.renderAttributes.findIndex(i => i.name === name);
    let target = this.renderAttributes[index];
    if (index < 0) {
      this.renderAttributes.push(
        (target = {
          name: key,
          type: "value",
          value: <any>null,
          node: this.createNode("jsx-attribute").setName(key),
        }),
      );
    } else {
      target.type = "value";
    }
    return target;
  }

  protected addAttributeWithObject(name: VariableRefName, obj: Record<string, JsxAttributeValueType>) {
    let newobj: Record<string, any> = { ...obj };
    const target = this.createUpdateAttrUse(name);
    target.type = "object";
    if (typeof target.value === "object") newobj = { ...target.value, ...newobj };
    target.value = newobj;
  }

  protected addAttributeWithValue(name: VariableRefName, value: JsxAttributeValueType) {
    const target = this.createUpdateAttrUse(name);
    const result = this.getExpression(value);
    target.value =
      typeof result === "function" ? result : () => resolveSyntaxInsert(typeof result, result, (_, e) => e);
  }

  protected addAttributeWithSyntaxText(name: VariableRefName, value: JsxAttributeSyntaxTextType) {
    const target = this.createUpdateAttrUse(name);
    const result = this.getExpression(value);
    target.value = typeof result === "string" ? () => ts.createIdentifier(result) : result;
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

  protected useAttr(i: IAttrUse) {
    switch (i.type) {
      case "object":
        return i.node.setValue(() => this.helper.createObjectAttr(<Record<string, any>>i.value));
      default:
        return i.node.setValue(<() => ts.Expression>i.value);
    }
  }

  protected addRenderChildren(id: VariableRefName, element: JsxElementGenerator) {
    this.getState(BasicState.RenderChildrenMap).set(this.getRefName(id), element);
  }

  protected addRenderPushedChild(element: JsxElementGenerator | JsxExpressionGenerator) {
    this.renderPushedChildNodes.push(element);
  }

  protected addRenderUnshiftChild(element: JsxElementGenerator | JsxExpressionGenerator) {
    this.renderUnshiftChildNodes.push(element);
  }

  protected addUseState(name: VariableRefName, value: unknown, setStateName?: VariableRefName) {
    this.useStates.push(
      this.createNode("variable").addField({
        arrayBinding: [this.getRefName(name), this.getRefName(setStateName ?? this.getSetState(name))],
        initValue: () =>
          ts.createCall(
            ts.createIdentifier(REACT.UseState),
            [TYPES.Any],
            [
              ts.isObjectLiteralExpression(<ts.Node>value)
                ? <ts.Expression>value
                : ts.createIdentifier(String(this.getExpression(value))),
            ],
          ),
      }),
    );
  }

  protected addUseCallback(name: VariableRefName, expression: unknown, deps: VariableRefName[] = []) {
    this.useCallbacks.push(
      this.createNode("variable").addField({
        name: this.getRefName(name),
        initValue: () =>
          this.helper.createFunctionCall(REACT.UseCallback, [
            ts.createIdentifier(String(this.getExpression(expression))),
            ts.createArrayLiteral(deps.map(dep => ts.createIdentifier(this.getRefName(dep)))),
          ]),
      }),
    );
  }

  protected addUseEffect(name: VariableRefName, expression: unknown, deps: VariableRefName[] = []) {
    this.useEffects.push(
      this.createNode("variable").addField({
        name: this.getRefName(name),
        initValue: () =>
          this.helper.createFunctionCall(REACT.UseEffect, [
            ts.createIdentifier(String(this.getExpression(expression))),
            ts.createArrayLiteral(deps.map(dep => ts.createIdentifier(this.getRefName(dep)))),
          ]),
      }),
    );
  }

  protected addUseMemo(name: VariableRefName, expression: unknown, deps: VariableRefName[] = []) {
    const result = this.getExpression(expression);
    this.useEffects.push(
      this.createNode("variable").addField({
        name: this.getRefName(name),
        initValue: () =>
          this.helper.createFunctionCall(REACT.UseMemo, [
            typeof result === "function" ? result() : ts.createIdentifier(result),
            ts.createArrayLiteral(deps.map(dep => ts.createIdentifier(this.getRefName(dep)))),
          ]),
      }),
    );
  }

  protected addUseRef(name: VariableRefName, defaultValue: unknown) {
    this.useRefs.push(
      this.createNode("variable").addField({
        name: this.getRefName(name),
        // 临时支持对象表达式
        initValue: () =>
          ts.createCall(
            ts.createIdentifier(REACT.UseRef),
            [TYPES.Any],
            [
              typeof defaultValue === "object" &&
              "kind" in <any>defaultValue &&
              ts.isObjectLiteralExpression(<any>defaultValue)
                ? <ts.ObjectLiteralExpression>defaultValue
                : ts.createIdentifier(String(defaultValue)),
            ],
          ),
      }),
    );
  }

  protected addUseObserver(name: VariableRefName, defaultValue?: unknown) {
    const hasDefault = is.nullOrUndefined(defaultValue);
    const expression = hasDefault ? "new Subject<any>()" : `new BehaviorSubject<any>(${defaultValue})`;
    this.useObservers.push({
      type: hasDefault ? "subject" : "behavior",
      value: this.createNode("variable").addField({
        name: this.getRefName(name),
        initValue: expression,
      }),
    });
  }

  protected addUseObservables(
    target: VariableRefName,
    expr: VariableRefName,
    varName?: VariableRefName,
    deps: VariableRefName[] = [],
  ) {
    const expression = () => {
      const { name: context } = this.getState(BasicState.ContextInfo);
      return ts.createIdentifier(
        REACT.UseEffect +
          `(() => { const __subp = ${context}.data.${this.getRefName(
            target,
          )}.observable.subscribe(${this.getExpressionValue(
            expr,
          )}); return () => { __subp.unsubscribe(); } }, [${deps.map(i => this.getRefName(i)).join(", ")}])`,
      );
    };
    this.useObservables.push(
      !!varName
        ? this.createNode("variable").addField({
            name: this.getRefName(varName),
            initValue: expression,
          })
        : this.createNode("statement").setValue(expression),
    );
  }

  protected addUnshiftVariable(name: VariableRefName, initilizer?: ts.Expression) {
    this.unshiftVariables.push(
      this.createNode("variable").addField({
        name: this.getRefName(name),
        type: "any",
        initValue: initilizer && (() => initilizer),
      }),
    );
  }

  protected addPushedVariable(name: VariableRefName, initilizer?: ts.Expression) {
    this.pushedVariables.push(
      this.createNode("variable").addField({
        name: this.getRefName(name),
        type: "any",
        initValue: initilizer && (() => initilizer),
      }),
    );
  }

  protected getSetState(name: VariableRefName) {
    return "set" + classCase(this.getRefName(name));
  }

  protected getRefName<T extends VariableRefName>(ref: T): string {
    return <string>(ref instanceof VariableRef || ref instanceof Observer ? ref.name : ref);
  }

  protected getExpression(expr: unknown): string | (() => ts.Expression) {
    return expr instanceof VariableRef || expr instanceof Observer
      ? expr.name
      : typeof expr === "string"
      ? expr
      : () => <ts.Expression>expr;
  }

  protected getExpressionValue(expr: unknown): string | ts.Expression {
    const result = this.getExpression(expr);
    if (typeof result === "function") return result();
    return result;
  }

  private createFunctionRender() {
    this.initFrameworkImports();
    this.addFunctions([
      this.createNode("function")
        .setName(this.entityId)
        .pushParam({ name: REACT.Props, type: "any" })
        .pushTransformerBeforeEmit(node => {
          node.body = this.createComponentBlock(
            this.onRootElementVisit(
              this.createNode("jsx-element")
                .setTagName(this.renderTagName)
                .addJsxAttrs(this.renderAttributes.map(i => this.useAttr(i)))
                .addJsxChildren(this.renderUnshiftChildNodes)
                .addJsxChildren(this.resolveChildNodeRender())
                .addJsxChildren(this.renderPushedChildNodes),
            ),
            (<StatementGenerator<any>[]>[])
              .concat(this.unshiftVariables)
              .concat(this.useObservers.map(i => i.value))
              .concat(this.useStates)
              .concat(this.useCallbacks)
              .concat(this.useEffects)
              .concat(this.useRefs)
              .concat(this.useObservables)
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
      case "entityRef":
        element.addJsxAttr(name, () =>
          this.helper.createLiteral(prop.expression.ref + "_" + prop.expression.expression),
        );
        break;
      // 复杂逻辑，用来支持自定义语法块的解析
      case "complexLogic":
        element.addJsxAttr(name, () =>
          this.helper.createJsxArrowEventHandler(
            ts.createIdentifier(this.helper.useComplexLogicExpression(prop.expression, context.name)),
          ),
        );
        break;
      default:
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

  private initFrameworkImports() {
    const { emit } = this.getState(BasicState.ContextInfo);
    if (!emit) return;
    if (this.useObservers.filter(i => i.type === "subject").length > 0) {
      this.addImports([
        this.createNode("import")
          .addNamedBinding("Subject", "Subject")
          .setModulePath("rxjs/_esm2015/internal/Subject"),
      ]);
    }
    if (this.useObservers.filter(i => i.type === "behavior").length > 0) {
      this.addImports([
        this.createNode("import")
          .addNamedBinding("BehaviorSubject", "BehaviorSubject")
          .setModulePath("rxjs/_esm2015/internal/BehaviorSubject"),
      ]);
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

  private createRootContext() {
    const { name, emit } = this.getState(BasicState.ContextInfo);
    if (!emit) return;
    // this.addPushedVariable(
    //   name,
    //   ts.createObjectLiteral([
    //     ts.createPropertyAssignment(REACT.State, this.createRootContextStates()),
    //     ts.createPropertyAssignment("data", this.createRootContextObservers()),
    //   ]),
    // );
    this.addUseMemo(
      name,
      ts.createArrowFunction(
        [],
        [],
        [],
        void 0,
        void 0,
        ts.createParen(
          ts.createObjectLiteral([
            ts.createPropertyAssignment(REACT.State, this.createRootContextStates()),
            ts.createPropertyAssignment("data", this.createRootContextObservers()),
          ]),
        ),
      ),
    );
  }

  private createRootContextStates() {
    return ts.createObjectLiteral(
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
  }

  private createRootContextObservers() {
    return ts.createObjectLiteral(
      this.useObservers.map(i => {
        const name = getVariableName(i.value);
        return ts.createPropertyAssignment(
          name,
          ts.createObjectLiteral([
            ts.createPropertyAssignment("observable", ts.createIdentifier(name + ".asObservable()")),
            ts.createPropertyAssignment("next", ts.createIdentifier(`(data: any) => ${name}.next(data)`)),
            ts.createGetAccessor(
              [],
              [],
              "data",
              [],
              void 0,
              ts.createBlock([ts.createReturn(ts.createIdentifier(name + ".getValue()"))]),
            ),
          ]),
        );
      }),
    );
  }
}

function getReactStateName(variable: VariableGenerator) {
  // 获取第一个变量内部名（arrayBinding形式的变量是没有名字的，是一个_nxxx的内部名）
  const placeholder = Object.keys(variable["variables"])[0];
  // 获取真实的react组件state名称
  return variable["variables"][placeholder].arrayBinding[0];
}

function getVariableName(variable: VariableGenerator) {
  return Object.keys(variable["variables"])[0];
}
