import cheerio from "cheerio";
import { BasicError } from "../errors";
import { Injectable } from "../core/decorators";
import { Path } from "./path/path.contract";
import { Fs } from "./fs/fs.contract";

export interface IHtmlEleMatch {
  match: string | RegExp;
  path: string | ((pathname: string) => string);
}

export interface IBundleOptions {
  path: string;
  outPath?: string;
  checkUnchange?: (match: string | RegExp, value: string) => boolean;
  shouldBundle?: (promises: Promise<any>[]) => boolean;
  scripts?: IHtmlEleMatch[];
  styles?: IHtmlEleMatch[];
}

@Injectable()
export class HtmlBundle {
  constructor(protected path: Path, protected fs: Fs) {}

  public async build(options: IBundleOptions): Promise<void> {
    const {
      path: filepath,
      outPath,
      scripts = [],
      styles = [],
      checkUnchange = () => false,
      shouldBundle = () => true,
    } = options;
    return this.fs
      .readFile(filepath)
      .then(async data => {
        const promises: Promise<any>[] = [];
        const $ = cheerio.load(data);
        $(`script[type="text/javascript"]`).each((_, script) => {
          if (script.attribs?.src) {
            const src = script.attribs.src;
            const target = scripts.find(i => (typeof i.match === "string" ? i.match === src : i.match.test(src)));
            if (target) {
              if (checkUnchange(target.match, src)) {
                return;
              }
              promises.push(
                this.fs.readFile(typeof target.path === "string" ? target.path : target.path(src)).then(data => {
                  $(`script[type="text/javascript"][src="${src}"]`).replaceWith(
                    `<script type="text/javascript">${data.toString()}</script>`,
                  );
                }),
              );
            }
          }
        });
        $(`link[rel="stylesheet"]`).each((_, style) => {
          if (style.attribs?.href) {
            const href = style.attribs.href;
            const target = styles.find(i => (typeof i.match === "string" ? i.match === href : i.match.test(href)));
            if (target) {
              promises.push(
                this.fs.readFile(typeof target.path === "string" ? target.path : target.path(href)).then(data => {
                  $(`link[rel="stylesheet"][href="${href}"]`).replaceWith(`<style>${data.toString()}</style>`);
                }),
              );
            }
          }
        });
        if (!shouldBundle(promises)) {
          return Promise.resolve();
        }
        return Promise.all(promises).then(async () => {
          await this.fs.writeFile(outPath || filepath, $.html());
          return Promise.resolve();
        });
      })
      .catch(error => Promise.reject(new BasicError(error)));
  }
}
