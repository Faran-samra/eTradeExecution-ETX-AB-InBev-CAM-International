// Edge Function: analyze-shelf — eTradeExecution
// Modos: 'prices' (precios del anaquel) | 'inventory' (conteo de unidades)
// Deploy: supabase functions deploy analyze-shelf

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL             = "claude-sonnet-4-20250514";
const CORS = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CATALOG_VE = [
  "Polar Pilsen Bot. 222ml","Polar Pilsen Bot. 330ml","Polar Pilsen Bot. 355ml",
  "Polar Pilsen Lata 250ml","Polar Pilsen Lata 355ml",
  "Polar Light Bot. 222ml","Polar Light Bot. 355ml",
  "Polar Light Lata 250ml","Polar Light Lata 355ml",
  "Solera (Verde) Bot. 222ml","Solera (Verde) Lata 250ml",
  "Solera Light (Azul) Bot. 222ml","Solera Light (Azul) Lata 250ml",
  "Regional Light Bot. 222ml","Regional Light Lata 250ml","Regional Light Lata 355ml",
  "Regional Pilsen Bot. 222ml","Regional Pilsen Lata 355ml",
  "Morena Bot. 222ml","Morena Lata 355ml",
  "Zulia Bot. 222ml","Zulia Bot. 250ml","Zulia Lata 295ml",
  "Cardenal Lata 250ml","Cardenal Ultra Lata 250ml",
  "Heineken Bot. 330ml","Heineken Lata 330ml",
  "Corona Extra Bot. 355ml","Coronita Bot. 210ml",
  "Modelo Especial Bot. 355ml","Modelo Especial Lata 355ml",
  "Negra Modelo Bot. 355ml",
  "Stella Artois Bot. 330ml","Stella Artois Lata 330ml",
  "Estrella Galicia Especial Bot. 330ml",
  "Budweiser Bot. 355ml",
  "Presidente Bot. 355ml","Presidente Lata 237ml","Presidente Lata 355ml",
  "Presidente Light Lata 237ml","Belga Star Lager (4,9%) Lata 330ml",
].join(", ");

const ETX_BRANDS = "Heineken, Corona Extra, Coronita, Modelo Especial, Negra Modelo, Stella Artois, Budweiser";

// ── Prompt de PRECIOS ──────────────────────────────────────────────────────
const PROMPT_PRICES = `
Eres el motor de visión de eTradeExecution para análisis de precios en punto de venta.

Analiza esta foto de anaquel/góndola/nevera de cervezas.

CATÁLOGO VENEZUELA — 41 SKUs: ${CATALOG_VE}
MARCAS ETX: ${ETX_BRANDS}

INSTRUCCIONES:
1. Identifica todos los productos de cerveza visibles
2. Usa EXACTAMENTE los nombres del catálogo cuando coincidan
3. Lee el precio visible en etiqueta o anaquel (USD)
4. Cuenta los frentes (caras visibles) por categoría

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional:
{"items":[{"sku":"string","price":number|null}],"facings_etx":number,"facings_total":number}

Si no hay cervezas: {"items":[],"facings_etx":0,"facings_total":0}
`.trim();

// ── Prompt de INVENTARIO ───────────────────────────────────────────────────
const PROMPT_INVENTORY = `
Eres el motor de visión de eTradeExecution para conteo de inventario en punto de venta.

Analiza esta foto de anaquel/bodega/nevera/depósito de cervezas.

CATÁLOGO VENEZUELA — 41 SKUs: ${CATALOG_VE}
MARCAS ETX (portfolio propio): ${ETX_BRANDS}

INSTRUCCIONES PARA CONTAR INVENTARIO:
1. Identifica todos los productos de cerveza visibles
2. Usa EXACTAMENTE los nombres del catálogo cuando coincidan
3. ESTIMA la cantidad total de unidades visibles de cada SKU:
   - Caja cerrada de 24 botellas/latas → qty = 24
   - Caja cerrada de 30 botellas pequeñas → qty = 30
   - Six-pack → qty = 6
   - Unidades sueltas → cuenta cada una
   - Si ves varias filas, multiplica fila × columna × profundidad estimada
4. Devuelve 0 si el producto no es claramente visible

Responde ÚNICAMENTE con JSON válido, sin markdown ni texto adicional:
{"items":[{"sku":"string","qty":number}],"facings_etx":number,"facings_total":number}

- qty: estimación razonable de unidades totales (no solo frentes)
- Omite SKUs con qty = 0 para mantener la respuesta compacta
- Si no hay cervezas identificables: {"items":[],"facings_etx":0,"facings_total":0}
`.trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método no permitido" }), {
      status: 405, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "Clave no configurada" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { image, mimeType = "image/jpeg", country = "VE", mode = "prices" } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: "Falta el campo image (base64)" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const prompt = mode === "inventory" ? PROMPT_INVENTORY : PROMPT_PRICES;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key":          ANTHROPIC_API_KEY,
        "anthropic-version":  "2023-06-01",
        "Content-Type":       "application/json",
      },
      body: JSON.stringify({
        model:      MODEL,
        max_tokens: 2000,
        messages: [{
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: mimeType, data: image } },
            { type: "text",  text: prompt },
          ],
        }],
      }),
    });

    if (!resp.ok) {
      const body = await resp.text();
      return new Response(JSON.stringify({ error: `Claude ${resp.status}: ${body.slice(0, 200)}` }), {
        status: 502, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const apiData  = await resp.json();
    const text     = (apiData.content || []).filter((i: any) => i.type === "text").map((i: any) => i.text).join("").trim();
    const clean    = text.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(clean);
    } catch {
      const m = clean.match(/\{[\s\S]*\}/);
      if (m) try { parsed = JSON.parse(m[0]); } catch {}
      if (!parsed) {
        return new Response(JSON.stringify({ error: "Respuesta no parseable", raw: text.slice(0, 200) }), {
          status: 502, headers: { ...CORS, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ...parsed, mode }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || "Error desconocido" }), {
      status: 500, headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
