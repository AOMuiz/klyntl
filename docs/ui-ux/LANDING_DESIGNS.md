# Landing Page Design Packages — Variants

Date: 2025-09-01

This document contains the three UI design variants and a Figma-ready JSON mock for the Landing Page MVP. Use this file as the single-source reference for artboard specs, tokens, sample products, and the Figma mock JSON.

---

## Artboard specs

- Mobile: 375 x 812 (portrait)
- Desktop: 1440 x 900
- Grid: 8pt spacing system, desktop 12-column grid (gutter 24px)

---

## Variant summary

1. Classic Retail — Warm, trustworthy retail layout with hero + 2-row product grid and prominent CTA.
2. Minimal Showcase — White-space focused, large imagery, single-column list for quick browsing.
3. Bold Featured — High-impact imagery and CTA first; single featured product plus compact list.

---

## Tokens & Sample Products (per variant)

### Classic Retail — tokens

```json
{
  "primary": "#0B5FFF",
  "accent": "#FF8A00",
  "background": "#FFFFFF",
  "surface": "#F6F7FB",
  "text": "#0B1726",
  "muted": "#6B7280",
  "radius": 12,
  "elevation": "shadow-md",
  "fontScale": { "h1": 28, "h2": 22, "h3": 18, "body": 16, "caption": 13 }
}
```

Sample products (Classic Retail):

```json
[
  {
    "id": "p1",
    "title": "Classic Wax Candle",
    "price": 4500,
    "currency": "NGN",
    "shortDescription": "Hand-poured soy candle; 40hr burn",
    "imagePlaceholder": "/images/candle.png"
  },
  {
    "id": "p2",
    "title": "Everyday Tote Bag",
    "price": 3500,
    "currency": "NGN",
    "shortDescription": "Durable canvas tote, 15L",
    "imagePlaceholder": "/images/tote.png"
  },
  {
    "id": "p3",
    "title": "Artisan Coffee 250g",
    "price": 2200,
    "currency": "NGN",
    "shortDescription": "Single-origin roasted beans",
    "imagePlaceholder": "/images/coffee.png"
  },
  {
    "id": "p4",
    "title": "Minimal Notebook",
    "price": 2800,
    "currency": "NGN",
    "shortDescription": "Hardcover A5, 160 pages",
    "imagePlaceholder": "/images/notebook.png"
  }
]
```

---

### Minimal Showcase — tokens

```json
{
  "primary": "#0A0A0A",
  "accent": "#00C48C",
  "background": "#FFFFFF",
  "surface": "#FFFFFF",
  "text": "#0A0A0A",
  "muted": "#8892A6",
  "radius": 8,
  "elevation": "none",
  "fontScale": { "h1": 30, "h2": 20, "h3": 16, "body": 15, "caption": 12 }
}
```

Sample products (Minimal Showcase):

```json
[
  {
    "id": "s1",
    "title": "Minimal Notebook",
    "price": 2800,
    "currency": "NGN",
    "shortDescription": "Hardcover A5, 160 pages",
    "imagePlaceholder": "/images/notebook.png"
  },
  {
    "id": "s2",
    "title": "Phone Stand",
    "price": 1500,
    "currency": "NGN",
    "shortDescription": "Adjustable aluminum stand",
    "imagePlaceholder": "/images/stand.png"
  },
  {
    "id": "s3",
    "title": "Handmade Soap",
    "price": 1200,
    "currency": "NGN",
    "shortDescription": "Natural ingredients, gentle scent",
    "imagePlaceholder": "/images/soap.png"
  }
]
```

---

### Bold Featured — tokens

```json
{
  "primary": "#FF2D55",
  "accent": "#1D1F20",
  "background": "#0B0B0C",
  "surface": "#111214",
  "text": "#FFFFFF",
  "muted": "#9CA3AF",
  "radius": 10,
  "elevation": "shadow-lg",
  "fontScale": { "h1": 34, "h2": 24, "h3": 18, "body": 16, "caption": 13 }
}
```

Sample products (Bold Featured):

```json
[
  {
    "id": "f1",
    "title": "Artisan Coffee 250g",
    "price": 2200,
    "currency": "NGN",
    "shortDescription": "Small-batch, single-origin",
    "imagePlaceholder": "/images/coffee.png"
  },
  {
    "id": "f2",
    "title": "Gift Card 5k",
    "price": 5000,
    "currency": "NGN",
    "shortDescription": "Redeemable in-store",
    "imagePlaceholder": "/images/giftcard.png"
  },
  {
    "id": "f3",
    "title": "Classic Wax Candle",
    "price": 4500,
    "currency": "NGN",
    "shortDescription": "Hand-poured soy candle",
    "imagePlaceholder": "/images/candle.png"
  }
]
```

---

## Figma-ready JSON mock

Save the JSON below as `figma-mock-landing-variants.json` or import it into your design pipeline.

```json
{
  "project": "Store Landing MVP - Variants",
  "createdAt": "2025-09-01T00:00:00Z",
  "artboardSpecs": {
    "mobile": { "width": 375, "height": 812, "name": "iPhone-375w" },
    "desktop": { "width": 1440, "height": 900, "name": "Desktop-1440w" },
    "grid": { "spacing": 8, "columns": 12, "gutter": 24 }
  },
  "variants": [
    {
      "id": "classic-retail",
      "name": "Classic Retail",
      "shortDescription": "Warm, trustworthy retail layout — hero + 2-row product grid and prominent CTA.",
      "tokens": {
        "primary": "#0B5FFF",
        "accent": "#FF8A00",
        "background": "#FFFFFF",
        "surface": "#F6F7FB",
        "text": "#0B1726",
        "muted": "#6B7280",
        "radius": 12,
        "elevation": "shadow-md",
        "fontScale": { "h1": 28, "h2": 22, "h3": 18, "body": 16, "caption": 13 }
      },
      "artboards": {
        "mobile": {
          "width": 375,
          "height": 812,
          "layers": [
            {
              "id": "bg",
              "type": "rect",
              "x": 0,
              "y": 0,
              "w": 375,
              "h": 812,
              "fill": "#FFFFFF"
            },
            {
              "id": "header",
              "type": "group",
              "x": 16,
              "y": 20,
              "w": 343,
              "h": 48,
              "children": [
                {
                  "type": "text",
                  "text": "Akin Store",
                  "fontSize": 18,
                  "weight": 600,
                  "color": "#0B1726"
                },
                {
                  "type": "button",
                  "text": "Preview",
                  "style": { "bg": "#0B5FFF", "color": "#FFFFFF", "radius": 8 }
                }
              ]
            },
            {
              "id": "hero",
              "type": "group",
              "x": 16,
              "y": 84,
              "w": 343,
              "h": 220,
              "children": [
                {
                  "type": "text",
                  "text": "Handmade goods for everyday life",
                  "fontSize": 22,
                  "weight": 700,
                  "color": "#0B1726"
                },
                {
                  "type": "text",
                  "text": "Curated selection — limited highlights from your shop.",
                  "fontSize": 14,
                  "color": "#6B7280"
                },
                {
                  "type": "button",
                  "text": "Shop Featured",
                  "style": { "bg": "#FF8A00", "color": "#FFFFFF", "radius": 12 }
                }
              ]
            },
            {
              "id": "products",
              "type": "grid",
              "x": 16,
              "y": 320,
              "w": 343,
              "columns": 2,
              "rowGap": 16,
              "children": [
                {
                  "type": "productCard",
                  "id": "p1",
                  "x": 0,
                  "y": 0,
                  "w": 160,
                  "h": 220
                },
                {
                  "type": "productCard",
                  "id": "p2",
                  "x": 175,
                  "y": 0,
                  "w": 160,
                  "h": 220
                },
                {
                  "type": "productCard",
                  "id": "p3",
                  "x": 0,
                  "y": 236,
                  "w": 160,
                  "h": 220
                },
                {
                  "type": "productCard",
                  "id": "p4",
                  "x": 175,
                  "y": 236,
                  "w": 160,
                  "h": 220
                }
              ]
            },
            {
              "id": "footerCta",
              "type": "group",
              "x": 16,
              "y": 720,
              "w": 343,
              "h": 64,
              "children": [
                {
                  "type": "text",
                  "text": "Want the full catalog? Contact us",
                  "fontSize": 14,
                  "color": "#0B1726"
                },
                {
                  "type": "button",
                  "text": "Contact",
                  "style": { "bg": "#0B5FFF", "color": "#FFFFFF", "radius": 12 }
                }
              ]
            }
          ]
        },
        "desktop": {
          "width": 1440,
          "height": 900,
          "layers": [
            {
              "id": "bg",
              "type": "rect",
              "x": 0,
              "y": 0,
              "w": 1440,
              "h": 900,
              "fill": "#FFFFFF"
            },
            {
              "id": "header",
              "type": "group",
              "x": 48,
              "y": 28,
              "w": 1344,
              "h": 64,
              "children": [
                {
                  "type": "text",
                  "text": "Akin Store",
                  "fontSize": 22,
                  "weight": 700,
                  "color": "#0B1726"
                },
                {
                  "type": "button",
                  "text": "Preview",
                  "style": { "bg": "#0B5FFF", "color": "#FFFFFF", "radius": 8 }
                }
              ]
            },
            {
              "id": "hero",
              "type": "group",
              "x": 48,
              "y": 120,
              "w": 1344,
              "h": 320,
              "children": [
                {
                  "type": "text",
                  "text": "Handmade goods for everyday life",
                  "fontSize": 36,
                  "weight": 800,
                  "color": "#0B1726"
                },
                {
                  "type": "text",
                  "text": "Curated selection — limited highlights from your shop.",
                  "fontSize": 18,
                  "color": "#6B7280"
                },
                {
                  "type": "button",
                  "text": "Shop Featured",
                  "style": { "bg": "#FF8A00", "color": "#FFFFFF", "radius": 14 }
                }
              ]
            },
            {
              "id": "products",
              "type": "grid",
              "x": 48,
              "y": 460,
              "w": 1344,
              "columns": 4,
              "rowGap": 24
            }
          ]
        }
      },
      "sampleProducts": [
        {
          "id": "p1",
          "title": "Classic Wax Candle",
          "price": 4500,
          "currency": "NGN",
          "shortDescription": "Hand-poured soy candle; 40hr burn",
          "imagePlaceholder": "/images/candle.png"
        },
        {
          "id": "p2",
          "title": "Everyday Tote Bag",
          "price": 3500,
          "currency": "NGN",
          "shortDescription": "Durable canvas tote, 15L",
          "imagePlaceholder": "/images/tote.png"
        },
        {
          "id": "p3",
          "title": "Artisan Coffee 250g",
          "price": 2200,
          "currency": "NGN",
          "shortDescription": "Single-origin roasted beans",
          "imagePlaceholder": "/images/coffee.png"
        },
        {
          "id": "p4",
          "title": "Minimal Notebook",
          "price": 2800,
          "currency": "NGN",
          "shortDescription": "Hardcover A5, 160 pages",
          "imagePlaceholder": "/images/notebook.png"
        }
      ],
      "pngPreview": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
    },
    {
      "id": "minimal-showcase",
      "name": "Minimal Showcase",
      "shortDescription": "White-space first, large imagery, single-column product list — clean and modern.",
      "tokens": {
        "primary": "#0A0A0A",
        "accent": "#00C48C",
        "background": "#FFFFFF",
        "surface": "#FFFFFF",
        "text": "#0A0A0A",
        "muted": "#8892A6",
        "radius": 8,
        "elevation": "none",
        "fontScale": { "h1": 30, "h2": 20, "h3": 16, "body": 15, "caption": 12 }
      },
      "artboards": {
        "mobile": {
          "width": 375,
          "height": 812,
          "layers": [
            {
              "id": "bg",
              "type": "rect",
              "x": 0,
              "y": 0,
              "w": 375,
              "h": 812,
              "fill": "#FFFFFF"
            },
            {
              "id": "header",
              "type": "group",
              "x": 20,
              "y": 18,
              "w": 335,
              "h": 48,
              "children": [
                {
                  "type": "text",
                  "text": "Akin Store",
                  "fontSize": 16,
                  "weight": 700,
                  "color": "#0A0A0A"
                }
              ]
            },
            {
              "id": "heroImage",
              "type": "rect",
              "x": 0,
              "y": 84,
              "w": 375,
              "h": 220,
              "fill": "#F3F4F6"
            },
            {
              "id": "heroText",
              "type": "group",
              "x": 20,
              "y": 320,
              "w": 335,
              "h": 140,
              "children": [
                {
                  "type": "text",
                  "text": "Quality, simply presented",
                  "fontSize": 20,
                  "weight": 700
                },
                {
                  "type": "text",
                  "text": "A short curated list of products for quick browsing.",
                  "fontSize": 14,
                  "color": "#8892A6"
                },
                {
                  "type": "button",
                  "text": "View Products",
                  "style": { "bg": "#0A0A0A", "color": "#FFFFFF", "radius": 10 }
                }
              ]
            },
            {
              "id": "productList",
              "type": "list",
              "x": 0,
              "y": 480,
              "w": 375,
              "itemHeight": 120,
              "childrenCount": 6
            }
          ]
        },
        "desktop": {
          "width": 1440,
          "height": 900,
          "layers": [
            {
              "id": "bg",
              "type": "rect",
              "x": 0,
              "y": 0,
              "w": 1440,
              "h": 900,
              "fill": "#FFFFFF"
            },
            {
              "id": "hero",
              "type": "group",
              "x": 96,
              "y": 96,
              "w": 1248,
              "h": 360,
              "children": [
                { "type": "rect", "w": 680, "h": 360, "fill": "#F3F4F6" },
                {
                  "type": "group",
                  "x": 720,
                  "y": 0,
                  "w": 528,
                  "h": 360,
                  "children": [
                    {
                      "type": "text",
                      "text": "Quality, simply presented",
                      "fontSize": 36,
                      "weight": 800
                    },
                    {
                      "type": "text",
                      "text": "A short curated list of products for quick browsing.",
                      "fontSize": 18,
                      "color": "#8892A6"
                    },
                    {
                      "type": "button",
                      "text": "View Products",
                      "style": {
                        "bg": "#0A0A0A",
                        "color": "#FFFFFF",
                        "radius": 12
                      }
                    }
                  ]
                }
              ]
            },
            {
              "id": "productRail",
              "type": "grid",
              "x": 96,
              "y": 480,
              "w": 1248,
              "columns": 3,
              "rowGap": 24
            }
          ]
        }
      },
      "sampleProducts": [
        {
          "id": "s1",
          "title": "Minimal Notebook",
          "price": 2800,
          "currency": "NGN",
          "shortDescription": "Hardcover A5, 160 pages",
          "imagePlaceholder": "/images/notebook.png"
        },
        {
          "id": "s2",
          "title": "Phone Stand",
          "price": 1500,
          "currency": "NGN",
          "shortDescription": "Adjustable aluminum stand",
          "imagePlaceholder": "/images/stand.png"
        },
        {
          "id": "s3",
          "title": "Handmade Soap",
          "price": 1200,
          "currency": "NGN",
          "shortDescription": "Natural ingredients, gentle scent",
          "imagePlaceholder": "/images/soap.png"
        }
      ],
      "pngPreview": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
    },
    {
      "id": "bold-featured",
      "name": "Bold Featured",
      "shortDescription": "High-impact imagery and CTA first — single featured product plus compact list.",
      "tokens": {
        "primary": "#FF2D55",
        "accent": "#1D1F20",
        "background": "#0B0B0C",
        "surface": "#111214",
        "text": "#FFFFFF",
        "muted": "#9CA3AF",
        "radius": 10,
        "elevation": "shadow-lg",
        "fontScale": { "h1": 34, "h2": 24, "h3": 18, "body": 16, "caption": 13 }
      },
      "artboards": {
        "mobile": {
          "width": 375,
          "height": 812,
          "layers": [
            {
              "id": "bg",
              "type": "rect",
              "x": 0,
              "y": 0,
              "w": 375,
              "h": 812,
              "fill": "#0B0B0C"
            },
            {
              "id": "heroFeatured",
              "type": "group",
              "x": 0,
              "y": 20,
              "w": 375,
              "h": 300,
              "children": [
                { "type": "rect", "w": 375, "h": 220, "fill": "#1F2937" },
                {
                  "type": "text",
                  "text": "Featured: Artisan Coffee",
                  "fontSize": 20,
                  "weight": 800,
                  "color": "#FFFFFF"
                },
                {
                  "type": "button",
                  "text": "Buy Now",
                  "style": { "bg": "#FF2D55", "color": "#FFFFFF", "radius": 12 }
                }
              ]
            },
            {
              "id": "productStrip",
              "type": "carousel",
              "x": 0,
              "y": 340,
              "w": 375,
              "h": 180,
              "itemsVisible": 1.2
            }
          ]
        },
        "desktop": {
          "width": 1440,
          "height": 900,
          "layers": [
            {
              "id": "bg",
              "type": "rect",
              "x": 0,
              "y": 0,
              "w": 1440,
              "h": 900,
              "fill": "#0B0B0C"
            },
            {
              "id": "hero",
              "type": "group",
              "x": 96,
              "y": 96,
              "w": 1248,
              "h": 420,
              "children": [
                { "type": "rect", "w": 760, "h": 420, "fill": "#111214" },
                {
                  "type": "group",
                  "x": 780,
                  "y": 0,
                  "w": 468,
                  "h": 420,
                  "children": [
                    {
                      "type": "text",
                      "text": "Featured: Artisan Coffee",
                      "fontSize": 42,
                      "weight": 900,
                      "color": "#FFFFFF"
                    },
                    {
                      "type": "text",
                      "text": "Single-origin, roasted weekly.",
                      "fontSize": 18,
                      "color": "#9CA3AF"
                    },
                    {
                      "type": "button",
                      "text": "Buy Now",
                      "style": {
                        "bg": "#FF2D55",
                        "color": "#FFFFFF",
                        "radius": 14
                      }
                    }
                  ]
                }
              ]
            },
            {
              "id": "productGrid",
              "type": "grid",
              "x": 96,
              "y": 540,
              "w": 1248,
              "columns": 3,
              "rowGap": 24
            }
          ]
        }
      },
      "sampleProducts": [
        {
          "id": "f1",
          "title": "Artisan Coffee 250g",
          "price": 2200,
          "currency": "NGN",
          "shortDescription": "Small-batch, single-origin",
          "imagePlaceholder": "/images/coffee.png"
        },
        {
          "id": "f2",
          "title": "Gift Card 5k",
          "price": 5000,
          "currency": "NGN",
          "shortDescription": "Redeemable in-store",
          "imagePlaceholder": "/images/giftcard.png"
        },
        {
          "id": "f3",
          "title": "Classic Wax Candle",
          "price": 4500,
          "currency": "NGN",
          "shortDescription": "Hand-poured soy candle",
          "imagePlaceholder": "/images/candle.png"
        }
      ],
      "pngPreview": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGNgYAAAAAMAAWgmWQ0AAAAASUVORK5CYII="
    }
  ],
  "figmaHandoffNotes": {
    "naming": {
      "file": "Landing-MVP-<store-slug>",
      "pages": ["Tokens", "Components", "Screens", "Prototype"],
      "frames": [
        "Mobile / Hero",
        "Mobile / Products",
        "Desktop / Hero",
        "Desktop / Catalog"
      ]
    },
    "export": {
      "images": {
        "scales": ["1x", "2x", "3x"],
        "formats": ["png", "webp"],
        "folder": "assets/landing/<store-slug>/"
      },
      "icons": { "format": "svg", "folder": "assets/icons/" }
    },
    "devTips": [
      "Provide token JSON (see each variant.tokens) and map to CSS variables / RN theme object.",
      "Use product seed data in variants.sampleProducts for populating product grid during development.",
      "PNG previews are placeholders; replace with rendered artboard exports from Figma."
    ]
  }
}
```

---

## Developer usage notes

- Place the token JSON into your theme system (mobile RN theme or web CSS variables).
- Use the sampleProducts arrays to seed the mock API used by the preview page.
- Export icons as SVG and images as recommended scales into `assets/landing/<store-slug>/`.

---

## Files created for this repo

- `docs/LANDING_DESIGNS.md` (this file)
- Suggested: `figma-mock-landing-variants.json` (save the JSON block above into that file if required)

---

End of document.
