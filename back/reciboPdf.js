const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');

const colors = {
  navy: rgb(0.09, 0.16, 0.29),
  blue: rgb(0.18, 0.34, 0.67),
  teal: rgb(0.24, 0.72, 0.67),
  ink: rgb(0.16, 0.21, 0.3),
  muted: rgb(0.42, 0.48, 0.57),
  border: rgb(0.87, 0.9, 0.94),
  light: rgb(0.96, 0.97, 0.99),
  white: rgb(1, 1, 1),
};

const charges = [
  ['Cuota ordinaria', 'cuota_ordinaria', 'concepto_cuota_ordinaria'],
  ['Cuota extraordinaria', 'cuota_extraordinaria', 'concepto_cuota_extraordinaria'],
  ['Penalización', 'cuota_penalizacion', 'concepto_cuota_penalizacion'],
  ['Fondo de reserva', 'cuota_reserva', 'concepto_cuota_reserva'],
  ['Adeudos anteriores', 'cuota_adeudos', 'concepto_cuota_adeudos'],
];

function formatAmount(value) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
}

function formatDate(value) {
  if (!value) return '';
  const dateValue = String(value);
  const isoDate = dateValue.match(/^(\d{4})-(\d{2})-(\d{2})/);
  const date = isoDate
    ? new Date(Date.UTC(Number(isoDate[1]), Number(isoDate[2]) - 1, Number(isoDate[3])))
    : new Date(value);

  if (Number.isNaN(date.getTime())) return dateValue;
  return new Intl.DateTimeFormat('es-MX', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

function drawFittedText(page, text, x, y, maxWidth, font, fontSize, color, maxLines = 1) {
  const words = String(text || '').split(/\s+/).filter(Boolean);
  const lines = [];
  let line = '';

  words.forEach((word) => {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      let chunk = '';
      [...word].forEach(character => {
        const nextChunk = `${chunk}${character}`;
        if (font.widthOfTextAtSize(nextChunk, fontSize) <= maxWidth) {
          chunk = nextChunk;
        } else {
          if (chunk) lines.push(chunk);
          chunk = character;
        }
      });
      line = chunk;
    }
  });
  if (line) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length) {
    let lastLine = visibleLines[visibleLines.length - 1];
    while (lastLine && font.widthOfTextAtSize(`${lastLine}...`, fontSize) > maxWidth) {
      lastLine = lastLine.slice(0, -1);
    }
    visibleLines[visibleLines.length - 1] = `${lastLine}...`;
  }

  visibleLines.forEach((visibleLine, index) => {
    page.drawText(visibleLine, {
      x,
      y: y - index * (fontSize + 3),
      font,
      size: fontSize,
      color,
    });
  });
}

function drawReceiptPage(page, receipt, fonts, pageNumber, pageCount) {
  const { width, height } = page.getSize();
  const margin = 44;
  const contentWidth = width - margin * 2;
  const right = width - margin;

  page.drawRectangle({
    x: 0,
    y: height - 150,
    width,
    height: 150,
    color: colors.navy,
  });
  page.drawRectangle({
    x: 0,
    y: height - 150,
    width: 8,
    height: 150,
    color: colors.teal,
  });
  page.drawText('BUREAU MANAGER', {
    x: margin,
    y: height - 54,
    font: fonts.bold,
    size: 13,
    color: colors.white,
  });
  page.drawText('RECIBO DE PAGO', {
    x: margin,
    y: height - 92,
    font: fonts.bold,
    size: 25,
    color: colors.white,
  });
  page.drawText('COMPROBANTE DE ADMINISTRACION', {
    x: margin,
    y: height - 116,
    font: fonts.regular,
    size: 9,
    color: rgb(0.78, 0.84, 0.93),
  });

  const numberBoxWidth = 142;
  const numberBoxX = right - numberBoxWidth;
  page.drawRectangle({
    x: numberBoxX,
    y: height - 119,
    width: numberBoxWidth,
    height: 58,
    color: colors.blue,
    borderColor: rgb(0.35, 0.49, 0.77),
    borderWidth: 1,
  });
  page.drawText('RECIBO No.', {
    x: numberBoxX + 12,
    y: height - 81,
    font: fonts.bold,
    size: 8,
    color: rgb(0.82, 0.88, 0.97),
  });
  drawFittedText(
    page,
    receipt.no_recibo || String(receipt.id_recibo || ''),
    numberBoxX + 12,
    height - 103,
    numberBoxWidth - 24,
    fonts.bold,
    14,
    colors.white
  );

  const detailsY = height - 276;
  page.drawRectangle({
    x: margin,
    y: detailsY,
    width: contentWidth,
    height: 104,
    color: colors.light,
    borderColor: colors.border,
    borderWidth: 1,
  });
  page.drawText('DATOS DEL RECIBO', {
    x: margin + 16,
    y: detailsY + 80,
    font: fonts.bold,
    size: 9,
    color: colors.blue,
  });
  page.drawText('RECIBIDO DE', {
    x: margin + 16,
    y: detailsY + 58,
    font: fonts.bold,
    size: 7,
    color: colors.muted,
  });
  drawFittedText(
    page,
    receipt.nombre_completo_inquilino || 'Inquilino',
    margin + 16,
    detailsY + 39,
    contentWidth - 32,
    fonts.bold,
    12,
    colors.ink
  );
  page.drawText('CONCEPTO', {
    x: margin + 16,
    y: detailsY + 17,
    font: fonts.bold,
    size: 7,
    color: colors.muted,
  });
  drawFittedText(
    page,
    receipt.concepto_pago || 'Pago de mantenimiento',
    margin + 94,
    detailsY + 17,
    contentWidth - 205,
    fonts.regular,
    9,
    colors.ink
  );
  page.drawText('FECHA', {
    x: right - 105,
    y: detailsY + 17,
    font: fonts.bold,
    size: 7,
    color: colors.muted,
  });
  drawFittedText(
    page,
    formatDate(receipt.fecha),
    right - 67,
    detailsY + 17,
    59,
    fonts.regular,
    8,
    colors.ink
  );

  const tableTop = detailsY - 23;
  const headerHeight = 27;
  const rowHeight = 44;
  const amountWidth = 104;
  const descriptionWidth = 190;
  const categoryWidth = contentWidth - amountWidth - descriptionWidth;

  page.drawRectangle({
    x: margin,
    y: tableTop - headerHeight,
    width: contentWidth,
    height: headerHeight,
    color: colors.navy,
  });
  page.drawText('CUOTA', {
    x: margin + 12,
    y: tableTop - 18,
    font: fonts.bold,
    size: 8,
    color: colors.white,
  });
  page.drawText('DESCRIPCION', {
    x: margin + categoryWidth + 12,
    y: tableTop - 18,
    font: fonts.bold,
    size: 8,
    color: colors.white,
  });
  page.drawText('IMPORTE', {
    x: right - amountWidth + 12,
    y: tableTop - 18,
    font: fonts.bold,
    size: 8,
    color: colors.white,
  });

  let rowTop = tableTop - headerHeight;
  charges.forEach(([label, amountKey, descriptionKey], index) => {
    const description = receipt[descriptionKey] || '—';
    const amount = Number(receipt[amountKey] || 0);
    const rowBottom = rowTop - rowHeight;
    page.drawRectangle({
      x: margin,
      y: rowBottom,
      width: contentWidth,
      height: rowHeight,
      color: index % 2 === 0 ? colors.white : colors.light,
      borderColor: colors.border,
      borderWidth: 0.5,
    });
    page.drawText(label, {
      x: margin + 12,
      y: rowTop - 18,
      font: fonts.bold,
      size: 8,
      color: colors.ink,
    });
    drawFittedText(
      page,
      description,
      margin + categoryWidth + 12,
      rowTop - 17,
      descriptionWidth - 24,
      fonts.regular,
      8,
      colors.muted,
      2
    );
    page.drawText(formatAmount(amount), {
      x: right - amountWidth + 12,
      y: rowTop - 18,
      font: fonts.regular,
      size: 8,
      color: colors.ink,
    });
    rowTop = rowBottom;
  });

  const totalY = rowTop - 72;
  page.drawRectangle({
    x: right - 240,
    y: totalY,
    width: 240,
    height: 53,
    color: colors.navy,
  });
  page.drawText('TOTAL A PAGAR', {
    x: right - 224,
    y: totalY + 31,
    font: fonts.bold,
    size: 9,
    color: rgb(0.8, 0.86, 0.94),
  });
  page.drawText(formatAmount(receipt.total_pagar), {
    x: right - 224,
    y: totalY + 11,
    font: fonts.bold,
    size: 16,
    color: colors.white,
  });

  const footerY = 35;
  page.drawLine({
    start: { x: margin, y: footerY + 15 },
    end: { x: right, y: footerY + 15 },
    thickness: 0.7,
    color: colors.border,
  });
  page.drawText('Gracias por su pago.', {
    x: margin,
    y: footerY,
    font: fonts.regular,
    size: 8,
    color: colors.muted,
  });
  page.drawText(`${pageNumber} / ${pageCount}`, {
    x: right - 40,
    y: footerY,
    font: fonts.regular,
    size: 8,
    color: colors.muted,
  });
}

async function crearPDF(datos) {
  return crearPDFMultiple([datos]);
}

async function crearPDFMultiple(datosList) {
  const pdfDoc = await PDFDocument.create();
  const fonts = {
    regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
    bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
  };

  datosList.forEach((receipt, index) => {
    const page = pdfDoc.addPage([595.28, 841.89]);
    drawReceiptPage(page, receipt, fonts, index + 1, datosList.length);
  });

  return pdfDoc.save();
}

module.exports = { crearPDF, crearPDFMultiple };
