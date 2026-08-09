import { commerceJson, newCommerceId, validateCommerceItems } from "../_lib/commerce";

type QuoteBody = {
  items?: unknown;
};

export const onRequestPost: PagesFunction = async ({ request }) => {
  let body: QuoteBody = {};
  try {
    body = (await request.json()) as QuoteBody;
  } catch {
    return commerceJson({ ok: false, reason: "invalid_json" }, 400);
  }

  const validated = validateCommerceItems(body.items);
  if (!validated.ok) return commerceJson({ ok: false, reason: validated.reason }, 400);

  return commerceJson({
    ok: true,
    quoteId: newCommerceId("quote"),
    currency: "BC",
    items: validated.items,
    total: validated.total,
  });
};
