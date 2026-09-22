const { fn, col, literal, UniqueConstraintError } = require("sequelize");
const {
  ConflictError,
  FieldRequiredError,
  NotFoundError,
  UnauthorizedError,
} = require("../helper/customErrors");
const {
  validateName,
  validateDescription,
  parseId,
  parsePagination,
} = require("../helper/validators");
const { Collection, Article, User } = require("../models");

// Ownership is derived from the authenticated user, never from the request.
// A collection that does not exist OR belongs to someone else both resolve to
// null here, so cross-user access is indistinguishable from "not found" (404).
const findOwnedCollection = async (req) => {
  const id = parseId(req.params.id);
  return Collection.findOne({ where: { id, userId: req.loggedUser.id } });
};

const authorInclude = {
  model: User,
  as: "author",
  attributes: ["username", "bio", "image"],
};

//? List the current user's collections (with article counts, no N+1)
const allCollections = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { limit, offset } = parsePagination(req.query);

    const collections = await Collection.findAll({
      where: { userId: loggedUser.id },
      attributes: {
        include: [[fn("COUNT", col("articles.id")), "articlesCount"]],
      },
      include: [
        { model: Article, as: "articles", attributes: [], through: { attributes: [] } },
      ],
      group: ["Collection.id"],
      order: [["createdAt", "DESC"]],
      limit,
      offset,
      subQuery: false,
    });

    for (const collection of collections) {
      collection.dataValues.articlesCount = Number(
        collection.dataValues.articlesCount,
      );
    }

    const collectionsCount = await Collection.count({
      where: { userId: loggedUser.id },
    });

    res.json({ collections, collectionsCount });
  } catch (error) {
    next(error);
  }
};

//* Create a collection
const createCollection = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const { name, description } = req.body.collection || {};
    const collection = await Collection.create({
      name: validateName(name, { required: true }),
      description: validateDescription(description) ?? null,
      userId: loggedUser.id,
    });

    collection.dataValues.articlesCount = 0;

    res.status(201).json({ collection });
  } catch (error) {
    next(error);
  }
};

// Single collection with its article count
const singleCollection = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const id = parseId(req.params.id);
    const collection = await Collection.findOne({
      where: { id, userId: loggedUser.id },
      attributes: {
        include: [[fn("COUNT", col("articles.id")), "articlesCount"]],
      },
      include: [
        { model: Article, as: "articles", attributes: [], through: { attributes: [] } },
      ],
      group: ["Collection.id"],
    });
    if (!collection) throw new NotFoundError("Collection");

    collection.dataValues.articlesCount = Number(
      collection.dataValues.articlesCount,
    );

    res.json({ collection });
  } catch (error) {
    next(error);
  }
};

//* Rename / edit description
const updateCollection = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const collection = await findOwnedCollection(req);
    if (!collection) throw new NotFoundError("Collection");

    const { name, description } = req.body.collection || {};
    const nextName = validateName(name);
    const nextDescription = validateDescription(description);
    if (nextName !== undefined) collection.name = nextName;
    if (nextDescription !== undefined) collection.description = nextDescription;
    await collection.save();

    collection.dataValues.articlesCount = await collection.countArticles();

    res.json({ collection });
  } catch (error) {
    next(error);
  }
};

//* Delete a collection (articles are untouched; membership rows cascade)
const deleteCollection = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const collection = await findOwnedCollection(req);
    if (!collection) throw new NotFoundError("Collection");

    await collection.destroy();

    res.json({ message: { body: ["Collection deleted successfully"] } });
  } catch (error) {
    next(error);
  }
};

//? Paginated articles inside a collection (DB-side pagination, no N+1)
const listCollectionArticles = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const collection = await findOwnedCollection(req);
    if (!collection) throw new NotFoundError("Collection");

    const { limit, offset } = parsePagination(req.query);

    const articlesCount = await collection.countArticles();
    const articles = await collection.getArticles({
      attributes: { exclude: ["body"] },
      include: [authorInclude],
      joinTableAttributes: [],
      order: [[literal('"CollectionArticles"."createdAt"'), "DESC"]],
      limit,
      offset,
    });

    res.json({ articles, articlesCount });
  } catch (error) {
    next(error);
  }
};

//* Add an article (by slug) to a collection
const addArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const collection = await findOwnedCollection(req);
    if (!collection) throw new NotFoundError("Collection");

    const { slug } = req.body || {};
    if (!slug) throw new FieldRequiredError("An article slug");

    const article = await Article.findOne({ where: { slug } });
    if (!article) throw new NotFoundError("Article");

    // Friendly fast-path; the composite PK is the real guarantee (and covers
    // the concurrent-add race that the check below cannot).
    if (await collection.hasArticle(article)) {
      throw new ConflictError("Article is already in this collection");
    }

    try {
      await collection.addArticle(article);
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ConflictError("Article is already in this collection");
      }
      throw error;
    }

    res.status(201).json({ message: { body: ["Article added to collection"] } });
  } catch (error) {
    next(error);
  }
};

//* Remove an article (by slug) from a collection (idempotent)
const removeArticle = async (req, res, next) => {
  try {
    const { loggedUser } = req;
    if (!loggedUser) throw new UnauthorizedError();

    const collection = await findOwnedCollection(req);
    if (!collection) throw new NotFoundError("Collection");

    const article = await Article.findOne({ where: { slug: req.params.slug } });
    if (!article) throw new NotFoundError("Article");

    await collection.removeArticle(article);

    res.json({ message: { body: ["Article removed from collection"] } });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  allCollections,
  createCollection,
  singleCollection,
  updateCollection,
  deleteCollection,
  listCollectionArticles,
  addArticle,
  removeArticle,
};
