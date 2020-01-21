import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { NodeGenerator } from "./node";

@Injectable(InjectScope.New)
export abstract class ExpressionGenerator<T extends ts.Expression = ts.Expression> extends NodeGenerator<T> {}
