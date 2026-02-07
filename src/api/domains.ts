/**
 * Domain management API module for the LogicBoxes reseller API.
 *
 * Provides methods for searching, retrieving details, and looking up
 * order IDs for domain registrations.
 *
 * @see https://manage.logicboxes.com/kb/answer/764
 */

import { LogicBoxesClient } from './client.js';
import { Domain, DomainDetails, DomainSearchParams } from './types.js';

/**
 * API wrapper for LogicBoxes domain management endpoints.
 *
 * All methods use HTTP GET — LogicBoxes domain read endpoints are GET-based.
 *
 * @example
 * ```ts
 * const client = new LogicBoxesClient({ authUserId: '...', apiKey: '...' });
 * const domainApi = new DomainApi(client);
 *
 * const { domains, total } = await domainApi.search({ status: 'Active' });
 * const details = await domainApi.getDetails(domains[0].orderid, 'All');
 * ```
 */
export class DomainApi {
  constructor(private client: LogicBoxesClient) {}

  /**
   * Parses the raw LogicBoxes domain search response into a structured result.
   *
   * The API returns domain entries under numbered string keys ("1", "2", etc.),
   * where each entry is an object with dotted-prefix key names such as
   * `orders.orderid` and `entity.domainname`. This method strips the prefix
   * from each key and maps the entries to {@link Domain} objects.
   *
   * @param raw - The raw API response object.
   * @returns Parsed domains array with pagination metadata.
   */
  private parseSearchResponse(
    raw: Record<string, unknown>,
  ): { domains: Domain[]; total: number; pageSize: number } {
    const domains: Domain[] = [];

    for (const key of Object.keys(raw)) {
      const entry = raw[key];
      if (typeof entry !== 'object' || entry === null) {
        continue;
      }

      // Each numbered key contains a record with dotted-prefix keys.
      const record = entry as Record<string, unknown>;
      const domain: Record<string, unknown> = {};

      for (const [dottedKey, value] of Object.entries(record)) {
        // Strip everything before and including the first dot.
        const dotIndex = dottedKey.indexOf('.');
        const cleanKey = dotIndex >= 0 ? dottedKey.slice(dotIndex + 1) : dottedKey;
        domain[cleanKey] = value;
      }

      // The search API returns the domain name under `entity.description`,
      // which becomes `description` after prefix stripping. Map it to
      // `domainname` so the result conforms to the Domain interface.
      if (domain.description && !domain.domainname) {
        domain.domainname = domain.description;
      }

      domains.push(domain as unknown as Domain);
    }

    const total = parseInt(String(raw.recsindb ?? '0'), 10);
    const pageSize = parseInt(String(raw.recsonpage ?? '0'), 10);

    return { domains, total, pageSize };
  }

  /**
   * Searches for domains under the reseller account.
   *
   * @param params - Optional search filters and pagination settings.
   * @returns An object containing the matched domains, total count, and page size.
   *
   * @example
   * ```ts
   * // List first 25 active domains
   * const result = await domainApi.search({ status: 'Active' });
   * console.log(`Found ${result.total} active domains`);
   *
   * // Paginate through results
   * const page2 = await domainApi.search({ pageNo: 2, noOfRecords: 50 });
   * ```
   */
  async search(
    params?: DomainSearchParams,
  ): Promise<{ domains: Domain[]; total: number; pageSize: number }> {
    const raw = await this.client.get<Record<string, unknown>>(
      'domains/search.json',
      {
        'no-of-records': params?.noOfRecords ?? 25,
        'page-no': params?.pageNo ?? 1,
        'customer-id': params?.customerId,
        'domain-name': params?.domainName,
        'status': params?.status,
      },
    );

    return this.parseSearchResponse(raw);
  }

  /**
   * Retrieves detailed information for a domain by its order ID.
   *
   * @param orderId - The unique order identifier for the domain registration.
   * @param options - Optional detail level: "All", "NsDetails", "ContactIds", etc.
   * @returns The full domain details record.
   *
   * @example
   * ```ts
   * const details = await domainApi.getDetails('12345678', 'All');
   * console.log(details.domainname, details.ns1, details.ns2);
   * ```
   */
  async getDetails(orderId: string, options: string = 'All'): Promise<DomainDetails> {
    return this.client.get<DomainDetails>('domains/details.json', {
      'order-id': orderId,
      'options': options,
    });
  }

  /**
   * Retrieves detailed information for a domain by its fully qualified name.
   *
   * @param domainName - The fully qualified domain name (e.g. "example.com").
   * @param options - Optional detail level: "All", "NsDetails", "ContactIds", etc.
   * @returns The full domain details record.
   *
   * @example
   * ```ts
   * const details = await domainApi.getDetailsByName('example.com', 'All');
   * console.log(details.orderid, details.currentstatus);
   * ```
   */
  async getDetailsByName(
    domainName: string,
    options: string = 'All',
  ): Promise<DomainDetails> {
    return this.client.get<DomainDetails>('domains/details-by-name.json', {
      'domain-name': domainName,
      'options': options,
    });
  }

  /**
   * Looks up the order ID for a domain by its fully qualified name.
   *
   * @param domainName - The fully qualified domain name (e.g. "example.com").
   * @returns The order ID as a string.
   *
   * @example
   * ```ts
   * const orderId = await domainApi.getOrderId('example.com');
   * const details = await domainApi.getDetails(orderId, 'All');
   * ```
   */
  async getOrderId(domainName: string): Promise<string> {
    const raw = await this.client.get<unknown>('domains/orderid.json', {
      'domain-name': domainName,
    });

    return String(raw);
  }
}
