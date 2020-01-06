export class AttachProperty<T extends { [prop: string]: any } = {}> {
  constructor(private _options: T) {}

  public get<K extends keyof T>(entityId: K): T[K] {
    return this._options[entityId];
  }
}
