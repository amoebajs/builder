import ts  from "typescript";

export interface IProcessConstructor {
  new (context: IProcessorContext): IProcessor;
}

export interface IProcessorContext {
  target: ts.Identifier;
  statements: ts.Statement[];
}

export interface IProcessor {
  getClassTarget(): ts.ClassDeclaration;
  updateClassTarget(value: ts.ClassDeclaration): ts.Statement[];
  getAppendViews(): ts.JsxElement[];
  getAppendMethods(): ts.MethodDeclaration[];
}

export abstract class BasicProcessor implements IProcessor {
  constructor(protected readonly context: IProcessorContext) {}

  public getClassTarget() {
    const { statements, target } = this.context;
    return <ts.ClassDeclaration>statements.find(
      i => ts.isClassDeclaration(i) && i.name?.text === target?.text
    );
  }

  public updateClassTarget(value: ts.ClassDeclaration){
    const { statements } = this.context;
    const oldIndex = statements.findIndex(
      i => ts.isClassDeclaration(i) && i.name?.text === value.name?.text
    );
    const stats = [...statements];
    if(oldIndex>=0) {
      stats[oldIndex] = value;
    }
    return stats;
  }

  public getAppendViews(): ts.JsxElement[] {
    return [];
  }

  public getAppendMethods(): ts.MethodDeclaration[] {
    return [];
  }
}
