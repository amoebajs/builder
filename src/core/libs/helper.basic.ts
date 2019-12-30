import ts from "typescript";
import { PropertyRef, resolveSyntaxInsert } from "../base";

export class BasicHelper {
  protected getRef(name: string): PropertyRef | null {
    return (<any>this)[name];
  }

  protected resolveRef(name: string): ts.Expression | null {
    const ref = this.getRef(name);
    if (!ref) return null;
    if (ref.type === "literal") {
      return resolveSyntaxInsert(ref.syntaxType, ref.expression);
    }
    return null;
  }
}
