#!/usr/bin/env bash
#
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
#   - You are signed in to that external tenant:
#       az login --tenant <external-tenant-id> --allow-no-subscriptions
#
# Usage:
#   ./01-setup-external-id-apps.sh <external-tenant-id> [spa-display-name] [api-display-name]
#
# See docs/PHASE1_EXTERNAL_ID_SETUP.md for the full walkthrough.

set -euo pipefail

EXTERNAL_TENANT_ID="${1:?Provide the external tenant ID as the first argument}"
SPA_DISPLAY_NAME="${2:-Restoplan Web App}"
API_DISPLAY_NAME="${3:-Restoplan API}"
REDIRECT_URIS=(
  "http://localhost:5173/auth/callback"
  "http://localhost:3000/auth/callback"
)

echo "========================================="
echo "Phase 1: Microsoft Entra External ID Setup"
echo "========================================="
echo "External Tenant ID: $EXTERNAL_TENANT_ID"
echo ""

# Ensure we are signed in to the external tenant
CURRENT_TENANT="$(az account show --query tenantId -o tsv 2>/dev/null || true)"
if [[ -z "$CURRENT_TENANT" ]]; then
  echo "Error: Not signed in. Run:" >&2
  echo "  az login --tenant $EXTERNAL_TENANT_ID --allow-no-subscriptions" >&2
  exit 1
fi
if [[ "$CURRENT_TENANT" != "$EXTERNAL_TENANT_ID" ]]; then
  echo "Error: Signed in to tenant '$CURRENT_TENANT', expected '$EXTERNAL_TENANT_ID'." >&2
  echo "Run: az login --tenant $EXTERNAL_TENANT_ID --allow-no-subscriptions" >&2
  exit 1
fi
echo "Authenticated to external tenant: $EXTERNAL_TENANT_ID"
echo ""

# ---------------------------------------------------------------------------
# Helpers. The whole script is idempotent and self-healing: every step checks
# the current state and repairs it, so it is safe to run repeatedly and it will
# fix tenants left in a half-configured state by an earlier, failed run.
# (Functions log to stderr so their stdout can be captured as return values.)
# ---------------------------------------------------------------------------

# PATCH an application via Microsoft Graph using the /applications/{object-id}
# URL form. Avoids the /applications(appId='...') form whose parentheses break
# the az wrapper on some shells and cause a silent failure.
graph_patch() {
  local app_id="$1" body="$2" obj_id tmp
  obj_id="$(az ad app show --id "$app_id" --query id -o tsv)"
  if [[ -z "$obj_id" ]]; then echo "Error: could not resolve object id for app $app_id" >&2; exit 1; fi
  tmp="$(mktemp)"
  printf '%s' "$body" > "$tmp"
  az rest --method PATCH \
    --url "https://graph.microsoft.com/v1.0/applications/$obj_id" \
    --headers "Content-Type=application/json" \
    --body "@$tmp" >/dev/null
  rm -f "$tmp"
}

# Find-or-create an app registration by display name; echoes its appId.
get_or_create_app() {
  local name="$1" id
  id="$(az ad app list --filter "displayName eq '$name'" --query "[0].appId" -o tsv 2>/dev/null)"
  if [[ -n "$id" ]]; then
    echo "  Reusing existing app '$name' ($id)" >&2
    printf '%s' "$id"
    return
  fi
  id="$(az ad app create --display-name "$name" --sign-in-audience AzureADMyOrg --query appId -o tsv)"
  if [[ -z "$id" ]]; then echo "Error: failed to create app '$name'" >&2; exit 1; fi
  echo "  Created app '$name' ($id)" >&2
  printf '%s' "$id"
}

# Ensure a service principal (enterprise app) exists for the given app.
ensure_sp() {
  local app_id="$1"
  if az ad sp show --id "$app_id" --query id -o tsv >/dev/null 2>&1; then return; fi
  az ad sp create --id "$app_id" >/dev/null
}

# Build a compact JSON array of strings from the given arguments.
json_string_array() {
  local out="[" first=1 item
  for item in "$@"; do
    if [[ $first -eq 0 ]]; then out+=","; fi
    out+="\"$item\""
    first=0
  done
  out+="]"
  printf '%s' "$out"
}

# ---------------------------------------------------------------------------
# Step 1: API (backend) app registration + exposed scope + service principal
# ---------------------------------------------------------------------------
echo "Step 1: Configuring API (backend) app registration..."
API_CLIENT_ID="$(get_or_create_app "$API_DISPLAY_NAME")"
echo "  API client ID: $API_CLIENT_ID"

az ad app update --id "$API_CLIENT_ID" --identifier-uris "api://$API_CLIENT_ID" >/dev/null

# Re-use the existing access_as_user scope id if present, otherwise mint a new
# one. Keeping the id stable matters: the SPA's requiredResourceAccess points at
# this exact id, so regenerating it would break consent.
SCOPE_ID="$(az ad app show --id "$API_CLIENT_ID" --query "api.oauth2PermissionScopes[?value=='access_as_user'].id | [0]" -o tsv 2>/dev/null)"
if [[ -z "$SCOPE_ID" || "$SCOPE_ID" == "None" ]]; then
  SCOPE_ID="$(cat /proc/sys/kernel/random/uuid 2>/dev/null || uuidgen)"
fi
API_PAYLOAD="$(cat <<JSON
{
  "api": {
    "oauth2PermissionScopes": [
      {
        "id": "$SCOPE_ID",
        "adminConsentDisplayName": "Access Restoplan API",
        "adminConsentDescription": "Allow the application to access the Restoplan API on behalf of the signed-in user.",
        "userConsentDisplayName": "Access Restoplan API on your behalf",
        "userConsentDescription": "Allow the application to access the Restoplan API on your behalf.",
        "value": "access_as_user",
        "type": "User",
        "isEnabled": true
      }
    ]
  }
}
JSON
)"
graph_patch "$API_CLIENT_ID" "$API_PAYLOAD"
echo "  Ensured scope: api://$API_CLIENT_ID/access_as_user"

ensure_sp "$API_CLIENT_ID"
echo "  Ensured service principal for the API app"
echo ""

# ---------------------------------------------------------------------------
# Step 2: SPA (frontend) app registration + redirect URIs + service principal
# ---------------------------------------------------------------------------
echo "Step 2: Configuring SPA (frontend) app registration..."
SPA_CLIENT_ID="$(get_or_create_app "$SPA_DISPLAY_NAME")"
echo "  SPA client ID: $SPA_CLIENT_ID"

SPA_REDIRECT_URIS_JSON="$(json_string_array "${REDIRECT_URIS[@]}")"
graph_patch "$SPA_CLIENT_ID" "{\"spa\":{\"redirectUris\":$SPA_REDIRECT_URIS_JSON}}"
echo "  Ensured SPA redirect URIs"

ensure_sp "$SPA_CLIENT_ID"
echo "  Ensured service principal for the SPA app"
echo ""

# ---------------------------------------------------------------------------
# Step 3: Grant the SPA permission to call the API scope (declarative + consent)
# ---------------------------------------------------------------------------
echo "Step 3: Granting SPA permission to the API scope..."

# Set requiredResourceAccess declaratively (idempotent) so re-runs don't create
# duplicate permission entries the way 'az ad app permission add' can.
graph_patch "$SPA_CLIENT_ID" "{\"requiredResourceAccess\":[{\"resourceAppId\":\"$API_CLIENT_ID\",\"resourceAccess\":[{\"id\":\"$SCOPE_ID\",\"type\":\"Scope\"}]}]}"
echo "  Ensured access_as_user permission on the SPA"

# ---------------------------------------------------------------------------
# Step 4: Verify the end state before granting consent. Turns the silent
# half-configured states (missing scope / missing redirect URIs) into loud,
# actionable failures.
# ---------------------------------------------------------------------------
echo "Step 4: Verifying configuration..."
if ! az ad app show --id "$API_CLIENT_ID" --query "api.oauth2PermissionScopes[].value" -o tsv | grep -qx "access_as_user"; then
  echo "Error: verification failed - 'access_as_user' scope missing on API app $API_CLIENT_ID" >&2
  exit 1
fi
SPA_REDIRECTS_JSON="$(az ad app show --id "$SPA_CLIENT_ID" --query "spa.redirectUris" -o json)"
for uri in "${REDIRECT_URIS[@]}"; do
  if [[ "$SPA_REDIRECTS_JSON" != *"$uri"* ]]; then
    echo "Error: verification failed - redirect URI '$uri' missing on SPA app $SPA_CLIENT_ID" >&2
    exit 1
  fi
done
echo "  Scope and redirect URIs verified"

# Grant admin consent for the SPA -> API permission. Requires both service
# principals and the scope to exist (ensured above).
if az ad app permission admin-consent --id "$SPA_CLIENT_ID" >/dev/null 2>&1; then
  echo "  Granted admin consent for the SPA -> API permission"
else
  echo "  NOTE: Could not auto-grant admin consent (you may lack privileges)."
  echo "        Grant it in the Microsoft Entra admin center: App registrations ->"
  echo "        $SPA_DISPLAY_NAME -> API permissions -> Grant admin consent."
fi
echo ""

# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
echo "========================================="
echo "Phase 1 Setup Summary"
echo "========================================="
echo "SPA client ID:  $SPA_CLIENT_ID"
echo "API client ID:  $API_CLIENT_ID"
echo "API scope:      api://$API_CLIENT_ID/access_as_user"
echo ""
echo "Set these azd environment values (or main.parameters.json):"
echo "  azd env set EXTERNAL_ID_TENANT_ID   $EXTERNAL_TENANT_ID"
echo "  azd env set SPA_CLIENT_ID           $SPA_CLIENT_ID"
echo "  azd env set API_CLIENT_ID           $API_CLIENT_ID"
echo "  azd env set EXTERNAL_ID_TENANT_SUBDOMAIN <your-tenant-subdomain>"
echo ""
echo "Next: configure identity providers (Google, Apple, Microsoft) and the"
echo "sign-up/sign-in user flow. See docs/PHASE1_EXTERNAL_ID_SETUP.md."
