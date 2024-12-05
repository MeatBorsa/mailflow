const OpenAI = require('openai');
const constants = require('../../config/constants');
const PostAIProcessor = require('../utils/postAIProcessor');

// System prompts
const SYSTEM_PROMPTS = {
    MEAT_ANALYST: "You are a meat trading analyst. Extract buying/selling information from emails and respond in JSON format only."
};

// User prompts
const USER_PROMPTS = {
    EMAIL_ANALYSIS: `
        Analyze this email to determine if the sender is buying or selling meat. 
        Extract the following information in JSON format:
        - sender object: { firstname, lastname, email, company, vat, address }
        - action: "buying" or "selling"
        - meat_type: type of meat mentioned
        - quantity: amount mentioned (if any). Leave empty if not mentioned.
        - package: package type mentioned (if any). Leave empty if not mentioned.
        - price: price mentioned (if any)
        - incoterms: incoterms short code mentioned (if any)
        - currency: currency of price (if any). Assume EUR if not specified.
        - description: any other relevant information (if any)
        - if there're multiple meats, list them all
        
        Email Subject: {subject}
        Email Content: {content}
        
        Pair each offer with name, quantity, package, price, incoterms, currency. There should be one price per offer or per line. 
        Respond only with valid JSON. 
        Important: If the email is forwarded, process the original email only. You should then take the first name, last name, email and company from the original sender, but still process the file attachments.
        If the email contains multiple emails, process only the forwarded email.
        Do not process emails that are not about meat trading.
    `
};

// OpenAI completion configurations
const COMPLETION_CONFIGS = {
    DEFAULT: {
        model: "gpt-4o-mini-2024-07-18",
        max_tokens: 16384, // gpt-4o-mini max tokens
        response_format: { type: "json_object" }
    }
};

class OpenAIProcessor {
    constructor(apiKey, options = {}) {
        this.openai = new OpenAI({ apiKey });
        this.MODEL = COMPLETION_CONFIGS.DEFAULT.model;
        this.cleanHtml = options.cleanHtml ?? true;
    }

    async processEmail(email) {
        try {
            const prompt = USER_PROMPTS.EMAIL_ANALYSIS
                .replace('{subject}', email.subject)
                .replace('{content}', email.body?.content)
                .trim();

            const completion = await this.openai.chat.completions.create({
                ...COMPLETION_CONFIGS.DEFAULT,
                messages: [
                    {
                        role: "system",
                        content: SYSTEM_PROMPTS.MEAT_ANALYST
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ]
            });

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