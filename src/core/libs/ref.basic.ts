import { IInnerEwsEntity } from "../base";
import { connectReferenceName } from "../../utils";

export class VariableRef<T extends IInnerEwsEntity = IInnerEwsEntity> {
  private _name!: string;
  private _realName!: string;
  private _host!: T;

  public get name() {
    return connectReferenceName(this._host?.entityId!, this._name);
  }

  public toString() {
    return this.name;
  }

  constructor() {}
}
