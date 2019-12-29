import ts from "typescript";
import { BasicComponent } from "./basic";
import {
  IBasicComponentAppendType,
  IPureObject,
  resolveSyntaxInsert
} from "../base";
import {
  TYPES,
  REACT,
  createConstVariableStatement,
  THIS,
  createJsxElement,
  IJsxAttrs
} from "../../utils";
import { PropertyRef, ReactVbRef } from "../base";
import { BasicEntityProvider } from "./create";
import { EntityConstructor, resolveReactProps } from "../../decorators";

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

export class BasicReactContainer<T extends TP = TY> extends BasicComponent<T> {
  protected addRootChildren(
    args: ts.JsxElement[],
    type: IBasicComponentAppendType = "push"
  ) {
    const rootChildren = this.getRootChildren();
    if (type === "reset") {
      this.setState("rootChildren", args);
    } else {
      const newChildren = [...rootChildren];
      newChildren[type](...args);
      this.setState("rootChildren", newChildren);
    }
  }

  protected getRootChildren() {
    return this.getState("rootChildren") || [];
  }

  protected setRootElement(tagName: string, attrs: IJsxAttrs) {
    this.setState("rootElement", {
      name: tagName,
      attrs,
      types: []
    });
  }

  protected getRef(name: string): ReactVbRef | null;
  protected getRef(name: string): PropertyRef | null;
  protected getRef(name: string) {
    const ref = super.getRef(name);
    if (ref instanceof ReactVbRef) {
      return ref;
    }
    return null;
  }

  protected resolveRef(name: string): ts.Expression | null {
    const ref = this.getRef(name);
    if (ref) {
      if (ref.type === "props") {
        return ts.createPropertyAccess(ts.createThis(), ref["expression"]);
      }
    }
    return super.resolveRef(name);
  }

  protected resolveJsxAttrs(attrs: {
    [name: string]: string | ts.Expression | null;
  }): IJsxAttrs {
    return Object.keys(attrs)
      .filter(i => attrs.hasOwnProperty(i))
      .map(k => ({
        [k]:
          typeof attrs[k] === "string"
            ? <string>attrs[k]
            : ts.createJsxExpression(undefined, <any>attrs[k]!)
      }))
      .reduce((p, c) => ({ ...p, ...c }), {});
  }

  protected async onInit() {
    await super.onInit();
    this.setRootElement(REACT.Fragment, {});
    this.setState("rootChildren", []);
    this.setExtendParent(
      ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        TYPES.PureComponent
      ])
    );
  }

  protected async onPreRender() {
    await super.onPreRender();
    const children = this.getChildren();
    const rootChildren = this.getState("rootChildren");
    for (const iterator of children) {
      const options = iterator.options || {};
      const attrs: IJsxAttrs = {};
      for (const key in options) {
        if (options.hasOwnProperty(key)) {
          const element = options[key];
          switch (element.type) {
            case "state":
              attrs[key] = ts.createPropertyAccess(
                ts.createThis(),
                "state." + element.expression.toString()
              );
              break;
            case "props":
              attrs[key] = ts.createPropertyAccess(
                ts.createIdentifier("props"),
                element.expression.toString()
              );
              break;
            case "literal":
              attrs[key] = resolveSyntaxInsert(
                element.syntaxType,
                element.expression,
                (_, v) => v.toString()
              );
              break;
            default:
              break;
          }
        }
      }
      rootChildren.push(
        createJsxElement(iterator.component, [], {
          ...attrs,
          key: iterator.id
        })
      );
    }
    this.setState("rootChildren", rootChildren);
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

export class ReactEntityProvider extends BasicEntityProvider {
  protected onImportsUpdate(
    model: BasicComponent,
    imports: ts.ImportDeclaration[]
  ) {
    return super.onImportsUpdate(model, imports, [
      ts.createImportDeclaration(
        [],
        [],
        ts.createImportClause(ts.createIdentifier(REACT.NS), undefined),
        ts.createStringLiteral("react")
      )
    ]);
  }

  public resolveExtensionsMetadata(
    target: EntityConstructor<any>
  ): { [name: string]: any } {
    return {
      props: resolveReactProps(target)
    };
  }
}
