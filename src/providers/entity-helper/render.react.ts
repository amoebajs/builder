import ts from "typescript";
import { NotFoundError } from "../../errors";
import { ReactComponent } from "..";
import { Injectable } from "../../core";
import { InjectScope } from "@bonbons/di";
import { ReactHelper } from "./helper.react";

@Injectable(InjectScope.New)
export class ReactRender {
  private parentRef!: ReactComponent;

  constructor(private helper: ReactHelper) {}

  public getElementById(entityId: string) {
    const map = this.parentRef["__elementMap"];
    return map.get(entityId) || null;
  }

  public setElementById(entityId: string, element: any) {
    const map = this.parentRef["__elementMap"];
    map.set(entityId, element);
  }

  public getJsxAttribute(entityId: string, name: string) {
    const element = this.getElementById(entityId);
    if (!element) {
      throw new NotFoundError(`target entity [${entityId}] is not found`);
    }
    const openEle = element.openingElement;
    const target = openEle.attributes.properties.filter(i => i.name && ts.isIdentifier(i.name) && i.name.text === name);
    return target[0] && ts.isJsxAttribute(target[0]) ? target[0] : null;
  }

  public appendJsxAttribute(entityId: string, name: string, value: ts.JsxExpression | ts.StringLiteral) {
    const element = this.getElementById(entityId);
    if (!element) {
      throw new NotFoundError(`target entity [${entityId}] is not found`);
    }
    const openEle = element.openingElement;
    const props = openEle.attributes.properties.filter(i => i.name && ts.isIdentifier(i.name) && i.name.text !== name);
    const newAttrs = ts.updateJsxAttributes(openEle.attributes, [
      ...props,
      ts.createJsxAttribute(ts.createIdentifier(name), value),
    ]);
    const newElement = ts.updateJsxOpeningElement(openEle, openEle.tagName, openEle.typeArguments, newAttrs);
    this.setElementById(entityId, ts.updateJsxElement(element, newElement, element.children, element.closingElement));
  }

  public appendRootState(name: string, defaultValue: unknown) {
    this.parentRef.addReactUseState(name, defaultValue);
  }

  public appendRootCallback(name: string, callback: Function | string, deps?: string[]) {
    this.parentRef.addReactUseCallback(name, callback, deps);
  }

  public appendRootVariable(name: string, initilizer: ts.Expression) {
    this.parentRef.addVariable(name, initilizer);
  }
  public appendJsxStyles(entityId: string, value: Record<string, unknown>) {
    let objExpression = this.helper.createObjectLiteral(value);
    const oldAttr = this.getJsxAttribute(entityId, "style");
    if (oldAttr) {
      const oldExp = oldAttr.initializer;
      if (oldExp && ts.isObjectLiteralExpression(oldExp)) {
        const oldList = [...oldExp.properties];
        objExpression.properties.forEach(each => {
          const idx = oldList.findIndex(i => isIdentiferEqual(i.name, each.name));
          if (idx >= 0) {
            oldList[idx] = each;
          }
        });
        objExpression = ts.updateObjectLiteral(oldExp, oldList);
      }
    }
    return this.appendJsxAttribute(entityId, "style", ts.createJsxExpression(undefined, objExpression));
  }
}

function isIdentiferEqual(source?: any, compare?: any) {
  return source && compare && ts.isIdentifier(source) && ts.isIdentifier(compare) && source.text === compare.text;
}
