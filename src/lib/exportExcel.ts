const escapeXml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

type ExcelValue = string | number | boolean | null | undefined;

type ExcelRow = Record<string, ExcelValue>;

export type GroupedProductVariant = {
  variant_value?: string | null;
  color_name?: string | null;
  stock?: number | null;
  is_active?: boolean | null;
};

export type GroupedProductExport = {
  sku_code?: string | null;
  name: string;
  brand?: string | null;
  category?: string | null;
  stock?: number | null;
  price?: number | null;
  is_active?: boolean | null;
  has_variants?: boolean | null;
  product_variants?: GroupedProductVariant[] | null;
};

const excelCell = (
  value: ExcelValue,
  options?: { styleId?: string; index?: number },
) => {
  const isNumber = typeof value === "number" && Number.isFinite(value);
  const type = isNumber ? "Number" : "String";
  const safeValue = isNumber ? value : escapeXml(value ?? "");
  const style = options?.styleId ? ` ss:StyleID="${options.styleId}"` : "";
  const index = options?.index ? ` ss:Index="${options.index}"` : "";
  return `<Cell${index}${style}><Data ss:Type="${type}">${safeValue}</Data></Cell>`;
};

const safeFileName = (name: string) =>
  name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9-_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/(^-|-$)/g, "")
    .toLowerCase();

const downloadExcelXml = (xml: string, fileName: string) => {
  const blob = new Blob(["\ufeff", xml], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(fileName) || "exportacion"}.xls`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const exportRowsToExcel = (
  rows: ExcelRow[],
  fileName: string,
  sheetName: string,
) => {
  if (!rows.length) {
    alert("No hay información para exportar.");
    return;
  }

  const headers = Object.keys(rows[0]);
  const headerXml = headers
    .map(
      (header) =>
        `<Cell ss:StyleID="Header"><Data ss:Type="String">${escapeXml(header)}</Data></Cell>`,
    )
    .join("");

  const rowsXml = rows
    .map(
      (row) =>
        `<Row>${headers.map((header) => excelCell(row[header])).join("")}</Row>`,
    )
    .join("");

  const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Center"/>
   <Font ss:FontName="Calibri" ss:Size="11"/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:FontName="Calibri" ss:Size="11" ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#E3262E" ss:Pattern="Solid"/>
   <Alignment ss:Vertical="Center"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXml(sheetName.slice(0, 31) || "Datos")}">
  <Table>
   <Row>${headerXml}</Row>
   ${rowsXml}
  </Table>
  <WorksheetOptions xmlns="urn:schemas-microsoft-com:office:excel">
   <FreezePanes/>
   <FrozenNoSplit/>
   <SplitHorizontal>1</SplitHorizontal>
   <TopRowBottomPane>1</TopRowBottomPane>
   <ActivePane>2</ActivePane>
  </WorksheetOptions>
 </Worksheet>
</Workbook>`;

  downloadExcelXml(xml, fileName);
};

/**
 * Crea un ZIP sin compresión (válido para archivos .xlsx) sin dependencias externas.
 */
const crc32 = (data: Uint8Array) => {
  let crc = 0xffffffff;
  for (const byte of data) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

const u16 = (value: number) => new Uint8Array([value & 0xff, (value >>> 8) & 0xff]);
const u32 = (value: number) => new Uint8Array([
  value & 0xff,
  (value >>> 8) & 0xff,
  (value >>> 16) & 0xff,
  (value >>> 24) & 0xff,
]);

const concatBytes = (parts: Uint8Array[]) => {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
};

const createZip = (files: Array<{ name: string; content: string }>) => {
  const encoder = new TextEncoder();
  const localParts: Uint8Array[] = [];
  const centralParts: Uint8Array[] = [];
  let offset = 0;

  files.forEach(({ name, content }) => {
    const nameBytes = encoder.encode(name);
    const data = encoder.encode(content);
    const crc = crc32(data);
    const local = concatBytes([
      u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
      nameBytes, data,
    ]);
    localParts.push(local);

    centralParts.push(concatBytes([
      u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
      u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length),
      u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), nameBytes,
    ]));
    offset += local.length;
  });

  const central = concatBytes(centralParts);
  const end = concatBytes([
    u32(0x06054b50), u16(0), u16(0), u16(files.length), u16(files.length),
    u32(central.length), u32(offset), u16(0),
  ]);
  return concatBytes([...localParts, central, end]);
};

const downloadXlsx = (bytes: Uint8Array, fileName: string) => {
  const blob = new Blob([bytes], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${safeFileName(fileName) || "exportacion"}.xlsx`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

const columnLetter = (index: number) => {
  let n = index;
  let result = "";
  while (n > 0) {
    n -= 1;
    result = String.fromCharCode(65 + (n % 26)) + result;
    n = Math.floor(n / 26);
  }
  return result;
};

const xlsxCell = (value: ExcelValue, row: number, col: number, style = 0) => {
  const ref = `${columnLetter(col)}${row}`;
  if (typeof value === "number" && Number.isFinite(value)) {
    return `<c r="${ref}"${style ? ` s="${style}"` : ""}><v>${value}</v></c>`;
  }
  return `<c r="${ref}" t="inlineStr"${style ? ` s="${style}"` : ""}><is><t>${escapeXml(value ?? "")}</t></is></c>`;
};

/**
 * Exportación real .xlsx con jerarquía Producto -> Variantes.
 * Las variantes salen contraídas y Excel muestra los botones +/- del esquema.
 */
export const exportGroupedProductsToExcel = (
  products: GroupedProductExport[],
  fileName: string,
  sheetName = "Productos",
) => {
  if (!products.length) {
    alert("No hay información para exportar.");
    return;
  }

  const headers = ["Código SKU", "Tipo", "Variante", "Color", "Nombre", "Marca", "Categoría", "Stock", "Precio", "Activo"];
  let rowNumber = 1;
  const rows: string[] = [];
  rows.push(`<row r="1">${headers.map((h, i) => xlsxCell(h, 1, i + 1, 1)).join("")}</row>`);

  products.forEach((product) => {
    const variants = product.has_variants && product.product_variants?.length ? product.product_variants : [];
    rowNumber += 1;
    const parentValues: ExcelValue[] = [
      product.sku_code || "",
      variants.length ? `Producto (${variants.length} variantes)` : "Producto",
      variants.length ? `${variants.length} variantes` : "Sin variantes",
      "", product.name, product.brand || "", product.category || "",
      Number(product.stock || 0), Number(product.price || 0), product.is_active ? "Sí" : "No",
    ];
    rows.push(`<row r="${rowNumber}" customFormat="1" s="2">${parentValues.map((v, i) => xlsxCell(v, rowNumber, i + 1, i === 8 ? 3 : 2)).join("")}</row>`);

    variants.forEach((variant) => {
      rowNumber += 1;
      const values: ExcelValue[] = [
        "", "↳ Variante", variant.variant_value || "", variant.color_name || "", product.name,
        "", "", Number(variant.stock || 0), Number(product.price || 0), variant.is_active ? "Sí" : "No",
      ];
      rows.push(`<row r="${rowNumber}" hidden="1" outlineLevel="1" customFormat="1" s="4">${values.map((v, i) => xlsxCell(v, rowNumber, i + 1, i === 8 ? 5 : 4)).join("")}</row>`);
    });
  });

  const safeSheet = escapeXml(sheetName.slice(0, 31) || "Productos");
  const sheetXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <sheetPr><outlinePr summaryBelow="0" summaryRight="1" showOutlineSymbols="1"/></sheetPr>
 <sheetViews><sheetView workbookViewId="0" showOutlineSymbols="1"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>
 <sheetFormatPr defaultRowHeight="15" outlineLevelRow="1"/>
 <cols><col min="1" max="1" width="14" customWidth="1"/><col min="2" max="2" width="22" customWidth="1"/><col min="3" max="4" width="16" customWidth="1"/><col min="5" max="5" width="28" customWidth="1"/><col min="6" max="7" width="16" customWidth="1"/><col min="8" max="10" width="12" customWidth="1"/></cols>
 <sheetData>${rows.join("")}</sheetData>
 <autoFilter ref="A1:J${rowNumber}"/>
</worksheet>`;

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
 <fonts count="4"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font><font><color rgb="FF595959"/><sz val="10"/><name val="Calibri"/></font></fonts>
 <fills count="4"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE3262E"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFF2F2F2"/><bgColor indexed="64"/></patternFill></fill></fills>
 <borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
 <numFmts count="1"><numFmt numFmtId="164" formatCode='&quot;S/&quot;#,##0.00'/></numFmts>
 <cellXfs count="6"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="2" fillId="3" borderId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="2" fillId="3" borderId="0" applyNumberFormat="1" applyFont="1" applyFill="1"/><xf numFmtId="0" fontId="3" fillId="0" borderId="0" applyFont="1"/><xf numFmtId="164" fontId="3" fillId="0" borderId="0" applyNumberFormat="1" applyFont="1"/></cellXfs>
</styleSheet>`;

  const files = [
    { name: "[Content_Types].xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>` },
    { name: "_rels/.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>` },
    { name: "xl/workbook.xml", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${safeSheet}" sheetId="1" r:id="rId1"/></sheets></workbook>` },
    { name: "xl/_rels/workbook.xml.rels", content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>` },
    { name: "xl/worksheets/sheet1.xml", content: sheetXml },
    { name: "xl/styles.xml", content: stylesXml },
  ];

  downloadXlsx(createZip(files), fileName);
};
