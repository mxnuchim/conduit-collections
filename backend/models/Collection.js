"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Collection extends Model {
    static associate({ User, Article }) {
      // Owner
      this.belongsTo(User, { foreignKey: "userId", as: "owner" });

      // Saved articles (membership). The join's composite PK prevents duplicates.
      this.belongsToMany(Article, {
        through: "CollectionArticles",
        as: "articles",
        foreignKey: "collectionId",
        otherKey: "articleId",
      });
    }

    toJSON() {
      return {
        ...this.get(),
        userId: undefined,
        articles: undefined,
      };
    }
  }
  Collection.init(
    {
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      description: DataTypes.TEXT,
    },
    {
      sequelize,
      modelName: "Collection",
    },
  );
  return Collection;
};
