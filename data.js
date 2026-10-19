// Menu & Restaurant Data for Shangrilla Garden & BBQ
const RESTAURANT_DATA = {
  name: "Shangrilla Garden & BBQ",
  slogan: "A little sophistication, served hot",
  tagline: "Royal Flavors, Garden Fresh Dining",
  deliveryPhone: "061 454880",
  reservationPhone: "0307 8882936",
  phone: "Home Delivery: 061-454880 | Reservation & Marquee: 0307-8882936",
  email: "orders@shangrillagardens.com",
  address: "Club Road, Shangrilla Garden & BBQ",
  openingHours: "Mon - Sun: 12:00 PM - 01:00 AM",
  deliveryFee: 2.50,
  freeDeliveryThreshold: 35.00,
  taxRate: 0.05, // 5%
  currency: {
    symbol: "$",
    code: "USD",
    rate: 1, // Base is USD
    altSymbol: "Rs.",
    altCode: "PKR",
    altRate: 285
  },
  coupons: [
    { code: "SHANGRILLA10", type: "percent", value: 10, minOrder: 15, desc: "10% off your entire order" },
    { code: "ROYALSTEAK", type: "fixed", value: 5.0, minOrder: 25, desc: "$5 off premium sizzlers" },
    { code: "FREESHIP", type: "shipping", value: 0, minOrder: 20, desc: "Free priority delivery" }
  ],
  categories: [
    { id: "all", name: "Full Menu", icon: "fa-utensils" },
    { id: "soups", name: "Artisan Soups", icon: "fa-mug-hot" },
    { id: "steaks", name: "Sizzlers & Steaks", icon: "fa-fire" },
    { id: "handi", name: "Royal Handi & Curries", icon: "fa-bowl-food" },
    { id: "naans", name: "Tandoori Artisan Naans", icon: "fa-bread-slice" },
    { id: "bbq", name: "Charcoal BBQ Grills", icon: "fa-drumstick-bite" },
    { id: "beverages", name: "Mocktails & Beverages", icon: "fa-glass-water" }
  ],
  items: [
    {
      id: "classic-hot-and-sour-soup",
      title: "Classic Hot & Sour Soup",
      subtitle: "Served hot, for the cold evenings",
      category: "soups",
      price: 5.79,
      rating: 4.9,
      reviewsCount: 118,
      badge: "Winter Star",
      featured: true,
      image: "assets/images/hot-and-sour-soup.jpg",
      gallery: [
        "assets/images/hot-and-sour-soup.jpg"
      ],
      description: "From the Kitchen of Shangrilla Garden. Served piping hot for the cold evenings—our signature Classic Hot & Sour Soup is a harmonious blend of spicy warmth and tangy zest. Prepared with slow-simmered chicken broth, tender shredded chicken, whisked egg drop ribbons, fresh black wood ear mushrooms, tofu strips, and finely diced crisp garden vegetables. Seasoned to perfection with aged black vinegar, crushed white pepper, and toasted sesame oil.",
      dietary: ["Chef Recommended", "Served Piping Hot", "Winter Comfort"],
      spiceLevel: "Spicy & Tangy (2/3)",
      prepTime: "12-15 mins",
      portions: [
        { name: "Single Bowl (Serves 1-2)", priceDelta: 0 },
        { name: "Family Tureen (Serves 3-4)", priceDelta: 3.51 }
      ],
      addons: [
        { name: "Crispy Fried Wonton Crackers", price: 0.88 },
        { name: "Extra Shredded Chicken & Egg Drop", price: 1.23 },
        { name: "Spicy Szechuan Chili Oil Pot", price: 0.70 },
        { name: "Extra Chili Vinegar & Dark Soy Dips", price: 0.53 }
      ]
    },
    {
      id: "truffle-mushroom-steak",
      title: "Truffle Mushroom Chicken Steak",
      subtitle: "A little sophistication, served hot",
      category: "steaks",
      price: 18.99,
      rating: 4.9,
      reviewsCount: 142,
      badge: "Signature Star",
      featured: true,
      image: "assets/images/truffle-mushroom-steak-poster.jpg",
      gallery: [
        "assets/images/truffle-mushroom-steak-poster.jpg",
        "assets/images/truffle-mushroom-steak-close.jpg"
      ],
      description: "From the Kitchen of Shangrilla Garden. Tender flame-grilled chicken steak generously smothered in rich, aromatic black truffle mushroom cream sauce. Served on a roaring cast-iron skillet over a bed of herb-roasted potatoes, diced sweet carrots, tender green peas, black olives, and an artistically carved garden cucumber garnish.",
      dietary: ["Chef's Signature", "Sizzling Platter", "Gluten-Free Option"],
      spiceLevel: "Mild to Rich",
      prepTime: "20-25 mins",
      portions: [
        { name: "Single Sizzler Fillet", priceDelta: 0 },
        { name: "Double Fillet Grand Platter", priceDelta: 6.50 }
      ],
      addons: [
        { name: "Extra Creamy Truffle Mushroom Sauce", price: 2.25 },
        { name: "Garlic Butter Sautéed Mushrooms", price: 2.50 },
        { name: "Crispy Herb Potato Wedges", price: 1.99 },
        { name: "Melted Mozzarella Crown", price: 1.75 }
      ]
    },
    {
      id: "fire-glazed-mexican-steak",
      title: "Fire-Glazed Salsa Chicken Steak",
      subtitle: "Smoky, zesty & sizzling to perfection",
      category: "steaks",
      price: 17.99,
      rating: 4.8,
      reviewsCount: 98,
      badge: "Spicy Favorite",
      featured: true,
      image: "assets/images/fire-glazed-mexican-steak.jpg",
      gallery: [
        "assets/images/fire-glazed-mexican-steak.jpg"
      ],
      description: "Char-grilled succulent chicken fillet drenched in Shangrilla's signature spicy Mexican roasted pepper and tomato glaze. Accompanied by sautéed sweet corn, black Kalamata olives, caramelized baby onions, and herb tossed garden vegetables on a sizzling iron skillet.",
      dietary: ["Spicy", "High Protein", "Chef Recommended"],
      spiceLevel: "Spicy (2/3)",
      prepTime: "20-25 mins",
      portions: [
        { name: "Single Fillet Sizzler", priceDelta: 0 },
        { name: "Double Fillet Feast", priceDelta: 6.00 }
      ],
      addons: [
        { name: "Extra Fire-Glaze Sauce", price: 1.75 },
        { name: "Jalapeño & Cheddar Melt", price: 2.20 },
        { name: "Mexican Cilantro Rice", price: 2.50 }
      ]
    },
    {
      id: "handi-chicken-hari-mirch",
      title: "Handi Chicken Hari Mirch",
      subtitle: "Royal Heritage Handi Specialty",
      category: "handi",
      price: 16.50,
      rating: 5.0,
      reviewsCount: 215,
      badge: "Royal Special",
      featured: true,
      image: "assets/images/handi-chicken-hari-mirch.jpg",
      gallery: [
        "assets/images/handi-chicken-hari-mirch.jpg"
      ],
      description: "A crowning jewel of Shangrilla Gardens & BBQ. Prime tender boneless chicken slow-cooked in a silken, mildly spiced yogurt and cashew cream gravy, infused with freshly roasted cumin, green cardamom, and vibrant slit green chilies. Served in an authentic traditional handi with zeera raita and tangy onion pickle.",
      dietary: ["Royal Recipe", "Mild-Spicy", "Authentic Desi"],
      spiceLevel: "Medium (Aromatic)",
      prepTime: "25-30 mins",
      portions: [
        { name: "Half Handi (Serves 1-2)", priceDelta: 0 },
        { name: "Full Handi (Serves 3-4)", priceDelta: 11.50 }
      ],
      addons: [
        { name: "Extra Zeera Mint Raita", price: 1.25 },
        { name: "Hot Roghani Naan Pairing", price: 3.50 },
        { name: "Clay-pot Brown Basmati Zeera Rice", price: 3.00 }
      ]
    },
    {
      id: "special-artisan-nans-platter",
      title: "Special Artisan Tandoor Naans Platter",
      subtitle: "Four Master Breads Straight from the Clay Oven",
      category: "naans",
      price: 11.99,
      rating: 4.9,
      reviewsCount: 184,
      badge: "Signature Bake",
      featured: true,
      image: "assets/images/special-artisan-nans.jpg",
      gallery: [
        "assets/images/special-artisan-nans.jpg"
      ],
      description: "A showcase basket of Shangrilla's finest freshly baked tandoori breads: Roghani Naan with toasted sesame seeds & desi butter, Kalonji Naan studded with aromatic black nigella seeds, Crushed Garlic & Fresh Cilantro Naan, and Gourmet Melted Cheese Naan. Served piping hot with savory mint raita and red chili tamarind chutney.",
      dietary: ["Vegetarian", "Clay Oven Fresh", "Bestseller"],
      spiceLevel: "Non-Spicy",
      prepTime: "10-12 mins",
      portions: [
        { name: "Sampler Basket (4 Assorted Pieces)", priceDelta: 0 },
        { name: "Grand Feast Basket (8 Pieces + Extra Dips)", priceDelta: 9.00 }
      ],
      addons: [
        { name: "Extra Desi Ghee Glaze", price: 0.99 },
        { name: "Special Garlic Mint Chutney Pot", price: 1.25 },
        { name: "Smoked Aubergine Raita", price: 1.50 }
      ]
    },
    {
      id: "individual-roghani-naan",
      title: "Traditional Roghani Sesame Naan",
      subtitle: "Toasted white sesame & desi butter glaze",
      category: "naans",
      price: 3.50,
      rating: 4.8,
      reviewsCount: 88,
      badge: "Oven Fresh",
      featured: false,
      image: "assets/images/special-artisan-nans.jpg",
      gallery: [
        "assets/images/special-artisan-nans.jpg"
      ],
      description: "Leavened gourmet flatbread hand-stretched and baked against the blazing walls of an authentic clay tandoor, sprinkled with golden sesame seeds and generously brushed with melted desi makhan (butter).",
      dietary: ["Vegetarian", "Tandoori"],
      spiceLevel: "Mild",
      prepTime: "8-10 mins",
      portions: [
        { name: "Single Naan", priceDelta: 0 },
        { name: "Pack of 3 Naans", priceDelta: 6.00 }
      ],
      addons: [
        { name: "Spicy Chutney Dip", price: 0.99 }
      ]
    },
    {
      id: "bbq-malai-boti-platter",
      title: "Royal Chicken Malai Boti & Seekh Kebab",
      subtitle: "Melt-in-mouth charcoal grilled perfection",
      category: "bbq",
      price: 19.50,
      rating: 4.95,
      reviewsCount: 167,
      badge: "BBQ Masterpiece",
      featured: true,
      image: "assets/images/bbq-malai-boti-platter.jpg",
      gallery: [
        "assets/images/bbq-malai-boti-platter.jpg"
      ],
      description: "Succulent cubes of prime chicken steeped overnight in a royal marinade of heavy clotted cream, green chilies, coriander root, and mild fragrant spices, threaded on skewers and char-grilled over live glowing coals alongside juicy mutton seekh kebabs. Garnished with charred peppers, red onions, fresh lime, and cilantro mint chutney.",
      dietary: ["Charcoal Grilled", "Halal", "Chef's Special"],
      spiceLevel: "Mild-Medium",
      prepTime: "25-30 mins",
      portions: [
        { name: "Regular Platter (8 Boti + 2 Seekh)", priceDelta: 0 },
        { name: "Jumbo BBQ Platter (16 Boti + 4 Seekh)", priceDelta: 16.00 }
      ],
      addons: [
        { name: "Garlic Butter Naan", price: 3.50 },
        { name: "Tamarind Date Chutney", price: 1.25 },
        { name: "Grilled Herb Tomatoes & Onions", price: 1.99 }
      ]
    },
    {
      id: "signature-shangrilla-mocktails",
      title: "Shangrilla Royal Refreshers (Pair)",
      subtitle: "Frosty Mint Lemonade & Passionfruit Cooler",
      category: "beverages",
      price: 8.50,
      rating: 4.9,
      reviewsCount: 74,
      badge: "House Specialty",
      featured: true,
      image: "assets/images/signature-drinks.jpg",
      gallery: [
        "assets/images/signature-drinks.jpg"
      ],
      description: "The ultimate palate cleanser to pair with your sizzling steaks and BBQ. Includes two artisanal chilled drinks: our legendary crushed mint iced lemonade with black Himalayan pink salt, and an exotic tropical passionfruit cooler garnished with fresh passionfruit half, mint sprigs, and lemon wheels.",
      dietary: ["Vegan", "Chilled", "Refreshing"],
      spiceLevel: "Zesty & Sweet",
      prepTime: "5-7 mins",
      portions: [
        { name: "Twin Highball Glasses (Both Flavors)", priceDelta: 0 },
        { name: "Pitcher Size (Serves 4)", priceDelta: 6.50 }
      ],
      addons: [
        { name: "Extra Chia Seeds / Tukhm-e-Balanqa", price: 0.75 },
        { name: "Sparkling Mineral Water Upgrade", price: 1.50 }
      ]
    }
  ],
  reviews: [
    {
      name: "Tariq Mansoor",
      rating: 5,
      date: "Yesterday",
      comment: "The Truffle Mushroom Chicken Steak is truly in a league of its own! Sizzling hot, buttery, and the mushroom sauce was divine. The packaging kept it piping hot for home delivery.",
      dish: "Truffle Mushroom Chicken Steak"
    },
    {
      name: "Ayesha Malik",
      rating: 5,
      date: "3 days ago",
      comment: "Handi Chicken Hari Mirch with the hot Roghani naans reminds me of royal dawat feasts. Creamy with just the right kick of green chili.",
      dish: "Handi Chicken Hari Mirch"
    },
    {
      name: "Danyal Shah",
      rating: 5,
      date: "1 week ago",
      comment: "Best steak & BBQ place in town! Fast delivery, easy website ordering, and the Special Nans platter is crispy and fresh.",
      dish: "Special Artisan Naans Platter"
    }
  ]
};
