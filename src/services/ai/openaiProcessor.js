const OpenAI = require('openai');
const constants = require('../../config/constants');
const PostAIProcessor = require('../utils/postAIProcessor');

// Define the schema for our meat trading analysis
const MEAT_ANALYSIS_SCHEMA = {
    type: "object",
    properties: {
        sender: {
            type: "object",
            properties: {
                firstname: { type: "string" },
                lastname: { type: "string" },
                email: { type: "string" },
                company: { type: "string" },
                vat: { type: "string" },
                address: { type: "string" }
            },
            required: ["firstname", "lastname", "email"]
        },
        action: { 
            type: "string",
            enum: ["buying", "selling", ""] 
        },
        meat_type: {
            oneOf: [
                { type: "string" },
                { 
                    type: "array",
                    items: { type: "string" }
                }
            ]
        },
        title: { type: "string" },
        quantity: { type: "string" },
        package: { type: "string" },
        price: { type: "string" },
        incoterms: { type: "string" },
        currency: { type: "string" },
        description: { type: "string" }
    },
    required: ["sender", "action", "meat_type", "title"]
};

// System prompts
const SYSTEM_PROMPTS = {
    MEAT_ANALYST: "You are a meat trading analyst. Extract buying/selling information from emails and respond in the specified JSON format."
};

// User prompts
const USER_PROMPTS = {
    EMAIL_ANALYSIS: `
        Analyze this email to determine if the sender is buying or selling meat. Process emails that contain meat related information.
        Most of the time, the sender is selling, especially if the email contains price information. Leave empty if it cannot be determined.
        
        Important notes:
        - If the email is forwarded, process the original email only
        - Take the first name, last name, email and company from the original sender
        - Process file attachments regardless of forwarding
        - If the email contains multiple emails, process only the forwarded email
        - Do not process emails that are not about meat trading
        - There should be one price per offer or per line
        
        Email Subject: {subject}
        Email Content: {content}
    `
};

class OpenAIProcessor {
    constructor(apiKey, options = {}) {
        this.openai = new OpenAI({ apiKey });
        this.MODEL = "gpt-4o-mini-2024-07-18" //"gpt-4-1106-preview"; // Using the latest model that supports structured outputs
        this.cleanHtml = options.cleanHtml ?? true;
    }

    async processEmail(email) {
        try {
            const prompt = USER_PROMPTS.EMAIL_ANALYSIS
                .replace('{subject}', email.subject)
                .replace('{content}', email.body?.content)
                .trim();

            const completion = await this.openai.chat.completions.create({
                model: this.MODEL,
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPTS.MEAT_ANALYST
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                response_format: {
                    type: "json_object"
                },
                temperature: 0.2 // Low temperature to ensure consistent results
            });

            // Parse the response before processing
            const result = JSON.parse(completion.choices[0].message.content);
            return PostAIProcessor.process(result);

        } catch (error) {
            console.error('OpenAI Processing Error:', error);
            return {
                error: 'Failed to process email',
                details: error.message,
                email_subject: email.subject
            };
        }
    }
}

module.exports = OpenAIProcessor; 