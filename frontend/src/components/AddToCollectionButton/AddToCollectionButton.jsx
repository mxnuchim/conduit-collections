import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import getCollections from "../../services/getCollections";
import createCollection from "../../services/createCollection";
import addArticleToCollection from "../../services/addArticleToCollection";
import "./AddToCollectionButton.css";

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
    <span className="add-to-collection">
      <button
        className={`btn btn-sm btn-outline-primary ${open ? "active" : ""}`}
        disabled={pending}
        onClick={toggle}
        data-testid="save-to-collection"
      >
        <i className="ion-folder"></i>&nbsp;Save
      </button>

      {open && (
        <>
          <div
            className="collection-popover__backdrop"
            onClick={() => setOpen(false)}
          />
          <div className="collection-popover">
            <div className="collection-popover__title">Add to collection</div>

            {loading ? (
              <div className="collection-popover__muted">Loading collections…</div>
            ) : (
              <>
                {collections.length === 0 ? (
                  <div className="collection-popover__muted">No collections yet</div>
                ) : (
                  <ul className="collection-popover__list">
                    {collections.map((collection) => (
                      <li key={collection.id}>
                        <button
                          className="collection-popover__item"
                          disabled={pending}
                          onClick={() => addTo(collection.id)}
                          data-testid="collection-option"
                        >
                          <span className="collection-popover__item-name">
                            {collection.name}
                          </span>
                          <span className="collection-popover__count">
                            {collection.articlesCount ?? 0}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="collection-popover__divider" />

                <form className="collection-popover__create" onSubmit={createAndAdd}>
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
                  >
                    Create &amp; save
                  </button>
                </form>

                {status && (
                  <div className="collection-popover__status" data-testid="save-status">
                    {status}
                  </div>
                )}
                {error && (
                  <div className="collection-popover__error" data-testid="save-error">
                    {error}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </span>
  );
}

export default AddToCollectionButton;
