## Project Overview
This project is a Playwright Test Automation Framework developed to automate API testing for the Simple Books API (A publicly available API).

The framework follows the **Service Object Model (SOM)** design pattern, promoting:
- **Reusability** - Can re-use service methods across multiple test cases.
- **Scalability** - Easier to extend the framework to accommodate additional API endpoints & test scenarios.
- **Maintainability** - Keeps the API service logic separate from test scripts for better organization & easier maintenance.

The framework covers multiple API test scenarios across the following endpoints:
- **Books** - Testing book-related API operations.
- **Orders** - Testing order-related API operations.
- **Authentication** - Testing authentication-related functionality.

## Test Coverage
The framework covers the following API endpoints and test scenarios:
### Endpoints
- Authentication
   - POST /api-clients
- Books
   - GET /books
   - GET /books/:bookId
- Orders
   - GET /orders
   - GET /orders/:orderId
   - PATCH /orders/:orderId
   - DELETE /orders/:orderId
   - POST /orders
### Test Scenarios
- Authentication Endpoints
   - Positive flow
      - register valid API client
   - Negative flow
      - re-register existing API client
- Books Endpoints
   - Positive flow
      - get books without query parameters
      - get books with valid query parameters
      - get a book with valid book id
   - Negative flow
      - get books with invalid 'type' query parameter
      - get books with invalid 'limit' query parameter
      - get books with both invalid (type & limit) query parameters
      - get a book with invalid book id
- Orders Endpoints
   - Positive flow
      - get orders
      - get an order
      - post an order
      - patch a customer name of an existing order
      - delete an order
   - Negative flow
      - get orders without authorization
      - get an order without authorization
      - post an order with invalid authorization
      - post an order with invalid data (unavailable book id)
      - post an order without authorization
      - post an order without request body
      - patch a customer name without authorization
      - delete an order without authorization
### Summary
- Total Test Cases: 22
- Passed: 22
- Failed: 0

## Authorization & Credentials
The authorization credentials required for protected API endpoints can be obtained through the following process:
### 1. Credential Acquisition 
Send a request to the /api-clients/ endpoint using the API client registration details to obtain the access token.
   - For API Client Registration Details, navigate to [Simple Books API Documentation page](https://github.com/vdespa/introduction-to-postman-course/blob/main/simple-books-api.md#api-authentication). 
### 2. Environment Variables 
Stored the acquired credentials as environment variables rather than being hardcoded into the test scripts.
### 3. Credential Utilization
The stored credentials are retrieved from environment variables and used in test cases that require authorization.

This approach helps to avoid hardcoding the sensitive credentials in the source code & makes credential management easier.

## Tech Stack
- **Playwright** - Automation framework
- **TypeScript** - Programming language
- **Node.js** - JavaScript runtime environment

## Project Structure
The framework is organized into following components:
- *services/*: Contains service classes (.ts files) representing different API resources. Each class encapsulates reusable methods for interacting with the respective API endpoints.
- *tests/*: Contains test scripts that utilize the service classes to execute different API test scenarios.
- *utilities/basic-utils.ts*: Contains common utility/helper functions shared across the framework.
- *env.example*: Provides a template for the environment variables required to run the tests.
This structure promotes separation of concerns by keeping API service logic separate from test implementation.
    
## Pre-requisites:
- Node.js - Latest LTS version recommended
- npm (included with Node.js)
- Git (for cloning the repository)

## Installation & Setup:
### 1. Clone the Repository
- `git clone <repo-link>`

### 2. Navigate to the Project Directory
- `cd <project folder>`

### 3. Verify Node.js and npm Installation
- `node --version`
- `npm --version`

### 4. Install Project Dependencies
- `npm ci`
. This installs the project dependencies using the exact versions specified in package-lock.json.

### 5. Configure Environment Variables
- Create a .env file in the project root directory.
- Use env.example as a reference for the required environment variables.
- Populate the .env file with your API credentials and other required configuration values.

Make sure the .env file is included in .gitignore to prevent sensitive information from being pushed to GitHub.

## How to Run Tests:
To execute all test cases inside the tests/ directory:
- `npx playwright test`

## Test Reports:
After test execution, Playwright generates an HTML report. To view the latest HTML test report:
- `npx playwright show-report` 