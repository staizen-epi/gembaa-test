# Gembaa Test Automation

Playwright-based test automation with Allure reporting. The application under test runs on Docker — this project is purely for test infrastructure.

## Quick Start

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install chromium

# Copy and configure environment
cp .env.example .env

# Run tests
npm test

# Generate and view Allure report
npm run report
```

## Project Structure

```
├── specs/          # Application specs (source of truth for test cases)
├── tests/          # Playwright test files
├── k8s/            # Kubernetes deployment manifests
├── Dockerfile      # Multi-stage build: run tests → serve report
└── .github/        # CI/CD workflows
```

## Writing Specs & Tests

1. **Write a spec** in `specs/` following the format in [specs/README.md](specs/README.md)
2. **Create a test** in `tests/` that maps to your spec
3. **Run tests** with `npm test`

## npm Scripts

| Script | Description |
|--------|-------------|
| `npm test` | Run all Playwright tests |
| `npm run test:headed` | Run tests with browser visible |
| `npm run test:debug` | Run tests in debug mode |
| `npm run report:generate` | Generate Allure report from results |
| `npm run report:open` | Open the Allure report |
| `npm run report` | Generate + open report |

## Docker (Allure Report Image)

Build a Docker image that runs tests and serves the Allure report:

```bash
docker build --build-arg BASE_URL=http://host.docker.internal:1880 -t allure-report .
docker run -p 8080:80 allure-report
# View report at http://localhost:8080
```

## CI/CD

The GitHub Actions workflow (`.github/workflows/test-and-report.yml`) automatically:

1. Runs tests against the configured `BASE_URL`
2. Builds a Docker image with the Allure report
3. Pushes to Docker Hub

### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `BASE_URL` | Application base URL for tests |

## Kubernetes Deployment

```bash
# Update the image name in k8s/deployment.yml with your Docker Hub username
kubectl apply -f k8s/deployment.yml
```

## Environment

| Variable | Default | Description |
|----------|---------|-------------|
| `BASE_URL` | `http://localhost:1880` | Application URL |
| `CI` | — | Set automatically in CI environments |
