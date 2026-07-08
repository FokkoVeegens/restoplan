# Restoplan Application Tests

The included [Playwright](https://playwright.dev/) smoke test will hit the Restoplan app web endpoint, create, and delete an item.

## Run Tests

The endpoint it hits will be discovered in this order:

1. Value of `REACT_APP_WEB_BASE_URL` environment variable
1. Value of `REACT_APP_WEB_BASE_URL` found in default .azure environment
1. Defaults to `http://localhost:3000`

To run the tests:

1. CD to /tests
1. Run `npm i && npx playwright install`
1. Run `npx playwright test`

You can use the `--headed` flag to open a browser when running the tests.

## Debug Tests

Add the `--debug` flag to run with debugging enabled. You can find out more info here: https://playwright.dev/docs/next/test-cli#reference

```bash
npx playwright test --debug
```

More debugging references: https://playwright.dev/docs/debug and https://playwright.dev/docs/trace-viewer

## Phase 2: Authentication Tests

Once Phase 2 (JWT Bearer authentication) is implemented, use the automated authentication tests:

### Quick Start

```powershell
# Run all automated Phase 2 authentication tests
./phase2-auth-tests.ps1

# Or use VS Code task: Ctrl+Shift+P > "Tasks: Run Task" > "Test Phase 2 Auth (Automated)"
```

### Test Coverage

The automated test suite validates:
- ✅ Requests without token get `401 Unauthorized`
- ✅ Invalid tokens are rejected
- ✅ Swagger UI is accessible anonymously
- ✅ CORS is properly enforced
- ✅ Azure AD configuration is correct

### Manual Token Testing

For testing with real tokens from the External ID tenant:

1. Start API: `dotnet run` from `src/api/`
2. Open Swagger UI: `http://localhost:3100/`
3. Click "Authorize" button and sign in with email OTP
4. Use the acquired token to test endpoints:
   ```bash
   curl http://localhost:3100/projects \
     -H "Authorization: Bearer <token>"
   # Expect: 200 OK
   ```

See [Phase 2 Testing Guide](../docs/PHASE2_API_AUTH.md) for complete details.