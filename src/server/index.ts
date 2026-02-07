import * as dotenv from 'dotenv';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { LogicBoxesClient } from '../api/client.js';
import { DnsApi } from '../api/dns.js';
import { CustomerApi } from '../api/customers.js';
import { DomainApi } from '../api/domains.js';
import { TEST_BASE_URL } from '../api/types.js';
import { registerDnsTools } from './tools/dns.js';
import { registerCustomerTools } from './tools/customers.js';
import { registerDomainTools } from './tools/domains.js';

// Load .env from project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

async function main(): Promise<void> {
  // Validate credentials
  const authUserId = process.env.LOGICBOXES_AUTH_USERID;
  const apiKey = process.env.LOGICBOXES_API_KEY;

  if (!authUserId || !apiKey) {
    console.error('Missing LOGICBOXES_AUTH_USERID or LOGICBOXES_API_KEY in environment');
    console.error('Create a .env file with your LogicBoxes API credentials');
    process.exit(1);
  }

  // Determine base URL
  const env = process.env.LOGICBOXES_ENV;
  const baseUrl = env === 'test' ? TEST_BASE_URL : undefined;

  // Create API client and domain-specific APIs
  const client = new LogicBoxesClient({ authUserId, apiKey, baseUrl });
  const dnsApi = new DnsApi(client);
  const customerApi = new CustomerApi(client);
  const domainApi = new DomainApi(client);

  // Create MCP server
  const server = new McpServer({
    name: 'logicboxes-mcp',
    version: '0.1.0',
  });

  // Register all tools
  registerDnsTools(server, dnsApi);
  registerCustomerTools(server, customerApi);
  registerDomainTools(server, domainApi);

  // Connect via stdio transport
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr (stdout is reserved for MCP protocol)
  console.error('LogicBoxes MCP server started');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
