/**
 * Domain management tools for the LogicBoxes MCP server.
 *
 * Registers MCP tools that expose domain search, detail retrieval,
 * and order ID lookup via the LogicBoxes reseller API.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DomainApi } from '../../api/domains.js';

/**
 * Converts a UNIX epoch timestamp (in seconds, as a string) to an ISO date string.
 *
 * The LogicBoxes API returns dates as string-encoded epoch seconds.
 * Returns the raw value unchanged if it cannot be parsed.
 */
function epochToIso(epoch: string | undefined): string {
  if (!epoch) return 'N/A';
  const ms = parseInt(epoch, 10) * 1000;
  if (isNaN(ms)) return epoch;
  return new Date(ms).toISOString().split('T')[0];
}

/**
 * Registers domain management tools on the given MCP server instance.
 *
 * Tools registered:
 * - `list_domains`       -- Search/list domains with optional filters.
 * - `get_domain`         -- Get full domain details by order ID or domain name.
 * - `get_domain_order_id` -- Look up the order ID for a domain name.
 *
 * @param server    - The MCP server to register tools on.
 * @param domainApi - The domain API instance for making LogicBoxes calls.
 */
export function registerDomainTools(server: McpServer, domainApi: DomainApi): void {

  // ---------------------------------------------------------------------------
  // list_domains
  // ---------------------------------------------------------------------------

  server.tool(
    'list_domains',
    'Search and list domains under the reseller account with optional filters. Returns a paginated table of domains with order ID, name, status, and expiry date.',
    {
      pageNo: z.number().optional().describe('Page number, starting from 1 (default 1)'),
      noOfRecords: z.number().min(10).max(500).optional().describe('Results per page (10-500, default 25)'),
      customerId: z.string().optional().describe('Filter by customer ID to show only that customer\'s domains'),
      domainName: z.string().optional().describe('Filter by domain name (partial match supported)'),
      status: z.string().optional().describe('Filter by domain status: Active, InActive, Deleted, Archived, etc.'),
    },
    async (args) => {
      try {
        const { domains, total } = await domainApi.search({
          pageNo: args.pageNo,
          noOfRecords: args.noOfRecords,
          customerId: args.customerId !== undefined ? Number(args.customerId) : undefined,
          domainName: args.domainName,
          status: args.status,
        });

        if (domains.length === 0) {
          return {
            content: [{ type: 'text' as const, text: 'No domains found matching the given filters.' }],
          };
        }

        const header = `Found ${total} domain(s):\n`;
        const divider = '-'.repeat(90) + '\n';
        const columnHeader =
          'Order ID'.padEnd(14) +
          'Domain Name'.padEnd(32) +
          'Status'.padEnd(14) +
          'Expiry Date' + '\n';

        const rows = domains.map((d) =>
          (d.orderid ?? '').padEnd(14) +
          (d.domainname ?? '').padEnd(32) +
          (d.currentstatus ?? '').padEnd(14) +
          epochToIso(d.endtime)
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
  // get_domain
  // ---------------------------------------------------------------------------

  server.tool(
    'get_domain',
    'Get detailed domain information by order ID or domain name. Returns registration dates, nameservers, status, and contact details. Provide either orderId or domainName.',
    {
      orderId: z.string().optional().describe('Domain order ID. Provide either orderId or domainName.'),
      domainName: z.string().optional().describe('Domain name (e.g. "example.com"). Provide either orderId or domainName.'),
    },
    async (args) => {
      try {
        if (args.orderId === undefined && args.domainName === undefined) {
          return {
            content: [{ type: 'text' as const, text: 'Error: At least one of orderId or domainName must be provided.' }],
            isError: true,
          };
        }

        const details = args.orderId !== undefined
          ? await domainApi.getDetails(args.orderId)
          : await domainApi.getDetailsByName(args.domainName!);

        const nameservers = [details.ns1, details.ns2, details.ns3, details.ns4]
          .filter(Boolean)
          .join(', ') || 'N/A';

        const lines = [
          `Domain Details`,
          '-'.repeat(50),
          `Name:          ${details.domainname}`,
          `Order ID:      ${details.orderid}`,
          `Status:        ${details.currentstatus}`,
          `Created:       ${epochToIso(details.creationtime)}`,
          `Expires:       ${epochToIso(details.endtime)}`,
          `Nameservers:   ${nameservers}`,
          `Customer ID:   ${details.customerid}`,
          `Auto-Renew:    ${details.autorenew ?? 'N/A'}`,
          ``,
          `Contacts`,
          '-'.repeat(50),
          `Registrant:    ${details.registrantcontact ?? 'N/A'}`,
          `Admin:         ${details.admincontact ?? 'N/A'}`,
          `Tech:          ${details.techcontact ?? 'N/A'}`,
          `Billing:       ${details.billingcontact ?? 'N/A'}`,
        ];

        return { content: [{ type: 'text' as const, text: lines.join('\n') }] };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
      }
    },
  );

  // ---------------------------------------------------------------------------
  // get_domain_order_id
  // ---------------------------------------------------------------------------

  server.tool(
    'get_domain_order_id',
    'Look up the order ID for a domain by its fully qualified domain name. Use this when you have a domain name and need the order ID for other API calls.',
    {
      domainName: z.string().describe('Fully qualified domain name (e.g. "example.com")'),
    },
    async (args) => {
      try {
        const orderId = await domainApi.getOrderId(args.domainName);

        return {
          content: [{ type: 'text' as const, text: `Order ID for ${args.domainName}: ${orderId}` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { content: [{ type: 'text' as const, text: `Error: ${message}` }], isError: true };
      }
    },
  );
}
