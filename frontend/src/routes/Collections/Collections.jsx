import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ContainerRow from "../../components/ContainerRow";
import CollectionForm from "../../components/CollectionForm";
import { useAuth } from "../../context/AuthContext";
import getCollections from "../../services/getCollections";
import createCollection from "../../services/createCollection";
import updateCollection from "../../services/updateCollection";
import deleteCollection from "../../services/deleteCollection";

function Collections() {
  const { headers, isAuth } = useAuth();
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);

  const load = () => {
    setLoading(true);
    setError("");
    getCollections({ headers })
      .then((data) => setCollections(data?.collections || []))
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!isAuth) {
      navigate("/");
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuth]);

  const handleCreate = ({ name, description }) =>
    createCollection({ name, description, headers }).then((collection) => {
      setCollections((prev) => [{ ...collection, articlesCount: 0 }, ...prev]);
    });

  const handleUpdate = (id) => ({ name, description }) =>
    updateCollection({ id, name, description, headers }).then((updated) => {
      setCollections((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updated } : item)),
      );
      setEditingId(null);
    });

  const handleDelete = (id) => {
    if (!window.confirm("Delete this collection? Saved articles are not deleted.")) {
      return;
    }
    deleteCollection({ id, headers })
      .then(() => setCollections((prev) => prev.filter((item) => item.id !== id)))
      .catch((err) => setError(String(err)));
  };

  const renderList = () => {
    if (loading) return <p data-testid="collections-loading">Loading collections...</p>;
    if (error) {
      return (
        <ul className="error-messages">
          <li data-testid="collections-error">{error}</li>
        </ul>
      );
    }
    if (collections.length === 0) {
      return (
        <p data-testid="collections-empty">
          You have no collections yet. Create your first one above.
        </p>
      );
    }

    return (
      <div data-testid="collections-list">
        {collections.map((collection) =>
          editingId === collection.id ? (
            <div className="collection-item" key={collection.id}>
              <CollectionForm
                initialName={collection.name}
                initialDescription={collection.description || ""}
                submitLabel="Save"
                onSubmit={handleUpdate(collection.id)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <div
              className="collection-item"
              key={collection.id}
              style={{ borderBottom: "1px solid #e5e5e5", padding: "1rem 0" }}
            >
              <Link to={`/collections/${collection.id}`} state={collection}>
                <h2 style={{ marginBottom: "0.25rem", wordBreak: "break-word" }}>
                  {collection.name}
                </h2>
              </Link>
              {collection.description && (
                <p style={{ wordBreak: "break-word" }}>{collection.description}</p>
              )}
              <span className="date">{collection.articlesCount} article(s)</span>
              <div style={{ marginTop: "0.5rem" }}>
                <Link
                  className="btn btn-sm btn-outline-primary"
                  to={`/collections/${collection.id}`}
                  state={collection}
                >
                  Open
                </Link>{" "}
                <button
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => setEditingId(collection.id)}
                >
                  Edit
                </button>{" "}
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDelete(collection.id)}
                  data-testid="delete-collection"
                >
                  Delete
                </button>
              </div>
            </div>
          ),
        )}
      </div>
    );
  };

  return (
    <div className="collections-page">
      <ContainerRow type="page">
        <div className="col-md-8 offset-md-2 col-xs-12">
          <h1>My Collections</h1>
          <p className="text-muted">Private lists of articles you have saved.</p>
          <CollectionForm submitLabel="Create collection" onSubmit={handleCreate} />
          <hr />
          {renderList()}
        </div>
      </ContainerRow>
    </div>
  );
}

export default Collections;
