export type RefType = "directive" | "literal";

export class PropertyRef<T = RefType> {
  public type!: T;
  public syntaxType!: string;
  public expression!: any;

  static UseString(value: string = "") {
    return new PropertyRef()
      .setType("literal")
      .setSyntaxType("string")
      .setExpression(value);
  }

  static UseBool(value: boolean = false) {
    return new PropertyRef()
      .setType("literal")
      .setSyntaxType("boolean")
      .setExpression(value);
  }

  static UseNumber(value: number = 0) {
    return new PropertyRef()
      .setType("literal")
      .setSyntaxType("number")
      .setExpression(value);
  }

  static DefaultNull = new PropertyRef()
    .setType("literal")
    .setSyntaxType("object")
    .setExpression(null);

  public setType(type: T) {
    this.type = type;
    return this;
  }

  public setSyntaxType(syntaxType: string) {
    this.syntaxType = syntaxType;
    return this;
  }

  public setExpression(expression: any) {
    this.expression = expression;
    return this;
  }
}

export type ReactRefType = ("props" | "state") | RefType;

export class ReactVbRef extends PropertyRef<ReactRefType> {
  public type!: ReactRefType;

  static UseProps(value: string) {
    return new ReactVbRef().setType("props").setExpression(value);
  }
}
