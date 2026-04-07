# Security Policy

> **Note**: This is a personal hobby project intended for private use. It has no commercial users or SLAs. The security policy below reflects that context.

## Supported Versions

Security fixes are applied to the latest version on the `main` branch only.

| Version | Supported          |
| ------- | ------------------ |
| latest (`main`) | ✅ Yes |
| older commits   | ❌ No  |

## Reporting a Vulnerability

If you discover a security vulnerability, **please do not open a public GitHub issue**. Instead, report it privately:

- **GitHub Private Vulnerability Reporting** (preferred): Use the [Report a vulnerability](../../security/advisories/new) button on the Security tab of this repository.
- **Direct contact**: Reach the maintainer via their [GitHub profile](https://github.com/FokkoVeegens).

Please include:

- A description of the vulnerability and its potential impact
- Steps to reproduce the issue
- Affected component(s): API (`src/api`), Web frontend (`src/web`), infrastructure (`infra`), or CI/CD workflows (`.github/workflows`)
- Any suggested mitigations or fixes

## Response Timeline

This is a hobby project maintained in spare time, so responses are **best-effort** rather than guaranteed. The maintainer will aim to:

- Acknowledge the report as soon as reasonably possible
- Assess and address the issue based on availability and severity

There are no guaranteed response windows or formal SLAs.

## Scope

The following are in scope for security reports:

- **API** (`src/api`): C# .NET 9 Web API — injection attacks, insecure deserialization, sensitive data exposure
- **Web frontend** (`src/web`): React + Vite app — XSS, insecure dependencies, exposed secrets
- **Infrastructure** (`infra`): Azure Bicep templates — overly permissive IAM roles, Key Vault misconfigurations
- **CI/CD workflows** (`.github/workflows`): GitHub Actions — supply-chain attacks, secret leakage, insecure use of third-party actions
- **Dependencies**: Vulnerabilities in NuGet packages (`src/api`) or npm packages (`src/web`)

The following are **out of scope**:

- Theoretical or unproven vulnerabilities without a working proof of concept
- Social engineering or phishing attacks
- Vulnerabilities in upstream dependencies already publicly known and tracked by Dependabot
- Issues in the Azure Cosmos DB Emulator used only for local development
- Issues that require access to another user's private deployment of this project

## Security Best Practices for Contributors

- **Never commit secrets.** Use dotnet user-secrets for local API configuration and GitHub Actions secrets for CI/CD pipelines.
- **Keep dependencies up to date.** This repository uses [Dependabot](.github/dependabot.yml) to automatically propose updates for NuGet, npm, Docker, GitHub Actions, and Dev Container dependencies.
- **Follow least-privilege principles** when modifying Azure infrastructure in `infra/`. Managed identities and Azure Key Vault are already used to avoid hard-coded credentials.
- **Review CodeQL results** from the [CodeQL workflow](.github/workflows/codeql.yml) before merging changes.
