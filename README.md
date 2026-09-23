# ![RealWorld Example App](logo.png)

> **React / Vite + SWC / Express.js / Sequelize / PostgreSQL codebase containing real world examples (CRUD, auth, advanced patterns, etc) that adheres to the [RealWorld](https://realworld.io/) spec and API.**

This codebase was created to demonstrate a fully fledged fullstack application built with **React / Vite + SWC / Express.js / Sequelize / PostgreSQL** including CRUD operations, authentication, routing, pagination, and more.

**[Demo app](https://conduit-realworld-example-app.fly.dev/)&nbsp;&nbsp;|&nbsp;&nbsp;[With Create React App](https://github.com/TonyMckes/conduit-realworld-example-app/tree/create-react-app)&nbsp;&nbsp;|&nbsp;&nbsp;[Other RealWorld Example Apps](https://codebase.show/projects/realworld?category=fullstack)**

> For more information on how to this works with other frontends/backends, head over to the [RealWorld](https://github.com/gothinkster/realworld) repo.

---

## Private Article Collections (Metcore assessment)

This fork adds a **private Collections** feature on top of the starter Conduit app.
An authenticated user can create named collections (with an optional description),
rename them, edit the description, delete them, save articles into them and remove
them again, and browse a collection's saved articles with pagination. Collections
are private: ownership is enforced on the server and one user can never read or
modify another user's collection by changing an id, body or query parameter.

See [`DESIGN_NOTE.md`](DESIGN_NOTE.md) for the data model, API, authorization and
scaling decisions.

### What was added

- **Backend:** `Collection` model, two migrations (`Collections` + the
  `CollectionArticles` join with a composite primary key), a RESTful
  `/api/collections` controller/routes, input validation and a `409` conflict
  error for duplicate membership.
- **Frontend:** a **My Collections** area (list/create/rename/edit/delete/open), a
  collection detail view with pagination and article removal, and a **Save** control
  on the article page.
- **Tests:** backend integration tests (supertest), frontend component tests
  (Testing Library) and a Playwright end-to-end flow.
- **Tooling:** ESLint, a split Vitest config and a GitHub Actions workflow.

### Requirements

- **Node.js** `v18.11+` (CI runs Node 20; Node 20.19+/22 is recommended so the Vite
  and test tooling run without engine warnings).
- **PostgreSQL** (the app ships the `pg` driver).

### Setup

```bash
git clone <your-private-repo-url>
cd conduit-realworld-example-app
npm install
```

**Environment.** Copy the example file into the backend workspace and adjust the
values for your database. The backend loads `.env` from the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

`.env` and real secrets are git-ignored; only `backend/.env.example` is committed.

**Database.** Provide a PostgreSQL server one of these ways:

- Use the bundled compose file: `docker compose up -d` (Postgres 16 matching
  `.env.example`), or
- Point `DEV_DB_*` / `TEST_DB_*` at your own local PostgreSQL.

Then create and migrate the schema (migrations are the source of truth — no manual
schema changes):

```bash
npm run sqlz -- db:create          # development database
npm run sqlz -- db:migrate
NODE_ENV=test npm run sqlz -- db:create   # separate test database
NODE_ENV=test npm run sqlz -- db:migrate
npm run sqlz -- db:seed:all         # optional demo data
```

### Run

```bash
npm run dev        # frontend http://localhost:3000  +  API http://localhost:3001/api
npm run start      # build the frontend and serve it from the backend (production)
```

### Tests, lint and build

```bash
npm run test:run   # all unit + integration tests once (backend needs the test DB)
npm test           # same suites in watch mode
npm run test:e2e   # Playwright end-to-end (starts the app against the test DB)
npm run lint       # ESLint
npm run build -w frontend   # production frontend build
```

Run a single Vitest project with `npx vitest run --project backend-api`
(`backend-unit` / `frontend` are the others). The first Playwright run needs
`npx playwright install chromium`.

### Assumptions

- The starter builds its full schema at boot via `sequelize.sync({ alter: true })`
  and ships migrations only for the base tables. That behaviour is left intact; the
  new tables are delivered as complete, standalone migrations, and the test suite
  builds the schema from the models (the app's own mechanism) while CI also proves
  the migrations apply to a clean database.
- Articles are identified publicly by `slug` (the API hides numeric article ids), so
  membership endpoints accept a slug — consistent with the existing favourites API.
- A collection's numeric `id` appears in its URL; this is safe because every query is
  scoped to the authenticated owner, so a guessed id returns `404`.

### Known limitations

- The collection detail list intentionally omits per-article `favorited` /
  `favoritesCount` to keep the query O(1) per page and avoid the N+1 pattern the
  starter's article list uses; the article's own page still shows full favourite state.
- The `.env.example` dialect was corrected from `mysql` to `postgres` and a typo'd
  `DB_LOGGING` key was fixed (the installed driver is `pg`).
- No caching or rate limiting is added yet (see `DESIGN_NOTE.md`).

### What changed from the starter

- Added the Collections model, migrations, controller, routes, validators and a
  `ConflictError`; extracted the Express app into `backend/app.js` (so it can be
  tested) while `backend/index.js` still owns `sync` + `listen`.
- Added the My Collections UI, services and the article **Save** control; added a
  nav entry.
- Added Vitest projects, ESLint, Playwright, a GitHub Actions workflow, a
  `docker-compose.yml`, and installed `happy-dom` (the starter referenced `jsdom`
  for tests but never installed it).
- No existing article, auth, profile, comment or feed behaviour was changed.

### AI Usage

AI tools (Claude Code) were used to accelerate exploration of the starter codebase,
scaffold the Collections backend/frontend following existing conventions, and draft
tests and documentation. All generated code was reviewed, run and adjusted; I understand and can explain every file committed.


---

## Getting Started

These instructions will help you install and run the project on your local machine for development and testing.

### Prerequisites

Before you run the project, make sure that you have the following tools and software installed on your computer:

- Text editor/IDE (e.g., VS Code, Sublime Text, Atom)
- [Git](https://git-scm.com/downloads)
- [Node.js](https://nodejs.org/en/download/) `v18.11.0+`
- [NPM](https://www.npmjs.com/) (usually included with Node.js)
- SQL database

### Installation

To install the project on your computer, follow these steps:

1. Clone the repository to your local machine.

   ```bash
   git clone https://github.com/TonyMckes/conduit-realworld-example-app.git
   ```

2. Navigate to the project directory.

   ```bash
   cd conduit-realworld-example-app
   ```

3. Install project dependencies by running the command:

   ```bash
   npm install
   ```

### Configuration

1. Create a `.env` file in the root directory of the project
2. Add the required environment variables as specified in the [`.env.example`](backend/.env.example) file
3. (Optional) update the Sequelize configuration parameters in the [`config.js`](backend/config/config.js) file
4. If you are **not** using PostgreSQL, you may also have to install the driver for your database:

   <details>
   <summary>Use one of the following commands to install:</summary><br/>

   > Note: `-w backend` option is used to install it in the backend [`package.json`](backend/package.json).

   ```bash
   npm install -w backend pg pg-hstore  # Postgres (already installed)
   npm install -w backend mysql2
   npm install -w backend mariadb
   npm install -w backend sqlite3
   npm install -w backend tedious       # Microsoft SQL Server
   npm install -w backend oracledb      # Oracle Database
   ```

   > :information_source: Visit [Sequelize - Installing](https://sequelize.org/docs/v6/getting-started/#installing) for more infomation.

   ***

   </details>

5. Create database specified by configuration by executing

   > :warning: Please, make sure you have already created a superuser for your database.

   ```bash
   npm run sqlz -- db:create
   ```

   > :information_source: The command `npm run sqlz` is an alias for `npx -w backend sequelize-cli`.  
   > Execute `npm run sqlz -- --help` to see more of `sequelize-cli` commands availables.

6. Optionally you can run the following command to populate your database with some dummy data:

   ```bash
   npm run sqlz -- db:seed:all
   ```

### Usage

#### Development Server

To run the project, follow these steps:

1. Start the development server by executing the command:

   ```bash
   npm run dev
   ```

2. Open a web browser and navigate to:
   - Home page should be available at [`http://localhost:3000/`](http://localhost:3000).
   - API endpoints should be available at [`http://localhost:3001/api`](http://localhost:3001/api).

#### Running Tests

To run tests, simply run the following command:

```bash
npm run test
```

#### Production

The following command will build the production version of the app:

```bash
npm run start
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [RealWorld](https://realworld.io/)
- [RealWorld (GitHub)](https://github.com/gothinkster/realworld)
- [CodebaseShow](https://codebase.show/)
- [How to write a Good readme](https://bulldogjob.com/news/449-how-to-write-a-good-readme-for-your-github-project)
