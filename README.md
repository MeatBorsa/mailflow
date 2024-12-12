# Meat Trading Email Processor

An automated system for processing meat trading emails using AI. The system monitors a shared or user inbox mailbox, analyzes incoming emails and their attachments for meat trading information, and categorizes processed emails.

## Features

### Email Processing
- Monitors Office 365 shared and user mailboxes
- Processes emails from inbox only
- Excludes already processed emails
- Marks processed emails with a category
- Handles forwarded emails
- Excludes specified sender addresses such as newsletter@meatborsa.com

### Document Analysis
- Extracts text from various document types:
  - PDF files
  - Word documents (.doc, .docx)
  - Excel spreadsheets (.xls, .xlsx)
- Skips image attachments (for now)
- Handles file size limits
- Combines document content with email body

### AI Analysis
- Uses OpenAI GPT-4 for analysis
- Extracts key trading information:
  - Sender details (name, company, contact)
  - Trading action (buying/selling)
  - Meat types and specifications
  - Quantities and packaging
  - Prices and currencies
  - Incoterms
- Standardizes incoterms format
- Handles multiple offers per email

### Technical Features
- HTML content cleaning
- Error handling and logging
- Configurable polling interval
- Environment-based configuration
## Setup

1. Clone the repository
2. Install dependencies:

3. Configure environment variables in `.env`:

### Azure Configuration
- `AZURE_CLIENT_ID`: your_azure_client_id
- `AZURE_CLIENT_SECRET`: your_azure_client_secret 
- `AZURE_TENANT_ID`: your_azure_tenant_id
- `USER_EMAIL`: your_email
- `SHARED_MAILBOX`: shared_mailbox_email

### OpenAI Configuration
- `OPENAI_API_KEY`: your_openai_api_key

### Email Processing Configuration
- `EXCLUDED_SENDERS`: comma,separated,email,addresses
- `CLEAN_HTML`: true
- `EMAIL_PROCESSED_CATEGORY`: Processed
- `MAX_EMAILS_PER_BATCH`: 3  # Maximum number of emails to process in each batch
- `PROCESS_EMAILS_AFTER`: 2024-01-01  # Process emails received after this date (YYYY-MM-DD format)

### Environment Variables Description:
- `AZURE_CLIENT_ID`: Azure AD application client ID
- `AZURE_CLIENT_SECRET`: Azure AD application client secret
- `AZURE_TENANT_ID`: Azure AD tenant ID
- `USER_EMAIL`: Email address of the user accessing the mailbox
- `SHARED_MAILBOX`: Email address of the shared mailbox to monitor
- `OPENAI_API_KEY`: OpenAI API key for email analysis
- `EXCLUDED_SENDERS`: List of email addresses to ignore
- `CLEAN_HTML`: Whether to clean HTML content (true/false)
- `EMAIL_PROCESSED_CATEGORY`: Category name for processed emails
- `MAX_EMAILS_PER_BATCH`: Number of emails to process in each batch
- `PROCESS_EMAILS_AFTER`: Only process emails received after this date (YYYY-MM-DD)

## Architecture

### Core Components
- `EmailProcessor`: Main orchestrator
- `EmailChecker`: Handles Office 365 email operations
- `OpenAIProcessor`: Manages AI analysis
- `DocumentExtractor`: Handles document text extraction

### Utilities
- `HtmlCleaner`: Cleans HTML email content
- `PostAIProcessor`: Standardizes AI responses
- `DocumentExtractor`: Extracts text from various file types

### Configuration
- Environment-based configuration
- Constants for file types and limits
- Configurable email processing settings

## Dependencies

- `@azure/identity`: Azure authentication
- `@microsoft/microsoft-graph-client`: Office 365 API
- `openai`: OpenAI API client
- `mammoth`: Word document processing
- `pdf-parse`: PDF processing
- `xlsx`: Excel file processing
- `node-html-parser`: HTML cleaning
- `dotenv`: Environment configuration

## Error Handling

- Email processing errors
- Document extraction errors
- AI analysis errors
- API communication errors
- File size limits
- Unsupported file types

## Monitoring

The application logs:
- Email processing status
- Document analysis results
- AI analysis results
- Error messages
- Processing completion status
