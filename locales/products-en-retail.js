// ============================================================
//  ENGELSE PRODUCTTEKSTEN — retail (Mora), wordt bij lang=en over catalog/retail.js gelegd
//  Zelfde ids en dezelfde details-keys als het Poolse origineel.
// ============================================================

const STORAGE = 'Store in the freezer (-18°C). Do not thaw in the packaging. Do not refreeze after thawing.';
const NO_FRY = ['🍟 Deep fryer', 'not suitable for deep-frying'];
const nutri = (kj, kcal, fat, sat, carb, sug, fib, prot, salt) => [
  ['Energy', `${kj} kJ / ${kcal} kcal`], ['Fat', `${fat} g`], ['— of which saturates', `${sat} g`],
  ['Carbohydrate', `${carb} g`], ['— of which sugars', `${sug} g`], ['Fibre', `${fib} g`], ['Protein', `${prot} g`], ['Salt', `${salt} g`]
];

module.exports = {
  'mora-frikandellen-5': { name: 'Mora Frikandellen Classics · 5 pcs', unit: '5 × 70 g (350 g)', badge: 'THE CLASSIC',
    desc: 'The frikandel. Mora\'s original recipe since 1962 — exactly what the Dutch put in their supermarket basket. Deep fryer, pan or barbecue — then into a roll with curry, mayo and onion: broodje frikandel!',
    details: {
      prep: [['🍟 Deep fryer', '175°C · 4 min from frozen (2 min thawed)'], ['🍳 Pan', 'a dash of oil, medium heat · 9 min from frozen (5 min thawed), turn regularly'], ['💨 Air fryer', '200°C (preheated) · approx. 6 min from frozen (4 min thawed)'], ['🔥 Grill / BBQ', '14 min from frozen (10 min thawed), turn often']],
      ingredients: 'Mechanically separated chicken meat, water, pork fat, breadcrumbs (flour (contains WHEAT), salt, yeast), salt, onion, spices, dextrose, maltodextrin, glucose syrup, yeast extract, emulsifier: E450, antioxidant: ascorbic acid, stabiliser: E452, natural flavouring, acidity regulator: citric acid, spice extract.',
      allergens: 'Gluten (wheat)', nutrition: nutri(877, 211, 14, 4.5, 8.2, 0.7, 1.1, 12, 1.6), storage: STORAGE } },

  'mora-oven-frikandellen-8': { name: 'Mora Oven & Airfryer Frikandellen · 8 pcs', unit: '8 × 70 g (560 g)', badge: 'OVEN / AIR FRYER',
    desc: 'A frikandel made for the oven and air fryer — no deep fryer, no oil, no frying smell. 8 pieces of 70 g, crispy in 6 minutes.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 6 min from frozen'], ['🔥 Oven', '220°C (fan, preheated) · 8–10 min from frozen'], NO_FRY],
      ingredients: 'Mechanically separated chicken meat, pork fat, water, flour (contains WHEAT), onion, vegetable oils (palm, rapeseed), dextrose, salt, spices, glucose syrup, stabilisers: E450 and E452, yeast extract, antioxidant: ascorbic acid, yeast, natural flavourings, acidity regulator: citric acid.',
      allergens: 'Gluten (wheat)', nutrition: nutri(1027, 247, 18, 4.9, 8.7, 2, 1.1, 13, 1.8), storage: STORAGE } },

  'mora-bamischijven-4': { name: 'Mora Bamischijf Originals · 4 pcs', unit: '4 × 100 g (400 g)', badge: null,
    desc: 'An Indonesian-Dutch classic: fried bami noodles with vegetables and spices in a crispy coating. As filling as a meal — for the deep fryer.',
    details: {
      prep: [['🍟 Deep fryer', '175°C · 7 min from frozen (5 min thawed)']],
      ingredients: 'Cooked noodles 55% (water, durum WHEAT semolina), breadcrumbs (flour (contains WHEAT), salt, yeast, colours: annatto norbixin and annatto bixin, spices), water, vegetables 7% (onion, peas, carrot, leek, pepper, SOY beans, white cabbage), palm oil, sugar, flour (contains WHEAT), natural flavouring (contains SOY), beef <1%, starch (contains WHEAT), salt, spices, maltodextrin, beef gelatine, modified starch, garlic, red chilli, inulin, beef collagen, WHEAT, herbs, preservative: buffered vinegar, mushroom powder, tomato paste, vinegar, raising agents: E450 and E500, emulsifier: guar gum, beef protein, acidity regulator: acetic acid, stabiliser: E452.',
      allergens: 'Gluten (wheat), soy', nutrition: nutri(727, 172, 2.6, 1.1, 31, 3.8, 1.8, 5.3, 1.7), storage: STORAGE } },

  'mora-oven-bitterballen-12': { name: 'Mora Oven & Airfryer Beef Bitterballen · 12 pcs', unit: '12 × 25 g (300 g)', badge: 'BESTSELLER',
    desc: 'The Dutch bar classic: creamy beef ragout in a golden, crispy coating. Oven and air fryer version — serve with mustard.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 9 min from frozen'], ['🔥 Oven', '220°C (fan, preheated) · 10–12 min from frozen, on the rack'], NO_FRY],
      ingredients: 'Water, beef 21%*, breadcrumbs (WHEAT flour, wholemeal WHEAT flour, sunflower oil, water, salt, yeast), WHEAT flour, vegetable oils (palm, rapeseed, sunflower), butter (MILK), salt, beef gelatine, natural flavouring, glucose syrup, sugar, invert sugar syrup, herbs, spices, dextrose, thickener: E466, WHEAT protein, sugar syrup, colour: E150c. *15% cooked beef. May contain peanuts.',
      allergens: 'Gluten (wheat), milk · may contain peanuts', nutrition: nutri(1041, 250, 15, 5.5, 20, 0.9, 1.7, 7.8, 1.1), storage: STORAGE } },

  'mora-oven-kroketten-4': { name: 'Mora Oven & Airfryer Beef Croquettes · 4 pcs', unit: '4 × 80 g (320 g)', badge: 'OVEN / AIR FRYER',
    desc: 'A kroket just like the Dutch snack bar — creamy beef ragout in a crispy coating. On a roll with mustard ("broodje kroket") or next to your fries. Oven or air fryer.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 13 min from frozen, single layer'], ['🔥 Oven', '220°C (fan) · 14–16 min from frozen, on the rack without baking paper'], NO_FRY],
      ingredients: 'Water, breadcrumbs (WHEAT flour, wholemeal WHEAT flour, sunflower oil, yeast, salt, water), cooked beef 16%, vegetable oils (palm, rapeseed, sunflower), WHEAT flour, salt, butterfat (MILK), beef collagen, natural flavouring, glucose syrup, sugar, spices, dextrose, stabiliser: E466, yeast extract, invert sugar syrup, WHEAT protein, herbs. May contain peanuts.',
      allergens: 'Gluten (wheat), milk · may contain peanuts', nutrition: nutri(1101, 264, 15, 5.1, 24, 1.8, 1.7, 7.2, 1.1), storage: STORAGE } },

  'mora-rundvleeskroket-4': { name: 'Mora Beef Croquettes Classics · 4 pcs', unit: '4 × 70 g (280 g)', badge: null,
    desc: 'Mora\'s classic beef kroket for the deep fryer — thin, crispy coating and hot ragout inside. Also works in the air fryer and oven.',
    details: {
      prep: [['🍟 Deep fryer', '175°C · 5.5 min from frozen'], ['💨 Air fryer', '200°C (preheated) · 11 min from frozen'], ['🔥 Oven', '220°C (fan) · 11–13 min from frozen, turn regularly']],
      ingredients: 'Water, flour (WHEAT), breadcrumbs (flour (WHEAT), wholemeal flour (WHEAT), sunflower oil, salt, yeast), vegetable oils (palm, rapeseed, sunflower), cooked beef 10%, barn EGG white, salt, natural flavourings, vegetable protein (WHEAT), beef collagen, spices, starch (WHEAT), yeast extract, dextrose, beef gelatine, beef protein, thickener: guar gum, herbs, colour: E150d, stabilisers: E450 and E452, emulsifier: lecithins.',
      allergens: 'Gluten (wheat), egg, celery', nutrition: nutri(955, 229, 13, 5.1, 20, 0.9, 1.3, 6.7, 1.2), storage: STORAGE } },

  'mora-kaassouffles-6': { name: 'Mora Kaassoufflés · 6 pcs', unit: '6 × 60 g (360 g)', badge: 'VEGGIE',
    desc: 'Melting Gouda in a thin, crispy pastry — the most famous vegetarian snack in the Netherlands. The classic deep-fryer version: 3 minutes and done.',
    details: {
      prep: [['🍟 Deep fryer', '175°C · 3 min from frozen (2 min thawed)']],
      ingredients: 'Flour (WHEAT), water, Gouda cheese 19% (MILK), vegetable oils (palm, rapeseed), starch, salt, butter (MILK), acidity regulator: citric acid, emulsifying salt: E452, yeast, spices, colour: curcumin, thickener: E461, modified starch, emulsifier: E471, raising agents: E500, E451, E450.',
      allergens: 'Gluten (wheat), milk', nutrition: nutri(1284, 307, 16, 8.5, 32, 0.8, 1.4, 7.2, 1.3), storage: STORAGE } },

  'mora-oven-goudse-kaassouffles-4': { name: 'Mora Oven & Airfryer Gouda Kaassoufflés · 4 pcs', unit: '4 × 70 g (280 g)', badge: 'VEGGIE · AIR FRYER',
    desc: 'Kaassoufflé with 100% Gouda (23%) in a golden coating — the oven and air fryer version. Vegetarian, ready in 8 minutes.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 8 min from frozen'], ['🔥 Oven', '220°C (fan) · 6–9 min from frozen'], NO_FRY],
      ingredients: 'Flour (contains WHEAT), Gouda cheese 23% (MILK), water, vegetable oils (palm, rapeseed), starch, butter (MILK), salt, acidity regulator: citric acid, emulsifying salt: E452, thickeners: E461 and E401, yeast, colours: curcumin, paprika extract and annatto norbixin, modified starch, emulsifier: E471, raising agents: E500, E451 and E450, spices. May contain peanuts.',
      allergens: 'Gluten (wheat), milk · may contain peanuts', nutrition: nutri(1462, 350, 21, 9.9, 31, 0.4, 1.7, 7.6, 1.6), storage: STORAGE } },

  'mora-oven-mini-frikandellen-20': { name: 'Mora Oven & Airfryer Mini Frikandellen · 20 pcs', unit: '20 × 20 g (400 g)', badge: 'PARTY',
    desc: 'The frikandel in mini format — 20 pieces of 20 g. Perfect with a beer, at a party and for kids. Oven or air fryer, ready in 6 minutes.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 6 min from frozen'], ['🔥 Oven', '220°C (fan) · 7–9 min from frozen'], NO_FRY],
      ingredients: 'Mechanically separated chicken meat, pork fat, water, flour (contains WHEAT), salt, onion, spices, dextrose, colour: caramel, glucose syrup, maltodextrin, emulsifiers: E450 and E452, yeast extract, acidity regulators: citric acid and ascorbic acid, yeast, natural flavourings, spice extracts.',
      allergens: 'Gluten (wheat)', nutrition: nutri(963, 231, 16, 5.2, 8.2, 0.8, 1.1, 14, 1.9), storage: STORAGE } },

  'mora-oven-hapjes-mix-16': { name: 'Mora Oven & Airfryer Snack Mix · 16 pcs', unit: '16 × 20 g (320 g) · 4 kinds', badge: 'PARTY',
    desc: 'A party mix: beef bitterballen, mini frikandellen, chicken nuggets and mini bamischijfs — 16 pieces, oven or air fryer, 7 minutes.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 7 min from frozen, single layer'], ['🔥 Oven', '220°C (fan) · 7–9 min from frozen, on the rack'], NO_FRY],
      ingredients: 'Beef bitterbal: water, flour (contains WHEAT), cooked beef 15%, vegetable oils (palm, rapeseed, sunflower), wholemeal flour (contains WHEAT), salt, butterfat (MILK), yeast, beef collagen, sugar, glucose syrup, natural flavouring, dextrose, yeast extract, stabiliser E466, onion, spices, vegetable protein (WHEAT), herbs. Mini frikandel: mechanically separated chicken meat, pork fat, water, flour (contains WHEAT), salt, onion, spices, dextrose, colour: caramel, glucose syrup, maltodextrin, yeast extract, emulsifier E450, yeast, antioxidant: ascorbic acid, stabiliser E452, natural flavouring, acidity regulator: citric acid. Chicken nugget: chicken meat 56%, flour (contains WHEAT), water, vegetable oils (palm, rapeseed), salt, modified starch, dextrin, dextrose, sugar, yeast, lemon juice, stabiliser: xanthan gum, natural flavouring, spices, acidity regulator E450, raising agent E500, paprika extract. Mini bamischijf: cooked noodles 48% (water, durum WHEAT semolina), flour (contains WHEAT), vegetable oils (palm, rapeseed, sunflower), onion, water, carrot, leek, sugar, salt, natural flavouring (contains SOY), spices, pepper, maltodextrin, glucose syrup, yeast, starch (contains WHEAT), thickeners: agar and E466, white cabbage, paprika powder, dextrose, mushroom, colours: annatto bixin and norbixin, herbs, WHEAT gluten, acidity regulators: acetic and citric acid, WHEAT, SOY beans, red chilli, molasses, modified starch, preservative E211, vinegar. May contain peanuts and egg.',
      allergens: 'Gluten (wheat), soy, milk · may contain egg and peanuts', nutrition: nutri(1003, 240, 13, 4, 21, 1.6, 1.3, 10, 1.5), storage: STORAGE } },

  'mora-vegetarische-kroketten-4': { name: 'Mora Vegetarian Croquettes · 4 pcs', unit: '4 × 75 g (300 g)', badge: 'VEGGIE',
    desc: 'A vegetarian kroket with "draadjesvleesch" — the plant-based answer to pulled beef — in a crispy coating. Oven or air fryer.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 13 min from frozen'], ['🔥 Oven', '220°C · 17–19 min from frozen'], NO_FRY],
      ingredients: 'Water, breadcrumbs (WHEAT), WHEAT flour, vegetarian "draadjesvleesch" 8% (water, free-range EGG white powder, colour E150d), palm oil, sunflower oil, wholemeal WHEAT flour, rapeseed oil, butter (MILK), natural flavouring, modified starch, salt, lactose (MILK), glucose syrup, sugar, invert sugar syrup, thickeners (agar, E466), onion, garlic, MILK proteins, dextrose, spices (pepper <1%), herbs (parsley <1%), WHEAT protein. May contain peanuts.',
      allergens: 'Gluten (wheat), egg, milk · may contain peanuts', nutrition: nutri(1010, 241, 15, 5.2, 21, 1.2, 3.7, 4.7, 1), storage: STORAGE } },

  'mora-oven-bamischijven-4': { name: 'Mora Oven & Airfryer Bamischijven · 4 pcs', unit: '4 × 80 g (320 g)', badge: 'OVEN / AIR FRYER',
    desc: 'A bamischijf for the oven and air fryer — seasoned bami noodles with vegetables in a crispy coating, no deep fryer needed.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · approx. 11 min from frozen'], ['🔥 Oven', '220°C (fan) · 14–17 min from frozen, on the rack'], NO_FRY],
      ingredients: 'Cooked noodles 59% (water, durum WHEAT semolina), breadcrumbs (flour (contains WHEAT), salt, yeast, spices, colours: annatto norbixin and annatto bixin), vegetable oils (palm, rapeseed, sunflower), water, onion, carrot, sugar, spices, natural flavouring (contains SOY), molasses, salt, pepper, modified starch, leek, maltodextrin, starch (contains WHEAT), red chilli, glucose syrup (contains WHEAT), preservatives: E267, E202 and E211, herbs, dextrose, thickener: E466, white cabbage, vinegar, gluten (contains WHEAT), SOY beans, WHEAT, acidity regulator: acetic acid. May contain peanuts.',
      allergens: 'Gluten (wheat, rye), soy · may contain peanuts', nutrition: nutri(1009, 240, 8.9, 2.9, 34, 4, 1.7, 5.1, 1.5), storage: STORAGE } },

  'mora-kipkorn-5': { name: 'Mora Kipkorn® · 5 pcs', unit: '5 × 60 g (300 g)', badge: 'CULT CLASSIC',
    desc: 'Tender chicken in a crispy cornflake coating — Mora\'s cult snack since the 1970s. Deep fryer, air fryer, oven or pan.',
    details: {
      prep: [['🍟 Deep fryer', '175°C · 4 min from frozen (3 min thawed)'], ['💨 Air fryer', '200°C (preheated) · 8 min from frozen'], ['🔥 Oven', '220°C (preheated) · 9 min from frozen, turn'], ['🍳 Pan', 'oil, medium heat · 11 min from frozen (8 min thawed), turn regularly']],
      ingredients: 'Mechanically separated chicken meat 23%, chicken meat 15%, vegetable oils (palm, rapeseed), water, flour (contains WHEAT), yeast, salt, cornflakes 8% (maize, sugar, BARLEY malt extract, salt), chicken fat, chicken collagen, salt, SOY protein, starch (contains WHEAT), natural flavouring, emulsifier: E451, raising agents: E450 and E500, spices, herbs, stabiliser: E452, WHEAT gluten, antioxidant: ascorbic acid, whey protein concentrate (MILK), MILK protein. May contain egg.',
      allergens: 'Gluten (wheat, rye, barley), soy, milk · may contain egg', nutrition: nutri(1429, 344, 24, 7.9, 19, 0.6, 0.9, 11, 1.5), storage: STORAGE } },

  'mora-viandel-5': { name: 'Mora Viandel® · 5 pcs', unit: '5 × 70 g (350 g)', badge: 'SPICY',
    desc: 'Viandel — the frikandel\'s spicier, meatier cousin in a paper-thin coating. Deep fryer, air fryer, oven or pan.',
    details: {
      prep: [['🍟 Deep fryer', '175°C · 3.5 min from frozen (2 min thawed), max. 4 at a time'], ['💨 Air fryer', '200°C (preheated) · 8 min from frozen'], ['🔥 Oven', '250°C · 12 min from frozen (6 min thawed), turn'], ['🍳 Pan', 'medium heat · 8 min from frozen (4 min thawed), turn']],
      ingredients: 'Mechanically separated chicken meat, flour (WHEAT, RYE), water, pork fat, onion, salt, vegetable oils (sunflower, palm, rapeseed), glucose syrup, maltodextrin, spices (CELERY), modified starch, starch (WHEAT), herbs, stabiliser: E450, dextrose, natural flavourings, yeast extract, emulsifier: E339, hydrolysed SOY protein, yeast, rosemary extracts, citric acid, WHEAT gluten, raising agent: E500.',
      allergens: 'Gluten (wheat, rye), soy, celery', nutrition: nutri(1078, 259, 16, 5.1, 18, 0.8, 1.4, 9.2, 1.9), storage: STORAGE } },

  'mora-crispy-chickn-8': { name: 'Mora Crispy Chick\'n Original · 8 pcs', unit: '8 × 30 g (240 g)', badge: 'NEW',
    desc: '100% chicken breast in an extra-crispy coating. Oven, air fryer or deep fryer — as a snack, with fries, in a wrap.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · 6 min from frozen'], ['🔥 Oven', '220°C · 9–10 min from frozen'], ['🍟 Deep fryer', '175°C · 2.5 min from frozen']],
      ingredients: 'Chicken meat 51% (100% chicken breast), breadcrumbs (flour (contains WHEAT), wholemeal flour (contains WHEAT), yeast, salt, sunflower oil), water, vegetable oils (palm, rapeseed), flour (contains WHEAT, SOY), chicken collagen, salt, spices, starch (contains WHEAT), natural flavourings, SOY protein, stabiliser: E452, sugar, raising agents: E450 and E500, emulsifier: E451, herbs, dextrose, hydrolysed vegetable protein, yeast extract, maltodextrin. May contain egg.',
      allergens: 'Gluten (wheat), soy · may contain egg', nutrition: nutri(1039, 248, 11, 3.8, 22, 0.7, 1.3, 15, 1.4), storage: STORAGE } },

  'mora-oven-chili-cheese-bites-12': { name: 'Mora Oven & Airfryer Chili Cheese Bites · 12 pcs', unit: '12 × 20 g (240 g)', badge: 'SPICY · VEGGIE',
    desc: 'Gouda, cheddar and mozzarella with green jalapeño in a crispy coating. Vegetarian, spicy, 5 minutes in the air fryer.',
    details: {
      prep: [['💨 Air fryer', '200°C (preheated) · 5 min from frozen, rest 2 min'], ['🔥 Oven', '220°C (fan) · 8–9 min from frozen, rest 2 min'], NO_FRY],
      ingredients: 'Vegetarian cheese filling 55% (cheese 55% (Gouda, cheddar, mozzarella), water, 4% green jalapeño, 3% green pepper, MILK protein, emulsifying salts: E341, E450, E452, salt, stabiliser: E461, modified starch, sunflower oil, starch, natural flavouring (contains MILK), thickener: guar gum, natural vinegar, colour: carotene), breadcrumbs (flour (contains WHEAT), salt, yeast, sunflower oil, malt extract (contains BARLEY), sugar), water, vegetable oils (palm, rapeseed, sunflower), glucose syrup, sugar, stabilisers: E464 and E466, flour (contains WHEAT), dextrose, salt, invert sugar syrup, WHEAT protein. May contain peanuts.',
      allergens: 'Gluten (wheat, barley), milk · may contain peanuts', nutrition: nutri(1142, 274, 17, 7.7, 18, 1.7, 1.6, 10, 1.8), storage: STORAGE } },

  'mora-minis-mega-mix-52': { name: 'Mora Mini\'s Mega Mix · 52 pcs', unit: '52 pcs (962 g) · 4 kinds', badge: 'BIG PARTY',
    desc: 'The mega mix for the deep fryer: mini frikandellen, bitterballen, kipkantjes and mini bamischijfs — 52 pieces for a big party. Deep fryer, 4 minutes.',
    details: {
      prep: [['🍟 Deep fryer', '175°C · 4 min from frozen']],
      ingredients: 'Mini frikandel: mechanically separated chicken meat, water, pork fat, breadcrumbs (WHEAT flour, yeast, salt), salt, onion, spices, dextrose, emulsifier E450, ascorbic acid, yeast extract, stabiliser E452, natural flavouring, spice extract, citric acid, glucose syrup. Bitterbal: water, breadcrumbs (WHEAT flour, salt, yeast), WHEAT flour, vegetable oils, beef 6%, salt, beef collagen, WHEAT protein, natural flavouring, WHEAT starch, spices, yeast extract, colours, beef gelatine, stabilisers, emulsifier E450. Kipkantje: mechanically separated chicken meat 27%, water, vegetable oils, maize grits, flour (WHEAT, SOY, RYE), breadcrumbs, chicken meat 5%, chicken fat, chicken collagen, salt, spices, SOY protein, emulsifiers, sugar, starch, yeast extract, BARLEY malt extract, WHEAT gluten, whey protein concentrate (MILK), MILK protein. Mini bamischijf: cooked noodles 43%, water, WHEAT flour, breadcrumbs, onion, vegetable oils, leek, white cabbage, pepper, salt, WHEAT starch, beef collagen, dextrose, red chilli, spices (CELERY), yeast extract, WHEAT gluten, preservative, sugar, sugar syrup, molasses, natural flavouring, SOY, herbs. May contain peanuts.',
      allergens: 'Gluten (wheat, rye, barley), egg, soy, milk, celery · may contain peanuts', nutrition: nutri(946, 226, 12, 4.3, 20, 1.1, 1.2, 8.4, 1.7), storage: STORAGE } }
};
