import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function addArticleToCollection({ id, slug, headers }) {
  try {
    const { data } = await axios({
      headers,
      method: "POST",
      url: `api/collections/${id}/articles`,
      data: { slug },
    });

    return data;
  } catch (error) {
    errorHandler(error);
  }
}

export default addArticleToCollection;
