/**
 * Customer management tools for the LogicBoxes MCP server.
 *
 * Registers MCP tools that expose customer search and detail retrieval
 * via the LogicBoxes reseller API.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { CustomerApi } from '../../api/customers.js';

/**
 * Registers customer management tools on the given MCP server instance.
 *
 * Tools registered:
 * - `list_customers` -- Search/list customers with optional filters.
 * - `get_customer`   -- Get full customer details by ID or username.
 *
 * @param server      - The MCP server to register tools on.
 * @param customerApi - The customer API instance for making LogicBoxes calls.
 */
export function registerCustomerTools(server: McpServer, customerApi: CustomerApi): void {

  // ---------------------------------------------------------------------------
  // list_customers
  // ---------------------------------------------------------------------------

  server.tool(
    'list_customers',
    'Search and list customers under the reseller account with optional filters',
    {
      pageNo: z.number().optional().describe('Page number (default 1)'),
      noOfRecords: z.number().optional().describe('Records per page, 10-500 (default 25)'),
      username: z.string().optional().describe('Filter by email/username'),
      name: z.string().optional().describe('Filter by name'),
      company: z.string().optional().describe('Filter by company'),
      status: z.string().optional().describe('Filter by status'),
    },
    async (args) => {
      try {
        const { customers, total } = await customerApi.search({
          pageNo: args.pageNo,
          noOfRecords: args.noOfRecords,
          username: args.username,
          name: args.name,
          company: args.company,
          status: args.status,
        });

        if (customers.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No customers found matching the given filters.' }],
          };
        }

        const header = `Found ${total} customer(s):\n`;
        const divider = '-'.repeat(90) + '\n';
        const columnHeader =
          'ID'.padEnd(12) +
          'Username'.padEnd(28) +
          'Name'.padEnd(22) +
          'Company'.padEnd(18) +
          'Status' + '\n';

        const rows = customers.map((c) =>
          c.customerid.padEnd(12) +
          c.username.padEnd(28) +
          c.name.padEnd(22) +
          c.company.padEnd(18) +
          c.customerstatus
        ).join('\n');

        const result = header + divider + columnHeader + divider + rows;

        return { content: [{ type: 'text' as const, text: result }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
      }
    },
  );

  // ---------------------------------------------------------------------------
  // get_customer
  // ---------------------------------------------------------------------------

  server.tool(
    'get_customer',
    'Get detailed customer information by customer ID or username (email)',
    {
      username: z.string().optional().describe('Customer email/username'),
      customerId: z.string().optional().describe('Customer ID'),
    },
    async (args) => {
      try {
        if (args.customerId === undefined && args.username === undefined) {
          return {
            content: [{ type: 'text' as const, text: 'Error: At least one of customerId or username must be provided.' }],
            isError: true,
          };
        }

        const customer = args.username !== undefined
          ? await customerApi.getByUsername(args.username)
          : await customerApi.getById(Number(args.customerId));

        const lines = [
          `Customer Details`,
          '-'.repeat(40),
          `ID:       ${customer.customerid}`,
          `Name:     ${customer.name}`,
          `Email:    ${customer.username}`,
          `Company:  ${customer.company}`,
          `Address:  ${customer.address1 ?? ''}`,
          `City:     ${customer.city}`,
          `State:    ${customer.state}`,
          `Country:  ${customer.country}`,
          `Phone:    ${customer.phonecountrycode ? '+' + customer.phonecountrycode + ' ' : ''}${customer.phone}`,
          `Status:   ${customer.customerstatus}`,
        ];

        return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
