import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationDelegate } from "./declaration";
import { is } from "../../utils/is";

export type KeywordTypeName = "string" | "boolean" | "number" | "any" | "unknown" | "never";

@Injectable(InjectScope.New)
export class FunctionDelegate extends DeclarationDelegate<ts.FunctionDeclaration> {
  protected params: Record<
    string,
    {
      type: KeywordTypeName;
      nullable: boolean;
      initValue: ts.Expression | undefined;
    }
  > = {};

  public addkeywordTypeParam(
    name: string,
    type: KeywordTypeName = "any",
    nullable = false,
    initValue: ts.Expression | undefined = void 0,
  ) {
    this.params[name] = {
      type,
      nullable,
      initValue,
    };
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
