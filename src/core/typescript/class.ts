import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator } from "./declaration";
import { is } from "../../utils/is";
import {
  FunctionGenerator,
  IBodyDefine,
  IParamCreateOptions,
  createFuncBody,
  createFuncParams,
  createFuncReturnType,
  createFuncTypeParams,
} from "./function";

export interface IFiledDefine {
  type: string[];
  initValue: ts.Expression | undefined;
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

export interface IFiledCreateOptions {
  name: string;
  type?: string | string[];
  initValue?: string | ((type: string[]) => ts.Expression);
}

@Injectable(InjectScope.New)
export class ClassGenerator extends DeclarationGenerator<ts.ClassDeclaration> {
  protected fields: Record<string, IFiledDefine> = {};
  protected methods: Record<string, IMethodDefine> = {};
  protected typeParams: string[] = [];

  public pushTypeParam(typeName: string) {
    this.typeParams.push(typeName);
    return this;
  }

  public addField(options: string | IFiledCreateOptions) {
    if (typeof options === "string") options = { name: options, type: "any" };
    const fieldType = is.array(options.type) ? options.type : [options.type || "any"];
    this.fields[options.name] = {
      type: fieldType,
      initValue: !options.initValue
        ? void 0
        : typeof options.initValue === "string"
        ? ts.createIdentifier(options.initValue)
        : options.initValue(fieldType),
    };
    return this;
  }

  public addMethod(options: IMethodCreateOptions) {
    const method = (this.methods[options.name] = {
      index: Object.keys(this.methods).length,
      function: new FunctionGenerator()
        .setName(options.name)
        .pushTypeParam(options.typeParams || [])
        .setBody(options.body),
    });
    (options.params || []).forEach(p => method.function.pushParam(p));
    return this;
  }

  protected create(): ts.ClassDeclaration {
    return ts.createClassDeclaration(
      [],
      [],
      ts.createIdentifier(this.name),
      createClassTypeParams(this.typeParams),
      [],
      [...createClassFields(this.fields), ...createClassMethods(this.methods)],
    );
  }
}

export function createClassTypeParams(typeParams: string[]) {
  return typeParams.map(i => ts.createTypeParameterDeclaration(i));
}

export function createClassFields(fields: Record<string, IFiledDefine>) {
  return Object.entries(fields).map(([name, field]) =>
    ts.createProperty(
      [],
      [],
      ts.createIdentifier(name),
      undefined,
      ts.createTypeReferenceNode(field.type.join(" | "), []),
      field.initValue,
    ),
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
