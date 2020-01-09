import { InjectScope } from "@bonbons/di";
import { Injectable } from "../../core/decorators";
import { IBasicCompilationFinalContext, resolveSyntaxInsert } from "../../core";
import { is } from "../../utils/is";
import ts = require("typescript");
import { Primitive } from "utility-types";
import { createExportModifier, exists } from "../../utils";

@Injectable(InjectScope.Singleton)
export class BasicHelper {
  public createObjectLiteral(object: Record<string, unknown>) {
    const keys = Object.keys(object);
    const properties = keys.map(key => {
      const value = object[key];
      const expr = this.createLiteral(value);
      const property = ts.createPropertyAssignment(key, expr);
      return property;
    });
    const literal = ts.createObjectLiteral(properties, true);
    return literal;
  }

  public createArrayLiteral(array: unknown[]) {
    const elements = array.map(item => {
      let expr: ts.Expression;
      if (is.stringOrNumberOrBoolean(item)) {
        expr = resolveSyntaxInsert(typeof item, item);
      } else if (is.array(item)) {
        expr = this.createArrayLiteral(item);
      } else {
        expr = this.createObjectLiteral(item as Record<string, Primitive>);
      }
      return expr;
    });
    const literal = ts.createArrayLiteral(elements, true);
    return literal;
  }

  public createPropertyAccess(object: string, propertyChain: string) {
    return ts.createPropertyAccess(ts.createIdentifier(object), propertyChain);
  }

  public createLiteral(value: unknown) {
    if (is.number(value)) {
      return ts.createNumericLiteral(value.toString());
    } else if (is.boolean(value)) {
      return value ? ts.createTrue() : ts.createFalse();
    } else if (is.array(value)) {
      return this.createArrayLiteral(value);
    } else if (is.object(value)) {
      return this.createObjectLiteral(value);
    } else {
      /**
       * Treat the others as string
       * @TODO symbol, undefined, null, function
       */
      return ts.createStringLiteral(String(value));
    }
  }

  public createClassByContext(unExport: boolean, name: string, context: IBasicCompilationFinalContext) {
    return ts.createClassDeclaration(
      [],
      createExportModifier(!unExport),
      ts.createIdentifier(name),
      [],
      exists([context.extendParent!, ...context.implementParents]),
      exists([...context.fields, ...context.properties, ...context.methods]),
    );
  }

  public createFunctionByContext(unExport: boolean, name: string, context: IBasicCompilationFinalContext) {
    return ts.createFunctionDeclaration(
      undefined,
      createExportModifier(!unExport),
      undefined,
      name,
      undefined,
      context.parameters,
      undefined,
      ts.createBlock(context.statements),
    );
  }
}
