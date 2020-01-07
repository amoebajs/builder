import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { IPureObject, resolveSyntaxInsert } from "../../core/base";
import { IJsxAttrs, REACT, TYPES } from "../../utils";
import { BasicComponent } from "../../core/component";
import { Injectable } from "../../core/decorators";
import { ReactHelper, ReactRender } from "../entity-helper";
import capitalize from "lodash/capitalize";
import { is } from "../../utils/is";

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
export class ReactComponent<T extends TP = TY> extends BasicComponent<T> {
  private __elementMap: Map<string | symbol, ts.JsxElement> = new Map();

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
    for (const iterator of children) {
      const props = iterator.props || {};
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
        iterator.id,
        this.helper.createJsxElement(iterator.component, [], {
          ...attrs,
          key: iterator.id,
        }),
      );
    }
  }

  protected async onRender() {
    await super.onRender();
    const root = this.getState("rootElement");
    const children = this.getRootChildren();
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
  protected addReactUseState(name: string, defaultValue: any) {
    const useState = ts.createCall(ts.createIdentifier("useState"), undefined, [
      resolveSyntaxInsert(typeof defaultValue, defaultValue, (_, __) =>
        is.array(defaultValue)
          ? this.helper.createArrayLiteral(defaultValue)
          : this.helper.createObjectLiteral(defaultValue),
      ),
    ]);
    const declare = ts.createVariableDeclaration(
      ts.createArrayBindingPattern([
        ts.createBindingElement(undefined, undefined, name),
        ts.createBindingElement(undefined, undefined, "set" + capitalize(name)),
      ]),
      undefined,
      useState,
    );
    this.addStatements([ts.createVariableStatement([], [declare])]);
  }
}
