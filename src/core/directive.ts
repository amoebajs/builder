export abstract class BasicDirective {
  protected async onInit(): Promise<void> {
    await this.onAttachStart();
    await this.onAttached();
  }

  protected onAttachStart(): Promise<void> {
    return Promise.resolve();
  }

  protected onAttached(): Promise<void> {
    return Promise.resolve();
  }
}
