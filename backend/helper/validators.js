const { FieldRequiredError, ValidationError } = require("./customErrors");

const NAME_MAX = 100;
const DESCRIPTION_MAX = 1000;
const PAGE_LIMIT_DEFAULT = 10;
const PAGE_LIMIT_MAX = 50;

// Validate a collection name. When `required`, a missing/blank value throws.
const validateName = (name, { required } = {}) => {
  if (name === undefined) {
    if (required) throw new FieldRequiredError("A collection name");
    return undefined;
  }
  if (typeof name !== "string") throw new ValidationError("Name must be text");

  const trimmed = name.trim();
  if (!trimmed) throw new FieldRequiredError("A collection name");
  if (trimmed.length > NAME_MAX) {
    throw new ValidationError(`Name must be at most ${NAME_MAX} characters`);
  }
  return trimmed;
};

// Description is optional; null/empty clears it.
const validateDescription = (description) => {
  if (description === undefined) return undefined;
  if (description === null) return null;
  if (typeof description !== "string") {
    throw new ValidationError("Description must be text");
  }

  const trimmed = description.trim();
  if (trimmed.length > DESCRIPTION_MAX) {
    throw new ValidationError(
      `Description must be at most ${DESCRIPTION_MAX} characters`,
    );
  }
  return trimmed;
};

// Route ids must be positive integers; anything else is malformed (422),
// distinct from a well-formed id that simply does not belong to the user (404).
const parseId = (value, label = "id") => {
  if (!/^\d+$/.test(String(value))) {
    throw new ValidationError(`Invalid ${label}`);
  }
  return Number(value);
};

// Bound pagination in the database, not in memory. Bad input falls back to
// safe defaults rather than erroring, matching the existing article listing.
const parsePagination = (query = {}) => {
  const rawLimit = Number.parseInt(query.limit, 10);
  const rawOffset = Number.parseInt(query.offset, 10);

  const limit = Number.isNaN(rawLimit)
    ? PAGE_LIMIT_DEFAULT
    : Math.min(Math.max(rawLimit, 1), PAGE_LIMIT_MAX);
  const page = Number.isNaN(rawOffset) ? 0 : Math.max(rawOffset, 0);

  return { limit, offset: page * limit };
};

module.exports = {
  NAME_MAX,
  DESCRIPTION_MAX,
  PAGE_LIMIT_DEFAULT,
  PAGE_LIMIT_MAX,
  validateName,
  validateDescription,
  parseId,
  parsePagination,
};
