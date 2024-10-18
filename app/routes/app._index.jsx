import { useState, useEffect } from "react";
import {
  Page,
  Form,
  TextField,
  Button,
  Card,
  ChoiceList,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { json, useFetcher, useLoaderData } from "@remix-run/react";

export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const response = await admin.graphql(`
    query shopInfo {
      shop {
        id
        name
        url
        myshopifyDomain
        metafield(namespace: "custom", key: "fealtyx_offerbar_hideon") {
          id
          key
          value
        }
      }
    }
  `);

  const resData = await response.json();

  if (!response.ok) {
    throw new Error("Failed to fetch shop metafield");
  }

  return json({ hideOnValue: resData.data.shop.metafield?.value || "" });
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
    // Handle login logic...
  }

  if (formData.has("hideOn")) {
    const hideOn = formData.getAll("hideOn").join(",") || "none";

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
  }

  return null;
};

export default function Settings() {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const fetcher = useFetcher();
  const { hideOnValue } = useLoaderData();

  // Ensure this logic runs only on the client
  const [hideOn, setHideOn] = useState([]);

  useEffect(() => {
    setHideOn(hideOnValue.split(","));
  }, [hideOnValue]);

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

  return (
    <Page title="Log In with your FealtyX account">
      <Card sectioned>
        <Form onSubmit={handleSubmit}>
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
          <Button submit primary>
            Log In
          </Button>
        </Form>
      </Card>

      <Card sectioned>
        <Form>
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
          <Button onClick={handleSubmitHideOn} primary>
            Save
          </Button>
        </Form>
      </Card>
    </Page>
  );
}
