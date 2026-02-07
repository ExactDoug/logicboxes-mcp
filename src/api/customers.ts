/**
 * Customer management API module for the LogicBoxes reseller API.
 *
 * Provides methods for retrieving customer details (by username or ID)
 * and searching across all customers under the reseller account.
 */

import { LogicBoxesClient } from './client.js';
import { Customer, CustomerDetails, CustomerSearchParams } from './types.js';

/**
 * Wraps LogicBoxes customer endpoints behind a typed interface.
 *
 * All methods use GET requests — the customer API is read-only for
 * these operations.
 */
export class CustomerApi {
  constructor(private client: LogicBoxesClient) {}

  /**
   * Parses the numbered-key search response format returned by the
   * LogicBoxes `customers/search.json` endpoint.
   *
   * The API returns each customer under a numbered string key ("1", "2", ...)
   * with dotted-prefix property names (e.g. `customer.customerid`).
   * This method normalises those into flat {@link Customer} objects.
   *
   * @param raw - The raw API response object.
   * @returns An object containing the parsed customer array and pagination info.
   */
  private parseSearchResponse(
    raw: Record<string, unknown>,
  ): { customers: Customer[]; total: number; pageSize: number } {
    const customers: Customer[] = [];

    for (const key of Object.keys(raw)) {
      const entry = raw[key];
      if (typeof entry !== 'object' || entry === null) {
        continue;
      }

      const record = entry as Record<string, unknown>;

      customers.push({
        customerid: String(record['customer.customerid'] ?? ''),
        username: String(record['customer.username'] ?? ''),
        name: String(record['customer.name'] ?? ''),
        company: String(record['customer.company'] ?? ''),
        city: String(record['customer.city'] ?? ''),
        state: String(record['customer.state'] ?? ''),
        country: String(record['customer.country'] ?? ''),
        customerstatus: String(record['customer.customerstatus'] ?? ''),
        totalreceipts: String(record['customer.totalreceipts'] ?? ''),
        websitecount: record['customer.websitecount'] !== undefined
          ? String(record['customer.websitecount'])
          : undefined,
      });
    }

    const total = parseInt(String(raw['recsindb'] ?? '0'), 10);
    const pageSize = parseInt(String(raw['recsonpage'] ?? '0'), 10);

    return { customers, total, pageSize };
  }

  /**
   * Retrieves full customer details by email address (username).
   *
   * @param username - The customer's email address used as their login.
   * @returns The full customer details record.
   * @throws {NotFoundError} If no customer exists with the given username.
   */
  async getByUsername(username: string): Promise<CustomerDetails> {
    return this.client.get<CustomerDetails>('customers/details.json', {
      username,
    });
  }

  /**
   * Retrieves full customer details by numeric customer ID.
   *
   * @param customerId - The unique customer identifier.
   * @returns The full customer details record.
   * @throws {NotFoundError} If no customer exists with the given ID.
   */
  async getById(customerId: number): Promise<CustomerDetails> {
    return this.client.get<CustomerDetails>('customers/details-by-id.json', {
      'customer-id': customerId,
    });
  }

  /**
   * Searches for customers under the reseller account.
   *
   * All filter parameters are optional. When omitted, returns up to 25
   * customers from the first page.
   *
   * @param params - Optional search filters and pagination options.
   * @returns Matching customers with pagination metadata.
   */
  async search(
    params?: CustomerSearchParams,
  ): Promise<{ customers: Customer[]; total: number; pageSize: number }> {
    const raw = await this.client.get<Record<string, unknown>>(
      'customers/search.json',
      {
        'no-of-records': params?.noOfRecords ?? 25,
        'page-no': params?.pageNo ?? 1,
        'customer-id': params?.customerId,
        username: params?.username,
        name: params?.name,
        company: params?.company,
        city: params?.city,
        state: params?.state,
        status: params?.status,
      },
    );

    return this.parseSearchResponse(raw);
  }
}
