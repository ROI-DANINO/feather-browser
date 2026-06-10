import { describe, it, expect } from "vitest";
import { ExtractSchema } from "../../../src/transport/routes";

describe("ExtractSchema ergonomics", () => {
  it("accepts the canonical shape unchanged", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { h: { selector: "h1", type: "text" } } } });
    expect(p.recipe.fields.h.type).toBe("text");
  });

  it("accepts the flat shape (fields at top level) by wrapping it into recipe", () => {
    const p = ExtractSchema.parse({ fields: { h: { selector: "h1" } }, limits: { textChars: 50 } });
    expect(p.recipe.fields.h.selector).toBe("h1");
    expect(p.recipe.limits?.textChars).toBe(50);
  });

  it("defaults type to 'text' when omitted", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { h: { selector: "h1" } } } });
    expect(p.recipe.fields.h.type).toBe("text");
  });

  it("infers type 'attribute' when attribute is present and type omitted", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { link: { selector: "a", attribute: "href" } } } });
    expect(p.recipe.fields.link.type).toBe("attribute");
  });

  it("accepts type 'value'", () => {
    const p = ExtractSchema.parse({ recipe: { fields: { title: { selector: "#t", type: "value" } } } });
    expect(p.recipe.fields.title.type).toBe("value");
  });

  it("rejects explicit type 'attribute' without an attribute name", () => {
    expect(() =>
      ExtractSchema.parse({ recipe: { fields: { x: { selector: "a", type: "attribute" } } } })
    ).toThrow(/attribute/);
  });

  it("keeps pageId at the top level in the flat shape", () => {
    const p = ExtractSchema.parse({ pageId: "page_002", fields: { h: { selector: "h1" } } });
    expect(p.pageId).toBe("page_002");
  });
});
