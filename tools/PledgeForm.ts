// Generates downloads/HoopAThon-Pledge-Form.pdf: a fillable, printable pledge form
// matching the original paper layout (9 columns, 13 donor rows).
// Run: bun tools/PledgeForm.ts
import { PDFDocument, StandardFonts, rgb, TextAlignment, type PDFFont, type PDFPage } from "pdf-lib";

const OUT = new URL("../downloads/HoopAThon-Pledge-Form.pdf", import.meta.url).pathname;

const W = 792; // US Letter, landscape
const H = 612;
const M = 30;
const INK = rgb(0.078, 0.129, 0.239); // site navy #14213d
const GOLD = rgb(0.949, 0.663, 0.122); // site gold #f2a91f
const GRID = rgb(0.62, 0.64, 0.68);
const STRIPE = rgb(0.94, 0.945, 0.955);
const MUTED = rgb(0.35, 0.36, 0.38);

const ROWS = 13;
// Header lines and relative widths, in the original's column order.
const COLUMNS: Array<{ key: string; lines: string[]; w: number; align?: TextAlignment }> = [
  { key: "name", lines: ["Donor's name"], w: 278 },
  { key: "contact", lines: ["Donor's phone # or email", "(optional)"], w: 300 },
  { key: "address", lines: ["Donor mailing address"], w: 214 },
  { key: "receipt", lines: ["Tax", "receipt", "Y/N"], w: 96, align: TextAlignment.Center },
  { key: "lump", lines: ["Lump sum /", "max donation", "OR"], w: 140, align: TextAlignment.Right },
  { key: "perBasket", lines: ["Pledge per", "basket or", "point"], w: 116, align: TextAlignment.Right },
  { key: "shots", lines: ["# of foul shots", "made in", "1 minute ="], w: 136, align: TextAlignment.Center },
  { key: "donation", lines: ["Donation", "amount"], w: 135, align: TextAlignment.Right },
  { key: "collected", lines: ["Amount", "collected"], w: 135, align: TextAlignment.Right },
];

function drawBall(page: PDFPage, cx: number, cy: number, r: number) {
  page.drawCircle({ x: cx, y: cy, size: r, color: rgb(0.91, 0.47, 0.165), borderColor: INK, borderWidth: 1.4 });
  const seam = { color: INK, thickness: 1.2 };
  page.drawLine({ start: { x: cx - r, y: cy }, end: { x: cx + r, y: cy }, ...seam });
  page.drawLine({ start: { x: cx, y: cy - r }, end: { x: cx, y: cy + r }, ...seam });
  for (const s of [-1, 1]) {
    page.drawSvgPath(`M ${s * r * 0.62} ${-r * 0.78} Q ${s * r * 0.15} 0 ${s * r * 0.62} ${r * 0.78}`, {
      x: cx,
      y: cy,
      borderColor: INK,
      borderWidth: 1.2,
    });
  }
}

function text(page: PDFPage, s: string, x: number, y: number, font: PDFFont, size: number, color = INK) {
  page.drawText(s, { x, y, font, size, color });
}

const doc = await PDFDocument.create();
doc.setTitle("Rotary Hoop-A-Thon Pledge Form");
doc.setSubject("Fillable pledge form for Hoop-A-Thon participants");
doc.setCreator("pghoopathon.com");

const page = doc.addPage([W, H]);
const bold = await doc.embedFont(StandardFonts.HelveticaBold);
const regular = await doc.embedFont(StandardFonts.Helvetica);
const form = doc.getForm();

// Title block
const titleY = H - M - 30;
drawBall(page, M + 18, titleY + 10, 18);
text(page, "Rotary Hoop-A-Thon", M + 46, titleY + 4, bold, 26);
text(page, "for Local Communities", M + 47, titleY - 14, regular, 12, MUTED);
page.drawRectangle({ x: M, y: titleY - 26, width: W - 2 * M, height: 3, color: GOLD });

// Club / fundraiser name
const nameY = titleY - 52;
text(page, "Club / Fundraiser's name:", M, nameY + 5, bold, 11);
const nameLabelW = bold.widthOfTextAtSize("Club / Fundraiser's name:", 11);
const fundraiser = form.createTextField("fundraiserName");
fundraiser.addToPage(page, {
  x: M + nameLabelW + 8,
  y: nameY,
  width: W - 2 * M - nameLabelW - 8,
  height: 18,
  borderWidth: 0,
  backgroundColor: rgb(1, 1, 1),
  font: regular,
});
fundraiser.setFontSize(11);
page.drawLine({ start: { x: M + nameLabelW + 8, y: nameY }, end: { x: W - M, y: nameY }, color: INK, thickness: 0.8 });

// Table
const tableW = W - 2 * M;
const scale = tableW / COLUMNS.reduce((a, c) => a + c.w, 0);
const colX: number[] = [];
let acc = M;
for (const c of COLUMNS) {
  colX.push(acc);
  acc += c.w * scale;
}
colX.push(W - M);

const headTop = nameY - 14;
const headH = 46;
const totalH = 34;
const rowH = (headTop - headH - totalH - M) / ROWS;
const bodyTop = headTop - headH;

page.drawRectangle({ x: M, y: bodyTop, width: tableW, height: headH, color: INK });
COLUMNS.forEach((c, i) => {
  const x0 = colX[i] + 5;
  c.lines.forEach((line, j) => {
    const f = line === "OR" ? bold : regular;
    text(page, line, x0, headTop - 13 - j * 10.5, f, 8.6, line === "OR" ? GOLD : rgb(1, 1, 1));
  });
});

for (let r = 0; r < ROWS; r++) {
  const y = bodyTop - (r + 1) * rowH;
  if (r % 2 === 1) page.drawRectangle({ x: M, y, width: tableW, height: rowH, color: STRIPE });
  COLUMNS.forEach((c, i) => {
    const field = form.createTextField(`row${r + 1}.${c.key}`);
    field.addToPage(page, {
      x: colX[i] + 1.5,
      y: y + 1.5,
      width: colX[i + 1] - colX[i] - 3,
      height: rowH - 3,
      borderWidth: 0,
      backgroundColor: r % 2 === 1 ? STRIPE : rgb(1, 1, 1),
      font: regular,
    });
    field.setFontSize(9);
    if (c.align !== undefined) field.setAlignment(c.align);
    if (c.key === "receipt") field.setMaxLength(3);
  });
}

// Grid lines
const bodyBottom = bodyTop - ROWS * rowH;
for (let r = 0; r <= ROWS; r++) {
  const y = bodyTop - r * rowH;
  page.drawLine({ start: { x: M, y }, end: { x: W - M, y }, color: GRID, thickness: 0.5 });
}
for (const x of colX) {
  page.drawLine({ start: { x, y: bodyBottom }, end: { x, y: headTop }, color: GRID, thickness: 0.5 });
}
page.drawRectangle({ x: M, y: bodyBottom, width: tableW, height: headTop - bodyBottom, borderColor: INK, borderWidth: 1 });

// Total
const totalY = bodyBottom - 24;
const totalX = colX[COLUMNS.length - 2];
text(page, "Total amount collected:", totalX - bold.widthOfTextAtSize("Total amount collected:", 11) - 8, totalY + 5, bold, 11);
const total = form.createTextField("totalCollected");
total.addToPage(page, { x: totalX, y: totalY, width: W - M - totalX, height: 18, borderWidth: 0, font: regular });
total.setFontSize(11);
total.setAlignment(TextAlignment.Right);
page.drawLine({ start: { x: totalX, y: totalY }, end: { x: W - M, y: totalY }, color: INK, thickness: 0.8 });
text(page, "pghoopathon.com", M, totalY + 5, regular, 8.5, MUTED);

form.updateFieldAppearances(regular);
await Bun.write(OUT, await doc.save());
console.log(`wrote ${OUT} (${form.getFields().length} fields)`);
