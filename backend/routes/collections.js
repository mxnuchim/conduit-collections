const express = require("express");
const router = express.Router();
const verifyToken = require("../middleware/authentication");
const {
  allCollections,
  createCollection,
  singleCollection,
  updateCollection,
  deleteCollection,
  listCollectionArticles,
  addArticle,
  removeArticle,
} = require("../controllers/collections");

//? List current user's collections
router.get("/", verifyToken, allCollections);
//* Create collection
router.post("/", verifyToken, createCollection);
// Single collection
router.get("/:id", verifyToken, singleCollection);
//* Update collection
router.put("/:id", verifyToken, updateCollection);
//* Delete collection
router.delete("/:id", verifyToken, deleteCollection);
//? Articles in a collection
router.get("/:id/articles", verifyToken, listCollectionArticles);
//* Add article to collection
router.post("/:id/articles", verifyToken, addArticle);
//* Remove article from collection
router.delete("/:id/articles/:slug", verifyToken, removeArticle);

module.exports = router;
