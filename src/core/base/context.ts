import ts from "typescript";
import { EntityType, ICompChildRefPluginOptions, IComponentCreateOptions, IDirectiveCreateOptions } from "./entity";
import { IInnerCompnentChildRef } from "../child-ref";
import {
  ClassGenerator,
  FunctionGenerator,
  ImportGenerator,
  JsxAttributeGenerator,
  JsxElementGenerator,
  JsxExpressionGenerator,
  VariableGenerator,
} from "../typescript";

export const ContextItemsGroup = {
  import: ImportGenerator,
  variable: VariableGenerator,
  class: ClassGenerator,
  function: FunctionGenerator,
  ["jsx-element"]: JsxElementGenerator,
  ["jsx-attribute"]: JsxAttributeGenerator,
  ["jsx-expression"]: JsxExpressionGenerator,
};

export interface IFinalScopedContext {
  // imports: ts.ImportDeclaration[];
  imports: InstanceType<typeof ContextItemsGroup["import"]>[];
  variables: InstanceType<typeof ContextItemsGroup["variable"]>[];
  // classes: ts.ClassDeclaration[];
  classes: InstanceType<typeof ContextItemsGroup["class"]>[];
  // functions: ts.FunctionDeclaration[];
  functions: InstanceType<typeof ContextItemsGroup["function"]>[];
}

export interface IFinalAstContext {
  imports: ts.ImportDeclaration[];
  variables: ts.VariableStatement[];
  classes: ts.ClassDeclaration[];
  functions: ts.FunctionDeclaration[];
  statements: ts.Statement[];
}

export interface IScopeStructure<TYPE extends EntityType, ENTITY> {
  scope: string | symbol;
  parent: string | symbol | undefined;
  type: TYPE;
  container: ENTITY;
}

export interface IScopedContext
  extends Map<string | symbol, IScopeStructure<EntityType, Partial<IFinalScopedContext>>> {}

export abstract class SourceFileContext<T extends any> {
  public scopedContext: IScopedContext = new Map();
  public astContext!: IFinalAstContext;
  public provider!: T;
  public root!: IInnerCompnentChildRef;
  public components!: IComponentCreateOptions[];
  public directives!: IDirectiveCreateOptions[];
  public dependencies!: Record<string, string>;
  public defaultCompRefRecord: Record<string, string> = {};
  public abstract setProvider(provider: string): this;
  public abstract importComponents(components: IComponentCreateOptions[]): this;
  public abstract importDirectives(directives: IDirectiveCreateOptions[]): this;
  public abstract build(): this;
  public abstract getDependencies(): Record<string, string>;
  public abstract createRoot(options: ICompChildRefPluginOptions): Promise<void>;
  public abstract callCompilation(): Promise<void>;
  public abstract createSourceFile(): Promise<ts.SourceFile>;
}
