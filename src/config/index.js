require('dotenv').config();

module.exports = {
    clientId: process.env.AZURE_CLIENT_ID,
    clientSecret: process.env.AZURE_CLIENT_SECRET,
    tenantId: process.env.AZURE_TENANT_ID,
    userEmail: process.env.USER_EMAIL,
    sharedMailbox: process.env.SHARED_MAILBOX,
    openaiApiKey: process.env.OPENAI_API_KEY,
    excludedSenders: (process.env.EXCLUDED_SENDERS || '').split(',').map(email => email.trim().toLowerCase()),
    cleanHtml: process.env.CLEAN_HTML !== 'false',
    processedCategory: process.env.EMAIL_PROCESSED_CATEGORY || 'Processed'
}; 