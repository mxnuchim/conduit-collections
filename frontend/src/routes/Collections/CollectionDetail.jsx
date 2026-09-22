import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import ReactPaginate from "react-paginate";
import ArticleMeta from "../../components/ArticleMeta";
import ContainerRow from "../../components/ContainerRow";
import { useAuth } from "../../context/AuthContext";
import getCollection from "../../services/getCollection";
import getCollectionArticles from "../../services/getCollectionArticles";
import removeArticleFromCollection from "../../services/removeArticleFromCollection";

const LIMIT = 10;

function CollectionDetail() {
  const { id } = useParams();
  const { state } = useLocation();
  const { headers, isAuth } = useAuth();
  const navigate = useNavigate();

  const [collection, setCollection] = useState(state || null);
  const [articles, setArticles] = useState([]);
  const [articlesCount, setArticlesCount] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pendingSlug, setPendingSlug] = useState("");

  const loadArticles = useCallback(
    (nextPage) =>
      getCollectionArticles({ id, headers, limit: LIMIT, page: nextPage }).then(
        (data) => {
          setArticles(data?.articles || []);
          setArticlesCount(data?.articlesCount || 0);
        },
      ),
    [id, headers],
  );

  useEffect(() => {
    if (!isAuth) {
      navigate("/");
      return;
    }

    setLoading(true);
    setError("");
    Promise.all([
      getCollection({ id, headers }).then(setCollection),
      loadArticles(0).then(() => setPage(0)),
    ])
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, isAuth]);

  const handlePageChange = ({ selected }) => {
    setPage(selected);
    loadArticles(selected).catch((err) => setError(String(err)));
  };

  const handleRemove = (slug) => {
    setPendingSlug(slug);
    removeArticleFromCollection({ id, slug, headers })
      .then(() => {
        // Reload the current page so counts and pagination stay consistent.
        const isLastItemOnPage = articles.length === 1 && page > 0;
        const targetPage = isLastItemOnPage ? page - 1 : page;
        setPage(targetPage);
        return loadArticles(targetPage);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setPendingSlug(""));
  };

  const renderArticles = () => {
    if (loading) return <p data-testid="collection-loading">Loading collection...</p>;
    if (error) {
      return (
        <ul className="error-messages">
          <li data-testid="collection-error">{error}</li>
        </ul>
      );
    }
    if (articles.length === 0) {
      return (
        <p data-testid="collection-empty">
          This collection has no articles yet. Open an article and use “Save” to add one.
        </p>
      );
    }

    return (
      <div data-testid="collection-articles">
        {articles.map((article) => (
          <div className="article-preview" key={article.slug}>
            <ArticleMeta author={article.author} createdAt={article.createdAt}>
              <button
                className="btn btn-sm btn-outline-danger pull-xs-right"
                disabled={pendingSlug === article.slug}
                onClick={() => handleRemove(article.slug)}
                data-testid="remove-article"
              >
                <i className="ion-trash-a"></i> Remove
              </button>
            </ArticleMeta>
            <Link className="preview-link" to={`/article/${article.slug}`}>
              <h1 style={{ wordBreak: "break-word" }}>{article.title}</h1>
              <p style={{ wordBreak: "break-word" }}>{article.description}</p>
              <span>Read more...</span>
            </Link>
          </div>
        ))}

        <ReactPaginate
          activeClassName="active"
          breakClassName="page-item"
          breakLabel="..."
          breakLinkClassName="page-link"
          containerClassName="pagination pagination-sm"
          forcePage={page}
          nextClassName="page-item"
          nextLabel={<i className="ion-arrow-right-b"></i>}
          nextLinkClassName="page-link"
          onPageChange={handlePageChange}
          pageClassName="page-item"
          pageCount={Math.ceil(articlesCount / LIMIT)}
          pageLinkClassName="page-link"
          previousClassName="page-item"
          previousLabel={<i className="ion-arrow-left-b"></i>}
          previousLinkClassName="page-link"
          renderOnZeroPageCount={null}
        />
      </div>
    );
  };

  return (
    <div className="collection-detail-page">
      <ContainerRow type="page">
        <div className="col-md-8 offset-md-2 col-xs-12">
          <Link to="/collections">← Back to My Collections</Link>
          <h1 style={{ wordBreak: "break-word" }}>{collection?.name || "Collection"}</h1>
          {collection?.description && (
            <p style={{ wordBreak: "break-word" }}>{collection.description}</p>
          )}
          <hr />
          {renderArticles()}
        </div>
      </ContainerRow>
    </div>
  );
}

export default CollectionDetail;
