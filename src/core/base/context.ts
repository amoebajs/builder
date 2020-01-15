import ts from "typescript";
import { EntityType } from "./entity";

export interface IFinalScopedContext {
  // all level
  imports: ts.ImportDeclaration[];

  // class level
  extendParent: ts.HeritageClause | null;
  implementParents: ts.HeritageClause[];
  fields: ts.PropertyDeclaration[];
  properties: ts.PropertyDeclaration[];
  methods: ts.MethodDeclaration[];

  // page level and function level
  classes: ts.ClassDeclaration[];
  functions: ts.FunctionDeclaration[];

  // function level
  parameters: ts.ParameterDeclaration[];
  statements: ts.Statement[];
}

export interface IScopeStructure<TYPE extends EntityType, ENTITY> {
  scope: string | symbol;
  type: TYPE;
  container: ENTITY;
}

export interface IScopedContext
  extends Map<string | symbol, IScopeStructure<EntityType, Partial<IFinalScopedContext>>> {}

export abstract class SourceFileContext<T extends any> {
  public scopedContext: IScopedContext = new Map();
  public provider!: T;
  public abstract setProvider(provider: string): void;
}
