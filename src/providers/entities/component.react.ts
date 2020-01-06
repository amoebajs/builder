import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { IPureObject, resolveSyntaxInsert } from "../../core/base";
import { IJsxAttrs, REACT, TYPES } from "../../utils";
import { BasicComponent } from "../../core/component";
import { Injectable } from "../../core/decorators";
import { ReactHelper, ReactRender } from "../entity-helper";

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
    render["parentRef"] = this;
  }

  protected async onInit() {
    await super.onInit();
    this.setRootElement(REACT.Fragment, {});
    this.setState("rootChildren", []);
    this.setExtendParent(ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [TYPES.PureComponent]));
  }

  protected async onChildrenPostRender() {
    await super.onChildrenPostRender();
    const children = this.getChildren();
    for (const iterator of children) {
      const options = iterator.options || {};
      const attrs: IJsxAttrs = {};
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          const element = options[key];
          switch (element.type) {
            case "state":
            case "props":
              attrs[key] = this.helper.resolvePropState(element.expression, element.type);
              break;
            case "literal":
              attrs[key] = resolveSyntaxInsert(element.syntaxType, element.expression, (_, v) => v.toString());
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
      ]),
    );
    this.addMethods([renderMethod]);
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
}
