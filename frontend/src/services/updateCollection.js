import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function updateCollection({ id, name, description, headers }) {
  try {
    const { data } = await axios({
      headers,
      method: "PUT",
      url: `api/collections/${id}`,
      data: { collection: { name, description } },
    });

    return data.collection;
  } catch (error) {
    errorHandler(error);
  }
}

export default updateCollection;
