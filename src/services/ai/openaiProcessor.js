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
        Most of the time, the sender is selling, especially if the email contains price information. Leave empty if it cannot be determined.
        Extract the following information in JSON format:
        - sender object: { firstname, lastname, email, company, vat, address }
        - action: "buying" or "selling"
        - article: type of meat mentioned. Here're examples, Name the article like these examples: Pork head trimmings 80/20, pork trimming 90/10, beef tenderloin 1.8kg+, beef trimmings.
            if you cannot format it like this, indicate just the type of meat - Pork, Sow, Beef, Veal, Chicken, Duck, Turkey, etc.
        - Title - the original tile of a single offer
        - quantity: amount mentioned (if any). Leave empty if not mentioned. Convert to kg if possible.
        - package: package type mentioned (if any). Leave empty if not mentioned.
        - price: price mentioned (if any). If there's no price, leave empty.
        - meat state: Unknown, Fresh, Frozen.
        - origin: country of origin (if any). Leave empty if not mentioned.
        - certificate: certificate mentioned (if any). Leave empty if not mentioned. Examples: EFSIS, FSA, Halal, etc.
        - incoterms: incoterms short code mentioned (if any)
        - currency: currency of price (if any). Assume EUR if not specified.
        - description: any other relevant information (if any)
        - if there're multiple meats, list them all
        
        Email Subject: {subject}
        Email Content: {content}
        
        Important: Pair each offer with article, title, action, quantity, packaging, certificate, origin, meat state, price, incoterms, currency. There should be one price per offer or per line. 
        Respond only with valid JSON with all the fields that are mentioned above.
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