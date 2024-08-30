import * as dotenv from "dotenv";

dotenv.config();
const ALCHEMY_SUBGRAPH_KEY = process.env.ALCHEMY_SUBGRAPH_API_KEY;
const ENDPOINT_DAPP_RATING_SYSTEM = `https://subgraph.satsuma-prod.com/${ALCHEMY_SUBGRAPH_KEY}/123s-team--264305/rate-caster-basesepolia-v2/api`;
//const ENDPOINT_DAPP_RATER_SCHEMA_RESOLVER = `https://subgraph.satsuma-prod.com/${ALCHEMY_SUBGRAPH_KEY}/alexanders-team--782474/DappRaterSchemaResolver/api`;
// Define a TypeScript type for the function parameters

// Define a TypeScript type for the function parameters
interface GraphQLRequestConfig {
  endpoint: string;
  query: string;
}

// Define a generic TypeScript type for the response data
export interface GraphQLResponse<T> {
  data: T;
  errors?: Array<{ message: string }>;
}

// Generic function to execute GraphQL queries
async function fetchGraphQL<T>(config: GraphQLRequestConfig): Promise<GraphQLResponse<T> | null> {
  try {
    const response = await fetch(config.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query: config.query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = (await response.json()) as GraphQLResponse<T>;
    return responseData;
  } catch (error) {
    console.log(`GraphQL Error: ${error}`);
  }
  return null;
}

// Usage example with specific type for the response data
export type DappRegistered = {
  id: string;
  dappId: string;
  description: string;
  name: string;
  url: string;
  averageRating?: number;
};

export type DappRating = {
  id: string;
  attestationId: string;
  dappId: string;
  starRating: number;
  reviewText: string;
};

export async function fetchGraphQLRegisteredDapps(): Promise<GraphQLResponse<{
  dappRegistereds: DappRegistered[];
}> | null> {
  try {
    const query = `{ dappRegistereds { id, dappId, description, name, url } }`;
    const endpoint = ENDPOINT_DAPP_RATING_SYSTEM;
    return await fetchGraphQL<{ dappRegistereds: DappRegistered[] }>({ endpoint, query });
  } catch (error) {
    console.log(`GraphQL Error: ${error}`);
  }
  return null;
}

export async function fetchGraphQLRandomRegisteredDapp(): Promise<GraphQLResponse<{
  dappRegistered: DappRegistered;
}> | null> {
  try {
    const response = await fetchGraphQLRegisteredDapps();

    if (response && response.data.dappRegistereds.length > 0) {
      const randomIndex = Math.floor(Math.random() * response.data.dappRegistereds.length);
      const randomDapp = response.data.dappRegistereds[randomIndex];
      return {
        data: { dappRegistered: randomDapp },
      };
    } else {
      console.log("No Dapps registered or failed to fetch.");
      return null;
    }
  } catch (error) {
    console.log(`GraphQL Error: ${error}`);
    return null;
  }
}

export async function fetchGraphQLRegisteredDappByID(
  id: string | null,
): Promise<GraphQLResponse<{ dappRegistered: DappRegistered }> | null> {
  try {
    if (id == null) {
      throw new Error("Dapp ID is undefined");
    }

    const query = `{ dappRegistered(id:"${id}") { id, dappId, description, name, url } }`;
    console.log(query);
    const endpoint = ENDPOINT_DAPP_RATING_SYSTEM;
    return await fetchGraphQL<{ dappRegistered: DappRegistered }>({ endpoint, query });
  } catch (error) {
    console.log(`GraphQL Error: ${error}`);
  }
  return null;
}

export async function fetchDappRatings(): Promise<GraphQLResponse<{
  dappRatingSubmitteds: DappRating[];
}> | null> {
  try {
    const query = `{ dappRatingSubmitteds {id, attestationId, dappId, starRating, reviewText}}`;
    const endpoint = ENDPOINT_DAPP_RATING_SYSTEM;
    return await fetchGraphQL<{ dappRatingSubmitteds: DappRating[] }>({ endpoint, query });
  } catch (error) {
    console.log("GraphQL Error: ${error}");
  }
  return null;
}

export async function fetchAttestationsByWallet(): Promise<GraphQLResponse<{
  dappRatingSubmitteds: DappRating[];
}> | null> {
  try {
    const query = `{ dappRatingSubmitteds {id, attestationId, dappId, starRating, reviewText}}`;
    const endpoint = ENDPOINT_DAPP_RATING_SYSTEM;
    return await fetchGraphQL<{ dappRatingSubmitteds: DappRating[] }>({ endpoint, query });
  } catch (error) {
    console.log(`GraphQL Error: ${error}`);
  }
  return null;
}
