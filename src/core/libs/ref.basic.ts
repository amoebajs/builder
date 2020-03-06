import { IInnerEwsEntity } from "../base";
import { classCase } from "../../utils";

export class VariableRef<T extends IInnerEwsEntity = IInnerEwsEntity> {
  private _name!: string;
  private _realName!: string;
  private _host!: T;

  public get name() {
    return this._host?.entityId + "_" + classCase(this._name);
  }

  constructor() {}
}
