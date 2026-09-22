# Design Note — Private Article Collections

## Data model

Two tables, matching the starter's Sequelize conventions (integer PKs, camelCase
timestamps, pluralised table names):

- **`Collections`** — `id`, `name` (NOT NULL), `description` (nullable), `userId`
  (FK → `Users`, `ON DELETE CASCADE`), timestamps.
- **`CollectionArticles`** — join table with a **composite primary key
  `(collectionId, articleId)`**, both FKs `ON DELETE CASCADE`, plus a `createdAt`
  used to order a collection "most recently saved first".

The composite PK is the key decision: "an article appears at most once in a
collection" is a data integrity rule, so it is enforced by the database, not just by
application code. The cascade rules mean deleting a collection removes only its
membership rows (articles are untouched) and deleting an article removes its
membership rows (no dangling references). `Collection.toJSON()` strips `userId` so
ownership never leaks to clients.

Why a join table rather than, say, a JSON array of slugs on the collection: a join
table gives referential integrity, database-enforced uniqueness, indexed membership
lookups in both directions, and cheap pagination — none of which a JSON column offers.

## API and authorization

REST under `/api/collections`: list/create, get/update/delete `/:id`, and membership
`/:id/articles` (GET paginated, POST `{ slug }`, DELETE `/:slug`). Errors reuse the
app's `{ errors: { body: [...] } }` shape and status codes (401/404/409/422).

Authorization is the core of the feature. Every handler derives the owner from the
JWT (`req.loggedUser.id`) and **every query is scoped by `userId`**:
`Collection.findOne({ where: { id, userId } })`. A `userId` in the request body or
query is never read. Because lookups are owner-scoped, a collection that does not
exist and one that belongs to someone else are indistinguishable — both return
**404** — so the API never leaks the existence of another user's private data. This
defeats horizontal privilege escalation via any id in the URL, body or query. Article
membership is addressed by `slug` (the public identifier the API already exposes),
never by a trusted client-supplied numeric id.

## Keeping reads efficient at scale

Assume millions of articles and hundreds of thousands of users; a given user has
tens, occasionally hundreds, of collections, each with up to thousands of articles.

- **Indexes chosen from the actual access paths:** `Collections(userId)` (every
  list/detail query filters by owner) and the join's PK `(collectionId, articleId)`
  (uniqueness + the detail lookup), plus `CollectionArticles(articleId)` for reverse
  lookups and the article-delete cascade. No speculative indexes.
- **List without N+1:** the collection list returns each collection's article count
  from a single grouped `COUNT(articles.id)` aggregate (a `LEFT JOIN` so empty
  collections report 0), plus one `Collection.count` for the total — two queries
  regardless of collection count.
- **Detail pagination happens in the database:** `LIMIT/OFFSET` with a bounded page
  size (default 10, clamped to 50) and a single `author` join — no per-row queries,
  no loading a whole collection into memory. Article bodies are excluded from the list
  response.

At the stated scale these paths stay index-backed and bounded. The one honest weak
spot is deep `OFFSET` pagination on a very large collection; keyset (cursor)
pagination on `(createdAt, articleId)` is the next step (below).

## Caching and invalidation

None is added for a 3-day scope, and for good reason: collection data is per-user,
private, and read by a single client that just wrote it, so a shared cache buys
little and adds correctness risk. If read volume warranted it, the natural unit is a
per-user cache of the collection list under a key like `user:{id}:collections`,
invalidated on create/rename/delete and on any membership add/remove for that user
(all of which already funnel through the controller, so invalidation hooks are
localised). A collection's article page could be cached per `(collectionId, page)`
and invalidated on membership change for that collection. I would cache the *list*
before the *detail*, since the list is hit on every visit to the area.

## Production monitoring

Feature-specific signals, not generic dashboards:

- **Authorization failures:** rate of 404s from owner-scoped lookups and 401s on
  these routes — a spike suggests broken links, a bug, or someone probing ids.
- **Duplicate-add rate (409s):** high values point to a UI that isn't reflecting
  membership state.
- **Query latency** for the list and detail paths (p95/p99) and DB pool
  saturation — the first thing to move if collections grow large.
- **Collection-size distribution** (articles per collection) to know when OFFSET
  pagination needs to become keyset.
- Standard 5xx rate and error-log volume on `/api/collections`.

## Trade-off made for the 3-day window

The collection detail list deliberately **omits `favorited` / `favoritesCount`**
per article. Computing them the way the starter's article list does means a query per
article (an N+1 the brief explicitly warns against); doing it correctly means an extra
grouped aggregate and per-user favourite join. I chose a lean, O(1)-per-page article
DTO instead, keeping the detail path fast and simple. The article's own page still
shows full favourite state, so nothing is lost functionally.

## What I would do with two more days

1. **Keyset pagination** on collection detail (`WHERE (createdAt, articleId) < …`) to
   remove the deep-OFFSET cost on large collections.
2. **Favourite state in the detail list** via a single grouped favourites aggregate,
   restoring parity with article cards without reintroducing N+1.
3. **Rate limiting** on membership mutations and a small per-user cache for the list
   with the invalidation hooks described above.
4. **Richer collection ownership tests under concurrency** (parallel duplicate adds)
   and a load test to confirm the index plan at size.
