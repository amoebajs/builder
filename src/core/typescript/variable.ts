import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../decorators";
import { StatementGenerator } from "./statement";
import { is } from "../../utils/is";
import { createTypeListNode } from "./node";

export interface IVariableDefine {
  type: string[];
  initValue: ts.Expression | undefined;
}

export interface IVariableCreateOptions {
  name: string;
  type?: string | string[];
  initValue?: string | ((type: string[]) => ts.Expression);
}

@Injectable(InjectScope.New)
export class VariableGenerator extends StatementGenerator<ts.VariableStatement> {
  protected variables: Record<string, IVariableDefine> = {};

  public addField(options: string | IVariableCreateOptions) {
    if (typeof options === "string") options = { name: options, type: "any" };
    const fieldType = is.array(options.type) ? options.type : [options.type || "any"];
    this.variables[options.name] = {
      type: fieldType,
      initValue: !options.initValue
        ? void 0
        : typeof options.initValue === "string"
        ? ts.createIdentifier(options.initValue)
        : options.initValue(fieldType),
    };
    return this;
  }

  protected create(): ts.VariableStatement {
    return ts.createVariableStatement(
      [],
      ts.createVariableDeclarationList(createVariables(this.variables), ts.NodeFlags.Const),
    );
  }
}

export function createVariables(fields: Record<string, IVariableDefine>) {
  return Object.entries(fields).map(([name, field]) =>
    ts.createVariableDeclaration(ts.createIdentifier(name), createTypeListNode(field.type), field.initValue),
  );
}
