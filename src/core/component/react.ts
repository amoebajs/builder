import ts from "typescript";
import { BasicComponent } from "./basic";
import { IBasicComponentAppendType, IPureObject } from "../base";
import {
  TYPES,
  REACT,
  createConstVariableStatement,
  THIS,
  createJsxElement,
  IJsxAttrs
} from "../../utils";
import { PropertyRef, ReactVbRef } from "../../utils/directive";

export type IBasicReactContainerState<T = IPureObject> = T & {
  rootElement: {
    name: string;
    attrs: IJsxAttrs;
    types: any[];
  };
  rootChildren: ts.JsxElement[];
};

type TP = IBasicReactContainerState<IPureObject>;
type TY = IBasicReactContainerState<{}>;

export class BasicReactContainer<T extends TP = TY> extends BasicComponent<T> {
  protected addRootChildren(
    args: ts.JsxElement[],
    type: IBasicComponentAppendType = "push"
  ) {
    const rootChildren: ts.JsxElement[] = this.getRootChildren();
    if (type === "reset") {
      this.setState("rootChildren", args);
    } else {
      const newChildren = [...rootChildren];
      newChildren[type](...args);
      this.setState("rootChildren", newChildren);
    }
  }

  protected getRootChildren(): ts.JsxElement[] {
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
