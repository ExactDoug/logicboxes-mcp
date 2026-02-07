/**
 * Core HTTP client for the LogicBoxes API.
 *
 * Uses native fetch (Node 18+) with AbortController-based timeouts.
 * All requests send auth credentials as query parameters.
 * POST endpoints also use query params (not form body) per the LogicBoxes API convention.
 */

import { LogicBoxesConfig, DEFAULT_BASE_URL, DEFAULT_TIMEOUT } from './types.js';
import { LogicBoxesError, createErrorFromResponse } from './errors.js';

/**
 * HTTP client for communicating with the LogicBoxes reseller API.
 */
export class LogicBoxesClient {
  private readonly authUserId: string;
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly timeout: number;

  constructor(config: LogicBoxesConfig) {
    this.authUserId = config.authUserId;
    this.apiKey = config.apiKey;

    // Ensure baseUrl ends with a trailing slash.
    let base = config.baseUrl ?? DEFAULT_BASE_URL;
    if (!base.endsWith('/')) {
      base += '/';
    }
    this.baseUrl = base;

    this.timeout = config.timeout ?? DEFAULT_TIMEOUT;
  }

  /**
   * Builds a full API URL with authentication and optional extra parameters.
   *
   * @param path - API endpoint path (e.g., "api/dns/manage/search-records.json").
   * @param params - Additional query parameters. Undefined values are skipped.
   * @returns The fully-qualified URL string.
   */
  private buildUrl(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): string {
    const url = new URL(path, this.baseUrl);

    // Auth params are always sent as query parameters.
    url.searchParams.set('auth-userid', this.authUserId);
    url.searchParams.set('api-key', this.apiKey);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * Executes an HTTP request against the LogicBoxes API.
   *
   * @param url - The fully-qualified request URL (including query params).
   * @param method - HTTP method (GET or POST).
   * @param body - Optional form-encoded body for POST requests.
   * @returns The parsed JSON response.
   * @throws {LogicBoxesError} On network, timeout, HTTP, or API-level errors.
   */
  private async request<T = Record<string, unknown>>(
    url: string,
    method: 'GET' | 'POST',
    body?: Record<string, string | number>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const init: RequestInit = {
        method,
        signal: controller.signal,
      };

      if (method === 'POST' && body && Object.keys(body).length > 0) {
        init.headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
        const formParams = new URLSearchParams();
        for (const [key, value] of Object.entries(body)) {
          formParams.set(key, String(value));
        }
        init.body = formParams.toString();
      }

      const response = await fetch(url, init);

      if (!response.ok) {
        throw new LogicBoxesError(
          `HTTP ${response.status}: ${response.statusText}`,
          { statusCode: response.status },
        );
      }

      const data = (await response.json()) as Record<string, unknown>;

      // Check for API-level errors.
      // LogicBoxes returns { status: "ERROR", message: "..." } on failure.
      if (
        typeof data === 'object' &&
        data !== null &&
        (data.status === 'ERROR' || data.status === 'error')
      ) {
        throw createErrorFromResponse(data);
      }

      return data as T;
    } catch (error: unknown) {
      // Re-throw our own errors unchanged.
      if (error instanceof LogicBoxesError) {
        throw error;
      }

      // Handle abort (timeout).
      if (error instanceof DOMException && error.name === 'AbortError') {
        throw new LogicBoxesError(
          `Request timed out after ${this.timeout}ms`,
        );
      }

      // Handle generic fetch/network errors.
      const message =
        error instanceof Error ? error.message : 'Unknown network error';
      throw new LogicBoxesError(`Network error: ${message}`);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  /**
   * Sends a GET request to the LogicBoxes API.
   *
   * @param path - API endpoint path (e.g., "api/dns/manage/search-records.json").
   * @param params - Query parameters to include. Undefined values are skipped.
   * @returns The parsed JSON response.
   */
  async get<T = Record<string, unknown>>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, 'GET');
  }

  /**
   * Sends a POST request to the LogicBoxes API.
   *
   * LogicBoxes POST endpoints accept all parameters (including auth) as URL
   * query parameters, matching GET behavior. No form body is sent.
   *
   * @param path - API endpoint path (e.g., "api/dns/manage/add-cname-record.json").
   * @param params - Query parameters to include. Undefined values are skipped.
   * @returns The parsed JSON response.
   */
  async post<T = Record<string, unknown>>(
    path: string,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = this.buildUrl(path, params);
    return this.request<T>(url, 'POST');
  }
}

export default LogicBoxesClient;
