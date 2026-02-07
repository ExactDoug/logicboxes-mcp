/**
 * DNS management tools for the MCP server.
 *
 * Registers tool handlers for listing, adding, updating, deleting, and
 * activating DNS records via the LogicBoxes API.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DnsApi } from '../../api/dns.js';
import type { DnsRecordType } from '../../api/types.js';

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

/** All standard DNS record types (used for search tools). */
const allRecordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'SOA'] as const;

/** Mutable record types -- SOA cannot be added, updated, or deleted directly. */
const mutableRecordTypes = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV'] as const;

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats an array of DNS records into a readable text table.
 *
 * Columns: Type, Host, Value, TTL, and (where applicable) Priority, Port, Weight.
 */
function formatRecordsTable(records: Array<Record<string, unknown>>): string {
  if (records.length === 0) {
    return 'No records found.';
  }

  // Determine which optional columns are present.
  const hasPriority = records.some((r) => r.priority !== undefined);
  const hasPort = records.some((r) => r.port !== undefined);
  const hasWeight = records.some((r) => r.weight !== undefined);

  // Build header.
  const columns = ['Type', 'Host', 'Value', 'TTL'];
  if (hasPriority) columns.push('Priority');
  if (hasPort) columns.push('Port');
  if (hasWeight) columns.push('Weight');

  // Collect rows as string arrays.
  const rows: string[][] = records.map((r) => {
    const row = [
      String(r.type ?? ''),
      String(r.host ?? ''),
      String(r.value ?? ''),
      String(r.ttl ?? ''),
    ];
    if (hasPriority) row.push(String(r.priority ?? ''));
    if (hasPort) row.push(String(r.port ?? ''));
    if (hasWeight) row.push(String(r.weight ?? ''));
    return row;
  });

  // Calculate column widths.
  const widths = columns.map((col, i) =>
    Math.max(col.length, ...rows.map((row) => row[i].length)),
  );

  // Build output.
  const header = columns.map((col, i) => col.padEnd(widths[i])).join('  ');
  const separator = widths.map((w) => '-'.repeat(w)).join('  ');
  const body = rows
    .map((row) => row.map((cell, i) => cell.padEnd(widths[i])).join('  '))
    .join('\n');

  return `${header}\n${separator}\n${body}`;
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

/**
 * Registers all DNS management tools on the given MCP server instance.
 *
 * @param server - The MCP server to register tools on.
 * @param dnsApi - The DNS API client instance.
 */
export function registerDnsTools(server: McpServer, dnsApi: DnsApi): void {
  // -----------------------------------------------------------------------
  // list_dns_records
  // -----------------------------------------------------------------------

  server.tool(
    'list_dns_records',
    'Search DNS records for a domain, filtered by record type and optional host/value. Returns a paginated table of matching records.',
    {
      domainName: z.string().describe('Fully qualified domain name (e.g. "example.com")'),
      type: z.enum(allRecordTypes).describe('DNS record type to search for'),
      host: z.string().optional().describe('Filter by hostname/subdomain (e.g. "www", "mail")'),
      value: z.string().optional().describe('Filter by record value (e.g. IP address, hostname)'),
      pageNo: z.number().optional().describe('Page number, starting from 1 (default 1)'),
    },
    async ({ domainName, type, host, value, pageNo }) => {
      try {
        const result = await dnsApi.searchRecords({
          domainName,
          type: type as DnsRecordType,
          host,
          value,
          pageNo,
        });

        const table = formatRecordsTable(result.records as unknown as Array<Record<string, unknown>>);
        const text = `Found ${result.total} ${type} record(s) for ${domainName}\n\n${table}`;

        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // -----------------------------------------------------------------------
  // list_all_dns_records
  // -----------------------------------------------------------------------

  server.tool(
    'list_all_dns_records',
    'Get ALL DNS records for a domain across every record type (A, AAAA, CNAME, MX, TXT, NS, SRV, SOA). Returns records grouped by type. Use this to see the complete DNS zone.',
    {
      domainName: z.string().describe('Fully qualified domain name (e.g. "example.com")'),
    },
    async ({ domainName }) => {
      try {
        const result = await dnsApi.searchAllRecords(domainName);

        // Group records by type.
        const grouped: Record<string, Array<Record<string, unknown>>> = {};
        for (const record of result.records as unknown as Array<Record<string, unknown>>) {
          const rtype = String(record.type ?? 'UNKNOWN');
          if (!grouped[rtype]) {
            grouped[rtype] = [];
          }
          grouped[rtype].push(record);
        }

        // Build output with a section per type.
        const sections: string[] = [];
        for (const [rtype, records] of Object.entries(grouped)) {
          sections.push(`--- ${rtype} Records (${records.length}) ---\n${formatRecordsTable(records)}`);
        }

        const text =
          `Total: ${result.total} record(s) for ${domainName}\n\n` +
          (sections.length > 0 ? sections.join('\n\n') : 'No records found.');

        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // -----------------------------------------------------------------------
  // add_dns_record
  // -----------------------------------------------------------------------

  server.tool(
    'add_dns_record',
    'Add a new DNS record to a domain zone. Supports A, AAAA, CNAME, MX, TXT, NS, and SRV records (SOA records cannot be added).',
    {
      domainName: z.string().describe('Fully qualified domain name (e.g. "example.com")'),
      type: z.enum(mutableRecordTypes).describe('DNS record type to add'),
      host: z.string().describe('Hostname / subdomain (use "@" for zone apex)'),
      value: z.string().describe('Record value (IP address, hostname, TXT content, etc.)'),
      ttl: z.number().min(7200).default(14400).describe('Time-to-live in seconds (minimum 7200)'),
      priority: z.number().optional().describe('Priority (required for MX and SRV records)'),
      port: z.number().optional().describe('Port number (required for SRV records)'),
      weight: z.number().optional().describe('Relative weight (required for SRV records)'),
    },
    async ({ domainName, type, host, value, ttl, priority, port, weight }) => {
      try {
        await dnsApi.addRecord(type as DnsRecordType, {
          domainName,
          host,
          value,
          ttl,
          priority,
          port,
          weight,
        });

        const text = `Successfully added ${type} record for ${domainName}:\n` +
          `  Host:  ${host}\n` +
          `  Value: ${value}\n` +
          `  TTL:   ${ttl}` +
          (priority !== undefined ? `\n  Priority: ${priority}` : '') +
          (port !== undefined ? `\n  Port: ${port}` : '') +
          (weight !== undefined ? `\n  Weight: ${weight}` : '');

        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // -----------------------------------------------------------------------
  // update_dns_record
  // -----------------------------------------------------------------------

  server.tool(
    'update_dns_record',
    'Update an existing DNS record in a domain zone. Identifies the record by host + currentValue, then replaces the value. SOA records cannot be updated.',
    {
      domainName: z.string().describe('Fully qualified domain name (e.g. "example.com")'),
      type: z.enum(mutableRecordTypes).describe('DNS record type to update'),
      host: z.string().describe('Hostname / subdomain of the record to update'),
      currentValue: z.string().describe('Current record value (identifies which record to update)'),
      newValue: z.string().describe('New record value to replace the current one'),
      ttl: z.number().min(7200).default(14400).describe('Time-to-live in seconds (minimum 7200)'),
      priority: z.number().optional().describe('Priority (for MX and SRV records)'),
      port: z.number().optional().describe('Port number (for SRV records)'),
      weight: z.number().optional().describe('Relative weight (for SRV records)'),
    },
    async ({ domainName, type, host, currentValue, newValue, ttl, priority, port, weight }) => {
      try {
        await dnsApi.updateRecord(type as DnsRecordType, {
          domainName,
          host,
          currentValue,
          newValue,
          ttl,
          priority,
          port,
          weight,
        });

        const text = `Successfully updated ${type} record for ${domainName}:\n` +
          `  Host:      ${host}\n` +
          `  Old Value: ${currentValue}\n` +
          `  New Value: ${newValue}\n` +
          `  TTL:       ${ttl}` +
          (priority !== undefined ? `\n  Priority: ${priority}` : '') +
          (port !== undefined ? `\n  Port: ${port}` : '') +
          (weight !== undefined ? `\n  Weight: ${weight}` : '');

        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // -----------------------------------------------------------------------
  // delete_dns_record
  // -----------------------------------------------------------------------

  server.tool(
    'delete_dns_record',
    'Delete a DNS record from a domain zone. Identifies the record by host + value. SOA records cannot be deleted.',
    {
      domainName: z.string().describe('Fully qualified domain name (e.g. "example.com")'),
      type: z.enum(mutableRecordTypes).describe('DNS record type to delete'),
      host: z.string().describe('Hostname / subdomain of the record to delete'),
      value: z.string().describe('Record value (identifies which record to delete)'),
      port: z.number().optional().describe('Port number (required for SRV records)'),
      weight: z.number().optional().describe('Relative weight (required for SRV records)'),
    },
    async ({ domainName, type, host, value, port, weight }) => {
      try {
        await dnsApi.deleteRecord(type as DnsRecordType, {
          domainName,
          host,
          value,
          port,
          weight,
        });

        const text = `Successfully deleted ${type} record from ${domainName}:\n` +
          `  Host:  ${host}\n` +
          `  Value: ${value}` +
          (port !== undefined ? `\n  Port: ${port}` : '') +
          (weight !== undefined ? `\n  Weight: ${weight}` : '');

        return {
          content: [{ type: 'text' as const, text }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );

  // -----------------------------------------------------------------------
  // activate_dns
  // -----------------------------------------------------------------------

  server.tool(
    'activate_dns',
    'Activate DNS hosting for a domain order. Must be called after purchasing DNS hosting before DNS records can be managed.',
    {
      orderId: z.string().describe('Order ID for the DNS hosting product'),
    },
    async ({ orderId }) => {
      try {
        await dnsApi.activateDns(orderId);

        return {
          content: [{ type: 'text' as const, text: `Successfully activated DNS for order ${orderId}.` }],
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return {
          content: [{ type: 'text' as const, text: `Error: ${message}` }],
          isError: true,
        };
      }
    },
  );
}
