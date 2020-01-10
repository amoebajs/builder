import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";

@Injectable(InjectScope.New)
export abstract class StatementGenerator<T extends ts.Statement = ts.Statement> {
  public abstract emit(): T;
}
