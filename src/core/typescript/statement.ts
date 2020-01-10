import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";

@Injectable(InjectScope.New)
export abstract class StatementDelegate<T extends ts.Statement = ts.Statement> {
  public abstract emit(): T;
}
