const ENDPOINT = process.env.GRAPHQL_ENDPOINT || "http://localhost:8080/v1/graphql";

export async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`GraphQL request failed: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`GraphQL errors: ${JSON.stringify(json.errors)}`);
  }

  return json.data;
}

export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

export async function safeGql<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<Result<T>> {
  try {
    const data = await gql<T>(query, variables);
    return { ok: true, data };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { ok: false, error };
  }
}
