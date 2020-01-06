export class PropAttach<T extends any = unknown> {
  private _options: { [id: string]: T } = {};

  constructor(private _default?: T) {}

  public get(entityId: string): T | null {
    return this._options[entityId] || null;
  }
}
