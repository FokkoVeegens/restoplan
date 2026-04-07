# Security Policy

## Supported Versions

This project is under active development. Security fixes are applied to the latest version on the `main` branch only.

| Version | Supported          |
| ------- | ------------------ |
| latest (`main`) | ✅ Yes |
| older commits   | ❌ No  |

## Reporting a Vulnerability

If you discover a security vulnerability in this repository, **please do not open a public GitHub issue**. Instead, use one of the following private channels:

- **GitHub Private Vulnerability Reporting** (preferred): Use the [Report a vulnerability](../../security/advisories/new) button on the Security tab of this repository.
- **Email**: Contact the repository owner directly via their [GitHub profile](https://github.com/FokkoVeegens).

Please include as much detail as possible in your report:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Affected component(s): API (`src/api`), Web frontend (`src/web`), infrastructure (`infra`), or CI/CD workflows (`.github/workflows`)
- Any suggested mitigations or fixes

## Response Timeline

| Milestone | Target timeframe |
| --------- | ---------------- |
| Acknowledgement of report | Within **5 business days** |
| Initial assessment / triage | Within **10 business days** |
| Fix or mitigation published | Depends on severity; critical issues are prioritized |

## Scope

The following are in scope for security reports:

- **API** (`src/api`): C# .NET 8 Web API — injection attacks, authentication/authorization bypasses, insecure deserialization, sensitive data exposure
- **Web frontend** (`src/web`): React + Vite app — XSS, CSRF, insecure dependencies, exposed secrets
- **Infrastructure** (`infra`): Azure Bicep templates — overly permissive IAM roles, insecure network configurations, Key Vault misconfigurations
- **CI/CD workflows** (`.github/workflows`): GitHub Actions — supply-chain attacks, secret leakage, insecure use of third-party actions
- **Dependencies**: Vulnerabilities in NuGet packages (`src/api`) or npm packages (`src/web`)

The following are **out of scope**:

- Theoretical or unproven vulnerabilities without a working proof of concept
- Social engineering or phishing attacks
- Vulnerabilities in upstream dependencies that are already publicly known and tracked by Dependabot
- Issues in the Azure Cosmos DB Emulator used only for local development

## Security Best Practices for Contributors

- **Never commit secrets.** Use dotnet user-secrets for local API configuration and GitHub Actions secrets for CI/CD pipelines.
- **Keep dependencies up to date.** This repository uses [Dependabot](.github/dependabot.yml) to automatically propose updates for NuGet, npm, Docker, GitHub Actions, and Dev Container dependencies.
- **Follow least-privilege principles** when modifying Azure infrastructure in `infra/`. Managed identities and Azure Key Vault are already used to avoid hard-coded credentials.
- **Run CodeQL scans locally** or review the results from the [CodeQL workflow](.github/workflows/codeql.yml) before merging changes.
