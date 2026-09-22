import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function getCollectionArticles({ id, headers, limit = 10, page = 0 }) {
  try {
    const { data } = await axios({
      headers,
      url: `api/collections/${id}/articles?limit=${limit}&offset=${page}`,
    });

    return data;
  } catch (error) {
    errorHandler(error);
  }
}

export default getCollectionArticles;
