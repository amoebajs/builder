import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator, createDeclarationExport } from "./declaration";
import {
  FunctionGenerator,
  IBodyDefine,
  IParamCreateOptions,
  createFuncBody,
  createFuncParams,
  createFuncReturnType,
  createFuncTypeParams,
} from "./function";
import { IVariableCreateOptions, VariableGenerator } from "./variable";
import { createTypeListNode } from "./node";

export interface IFiledGroupDefine {
  nullable: Record<string, boolean>;
  variables: VariableGenerator;
}

export interface IMethodDefine {
  index: number;
  function: FunctionGenerator;
}

export interface IMethodCreateOptions {
  name: string;
  typeParams?: string | string[];
  returnType?: string[];
  params?: IParamCreateOptions[];
  body?: IBodyDefine["statements"] | IBodyDefine["text"];
}

export interface IFieldCreateOptions extends IVariableCreateOptions {
  name: string;
  nullable?: boolean;
}

@Injectable(InjectScope.New)
export class ClassGenerator extends DeclarationGenerator<ts.ClassDeclaration> {
  protected fields: IFiledGroupDefine = { nullable: {}, variables: new VariableGenerator() };
  protected methods: Record<string, IMethodDefine> = {};
  protected typeParams: string[] = [];
  protected extendName: string | null = null;
  protected implementNames: string[] = [];

  public pushTypeParam(typeName: string) {
    this.typeParams.push(typeName);
    return this;
  }

  public addField(options: string | IFieldCreateOptions) {
    if (typeof options === "string") options = { name: options, type: "any" };
    this.fields.nullable[options.name] = options.nullable || false;
    this.fields.variables.addField(options);
    return this;
  }

  public addMethod(options: IMethodCreateOptions) {
    const method = (this.methods[options.name] = {
      index: Object.keys(this.methods).length,
      function: new FunctionGenerator()
        .setName(options.name)
        .pushTypeParam(options.typeParams || [])
        .setReturnType(options.returnType || [])
        .setBody(options.body),
    });
    (options.params || []).forEach(p => method.function.pushParam(p));
    return this;
  }

  public setExtend(name: string | null) {
    this.extendName = name;
    return this;
  }

  public addImplement(name: string) {
    this.implementNames.push(name);
    return this;
  }

  protected create(): ts.ClassDeclaration {
    return ts.createClassDeclaration(
      [],
      createDeclarationExport(this.exportType),
      ts.createIdentifier(this.name),
      createClassTypeParams(this.typeParams),
      this.exist([createClassExtend(this.extendName), ...createClassImplements(this.implementNames)]),
      this.exist([...createClassFields(this.fields), ...createClassMethods(this.methods)]),
    );
  }
}

export function createClassTypeParams(typeParams: string[]) {
  return typeParams.map(i => ts.createTypeParameterDeclaration(i));
}

export function createClassFields(fields: IFiledGroupDefine) {
  return Object.entries(fields.variables["variables"]).map(([name, field]) =>
    ts.createProperty(
      [],
      [],
      ts.createIdentifier(name),
      fields.nullable[name] ? ts.createToken(ts.SyntaxKind.QuestionToken) : undefined,
      createTypeListNode(field.type),
      field.initValue,
    ),
  );
}

export function createClassExtend(name: string | null) {
  return !name
    ? undefined
    : ts.createHeritageClause(ts.SyntaxKind.ExtendsKeyword, [
        ts.createExpressionWithTypeArguments([], ts.createIdentifier(name)),
      ]);
}

export function createClassImplements(names: string[]) {
  return names.length === 0
    ? []
    : names.map(name =>
        ts.createHeritageClause(ts.SyntaxKind.ImplementsKeyword, [
          ts.createExpressionWithTypeArguments([], ts.createIdentifier(name)),
        ]),
      );
}

export function getClassMethodByIndex(params: Record<string, IMethodDefine>) {
  return Object.entries(params).sort((a, b) => a[1].index - b[1].index);
}

export function createClassMethods(params: Record<string, IMethodDefine>) {
  return getClassMethodByIndex(params).map(([_, i]) =>
    ts.createMethod(
      [],
      [],
      void 0,
      i.function["getName"](),
      void 0,
      createFuncTypeParams(i.function["typeParams"]),
      createFuncParams(i.function["params"]),
      createFuncReturnType(i.function["returnType"]),
      createFuncBody(i.function["body"], i.function["params"]),
    ),
  );
}
