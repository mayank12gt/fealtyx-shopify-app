import { useState, useEffect } from "react";
import {
  Page,
  Form,
  TextField,
  Button,
  Card,
  ChoiceList,
  Layout,
  BlockStack,
} from "@shopify/polaris";

import { authenticate } from "../shopify.server";
import { json, useFetcher, useLoaderData } from "@remix-run/react";

// export const loader = async ({ request }) => {
//   const { admin } = await authenticate.admin(request);
//   const response = await admin.graphql(`
//     query shopInfo {
//       shop {
//         id
//         name
//         url
//         myshopifyDomain
//         metafield(namespace: "custom", key: "fealtyx_offerbar_hideon") {
//           id
//           key
//           value
//         }
//       }
//     }
//   `);

//   const resData = await response.json();

//   if (!response.ok) {
//     throw new Error("Failed to fetch shop metafield");
//   }

//   return json({ hideOnValue: resData.data.shop.metafield?.value || "" });
// };

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
   query shopInfo {
      shop {
        id
        name
        url
        myshopifyDomain
        metafields(
          first: 5,
          keys: [
            "custom.fealtyx_offerbar_hideon",
            "custom.fealtyx_username",
            "custom.fealtyx_password",
            "custom.fealtyx_token",
            "custom.fealtyx_token_expiry"
          ]
        ) {
          edges {
            node {
              id
              key
              value
            }
          }
        }
      }
    }
  
  `);

  const resData = await response.json();
  console.log("loader" + resData);

  if (!response.ok) {
    throw new Error("Failed to fetch shop metafields");
  }

  const metafields = resData.data.shop.metafields.edges;
  const getMetafieldValue = (key) => {
    const metafield = metafields.find((edge) => edge.node.key === key);
    return metafield?.node.value || "";
  };

  return json({
    hideOnValue: getMetafieldValue("custom.fealtyx_offerbar_hideon"),
    username: getMetafieldValue("custom.fealtyx_username"),
    userpass: getMetafieldValue("custom.fealtyx_password"),
    tokenExpiry: getMetafieldValue("custom.fealtyx_token_expiry"),
  });
};

export const action = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const shopIdResponse = await admin.graphql(`
    {
      shop {
        id
      }
    }
  `);
  const shopIdResponseJson = await shopIdResponse.json();

  const formData = await request.formData();

  if (formData.has("name") && formData.has("password")) {
    try {
      // Make API call to FealtyX authentication endpoint
      const authResponse = await fetch(
        "https://qa-api.fealtyx.com/user/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: formData.get("name"),
            userpass: formData.get("password"),
          }),
        },
      );

      // const responseText = await authResponse.text();
      // console.log("Raw response:", responseText);

      if (!authResponse.ok) {
        console.log("authres" + authResponse);
        throw new Error("Authentication failed");
      }

      const authData = await authResponse.json();
      const token = authData.Token;
      const entityType = authData.UserType;
      const entityId = authData.EntityId;
      const expiry = authData.Expiry;

      console.log("authdata" + authData);
      console.log("token" + token);
      console.log("entitytype" + entityType);
      console.log("entityid" + entityId);

      // Store token in metafield
      // await admin.graphql(`
      //   mutation {
      //     metafieldsSet(metafields: [{
      //       ownerId: "${shopIdResponseJson.data.shop.id}"
      //       namespace: "custom"
      //       key: "fealtyx_token"
      //       value: "${token}"
      //       type: "single_line_text_field"
      //     }]) {
      //       metafields {
      //         id
      //         key
      //         value
      //       }
      //       userErrors {
      //         field
      //         message
      //       }
      //     }
      //   }
      // `);

      const metafieldsResponse = await admin.graphql(`
        mutation {
          metafieldsSet(metafields: [
            {
              ownerId: "${shopIdResponseJson.data.shop.id}"
              namespace: "custom"
              key: "fealtyx_token"
              value: "${token}"
              type: "single_line_text_field"
            },
            {
              ownerId: "${shopIdResponseJson.data.shop.id}"
              namespace: "custom"
              key: "fealtyx_token_expiry"
              value: "${expiry}"
              type: "single_line_text_field"
            },
            {
              ownerId: "${shopIdResponseJson.data.shop.id}"
              namespace: "custom"
              key: "fealtyx_entity_id"
              value: "${entityId}"
              type: "single_line_text_field"
            },
            {
              ownerId: "${shopIdResponseJson.data.shop.id}"
              namespace: "custom"
              key: "fealtyx_entity_type"
              value: "${entityType}"
              type: "single_line_text_field"
            },
            {
              ownerId: "${shopIdResponseJson.data.shop.id}"
              namespace: "custom"
              key: "fealtyx_username"
              value: "${formData.get("name")}"
              type: "single_line_text_field"
            },
            {
              ownerId: "${shopIdResponseJson.data.shop.id}"
              namespace: "custom"
              key: "fealtyx_password"
              value: "${formData.get("password")}"
              type: "single_line_text_field"
            }
          ]) {
            metafields {
              id
              namespace
              key
              value
            }
            userErrors {
              field
              message
            }
          }
        }
      `);

      const metafieldsData = await metafieldsResponse.json();
      if (metafieldsData.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error(
          "Metafields set errors:",
          metafieldsData.data.metafieldsSet.userErrors,
        );
        throw new Error("Failed to save authentication data");
      }
    } catch (error) {
      console.log("error" + error);
    }
  }

  if (formData.has("hideOn")) {
    const hideOn = formData.getAll("hideOn").join(",") || "none";

    try {
      await admin.graphql(`
      mutation {
        metafieldsSet(metafields: [{
          ownerId: "${shopIdResponseJson.data.shop.id}"
          namespace: "custom"
          key: "fealtyx_offerbar_hideon"
          value: "${hideOn}"
          type: "single_line_text_field"
        }]) {
          metafields {
            id
            namespace
            key
            value
          }
          userErrors {
            field
            message
          }
        }
      }
    `);

      const metafieldsData = await metafieldsResponse.json();
      if (metafieldsData.data?.metafieldsSet?.userErrors?.length > 0) {
        console.error(
          "Metafields set errors:",
          metafieldsData.data.metafieldsSet.userErrors,
        );
        throw new Error("Failed to save authentication data");
      }
    } catch (error) {
      console.log("error" + error);
    }
  }

  return null;
};

export default function Settings() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const fetcher = useFetcher();
  const { hideOnValue, username, userpass, tokenExpiry } = useLoaderData();

  console.log("username" + username);
  console.log("userpass" + userpass);
  console.log("tokenExpiry" + tokenExpiry);

  // Ensure this logic runs only on the client
  const [hideOn, setHideOn] = useState([]);

  useEffect(() => {
    setHideOn(hideOnValue.split(","));
  }, [hideOnValue]);

  useEffect(() => {
    setName(username);
  }, [username]);

  useEffect(() => {
    setPassword(userpass);
  }, [userpass]);

  useEffect(() => {
    const expiryDate = new Date(tokenExpiry);
    const now = new Date();
    console.log("exp:" + expiryDate);
    console.log("now:" + now);

    if (now >= expiryDate) {
      shopify.toast.show("Access token expired. Please Login again");
    }
  }, [tokenExpiry]);

  const handleSubmit = () => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("password", password);
    fetcher.submit(formData, { method: "post" });
  };

  const handleSubmitHideOn = () => {
    const formData = new FormData();
    const hideOnString = hideOn.join(",");
    formData.append("hideOn", hideOnString);
    fetcher.submit(formData, { method: "post" });
  };

  // return (
  //   <Page title="Log In with your FealtyX account">
  //     <Card sectioned>
  //       <Form onSubmit={handleSubmit}>
  //         <TextField
  //           label="FealtyX Username"
  //           value={name}
  //           onChange={setName}
  //           error={error}
  //         />
  //         <TextField
  //           label="Password"
  //           type="password"
  //           value={password}
  //           onChange={setPassword}
  //           error={error}
  //         />
  //         <Button submit primary>
  //           Log In
  //         </Button>
  //       </Form>
  //     </Card>

  //     <Card sectioned>
  //       <Form>
  //         <ChoiceList
  //           title="Hide Offer Bar On"
  //           choices={[
  //             { label: "Contact Page", value: "contact" },
  //             { label: "Product Page", value: "product" },
  //             { label: "Cart", value: "cart" },
  //           ]}
  //           selected={hideOn}
  //           onChange={setHideOn}
  //           allowMultiple
  //         />
  //         <Button onClick={handleSubmitHideOn} primary>
  //           Save
  //         </Button>
  //       </Form>
  //     </Card>
  //   </Page>
  // );

  return (
    <Page title="Log In with your FealtyX account">
      <Layout>
        <Layout.Section>
          <BlockStack vertical spacing="loose" gap={400}>
            <Card sectioned>
              <Form onSubmit={handleSubmit}>
                <BlockStack vertical spacing="medium">
                  <TextField
                    label="FealtyX Username"
                    value={name}
                    onChange={setName}
                    error={error}
                  />
                  <TextField
                    label="Password"
                    type="password"
                    value={password}
                    onChange={setPassword}
                    error={error}
                  />
                  <div style={{ marginTop: "1rem" }}>
                    <Button submit primary>
                      Log In
                    </Button>
                  </div>
                </BlockStack>
              </Form>
            </Card>

            <Card sectioned>
              <Form>
                <BlockStack vertical spacing="medium">
                  <ChoiceList
                    title="Hide Offer Bar On"
                    choices={[
                      { label: "Contact Page", value: "contact" },
                      { label: "Product Page", value: "product" },
                      { label: "Cart", value: "cart" },
                    ]}
                    selected={hideOn}
                    onChange={setHideOn}
                    allowMultiple
                  />
                  <div style={{ marginTop: "1rem" }}>
                    <Button onClick={handleSubmitHideOn} primary>
                      Save
                    </Button>
                  </div>
                </BlockStack>
              </Form>
            </Card>
          </BlockStack>
        </Layout.Section>
      </Layout>
    </Page>
  );
}
