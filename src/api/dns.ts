/**
 * DNS record management API module for the LogicBoxes platform.
 *
 * Provides methods for searching, adding, updating, and deleting DNS records
 * within a domain's zone, as well as SOA record management and DNS activation.
 *
 * @see https://manage.logicboxes.com/kb/answer/744
 */

import { LogicBoxesClient } from './client.js';
import {
  DnsRecord,
  DnsRecordType,
  DnsSearchParams,
  DnsSearchResponse,
  AddDnsRecordParams,
  UpdateDnsRecordParams,
  UpdateSoaParams,
  DeleteDnsRecordParams,
  DNS_RECORD_TYPE_MAP,
  MIN_TTL,
  PaginatedResponse,
} from './types.js';
import { ValidationError } from './errors.js';

/**
 * DNS record management API.
 *
 * Wraps the LogicBoxes DNS endpoints for searching, adding, updating,
 * and deleting DNS records within a domain's hosted zone.
 */
export class DnsApi {
  constructor(private client: LogicBoxesClient) {}

  /**
   * Maps a user-facing DNS record type to the API URL segment.
   *
   * @param type - The DNS record type (e.g. 'A', 'AAAA', 'CNAME').
   * @returns The API URL segment (e.g. 'ipv4', 'ipv6', 'cname').
   */
  private getApiType(type: DnsRecordType): string {
    return DNS_RECORD_TYPE_MAP[type];
  }

  /**
   * Validates that a TTL value meets the minimum requirement.
   *
   * @param ttl - Time-to-live value in seconds.
   * @throws {ValidationError} If ttl is less than MIN_TTL (7200).
   */
  private validateTtl(ttl: number): void {
    if (ttl < MIN_TTL) {
      throw new ValidationError(
        `TTL must be at least ${MIN_TTL} seconds, got ${ttl}`,
      );
    }
  }

  /**
   * Parses the raw API search response into a structured result.
   *
   * The LogicBoxes search endpoint returns records under numbered string keys
   * ("1", "2", etc.) alongside pagination metadata ("recsindb", "recsonpage").
   *
   * @param raw - The raw API response object.
   * @returns Parsed records array with total count and page size.
   */
  private parseSearchResponse(
    raw: Record<string, unknown>,
  ): { records: DnsRecord[]; total: number; pageSize: number } {
    const records: DnsRecord[] = [];

    for (const key of Object.keys(raw)) {
      const value = raw[key];
      if (
        typeof value === 'object' &&
        value !== null &&
        'host' in (value as Record<string, unknown>)
      ) {
        records.push(value as DnsRecord);
      }
    }

    const total = parseInt(String(raw['recsindb'] ?? '0'), 10);
    const pageSize = parseInt(String(raw['recsonpage'] ?? '0'), 10);

    return { records, total, pageSize };
  }

  /**
   * Searches DNS records within a domain's zone.
   *
   * @param params - Search parameters including domain name and optional filters.
   * @returns Matching DNS records with pagination metadata.
   */
  async searchRecords(
    params: DnsSearchParams,
  ): Promise<{ records: DnsRecord[]; total: number; pageSize: number }> {
    const queryParams: Record<string, string | number> = {
      'domain-name': params.domainName,
      'type': params.type,
      'no-of-records': params.noOfRecords ?? 50,
      'page-no': params.pageNo ?? 1,
    };

    if (params.host !== undefined) {
      queryParams['host'] = params.host;
    }
    if (params.value !== undefined) {
      queryParams['value'] = params.value;
    }

    const raw = await this.client.get(
      'dns/manage/search-records.json',
      queryParams,
    );

    return this.parseSearchResponse(raw as Record<string, unknown>);
  }

  /**
   * Search ALL record types for a domain.
   *
   * Makes one API call per record type and merges results. Handles pagination
   * internally for each type. Useful for backup/export operations.
   *
   * @param domainName - Fully qualified domain name to search.
   * @returns All DNS records across every record type, with a total count.
   */
  async searchAllRecords(
    domainName: string,
  ): Promise<{ records: DnsRecord[]; total: number }> {
    const allTypes: DnsRecordType[] = [
      'A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SRV', 'SOA',
    ];
    const allRecords: DnsRecord[] = [];

    for (const type of allTypes) {
      try {
        let pageNo = 1;
        let hasMore = true;
        while (hasMore) {
          const result = await this.searchRecords({
            domainName,
            type,
            noOfRecords: 50,
            pageNo,
          });
          allRecords.push(...result.records);
          hasMore = result.total > pageNo * 50;
          pageNo++;
        }
      } catch (error) {
        // Some record types may have no records -- that's OK, skip them.
        // But re-throw if it's not a "no records" type error.
        if (
          error instanceof Error &&
          (error.message.includes('No records found') ||
            error.message.includes('No Entity found') ||
            error.message.includes('not found'))
        ) {
          continue;
        }
        throw error;
      }
    }

    return { records: allRecords, total: allRecords.length };
  }

  /**
   * Adds a new DNS record to a domain's zone.
   *
   * SOA records cannot be added -- they are created automatically and can
   * only be updated via {@link updateSoa}.
   *
   * @param type - The DNS record type to add.
   * @param params - Record parameters including domain, host, value, and TTL.
   * @returns The raw API response.
   * @throws {ValidationError} If type is SOA, TTL is below minimum, or
   *   required fields for MX/SRV records are missing.
   */
  async addRecord(
    type: DnsRecordType,
    params: AddDnsRecordParams,
  ): Promise<Record<string, unknown>> {
    if (type === 'SOA') {
      throw new ValidationError(
        'SOA records cannot be added; use updateSoa() to update the existing SOA record',
      );
    }

    this.validateTtl(params.ttl);

    const apiType = this.getApiType(type);
    const requestParams: Record<string, string | number> = {
      'domain-name': params.domainName,
      'host': params.host,
      'value': params.value,
      'ttl': params.ttl,
    };

    if (type === 'MX' || type === 'SRV') {
      if (params.priority === undefined) {
        throw new ValidationError(
          `Priority is required for ${type} records`,
        );
      }
      requestParams['priority'] = params.priority;
    }

    if (type === 'SRV') {
      if (params.port === undefined) {
        throw new ValidationError('Port is required for SRV records');
      }
      if (params.weight === undefined) {
        throw new ValidationError('Weight is required for SRV records');
      }
      requestParams['port'] = params.port;
      requestParams['weight'] = params.weight;
    }

    return await this.client.post(
      `dns/manage/add-${apiType}-record.json`,
      requestParams,
    ) as Record<string, unknown>;
  }

  /**
   * Updates an existing DNS record in a domain's zone.
   *
   * The LogicBoxes API performs atomic updates: the caller must specify both
   * the current value (to identify the record) and the new value.
   *
   * SOA records cannot be updated with this method -- use {@link updateSoa}.
   *
   * @param type - The DNS record type to update.
   * @param params - Update parameters including current and new values.
   * @returns The raw API response.
   * @throws {ValidationError} If type is SOA or TTL is below minimum.
   */
  async updateRecord(
    type: DnsRecordType,
    params: UpdateDnsRecordParams,
  ): Promise<Record<string, unknown>> {
    if (type === 'SOA') {
      throw new ValidationError(
        'SOA records cannot be updated with updateRecord(); use updateSoa() instead',
      );
    }

    this.validateTtl(params.ttl);

    const apiType = this.getApiType(type);
    const requestParams: Record<string, string | number> = {
      'domain-name': params.domainName,
      'host': params.host,
      'current-value': params.currentValue,
      'new-value': params.newValue,
      'ttl': params.ttl,
    };

    if (type === 'MX' || type === 'SRV') {
      if (params.priority !== undefined) {
        requestParams['priority'] = params.priority;
      }
    }

    if (type === 'SRV') {
      if (params.port !== undefined) {
        requestParams['port'] = params.port;
      }
      if (params.weight !== undefined) {
        requestParams['weight'] = params.weight;
      }
    }

    return await this.client.post(
      `dns/manage/update-${apiType}-record.json`,
      requestParams,
    ) as Record<string, unknown>;
  }

  /**
   * Updates the SOA (Start of Authority) record for a domain's zone.
   *
   * There is exactly one SOA record per zone. This endpoint updates its
   * timing parameters and responsible-person field.
   *
   * @param params - SOA update parameters.
   * @returns The raw API response.
   */
  async updateSoa(
    params: UpdateSoaParams,
  ): Promise<Record<string, unknown>> {
    const requestParams: Record<string, string | number> = {
      'domain-name': params.domainName,
      'responsible-person': params.responsiblePerson,
      'refresh': params.refresh,
      'retry': params.retry,
      'expire': params.expire,
      'ttl': params.ttl,
    };

    return await this.client.post(
      'dns/manage/update-soa-record.json',
      requestParams,
    ) as Record<string, unknown>;
  }

  /**
   * Deletes a DNS record from a domain's zone.
   *
   * SOA records cannot be deleted -- there must always be exactly one per zone.
   *
   * @param type - The DNS record type to delete.
   * @param params - Delete parameters identifying the record to remove.
   * @returns The raw API response.
   * @throws {ValidationError} If type is SOA, or if port/weight are missing
   *   for SRV records.
   */
  async deleteRecord(
    type: DnsRecordType,
    params: DeleteDnsRecordParams,
  ): Promise<Record<string, unknown>> {
    if (type === 'SOA') {
      throw new ValidationError('SOA records cannot be deleted');
    }

    const apiType = this.getApiType(type);
    const requestParams: Record<string, string | number> = {
      'domain-name': params.domainName,
      'host': params.host,
      'value': params.value,
    };

    if (type === 'SRV') {
      if (params.port === undefined) {
        throw new ValidationError('Port is required when deleting SRV records');
      }
      if (params.weight === undefined) {
        throw new ValidationError(
          'Weight is required when deleting SRV records',
        );
      }
      requestParams['port'] = params.port;
      requestParams['weight'] = params.weight;
    }

    return await this.client.post(
      `dns/manage/delete-${apiType}-record.json`,
      requestParams,
    ) as Record<string, unknown>;
  }

  /**
   * Activates DNS hosting for a domain order.
   *
   * This must be called after purchasing DNS hosting to enable DNS management
   * for the domain.
   *
   * @param orderId - The order ID for the DNS hosting product.
   * @returns The raw API response.
   */
  async activateDns(
    orderId: string,
  ): Promise<Record<string, unknown>> {
    return await this.client.post('dns/activate.json', {
      'order-id': orderId,
    }) as Record<string, unknown>;
  }
}
