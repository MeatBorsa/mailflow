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
            const emails = await this.emailChecker.fetchEmails();
            
            if (!emails || emails.length === 0) {
                const emptyResult = {
                    total_emails: 0,
                    trading_emails: 0,
                    meat_related_emails: 0,
                    analyses: []
                };
                console.log('BATCH PROCESSING RESULT:', JSON.stringify(emptyResult, null, 2));
                return emptyResult;
            }

            const analyses = [];
            let tradingEmailCount = 0;
            let meatRelatedCount = 0;

            for (const email of emails) {
                try {
                    const analysis = await this.processEmail(email);
                    
                    const enrichedAnalysis = {
                        ...analysis,
                        email_metadata: {
                            subject: email.subject,
                            received_date: email.receivedDateTime,
                            message_id: email.id
                        }
                    };

                    if (analysis.action) {
                        tradingEmailCount++;
                    }

                    if (analysis.meat_type && (
                        Array.isArray(analysis.meat_type) ? 
                        analysis.meat_type.length > 0 : 
                        analysis.meat_type.trim() !== ''
                    )) {
                        meatRelatedCount++;
                    }

                    analyses.push(enrichedAnalysis);
                    await this.emailChecker.markAsProcessed(email.id);

                } catch (emailError) {
                    analyses.push({
                        error: 'Failed to process email',
                        details: emailError.message,
                        email_metadata: {
                            subject: email.subject,
                            received_date: email.receivedDateTime,
                            message_id: email.id
                        }
                    });
                }
            }

            const result = {
                total_emails: emails.length,
                trading_emails: tradingEmailCount,
                meat_related_emails: meatRelatedCount,
                summary: {
                    has_trading_info: tradingEmailCount > 0,
                    has_meat_products: meatRelatedCount > 0,
                    processing_status: 'completed'
                },
                analyses: analyses
            };

            console.log('BATCH PROCESSING RESULT:', JSON.stringify(result, null, 2));
            return result;

        } catch (error) {
            const errorResult = {
                error: 'Batch processing failed',
                details: error.message,
                total_emails: 0,
                trading_emails: 0,
                meat_related_emails: 0,
                summary: {
                    has_trading_info: false,
                    has_meat_products: false,
                    processing_status: 'failed'
                },
                analyses: []
            };
            console.log('BATCH PROCESSING ERROR:', JSON.stringify(errorResult, null, 2));
            return errorResult;
        }
    }

    async processEmail(email) {
        // 2. Clean HTML content if needed
        if (this.cleanHtml && email.body?.contentType?.toLowerCase() === 'html') {
            email.body.content = HtmlCleaner.clean(email.body.content);
        }

        // 3. Process attachments if any
        if (email.attachments && email.attachments.length > 0) {
            const attachmentTexts = await this.processAttachments(email.attachments);
            if (attachmentTexts.length > 0) {
                email.body.content += '\n\nAttachment Contents:\n' + attachmentTexts.join('\n---\n');
            }
        }

        // 4. Analyze with OpenAI
        return await this.openaiProcessor.processEmail(email);
    }

    async processAttachments(attachments) {
        const attachmentTexts = [];
        
        for (const attachment of attachments) {
            try {
                // Skip image files
                if (attachment.contentType.toLowerCase().startsWith('image/')) {
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