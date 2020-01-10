import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { IPureObject } from "../../core/base";
import { IJsxAttrs, REACT, TYPES } from "../../utils";
import { BasicComponent } from "../../core/component";
import { Injectable } from "../../core/decorators";
import { ReactHelper, ReactRender } from "../entity-helper";
import capitalize from "lodash/capitalize";

export type IBasicReactContainerState<T = IPureObject> = T & {
  rootElement: {
    name: string;
    attrs: IJsxAttrs;
    types: any[];
  };
  rootChildren: (ts.JsxChild | string)[];
};

type TP = IBasicReactContainerState<IPureObject>;
type TY = IBasicReactContainerState<{}>;

@Injectable(InjectScope.New)
export abstract class ReactComponent<T extends TP = TY> extends BasicComponent<T> {
  private __elementMap: Map<string | symbol, ts.JsxElement> = new Map();
  protected propType: string = "any";

  constructor(protected readonly helper: ReactHelper, protected readonly render: ReactRender) {
    super();
  }

  protected async onInit() {
    await super.onInit();
    this.render["parentRef"] = this;
    this.setRootElement(REACT.Fragment, {});
    this.setState("rootChildren", []);
    this.setExtendParent(ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [TYPES.PureComponent]));
  }

  protected async onChildrenPostRender() {
    await super.onChildrenPostRender();
    const children = this.getChildren();
    for (const child of children) {
      const props = child.props || {};
      const attrs: IJsxAttrs = {};
      for (const key in props) {
        if (props.hasOwnProperty(key)) {
          const element = props[key];
          switch (element.type) {
            case "state":
              attrs[key] = ts.createIdentifier(element.expression);
              break;
            case "props":
              attrs[key] = this.helper.createReactPropsAccess(element.expression);
              break;
            case "literal":
              attrs[key] = this.helper.createLiteral(element.expression);
              break;
            default:
              break;
          }
        }
      }
      this.addRootChildren(
        child.id,
        this.helper.createJsxElement(child.component, [], {
          ...attrs,
          key: child.id,
        }),
      );
    }
  }

  protected async onRender() {
    await super.onRender();
    const root = this.getState("rootElement");
    const children = this.getRootChildren();
    this.addParameters([
      ts.createParameter(
        undefined,
        undefined,
        undefined,
        "props",
        undefined,
        ts.createTypeReferenceNode(this.propType, undefined),
        undefined,
      ),
    ]);
    this.addStatements([
      ts.createReturn(
        ts.createParen(
          this.helper.createJsxElement(
            root.name,
            root.types,
            {
              ...root.attrs,
              key: this.entityId,
            },
            children,
          ),
        ),
      ),
    ]);
  }

  protected visitAndChangeChildNode(visitor: (key: string, node: ts.JsxElement) => ts.JsxElement) {
    const childNodes = Array.from(this.__elementMap.entries());
    for (const [key, node] of childNodes) {
      const newNode = visitor(<string>key, node);
      this.addRootChildren(<string>key, newNode);
    }
  }

  protected visitAndNotifyChildKey(visitor: (key: string) => void) {
    const childNodes = Array.from(this.__elementMap.keys());
    for (const key of childNodes) {
      visitor(<string>key);
    }
  }

  protected addRootChildren(id: string, element: ts.JsxElement) {
    this.__elementMap.set(id, element);
  }

  protected getRootChildren() {
    const list = Array.from(this.__elementMap.values());
    const nlist = this.getState("rootChildren") || [];
    return [...nlist, ...list];
  }

  protected setRootElement(tagName: string, attrs: IJsxAttrs) {
    this.setState("rootElement", {
      name: tagName,
      attrs,
      types: [],
    });
  }
  public addReactUseState(name: string, defaultValue: unknown, type?: string) {
    const genericType = type ? ts.createTypeReferenceNode(type, undefined) : TYPES.Any;
    const useState = ts.createCall(ts.createIdentifier("useState"), genericType ? [genericType] : undefined, [
      this.helper.createLiteral(defaultValue),
    ]);
    const declare = ts.createVariableDeclaration(
      ts.createArrayBindingPattern([
        ts.createBindingElement(undefined, undefined, name),
        ts.createBindingElement(undefined, undefined, "set" + capitalize(name)),
      ]),
      undefined,
      useState,
    );
    this.addStatements([
      ts.createVariableStatement([], ts.createVariableDeclarationList([declare], ts.NodeFlags.Const)),
    ]);
  }

  public addReactUseCallback(name: string, callback: Function | string, deps: string[] = []) {
    this.addVariable(
      name,
      this.helper.createFunctionCall("useCallback", [
        ts.createIdentifier(callback.toString()),
        ts.createArrayLiteral(deps.map(dep => ts.createIdentifier(dep))),
      ]),
    );
  }

  public addVariable(name: string, initilizer: ts.Expression) {
    this.addStatements([
      ts.createVariableStatement(
        [],
        ts.createVariableDeclarationList(
          [ts.createVariableDeclaration(ts.createIdentifier(name), TYPES.Any, initilizer)],
          ts.NodeFlags.Const,
        ),
      ),
    ]);
  }
}
