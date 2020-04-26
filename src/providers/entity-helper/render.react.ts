import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { NotFoundError } from "../../errors";
import { BasicState, IPureObject, Injectable, JsxElementGenerator } from "../../core";
import { ReactHelper, updateJsxElementAttr } from "./helper.react";
import { IBasicReactContainerState as IS, ReactComponent } from "../entities";
import { BasicRender, EntityRenderDelegate } from "./render.basic";
import { connectParentChildEntityScope, connectReferenceName } from "../../utils";

@Injectable(InjectScope.New)
export class ReactEntityRenderDelegate<T> extends EntityRenderDelegate<T> {
  protected ref!: ReactComponent<T>;
  protected helper!: ReactHelper;

  public getElementById(entityId: string) {
    const map = this.ref["renderChildMap"];
    return map.get(entityId) || null;
  }

  public setElementById(entityId: string, element: any) {
    const map = this.ref["renderChildMap"];
    map.set(entityId, element);
  }

  public appendJsxAttribute(
    entityId: string | JsxElementGenerator,
    name: string,
    value: ts.JsxExpression | ts.StringLiteral,
  ) {
    if (typeof entityId === "string") {
      this.ref["appendChildrenHooks"].push({
        key: entityId,
        func: gen => this.helper.updateJsxElementAttr(gen, name, value),
      });
    } else {
      this.helper.updateJsxElementAttr(entityId, name, value);
    }
  }

  public appendState(name: string, defaultValue: unknown) {
    this.ref["addUseState"](name, defaultValue);
  }

  public appendCallback(name: string, callback: unknown, deps?: string[]) {
    this.ref["addUseCallback"](name, callback, deps);
  }

  public appendEffect(name: string, callback: unknown, deps?: string[]) {
    this.ref["addUseEffect"](name, callback, deps);
  }

  public appendRef(name: string, defaultValue: unknown) {
    this.ref["addUseRef"](name, defaultValue);
  }

  public appendObserver(name: string, defaults?: unknown) {
    this.ref["addUseObserver"](name, defaults);
  }

  public appendObservable(name: string, expr: unknown, varName?: string) {
    this.ref["addUseObservables"](name, expr, varName);
  }

  public appendVariable(name: string, initilizer?: ts.Expression, type: "push" | "unshift" = "push") {
    this.ref[type === "push" ? "addPushedVariable" : "addUnshiftVariable"](name, initilizer);
  }

  public appendFnBeforeRender(fn: Function) {
    (this.ref["getState"](BasicState.FnsBeforeRender) as any[]).push(fn);
  }

  public appendEleChangeFns(fn: (gen: JsxElementGenerator) => JsxElementGenerator) {
    (this.ref["getState"](BasicState.RootElementChangeFns) as any[]).push(fn);
  }

  public getStates() {
    return this.ref["useStates"];
  }

  public getCallbacks() {
    return this.ref["useCallbacks"];
  }

  public getEffects() {
    return this.ref["useEffects"];
  }

  public getRefs() {
    return this.ref["useRefs"];
  }

  public getMemos() {
    return this.ref["useMemos"];
  }

  public getObservers() {
    return this.ref["useObservers"];
  }

  public getObservables() {
    return this.ref["useObservables"];
  }

  public createStateAccessSyntax(name: string) {
    const contextName = (this.ref["getState"](BasicState.ContextInfo) as any).name;
    let reverse = false;
    if (name.startsWith("!")) {
      name = name.slice(1);
      reverse = true;
    }
    return this.helper.useStateExpression({ type: "state", expression: name, extensions: { reverse } }, contextName);
  }

  public createEntityRefAccess(directive: string, refname: string) {
    return connectReferenceName(connectParentChildEntityScope(this.ref.entityId, directive), refname);
  }

  public appendJsxStyles(entityId: string | JsxElementGenerator, value: Record<string, unknown>) {
    const gen = typeof entityId === "string" ? this.getElementById(entityId) : entityId;
    if (!gen) {
      throw new NotFoundError(`target entity [${entityId}] is not found`);
    }
    gen.pushTransformerBeforeEmit(element => updateJsxElementStyle(element, this.helper.createObjectLiteral(value)));
  }
}

@Injectable(InjectScope.New)
export class ReactRender<T extends Partial<IS> = IPureObject> extends BasicRender<T> {
  protected parentRef!: ReactComponent<IS & T>;

  constructor(
    public readonly helper: ReactHelper,
    public readonly component: ReactEntityRenderDelegate<IS & T>,
    public readonly root: ReactEntityRenderDelegate<IS & T>,
  ) {
    super(helper, component, root);
  }
}

export function updateJsxElementStyle(
  element: ts.JsxElement | ts.JsxSelfClosingElement,
  obj: ts.ObjectLiteralExpression,
) {
  const openEle = ts.isJsxSelfClosingElement(element) ? element : element.openingElement;
  const target = openEle.attributes.properties.filter(
    i => i.name && ts.isIdentifier(i.name) && i.name.text === "style",
  );
  const oldAttr = target[0] && ts.isJsxAttribute(target[0]) ? target[0] : null;
  if (oldAttr) {
    const oldExp = oldAttr.initializer;
    if (oldExp && ts.isObjectLiteralExpression(oldExp)) {
      const oldList = [...oldExp.properties];
      obj.properties.forEach(each => {
        const idx = oldList.findIndex(i => isIdentiferEqual(i.name, each.name));
        if (idx >= 0) {
          oldList[idx] = each;
        }
      });
      obj = ts.updateObjectLiteral(oldExp, oldList);
    }
  }
  return updateJsxElementAttr(element, "style", ts.createJsxExpression(undefined, obj));
}

function isIdentiferEqual(source?: any, compare?: any) {
  return source && compare && ts.isIdentifier(source) && ts.isIdentifier(compare) && source.text === compare.text;
}
