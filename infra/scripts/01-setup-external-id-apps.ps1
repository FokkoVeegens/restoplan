# Phase 1 Setup: Microsoft Entra External ID app registrations
# Creates the SPA (frontend) and API (backend) app registrations inside a
# Microsoft Entra *external tenant* and wires up the API scope + SPA permission.
#
# The script is idempotent and self-healing: it finds-or-creates each app by
# display name (no duplicates on re-run) and ensures the exposed scope, service
# principals, SPA redirect URIs, API permission, and admin consent all exist.
# Re-run it any time to repair a tenant left half-configured by an earlier run.
#
# Prerequisites:
#   - The external tenant already exists (create it in the Microsoft Entra admin center).
#   - You are signed in to that external tenant: az login --tenant <external-tenant-id> --allow-no-subscriptions
#
# See docs/PHASE1_EXTERNAL_ID_SETUP.md for the full walkthrough.

param(
    [Parameter(Mandatory = $true)]
    [string]$ExternalTenantId,

    [string]$SpaDisplayName = "Restoplan Web App",

    [string]$ApiDisplayName = "Restoplan API",

    [string[]]$SpaRedirectUris = @(
        "http://localhost:5173/auth/callback",
        "http://localhost:3000/auth/callback"
    )
)

$ErrorActionPreference = "Stop"

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 1: Microsoft Entra External ID Setup" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "External Tenant ID: $ExternalTenantId"
Write-Host ""

# Ensure we are signed in to the external tenant
$account = az account show 2>$null | ConvertFrom-Json
if (-not $account) {
    Write-Host "Error: Not signed in. Run:" -ForegroundColor Red
    Write-Host "  az login --tenant $ExternalTenantId --allow-no-subscriptions" -ForegroundColor Red
    exit 1
}

if ($account.tenantId -ne $ExternalTenantId) {
    Write-Host "Error: Signed in to tenant '$($account.tenantId)', expected '$ExternalTenantId'." -ForegroundColor Red
    Write-Host "Run: az login --tenant $ExternalTenantId --allow-no-subscriptions" -ForegroundColor Red
    exit 1
}

Write-Host "Authenticated to external tenant: $ExternalTenantId" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------------------------
# Helpers. The whole script is idempotent and self-healing: every step checks
# the current state and repairs it, so it is safe to run repeatedly and it will
# fix tenants left in a half-configured state by an earlier, failed run.
# ---------------------------------------------------------------------------

# PATCH an application via Microsoft Graph.
# Uses the /applications/{object-id} URL form instead of
# /applications(appId='...') because the parentheses break the az.cmd wrapper on
# Windows ("--headers was unexpected at this time"), causing the PATCH to fail
# silently. Also fails loudly on a non-zero exit code.
function Invoke-AppGraphPatch {
    param(
        [Parameter(Mandatory = $true)][string]$AppId,
        [Parameter(Mandatory = $true)][string]$BodyJson
    )
    $objectId = az ad app show --id $AppId --query id -o tsv
    if ($LASTEXITCODE -ne 0 -or -not $objectId) { throw "Could not resolve object id for app $AppId" }
    $tmp = New-TemporaryFile
    Set-Content -Path $tmp -Value $BodyJson -Encoding utf8
    az rest --method PATCH --url "https://graph.microsoft.com/v1.0/applications/$objectId" --headers "Content-Type=application/json" --body "@$tmp" | Out-Null
    $code = $LASTEXITCODE
    Remove-Item $tmp -Force
    if ($code -ne 0) { throw "Graph PATCH failed for app $AppId" }
}

# Return the appId of an existing app registration with the given display name,
# or $null. Re-using the existing app keeps the script idempotent (no duplicates).
function Get-ExistingAppId {
    param([Parameter(Mandatory = $true)][string]$DisplayName)
    $id = az ad app list --filter "displayName eq '$DisplayName'" --query "[0].appId" -o tsv 2>$null
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($id)) { return $null }
    return $id.Trim()
}

# Find-or-create an app registration by display name; returns its appId.
function Get-OrCreateApp {
    param([Parameter(Mandatory = $true)][string]$DisplayName)
    $existing = Get-ExistingAppId -DisplayName $DisplayName
    if ($existing) {
        Write-Host "  Reusing existing app '$DisplayName' ($existing)" -ForegroundColor DarkGray
        return $existing
    }
    $id = az ad app create --display-name $DisplayName --sign-in-audience AzureADMyOrg --query appId -o tsv
    if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($id)) { throw "Failed to create app '$DisplayName'" }
    $id = $id.Trim()
    Write-Host "  Created app '$DisplayName' ($id)" -ForegroundColor Green
    return $id
}

# Ensure a service principal (enterprise app) exists for the given app. Without
# it, admin consent fails with "does not have a subscription (or service
# principal) for the following API(s)".
function Confirm-ServicePrincipal {
    param([Parameter(Mandatory = $true)][string]$AppId)
    $sp = az ad sp show --id $AppId --query id -o tsv 2>$null
    if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($sp)) { return }
    az ad sp create --id $AppId | Out-Null
    if ($LASTEXITCODE -ne 0) { throw "Failed to create service principal for app $AppId" }
}

# ---------------------------------------------------------------------------
# Step 1: API (backend) app registration + exposed scope + service principal
# ---------------------------------------------------------------------------
Write-Host "Step 1: Configuring API (backend) app registration..." -ForegroundColor Yellow
$apiClientId = Get-OrCreateApp -DisplayName $ApiDisplayName

# Ensure the Application ID URI is api://<clientId>
az ad app update --id $apiClientId --identifier-uris "api://$apiClientId" | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Failed to set identifier URI on API app $apiClientId" }

# Re-use the existing access_as_user scope id if present, otherwise mint a new
# one. Keeping the id stable matters: the SPA's requiredResourceAccess points at
# this exact id, so regenerating it would break consent.
$existingScopes = az ad app show --id $apiClientId --query "api.oauth2PermissionScopes" -o json | ConvertFrom-Json
$existingScope = $existingScopes | Where-Object { $_.value -eq "access_as_user" } | Select-Object -First 1
$scopeId = if ($existingScope) { $existingScope.id } else { [guid]::NewGuid().ToString() }

$apiPayload = @{
    api = @{
        oauth2PermissionScopes = @(
            @{
                id                      = $scopeId
                adminConsentDisplayName = "Access Restoplan API"
                adminConsentDescription = "Allow the application to access the Restoplan API on behalf of the signed-in user."
                userConsentDisplayName  = "Access Restoplan API on your behalf"
                userConsentDescription  = "Allow the application to access the Restoplan API on your behalf."
                value                   = "access_as_user"
                type                    = "User"
                isEnabled               = $true
            }
        )
    }
} | ConvertTo-Json -Depth 10 -Compress

Invoke-AppGraphPatch -AppId $apiClientId -BodyJson $apiPayload
Write-Host "  Ensured scope: api://$apiClientId/access_as_user" -ForegroundColor Green

Confirm-ServicePrincipal -AppId $apiClientId
Write-Host "  Ensured service principal for the API app" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------------------------
# Step 2: SPA (frontend) app registration + redirect URIs + service principal
# ---------------------------------------------------------------------------
Write-Host "Step 2: Configuring SPA (frontend) app registration..." -ForegroundColor Yellow
$spaClientId = Get-OrCreateApp -DisplayName $SpaDisplayName

# Ensure SPA redirect URIs (SPA platform => PKCE, no implicit flow)
$spaPayload = @{ spa = @{ redirectUris = $SpaRedirectUris } } | ConvertTo-Json -Depth 5 -Compress
Invoke-AppGraphPatch -AppId $spaClientId -BodyJson $spaPayload
Write-Host "  Ensured SPA redirect URIs" -ForegroundColor Green

Confirm-ServicePrincipal -AppId $spaClientId
Write-Host "  Ensured service principal for the SPA app" -ForegroundColor Green
Write-Host ""

# ---------------------------------------------------------------------------
# Step 3: Grant the SPA permission to call the API scope (declarative + consent)
# ---------------------------------------------------------------------------
Write-Host "Step 3: Granting SPA permission to the API scope..." -ForegroundColor Yellow

# Set requiredResourceAccess declaratively (idempotent) so re-runs don't create
# duplicate permission entries the way 'az ad app permission add' can.
$spaPermissionPayload = @{
    requiredResourceAccess = @(
        @{
            resourceAppId  = $apiClientId
            resourceAccess = @(
                @{ id = $scopeId; type = "Scope" }
            )
        }
    )
} | ConvertTo-Json -Depth 10 -Compress
Invoke-AppGraphPatch -AppId $spaClientId -BodyJson $spaPermissionPayload
Write-Host "  Ensured access_as_user permission on the SPA" -ForegroundColor Green

# ---------------------------------------------------------------------------
# Step 4: Verify the end state before granting consent. These checks turn the
# silent half-configured states (missing scope / missing redirect URIs) into
# loud, actionable failures.
# ---------------------------------------------------------------------------
Write-Host "Step 4: Verifying configuration..." -ForegroundColor Yellow
$apiScopeValues = az ad app show --id $apiClientId --query "api.oauth2PermissionScopes[].value" -o json | ConvertFrom-Json
if ($apiScopeValues -notcontains "access_as_user") {
    throw "Verification failed: 'access_as_user' scope is missing on the API app $apiClientId."
}
$spaRedirects = az ad app show --id $spaClientId --query "spa.redirectUris" -o json | ConvertFrom-Json
foreach ($uri in $SpaRedirectUris) {
    if ($spaRedirects -notcontains $uri) {
        throw "Verification failed: redirect URI '$uri' is missing on the SPA app $spaClientId."
    }
}
Write-Host "  Scope and redirect URIs verified" -ForegroundColor Green

# Grant admin consent for the SPA -> API permission. Requires both service
# principals and the scope to exist (ensured above).
$consentGranted = $false
try {
    az ad app permission admin-consent --id $spaClientId 2>$null | Out-Null
    if ($LASTEXITCODE -eq 0) { $consentGranted = $true }
} catch { }
if ($consentGranted) {
    Write-Host "  Granted admin consent for the SPA -> API permission" -ForegroundColor Green
} else {
    Write-Host "  NOTE: Could not auto-grant admin consent (you may lack privileges)." -ForegroundColor Yellow
    Write-Host "        Grant it in the Microsoft Entra admin center: App registrations ->" -ForegroundColor Yellow
    Write-Host "        $SpaDisplayName -> API permissions -> Grant admin consent." -ForegroundColor Yellow
}
Write-Host ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Phase 1 Setup Summary" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "SPA client ID:  $spaClientId"
Write-Host "API client ID:  $apiClientId"
Write-Host "API scope:      api://$apiClientId/access_as_user"
Write-Host ""
Write-Host "Set these azd environment values (or main.parameters.json):" -ForegroundColor Yellow
Write-Host "  azd env set EXTERNAL_ID_TENANT_ID   $ExternalTenantId"
Write-Host "  azd env set SPA_CLIENT_ID           $spaClientId"
Write-Host "  azd env set API_CLIENT_ID           $apiClientId"
Write-Host "  azd env set EXTERNAL_ID_TENANT_SUBDOMAIN <your-tenant-subdomain>"
Write-Host ""
Write-Host "Next: configure identity providers (Google, Apple, Microsoft) and the" -ForegroundColor Yellow
Write-Host "sign-up/sign-in user flow. See docs/PHASE1_EXTERNAL_ID_SETUP.md." -ForegroundColor Yellow
