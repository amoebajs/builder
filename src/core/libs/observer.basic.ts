import { IInnerEwsEntity } from "../base";
import { connectReferenceName, is } from "../../utils";

export class Observer<T extends IInnerEwsEntity = IInnerEwsEntity> {
  private _name!: string;
  private _realName!: string;
  private _host!: T;

  public get name() {
    return connectReferenceName(this._host?.entityId!, this._name);
  }

  public get default() {
    if (is.nullOrUndefined(this._default)) return void 0;
    if (typeof this._default === "object" || is.array(this._default)) return JSON.stringify(this._default);
    if (typeof this._default === "string") return `"${this._default}"`;
    return this._default;
  }

  public static Create<T>(value: T) {
    return new Observer(value);
  }

  constructor(private _default?: unknown) {}
}
