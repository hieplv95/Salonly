// Chép font dùng cho logo và trình thiết kế (bộ latin + tiếng Việt) từ @fontsource vào public/fonts,
// sinh CSS để hiển thị và danh sách file để nhúng font vào logo khi tải về.
// Chạy lại khi đổi danh sách font:  node scripts/build-logo-fonts.mjs
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const FONTS = [
  { pkg: "playfair-display", family: "Playfair Display", weights: [400, 600] },
  { pkg: "cormorant-garamond", family: "Cormorant Garamond", weights: [600] },
  { pkg: "great-vibes", family: "Great Vibes", weights: [400] },
  { pkg: "dancing-script", family: "Dancing Script", weights: [700] },
  { pkg: "montserrat", family: "Montserrat", weights: [500, 700] },
  { pkg: "josefin-sans", family: "Josefin Sans", weights: [600] },
  // Thêm cho trình thiết kế tự do (đều có bộ chữ tiếng Việt).
  { pkg: "be-vietnam-pro", family: "Be Vietnam Pro", weights: [500, 700] },
  { pkg: "lora", family: "Lora", weights: [500, 700] },
  { pkg: "quicksand", family: "Quicksand", weights: [500, 700] },
  { pkg: "oswald", family: "Oswald", weights: [500] },
  { pkg: "pacifico", family: "Pacifico", weights: [400] },
  { pkg: "lobster", family: "Lobster", weights: [400] },
  { pkg: "charm", family: "Charm", weights: [700] },
  // Logo mẫu mới: chữ đậm kiểu retro (Fraunces).
  { pkg: "fraunces", family: "Fraunces", weights: [900] },
];
const SUBSETS = ["latin", "vietnamese"];

const root = process.cwd();
const outDir = path.join(root, "public", "fonts");
mkdirSync(outDir, { recursive: true });

const faces = [];
for (const { pkg, family, weights } of FONTS) {
  for (const weight of weights) {
    const css = readFileSync(path.join(root, "node_modules", "@fontsource", pkg, `${weight}.css`), "utf8");
    for (const subset of SUBSETS) {
      const name = `${pkg}-${subset}-${weight}-normal`;
      const block = css.split("@font-face").find((b) => b.includes(`${name}.woff2`));
      const range = block?.match(/unicode-range:\s*([^;]+);/)?.[1].trim();
      if (!range) throw new Error(`Không tìm thấy ${name}`);
      copyFileSync(path.join(root, "node_modules", "@fontsource", pkg, "files", `${name}.woff2`), path.join(outDir, `${name}.woff2`));
      faces.push({ family, weight, url: `/fonts/${name}.woff2`, range });
    }
  }
}

const cssOut = faces
  .map(
    (f) =>
      `@font-face {\n  font-family: "${f.family}";\n  font-weight: ${f.weight};\n  font-style: normal;\n  font-display: swap;\n  src: url("${f.url}") format("woff2");\n  unicode-range: ${f.range};\n}`,
  )
  .join("\n\n");
writeFileSync(path.join(root, "src", "app", "logo-fonts.css"), `/* Sinh bởi scripts/build-logo-fonts.mjs — không sửa tay. */\n${cssOut}\n`);

writeFileSync(
  path.join(root, "src", "lib", "logo-font-files.ts"),
  `// Sinh bởi scripts/build-logo-fonts.mjs — không sửa tay.\n// Dùng để nhúng font vào file logo khi tải về.\nexport const LOGO_FONT_FILES = ${JSON.stringify(faces, null, 2)} as const;\n`,
);
console.log(`Đã chép ${faces.length} file font.`);
