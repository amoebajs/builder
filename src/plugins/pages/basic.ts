import ts from "typescript";
import { Page } from "../../decorators";
import {
  REACT,
  createConstVariableStatement,
  THIS,
  createJsxElement,
  TYPES
} from "../../utils";

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

export interface IExtensivePageContext {
  extendParent: ts.HeritageClause;
  implementParents: ts.HeritageClause[];
  fields: ts.PropertyDeclaration[];
  properties: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  render: ts.MethodDeclaration;
}

export interface IExtensivePageContract {
  createExtendParent(): ts.HeritageClause;
  createImplementParents(): ts.HeritageClause[];
  createFields(): ts.PropertyDeclaration[];
  createProperties(): ts.PropertyDeclaration[];
  createMethods(): ts.MethodDeclaration[];
  createRender(): ts.MethodDeclaration;
}

export type ExtensivePageProcessor = (
  context: IExtensivePageContext,
  options: { [name: string]: any }
) => IExtensivePageContext;

@Page({
  name: "basic_extensive_page",
  displayName: "基础可扩展页面",
  abstract: true
})
export abstract class ExtensivePage<T extends any = any>
  implements IExtensivePageContract {
  protected readonly options: T = <any>{};
  protected readonly state: IExtensivePageState = {
    rootElement: {
      name: REACT.Fragment,
      attrs: {},
      types: []
    },
    rootChildren: []
  };

  constructor(options?: T) {
    if (options) {
      this.options = options;
    }
  }

  protected onInit() {
    // DO NOTHING FOR OVERRIDE
  }

  protected createRenderChildren() {
    return this.state.rootChildren || [];
  }

  public createExtendParent(): ts.HeritageClause {
    return ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
      TYPES.PureComponent
    ]);
  }

  public createImplementParents(): ts.HeritageClause[] {
    return [];
  }

  public createFields(): ts.PropertyDeclaration[] {
    return [];
  }

  public createProperties(): ts.PropertyDeclaration[] {
    return [];
  }

  public createMethods(): ts.MethodDeclaration[] {
    return [];
  }

  public createRender(): ts.MethodDeclaration {
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