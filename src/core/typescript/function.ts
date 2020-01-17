import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator, createDeclarationExport } from "./declaration";
import { is } from "../../utils/is";
import { createTypeListNode } from "./node";

export type KeywordTypeReal = string | boolean | number;
export interface IParamDefine {
  index: number;
  type: string[];
  destruct: string[];
  nullable: boolean;
  initValue: ts.Expression | undefined;
}

export interface INamedParamDefine extends IParamDefine {
  name: string;
}

export interface IParamCreateOptions {
  name?: string;
  type?: string | string[];
  destruct?: string[];
  nullable?: boolean;
  initValue?: string | ((type: string[], nullable: boolean) => ts.Expression);
}

export interface IBodyDefine {
  type: "text" | "statements";
  text?: string;
  statements?: (params: INamedParamDefine[]) => ts.Statement[];
}

@Injectable(InjectScope.New)
export class FunctionGenerator extends DeclarationGenerator<ts.FunctionDeclaration> {
  protected params: Record<string, IParamDefine> = {};
  protected typeParams: string[] = [];
  protected returnType: string[] = ["any"];
  protected body: IBodyDefine = { type: "statements", statements: () => [] };
  protected isGenerator = false;

  public setIsGenerator(is: boolean) {
    this.isGenerator = is;
    return this;
  }

  public pushTypeParam(typeName: string | string[]) {
    this.typeParams.push(...(is.array(typeName) ? typeName : [typeName]));
    return this;
  }

  public pushParam(options: string | IParamCreateOptions) {
    const index = Object.keys(this.params).length;
    if (typeof options === "string") options = { name: options, type: "any" };
    const paramName = options.name || "_p" + (index + 1);
    this.params[paramName] = createParamDefine(index, options);
    return this;
  }

  public setReturnType(type: string | string[]) {
    this.returnType = is.array(type) ? type : [type];
    return this;
  }

  public setBody(body: IBodyDefine["statements"] | IBodyDefine["text"]) {
    if (typeof body === "string") {
      this.body.type = "text";
      this.body.text = body;
    } else {
      this.body.type === "statements";
      this.body.statements = body || (() => []);
    }
    return this;
  }

  protected create(): ts.FunctionDeclaration {
    return ts.createFunctionDeclaration(
      [],
      createDeclarationExport(this.exportType),
      createFuncGeneratorToken(this.isGenerator),
      this.getName(),
      createFuncTypeParams(this.typeParams),
      createFuncParams(this.params),
      createFuncReturnType(this.returnType),
      createFuncBody(this.body, this.params),
    );
  }
}

function createParamDefine(index: number, options: IParamCreateOptions): IParamDefine {
  const paramType = is.array(options.type) ? options.type : [options.type || "any"];
  const paramNullable = options.nullable || false;
  return {
    index,
    type: paramType,
    destruct: options.destruct || [],
    nullable: paramNullable,
    initValue: !options.initValue
      ? void 0
      : typeof options.initValue === "string"
      ? ts.createIdentifier(options.initValue)
      : options.initValue(paramType, paramNullable),
  };
}

export function getFuncParamByIndex(params: Record<string, IParamDefine>) {
  return Object.entries(params).sort((a, b) => a[1].index - b[1].index);
}

export function createFuncParams(params: Record<string, IParamDefine>) {
  return getFuncParamByIndex(params).map(([n, i]) =>
    ts.createParameter(
      [],
      [],
      void 0,
      ts.createIdentifier(createFuncParamName(i, n)),
      createFuncParamNullable(i),
      createFuncParamType(i),
      createFuncParamInitValue(i),
    ),
  );
}

export function createFuncReturnType(returnType: string[]) {
  return returnType.length === 0 ? undefined : createTypeListNode(returnType);
}

export function createFuncTypeParams(typeParams: string[]) {
  return typeParams.map(i => ts.createTypeParameterDeclaration(i));
}

export function createFuncGeneratorToken(is: boolean): ts.AsteriskToken | undefined {
  return is ? ts.createToken(ts.SyntaxKind.AsteriskToken) : void 0;
}

export function createFuncParamInitValue(i: IParamDefine): ts.Expression | undefined {
  return !is.undefined(i.initValue) ? i.initValue : void 0;
}

export function createFuncParamNullable(i: IParamDefine): ts.QuestionToken | undefined {
  return i.nullable ? ts.createToken(ts.SyntaxKind.QuestionToken) : void 0;
}

export function createFuncParamType(i: IParamDefine): ts.TypeNode | undefined {
  return i.type.length === 0 ? ts.createTypeReferenceNode("any", []) : createTypeListNode(i.type);
}

export function createFuncParamName(i: IParamDefine, n: string): string {
  return i.destruct.length === 0 ? n : `{ ${i.destruct.join(", ")} }`;
}

export function createFuncBody(body: IBodyDefine, params: Record<string, IParamDefine>) {
  if (body.type === "text") {
    return ts.createBlock([ts.createStatement(ts.createIdentifier(body.text!))], false);
  }
  return ts.createBlock(
    body.statements!(getFuncParamByIndex(params).map(([name, param]) => ({ ...param, name }))),
    true,
  );
}
