import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { NodeGenerator } from "./node";

@Injectable(InjectScope.New)
export abstract class StatementGenerator<T extends ts.Statement = ts.Statement> extends NodeGenerator<T> {}
