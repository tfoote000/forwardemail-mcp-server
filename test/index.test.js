const test = require('node:test');
const assert = require('node:assert');
const {spawn} = require('node:child_process');
const path = require('node:path');

const cliPath = path.resolve(__dirname, '../bin/mcp-server.js');

const runCli = (env = {}) =>
  spawn(cliPath, [], {
    stdio: ['pipe', 'pipe', 'pipe'],
    env: {...process.env, ...env},
  });

const sendRequest = (child, request) => {
  const responsePromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error('CLI response timed out'));
    }, 5000);

    child.stdout.once('data', (data) => {
      clearTimeout(timer);
      try {
        resolve(JSON.parse(data.toString()));
      } catch {
        reject(new Error(`Failed to parse: ${data.toString()}`));
      }
    });

    child.stderr.once('data', (data) => {
      clearTimeout(timer);
      reject(new Error(`CLI Error: ${data.toString()}`));
    });
  });

  child.stdin.write(JSON.stringify(request) + '\n');
  return responsePromise;
};

test('MCP Server', async (t) => {
  await t.test('listTools returns all tools', async () => {
    const child = runCli();
    const response = await sendRequest(child, {id: '1', type: 'listTools'});

    assert.strictEqual(response.type, 'toolResponse');
    assert.strictEqual(response.id, '1');
    assert(Array.isArray(response.tools));

    const names = new Set(response.tools.map((tool) => tool.name));

    // Should have 68 tools (all API endpoints except WebSocket)
    assert(
      response.tools.length >= 60,
      `Expected >= 60 tools, got ${response.tools.length}`,
    );

    // Spot-check key tools from each resource
    const expected = [
      'getAccount',
      'updateAccount',
      'downloadLogs',
      'listContacts',
      'createContact',
      'getContact',
      'listCalendars',
      'createCalendar',
      'listCalendarEvents',
      'createCalendarEvent',
      'listDomains',
      'createDomain',
      'getDomain',
      'updateDomain',
      'deleteDomain',
      'verifyDomainRecords',
      'verifySmtpRecords',
      'testS3Connection',
      'listCatchAllPasswords',
      'createCatchAllPassword',
      'deleteCatchAllPassword',
      'acceptDomainInvite',
      'createDomainInvite',
      'removeDomainInvite',
      'updateDomainMember',
      'removeDomainMember',
      'listAliases',
      'createAlias',
      'getAlias',
      'updateAlias',
      'deleteAlias',
      'generateAliasPassword',
      'listSieveScripts',
      'createSieveScript',
      'getSieveScript',
      'updateSieveScript',
      'deleteSieveScript',
      'activateSieveScript',
      'listSieveScriptsAliasAuth',
      'createSieveScriptAliasAuth',
      'listEmails',
      'sendEmail',
      'getEmailLimit',
      'getEmail',
      'deleteEmail',
      'listMessages',
      'createMessage',
      'getMessage',
      'updateMessage',
      'deleteMessage',
      'listFolders',
      'createFolder',
      'getFolder',
      'updateFolder',
      'deleteFolder',
      'encryptRecord',
    ];

    for (const name of expected) {
      assert(names.has(name), `Missing tool: ${name}`);
    }

    child.kill();
  });

  await t.test('unknown tool returns error', async () => {
    const child = runCli();
    const response = await sendRequest(child, {
      id: '2',
      type: 'invokeTool',
      name: 'unknownTool',
      arguments: {},
    });

    assert.strictEqual(response.type, 'error');
    assert.strictEqual(response.id, '2');
    assert.strictEqual(response.message, 'Tool not found: unknownTool');
    child.kill();
  });

  await t.test('unknown request type returns error', async () => {
    const child = runCli();
    const response = await sendRequest(child, {
      id: '3',
      type: 'unknownType',
    });

    assert.strictEqual(response.type, 'error');
    assert.strictEqual(response.id, '3');
    assert(response.message.includes('Unknown request type'));
    child.kill();
  });

  // Helper for testing API calls that should fail with auth errors
  const testApiCall = async (name, toolName, arguments_) => {
    await t.test(`${name} returns API error with invalid key`, async () => {
      const child = runCli({FORWARD_EMAIL_API_KEY: 'test-key'});
      const response = await sendRequest(child, {
        id: name,
        type: 'invokeTool',
        name: toolName,
        arguments: arguments_,
      });

      assert.strictEqual(response.type, 'error');
      assert.strictEqual(response.id, name);
      assert(typeof response.message === 'string');
      assert(response.message.length > 0);
      child.kill();
    });
  };

  // Test a representative tool from each resource group
  await testApiCall('account', 'getAccount', {});
  await testApiCall('domains', 'listDomains', {});
  await testApiCall('aliases', 'listAliases', {
    domain_id: 'example.com', // eslint-disable-line camelcase
  });
  await testApiCall('emails', 'listEmails', {});
  await testApiCall('messages', 'listMessages', {folder: 'INBOX'});
  await testApiCall('folders', 'listFolders', {});
  await testApiCall('contacts', 'listContacts', {});
  await testApiCall('calendars', 'listCalendars', {});
  await testApiCall('calendar-events', 'listCalendarEvents', {});
  // Encrypt endpoint doesn't require auth, so test for success
  await t.test('encryptRecord returns a result', async () => {
    const child = runCli({FORWARD_EMAIL_API_KEY: 'test-key'});
    const response = await sendRequest(child, {
      id: 'encrypt',
      type: 'invokeTool',
      name: 'encryptRecord',
      arguments: {input: 'test'},
    });

    assert.strictEqual(response.type, 'toolResponse');
    assert.strictEqual(response.id, 'encrypt');
    assert(typeof response.result === 'string');
    assert(response.result.startsWith('forward-email='));
    child.kill();
  });
});
