/**
 * TypeScript type definitions for the LogicBoxes HTTP API client.
 *
 * All types mirror the LogicBoxes RESTful API conventions:
 * - Most numeric values are returned as strings by the API.
 * - Pagination is 1-based.
 * - DNS record mutations are atomic (old + new value required for updates).
 *
 * @see https://manage.logicboxes.com/kb/answer/744
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Production API base URL. */
export const DEFAULT_BASE_URL = 'https://httpapi.com/api/' as const;

/** OTE (Order Test Environment) API base URL for sandbox testing. */
export const TEST_BASE_URL = 'https://test.httpapi.com/api/' as const;

/** Minimum allowed TTL value in seconds (2 hours). */
export const MIN_TTL = 7200 as const;

/** Default HTTP request timeout in milliseconds (30 seconds). */
export const DEFAULT_TIMEOUT = 30000 as const;

/**
 * Maps user-facing DNS record type names to the API URL segment names
 * used in LogicBoxes REST endpoints.
 *
 * @example
 * ```ts
 * const apiType = DNS_RECORD_TYPE_MAP['A']; // 'ipv4'
 * ```
 */
export const DNS_RECORD_TYPE_MAP: Readonly<Record<DnsRecordType, DnsRecordApiType>> = {
    A: 'ipv4',
    AAAA: 'ipv6',
    CNAME: 'cname',
    MX: 'mx',
    TXT: 'txt',
    NS: 'ns',
    SRV: 'srv',
    SOA: 'soa',
} as const;

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Configuration required to initialise the LogicBoxes API client.
 *
 * The `authUserId` and `apiKey` are mandatory credentials obtained from the
 * LogicBoxes reseller control panel.
 */
export interface LogicBoxesConfig {
    /** Reseller or account ID used for authentication. */
    authUserId: string;

    /** API key associated with the reseller account. */
    apiKey: string;

    /**
     * Base URL for API requests.
     * @default 'https://httpapi.com/api/'
     */
    baseUrl?: string;

    /**
     * HTTP request timeout in milliseconds.
     * @default 30000
     */
    timeout?: number;
}

// ---------------------------------------------------------------------------
// Generic API Primitives
// ---------------------------------------------------------------------------

/**
 * Generic wrapper for raw API responses.
 *
 * The LogicBoxes API returns varied JSON shapes depending on the endpoint,
 * so this type uses an index signature to accommodate any structure.
 */
export interface ApiResponse {
    [key: string]: unknown;
}

/**
 * Standard pagination parameters accepted by list/search endpoints.
 */
export interface PaginationParams {
    /** Number of records to return per page. */
    noOfRecords: number;

    /** Page number (1-based). */
    pageNo: number;
}

/**
 * Pagination metadata returned by the API in paginated responses.
 *
 * Note: the API returns both counts as strings, not numbers.
 */
export interface PaginatedResponse {
    /** Total number of matching records in the database (returned as string). */
    recsindb: string;

    /** Number of records on the current page (returned as string). */
    recsonpage: string;
}

// ---------------------------------------------------------------------------
// DNS Record Types
// ---------------------------------------------------------------------------

/**
 * Standard DNS record type names as used in search/display contexts.
 */
export type DnsRecordType = 'A' | 'AAAA' | 'CNAME' | 'MX' | 'TXT' | 'NS' | 'SRV' | 'SOA';

/**
 * API URL segment names that LogicBoxes uses internally to identify
 * record types in REST endpoint paths.
 *
 * @example The endpoint for A records uses `dns/manage/add-ipv4-record.json`.
 */
export type DnsRecordApiType = 'ipv4' | 'ipv6' | 'cname' | 'mx' | 'txt' | 'ns' | 'srv' | 'soa';

/**
 * A single DNS record as returned from the LogicBoxes search endpoint.
 *
 * All values are strings because the API serialises everything as strings,
 * including numeric fields like TTL and priority.
 */
export interface DnsRecord {
    /** Hostname / subdomain (e.g. "www", "@" for zone apex). */
    host: string;

    /** Record value — IP address, hostname, TXT content, etc. */
    value: string;

    /** Time-to-live in seconds (returned as string by the API). */
    ttl: string;

    /** DNS record type: A, AAAA, CNAME, MX, TXT, NS, SRV, or SOA. */
    type: string;

    /** Record status — typically "Active". */
    status: string;

    /** Mail exchange or SRV priority (present for MX and SRV records). */
    priority?: string;

    /** Service port number (present for SRV records). */
    port?: string;

    /** Relative weight for SRV records with equal priority. */
    weight?: string;
}

// ---------------------------------------------------------------------------
// DNS Record Operations
// ---------------------------------------------------------------------------

/**
 * Parameters for adding a new DNS record to a domain's zone.
 */
export interface AddDnsRecordParams {
    /** Fully qualified domain name (e.g. "example.com"). */
    domainName: string;

    /** Subdomain label, or "@" for the zone apex. */
    host: string;

    /** Record value — IP address, hostname, TXT string, etc. */
    value: string;

    /**
     * Time-to-live in seconds.
     * @minimum 7200
     */
    ttl: number;

    /** Priority value — required for MX and SRV records. */
    priority?: number;

    /** Port number — required for SRV records. */
    port?: number;

    /** Relative weight — required for SRV records. */
    weight?: number;
}

/**
 * Parameters for updating an existing DNS record.
 *
 * The LogicBoxes API performs atomic updates: the caller must specify both
 * the current value (to identify the record) and the new value.
 */
export interface UpdateDnsRecordParams {
    /** Fully qualified domain name (e.g. "example.com"). */
    domainName: string;

    /** Subdomain label, or "@" for the zone apex. */
    host: string;

    /** The existing record value that identifies the record to update. */
    currentValue: string;

    /** The new value to replace the current one. */
    newValue: string;

    /**
     * Time-to-live in seconds.
     * @minimum 7200
     */
    ttl: number;

    /** Priority value — relevant for MX and SRV records. */
    priority?: number;

    /** Port number — relevant for SRV records. */
    port?: number;

    /** Relative weight — relevant for SRV records. */
    weight?: number;
}

/**
 * Parameters for updating the SOA (Start of Authority) record.
 *
 * SOA records are a special case — there is exactly one per zone and the
 * update endpoint accepts a distinct set of fields.
 */
export interface UpdateSoaParams {
    /** Fully qualified domain name (e.g. "example.com"). */
    domainName: string;

    /** Email address of the person responsible for the zone (in DNS notation). */
    responsiblePerson: string;

    /** Refresh interval in seconds for secondary name servers. */
    refresh: number;

    /** Retry interval in seconds after a failed refresh. */
    retry: number;

    /** Expiry time in seconds — secondaries stop serving after this. */
    expire: number;

    /** Minimum / negative-cache TTL in seconds. */
    ttl: number;
}

/**
 * Parameters for deleting a DNS record from a domain's zone.
 */
export interface DeleteDnsRecordParams {
    /** Fully qualified domain name (e.g. "example.com"). */
    domainName: string;

    /** Subdomain label, or "@" for the zone apex. */
    host: string;

    /** Record value that uniquely identifies the record to delete. */
    value: string;

    /** Port number — required when deleting SRV records. */
    port?: number;

    /** Relative weight — required when deleting SRV records. */
    weight?: number;
}

// ---------------------------------------------------------------------------
// DNS Search
// ---------------------------------------------------------------------------

/**
 * Parameters for searching DNS records within a domain's zone.
 */
export interface DnsSearchParams {
    /** Fully qualified domain name to search within. */
    domainName: string;

    /** DNS record type (REQUIRED by the LogicBoxes API). */
    type: DnsRecordType;

    /** Filter by hostname / subdomain. */
    host?: string;

    /** Filter by record value. */
    value?: string;

    /**
     * Maximum number of records to return per page.
     * @maximum 50
     */
    noOfRecords?: number;

    /** Page number (1-based). */
    pageNo?: number;
}

/**
 * Response from the DNS record search endpoint.
 *
 * Extends {@link PaginatedResponse} with an index signature because the API
 * returns individual records under numbered string keys (e.g. "1", "2", ...).
 */
export interface DnsSearchResponse extends PaginatedResponse {
    /** Numbered record keys containing individual DNS record data. */
    [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Customer Types
// ---------------------------------------------------------------------------

/**
 * Customer record as returned from list/search endpoints.
 *
 * This is a lighter representation — use {@link CustomerDetails} for the
 * full record returned by the details endpoint.
 */
export interface Customer {
    /** Unique customer identifier. */
    customerid: string;

    /** Customer's email address (used as login username). */
    username: string;

    /** Customer's full name. */
    name: string;

    /** Company or organisation name. */
    company: string;

    /** City of residence. */
    city: string;

    /** State or province. */
    state: string;

    /** Two-letter country code. */
    country: string;

    /** Account status (e.g. "Active", "Suspended"). */
    customerstatus: string;

    /** Total receipts / revenue associated with this customer (string). */
    totalreceipts: string;

    /** Number of websites associated with this customer. */
    websitecount?: string;
}

/**
 * Extended customer record returned by the customer details endpoint.
 *
 * Includes all fields from {@link Customer} plus additional account metadata.
 */
export interface CustomerDetails extends Customer {
    /** ID of the reseller who owns this customer. */
    resellerid: string;

    /** Parent account ID in the reseller hierarchy. */
    parentid: string;

    /** Primary street address. */
    address1: string;

    /** Postal / ZIP code. */
    zipcode: string;

    /** Primary phone number. */
    phone: string;

    /** Phone number country calling code (e.g. "1" for US). */
    phonecountrycode?: string;

    /** Preferred language code (e.g. "en"). */
    langpref?: string;

    /** Account creation date/time string. */
    creationdt?: string;

    /** Whether two-factor authentication is enabled ("true" / "false"). */
    twofactorauth_enabled?: string;
}

/**
 * Parameters for searching customers under the reseller account.
 */
export interface CustomerSearchParams {
    /**
     * Maximum number of records to return per page.
     * @maximum 500
     */
    noOfRecords?: number;

    /** Page number (1-based). */
    pageNo?: number;

    /** Filter by customer ID. */
    customerId?: number;

    /** Filter by email / username. */
    username?: string;

    /** Filter by customer name. */
    name?: string;

    /** Filter by company name. */
    company?: string;

    /** Filter by city. */
    city?: string;

    /** Filter by state / province. */
    state?: string;

    /** Filter by account status. */
    status?: string;
}

// ---------------------------------------------------------------------------
// Domain Types
// ---------------------------------------------------------------------------

/**
 * Domain record as returned from list/search endpoints.
 *
 * This is a lighter representation — use {@link DomainDetails} for the
 * full record returned by the domain details endpoint.
 */
export interface Domain {
    /** Unique order identifier for the domain registration. */
    orderid: string;

    /** Fully qualified domain name (e.g. "example.com"). */
    domainname: string;

    /** Current domain status: Active, InActive, Deleted, etc. */
    currentstatus: string;

    /** Expiry date as a UNIX epoch timestamp (string). */
    endtime: string;

    /** Registration date as a UNIX epoch timestamp (string). */
    creationtime: string;

    /** Customer ID that owns this domain. */
    customerid: string;

    /** Entity type identifier for this product. */
    entitytypeid?: string;

    /** Human-readable description of the order. */
    description?: string;
}

/**
 * Extended domain record returned by the domain details endpoint.
 *
 * Includes all fields from {@link Domain} plus nameserver, contact,
 * and status information.
 */
export interface DomainDetails extends Domain {
    /** Whether auto-renewal is enabled ("true" / "false"). */
    autorenew?: string;

    /** RAA (Registrar Accreditation Agreement) email verification status. */
    raaVerificationStatus?: string;

    /** Extended attribute queue ID. */
    eaqid?: string;

    /** Primary nameserver. */
    ns1?: string;

    /** Secondary nameserver. */
    ns2?: string;

    /** Tertiary nameserver. */
    ns3?: string;

    /** Quaternary nameserver. */
    ns4?: string;

    /** Contact ID for the registrant. */
    registrantcontact?: string;

    /** Contact ID for the administrative contact. */
    admincontact?: string;

    /** Contact ID for the technical contact. */
    techcontact?: string;

    /** Contact ID for the billing contact. */
    billingcontact?: string;

    /** Domain-level status flags (e.g. clientTransferProhibited). */
    domainstatus: string[];

    /** Order-level status flags. */
    orderstatus: string[];

    /** Whether WHOIS privacy protection is allowed for this TLD. */
    privacyprotectedallowed?: string;
}

/**
 * Parameters for searching domains under the reseller account.
 */
export interface DomainSearchParams {
    /**
     * Maximum number of records to return per page.
     * @minimum 10
     * @maximum 500
     */
    noOfRecords?: number;

    /** Page number (1-based). */
    pageNo?: number;

    /** Filter by customer ID. */
    customerId?: number;

    /** Filter by domain name (partial match). */
    domainName?: string;

    /** Filter by domain status. */
    status?: string;
}
