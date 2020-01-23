import ts from "typescript";
import { NotFoundError } from "#errors";
import { Injectable, JsxElementGenerator } from "#core";
import { InjectScope } from "@bonbons/di";
import { ReactHelper, updateJsxElementAttr } from "./helper.react";
import { ReactComponent } from "../entities";

@Injectable(InjectScope.New)
export class ReactRender {
  private parentRef!: ReactComponent;

  constructor(private helper: ReactHelper) {}

  public getElementById(entityId: string) {
    const map = this.parentRef["renderChildMap"];
    return map.get(entityId) || null;
  }

  public setElementById(entityId: string, element: any) {
    const map = this.parentRef["renderChildMap"];
    map.set(entityId, element);
  }

  public appendJsxAttribute(
    entityId: string | JsxElementGenerator,
    name: string,
    value: ts.JsxExpression | ts.StringLiteral,
  ) {
    const target = typeof entityId === "string" ? this.getElementById(entityId) : entityId;
    if (!target) {
      throw new NotFoundError(`target entity [${entityId}] is not found`);
    }
    this.helper.updateJsxElementAttr(target, name, value);
  }

  public appendRootState(name: string, defaultValue: unknown) {
    this.parentRef["addUseState"](name, defaultValue);
  }

  public appendRootCallback(name: string, callback: Function | string, deps?: string[]) {
    this.parentRef["addUseCallback"](name, callback, deps);
  }

  public appendRootRef(name: string, defaultValue: unknown) {
    this.parentRef["addUseRef"](name, defaultValue);
  }

  public setRootState(name: string, value: unknown) {
    this.parentRef["setState"](<any>name, value);
  }

  public getRootState(name: string) {
    this.parentRef["getState"](<any>name);
  }

  public appendRootVariable(name: string, initilizer?: ts.Expression, type: "push" | "unshift" = "push") {
    this.parentRef[type === "push" ? "addPushedVariable" : "addUnshiftVariable"](name, initilizer);
  }

  public appendJsxStyles(entityId: string | JsxElementGenerator, value: Record<string, unknown>) {
    const gen = typeof entityId === "string" ? this.getElementById(entityId) : entityId;
    if (!gen) {
      throw new NotFoundError(`target entity [${entityId}] is not found`);
    }
    gen.pushTransformerBeforeEmit(element => updateJsxElementStyle(element, this.helper.createObjectLiteral(value)));
  }
}

export function updateJsxElementStyle(
  element: ts.JsxElement | ts.JsxSelfClosingElement,
  obj: ts.ObjectLiteralExpression,
) {
  const openEle = ts.isJsxSelfClosingElement(element) ? element : element.openingElement;
  const target = openEle.attributes.properties.filter(
    i => i.name && ts.isIdentifier(i.name) && i.name.text === "style",
  );
  const oldAttr = target[0] && ts.isJsxAttribute(target[0]) ? target[0] : null;
  if (oldAttr) {
    const oldExp = oldAttr.initializer;
    if (oldExp && ts.isObjectLiteralExpression(oldExp)) {
      const oldList = [...oldExp.properties];
      obj.properties.forEach(each => {
        const idx = oldList.findIndex(i => isIdentiferEqual(i.name, each.name));
        if (idx >= 0) {
          oldList[idx] = each;
        }
      });
      obj = ts.updateObjectLiteral(oldExp, oldList);
    }
  }
  return updateJsxElementAttr(element, "style", ts.createJsxExpression(undefined, obj));
}

function isIdentiferEqual(source?: any, compare?: any) {
  return source && compare && ts.isIdentifier(source) && ts.isIdentifier(compare) && source.text === compare.text;
}
