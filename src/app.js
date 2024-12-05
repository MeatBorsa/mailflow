const EmailProcessor = require('./services/email/emailProcessor');
const config = require('./config');
const constants = require('./config/constants');

async function main() {
    const processor = new EmailProcessor();
    
    console.log('Starting email processor...');
    console.log(`Monitoring shared mailbox: ${config.sharedMailbox}`);
    
    // Initial processing
    console.log('Performing initial check...');
    await processor.processEmailBatch();
    
    // Set up periodic processing
    console.log(`Setting up periodic checks every ${constants.POLLING_INTERVAL/1000} seconds...`);
    
    setInterval(async () => {
        console.log('\nStarting periodic check...');
        await processor.processEmailBatch();
    }, constants.POLLING_INTERVAL);
}

// Start the application
main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
}); 