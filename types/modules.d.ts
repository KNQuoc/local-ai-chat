declare module 'pdf-parse' {
    interface PDFInfo {
        PDFFormatVersion: string;
        IsAcroFormPresent: boolean;
        IsXFAPresent: boolean;
        Title?: string;
        Author?: string;
        Subject?: string;
        Keywords?: string;
        Creator?: string;
        Producer?: string;
        CreationDate?: string;
        ModDate?: string;
    }

    interface PDFData {
        numpages: number;
        numrender: number;
        info: PDFInfo;
        metadata: any;
        text: string;
        version: string;
    }

    interface PDFParseOptions {
        max?: number;
        version?: string;
    }

    function pdfParse(buffer: Buffer, options?: PDFParseOptions): Promise<PDFData>;
    export = pdfParse;
}

declare module 'mammoth' {
    interface ExtractRawTextResult {
        value: string;
        messages: any[];
    }

    interface ExtractRawTextOptions {
        buffer: Buffer;
    }

    export function extractRawText(options: ExtractRawTextOptions): Promise<ExtractRawTextResult>;
} 