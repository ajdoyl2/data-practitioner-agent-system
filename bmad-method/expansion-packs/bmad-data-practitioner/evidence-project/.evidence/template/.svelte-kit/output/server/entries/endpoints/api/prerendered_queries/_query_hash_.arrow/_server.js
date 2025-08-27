import { get_cache_for_hash } from "@evidence-dev/universal-sql";
import { e as error } from "../../../../../chunks/index.js";
const GET = ({ params }) => {
  try {
    return new Response(get_cache_for_hash(params.query_hash));
  } catch (e) {
    throw error(404, "not found");
  }
};
export {
  GET
};
