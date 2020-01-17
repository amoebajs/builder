import ts from "typescript";
import prettier from "prettier";
import { ClassGenerator, FunctionGenerator, ImportGenerator } from "../src/core/typescript/index";

const printer = ts.createPrinter();

let sourceFile = ts.createSourceFile("a.tsx", "", ts.ScriptTarget.ES2017);

const tsImport = new ImportGenerator()
  .setDefaultName("React")
  .setModulePath("react")
  .emit();

const fsImport = new ImportGenerator()
  .setNamespaceName("fs")
  .setModulePath("fs-extra")
  .emit();

const childProcessImport = new ImportGenerator()
  .addNamedBinding("IOnDestroy")
  .addNamedBinding("IOnInit", "OnInit")
  .setModulePath("custom_path")
  .emit();

const func = new FunctionGenerator()
  .setName("DemoFn")
  .setExport("default")
  .pushParam("p0")
  .pushParam({ name: "p1", type: "string[]", initValue: "[]" })
  .pushParam({ name: "p2", type: "number", initValue: "25258" })
  .pushParam({ name: "p2_01", type: "string", initValue: '"sdfsdfsd"' })
  .pushParam({
    name: "p3",
    type: ["boolean", "undefined"],
    initValue: types => (types.includes("undefined") ? ts.createIdentifier("void 0") : ts.createTrue()),
  })
  .pushParam({ name: "p4", type: "boolean | undefined", initValue: "true" })
  .pushParam({ name: "p5", type: "Date", nullable: true })
  .pushParam({ initValue: "{}", destruct: ["a", "b", "c"] })
  .setBody('console.log("fuck off");\nreturn;')
  // .setBody(params => [
  //   ts.createReturn(ts.createPropertyAccess(ts.createIdentifier(params[2].name), ts.createIdentifier("toString()"))),
  // ])
  .pushTransformerBeforeEmit(node => {
    console.log("is function : " + ts.isFunctionDeclaration(node));
    return node;
  })
  .emit();

const classF = new ClassGenerator()
  .setName("Woshinidie")
  .setExport("named")
  .addField({ name: "aaa", type: "number", initValue: "123456" })
  .addField({ name: "bbb", type: "string" })
  .addMethod({
    name: "constructor",
    params: [{ name: "private ccc", type: "boolean", initValue: "false" }],
    body: 'this.bbb = "sdfsdf";\nconsole.log(this.ccc);',
  })
  .addMethod({
    name: "funcAAA",
    params: [
      { name: "p1", type: "string[]", initValue: "[]" },
      { name: "p2", type: "number", initValue: "25258" },
    ],
    returnType: ["any"],
    body: 'console.log("fuck off");\nreturn;',
  })
  .setExtend("React.Component")
  .addImplement("OnInit")
  .emit();

sourceFile = ts.updateSourceFileNode(
  sourceFile,
  [tsImport, fsImport, childProcessImport, func, classF],
  sourceFile.isDeclarationFile,
  sourceFile.referencedFiles,
  sourceFile.typeReferenceDirectives,
  sourceFile.hasNoDefaultLib,
  sourceFile.libReferenceDirectives,
);

const result = printer.printNode(ts.EmitHint.SourceFile, sourceFile, sourceFile);

console.log(prettier.format(result, { parser: "typescript", printWidth: 100 }));
