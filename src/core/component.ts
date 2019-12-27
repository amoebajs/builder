import ts from "typescript";

export interface IComponentUnitBase {
  render(context: IExtensiveComponentContext): void;
}

export interface IExtensiveComponentContext {
  extendParent: ts.HeritageClause;
  implementParents: ts.HeritageClause[];
  fields: ts.PropertyDeclaration[];
  properties: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];
  rootChildren: ts.JsxElement[];
}

// export interface IExtensiveComponentContract {
//   createExtendParent(): ts.HeritageClause;
//   createImplementParents(): ts.HeritageClause[];
//   createFields(): ts.PropertyDeclaration[];
//   createProperties(): ts.PropertyDeclaration[];
//   createMethods(): ts.MethodDeclaration[];
//   createRenderChildren(): ts.JsxElement[];
//   createRender(): ts.MethodDeclaration;
// }

export abstract class BasicComponent implements IComponentUnitBase {
  abstract render(context: IExtensiveComponentContext): void;
}
