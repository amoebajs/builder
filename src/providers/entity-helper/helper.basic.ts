import ts from "typescript";
import { InjectScope } from "@bonbons/di";
import { Injectable } from "../../core/decorators";
import { resolveSyntaxInsert } from "../../core";
import { is } from "../../utils/is";
import { Primitive } from "utility-types";
@Injectable(InjectScope.Singleton)
export class BasicHelper {
  public createPropertyAccess(object: string, propertyChain: string) {
    return ts.createPropertyAccess(ts.createIdentifier(object), propertyChain);
  }

  /**
   * 创建字面量（不包括函数）
   * @param value 任意值，不支持循环引用
   */
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

  // public createClassByContext(unExport: boolean, name: string, context: IBasicCompilationFinalContext) {
  //   return ts.createClassDeclaration(
  //     [],
  //     createExportModifier(!unExport),
  //     ts.createIdentifier(name),
  //     [],
  //     exists([context.extendParent!, ...context.implementParents]),
  //     exists([...context.fields, ...context.properties, ...context.methods]),
  //   );
  // }

  // public createFunctionByContext(unExport: boolean, name: string, context: IBasicCompilationFinalContext) {
  //   return ts.createFunctionDeclaration(
  //     undefined,
  //     createExportModifier(!unExport),
  //     undefined,
  //     name,
  //     undefined,
  //     context.parameters,
  //     undefined,
  //     ts.createBlock(context.statements),
  //   );
  // }

  /**
   * 创建命名空间导入
   *
   * @example
   * // import * as React from 'react'
   * createNamespaceImport('react', 'React')
   * @param {string} moduleName 模块名
   * @param {string} namespace 命名空间
   */
  public createNamespaceImport(moduleName: string, namespace: string) {
    return ts.createImportDeclaration(
      undefined,
      undefined,
      ts.createImportClause(undefined, ts.createNamespaceImport(ts.createIdentifier(namespace))),
      ts.createStringLiteral(moduleName),
    );
  }

  /**
   * 创建命名空间导入请使用 createNamespaceImport
   *
   * @example
   * // import React, { useState, useCallback as UC } from 'react'
   * createImport('react', 'React', ['useState', ['useCallback', 'UC']])
   * @param {string} moduleName 模块名
   * @param {string | undefined} defaultName 默认导出
   * @param {Array<string | string[]>} named 具名导出，单个具名导出项为类型为[string, string]时会创建别名
   */
  public createImport(moduleName: string, defaultName?: string, named?: Array<string | string[]>) {
    return ts.createImportDeclaration(
      undefined,
      undefined,
      defaultName || named
        ? ts.createImportClause(
            defaultName ? ts.createIdentifier(defaultName) : undefined,
            named &&
              ts.createNamedImports(
                named.map(named => {
                  let propertyName: string | undefined;
                  let name: string;
                  if (is.string(named)) {
                    name = named;
                  } else {
                    propertyName = named[0];
                    name = named[1];
                  }
                  return ts.createImportSpecifier(
                    propertyName ? ts.createIdentifier(propertyName) : undefined,
                    ts.createIdentifier(name),
                  );
                }),
              ),
          )
        : undefined,
      ts.createStringLiteral(moduleName),
    );
  }

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
}
