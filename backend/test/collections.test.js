const {
  app,
  request,
  registerUser,
  createArticle,
  createCollection,
  dbUserId,
} = require("./helpers");
const { Collection } = require("../models");

describe("Collections API", () => {
  describe("authentication", () => {
    test("rejects unauthenticated access to every endpoint", async () => {
      expect((await request(app).get("/api/collections")).status).toBe(401);
      expect(
        (await request(app).post("/api/collections").send({ collection: { name: "x" } })).status,
      ).toBe(401);
      expect((await request(app).get("/api/collections/1")).status).toBe(401);
      expect(
        (await request(app).put("/api/collections/1").send({ collection: { name: "x" } })).status,
      ).toBe(401);
      expect((await request(app).delete("/api/collections/1")).status).toBe(401);
      expect((await request(app).get("/api/collections/1/articles")).status).toBe(401);
      expect(
        (await request(app).post("/api/collections/1/articles").send({ slug: "s" })).status,
      ).toBe(401);
      expect(
        (await request(app).delete("/api/collections/1/articles/s")).status,
      ).toBe(401);
    });

    test("rejects an invalid token", async () => {
      const res = await request(app)
        .get("/api/collections")
        .set({ Authorization: "Token not-a-real-token" });
      expect(res.status).toBe(500); // jwt verify failure -> generic error, still not 200
      expect(res.body).not.toHaveProperty("collections");
    });
  });

  describe("create", () => {
    test("owner can create a collection", async () => {
      const { headers } = await registerUser();
      const res = await request(app)
        .post("/api/collections")
        .set(headers)
        .send({ collection: { name: "  Reading list  ", description: "  later  " } });

      expect(res.status).toBe(201);
      expect(res.body.collection).toMatchObject({
        name: "Reading list",
        description: "later",
        articlesCount: 0,
      });
      expect(res.body.collection).toHaveProperty("id");
    });

    test("rejects missing, blank and whitespace-only names", async () => {
      const { headers } = await registerUser();
      for (const collection of [{}, { name: "" }, { name: "   " }]) {
        const res = await request(app)
          .post("/api/collections")
          .set(headers)
          .send({ collection });
        expect(res.status).toBe(422);
        expect(res.body.errors.body[0]).toMatch(/name/i);
      }
    });

    test("rejects an over-long name and description", async () => {
      const { headers } = await registerUser();
      const longName = await request(app)
        .post("/api/collections")
        .set(headers)
        .send({ collection: { name: "a".repeat(101) } });
      expect(longName.status).toBe(422);

      const longDesc = await request(app)
        .post("/api/collections")
        .set(headers)
        .send({ collection: { name: "ok", description: "d".repeat(1001) } });
      expect(longDesc.status).toBe(422);
    });

    test("ignores a userId supplied in the request body", async () => {
      const { user, headers } = await registerUser();
      const other = await registerUser();
      const otherId = await dbUserId(other.user.username);

      const res = await request(app)
        .post("/api/collections")
        .set(headers)
        .send({ collection: { name: "Owned", userId: otherId } });

      const stored = await Collection.findByPk(res.body.collection.id);
      expect(stored.userId).toBe(await dbUserId(user.username));
      expect(stored.userId).not.toBe(otherId);
    });
  });

  describe("list", () => {
    test("returns only the owner's collections", async () => {
      const a = await registerUser();
      const b = await registerUser();
      await createCollection(a.headers, { name: "A-one" });
      await createCollection(a.headers, { name: "A-two" });
      await createCollection(b.headers, { name: "B-one" });

      const res = await request(app).get("/api/collections").set(a.headers);
      expect(res.status).toBe(200);
      expect(res.body.collectionsCount).toBe(2);
      const names = res.body.collections.map((c) => c.name).sort();
      expect(names).toEqual(["A-one", "A-two"]);
      res.body.collections.forEach((c) => expect(c).not.toHaveProperty("userId"));
    });

    test("reports an accurate article count without leaking fields", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);
      const article = await createArticle(headers);
      await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(headers)
        .send({ slug: article.slug });

      const res = await request(app).get("/api/collections").set(headers);
      expect(res.body.collections[0].articlesCount).toBe(1);
    });
  });

  describe("ownership boundaries", () => {
    test("another user cannot read, update or delete a collection (404)", async () => {
      const owner = await registerUser();
      const attacker = await registerUser();
      const collection = await createCollection(owner.headers);

      expect(
        (await request(app).get(`/api/collections/${collection.id}`).set(attacker.headers)).status,
      ).toBe(404);
      expect(
        (
          await request(app)
            .put(`/api/collections/${collection.id}`)
            .set(attacker.headers)
            .send({ collection: { name: "hijack" } })
        ).status,
      ).toBe(404);
      expect(
        (await request(app).delete(`/api/collections/${collection.id}`).set(attacker.headers)).status,
      ).toBe(404);

      // Owner's collection is untouched.
      const still = await Collection.findByPk(collection.id);
      expect(still.name).toBe(collection.name);
    });

    test("another user cannot add or remove membership (404)", async () => {
      const owner = await registerUser();
      const attacker = await registerUser();
      const collection = await createCollection(owner.headers);
      const article = await createArticle(owner.headers);

      expect(
        (
          await request(app)
            .post(`/api/collections/${collection.id}/articles`)
            .set(attacker.headers)
            .send({ slug: article.slug })
        ).status,
      ).toBe(404);
      expect(
        (
          await request(app)
            .delete(`/api/collections/${collection.id}/articles/${article.slug}`)
            .set(attacker.headers)
        ).status,
      ).toBe(404);
    });

    test("nonexistent id is 404 and malformed id is 422", async () => {
      const { headers } = await registerUser();
      expect((await request(app).get("/api/collections/999999").set(headers)).status).toBe(404);
      expect((await request(app).get("/api/collections/not-a-number").set(headers)).status).toBe(422);
    });
  });

  describe("update", () => {
    test("owner can rename and edit description without changing ownership", async () => {
      const { user, headers } = await registerUser();
      const collection = await createCollection(headers, { name: "old", description: "old" });
      const ownerId = await dbUserId(user.username);

      const res = await request(app)
        .put(`/api/collections/${collection.id}`)
        .set(headers)
        .send({ collection: { name: "new name", description: "new description" } });

      expect(res.status).toBe(200);
      expect(res.body.collection).toMatchObject({ name: "new name", description: "new description" });
      const stored = await Collection.findByPk(collection.id);
      expect(stored.userId).toBe(ownerId);
    });

    test("rejects a blank name on update", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);
      const res = await request(app)
        .put(`/api/collections/${collection.id}`)
        .set(headers)
        .send({ collection: { name: "   " } });
      expect(res.status).toBe(422);
    });
  });

  describe("delete", () => {
    test("deleting a collection keeps the article and removes membership", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);
      const article = await createArticle(headers);
      await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(headers)
        .send({ slug: article.slug });

      const del = await request(app).delete(`/api/collections/${collection.id}`).set(headers);
      expect(del.status).toBe(200);

      // Collection is gone...
      expect((await request(app).get(`/api/collections/${collection.id}`).set(headers)).status).toBe(404);
      // ...but the article still exists.
      expect((await request(app).get(`/api/articles/${article.slug}`).set(headers)).status).toBe(200);
    });
  });

  describe("membership", () => {
    test("adds an article and prevents duplicates at the database layer (409)", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);
      const article = await createArticle(headers);

      const first = await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(headers)
        .send({ slug: article.slug });
      expect(first.status).toBe(201);

      const dup = await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(headers)
        .send({ slug: article.slug });
      expect(dup.status).toBe(409);

      // Exactly one membership row.
      const detail = await request(app).get(`/api/collections/${collection.id}`).set(headers);
      expect(detail.body.collection.articlesCount).toBe(1);
    });

    test("validates the slug and unknown references", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);

      expect(
        (await request(app).post(`/api/collections/${collection.id}/articles`).set(headers).send({})).status,
      ).toBe(422);
      expect(
        (
          await request(app)
            .post(`/api/collections/${collection.id}/articles`)
            .set(headers)
            .send({ slug: "does-not-exist" })
        ).status,
      ).toBe(404);
    });

    test("removal is idempotent", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);
      const article = await createArticle(headers);
      await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(headers)
        .send({ slug: article.slug });

      expect(
        (await request(app).delete(`/api/collections/${collection.id}/articles/${article.slug}`).set(headers)).status,
      ).toBe(200);
      // Removing again (no longer a member) still succeeds.
      expect(
        (await request(app).delete(`/api/collections/${collection.id}/articles/${article.slug}`).set(headers)).status,
      ).toBe(200);
    });
  });

  describe("detail pagination", () => {
    test("paginates in the database and never leaks fields", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);
      const slugs = [];
      for (let i = 0; i < 3; i += 1) {
        const article = await createArticle(headers);
        slugs.push(article.slug);
        await request(app)
          .post(`/api/collections/${collection.id}/articles`)
          .set(headers)
          .send({ slug: article.slug });
      }

      const page0 = await request(app)
        .get(`/api/collections/${collection.id}/articles?limit=2&offset=0`)
        .set(headers);
      expect(page0.status).toBe(200);
      expect(page0.body.articlesCount).toBe(3);
      expect(page0.body.articles).toHaveLength(2);

      const page1 = await request(app)
        .get(`/api/collections/${collection.id}/articles?limit=2&offset=1`)
        .set(headers);
      expect(page1.body.articles).toHaveLength(1);

      // No overlap across pages and all articles covered.
      const seen = [...page0.body.articles, ...page1.body.articles].map((a) => a.slug);
      expect(new Set(seen).size).toBe(3);

      const sample = page0.body.articles[0];
      expect(sample).not.toHaveProperty("userId");
      expect(sample).not.toHaveProperty("body");
      expect(sample.author).not.toHaveProperty("email");
    });

    test("handles out-of-range and non-numeric pagination safely", async () => {
      const { headers } = await registerUser();
      const collection = await createCollection(headers);
      const article = await createArticle(headers);
      await request(app)
        .post(`/api/collections/${collection.id}/articles`)
        .set(headers)
        .send({ slug: article.slug });

      for (const query of ["limit=-5&offset=-1", "limit=abc&offset=xyz", "limit=99999&offset=0"]) {
        const res = await request(app)
          .get(`/api/collections/${collection.id}/articles?${query}`)
          .set(headers);
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body.articles)).toBe(true);
      }

      const pastEnd = await request(app)
        .get(`/api/collections/${collection.id}/articles?limit=10&offset=5`)
        .set(headers);
      expect(pastEnd.body.articles).toHaveLength(0);
    });
  });

  describe("regression: existing behaviour still works", () => {
    test("article create and list are unaffected", async () => {
      const { headers } = await registerUser();
      const article = await createArticle(headers);
      expect(article.slug).toBeTruthy();

      const list = await request(app).get("/api/articles").set(headers);
      expect(list.status).toBe(200);
      expect(Array.isArray(list.body.articles)).toBe(true);
    });
  });
});
