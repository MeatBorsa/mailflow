const mammoth = require('mammoth');
const pdfParse = require('pdf-parse');
const XLSX = require('xlsx');
const fs = require('fs');
const os = require('os');
const path = require('path');

class DocumentExtractor {
    static async extractText(buffer, contentType, fileName) {
        try {
            const docType = this.getDocumentType(contentType);
            
            switch(docType) {
                case 'WORD':
                    const result = await mammoth.extractRawText({ buffer });
                    return result.value;
                
                case 'PDF':
                    const pdfData = await pdfParse(buffer);
                    return pdfData.text;
                
                case 'EXCEL':
                    return await this.extractExcelText(buffer, fileName);
                
                default:
                    throw new Error(`Unsupported document type: ${docType}`);
            }
        } catch (error) {
            throw new Error(`Failed to extract text from document: ${error.message}`);
        }
    }

    static async extractExcelText(buffer, fileName) {
        // Create temp file for Excel as XLSX needs file access
        const tempFile = path.join(os.tmpdir(), fileName);
        fs.writeFileSync(tempFile, buffer);
        
        try {
            const workbook = XLSX.readFile(tempFile);
            const sheetNames = workbook.SheetNames;
            let text = '';
            
            // Combine all sheets
            sheetNames.forEach(sheetName => {
                const worksheet = workbook.Sheets[sheetName];
                text += `Sheet: ${sheetName}\n`;
                text += XLSX.utils.sheet_to_txt(worksheet);
                text += '\n\n';
            });
            
            return text;
        } finally {
            // Clean up temp file
            if (fs.existsSync(tempFile)) {
                fs.unlinkSync(tempFile);
            }
        }
    }

    static getDocumentType(contentType) {
        const docTypes = {
            PDF: ['application/pdf'],
            WORD: [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            EXCEL: [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
        };

        if (docTypes.PDF.includes(contentType)) return 'PDF';
        if (docTypes.WORD.includes(contentType)) return 'WORD';
        if (docTypes.EXCEL.includes(contentType)) return 'EXCEL';
        return null;
    }
}

module.exports = DocumentExtractor; 