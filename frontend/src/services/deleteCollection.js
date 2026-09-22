import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function deleteCollection({ id, headers }) {
  try {
    const { data } = await axios({
      headers,
      method: "DELETE",
      url: `api/collections/${id}`,
    });

    return data;
  } catch (error) {
    errorHandler(error);
  }
}

export default deleteCollection;
