import ts from "typescript";
import { Primitive } from "utility-types";
import { InjectScope, Injector } from "@bonbons/di";
import { ImportGenerator, Injectable, resolveSyntaxInsert } from "../../core";
import { is } from "../../utils";

@Injectable(InjectScope.Singleton)
export class BasicHelper {
  public get __engine(): typeof import("typescript") {
    return ts;
  }

  constructor(protected injector: Injector) {}

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
    return this.injector
      .get(ImportGenerator)
      .setNamespaceName(namespace)
      .setModulePath(moduleName);
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
    const gen = this.injector.get(ImportGenerator);
    if (defaultName) gen.setDefaultName(defaultName);
    if (named) {
      named.forEach(named => {
        let propertyName: string | undefined;
        let name: string;
        if (is.string(named)) {
          name = named;
          gen.addNamedBinding(name, name);
        } else {
          propertyName = named[0];
          name = named[1];
          gen.addNamedBinding(name ?? propertyName, propertyName);
        }
      });
    }
    return gen.setModulePath(moduleName);
  }

  public createObjectLiteral(object: Record<string, unknown>) {
    const keys = Object.keys(object);
    const properties = keys.map(key => {
      const value = object[key];
      const expr = this.createLiteral(value);
      const property = ts.createPropertyAssignment(key, expr);
      return property;
    });
    const literal = ts.createObjectLiteral(properties);
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

  public createFunctionCall(name: string, parameters: (string | ts.Expression)[]) {
    return ts.createCall(
      ts.createIdentifier(name),
      undefined,
      parameters.map(param => (is.string(param) ? ts.createIdentifier(param) : param)),
    );
  }

  public createObjectAttr(value: Record<string, number | string | boolean | ts.Expression>) {
    return ts.createObjectLiteral(
      Object.entries(value)
        .filter(i => i[1] !== void 0)
        .map(([n, v]) =>
          ts.createPropertyAssignment(
            ts.createIdentifier(n),
            resolveSyntaxInsert(typeof v, v, (_, e) => e),
          ),
        ),
    );
  }

  public createSyntaxExpression(expression: string): ts.Expression {
    return ts.createIdentifier(expression);
  }
}
