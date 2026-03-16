import { Page } from "@playwright/test";
import { generateDynamicCookies } from "./generate-cookie";

/**
 * BFF (GraphQL) API Utility
 *
 * Executes GraphQL queries and mutations through the browser's authenticated
 * session. Since the BFF sits behind the same auth cookies as the app,
 * requests are made via `page.evaluate(fetch(...))`.
 *
 * @see docs/api-reference.md#3-bff-graphql
 */

const BFF_GRAPHQL_PATH = "/px-bff";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface GraphQLResponse<T = any> {
  data: T;
  errors?: Array<{ message: string; [key: string]: any }>;
}

// ---------------------------------------------------------------------------
// BFF API Class
// ---------------------------------------------------------------------------

export class BffApi {
  /**
   * Execute an arbitrary GraphQL query or mutation through the browser's
   * authenticated session.
   *
   * @param page - Playwright Page (must be navigated to the app so cookies are set)
   * @param query - GraphQL query/mutation string
   * @param variables - Optional variables object
   * @returns Parsed GraphQL response ({ data, errors })
   */
  static async execute<T = any>(
    page: Page,
    query: string,
    variables?: Record<string, any>
  ): Promise<GraphQLResponse<T>> {
    const baseURL = process.env.BASE_URL || "http://localhost:3000";
    const cookieJar = await generateDynamicCookies(baseURL);
    const cookieString = cookieJar ? cookieJar.getCookieStringSync(baseURL) : "";
    
    // Construct absolute URL so request context routes properly
    const url = new URL(BFF_GRAPHQL_PATH, baseURL).toString();

    const response = await page.request.post(url, {
      data: { query, variables },
      headers: {
        "Content-Type": "application/json",
        ...(cookieString ? { "Cookie": cookieString } : {})
      }
    });

    const text = await response.text();
    if (!response.ok() || text.trim().startsWith('<')) {
      throw new Error(`BFF GraphQL Error: HTTP ${response.status()}\nResponse: ${text.substring(0, 500)}`);
    }

    const result = JSON.parse(text);

    if (result.errors?.length) {
      console.error("GraphQL errors:", JSON.stringify(result.errors, null, 2));
    }

    return result;
  }

  // ── Staff ────────────────────────────────────────────────────────────

  /**
   * Query paginated staff list.
   */
  static async getStaff(
    page: Page,
    options?: { page?: any; filter?: any; sort?: any; filterPreset?: string }
  ) {
    const query = `
      query GetStaff($page: PageInput!, $filter: Filter, $sort: [SortInput!], $filterPreset: String) {
        staffs(page: $page, filter: $filter, sort: $sort, filterPreset: $filterPreset) {
          pageInfo { total currentPage totalFiltered }
          items {
            entityId
            displayName
            firstName
            lastName
            email
            status
            isVirtual
            employmentDetails {
              jobTitle
              office
              workPhoneNo1
              workPhoneNo2
              team { entityId name }
            }
            customFields
          }
        }
      }
    `;
    return BffApi.execute(page, query, options);
  }

  /**
   * Create a virtual staff member via BFF mutation.
   */
  static async createVirtualStaff(
    page: Page,
    input: Record<string, any>
  ) {
    const mutation = `
      mutation CreateVirtualStaff($input: CreateVirtualStaffInput!) {
        createVirtualStaff(createVirtualStaffInput: $input) {
          entityId
          displayName
          firstName
          lastName
        }
      }
    `;
    return BffApi.execute(page, mutation, { input });
  }

  /**
   * Update employment details for a staff member.
   */
  static async updateEmploymentDetails(
    page: Page,
    input: Record<string, any>
  ) {
    const mutation = `
      mutation UpdateEmploymentDetails($input: UpdateEmploymentDetailsInput!) {
        updateEmploymentDetails(updateEmploymentDetailsInput: $input) {
          entityId
          displayName
          employmentDetails {
            jobTitle
            office
            workPhoneNo1
            workPhoneNo2
          }
        }
      }
    `;
    return BffApi.execute(page, mutation, { input });
  }

  /**
   * Delete a virtual staff member.
   */
  static async deleteVirtualStaff(
    page: Page,
    input: { entityId: string }
  ) {
    const mutation = `
      mutation DeleteVirtualStaff($input: DeleteVirtualStaffInput!) {
        deleteVirtualStaff(deleteVirtualStaffInput: $input) {
          entityId
        }
      }
    `;
    return BffApi.execute(page, mutation, { input });
  }

  // ── Clients ──────────────────────────────────────────────────────────

  /**
   * Query paginated client list.
   */
  static async getClients(
    page: Page,
    options?: { page?: any; filter?: any; sort?: any; filterPreset?: string }
  ) {
    const query = `
      query GetClients($page: PageInput!, $filter: Filter, $sort: [SortInput!], $filterPreset: String) {
        clients(page: $page, filter: $filter, sort: $sort, filterPreset: $filterPreset) {
          pageInfo { total currentPage totalFiltered }
          items {
            entityId
            displayName
            status
            customFields
          }
        }
      }
    `;
    return BffApi.execute(page, query, options);
  }

  // ── Missions ─────────────────────────────────────────────────────────

  /**
   * Query paginated mission list.
   */
  static async getMissions(
    page: Page,
    options?: { page?: any; filter?: any; sort?: any; filterPreset?: string }
  ) {
    const query = `
      query GetMissions($page: PageInput!, $filter: Filter, $sort: [SortInput!], $filterPreset: String) {
        missions(page: $page, filter: $filter, sort: $sort, filterPreset: $filterPreset) {
          pageInfo { total currentPage totalFiltered }
          items {
            entityId
            displayName
            status
            client { entityId displayName }
            customFields
          }
        }
      }
    `;
    return BffApi.execute(page, query, options);
  }

  // ── Teams ────────────────────────────────────────────────────────────

  /**
   * Query paginated team list.
   */
  static async getTeams(
    page: Page,
    options?: { page?: any; filter?: any; sort?: any; filterPreset?: string }
  ) {
    const query = `
      query GetTeams($page: PageInput!, $filter: Filter, $sort: [SortInput!], $filterPreset: String) {
        teams(page: $page, filter: $filter, sort: $sort, filterPreset: $filterPreset) {
          pageInfo { total currentPage totalFiltered }
          items {
            entityId
            name
            customFields
          }
        }
      }
    `;
    return BffApi.execute(page, query, options);
  }

  // ── Admin Settings ───────────────────────────────────────────────────

  /**
   * Query admin settings (field options, defaults).
   */
  static async getAdminSettings(page: Page) {
    const query = `
      query GetAdminSettings {
        adminSettings {
          staffSettings {
            seniority { entityId field value }
            workingArrangement { entityId field value }
            department { entityId field value }
            category { entityId field value }
            type { entityId field value }
            tags { entityId field value }
          }
          clientSettings {
            country { entityId field value }
            office { entityId field value }
          }
          missionSettings {
            contractType { entityId field value }
            milestonePriority { entityId field value }
          }
        }
      }
    `;
    return BffApi.execute(page, query);
  }

  // ── Metadata (form dropdown options) ─────────────────────────────────

  /**
   * Query staff metadata (dropdown options for create/update forms).
   */
  static async getStaffMetadata(page: Page) {
    const query = `
      query GetStaffMetadata {
        requestMetadata {
          updateEmploymentDetailsMeta {
            dropdownOptions {
              remoteWorking { entityId field value }
              seniority { entityId field value }
              workingArrangement { entityId field value }
            }
            relatedActions
          }
        }
      }
    `;
    return BffApi.execute(page, query);
  }

  // ── Dashboard ────────────────────────────────────────────────────────

  /**
   * Query dashboard quick stats.
   */
  static async getDashboard(page: Page) {
    const query = `
      query GetDashboard {
        dashboard {
          staffQuickStats { total active inactive }
          clientQuickStats { total }
          missionQuickStats { total active }
        }
      }
    `;
    return BffApi.execute(page, query);
  }
}
