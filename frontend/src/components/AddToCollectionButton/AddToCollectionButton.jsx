import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import getCollections from "../../services/getCollections";
import createCollection from "../../services/createCollection";
import addArticleToCollection from "../../services/addArticleToCollection";

function AddToCollectionButton({ slug }) {
  const { headers, isAuth } = useAuth();
  const [open, setOpen] = useState(false);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [newName, setNewName] = useState("");

  const loadCollections = () => {
    setLoading(true);
    setError("");
    getCollections({ headers })
      .then((data) => setCollections(data?.collections || []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  const toggle = () => {
    if (!isAuth) return alert("You need to login first");
    const next = !open;
    setOpen(next);
    setStatus("");
    setError("");
    if (next) loadCollections();
  };

  const addTo = (id) => {
    if (pending) return;
    setPending(true);
    setStatus("");
    setError("");
    addArticleToCollection({ id, slug, headers })
      .then(() => setStatus("Saved"))
      .catch((err) => setError(String(err)))
      .finally(() => setPending(false));
  };

  const createAndAdd = (event) => {
    event.preventDefault();
    const name = newName.trim();
    if (!name || pending) return;
    setPending(true);
    setStatus("");
    setError("");
    createCollection({ name, headers })
      .then((collection) =>
        addArticleToCollection({ id: collection.id, slug, headers }).then(() => {
          setCollections((prev) => [{ ...collection, articlesCount: 1 }, ...prev]);
          setNewName("");
          setStatus("Saved to new collection");
        }),
      )
      .catch((err) => setError(String(err)))
      .finally(() => setPending(false));
  };

  return (
    <span className="dropdown add-to-collection">
      <button
        className="btn btn-sm btn-outline-primary"
        disabled={pending}
        onClick={toggle}
        data-testid="save-to-collection"
      >
        <i className="ion-folder"></i>&nbsp;Save
      </button>

      <div
        className="dropdown-menu"
        style={{ display: open ? "block" : "none", padding: "0.5rem", minWidth: "16rem" }}
      >
        {loading ? (
          <span className="dropdown-item disabled">Loading collections...</span>
        ) : (
          <>
            {collections.length === 0 ? (
              <span className="dropdown-item disabled">No collections yet</span>
            ) : (
              collections.map((collection) => (
                <button
                  key={collection.id}
                  className="dropdown-item"
                  disabled={pending}
                  onClick={() => addTo(collection.id)}
                  data-testid="collection-option"
                >
                  {collection.name}
                </button>
              ))
            )}

            <div className="dropdown-divider"></div>

            <form onSubmit={createAndAdd} style={{ padding: "0 0.5rem" }}>
              <input
                className="form-control form-control-sm"
                placeholder="New collection name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                data-testid="new-collection-name"
              />
              <button
                className="btn btn-sm btn-primary"
                type="submit"
                disabled={pending || !newName.trim()}
                style={{ marginTop: "0.5rem" }}
              >
                Create &amp; save
              </button>
            </form>

            {status && (
              <p className="text-success" style={{ margin: "0.5rem" }} data-testid="save-status">
                {status}
              </p>
            )}
            {error && (
              <p className="error-messages" style={{ margin: "0.5rem" }} data-testid="save-error">
                {error}
              </p>
            )}
          </>
        )}
      </div>
    </span>
  );
}

export default AddToCollectionButton;
