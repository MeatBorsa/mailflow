module.exports = {
    POLLING_INTERVAL: 60000, // 1 minute in milliseconds
    SUPPORTED_FILE_TYPES: {
        'application/pdf': '.pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-excel': '.xls'
    },
    MAX_FILE_SIZE: 10 * 1024 * 1024 // 10MB in bytes
}; 