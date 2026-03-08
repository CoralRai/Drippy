import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Curated Unsplash photo IDs for realistic fashion images
const FASHION_IMAGES: Record<string, string[]> = {
  top_male: [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1586790170083-2f9ceadc732d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1559582798-678dfc71ccd8?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1607345366928-199ea26cfe3e?w=400&h=500&fit=crop",
  ],
  top_female: [
    "https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1564257631407-4deb1f99d992?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1518622358385-8ea7d0794bf6?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1562572159-4efc207f5aff?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1554568218-0f1715e72254?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1585487000160-6ebcfceb0d44?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1434389677669-e08b4cda8cc4?w=400&h=500&fit=crop",
  ],
  top_unisex: [
    "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1622445275463-afa2ab738c34?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1611312449412-6cefac5dc3e4?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1618517351616-38fb9c5210c6?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1564859228273-274232fdb516?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1562157873-818bc0726f68?w=400&h=500&fit=crop",
  ],
  bottom_male: [
    "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1584865288642-0f5682410ec4?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1548883354-94bcfe321cbb?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1517438476312-10d79c077509?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=500&fit=crop",
  ],
  bottom_female: [
    "https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1551854838-212c50b4c184?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1592301933927-35b597393c0a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1582142306909-195724d33ffc?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1577900232427-18219b9166a0?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1591369822096-ffd140ec948f?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&h=500&fit=crop",
  ],
  bottom_unisex: [
    "https://images.unsplash.com/photo-1604176354204-9268737828e4?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1582552938357-32b906df40cb?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1555689502-c4b22d76c56f?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=400&h=500&fit=crop",
  ],
  footwear: [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=500&fit=crop",
  ],
  outerwear: [
    "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1544022613-e87ca75a784a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1548624313-0396c75e4b1a?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1521223890158-f9f7c3d5d504?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1516257984-b1b4d707412e?w=400&h=500&fit=crop",
  ],
  accessory: [
    "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1509941943102-10c232535736?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1524532787116-e70228437bbe?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1611085583191-a3b181a88401?w=400&h=500&fit=crop",
    "https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&h=500&fit=crop",
  ],
};

function getImage(category: string, gender: string, index: number): string {
  const key = `${category}_${gender}`;
  const images = FASHION_IMAGES[key] || FASHION_IMAGES[category] || FASHION_IMAGES.top_unisex;
  return images[index % images.length];
}

const NEUTRALS = new Set(["black", "white", "gray", "charcoal", "cream", "beige", "ivory", "navy", "khaki", "taupe"]);

// Comprehensive fashion data templates
const TOPS_DATA = [
  // T-Shirts (60 items)
  ...generateItems("t-shirt", "top", [
    { prefix: "Classic Crew Neck", colors: ["Black", "White", "Navy", "Gray", "Olive"], styles: ["casual", "minimal"], fits: ["regular", "slim"], genders: ["male", "female", "unisex"] },
    { prefix: "Graphic Print", colors: ["Black", "White", "Charcoal"], styles: ["streetwear", "casual"], fits: ["regular", "oversized"], genders: ["unisex", "male"] },
    { prefix: "V-Neck Cotton", colors: ["White", "Black", "Maroon", "Teal"], styles: ["casual", "minimal"], fits: ["slim", "regular"], genders: ["male", "female"] },
    { prefix: "Oversized Boxy", colors: ["Sage", "Cream", "Lavender", "Black"], styles: ["streetwear", "casual"], fits: ["oversized"], genders: ["unisex"] },
    { prefix: "Stripe Breton", colors: ["Navy/White", "Black/White", "Red/White"], styles: ["casual", "preppy"], fits: ["regular"], genders: ["unisex"] },
    { prefix: "Acid Wash", colors: ["Gray", "Blue", "Black"], styles: ["streetwear", "vintage"], fits: ["oversized", "regular"], genders: ["unisex"] },
    { prefix: "Henley Long-Sleeve", colors: ["Burgundy", "Forest Green", "Charcoal", "Cream"], styles: ["casual", "vintage"], fits: ["slim", "regular"], genders: ["male"] },
    { prefix: "Crop Fitted", colors: ["White", "Black", "Pink", "Sage"], styles: ["casual", "sporty"], fits: ["slim"], genders: ["female"] },
    { prefix: "Pocket Detail", colors: ["White", "Khaki", "Light Blue"], styles: ["casual", "minimal"], fits: ["regular"], genders: ["unisex"] },
  ]),
  // Shirts (50 items)
  ...generateItems("shirt", "top", [
    { prefix: "Oxford Button-Down", colors: ["White", "Light Blue", "Pink", "Striped Blue"], styles: ["formal", "preppy"], fits: ["regular", "slim"], genders: ["male", "unisex"] },
    { prefix: "Linen Relaxed", colors: ["White", "Cream", "Beige", "Sky Blue", "Sage"], styles: ["casual", "bohemian"], fits: ["relaxed"], genders: ["unisex"] },
    { prefix: "Chambray", colors: ["Light Blue", "Dark Blue"], styles: ["casual", "minimal"], fits: ["regular"], genders: ["unisex"] },
    { prefix: "Flannel Check", colors: ["Red/Black", "Green/Navy", "Brown/Tan"], styles: ["casual", "vintage"], fits: ["regular", "oversized"], genders: ["unisex"] },
    { prefix: "Satin", colors: ["Black", "Emerald", "Burgundy", "Navy"], styles: ["formal", "casual"], fits: ["regular"], genders: ["female"] },
    { prefix: "Denim Western", colors: ["Light Wash", "Medium Wash", "Dark Wash"], styles: ["casual", "vintage"], fits: ["regular"], genders: ["male", "unisex"] },
    { prefix: "Mandarin Collar", colors: ["White", "Black", "Navy"], styles: ["formal", "minimal"], fits: ["slim"], genders: ["male"] },
    { prefix: "Printed Camp Collar", colors: ["Tropical Print", "Abstract Print", "Floral"], styles: ["casual", "bohemian"], fits: ["relaxed"], genders: ["male", "unisex"] },
  ]),
  // Sweaters (40 items)
  ...generateItems("sweater", "top", [
    { prefix: "Merino Wool Crew", colors: ["Navy", "Gray", "Black", "Burgundy", "Camel"], styles: ["casual", "minimal", "preppy"], fits: ["regular"], genders: ["male", "unisex"] },
    { prefix: "Cable Knit", colors: ["Cream", "Gray", "Navy"], styles: ["casual", "vintage", "preppy"], fits: ["regular", "oversized"], genders: ["unisex"] },
    { prefix: "Turtleneck Ribbed", colors: ["Black", "Cream", "Charcoal", "Brown"], styles: ["minimal", "formal"], fits: ["slim", "regular"], genders: ["unisex"] },
    { prefix: "Cardigan Button-Front", colors: ["Beige", "Navy", "Forest Green", "Burgundy"], styles: ["casual", "preppy", "vintage"], fits: ["regular"], genders: ["unisex", "female"] },
    { prefix: "Lightweight V-Neck", colors: ["Gray", "Navy", "Black"], styles: ["casual", "minimal"], fits: ["slim"], genders: ["male"] },
    { prefix: "Chunky Oversized", colors: ["Cream", "Sage", "Dusty Pink"], styles: ["casual", "bohemian"], fits: ["oversized"], genders: ["female", "unisex"] },
  ]),
  // Hoodies (40 items)
  ...generateItems("hoodie", "top", [
    { prefix: "Classic Pullover", colors: ["Black", "Gray", "Navy", "Olive", "Burgundy"], styles: ["casual", "streetwear", "sporty"], fits: ["regular", "oversized"], genders: ["unisex"] },
    { prefix: "Zip-Up Athletic", colors: ["Black", "Gray", "Navy"], styles: ["sporty", "casual"], fits: ["regular"], genders: ["unisex"] },
    { prefix: "Cropped", colors: ["Lavender", "Pink", "Sage", "Black"], styles: ["streetwear", "casual"], fits: ["oversized"], genders: ["female"] },
    { prefix: "Tech Fleece", colors: ["Black", "Dark Gray", "Navy"], styles: ["sporty", "streetwear"], fits: ["slim", "regular"], genders: ["male", "unisex"] },
    { prefix: "Vintage Washed", colors: ["Faded Black", "Washed Blue", "Stone"], styles: ["streetwear", "vintage"], fits: ["oversized"], genders: ["unisex"] },
    { prefix: "Colorblock", colors: ["Black/White", "Navy/Red", "Gray/Green"], styles: ["streetwear", "sporty"], fits: ["regular"], genders: ["unisex"] },
  ]),
  // Blazers (30 items)
  ...generateItems("blazer", "top", [
    { prefix: "Tailored Single-Breast", colors: ["Navy", "Black", "Charcoal", "Brown"], styles: ["formal", "minimal"], fits: ["slim", "regular"], genders: ["male", "unisex"] },
    { prefix: "Linen Summer", colors: ["Beige", "White", "Light Blue"], styles: ["casual", "formal"], fits: ["regular", "relaxed"], genders: ["unisex"] },
    { prefix: "Double-Breasted", colors: ["Navy", "Black", "Burgundy"], styles: ["formal", "preppy"], fits: ["regular"], genders: ["male", "female"] },
    { prefix: "Corduroy Casual", colors: ["Brown", "Tan", "Forest Green"], styles: ["casual", "vintage"], fits: ["regular"], genders: ["unisex"] },
    { prefix: "Oversized Boyfriend", colors: ["Black", "Charcoal", "Check Pattern"], styles: ["casual", "minimal"], fits: ["oversized"], genders: ["female"] },
  ]),
];

const BOTTOMS_DATA = [
  // Jeans (60 items)
  ...generateItems("jeans", "bottom", [
    { prefix: "Slim Fit", colors: ["Dark Indigo", "Black", "Medium Wash", "Light Wash"], styles: ["casual", "minimal", "streetwear"], fits: ["slim"], genders: ["male", "female", "unisex"] },
    { prefix: "Straight Leg", colors: ["Dark Blue", "Black", "Medium Wash"], styles: ["casual", "minimal"], fits: ["regular"], genders: ["male", "unisex"] },
    { prefix: "Wide Leg", colors: ["Light Wash", "Medium Wash", "White"], styles: ["casual", "vintage", "bohemian"], fits: ["relaxed"], genders: ["female", "unisex"] },
    { prefix: "Skinny", colors: ["Black", "Dark Indigo", "Gray"], styles: ["casual", "minimal", "streetwear"], fits: ["slim"], genders: ["female", "unisex"] },
    { prefix: "Relaxed Tapered", colors: ["Medium Wash", "Light Wash", "Black"], styles: ["casual", "streetwear"], fits: ["relaxed"], genders: ["male", "unisex"] },
    { prefix: "High-Waist Mom", colors: ["Light Wash", "Medium Wash", "Vintage Blue"], styles: ["casual", "vintage"], fits: ["regular"], genders: ["female"] },
    { prefix: "Distressed Ripped", colors: ["Light Wash", "Medium Wash", "Black"], styles: ["streetwear", "casual"], fits: ["regular", "slim"], genders: ["unisex"] },
    { prefix: "Raw Selvedge", colors: ["Dark Indigo", "Raw Blue"], styles: ["minimal", "casual"], fits: ["slim", "regular"], genders: ["male"] },
  ]),
  // Trousers (50 items)
  ...generateItems("trousers", "bottom", [
    { prefix: "Tailored Dress", colors: ["Navy", "Black", "Charcoal", "Brown", "Beige"], styles: ["formal", "minimal"], fits: ["slim", "regular"], genders: ["male", "female", "unisex"] },
    { prefix: "Wide-Leg Pleated", colors: ["Black", "Cream", "Navy", "Brown"], styles: ["formal", "minimal", "vintage"], fits: ["relaxed"], genders: ["female", "unisex"] },
    { prefix: "Linen Drawstring", colors: ["White", "Beige", "Sage", "Light Blue"], styles: ["casual", "bohemian"], fits: ["relaxed"], genders: ["unisex"] },
    { prefix: "Cropped Ankle", colors: ["Black", "Navy", "Olive"], styles: ["casual", "minimal"], fits: ["slim", "regular"], genders: ["unisex"] },
    { prefix: "Pinstripe", colors: ["Navy/White", "Charcoal/White", "Black/White"], styles: ["formal", "preppy"], fits: ["regular"], genders: ["male", "female"] },
    { prefix: "High-Waist Paperbag", colors: ["Beige", "Black", "Olive", "Rust"], styles: ["casual", "bohemian"], fits: ["regular"], genders: ["female"] },
  ]),
  // Chinos (40 items)
  ...generateItems("chinos", "bottom", [
    { prefix: "Classic Chino", colors: ["Khaki", "Navy", "Olive", "Stone", "Burgundy"], styles: ["casual", "preppy", "minimal"], fits: ["regular", "slim"], genders: ["male", "unisex"] },
    { prefix: "Stretch Slim", colors: ["Khaki", "Navy", "Black", "Olive"], styles: ["casual", "minimal"], fits: ["slim"], genders: ["male", "unisex"] },
    { prefix: "Relaxed Wide", colors: ["Beige", "Navy", "Olive"], styles: ["casual", "minimal"], fits: ["relaxed"], genders: ["unisex"] },
    { prefix: "Cropped Ankle", colors: ["Stone", "Navy", "Olive", "White"], styles: ["casual", "preppy"], fits: ["regular"], genders: ["unisex"] },
  ]),
  // Shorts (30 items)
  ...generateItems("shorts", "bottom", [
    { prefix: "Chino", colors: ["Khaki", "Navy", "White", "Olive"], styles: ["casual", "preppy"], fits: ["regular"], genders: ["male", "unisex"] },
    { prefix: "Athletic", colors: ["Black", "Gray", "Navy"], styles: ["sporty", "casual"], fits: ["regular", "slim"], genders: ["male", "unisex"] },
    { prefix: "High-Waist Linen", colors: ["White", "Beige", "Sage"], styles: ["casual", "bohemian"], fits: ["relaxed"], genders: ["female"] },
    { prefix: "Denim", colors: ["Light Wash", "Medium Wash", "Black"], styles: ["casual", "streetwear"], fits: ["regular"], genders: ["unisex"] },
    { prefix: "Cargo Relaxed", colors: ["Olive", "Khaki", "Black"], styles: ["streetwear", "casual", "sporty"], fits: ["relaxed"], genders: ["unisex"] },
  ]),
  // Skirts (30 items)
  ...generateItems("skirt", "bottom", [
    { prefix: "Pleated Midi", colors: ["Black", "Navy", "Cream", "Burgundy"], styles: ["formal", "minimal", "vintage"], fits: ["regular"], genders: ["female"] },
    { prefix: "A-Line Mini", colors: ["Black", "Denim", "Plaid"], styles: ["casual", "preppy"], fits: ["regular"], genders: ["female"] },
    { prefix: "Wrap Midi", colors: ["Floral", "Polka Dot", "Solid Navy", "Olive"], styles: ["casual", "bohemian"], fits: ["regular"], genders: ["female"] },
    { prefix: "Pencil", colors: ["Black", "Navy", "Gray"], styles: ["formal", "minimal"], fits: ["slim"], genders: ["female"] },
    { prefix: "Maxi Flowing", colors: ["White", "Sage", "Terracotta"], styles: ["bohemian", "casual"], fits: ["relaxed"], genders: ["female"] },
  ]),
];

interface ItemTemplate {
  prefix: string;
  colors: string[];
  styles: string[];
  fits: string[];
  genders: string[];
}

function generateItems(subcategory: string, category: string, templates: ItemTemplate[]): any[] {
  const items: any[] = [];
  const bodyTypeMap: Record<string, string[]> = {
    slim: ["ectomorph", "mesomorph"],
    regular: ["ectomorph", "mesomorph", "endomorph"],
    relaxed: ["mesomorph", "endomorph"],
    oversized: ["ectomorph", "mesomorph", "endomorph"],
  };

  const occasionMap: Record<string, string[]> = {
    formal: ["office", "interview", "wedding", "formal"],
    casual: ["casual", "college", "travel"],
    streetwear: ["casual", "college", "party"],
    sporty: ["gym", "casual", "travel"],
    minimal: ["office", "casual", "date"],
    preppy: ["office", "college", "casual"],
    vintage: ["casual", "date", "party"],
    bohemian: ["casual", "travel", "summer", "date"],
  };

  const colorHexMap: Record<string, string> = {
    black: "#1A1A1A", white: "#FFFFFF", navy: "#001F3F", gray: "#808080", charcoal: "#36454F",
    olive: "#808000", burgundy: "#800020", brown: "#8B4513", beige: "#D2B48C", cream: "#FFFDD0",
    khaki: "#C3B091", sage: "#BCB88A", "forest green": "#228B22", teal: "#008080", maroon: "#800000",
    camel: "#C19A6B", pink: "#FFB6C1", lavender: "#E6E6FA", "dusty pink": "#D4A5A5",
    "light blue": "#ADD8E6", "sky blue": "#87CEEB", "dark indigo": "#2B2D42", "medium wash": "#6699CC",
    "light wash": "#A8C4D8", rust: "#B7410E", terracotta: "#E2725B", stone: "#928E85",
    "faded black": "#333333", "washed blue": "#7BA7BC", emerald: "#50C878", red: "#DC143C",
  };

  const priceRanges: Record<string, [number, number]> = {
    "t-shirt": [499, 1999],
    shirt: [799, 2999],
    sweater: [999, 3999],
    hoodie: [899, 2999],
    blazer: [1999, 7999],
    jeans: [999, 3999],
    trousers: [899, 4999],
    chinos: [799, 2999],
    shorts: [599, 1999],
    skirt: [699, 2999],
  };

  for (const template of templates) {
    for (const color of template.colors) {
      for (const fit of template.fits) {
        for (const gender of template.genders) {
          const name = `${template.prefix} ${color} ${subcategory.charAt(0).toUpperCase() + subcategory.slice(1)}`;
          const primaryColor = color.toLowerCase().split("/")[0].split(" ").pop() || "gray";
          const [minP, maxP] = priceRanges[subcategory] || [499, 2999];
          const price = Math.round((minP + Math.random() * (maxP - minP)) / 50) * 50;

          const allOccasions = new Set<string>();
          for (const style of template.styles) {
            for (const occ of (occasionMap[style] || ["casual"])) {
              allOccasions.add(occ);
            }
          }

          items.push({
            name,
            category,
            subcategory,
            gender,
            body_types: bodyTypeMap[fit] || ["ectomorph", "mesomorph", "endomorph"],
            style_tags: template.styles,
            color_palette: template.styles.includes("formal") ? ["neutrals"] : ["neutrals", "earth tones"],
            fit_type: fit,
            occasions: [...allOccasions],
            primary_color: primaryColor,
            color_hex: colorHexMap[primaryColor] || "#808080",
            amazon_link: `https://www.amazon.in/s?k=${encodeURIComponent(name.toLowerCase().replace(/ /g, "+"))}&tag=drippy-21`,
            myntra_link: `https://www.myntra.com/${encodeURIComponent(subcategory)}?rawQuery=${encodeURIComponent(name.toLowerCase())}&rf=Color%3A${encodeURIComponent(primaryColor)}`,
            flipkart_link: `https://www.flipkart.com/search?q=${encodeURIComponent(name.toLowerCase().replace(/ /g, "+"))}&affid=drippy`,
          });
        }
      }
    }
  }

  return items;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { action } = await req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "seed_items") {
      // Generate all items
      const allItems = [...TOPS_DATA, ...BOTTOMS_DATA];

      // Assign images
      let topMaleIdx = 0, topFemaleIdx = 0, topUnisexIdx = 0;
      let bottomMaleIdx = 0, bottomFemaleIdx = 0, bottomUnisexIdx = 0;

      for (const item of allItems) {
        if (item.category === "top") {
          if (item.gender === "male") item.image_url = getImage("top", "male", topMaleIdx++);
          else if (item.gender === "female") item.image_url = getImage("top", "female", topFemaleIdx++);
          else item.image_url = getImage("top", "unisex", topUnisexIdx++);
        } else {
          if (item.gender === "male") item.image_url = getImage("bottom", "male", bottomMaleIdx++);
          else if (item.gender === "female") item.image_url = getImage("bottom", "female", bottomFemaleIdx++);
          else item.image_url = getImage("bottom", "unisex", bottomUnisexIdx++);
        }
      }

      // Insert in batches of 50
      let inserted = 0;
      for (let i = 0; i < allItems.length; i += 50) {
        const batch = allItems.slice(i, i + 50);
        const { error } = await supabase.from("clothing_items").insert(batch);
        if (error) {
          console.error(`Batch ${i} error:`, error);
        } else {
          inserted += batch.length;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        items_generated: allItems.length,
        items_inserted: inserted,
        tops: allItems.filter(i => i.category === "top").length,
        bottoms: allItems.filter(i => i.category === "bottom").length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "seed_compatibility") {
      // Fetch all items
      const { data: items } = await supabase.from("clothing_items").select("id, name, category, primary_color, style_tags, fit_type, subcategory");
      if (!items || items.length === 0) {
        return new Response(JSON.stringify({ error: "No items found. Seed items first." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tops = items.filter(i => i.category === "top");
      const bottoms = items.filter(i => i.category === "bottom");

      // Generate compatibility scores based on style + color + fit rules
      const compatRecords: any[] = [];
      const styleCompatMap: Record<string, Record<string, number>> = {
        formal: { formal: 90, minimal: 80, preppy: 75, casual: 40, streetwear: 20, sporty: 15, bohemian: 30, vintage: 50 },
        casual: { casual: 85, minimal: 80, streetwear: 70, vintage: 75, bohemian: 70, preppy: 75, sporty: 65, formal: 40 },
        streetwear: { streetwear: 90, casual: 70, sporty: 75, vintage: 65, minimal: 50, bohemian: 30, preppy: 25, formal: 20 },
        minimal: { minimal: 90, formal: 80, casual: 80, preppy: 70, vintage: 60, bohemian: 50, streetwear: 50, sporty: 40 },
        sporty: { sporty: 85, streetwear: 75, casual: 65, minimal: 40, vintage: 30, bohemian: 20, preppy: 25, formal: 15 },
        preppy: { preppy: 85, formal: 75, casual: 75, minimal: 70, vintage: 60, bohemian: 40, streetwear: 25, sporty: 25 },
        vintage: { vintage: 85, casual: 75, bohemian: 70, minimal: 60, preppy: 60, streetwear: 65, formal: 50, sporty: 30 },
        bohemian: { bohemian: 85, casual: 70, vintage: 70, minimal: 50, preppy: 40, streetwear: 30, formal: 30, sporty: 20 },
      };

      // Sample subset for compatibility (every top with every bottom is too many)
      const sampleTops = tops.slice(0, Math.min(tops.length, 100));
      const sampleBottoms = bottoms.slice(0, Math.min(bottoms.length, 100));

      for (const top of sampleTops) {
        for (const bottom of sampleBottoms) {
          // Calculate style compatibility
          let styleScore = 50;
          for (const ts of (top.style_tags || [])) {
            for (const bs of (bottom.style_tags || [])) {
              const score = styleCompatMap[ts]?.[bs] || 50;
              if (score > styleScore) styleScore = score;
            }
          }

          // Color bonus
          let colorBonus = 0;
          if (top.primary_color && bottom.primary_color) {
            const tc = top.primary_color.toLowerCase();
            const bc = bottom.primary_color.toLowerCase();
            if (NEUTRALS.has(tc) || NEUTRALS.has(bc)) colorBonus = 10;
            if (tc === "white" && bc === "indigo") colorBonus = 15;
            if (tc === "black" && bc === "black") colorBonus = 5;
            if (tc === "navy" && (bc === "khaki" || bc === "beige")) colorBonus = 15;
          }

          // Fit compatibility
          let fitBonus = 0;
          const topFit = top.fit_type || "regular";
          const bottomFit = bottom.fit_type || "regular";
          if (topFit === "oversized" && bottomFit === "slim") fitBonus = 10; // good contrast
          if (topFit === "slim" && bottomFit === "regular") fitBonus = 8;
          if (topFit === "regular" && bottomFit === "regular") fitBonus = 5;
          if (topFit === "oversized" && bottomFit === "oversized") fitBonus = -5;

          const total = Math.max(10, Math.min(100, styleScore + colorBonus + fitBonus));

          compatRecords.push({
            item_a_id: top.id,
            item_b_id: bottom.id,
            compatibility_score: total,
            source: "generated",
          });
        }
      }

      // Insert in batches
      let inserted = 0;
      for (let i = 0; i < compatRecords.length; i += 100) {
        const batch = compatRecords.slice(i, i + 100);
        const { error } = await supabase.from("item_compatibility").upsert(batch, { onConflict: "item_a_id,item_b_id" });
        if (error) console.error(`Compat batch ${i} error:`, error);
        else inserted += batch.length;
      }

      return new Response(JSON.stringify({
        success: true,
        compatibility_records: inserted,
        tops_processed: sampleTops.length,
        bottoms_processed: sampleBottoms.length,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "seed_outfits") {
      // Generate 100 curated outfit combinations
      const { data: items } = await supabase.from("clothing_items").select("*");
      if (!items || items.length === 0) {
        return new Response(JSON.stringify({ error: "No items found." }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const tops = items.filter((i: any) => i.category === "top");
      const bottoms = items.filter((i: any) => i.category === "bottom");
      const footwear = items.filter((i: any) => i.category === "footwear");

      // Build 100+ outfit combos
      const outfits: any[] = [];
      const occasions = ["casual", "office", "college", "date", "party", "wedding", "interview", "gym", "travel", "summer", "winter"];
      const genders = ["male", "female", "unisex"];

      for (let i = 0; i < 120; i++) {
        const occ = occasions[i % occasions.length];
        const gender = genders[i % genders.length];

        // Pick compatible items
        const genderTops = tops.filter((t: any) => t.gender === gender || t.gender === "unisex");
        const genderBottoms = bottoms.filter((b: any) => b.gender === gender || b.gender === "unisex");
        const occTops = genderTops.filter((t: any) => (t.occasions || []).includes(occ));
        const occBottoms = genderBottoms.filter((b: any) => (b.occasions || []).includes(occ));

        const selectedTops = occTops.length > 0 ? occTops : genderTops;
        const selectedBottoms = occBottoms.length > 0 ? occBottoms : genderBottoms;

        if (selectedTops.length === 0 || selectedBottoms.length === 0) continue;

        const top = selectedTops[Math.floor(Math.random() * selectedTops.length)];
        const bottom = selectedBottoms[Math.floor(Math.random() * selectedBottoms.length)];
        const shoe = footwear.length > 0 ? footwear[Math.floor(Math.random() * footwear.length)] : null;

        // Calculate score
        let score = 50;
        const sharedStyles = (top.style_tags || []).filter((t: string) => (bottom.style_tags || []).includes(t));
        score += sharedStyles.length * 10;
        if (NEUTRALS.has((top.primary_color || "").toLowerCase()) || NEUTRALS.has((bottom.primary_color || "").toLowerCase())) score += 10;
        score = Math.min(100, score);

        const allBodyTypes = [...new Set([...(top.body_types || []), ...(bottom.body_types || [])])];
        const allStyles = [...new Set([...(top.style_tags || []), ...(bottom.style_tags || [])])];

        outfits.push({
          name: `${top.name.split(" ").slice(0, 3).join(" ")} + ${bottom.name.split(" ").slice(0, 3).join(" ")}`,
          top: top.name,
          bottom: bottom.name,
          footwear: shoe?.name || "White Sneakers",
          accessories: null,
          gender,
          body_types: allBodyTypes,
          occasions: [occ],
          style_tags: allStyles,
          compatibility_score: score,
          fit_type: top.fit_type || "regular",
          color_palette: [top.primary_color, bottom.primary_color].filter(Boolean),
          description: `A curated ${occ} outfit combining ${top.name} with ${bottom.name}`,
          styling_tip: null,
          amazon_link: top.amazon_link,
          myntra_link: bottom.myntra_link,
          flipkart_link: top.flipkart_link,
          image_url: top.image_url,
        });
      }

      // Insert outfits
      let inserted = 0;
      for (let i = 0; i < outfits.length; i += 50) {
        const batch = outfits.slice(i, i + 50);
        const { error } = await supabase.from("outfits").insert(batch);
        if (error) console.error(`Outfit batch error:`, error);
        else inserted += batch.length;
      }

      return new Response(JSON.stringify({
        success: true,
        outfits_generated: outfits.length,
        outfits_inserted: inserted,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    } else if (action === "stats") {
      const [itemsCount, compatCount, outfitsCount] = await Promise.all([
        supabase.from("clothing_items").select("id", { count: "exact", head: true }),
        supabase.from("item_compatibility").select("id", { count: "exact", head: true }),
        supabase.from("outfits").select("id", { count: "exact", head: true }),
      ]);

      return new Response(JSON.stringify({
        clothing_items: itemsCount.count || 0,
        compatibility_records: compatCount.count || 0,
        outfits: outfitsCount.count || 0,
      }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: seed_items, seed_compatibility, seed_outfits, stats" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("seed-fashion-data error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
