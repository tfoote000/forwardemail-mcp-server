export type McpServerOptions = {
  apiKey?: string;
  baseURL?: string;
};

export class McpServer {
  constructor(options?: McpServerOptions);
  listen(): void;
}
