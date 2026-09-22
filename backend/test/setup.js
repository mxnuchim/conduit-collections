const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const { sequelize } = require("../models");

// The error handler logs every handled error; silence that expected noise so
// the test output stays readable (assertion failures are still reported).
beforeAll(() => {
  vi.spyOn(console, "log").mockImplementation(() => {});
});

// Isolate every test: wipe all rows (order-independent) before each one.
beforeEach(async () => {
  const [tables] = await sequelize.query(
    `SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> 'SequelizeMeta'`,
  );
  const names = tables.map((t) => `"${t.tablename}"`).join(", ");
  if (names) {
    await sequelize.query(`TRUNCATE ${names} RESTART IDENTITY CASCADE`);
  }
});

afterAll(async () => {
  await sequelize.close();
});
