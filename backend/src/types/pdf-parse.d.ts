declare module 'pdf-parse' {
    interface PDFInfo {
      Title?: string;
      Author?: string;
      Subject?: string;
      Creator?: string;
      Producer?: string;
      CreationDate?: string;
      ModDate?: string;
      [key: string]: any;
    }
  
    interface PDFData {
      numpages: number;
      numrender: number;
      info: PDFInfo;
      metadata: any;
      text: string;
      version: string;
    }
  
    interface PDFOptions {
      pagerender?: (pageData: any) => Promise<string>;
      max?: number;
    }
  
    function pdf(dataBuffer: Buffer, options?: PDFOptions): Promise<PDFData>;
    
    export = pdf;
  }