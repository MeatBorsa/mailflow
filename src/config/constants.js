module.exports = {
    POLLING_INTERVAL: 5 * 60 * 1000, // 5 minutes
    MAX_EMAILS_PER_BATCH: 1,
    SUPPORTED_FILE_TYPES: {
        IMAGE: [
            'image/jpeg',
            'image/png',
            'image/gif',
            'image/webp',
            'image/bmp'
        ],
        TEXT: [
            'text/plain',
            'text/csv',
            'text/html',
            'application/json',
            'application/xml'
        ],
        DOCUMENT: {
            PDF: ['application/pdf'],
            WORD: [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ],
            EXCEL: [
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            ]
        }
    },
}; 