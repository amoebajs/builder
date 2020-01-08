export class PropAttach<T extends any = unknown> {
  private _options: Map<string, T> = new Map();

  constructor(private _default?: T) {}

  public get(entityId: string): T | null {
    return this._options.get(entityId) ?? this._default ?? null;
  }
}
