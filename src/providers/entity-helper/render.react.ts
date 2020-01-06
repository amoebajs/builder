import ts from "typescript";
import { NotFoundError } from "../../errors";
import { ReactComponent } from "..";
import { Injectable } from "../../core";
import { InjectScope } from "@bonbons/di";

@Injectable(InjectScope.New)
export class ReactRender {
  private parentRef!: ReactComponent;

  public getElementById(entityId: string) {
    const map = this.parentRef["__elementMap"];
    return map.get(entityId) || null;
  }

  public setElementById(entityId: string, element: any) {
    const map = this.parentRef["__elementMap"];
    map.set(entityId, element);
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
}
