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

  protected getExportModifiers(): ts.Modifier[] {
    return !this.exportType
      ? []
      : [
          ts.createModifier(ts.SyntaxKind.ExportKeyword),
          ...(this.exportType === "default" ? [ts.createModifier(ts.SyntaxKind.DefaultKeyword)] : []),
        ];
  }

  public setName(name: string) {
    this.name = name;
    return this;
  }

  public setExportType(isExport: boolean, isDefault = false) {
    this.exportType = !isExport ? false : isDefault ? "default" : "named";
    return this;
  }
}
