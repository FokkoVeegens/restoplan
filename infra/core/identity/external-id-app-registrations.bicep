// Microsoft Entra External ID configuration reference module.
//
// External ID app registrations and the external tenant live in a Microsoft Entra
// *external tenant*, which is provisioned and configured outside of this Bicep
// deployment (the Microsoft Entra admin center / Microsoft Graph).
// See ../../../docs/PHASE1_EXTERNAL_ID_SETUP.md for the full setup guide.
//
// This module centralizes how the resulting identifiers are turned into the
// authority URL and API scope consumed by the SPA and API.

@description('The Microsoft Entra External ID tenant subdomain (e.g., "restoplan" resolves to restoplan.ciamlogin.com)')
param externalIdTenantSubdomain string

@description('The Microsoft Entra External ID tenant ID (GUID)')
param externalIdTenantId string

@description('The SPA (frontend) application client ID')
param spaClientId string

@description('The API (backend) application client ID')
param apiClientId string

output ciamLoginDomain string = '${externalIdTenantSubdomain}.ciamlogin.com'
output authority string = 'https://${externalIdTenantSubdomain}.ciamlogin.com/${externalIdTenantId}'
output spaClientId string = spaClientId
output apiClientId string = apiClientId
output apiScope string = 'api://${apiClientId}/access_as_user'
