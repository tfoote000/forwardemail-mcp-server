const readline = require('node:readline');
const {getTools} = require('./tools.js');

class McpServer {
  constructor(options = {}) {
    this.tools = getTools(options);
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false,
    });
  }

  listen() {
    this.rl.on('line', async (line) => {
      try {
        const request = JSON.parse(line);
        await this.handleRequest(request);
      } catch (error) {
        this.sendError(error.message);
      }
    });
  }

  async handleRequest(request) {
    if (request.type === 'listTools') {
      return this.sendResponse(request.id, {
        tools: Object.values(this.tools).map((tool) => tool.toolSpec),
      });
    }

    if (request.type === 'invokeTool') {
      const tool = this.tools[request.name];
      if (tool) {
        try {
          const result = await tool.invoke(request.arguments);
          return this.sendResponse(request.id, {result});
        } catch (error) {
          const errorMessage = error.response?.data?.message || error.message;
          return this.sendError(errorMessage, request.id);
        }
      }

      return this.sendError(`Tool not found: ${request.name}`, request.id);
    }

    return this.sendError(`Unknown request type: ${request.type}`, request.id);
  }

  sendResponse(id, payload) {
    this.send({type: 'toolResponse', id, ...payload});
  }

  sendError(message, id = null) {
    this.send({type: 'error', id, message});
  }

  send(data) {
    process.stdout.write(JSON.stringify(data) + '\n');
  }
}

module.exports = {McpServer};
