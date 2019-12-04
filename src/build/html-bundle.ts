import cheerio from "cheerio";
import * as fs from "fs-extra";

export interface IHtmlEleMatch {
  match: string | RegExp;
  path: string;
}

export async function buildHtmlBundle(
  path: string,
  scripts: IHtmlEleMatch[] = [],
  styles: IHtmlEleMatch[] = []
) {
  return fs
    .readFile(path)
    .then(async data => {
      const promises: Promise<any>[] = [];
      const $ = cheerio.load(data);
      $(`script[type="text/javascript"]`).each((_, script) => {
        if (script.attribs?.src) {
          const src = script.attribs.src;
          const target = scripts.find(i =>
            typeof i.match === "string" ? i.match === src : i.match.test(src)
          );
          if (target) {
            promises.push(
              fs.readFile(target.path).then(data => {
                $(`script[type="text/javascript"][src="${src}"]`).replaceWith(
                  `<script type="text/javascript">${data.toString()}</script>`
                );
              })
            );
          }
        }
      });
      $(`link[rel="stylesheet"]`).each((_, style) => {
        if (style.attribs?.href) {
          const href = style.attribs.href;
          const target = styles.find(i =>
            typeof i.match === "string" ? i.match === href : i.match.test(href)
          );
          if (target) {
            promises.push(
              fs.readFile(target.path).then(data => {
                $(`link[rel="stylesheet"][href="${href}"]`).replaceWith(
                  `<style>${data.toString()}</style>`
                );
              })
            );
          }
        }
      });
      return Promise.all(promises).then(() => fs.writeFile(path, $.html()));
    })
    .catch(error => Promise.reject(error));
}
