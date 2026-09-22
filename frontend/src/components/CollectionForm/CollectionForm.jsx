import { useState } from "react";
import FormFieldset from "../FormFieldset";

function CollectionForm({
  initialName = "",
  initialDescription = "",
  submitLabel = "Create collection",
  onSubmit,
  onCancel,
}) {
  const isEdit = Boolean(initialName);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Collection name is required");
      return;
    }

    setSubmitting(true);
    setError("");
    Promise.resolve(onSubmit({ name: trimmedName, description: description.trim() }))
      .then(() => {
        if (!isEdit) {
          setName("");
          setDescription("");
        }
      })
      .catch((err) => setError(String(err)))
      .finally(() => setSubmitting(false));
  };

  return (
    <form onSubmit={handleSubmit} data-testid="collection-form">
      <FormFieldset
        name="name"
        normal
        placeholder="Collection name"
        required
        value={name}
        handler={(event) => setName(event.target.value)}
      />
      <fieldset className="form-group">
        <textarea
          className="form-control"
          placeholder="Description (optional)"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
      </fieldset>

      {error && (
        <ul className="error-messages">
          <li data-testid="collection-form-error">{error}</li>
        </ul>
      )}

      <button
        className="btn btn-primary"
        type="submit"
        disabled={submitting || !name.trim()}
        data-testid="collection-form-submit"
      >
        {submitting ? "Saving..." : submitLabel}
      </button>
      {onCancel && (
        <button
          className="btn btn-outline-secondary"
          type="button"
          onClick={onCancel}
          style={{ marginLeft: "0.5rem" }}
        >
          Cancel
        </button>
      )}
    </form>
  );
}

export default CollectionForm;
