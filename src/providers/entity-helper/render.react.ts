import ts from "typescript";
import { NotFoundError } from "#errors";
import { Injectable } from "#core";
import { InjectScope } from "@bonbons/di";
import { ReactHelper, updateJsxElementAttr } from "./helper.react";
import { ReactComponent } from "../entities";

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

  public appendJsxAttribute(entityId: string, name: string, value: ts.JsxExpression | ts.StringLiteral) {
    const target = this.getElementById(entityId);
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

  public appendRootVariable(name: string, initilizer?: ts.Expression, type: "push" | "unshift" = "push") {
    this.parentRef[type === "push" ? "addPushedvariable" : "addUnshiftvariable"](name, initilizer);
  }

  public appendJsxStyles(entityId: string, value: Record<string, unknown>) {
    let objExpression = this.helper.createObjectLiteral(value);
    const gen = this.getElementById(entityId);
    if (!gen) {
      throw new NotFoundError(`target entity [${entityId}] is not found`);
    }
    gen.pushTransformerBeforeEmit(element => {
      const openEle = ts.isJsxSelfClosingElement(element) ? element : element.openingElement;
      const target = openEle.attributes.properties.filter(
        i => i.name && ts.isIdentifier(i.name) && i.name.text === "style",
      );
      const oldAttr = target[0] && ts.isJsxAttribute(target[0]) ? target[0] : null;
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
      return updateJsxElementAttr(element, "style", ts.createJsxExpression(undefined, objExpression));
    });
  }
}

function isIdentiferEqual(source?: any, compare?: any) {
  return source && compare && ts.isIdentifier(source) && ts.isIdentifier(compare) && source.text === compare.text;
}
