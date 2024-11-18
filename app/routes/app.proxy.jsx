import { Page } from "@shopify/polaris";
import { authenticate } from "../shopify.server";

export const loader = async ({ request }) => {
  const session = await authenticate.admin(request);
  console.log(
    "-------------------------proxyhit------------------------------",
  );
  // You can access session details like accessToken, shop, etc.
  // const accessToken = session?.accessToken;
  // const shop = session?.shop;

  return new Response(JSON.stringify("hello"), {
    headers: { "Content-Type": "application/json" },
  });
};
