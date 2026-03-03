# Pearl of the Orient API Docs

This documentation is powered by **Redocly** and based on the API implemented in this repository.

## Quick start

1. Install Redocly CLI (if not installed):
   - `npm i -D @redocly/cli`
2. Lint the API description:
   - `npx redocly lint`
3. Preview docs locally:
   - `npx redocly preview-docs`
4. Build static docs:
   - `npx redocly build-docs -o docs/index.html`

## Files

- `index.md` - landing page for your docs project.
- `openapi.yaml` - OpenAPI source used by Redocly.
- `redocly.yaml` - Redocly configuration and lint rules.

## API coverage

The OpenAPI description includes:

- Auth endpoints
- Users endpoints
- Branch Service endpoints
- Organization Chart endpoints
- Shared schemas, responses, parameters, and security schemes
