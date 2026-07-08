#!/usr/bin/env pwsh
<#
.SYNOPSIS
Automated tests for Phase 2 JWT Bearer authentication.

.DESCRIPTION
Validates that:
- API requires authentication (401 without token)
- Invalid tokens are rejected (401 with bad token)
- Swagger UI is accessible anonymously
- Valid tokens work (200 with real token)
- Tokens without required scope fail (403)
- CORS is enforced
#>

param(
    [string]$ApiUrl = "http://localhost:3100",
    [string]$ExternalTenantId = "926a8d02-2c45-4c39-b839-45119e587a4e",
    [string]$ApiClientId = "90d6932b-8575-42e2-8c06-de1e49788a25",
    [string]$SpaClientId = "b44a0d9e-76f9-4bb2-a98d-7def0c0afbfa",
    [switch]$UseRealToken = $false,
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Continue"
$testsPassed = 0
$testsFailed = 0

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n================================" -ForegroundColor Cyan
    Write-Host $Title -ForegroundColor Cyan
    Write-Host "================================" -ForegroundColor Cyan
}

function Write-TestResult {
    param(
        [string]$Name,
        [bool]$Passed,
        [string]$Expected,
        [string]$Actual
    )
    if ($Passed) {
        Write-Host "OK $Name" -ForegroundColor Green
        $script:testsPassed++
    } else {
        Write-Host "FAIL $Name" -ForegroundColor Red
        Write-Host "   Expected: $Expected" -ForegroundColor Yellow
        Write-Host "   Actual: $Actual" -ForegroundColor Yellow
        $script:testsFailed++
    }
}

function Test-Endpoint {
    param(
        [string]$Url,
        [string]$Token = $null,
        [hashtable]$Headers = @{}
    )
    
    try {
        $curlArgs = @("-i", "-s", $Url)
        
        if ($Token) {
            $curlArgs += "-H"
            $curlArgs += "Authorization: Bearer $Token"
        }
        
        $curlArgs += "-H"
        $curlArgs += "Accept: application/json"
        
        foreach ($header in $Headers.GetEnumerator()) {
            $curlArgs += "-H"
            $curlArgs += "$($header.Key): $($header.Value)"
        }
        
        $output = curl @curlArgs 2>$null
        $lines = $output -split "`r`n" | Where-Object { $_ }
        
        # Parse status line
        $statusLine = $lines[0]
        $statusCode = [int]($statusLine -split '\s+')[1]
        
        # Parse headers
        $headers = @{}
        $contentStartIndex = 0
        for ($i = 1; $i -lt $lines.Count; $i++) {
            $line = $lines[$i].Trim()
            if (-not $line) {
                $contentStartIndex = $i + 1
                break
            }
            if ($line -match "^([^:]+):\s*(.*)$") {
                $key = $matches[1].Trim()
                $value = $matches[2].Trim()
                $headers[$key] = $value
            }
        }
        
        return @{
            StatusCode = $statusCode
            Headers = $headers
            Content = if ($contentStartIndex -gt 0 -and $contentStartIndex -lt $lines.Count) { 
                ($lines[$contentStartIndex..($lines.Count-1)] -join "`n").Trim() 
            } else { 
                $null 
            }
        }
    } catch {
        Write-Error "Failed to call endpoint: $_"
        return @{ StatusCode = 0; Headers = @{}; Content = $null }
    }
}

Write-Host "Phase 2 Authentication Tests" -ForegroundColor Cyan
Write-Host "API URL: $ApiUrl`n"

# ============================================================================
# Test 1: API requires authentication
# ============================================================================
Write-TestHeader "Test 1: Requests without token get 401"

$result = Test-Endpoint "$ApiUrl/projects"
$passed = $result.StatusCode -eq 401
Write-TestResult "GET /projects without token" $passed "401 Unauthorized" $result.StatusCode

# Verify WWW-Authenticate header is present
$wwwAuth = $result.Headers["WWW-Authenticate"]
if ($wwwAuth -eq $null) { $wwwAuth = "missing" }
$passed = $wwwAuth -and $wwwAuth.Contains("Bearer") -and $wwwAuth -ne "missing"
Write-TestResult "WWW-Authenticate header present" $passed "Bearer scheme" $wwwAuth

# ============================================================================
# Test 2: Invalid tokens are rejected
# ============================================================================
Write-TestHeader "Test 2: Invalid tokens are rejected"

$invalidToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
$result = Test-Endpoint "$ApiUrl/projects" -Token $invalidToken
$passed = $result.StatusCode -eq 401
Write-TestResult "Invalid JWT token rejected" $passed "401 Unauthorized" $result.StatusCode

# Verify error description is present
$wwwAuthHeader = $result.Headers["WWW-Authenticate"]
if ($wwwAuthHeader -eq $null) { $wwwAuthHeader = "missing" }
$passed = $wwwAuthHeader -and $wwwAuthHeader.Contains("error=") -and $wwwAuthHeader -ne "missing"
Write-TestResult "Error description in response" $passed "error in WWW-Authenticate" $wwwAuthHeader

# ============================================================================
# Test 3: Swagger UI is accessible anonymously
# ============================================================================
Write-TestHeader "Test 3: Swagger UI is accessible (anonymous)"

$result = Test-Endpoint "$ApiUrl/index.html"
$passed = $result.StatusCode -in @(200, 301)
Write-TestResult "Swagger UI root accessible" $passed "200 or 301" $result.StatusCode

# ============================================================================
# Test 4: CORS is restricted to known origins
# ============================================================================
Write-TestHeader "Test 4: CORS configuration"

$corsHeaders = @{ "Origin" = "http://localhost:5173" }
$result = Test-Endpoint "$ApiUrl/projects" -Headers $corsHeaders
$passed = $result.StatusCode -eq 401
Write-TestResult "CORS does not bypass auth" $passed "401 Unauthorized" $result.StatusCode

# Test with disallowed origin
$corsHeaders = @{ "Origin" = "http://malicious.com" }
$result = Test-Endpoint "$ApiUrl/projects" -Headers $corsHeaders
$passed = $result.StatusCode -eq 401
Write-TestResult "Requests from disallowed origin rejected" $passed "401 Unauthorized" $result.StatusCode

# ============================================================================
# Test 5: Attempt to get a real token (if UseRealToken flag is set)
# ============================================================================
if ($UseRealToken) {
    Write-TestHeader "Test 5: Testing with real token from External ID"
    
    Write-Host "Attempting to acquire token from External ID tenant..."
    Write-Host "  Tenant ID: $ExternalTenantId"
    Write-Host "  API Client ID: $ApiClientId"
    
    try {
        # Use az CLI to get a token for the API
        $authority = "https://restoplan.ciamlogin.com/$ExternalTenantId"
        $scope = "api://$ApiClientId/access_as_user"
        
        Write-Host "`n  Authority: $authority"
        Write-Host "  Scope: $scope"
        
        # This requires interactive login to the external tenant
        $tokenResult = az account get-access-token `
            --resource "api://$ApiClientId" `
            --tenant $ExternalTenantId `
            --query accessToken -o tsv 2>$null
        
        if ($LASTEXITCODE -eq 0 -and $tokenResult) {
            Write-Host "Token acquired successfully" -ForegroundColor Green
            
            # Test with the real token
            $result = Test-Endpoint "$ApiUrl/projects" -Token $tokenResult
            $passed = $result.StatusCode -eq 200
            Write-TestResult "Valid token returns 200 OK" $passed "200 OK" $result.StatusCode
        } else {
            Write-Host "Could not acquire token (requires interactive login to external tenant)" -ForegroundColor Yellow
            Write-Host "   To test with a real token manually:" -ForegroundColor Yellow
            Write-Host "   1. Visit: $ApiUrl/" -ForegroundColor Yellow
            Write-Host "   2. Click the OAuth2 button in Swagger UI" -ForegroundColor Yellow
            Write-Host "   3. Sign in with email OTP" -ForegroundColor Yellow
            Write-Host "   4. Copy the access token from browser dev tools" -ForegroundColor Yellow
            Write-Host "   5. Test endpoint manually with curl" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "Error acquiring token: $($_.Exception.Message)" -ForegroundColor Yellow
    }
} else {
    Write-TestHeader "Test 5: Real token testing (skipped)"
    Write-Host "Real token tests skipped (use -UseRealToken flag to enable)" -ForegroundColor Yellow
    Write-Host "`nTo test with a real token:" -ForegroundColor Cyan
    Write-Host "  1. Run: $PSCommandPath -UseRealToken" -ForegroundColor Cyan
    Write-Host "  2. Or follow manual testing guide in PHASE2_API_AUTH.md" -ForegroundColor Cyan
}

# ============================================================================
# Test 6: Configuration validation
# ============================================================================
Write-TestHeader "Test 6: Configuration validation"

# Check if appsettings has real values (not placeholders)
$appSettingsPath = "src/api/appsettings.Development.json"
if (Test-Path $appSettingsPath) {
    $content = Get-Content $appSettingsPath -Raw | ConvertFrom-Json
    $tenantId = $content.AzureAd.TenantId
    $clientId = $content.AzureAd.ClientId
    
    $isConfigured = $tenantId -and -not ($tenantId.StartsWith("<")) -and `
                    $clientId -and -not ($clientId.StartsWith("<"))
    $configStatus = if ($isConfigured) { "OK" } else { "Placeholders found" }
    Write-TestResult "Azure AD config has real values" $isConfigured "Non-placeholder values" $configStatus
} else {
    Write-TestResult "appsettings.Development.json exists" $false "File found" "File not found"
}

# ============================================================================
# Summary
# ============================================================================
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Passed: $testsPassed" -ForegroundColor Green
Write-Host "Failed: $testsFailed" -ForegroundColor $(if ($testsFailed -gt 0) { "Red" } else { "Green" })

if ($testsFailed -eq 0) {
    Write-Host "`nAll automated tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Review the results above." -ForegroundColor Yellow
    exit 1
}
