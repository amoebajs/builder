import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { NodeGenerator } from "./node";

@Injectable(InjectScope.New)
export abstract class DeclarationGenerator<T extends ts.Declaration = ts.Declaration> extends NodeGenerator<T> {
  protected name = "demo";

  public setName(name: string) {
    this.name = name;
    return this;
  }
}
