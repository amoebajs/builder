import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { NodeGenerator } from "./node";

@Injectable(InjectScope.New)
export abstract class StatementGenerator<T extends ts.Statement = ts.Statement> extends NodeGenerator<T> {}

@Injectable(InjectScope.New)
export class AnonymousStatementGenerator extends StatementGenerator<ts.Statement> {
  protected expression!: string | (() => ts.Expression);

  public setValue(expression: string | (() => ts.Expression)) {
    this.expression = expression;
    return this;
  }

  protected create(): ts.Statement {
    return ts.createStatement(
      typeof this.expression === "string" ? ts.createIdentifier(this.expression) : this.expression(),
    );
  }
}
