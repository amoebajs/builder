export abstract class BasicDirective {
  protected onInit(): Promise<void> {
    return Promise.resolve();
  }

  protected onEmit(): Promise<void> {
    return Promise.resolve();
  }
}
