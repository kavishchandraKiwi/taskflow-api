# Onboarding Assignment — TaskFlow API

A Backend REST API for a Project & Task Management System**

---

## Overview

This one-week onboarding assignment is designed to get you hands-on with backend development using **Node.js, Nest.Js, Postgres, and Git** — the foundation of how we build server-side systems.

You will build **TaskFlow API**, a fully functional REST API for a project and task management application. There is no frontend — everything will be tested via **Postman** (or any HTTP client). By the end of the week, you will have built a production-style backend with authentication, relational data, and clean API design.

> **Duration:** 5 working days  
> **Stack:** Node.js, Nest.Js.js, Postgres, Git  
> **Testing:** Jest (unit) · Supertest (E2E)  
> **Submission:** Pull Request to your personal fork of the starter repo

---

## Learning Goals

By completing this assignment, you will be comfortable with:

- Structuring an Nest.Js.js project in a scalable, maintainable way
- Designing a normalised relational database schema in Postgres
- Writing raw SQL queries (SELECT, INSERT, UPDATE, DELETE, JOINs)
- Managing a database connection pool and understanding why it matters
- Implementing JWT-based authentication and route-level authorisation
- Writing REST APIs that follow standard conventions (methods, status codes, error shapes)
- Validating request bodies and handling errors gracefully
- Writing unit tests for middleware and business logic with **Jest**
- Writing end-to-end API tests against a real test database with **Supertest**
- Understanding the difference between what to unit test and what to E2E test
- Writing meaningful Git commits and opening a Pull Request

---

## The Project: TaskFlow API

TaskFlow is a project management backend where clients can:

- Register and authenticate as users
- Create and manage **Projects**
- Break projects into **Tasks** with priorities, statuses, and due dates
- Assign tasks to other users

---

## Feature Requirements

### Must-Have (Core)

Each feature below lists its functional requirements, followed by **acceptance scenarios** in Given/When/Then form. The scenarios define the behaviour your implementation must satisfy and map directly to the E2E tests you will write.

#### 1. Authentication

- Create a new user account
- Validate credentials and return a signed JWT
- Passwords must be hashed with **bcryptjs** — never store plaintext
- All non-auth endpoints must require a valid JWT in the `Authorization: Bearer <token>` header
- Return Unauthorized for missing or invalid tokens

**Acceptance scenarios:**

```gherkin
Scenario: Register with valid details
  Given no user exists with the email "alice@example.com"
  When I register with a name, that email, and a valid password
  Then the account is created
  And the response does not contain the password or its hash

Scenario: Register with a duplicate email
  Given a user already exists with the email "alice@example.com"
  When I register again with that same email
  Then the request is rejected as a conflict

Scenario: Log in with correct credentials
  Given a registered user with a known email and password
  When I log in with those credentials
  Then I receive a signed JWT

Scenario: Log in with a wrong password
  Given a registered user
  When I log in with the correct email but the wrong password
  Then the request is rejected as unauthorised

Scenario: Access a protected resource without a token
  Given I have no valid JWT
  When I request any non-auth endpoint
  Then the request is rejected as unauthorised
```

#### 2. Projects

- Full CRUD: create, list, get by ID, update, delete
- A project has a name, description, and optional deadline
- The user who creates a project is automatically its owner
- Only the project owner may update or delete it — return Forbidden otherwise
- Listing projects returns only the projects the authenticated user is a member of

**Acceptance scenarios:**

```gherkin
Scenario: Create a project
  Given I am an authenticated user
  When I create a project with a name
  Then the project is created
  And I am recorded as its owner

Scenario: List shows only my projects
  Given I am a member of project A but not of project B
  When I list my projects
  Then project A is returned
  And project B is not returned

Scenario: Non-owner cannot delete a project
  Given I am a member of a project but not its owner
  When I try to delete that project
  Then the request is rejected as forbidden

Scenario: Owner deletes a project
  Given I am the owner of a project
  When I delete that project
  Then the project is removed
  And all of its tasks are removed with it

Scenario: Fetch a project that does not exist
  Given no project exists with the id 9999
  When I request the project with id 9999
  Then the response indicates the project was not found
```

#### 3. Project Members

- Add a user to a project (owner only)
- Remove a member (owner only)
- List all members of a project

**Acceptance scenarios:**

```gherkin
Scenario: Owner adds a member
  Given I am the owner of a project
  And another registered user is not yet a member
  When I add that user to the project
  Then the user becomes a member of the project

Scenario: Non-owner cannot add a member
  Given I am a member of a project but not its owner
  When I try to add another user to the project
  Then the request is rejected as forbidden

Scenario: Owner removes a member
  Given I am the owner of a project
  And another user is a member of it
  When I remove that user from the project
  Then the user is no longer a member
```

#### 4. Tasks

- Tasks belong to a project
- Each task has: title, description, priority (`low` / `medium` / `high`), status (`todo` / `in_progress` / `done`), due date, and an optional assignee (must be a project member)
- Full CRUD on tasks — only project members may create, edit, or delete tasks in that project

**Acceptance scenarios:**

```gherkin
Scenario: Member creates a task
  Given I am a member of a project
  When I create a task in that project with a title, priority, and status
  Then the task is created and linked to the project

Scenario: Non-member cannot create a task
  Given I am not a member of a project
  When I try to create a task in that project
  Then the request is rejected as forbidden

Scenario: Assign a task to a non-member
  Given I am a member of a project
  And another user is not a member of that project
  When I create or update a task assigning it to that user
  Then the request is rejected as a bad request

Scenario: Update only a task's status
  Given I am a member of a project with an existing task
  When I update only the status of that task to "done"
  Then the task's status becomes "done"
  And its other fields are unchanged

Scenario: Reject an invalid status value
  Given I am a member of a project with an existing task
  When I update the task's status to a value outside the allowed set
  Then the request is rejected as a bad request

Scenario: Only the creator or project owner can delete a task
  Given a task created by another user in a project I do not own
  When I try to delete that task
  Then the request is rejected as forbidden
```

---

### Good-to-Have (Bonus)

These are optional but demonstrate initiative:

- Pagination on list endpoints
- Filter tasks by status or priority
- Search tasks by title
- Soft deletes — mark records as deleted rather than removing them from the database
- Request logging middleware that prints method, path, status code, and response time for every request
- Achieve 80%+ code coverage across your test suite (run `jest --coverage` to check)
- Auto-generate an OpenAPI 3.0 spec using `swagger-jsdoc` and serve it at `GET /api/docs` using `swagger-ui-Nest.Js` — the spec should document all endpoints, request bodies, and response shapes

## Testing Requirements

Writing tests is a first-class deliverable, not an afterthought. Your test suite should give a reviewer confidence that the API behaves correctly — including error cases, not just the happy path.

### Tools

- **Jest** — test runner and assertion library
- **Supertest** — makes real HTTP requests to your Nest.Js app without starting a server

---

## Week Schedule

### Day 1 — Project Setup & Database

### Day 2 — Authentication + Unit Tests

### Day 3 — Projects & Members + E2E Tests

### Day 4 — Tasks + E2E Tests

### Day 5 — Polish, Hardening & Submission

---

## README Requirements

Your `README.md` must include:

1. **Project description** — one paragraph on what this API does
2. **Prerequisites** — Node.js version, Postgres version
3. **Setup steps** — clone, install, configure `.env`, run `db/schema.sql`, run `db/seed.sql`, start the server
4. **Environment variables** — document every variable in `.env.example`
5. **How to run** — the exact command to start the server (`node server.js` or `npm run dev`)
6. **How to run tests** — setup steps for the test database and the `npm test` command
7. **API overview** — a brief table or list of the main route groups

A teammate should be able to clone your repo and have the server running locally in under 5 minutes. If you implemented the OpenAPI bonus, mention the `/api/docs` URL in the README.

---

## Evaluation Criteria

| Area                      | Weight | What we look for                                                                          |
|--------------------------|---------------------------------------------------------------------------------------------------|
| **Functionality**         | 25%    | All endpoints work correctly, including auth and authorisation                            |
| **Tests**                 | 25%    | Unit tests cover middleware; E2E tests cover happy paths and key error cases; all pass    |
| **Code Quality**          | 20%    | Clean structure, single-responsibility, no business logic in routes                       |
| **API Design**            | 15%    | Correct HTTP methods, status codes, consistent response shapes                            |
| **Database Design**       | 10%    | Normalised schema, correct FK constraints, cascade/null rules, parameterised queries throughout |
| **Git Hygiene**           | 3%     | Regular commits, descriptive messages, PR has a summary with coverage output              |
| **README**                | 2%     | Easy to set up locally; test setup and run instructions included                          |

---

## Resources

### Node.js & Nest.Js

- [Nest.Js.js — Getting Started](https://Nest.Jsjs.com/en/starter/installing.html)
- [Nest.Js routing guide](https://Nest.Jsjs.com/en/guide/routing.html)
- [Nest.Js error handling](https://Nest.Jsjs.com/en/guide/error-handling.html)

### Postgres**

- [Postgres — JOIN reference](https://dev.Postgres.com/doc/refman/8.0/en/join.html)
- [Postgres — Foreign key constraints](https://dev.Postgres.com/doc/refman/8.0/en/create-table-foreign-keys.html)

### Authentication**

- [bcryptjs on npm](https://www.npmjs.com/package/bcryptjs)
- [jsonwebtoken on npm](https://www.npmjs.com/package/jsonwebtoken)
- [JWT.io — debugger and intro](https://jwt.io/introduction)

### Validation**

- [Zod documentation](https://zod.dev)
- [Nest.Js-validator](https://Nest.Js-validator.github.io/docs/)

### Testing**

- [Jest — Getting Started](https://jestjs.io/docs/getting-started)
- [Jest — Mock Functions](https://jestjs.io/docs/mock-functions)
- [Supertest on npm](https://www.npmjs.com/package/supertest)
- [Testing Nest.Js apps with Supertest](https://www.npmjs.com/package/supertest#example)

### REST conventions**

- [HTTP status codes reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status)
- [REST API design best practices](https://restfulapi.net)

### OpenAPI (bonus)**

- [swagger-jsdoc](https://www.npmjs.com/package/swagger-jsdoc)
- [swagger-ui-Nest.Js](https://www.npmjs.com/package/swagger-ui-Nest.Js)
- [OpenAPI 3.0 specification](https://swagger.io/specification/)

### Git**

- [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
- [Feature branch workflow](https://www.atlassian.com/git/tutorials/comparing-workflows/feature-branch-workflow)

---

## Questions & Help

- Don't spend more than **30 minutes stuck** on a single problem — ask your EM

Good luck, and have fun building!
