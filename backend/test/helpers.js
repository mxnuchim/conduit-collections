const request = require("supertest");
const app = require("../app");
const { User } = require("../models");

let counter = 0;
const unique = () => {
  counter += 1;
  return `${Date.now()}_${counter}`;
};

// Register a user through the real signup endpoint (passwords are hashed there,
// unlike the seed data) and return an auth header derived from the JWT.
const registerUser = async (overrides = {}) => {
  const suffix = unique();
  const user = {
    username: `user_${suffix}`,
    email: `user_${suffix}@test.com`,
    password: "password123",
    ...overrides,
  };
  const res = await request(app).post("/api/users").send({ user });
  const created = res.body.user;
  return {
    user: created,
    headers: { Authorization: `Token ${created.token}` },
  };
};

const createArticle = async (headers, overrides = {}) => {
  const article = {
    title: `Article ${unique()}`,
    description: "desc",
    body: "body",
    tagList: [],
    ...overrides,
  };
  const res = await request(app)
    .post("/api/articles")
    .set(headers)
    .send({ article });
  return res.body.article;
};

const createCollection = async (headers, overrides = {}) => {
  const res = await request(app)
    .post("/api/collections")
    .set(headers)
    .send({ collection: { name: `Collection ${unique()}`, ...overrides } });
  return res.body.collection;
};

const dbUserId = async (username) => {
  const found = await User.findOne({ where: { username } });
  return found.id;
};

module.exports = { app, request, registerUser, createArticle, createCollection, dbUserId };
