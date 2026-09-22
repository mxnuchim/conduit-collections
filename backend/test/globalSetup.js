const path = require("path");
// Load backend/.env locally; in CI the TEST_DB_* vars come from the workflow env.
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
process.env.NODE_ENV = "test";

const { sequelize } = require("../models");

// Build a clean schema from the models once before the API suite runs.
module.exports = async function () {
  await sequelize.sync({ force: true });
  await sequelize.close();
};
