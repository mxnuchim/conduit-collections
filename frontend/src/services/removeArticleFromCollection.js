import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function removeArticleFromCollection({ id, slug, headers }) {
  try {
    const { data } = await axios({
      headers,
      method: "DELETE",
      url: `api/collections/${id}/articles/${slug}`,
    });

    return data;
  } catch (error) {
    errorHandler(error);
  }
}

export default removeArticleFromCollection;
