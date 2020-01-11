import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { DeclarationGenerator } from "./declaration";

@Injectable(InjectScope.New)
export class ClassGenerator extends DeclarationGenerator<ts.ClassDeclaration> {
  protected create(): ts.ClassDeclaration {
    return ts.createClassDeclaration([], [], ts.createIdentifier(this.name), [], [], []);
  }
}
