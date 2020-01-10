import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator } from "./declaration";
import { is } from "../../utils/is";

export type KeywordTypeReal = string | boolean | number;

@Injectable(InjectScope.New)
export class FunctionGenerator extends DeclarationGenerator<ts.FunctionDeclaration> {
  protected params: Record<
    string,
    {
      type: string[];
      nullable: boolean;
      initValue: ts.Expression | undefined;
    }
  > = {};

  public addParamWithType(name: string, type: string | string[], nullable = false) {
    this.params[name] = {
      type: is.array(type) ? type : [type],
      nullable,
      initValue: void 0,
    };
    return this;
  }

  public setParamWithInitValue(
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

  public emit(): ts.FunctionDeclaration {
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
          ts.createIdentifier(n),
          i.nullable ? ts.createToken(ts.SyntaxKind.QuestionToken) : void 0,
          i.type.length === 0
            ? ts.createTypeReferenceNode("any", [])
            : ts.createTypeReferenceNode(i.type.join(" | "), []),
          !is.undefined(i.initValue) ? i.initValue : void 0,
        ),
      ),
      void 0,
      ts.createBlock([], true),
    );
  }
}
