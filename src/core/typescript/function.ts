import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator } from "./declaration";
import { is } from "../../utils/is";

export type KeywordTypeReal = string | boolean | number;
export interface IParamDefine {
  type: string[];
  destruct: string[];
  nullable: boolean;
  initValue: ts.Expression | undefined;
}

@Injectable(InjectScope.New)
export class FunctionGenerator extends DeclarationGenerator<ts.FunctionDeclaration> {
  protected params: Record<string, IParamDefine> = {};

  public pushParamWithType(name: string, type: string | string[], nullable = false) {
    this.params[name] = {
      type: is.array(type) ? type : [type],
      destruct: [],
      nullable,
      initValue: void 0,
    };
    return this;
  }

  public updateParamDestruct(name: string, destruct: string[]) {
    const param = this.params[name];
    if (!param) return this;
    for (const nm of destruct) {
      if (param.destruct.indexOf(nm) < 0) {
        param.destruct.push(nm);
      }
    }
    return this;
  }

  public updateParamInitValue(
    name: string,
    initValue: string | ((type: string[], nullable: boolean) => ts.Expression),
  ) {
    const param = this.params[name];
    if (!param) return this;
    if (typeof initValue === "string") {
      param.initValue = ts.createIdentifier(initValue);
    } else {
      param.initValue = initValue(param.type, param.nullable);
    }
    return this;
  }

  protected create(): ts.FunctionDeclaration {
    return ts.createFunctionDeclaration(
      [],
      [],
      void 0,
      ts.createIdentifier(this.name),
      [],
      Object.entries(this.params).map(([n, i]) =>
        ts.createParameter(
          [],
          [],
          void 0,
          ts.createIdentifier(createFuncParamName(i, n)),
          createFuncParamNullable(i),
          createFuncParamType(i),
          createFuncParamInitValue(i),
        ),
      ),
      void 0,
      ts.createBlock([], true),
    );
  }
}

function createFuncParamInitValue(i: IParamDefine): ts.Expression | undefined {
  return !is.undefined(i.initValue) ? i.initValue : void 0;
}

function createFuncParamNullable(i: IParamDefine): ts.QuestionToken | undefined {
  return i.nullable ? ts.createToken(ts.SyntaxKind.QuestionToken) : void 0;
}

function createFuncParamType(i: IParamDefine): ts.TypeNode | undefined {
  return i.type.length === 0
    ? ts.createTypeReferenceNode("any", [])
    : ts.createTypeReferenceNode(i.type.join(" | "), []);
}

function createFuncParamName(i: IParamDefine, n: string): string {
  return i.destruct.length === 0 ? n : `{ ${i.destruct.join(", ")} }`;
}
