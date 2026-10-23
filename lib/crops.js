// Crops shown in the crop picker: [English name, Marathi name]
export const CROP_GROUPS = [
  { id: "cereals", en: "Cereals", mr: "तृणधान्ये", crops: [["Rice", "भात"], ["Wheat", "गहू"], ["Jowar", "ज्वारी"], ["Bajra", "बाजरी"], ["Maize", "मका"], ["Ragi", "नाचणी"], ["Barley", "जव"]] },
  { id: "pulses", en: "Pulses", mr: "कडधान्ये", crops: [["Tur", "तूर"], ["Gram", "हरभरा"], ["Moong", "मूग"], ["Urad", "उडीद"], ["Moth bean", "मटकी"], ["Cowpea", "चवळी"], ["Horse gram", "कुळीथ"], ["Lentil", "मसूर"], ["Field pea", "वाटाणा"], ["Rajma", "राजमा"]] },
  { id: "oilseeds", en: "Oilseeds", mr: "तेलबिया", crops: [["Soybean", "सोयाबीन"], ["Groundnut", "भुईमूग"], ["Sunflower", "सूर्यफूल"], ["Safflower", "करडई"], ["Sesame", "तीळ"], ["Mustard", "मोहरी"], ["Niger", "कारळे"], ["Castor", "एरंडी"], ["Linseed", "जवस"]] },
  { id: "cash", en: "Cash crops", mr: "नगदी पिके", crops: [["Cotton", "कापूस"], ["Sugarcane", "ऊस"], ["Turmeric", "हळद"], ["Ginger", "आले"]] },
  { id: "veg", en: "Vegetables", mr: "भाजीपाला", crops: [["Tomato", "टोमॅटो"], ["Onion", "कांदा"], ["Potato", "बटाटा"], ["Brinjal", "वांगी"], ["Chilli", "मिरची"], ["Okra", "भेंडी"], ["Cabbage", "कोबी"], ["Cauliflower", "फुलकोबी"], ["Carrot", "गाजर"], ["Radish", "मुळा"], ["Beetroot", "बीट"], ["Cucumber", "काकडी"], ["Bottle gourd", "दुधी भोपळा"], ["Bitter gourd", "कारले"], ["Ridge gourd", "दोडका"], ["Snake gourd", "पडवळ"], ["Ivy gourd", "तोंडली"], ["Pumpkin", "लाल भोपळा"], ["Capsicum", "ढोबळी मिरची"], ["Spinach", "पालक"], ["Fenugreek", "मेथी"], ["Coriander", "कोथिंबीर"], ["French beans", "फरसबी"], ["Cluster beans", "गवार"], ["Green peas", "मटार"], ["Garlic", "लसूण"], ["Drumstick", "शेवगा"], ["Sweet potato", "रताळे"], ["Colocasia", "अळू"], ["Amaranth", "राजगिरा"], ["Sweet corn", "स्वीट कॉर्न"]] },
  { id: "fruits", en: "Fruits", mr: "फळे", crops: [["Mango", "आंबा"], ["Banana", "केळी"], ["Pomegranate", "डाळिंब"], ["Grapes", "द्राक्ष"], ["Orange", "संत्री"], ["Sweet lime", "मोसंबी"], ["Lemon", "लिंबू"], ["Guava", "पेरू"], ["Papaya", "पपई"], ["Sapota", "चिकू"], ["Custard apple", "सीताफळ"], ["Pineapple", "अननस"], ["Watermelon", "कलिंगड"], ["Muskmelon", "खरबूज"], ["Jackfruit", "फणस"], ["Coconut", "नारळ"], ["Cashew", "काजू"], ["Fig", "अंजीर"], ["Ber", "बोर"], ["Jamun", "जांभूळ"], ["Amla", "आवळा"], ["Dragon fruit", "ड्रॅगन फ्रूट"], ["Strawberry", "स्ट्रॉबेरी"]] },
  { id: "spices", en: "Spices and plantation", mr: "मसाले व बागायती", crops: [["Black pepper", "काळी मिरी"], ["Cardamom", "वेलची"], ["Cumin", "जिरे"], ["Fennel", "बडीशेप"], ["Betel leaf", "विड्याचे पान"], ["Areca nut", "सुपारी"]] },
  { id: "other", en: "Flowers and fodder", mr: "फुले व चारा", crops: [["Marigold", "झेंडू"], ["Rose", "गुलाब"], ["Jasmine", "मोगरा"], ["Chrysanthemum", "शेवंती"], ["Tuberose", "निशिगंध"], ["Napier grass", "नेपियर गवत"], ["Lucerne", "लसूण घास"]] },
];

export const cropLabel = (c) => `${c[0]} (${c[1]})`;

// "Tomato (टोमॅटो)" and "tomato" are the same crop
export const baseName = (name) => String(name || "").split("(")[0].trim().toLowerCase();

export const KNOWN_BASES = new Set(CROP_GROUPS.flatMap((g) => g.crops.map((c) => baseName(c[0]))));
