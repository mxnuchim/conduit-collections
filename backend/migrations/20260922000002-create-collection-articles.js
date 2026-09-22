"use strict";
module.exports = {
  async up(queryInterface, Sequelize) {
    // Composite primary key (collectionId, articleId) enforces "an article can
    // appear at most once per collection" at the database layer.
    await queryInterface.createTable("CollectionArticles", {
      collectionId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: { model: "Collections", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      articleId: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.INTEGER,
        references: { model: "Articles", key: "id" },
        onDelete: "CASCADE",
        onUpdate: "CASCADE",
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    // Reverse lookups (e.g. cascading when an article is deleted).
    await queryInterface.addIndex("CollectionArticles", ["articleId"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("CollectionArticles");
  },
};
