# ============================================
# Stage 1: Run tests and generate Allure report
# ============================================
FROM mcr.microsoft.com/playwright:v1.50.0-noble AS test-runner

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy test files and config
COPY playwright.config.ts tsconfig.json ./
COPY tests/ ./tests/

# Accept BASE_URL as build argument
ARG BASE_URL=http://host.docker.internal:1880
ENV BASE_URL=${BASE_URL}
ENV CI=true

# Run tests (continue even if tests fail — we still want the report)
RUN npx playwright test --reporter=list,allure-playwright || true

# Generate Allure report
RUN npx allure generate allure-results --clean -o allure-report

# ============================================
# Stage 2: Serve report via Nginx
# ============================================
FROM nginx:alpine AS report-server

# Copy the generated report
COPY --from=test-runner /app/allure-report /usr/share/nginx/html

# Expose port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
