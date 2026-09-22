import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function createCollection({ name, description, headers }) {
  try {
    const { data } = await axios({
      headers,
      method: "POST",
      url: "api/collections",
      data: { collection: { name, description } },
    });

    return data.collection;
  } catch (error) {
    errorHandler(error);
  }
}

export default createCollection;
