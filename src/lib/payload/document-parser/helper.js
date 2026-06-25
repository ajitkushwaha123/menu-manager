import { PDFDocument } from "pdf-lib";

export async function splitPdf(buffer) {
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });

    const pages = [];

    for (let i = 0; i < pdf.getPageCount(); i++) {
        const newPdf = await PDFDocument.create();

        const [page] = await newPdf.copyPages(pdf, [i]);

        newPdf.addPage(page);

        const bytes = await newPdf.save();

        pages.push({
            pageNumber: i + 1,
            buffer: Buffer.from(bytes),
        });
    }

    return pages;
}