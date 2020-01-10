import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";

@Injectable(InjectScope.New)
export abstract class DeclarationDelegate<T extends ts.Declaration = ts.Declaration> {
  protected name = "demo";

  public setName(name: string) {
    this.name = name;
    return this;
  }

  public abstract emit(): T;
}
