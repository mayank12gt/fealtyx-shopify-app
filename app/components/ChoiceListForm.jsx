// app/components/ChoiceListForm.jsx
import { useState } from "react";
import { Card, ChoiceList, Button, Toast, Form } from "@shopify/polaris";
import { useFetcher } from "@remix-run/react";

// export const action = async ({ request }) => {
//   console.log("herechoicelist");

//   console.log("here2");
//   const formData = await request.formData();
//   const hideOn = formData.get("hideOn");

//   console.log("hideOn" + hideOn);

//   //   const { res } = await admin.graphql(`
//   //       #graphql
//   //       mutation {
//   //         metafieldsSet(metafields: {
//   //           ownerId: "${shopIdResponseJson.data.shop.id}"
//   //           namespace: "custom"
//   //           key: "fealtyx_offerbar_hideon"
//   //           value: "${result.EntityId}"
//   //           type: "single_line_text_field"
//   //     }) {
//   //           metafields {
//   //             id
//   //             namespace
//   //             key
//   //             value
//   //           }
//   //           userErrors {
//   //             field
//   //             message
//   //           }
//   //         }
//   //       }
//   //     `);

//   return null;
// };

export default function ChoiceListForm() {
  // Make sure this is initialized as an array
  const fetcher = useFetcher();

  return <></>;
}
