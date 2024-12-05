const EmailChecker = require('./emailChecker');
const HtmlCleaner = require('../utils/htmlCleaner');
const OpenAIProcessor = require('../ai/openaiProcessor');
const DocumentExtractor = require('../utils/documentExtractor');
const config = require('../../config');

class EmailProcessor {
    constructor() {
        this.emailChecker = new EmailChecker();
        this.openaiProcessor = new OpenAIProcessor(config.openaiApiKey, {
            cleanHtml: config.cleanHtml
        });
    }

    async processEmailBatch() {
        try {
            console.log('1. Fetching emails...');
            const emails = await this.emailChecker.fetchEmails();
            
            if (!emails || emails.length === 0) {
                console.log('No emails to process');
                return;
            }
            
            console.log(`Found ${emails.length} emails to process`);

            for (const email of emails) {
                try {
                    console.log('\n-------------------');
                    console.log('Processing email:', email.subject);
                    console.log('From:', email.from?.emailAddress?.address);
                    console.log('Received:', new Date(email.receivedDateTime).toLocaleString());

                    // Process email...
                    const analysis = await this.processEmail(email);
                    
                    // Mark as processed
                    await this.emailChecker.markAsProcessed(email.id);
                    
                    console.log('Analysis Results:', JSON.stringify(analysis, null, 2));
                    console.log('Email marked as processed');
                    console.log('-------------------\n');

                } catch (emailError) {
                    console.error('Error processing individual email:', emailError);
                    continue;
                }
            }
        } catch (error) {
            console.error('Error in email processing batch:', error);
            throw error;
        }
    }

    async processEmail(email) {
        // 2. Clean HTML content if needed
        if (this.cleanHtml && email.body?.contentType?.toLowerCase() === 'html') {
            console.log('2. Cleaning HTML content...');
            email.body.content = HtmlCleaner.clean(email.body.content);
        }

        // 3. Process attachments if any
        if (email.attachments && email.attachments.length > 0) {
            console.log('3. Processing attachments...');
            const attachmentTexts = await this.processAttachments(email.attachments);
            if (attachmentTexts.length > 0) {
                email.body.content += '\n\nAttachment Contents:\n' + attachmentTexts.join('\n---\n');
            }
        }

        // 4. Analyze with OpenAI
        console.log('4. Analyzing with OpenAI...');
        return await this.openaiProcessor.processEmail(email);
    }

    async processAttachments(attachments) {
        const attachmentTexts = [];
        
        for (const attachment of attachments) {
            try {
                // Skip image files
                if (attachment.contentType.toLowerCase().startsWith('image/')) {
                    console.log(`Skipping image attachment: ${attachment.name}`);
                    continue;
                }

                const buffer = Buffer.from(attachment.contentBytes, 'base64');
                
                try {
                    const text = await DocumentExtractor.extractText(buffer, attachment.contentType, attachment.name);
                    if (text && text.trim()) {
                        attachmentTexts.push(`[${attachment.name}]:\n${text}`);
                    }
                } catch (extractError) {
                    console.warn(`Could not extract text from ${attachment.name}:`, extractError.message);
                }
            } catch (error) {
                console.error(`Error processing attachment ${attachment.name}:`, error);
            }
        }

        return attachmentTexts;
    }
}

module.exports = EmailProcessor; 