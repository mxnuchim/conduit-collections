import axios from "axios";
import errorHandler from "../helpers/errorHandler";

async function getCollections({ headers }) {
  try {
    const { data } = await axios({ headers, url: "api/collections" });

    return data;
  } catch (error) {
    errorHandler(error);
  }
}

export default getCollections;
