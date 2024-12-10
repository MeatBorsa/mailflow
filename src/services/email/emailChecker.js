require('isomorphic-fetch');
const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const { TokenCredentialAuthenticationProvider } = require('@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials');
const config = require('../../config');
const constants = require('../../config/constants');

class EmailChecker {
    constructor() {
        const credential = new ClientSecretCredential(
            config.tenantId,
            config.clientId,
            config.clientSecret
        );

        const authProvider = new TokenCredentialAuthenticationProvider(credential, {
            scopes: ['https://graph.microsoft.com/.default']
        });

        this.client = Client.initWithMiddleware({
            authProvider: authProvider,
            defaultVersion: 'beta'
        });
    }

    async fetchEmails() {
        try {
            const response = await this.client.api('/users/' + config.sharedMailbox + '/mailFolders/inbox/messages')
                .header('X-AnchorMailbox', config.userEmail)
                .filter(`not(categories/any(c:c eq '${config.processedCategory}'))`)
                .top(config.maxEmailsPerBatch)
                .orderby('receivedDateTime desc')
                .select('id,subject,from,body,receivedDateTime,hasAttachments,categories')
                .expand('attachments')
                .get();

            if (!response || !response.value) {
                console.log('No emails found in inbox');
                return [];
            }

            // Filter out excluded senders
            return response.value.filter(email => {
                const senderEmail = email.from?.emailAddress?.address?.toLowerCase();
                const isExcluded = senderEmail && config.excludedSenders.includes(senderEmail);
                if (isExcluded) {
                    console.log(`Skipping email from excluded sender: ${senderEmail}`);
                }
                return !isExcluded;
            });

        } catch (error) {
            console.error('Error fetching emails:', error);
            throw error;
        }
    }

    async markAsProcessed(emailId) {
        try {
            await this.client.api(`/users/${config.sharedMailbox}/messages/${emailId}`)
                .header('X-AnchorMailbox', config.userEmail)
                .patch({
                    categories: [config.processedCategory]
                });
            
            // Get the email subject for logging
            const email = await this.client.api(`/users/${config.sharedMailbox}/messages/${emailId}`)
                .header('X-AnchorMailbox', config.userEmail)
                .select('subject')
                .get();
            
            console.log(`Email - [${email.subject}] - marked as processed`);
        } catch (error) {
            console.error('Error marking email as processed:', error);
            throw error;
        }
    }
}

module.exports = EmailChecker; 