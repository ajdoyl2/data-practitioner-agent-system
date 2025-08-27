import fs from "fs/promises";
import $4S4dR$path1__default from "path";
import { $ as $3fd82c6737eb24ad$exports } from "../../../../chunks/index4.js";
import { e as error } from "../../../../chunks/index.js";
const prerender = true;
async function GET() {
  const srcPath = $4S4dR$path1__default.join(process.cwd(), "src", "pages");
  const pagesPath = $4S4dR$path1__default.join(process.cwd(), "pages");
  const srcExists = await fs.stat(srcPath).then(() => true).catch(() => false);
  const pagesExists = await fs.stat(pagesPath).then(() => true).catch(() => false);
  if (!srcExists && !pagesExists)
    throw error(500, "./src/pages and ./pages both missing.");
  const pagesDir = (srcExists ? srcPath : pagesPath).split("pages")[0] + "pages";
  async function getDirPages(dirPath) {
    const dirContent = await fs.readdir(dirPath, { withFileTypes: true });
    const output = {};
    if (dirContent.some((d) => d.name === "+page.md")) {
      let route = dirPath.replace(pagesDir, "");
      const pageFilepath = $4S4dR$path1__default.join(dirPath, "+page.md");
      if (!route.startsWith("/"))
        route = `/${route}`;
      const fileContent = await fs.readFile(pageFilepath, "utf-8");
      output.__page = {
        path: route,
        // Object matching the frontmatter on the page; may or may not exist
        frontMatter: $3fd82c6737eb24ad$exports.parseFrontmatter(fileContent),
        // Retrive all queries from the page, this will always be an array
        queries: $3fd82c6737eb24ad$exports.extractQueries($3fd82c6737eb24ad$exports.injectPartials(fileContent), pageFilepath),
        content: fileContent
      };
    }
    for (const dirItem of dirContent) {
      if (dirItem.isDirectory()) {
        const result = await getDirPages($4S4dR$path1__default.join(dirPath, dirItem.name));
        if (Object.keys(result).length)
          output[dirItem.name] = result;
      }
    }
    return output;
  }
  const manifest = await getDirPages(pagesDir);
  return new Response(JSON.stringify(manifest));
}
export {
  GET,
  prerender
};
