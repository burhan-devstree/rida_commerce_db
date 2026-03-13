import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// A4 dimensions in points (72 pt per inch)
const A4_WIDTH = 595.28;
const A4_HEIGHT = 841.89;

type GenerateAddressPdfOptions = {
  startDate?: string;
  endDate?: string;
};

export async function generateAddressPdf(
  addresses: string[],
  options: GenerateAddressPdfOptions = {},
): Promise<Blob> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const marginTop = 40;
  const marginBottom = 40;
  const marginLeft = 40;
  const marginRight = 40;
  const gutterX = 16;
  const rowsPerColumn = 10;
  const columns = 2;
  const slotsPerPage = rowsPerColumn * columns; // 20 per page

  const contentWidth = A4_WIDTH - marginLeft - marginRight;
  const columnWidth = (contentWidth - gutterX) / 2;
  const contentHeight = A4_HEIGHT - marginTop - marginBottom;
  const rowHeight = contentHeight / rowsPerColumn;

  const boxPadding = 6;
  const fontSize = 10;
  const lineHeight = fontSize * 1.2;

  const title =
    options.startDate || options.endDate
      ? `Addresses from ${options.startDate ?? "beginning"} to ${
          options.endDate ?? "today"
        }`
      : "Addresses";

  const totalPages = Math.max(1, Math.ceil(addresses.length / slotsPerPage));

  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([A4_WIDTH, A4_HEIGHT]);
    page.setFont(font);

    const titleWidth = font.widthOfTextAtSize(title, 12);
    page.drawText(title, {
      x: (A4_WIDTH - titleWidth) / 2,
      y: A4_HEIGHT - marginTop + 10,
      size: 12,
      color: rgb(0, 0, 0),
    });

    for (let slot = 0; slot < slotsPerPage; slot++) {
      const globalIndex = pageIndex * slotsPerPage + slot;
      const address = addresses[globalIndex] ?? "";

      const columnIndex = slot % columns;
      const rowIndex = Math.floor(slot / columns);

      const x =
        marginLeft +
        columnIndex * (columnWidth + gutterX);
      const yTop = A4_HEIGHT - marginTop - rowIndex * rowHeight;
      const boxWidth = columnWidth;
      const boxHeight = rowHeight;

      page.drawRectangle({
        x,
        y: yTop - boxHeight,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 0.75,
      });

      if (!address) continue;

      const wrappedLines = wrapText(
        address,
        font,
        fontSize,
        boxWidth - boxPadding * 2,
      );
      const maxLines = Math.floor((boxHeight - boxPadding * 2) / lineHeight);
      const linesToDraw = wrappedLines.slice(0, maxLines);

      let textY = yTop - boxPadding - fontSize;
      for (const line of linesToDraw) {
        page.drawText(line, {
          x: x + boxPadding,
          y: textY,
          size: fontSize,
          color: rgb(0, 0, 0),
        });
        textY -= lineHeight;
      }
    }
  }

  const pdfBytes = await pdfDoc.save();
  // Convert to ArrayBuffer explicitly for Blob compatibility
  const uint8 =
    pdfBytes instanceof Uint8Array ? pdfBytes : new Uint8Array(pdfBytes);
  const buffer = new ArrayBuffer(uint8.byteLength);
  const view = new Uint8Array(buffer);
  view.set(uint8);
  return new Blob([buffer], { type: "application/pdf" });
}

function wrapText(
  text: string,
  font: any,
  fontSize: number,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const next = current ? current + " " + word : word;
    const width = font.widthOfTextAtSize(next, fontSize);
    if (width <= maxWidth) {
      current = next;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

