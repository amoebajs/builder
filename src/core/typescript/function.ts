import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator } from "./declaration";
import { is } from "../../utils/is";

export type KeywordTypeName = "string" | "boolean" | "number" | "any" | "unknown" | "never";
export type KeywordTypeReal = string | boolean | number;

@Injectable(InjectScope.New)
export class FunctionGenerator extends DeclarationGenerator<ts.FunctionDeclaration> {
  protected params: Record<
    string,
    {
      type: KeywordTypeName;
      nullable: boolean;
      initValue: ts.Expression | undefined;
    }
  > = {};

  public addParamWithkeywordType(name: string, type: KeywordTypeName = "any", nullable = false) {
    this.params[name] = {
      type,
      nullable,
      initValue: void 0,
    };
    return this;
  }

  public setParamWithInitValue(name: string, initValue: KeywordTypeReal | ts.Expression) {
    const param = this.params[name];
    if (!param) return this;
    if (typeof initValue === param.type) {
      switch (typeof initValue) {
        case "string":
          param.initValue = ts.createStringLiteral(initValue);
          break;
        case "number":
          param.initValue = ts.createStringLiteral(initValue.toString());
          break;
        case "boolean":
          param.initValue = !initValue ? ts.createFalse() : ts.createTrue();
          break;
        default:
          break;
      }
    } else {
      param.initValue = <ts.Expression>initValue;
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
          ts.createTypeReferenceNode(i.type, []),
          !is.undefined(i.initValue) ? i.initValue : void 0,
        ),
      ),
      void 0,
      ts.createBlock([], true),
    );
  }
}
