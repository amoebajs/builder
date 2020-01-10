import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationDelegate } from "./declaration";

@Injectable(InjectScope.New)
export class ClassDelegate extends DeclarationDelegate<ts.ClassDeclaration> {
  public emit(): ts.ClassDeclaration {
    return ts.createClassDeclaration([], [], ts.createIdentifier(this.name), [], [], []);
  }
}
