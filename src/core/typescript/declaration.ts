import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { NodeGenerator } from "./node";

export type DeclarationExportType = false | "named" | "default";

@Injectable(InjectScope.New)
export abstract class DeclarationGenerator<T extends ts.Declaration = ts.Declaration> extends NodeGenerator<T> {
  protected name = "demo";
  protected exportType: DeclarationExportType = false;

  protected getName() {
    return ts.createIdentifier(this.name);
  }

  public setName(name: string) {
    this.name = name;
    return this;
  }

  public setExport(type: "named" | "default" | false) {
    this.exportType = type;
    return this;
  }
}

export function createDeclarationExport(type: DeclarationExportType) {
  return !type
    ? []
    : [
        ts.createModifier(ts.SyntaxKind.ExportKeyword),
        ...(type === "default" ? [ts.createModifier(ts.SyntaxKind.DefaultKeyword)] : []),
      ];
}
