import type { SkillSlug } from "./skills";

export type IntegrationCategory =
  | "compliance"
  | "finance"
  | "hr"
  | "erp"
  | "data"
  | "messaging";

export type IntegrationStatus = "live" | "beta" | "roadmap";

export type Integration = {
  name: string;
  slug: string;
  /** Brand domain — used by BrandLogo to fetch the real company logo via logo.dev CDN. */
  domain: string;
  category: IntegrationCategory;
  usedBy: SkillSlug[];
  status: IntegrationStatus;
};

export const integrationCategories: {
  key: IntegrationCategory | "all";
  label: string;
}[] = [
  { key: "all", label: "All" },
  { key: "compliance", label: "Compliance" },
  { key: "finance", label: "Finance" },
  { key: "hr", label: "HR" },
  { key: "erp", label: "ERP" },
  { key: "data", label: "Data" },
  { key: "messaging", label: "Messaging" },
];

export const integrations: Integration[] = [
  // Compliance
  { name: "Persona", slug: "persona", domain: "withpersona.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "Alloy", slug: "alloy", domain: "alloy.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "Onfido", slug: "onfido", domain: "onfido.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "Sumsub", slug: "sumsub", domain: "sumsub.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "Jumio", slug: "jumio", domain: "jumio.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "Veriff", slug: "veriff", domain: "veriff.com", category: "compliance", usedBy: ["kyc"], status: "beta" },
  { name: "Refinitiv", slug: "refinitiv", domain: "lseg.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "Dow Jones", slug: "dowjones", domain: "dowjones.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "ComplyAdvantage", slug: "complyadvantage", domain: "complyadvantage.com", category: "compliance", usedBy: ["kyc"], status: "live" },
  { name: "LexisNexis", slug: "lexisnexis", domain: "lexisnexis.com", category: "compliance", usedBy: ["kyc"], status: "beta" },
  { name: "Unit21", slug: "unit21", domain: "unit21.ai", category: "compliance", usedBy: ["kyc"], status: "roadmap" },
  { name: "Sardine", slug: "sardine", domain: "sardine.ai", category: "compliance", usedBy: ["kyc"], status: "roadmap" },

  // Finance
  { name: "QuickBooks", slug: "quickbooks", domain: "quickbooks.intuit.com", category: "finance", usedBy: ["finance"], status: "live" },
  { name: "NetSuite", slug: "netsuite", domain: "netsuite.com", category: "finance", usedBy: ["finance"], status: "live" },
  { name: "Sage Intacct", slug: "sage-intacct", domain: "sage.com", category: "finance", usedBy: ["finance"], status: "live" },
  { name: "Xero", slug: "xero", domain: "xero.com", category: "finance", usedBy: ["finance"], status: "beta" },
  { name: "Brex", slug: "brex", domain: "brex.com", category: "finance", usedBy: ["finance"], status: "live" },
  { name: "Ramp", slug: "ramp", domain: "ramp.com", category: "finance", usedBy: ["finance"], status: "live" },
  { name: "Expensify", slug: "expensify", domain: "expensify.com", category: "finance", usedBy: ["finance"], status: "beta" },

  // HR
  { name: "Workday", slug: "workday", domain: "workday.com", category: "hr", usedBy: ["hr"], status: "live" },
  { name: "Rippling", slug: "rippling", domain: "rippling.com", category: "hr", usedBy: ["hr"], status: "live" },
  { name: "Gusto", slug: "gusto", domain: "gusto.com", category: "hr", usedBy: ["hr"], status: "live" },
  { name: "Paylocity", slug: "paylocity", domain: "paylocity.com", category: "hr", usedBy: ["hr"], status: "beta" },
  { name: "ADP", slug: "adp", domain: "adp.com", category: "hr", usedBy: ["hr"], status: "beta" },
  { name: "BambooHR", slug: "bamboohr", domain: "bamboohr.com", category: "hr", usedBy: ["hr"], status: "live" },
  { name: "Greenhouse", slug: "greenhouse", domain: "greenhouse.io", category: "hr", usedBy: ["hr"], status: "live" },
  { name: "Ashby", slug: "ashby", domain: "ashbyhq.com", category: "hr", usedBy: ["hr"], status: "beta" },

  // ERP
  { name: "SAP", slug: "sap", domain: "sap.com", category: "erp", usedBy: ["erp"], status: "live" },
  { name: "Oracle", slug: "oracle", domain: "oracle.com", category: "erp", usedBy: ["erp"], status: "live" },
  { name: "Microsoft Dynamics 365", slug: "dynamics-365", domain: "microsoft.com", category: "erp", usedBy: ["erp"], status: "beta" },
  { name: "Coupa", slug: "coupa", domain: "coupa.com", category: "erp", usedBy: ["erp"], status: "live" },
  { name: "Ariba", slug: "ariba", domain: "ariba.com", category: "erp", usedBy: ["erp"], status: "roadmap" },
  { name: "Ironclad", slug: "ironclad", domain: "ironcladapp.com", category: "erp", usedBy: ["erp"], status: "live" },
  { name: "DocuSign CLM", slug: "docusign-clm", domain: "docusign.com", category: "erp", usedBy: ["erp"], status: "beta" },

  // Data
  { name: "Plaid", slug: "plaid", domain: "plaid.com", category: "data", usedBy: ["finance"], status: "live" },
  { name: "Finicity", slug: "finicity", domain: "finicity.com", category: "data", usedBy: ["finance"], status: "beta" },
  { name: "Informatica", slug: "informatica", domain: "informatica.com", category: "data", usedBy: ["erp"], status: "roadmap" },

  // Messaging / identity / glue
  { name: "Okta", slug: "okta", domain: "okta.com", category: "messaging", usedBy: ["hr"], status: "live" },
  { name: "Google Workspace", slug: "google", domain: "workspace.google.com", category: "messaging", usedBy: ["hr"], status: "live" },
  { name: "Slack", slug: "slack", domain: "slack.com", category: "messaging", usedBy: ["hr", "erp", "finance"], status: "live" },
];

export function filterIntegrations(
  category: IntegrationCategory | "all"
): Integration[] {
  if (category === "all") return integrations;
  return integrations.filter((i) => i.category === category);
}

/** Lookup a brand domain by display name (used by skill chips + tool labels). */
export function domainForBrand(name: string): string | undefined {
  const lower = name.trim().toLowerCase();
  return integrations.find(
    (i) => i.name.toLowerCase() === lower || i.slug === lower
  )?.domain;
}
