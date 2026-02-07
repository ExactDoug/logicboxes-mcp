// Core client
export { LogicBoxesClient } from './client.js';

// API modules
export { DnsApi } from './dns.js';
export { CustomerApi } from './customers.js';
export { DomainApi } from './domains.js';

// Types
export type {
  LogicBoxesConfig,
  ApiResponse,
  DnsRecord,
  DnsRecordType,
  DnsRecordApiType,
  DnsSearchParams,
  DnsSearchResponse,
  AddDnsRecordParams,
  UpdateDnsRecordParams,
  UpdateSoaParams,
  DeleteDnsRecordParams,
  Customer,
  CustomerDetails,
  CustomerSearchParams,
  Domain,
  DomainDetails,
  DomainSearchParams,
  PaginationParams,
  PaginatedResponse,
} from './types.js';

// Constants
export {
  DEFAULT_BASE_URL,
  TEST_BASE_URL,
  MIN_TTL,
  DEFAULT_TIMEOUT,
  DNS_RECORD_TYPE_MAP,
} from './types.js';

// Errors
export {
  LogicBoxesError,
  AuthenticationError,
  NotFoundError,
  ValidationError,
  ApiError,
  createErrorFromResponse,
} from './errors.js';
export type { LogicBoxesErrorOptions } from './errors.js';
