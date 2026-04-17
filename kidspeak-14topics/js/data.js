const regions = {

  pets: [
    { key: "horse", label: "Horse" },
    { key: "duck", label: "Duck" },
    { key: "goose", label: "Goose" },

    { key: "dog", label: "Dog" },
    { key: "cow", label: "Cow" },
    { key: "guinea-fowl", label: "Guinea fowl" },

    { key: "cat", label: "Cat" },
    { key: "goat", label: "Goat" },
    { key: "pigeon", label: "Pigeon" },
    { key: "pig", label: "Pig" },
    { key: "rabbit", label: "Rabbit" },

    { key: "hen", label: "Hen" },
    { key: "buffalo", label: "Buffalo" },
    { key: "rooster", label: "Rooster" },
    { key: "turkey", label: "Turkey" }
  ],

wild: [
  { key: "chimpanzee", label: "Chimpanzee" },
  { key: "wolf", label: "Wolf" },
  { key: "kangaroo", label: "Kangaroo" },

  { key: "monkey", label: "Monkey" },
  { key: "hippopotamus", label: "Hippopotamus" },
  { key: "tiger", label: "Tiger" },

  { key: "zebra", label: "Zebra" },
  { key: "bear", label: "Bear" },
  { key: "deer", label: "Deer" },

  { key: "leopard", label: "Leopard" },
  { key: "fox", label: "Fox" },
  { key: "gorilla", label: "Gorilla" },

  { key: "giraffe", label: "Giraffe" },
  { key: "lion", label: "Lion" },
  { key: "rhinoceros", label: "Rhinoceros" },

  { key: "elephant", label: "Elephant" },
  { key: "crocodile", label: "Crocodile" }
],

sea: [
  { key: "tilapia", label: "Tilapia" },
  { key: "mud-carp", label: "Mud carp" },
  { key: "swordfish", label: "Swordfish" },
  { key: "silver-carp", label: "Silver carp" },
  { key: "dolphin", label: "Dolphin" },

  { key: "jellyfish", label: "Jellyfish" },
  { key: "turtle", label: "Turtle" },
  { key: "eel", label: "Eel" },
  { key: "crab", label: "Crab" },
  { key: "shrimp", label: "Shrimp" },

  { key: "goby-fish", label: "Goby fish" },
  { key: "squid", label: "Squid" },
  { key: "snail", label: "Snail" },
  { key: "starfish", label: "Starfish" },
  { key: "whale", label: "Whale" },

  { key: "seahorse", label: "Seahorse" },
  { key: "clam", label: "Clam" },
  { key: "snakehead-fish", label: "Snakehead fish" },
  { key: "catfish", label: "Catfish" },
  { key: "carp", label: "Carp" },

  { key: "goldfish", label: "Goldfish" },
  { key: "shark", label: "Shark" }
],

flowers: [
  { key: "hydrangea", label: "Hydrangea" },
  { key: "tulip", label: "Tulip" },
  { key: "sunflower", label: "Sunflower" },

  { key: "lotus", label: "Lotus" },
  { key: "aster", label: "Aster" },
  { key: "portulaca", label: "Portulaca" },

  { key: "lavender", label: "Lavender" },
  { key: "peony", label: "Peony" },
  { key: "lily", label: "Lily" },

  { key: "apricot-blossom", label: "Apricot blossom" },
  { key: "bougainvillea", label: "Bougainvillea" },
  { key: "rose", label: "Rose" },

  { key: "orchid", label: "Orchid" },
  { key: "hibiscus", label: "Hibiscus" },
  { key: "gerbera-daisy", label: "Gerbera daisy" },

  { key: "baby-breath", label: "Baby's breath" },
  { key: "chrysanthemum", label: "Chrysanthemum" },
  { key: "cherry-blossom", label: "Cherry blossom" }
],

vegetables: [
  { key: "water-spinach", label: "Water spinach" },
  { key: "cabbage", label: "Cabbage" },
  { key: "sweet-potato", label: "Sweet potato" },

  { key: "tomato", label: "Tomato" },
  { key: "potato", label: "Potato" },
  { key: "sweet-leaf", label: "Sweet leaf" },

  { key: "onion", label: "Onion" },
  { key: "perilla-leaf", label: "Perilla leaf" },
  { key: "lettuce", label: "Lettuce" },

  { key: "mustard-greens", label: "Mustard greens" },
  { key: "kohlrabi", label: "Kohlrabi" },
  { key: "lemongrass", label: "Lemongrass" },

  { key: "garlic", label: "Garlic" },
  { key: "ginger", label: "Ginger" },
  { key: "eggplant", label: "Eggplant" },

  { key: "fish-mint", label: "Fish mint" },
  { key: "cucumber", label: "Cucumber" },
  { key: "cilantro", label: "Cilantro" },

  { key: "bitter-melon", label: "Bitter melon" },
  { key: "carrot", label: "Carrot" },
  { key: "basil", label: "Basil" }
],

fruits: [
  { key: "watermelon", label: "Watermelon" },
  { key: "grape", label: "Grape" },
  { key: "strawberry", label: "Strawberry" },

  { key: "sapodilla", label: "Sapodilla" },
  { key: "star-fruit", label: "Star fruit" },
  { key: "pomelo", label: "Pomelo" },

  { key: "rambutan", label: "Rambutan" },
  { key: "papaya", label: "Papaya" },
  { key: "pineapple", label: "Pineapple" },

  { key: "mangosteen", label: "Mangosteen" },
  { key: "orange", label: "Orange" },
  { key: "lychee", label: "Lychee" },

  { key: "mango", label: "Mango" },
  { key: "guava", label: "Guava" },
  { key: "longan", label: "Longan" },

  { key: "custard-apple", label: "Custard apple" },
  { key: "dragon-fruit", label: "Dragon fruit" },
  { key: "durian", label: "Durian" },

  { key: "cherry", label: "Cherry" },
  { key: "banana", label: "Banana" },
  { key: "bayberry", label: "Bayberry" }
],

body: [
  { key: "head", label: "Head" },
  { key: "forehead", label: "Forehead" },
  { key: "hair", label: "Hair" },

  { key: "cheek", label: "Cheek" },
  { key: "neck", label: "Neck" },
  { key: "shoulder", label: "Shoulder" },

  { key: "chest", label: "Chest" },
  { key: "arm", label: "Arm" },
  { key: "back", label: "Back" },

  { key: "belly", label: "Belly" },
  { key: "elbow", label: "Elbow" },
  { key: "hand", label: "Hand" },

  { key: "leg", label: "Leg" },
  { key: "buttocks", label: "Buttocks" },
  { key: "ankle", label: "Ankle" },

  { key: "heel", label: "Heel" },
  { key: "foot", label: "Foot" },
  { key: "nose", label: "Nose" },

  { key: "mouth", label: "Mouth" },
  { key: "teeth", label: "Teeth" },
  { key: "tongue", label: "Tongue" },

  { key: "eye", label: "Eye" },
  { key: "ear", label: "Ear" }
],

numbers: [
  { key: "zero", label: "Zero" },
  { key: "one", label: "One" },
  { key: "two", label: "Two" },
  { key: "three", label: "Three" },
  { key: "four", label: "Four" },
  { key: "five", label: "Five" },
  { key: "six", label: "Six" },
  { key: "seven", label: "Seven" },
  { key: "eight", label: "Eight" },
  { key: "nine", label: "Nine" },

  { key: "ten", label: "Ten" },
  { key: "twenty", label: "Twenty" },
  { key: "thirty", label: "Thirty" },
  { key: "forty", label: "Forty" },
  { key: "fifty", label: "Fifty" },
  { key: "sixty", label: "Sixty" },
  { key: "seventy", label: "Seventy" },
  { key: "eighty", label: "Eighty" },
  { key: "ninety", label: "Ninety" },

  { key: "one-hundred", label: "One hundred" },
  { key: "two-hundred", label: "Two hundred" },
  { key: "three-hundred", label: "Three hundred" },
  { key: "four-hundred", label: "Four hundred" },
  { key: "five-hundred", label: "Five hundred" },
  { key: "six-hundred", label: "Six hundred" },
  { key: "seven-hundred", label: "Seven hundred" },
  { key: "eight-hundred", label: "Eight hundred" },
  { key: "nine-hundred", label: "Nine hundred" }
],

alphabet: [
  { key: "a", label: "A" },
  { key: "b", label: "B" },
  { key: "c", label: "C" },

  { key: "d", label: "D" },
  { key: "e", label: "E" },
  { key: "f", label: "F" },

  { key: "g", label: "G" },
  { key: "h", label: "H" },
  { key: "i", label: "I" },

  { key: "j", label: "J" },
  { key: "k", label: "K" },
  { key: "l", label: "L" },

  { key: "m", label: "M" },
  { key: "n", label: "N" },
  { key: "o", label: "O" },

  { key: "p", label: "P" },
  { key: "q", label: "Q" },
  { key: "r", label: "R" },

  { key: "s", label: "S" },
  { key: "t", label: "T" },
  { key: "u", label: "U" },

  { key: "v", label: "V" },
  { key: "w", label: "W" },
  { key: "x", label: "X" },

  { key: "y", label: "Y" },
  { key: "z", label: "Z" }
],

colors: [
  { key: "red", label: "Red" },
  { key: "yellow", label: "Yellow" },
  { key: "blue", label: "Blue" },

  { key: "green", label: "Green" },
  { key: "orange", label: "Orange" },
  { key: "purple", label: "Purple" },

  { key: "black", label: "Black" },
  { key: "white", label: "White" }
],

shapes: [
  { key: "circle", label: "Circle" },
  { key: "square", label: "Square" },
  { key: "triangle", label: "Triangle" },

  { key: "rectangle", label: "Rectangle" },
  { key: "oval", label: "Oval" },
  { key: "rhombus", label: "Rhombus" },

  { key: "star", label: "Star" },
  { key: "heart", label: "Heart" }
],

jobs: [
  { key: "firefighter", label: "Firefighter" },
  { key: "teacher", label: "Teacher" },

  { key: "traffic-police-officer", label: "Traffic Police Officer" },
  { key: "doctor", label: "Doctor" },
  { key: "police-officer", label: "Police Officer" },
  { key: "scientist", label: "Scientist" },

  { key: "singer", label: "Singer" },
  { key: "painter", label: "Painter" },
  { key: "navy-sailor", label: "Navy Sailor" },
  { key: "soldier", label: "Soldier" },

  { key: "chef", label: "Chef" },
  { key: "nurse", label: "Nurse" },
  { key: "sanitation-worker", label: "Sanitation Worker" },

  { key: "construction-worker", label: "Construction Worker" },
  { key: "electrician", label: "Electrician" },
  { key: "farmer", label: "Farmer" }
],

insects: [
  { key: "ant", label: "Ant" },
  { key: "bee", label: "Bee" },
  { key: "beetle", label: "Beetle" },

  { key: "butterfly", label: "Butterfly" },
  { key: "caterpillar", label: "Caterpillar" },
  { key: "cicada", label: "Cicada" },

  { key: "cockroach", label: "Cockroach" },
  { key: "cricket", label: "Cricket" },
  { key: "dragonfly", label: "Dragonfly" },

  { key: "dung-beetle", label: "Dung beetle" },
  { key: "firefly", label: "Firefly" },
  { key: "fly", label: "Fly" },

  { key: "grasshopper", label: "Grasshopper" },
  { key: "ladybug", label: "Ladybug" },
  { key: "mayfly", label: "Mayfly" },

  { key: "mosquito", label: "Mosquito" },
  { key: "moth", label: "Moth" },
  { key: "praying-mantis", label: "Praying mantis" },

  { key: "stick-insect", label: "Stick insect" },
  { key: "stink-bug", label: "Stink bug" },
  { key: "termite", label: "Termite" }
],

vehicles: [
  { key: "crane", label: "Crane" },
  { key: "airplane", label: "Airplane" },
  { key: "excavator", label: "Excavator" },

  { key: "submarine", label: "Submarine" },
  { key: "ship", label: "Ship" },
  { key: "train", label: "Train" },

  { key: "boat", label: "Boat" },
  { key: "helicopter", label: "Helicopter" },
  { key: "dump-truck", label: "Dump truck" },

  { key: "bus", label: "Bus" },
  { key: "police-car", label: "Police car" },
  { key: "fire-truck", label: "Fire truck" },

  { key: "bicycle", label: "Bicycle" },
  { key: "road-roller", label: "Road roller" },
  { key: "motorbike", label: "Motorbike" },

  { key: "car", label: "Car" },
  { key: "truck", label: "Truck" },
  { key: "taxi", label: "Taxi" }
],

};
