const axios = require('axios');

const getTools = (options = {}) => {
  const client = axios.create({
    baseURL: options.baseURL || 'https://api.forwardemail.net',
    headers: {
      Authorization: `Bearer ${options.apiKey || process.env.FORWARD_EMAIL_API_KEY}`,
    },
  });

  const createTool = (spec) => ({
    toolSpec: {
      name: spec.name,
      description: spec.description,
      input: {
        type: 'object',
        properties: spec.inputs || {},
      },
    },
    async invoke(arguments_) {
      let {path} = spec;
      const pathParameters = path.match(/{(\w+)}/g) || [];
      const queryArguments = {};
      const bodyArguments = {};

      for (const key in arguments_) {
        if (Object.hasOwn(arguments_, key)) {
          if (pathParameters.includes(`{${key}}`)) {
            path = path.replace(`{${key}}`, arguments_[key]);
          } else if (spec.query && spec.query.includes(key)) {
            queryArguments[key] = arguments_[key];
          } else {
            bodyArguments[key] = arguments_[key];
          }
        }
      }

      const config = {params: queryArguments};
      const hasBody = Object.keys(bodyArguments).length > 0;

      let response;
      if (spec.method === 'get' || spec.method === 'delete') {
        response = await client[spec.method](path, config);
      } else {
        response = await client[spec.method](
          path,
          hasBody ? bodyArguments : undefined,
          config,
        );
      }

      return response.data;
    },
  });

  const tools = {
    //
    // Account
    //
    getAccount: createTool({
      name: 'getAccount',
      description: 'Get your account details',
      method: 'get',
      path: '/v1/account',
    }),
    updateAccount: createTool({
      name: 'updateAccount',
      description: 'Update your account',
      method: 'put',
      path: '/v1/account',
    }),

    //
    // Logs
    //
    downloadLogs: createTool({
      name: 'downloadLogs',
      description: 'Download email delivery logs',
      method: 'get',
      path: '/v1/logs/download',
      query: [
        'domain',
        'q',
        'bounce_category',
        'response_code',
        'always_send_email',
      ],
    }),

    //
    // Contacts (CardDAV)
    //
    listContacts: createTool({
      name: 'listContacts',
      description: 'List all contacts',
      method: 'get',
      path: '/v1/contacts',
    }),
    createContact: createTool({
      name: 'createContact',
      description: 'Create a contact',
      method: 'post',
      path: '/v1/contacts',
    }),
    getContact: createTool({
      name: 'getContact',
      description: 'Get a contact by ID',
      method: 'get',
      path: '/v1/contacts/{id}',
    }),
    updateContact: createTool({
      name: 'updateContact',
      description: 'Update a contact',
      method: 'put',
      path: '/v1/contacts/{id}',
    }),
    deleteContact: createTool({
      name: 'deleteContact',
      description: 'Delete a contact',
      method: 'delete',
      path: '/v1/contacts/{id}',
    }),

    //
    // Calendars (CalDAV)
    //
    listCalendars: createTool({
      name: 'listCalendars',
      description: 'List all calendars',
      method: 'get',
      path: '/v1/calendars',
    }),
    createCalendar: createTool({
      name: 'createCalendar',
      description: 'Create a calendar',
      method: 'post',
      path: '/v1/calendars',
    }),
    getCalendar: createTool({
      name: 'getCalendar',
      description: 'Get a calendar by ID',
      method: 'get',
      path: '/v1/calendars/{id}',
    }),
    updateCalendar: createTool({
      name: 'updateCalendar',
      description: 'Update a calendar',
      method: 'put',
      path: '/v1/calendars/{id}',
    }),
    deleteCalendar: createTool({
      name: 'deleteCalendar',
      description: 'Delete a calendar',
      method: 'delete',
      path: '/v1/calendars/{id}',
    }),

    //
    // Calendar Events (CalDAV)
    //
    listCalendarEvents: createTool({
      name: 'listCalendarEvents',
      description: 'List all calendar events',
      method: 'get',
      path: '/v1/calendar-events',
    }),
    createCalendarEvent: createTool({
      name: 'createCalendarEvent',
      description: 'Create a calendar event',
      method: 'post',
      path: '/v1/calendar-events',
    }),
    getCalendarEvent: createTool({
      name: 'getCalendarEvent',
      description: 'Get a calendar event by ID',
      method: 'get',
      path: '/v1/calendar-events/{id}',
    }),
    updateCalendarEvent: createTool({
      name: 'updateCalendarEvent',
      description: 'Update a calendar event',
      method: 'put',
      path: '/v1/calendar-events/{id}',
    }),
    deleteCalendarEvent: createTool({
      name: 'deleteCalendarEvent',
      description: 'Delete a calendar event',
      method: 'delete',
      path: '/v1/calendar-events/{id}',
    }),

    //
    // Domains
    //
    listDomains: createTool({
      name: 'listDomains',
      description: 'List all domains',
      method: 'get',
      path: '/v1/domains',
      query: ['sort', 'page', 'limit'],
    }),
    createDomain: createTool({
      name: 'createDomain',
      description: 'Create a new domain',
      method: 'post',
      path: '/v1/domains',
    }),
    getDomain: createTool({
      name: 'getDomain',
      description: 'Get a domain by ID or name',
      method: 'get',
      path: '/v1/domains/{domain_id}',
    }),
    updateDomain: createTool({
      name: 'updateDomain',
      description: 'Update a domain',
      method: 'put',
      path: '/v1/domains/{domain_id}',
    }),
    deleteDomain: createTool({
      name: 'deleteDomain',
      description: 'Delete a domain',
      method: 'delete',
      path: '/v1/domains/{domain_id}',
    }),
    verifyDomainRecords: createTool({
      name: 'verifyDomainRecords',
      description: 'Verify domain DNS records',
      method: 'get',
      path: '/v1/domains/{domain_id}/verify-records',
    }),
    verifySmtpRecords: createTool({
      name: 'verifySmtpRecords',
      description: 'Verify domain SMTP records',
      method: 'get',
      path: '/v1/domains/{domain_id}/verify-smtp',
    }),
    testS3Connection: createTool({
      name: 'testS3Connection',
      description: 'Test custom S3 connection for a domain',
      method: 'post',
      path: '/v1/domains/{domain_id}/test-s3-connection',
    }),

    //
    // Domain Catch-All Passwords
    //
    listCatchAllPasswords: createTool({
      name: 'listCatchAllPasswords',
      description: 'List domain-wide catch-all passwords',
      method: 'get',
      path: '/v1/domains/{domain_id}/catch-all-passwords',
    }),
    createCatchAllPassword: createTool({
      name: 'createCatchAllPassword',
      description: 'Create a domain-wide catch-all password',
      method: 'post',
      path: '/v1/domains/{domain_id}/catch-all-passwords',
    }),
    deleteCatchAllPassword: createTool({
      name: 'deleteCatchAllPassword',
      description: 'Remove a domain-wide catch-all password',
      method: 'delete',
      path: '/v1/domains/{domain_id}/catch-all-passwords/{token_id}',
    }),

    //
    // Domain Invites
    //
    acceptDomainInvite: createTool({
      name: 'acceptDomainInvite',
      description: 'Accept a domain invite',
      method: 'get',
      path: '/v1/domains/{domain_id}/invites',
    }),
    createDomainInvite: createTool({
      name: 'createDomainInvite',
      description: 'Invite a user to a domain',
      method: 'post',
      path: '/v1/domains/{domain_id}/invites',
    }),
    removeDomainInvite: createTool({
      name: 'removeDomainInvite',
      description: 'Remove a domain invite',
      method: 'delete',
      path: '/v1/domains/{domain_id}/invites',
    }),

    //
    // Domain Members
    //
    updateDomainMember: createTool({
      name: 'updateDomainMember',
      description: 'Update a domain member role (admin or user)',
      method: 'put',
      path: '/v1/domains/{domain_id}/members/{member_id}',
    }),
    removeDomainMember: createTool({
      name: 'removeDomainMember',
      description: 'Remove a member from a domain',
      method: 'delete',
      path: '/v1/domains/{domain_id}/members/{member_id}',
    }),

    //
    // Aliases
    //
    listAliases: createTool({
      name: 'listAliases',
      description: 'List aliases for a domain',
      method: 'get',
      path: '/v1/domains/{domain_id}/aliases',
      query: ['sort', 'page', 'limit'],
    }),
    createAlias: createTool({
      name: 'createAlias',
      description: 'Create a new alias',
      method: 'post',
      path: '/v1/domains/{domain_id}/aliases',
    }),
    getAlias: createTool({
      name: 'getAlias',
      description: 'Get an alias by ID',
      method: 'get',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}',
    }),
    updateAlias: createTool({
      name: 'updateAlias',
      description: 'Update an alias',
      method: 'put',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}',
    }),
    deleteAlias: createTool({
      name: 'deleteAlias',
      description: 'Delete an alias',
      method: 'delete',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}',
    }),
    generateAliasPassword: createTool({
      name: 'generateAliasPassword',
      description: 'Generate or set a password for an alias',
      method: 'post',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}/generate-password',
    }),

    //
    // Sieve Scripts (domain-scoped, authenticated via API key)
    //
    listSieveScripts: createTool({
      name: 'listSieveScripts',
      description: 'List Sieve scripts for an alias',
      method: 'get',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}/sieve',
    }),
    createSieveScript: createTool({
      name: 'createSieveScript',
      description: 'Create a Sieve script for an alias',
      method: 'post',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}/sieve',
    }),
    getSieveScript: createTool({
      name: 'getSieveScript',
      description: 'Get a Sieve script by ID',
      method: 'get',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}/sieve/{script_id}',
    }),
    updateSieveScript: createTool({
      name: 'updateSieveScript',
      description: 'Update a Sieve script',
      method: 'put',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}/sieve/{script_id}',
    }),
    deleteSieveScript: createTool({
      name: 'deleteSieveScript',
      description: 'Delete a Sieve script',
      method: 'delete',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}/sieve/{script_id}',
    }),
    activateSieveScript: createTool({
      name: 'activateSieveScript',
      description: 'Activate a Sieve script',
      method: 'post',
      path: '/v1/domains/{domain_id}/aliases/{alias_id}/sieve/{script_id}/activate',
    }),

    //
    // Sieve Scripts (alias auth, authenticated via alias credentials)
    //
    listSieveScriptsAliasAuth: createTool({
      name: 'listSieveScriptsAliasAuth',
      description: 'List Sieve scripts (alias auth)',
      method: 'get',
      path: '/v1/sieve-scripts',
    }),
    createSieveScriptAliasAuth: createTool({
      name: 'createSieveScriptAliasAuth',
      description: 'Create a Sieve script (alias auth)',
      method: 'post',
      path: '/v1/sieve-scripts',
    }),
    getSieveScriptAliasAuth: createTool({
      name: 'getSieveScriptAliasAuth',
      description: 'Get a Sieve script (alias auth)',
      method: 'get',
      path: '/v1/sieve-scripts/{script_id}',
    }),
    updateSieveScriptAliasAuth: createTool({
      name: 'updateSieveScriptAliasAuth',
      description: 'Update a Sieve script (alias auth)',
      method: 'put',
      path: '/v1/sieve-scripts/{script_id}',
    }),
    deleteSieveScriptAliasAuth: createTool({
      name: 'deleteSieveScriptAliasAuth',
      description: 'Delete a Sieve script (alias auth)',
      method: 'delete',
      path: '/v1/sieve-scripts/{script_id}',
    }),
    activateSieveScriptAliasAuth: createTool({
      name: 'activateSieveScriptAliasAuth',
      description: 'Activate a Sieve script (alias auth)',
      method: 'post',
      path: '/v1/sieve-scripts/{script_id}/activate',
    }),

    //
    // Emails (Outbound SMTP)
    //
    listEmails: createTool({
      name: 'listEmails',
      description: 'List outbound SMTP emails',
      method: 'get',
      path: '/v1/emails',
      query: ['q', 'domain', 'is_scheduled', 'sort', 'page', 'limit'],
    }),
    sendEmail: createTool({
      name: 'sendEmail',
      description: 'Send an email via outbound SMTP',
      method: 'post',
      path: '/v1/emails',
    }),
    getEmailLimit: createTool({
      name: 'getEmailLimit',
      description: 'Get outbound SMTP email sending limit',
      method: 'get',
      path: '/v1/emails/limit',
    }),
    getEmail: createTool({
      name: 'getEmail',
      description: 'Get an outbound SMTP email by ID',
      method: 'get',
      path: '/v1/emails/{id}',
    }),
    deleteEmail: createTool({
      name: 'deleteEmail',
      description: 'Delete an outbound SMTP email',
      method: 'delete',
      path: '/v1/emails/{id}',
    }),

    //
    // Messages (IMAP)
    //
    listMessages: createTool({
      name: 'listMessages',
      description: 'List and search messages in a folder',
      method: 'get',
      path: '/v1/messages',
      query: [
        'folder',
        'is_unread',
        'is_flagged',
        'is_deleted',
        'is_draft',
        'is_junk',
        'is_copied',
        'is_encrypted',
        'is_searchable',
        'is_expired',
        'has_attachments',
        'has_attachment',
        'subject',
        'body',
        'text',
        'headers',
        'message_id',
        'search',
        'q',
        'since',
        'before',
        'min_size',
        'max_size',
        'from',
        'to',
        'cc',
        'bcc',
        'date',
        'reply-to',
      ],
    }),
    createMessage: createTool({
      name: 'createMessage',
      description: 'Create a new message (draft)',
      method: 'post',
      path: '/v1/messages',
    }),
    getMessage: createTool({
      name: 'getMessage',
      description: 'Get a message by ID',
      method: 'get',
      path: '/v1/messages/{id}',
      query: ['eml', 'nodemailer', 'attachments', 'raw'],
    }),
    updateMessage: createTool({
      name: 'updateMessage',
      description: 'Update a message',
      method: 'put',
      path: '/v1/messages/{id}',
      query: ['eml'],
    }),
    deleteMessage: createTool({
      name: 'deleteMessage',
      description: 'Delete a message',
      method: 'delete',
      path: '/v1/messages/{id}',
    }),

    //
    // Folders (IMAP)
    //
    listFolders: createTool({
      name: 'listFolders',
      description: 'List all folders',
      method: 'get',
      path: '/v1/folders',
      query: ['subscribed'],
    }),
    createFolder: createTool({
      name: 'createFolder',
      description: 'Create a new folder',
      method: 'post',
      path: '/v1/folders',
    }),
    getFolder: createTool({
      name: 'getFolder',
      description: 'Get a folder by ID',
      method: 'get',
      path: '/v1/folders/{id}',
    }),
    updateFolder: createTool({
      name: 'updateFolder',
      description: 'Update a folder',
      method: 'put',
      path: '/v1/folders/{id}',
    }),
    deleteFolder: createTool({
      name: 'deleteFolder',
      description: 'Delete a folder',
      method: 'delete',
      path: '/v1/folders/{id}',
    }),

    //
    // Encrypt
    //
    encryptRecord: createTool({
      name: 'encryptRecord',
      description: 'Encrypt a plaintext Forward Email TXT record',
      method: 'post',
      path: '/v1/encrypt',
    }),
  };

  return tools;
};

module.exports = {getTools};
