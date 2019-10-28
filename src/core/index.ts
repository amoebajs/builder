import ts from "typescript";
import {
  REACT,
  createConstVariableStatement,
  THIS,
  createJsxElement,
  DOMS
} from "../utils";

export interface IJsxAttrs {
  [key: string]: ts.JsxExpression | string;
}
export interface IExtensivePageState {
  rootElement: {
    name: string;
    attrs: IJsxAttrs;
    types: ts.TypeNode[];
  };
  rootChildren: ts.JsxElement[];
  [key: string]: any;
}

export abstract class ExtensivePage {
  protected readonly state: IExtensivePageState = {
    rootElement: {
      name: REACT.Fragment,
      attrs: {},
      types: []
    },
    rootChildren: []
  };

  constructor() {
    this.onInit();
  }

  protected onInit() {
    // DO NOTHING FOR OVERRIDE
  }

  protected createRenderChildren() {
    return this.state.rootChildren || [];
  }

  public createRender() {
    const { rootElement: root } = this.state;
    const children = this.createRenderChildren();
    return ts.createMethod(
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
  }
}

export class ForkSlotPage extends ExtensivePage {
  protected onInit() {
    this.state.rootElement.name = DOMS.Div;
    this.state.rootElement.attrs["className"] = "root-container";
    this.state.rootChildren.push(
      createJsxElement(DOMS.Span, [], { className: "bold-font" }, [
        "inner-text"
      ])
    );
  }

  protected createRenderChildren() {
    return [
      createJsxElement(
        "div",
        [],
        { className: "div-left" },
        this.state.rootChildren
      ),
      createJsxElement(
        "div",
        [],
        { className: "div-right" },
        this.state.rootChildren
      )
    ];
  }
}
