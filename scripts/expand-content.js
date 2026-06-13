const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const factsPath = path.join(root, "public", "facts.json");
const puzzlesPath = path.join(root, "public", "puzzles.json");

const requestedCategories = [
  "Science",
  "Space",
  "Physics",
  "Chemistry",
  "Biology",
  "Technology",
  "AI",
  "Engineering",
  "Mathematics",
  "Psychology",
  "Human Body",
  "Animals",
  "Oceans",
  "Geography",
  "Countries",
  "India",
  "Karnataka",
  "Indian Culture",
  "History",
  "Ancient Civilizations",
  "Sports",
  "Olympics",
  "Cricket",
  "Football",
  "Famous Personalities",
  "Inventors",
  "Billionaires",
  "Business",
  "Money",
  "World Records",
  "Strange Facts",
  "Nature",
  "Environment",
  "Climate",
  "Astronomy",
  "Numbers",
  "Years & Events",
  "Language Facts",
  "Food Facts",
  "Mystery Facts"
];

const categoryAliases = {
  Civilization: "Ancient Civilizations",
  Medicine: "Human Body"
};

const supplementalFacts = {
  Chemistry: [
    "Water expands when it freezes, which is why ice floats on liquid water.",
    "The periodic table is arranged mainly by atomic number.",
    "Carbon can form diamond, graphite, and graphene because its atoms bond in different structures.",
    "Helium is so light that Earth's gravity lets some of it escape into space over time.",
    "A catalyst speeds up a chemical reaction without being consumed by the reaction.",
    "Table salt is a compound made from sodium and chlorine ions.",
    "The pH scale measures how acidic or basic a solution is.",
    "Noble gases are unusually unreactive because their outer electron shells are full.",
    "Rust forms when iron reacts with oxygen and water.",
    "Soap molecules have one end that attracts water and another end that attracts oils.",
    "Isotopes are atoms of the same element with different numbers of neutrons.",
    "The element mercury is liquid near room temperature."
  ],
  Biology: [
    "DNA stores genetic instructions using four chemical bases.",
    "Mitochondria help cells release usable energy from food molecules.",
    "Plants make sugars through photosynthesis using light, carbon dioxide, and water.",
    "Yeast is a fungus used in baking and fermentation.",
    "Bacteria can reproduce by splitting into two cells.",
    "Red blood cells carry oxygen with the help of hemoglobin.",
    "Enzymes are proteins that speed up biological reactions.",
    "Viruses need host cells to reproduce.",
    "Chlorophyll gives many plants their green color.",
    "The human genome contains about three billion DNA base pairs.",
    "Pollination helps many flowering plants reproduce.",
    "Antibiotics target bacteria, not viruses."
  ],
  AI: [
    "Machine learning systems learn patterns from data rather than being explicitly programmed for every case.",
    "A neural network is inspired by connected layers of simple mathematical units.",
    "Training data quality strongly affects an AI model's output quality.",
    "Computer vision systems analyze images and video using numerical features.",
    "Natural language processing helps computers work with human language.",
    "Recommendation systems often use patterns in past behavior to suggest future choices.",
    "Reinforcement learning trains agents through rewards and penalties.",
    "Large language models predict text using patterns learned from large datasets.",
    "AI bias can appear when training data reflects unequal or incomplete real-world patterns.",
    "Speech recognition converts sound signals into text.",
    "Generative AI can produce text, images, audio, code, and other media.",
    "Model evaluation checks whether an AI system performs well on data it has not seen before."
  ],
  Mathematics: [
    "Zero is the additive identity because adding it does not change a number.",
    "Pi is the ratio of a circle's circumference to its diameter.",
    "Prime numbers have exactly two positive divisors: one and themselves.",
    "A right angle measures 90 degrees.",
    "The Fibonacci sequence starts with 0 and 1, then adds the previous two numbers.",
    "The square root of 144 is 12.",
    "A triangle's interior angles add up to 180 degrees in Euclidean geometry.",
    "The number e appears naturally in growth and decay problems.",
    "Probability values range from 0 to 1.",
    "A billion is one thousand million in the short scale.",
    "The golden ratio is approximately 1.618.",
    "Negative numbers became widely accepted in mathematics after centuries of debate."
  ],
  Countries: [
    "Canada has the longest coastline of any country.",
    "Australia is both a country and a continent.",
    "Brazil is the largest country in South America by area.",
    "Japan is made up of thousands of islands.",
    "Egypt is home to the Great Pyramid of Giza.",
    "Indonesia has more than 17,000 islands.",
    "South Africa has three capital cities for different branches of government.",
    "Switzerland has four national languages.",
    "Chile stretches along a long, narrow part of South America's Pacific coast.",
    "New Zealand was one of the first countries to give women the right to vote in national elections.",
    "Monaco is one of the smallest sovereign countries by area.",
    "Nepal is home to Mount Everest."
  ],
  Sports: [
    "Cricket is among the most watched sports globally.",
    "A marathon is 42.195 kilometers long.",
    "Table tennis became an Olympic sport in 1988.",
    "Basketball was invented by James Naismith in 1891.",
    "The modern Olympic Games began in Athens in 1896.",
    "A standard soccer match has two halves of 45 minutes.",
    "The Tour de France is one of cycling's most famous races.",
    "Wimbledon is the oldest tennis tournament still played today.",
    "A baseball game is divided into innings rather than timed halves.",
    "Badminton shuttlecocks can travel extremely fast in elite play.",
    "Chess is recognized as a sport by the International Olympic Committee.",
    "Kabaddi originated in South Asia and is popular in India."
  ],
  Olympics: [
    "Olympic gold medals contain very little actual gold.",
    "The Olympic rings represent five inhabited continents.",
    "The Summer and Winter Olympics are held on separate four-year cycles.",
    "The Olympic flame is lit in Olympia, Greece, before each Games.",
    "The first modern Olympics were held in 1896.",
    "The Paralympic Games are held for athletes with disabilities.",
    "Tokyo hosted the Summer Olympics in 1964 and 2021.",
    "The marathon commemorates an ancient Greek messenger legend.",
    "Athletes enter the Olympic opening ceremony behind their national flags.",
    "The Olympic motto includes the idea of being faster, higher, and stronger.",
    "Women first competed in the modern Olympics in 1900.",
    "The Olympic Games include both individual and team events."
  ],
  Cricket: [
    "A cricket pitch is 22 yards long.",
    "Test cricket can last up to five days.",
    "A century in cricket means a batter has scored 100 runs.",
    "The Cricket World Cup is played in the one-day international format.",
    "A hat-trick in cricket means taking three wickets in three consecutive balls.",
    "The Indian Premier League began in 2008.",
    "The Ashes is a historic Test cricket series between England and Australia.",
    "A yorker is a delivery aimed near the batter's feet.",
    "A duck means a batter is out without scoring a run.",
    "A wicket can refer to the stumps, the dismissal, or the playing surface.",
    "Spin bowlers use rotation to make the ball change direction after bouncing.",
    "The third umpire uses video technology to help make decisions."
  ],
  Football: [
    "Association football is often called soccer in several countries.",
    "A football team normally has 11 players on the field.",
    "The FIFA World Cup is held every four years.",
    "A hat-trick in football means one player scores three goals in a match.",
    "The offside rule prevents attackers from waiting near the opponent's goal.",
    "Goalkeepers are the only players allowed to handle the ball in their penalty area.",
    "Penalty kicks are taken from 12 yards away from the goal.",
    "The UEFA Champions League is one of club football's biggest competitions.",
    "Extra time is used in some knockout matches when scores are level.",
    "Yellow and red cards are used to discipline players.",
    "Futsal is a smaller indoor form of football.",
    "The first FIFA World Cup was held in 1930."
  ],
  "Famous Personalities": [
    "Nikola Tesla held over 300 patents across different countries.",
    "A.P.J. Abdul Kalam helped lead India's missile and space technology programs.",
    "Leonardo da Vinci wrote many notes in mirror script.",
    "Albert Einstein's brain was studied after his death.",
    "Marie Curie won Nobel Prizes in two different scientific fields.",
    "Mahatma Gandhi used nonviolent resistance as a major political strategy.",
    "Ada Lovelace is often described as one of the first computer programmers.",
    "Nelson Mandela became South Africa's first Black president.",
    "Florence Nightingale helped modernize nursing and hospital statistics.",
    "Rabindranath Tagore was the first non-European Nobel laureate in Literature.",
    "Kalpana Chawla was the first woman of Indian origin in space.",
    "Stephen Hawking made major contributions to black hole physics."
  ],
  Inventors: [
    "Thomas Edison held more than a thousand U.S. patents.",
    "Alexander Graham Bell is widely associated with the development of the telephone.",
    "The Wright brothers made the first controlled powered airplane flight in 1903.",
    "Hedy Lamarr co-invented frequency-hopping ideas that influenced wireless communication.",
    "James Watt improved the steam engine, helping power the Industrial Revolution.",
    "Tim Berners-Lee invented the World Wide Web.",
    "Johannes Gutenberg's printing press transformed book production in Europe.",
    "Grace Hopper helped develop early programming languages and compiler ideas.",
    "Garrett Morgan invented an early traffic signal design.",
    "Philo Farnsworth was a pioneer of electronic television.",
    "George Washington Carver developed many agricultural uses for crops such as peanuts.",
    "C. V. Raman discovered the Raman effect in light scattering."
  ],
  Billionaires: [
    "John D. Rockefeller is often regarded as the first billionaire in modern history.",
    "Berkshire Hathaway grew from a textile company into a major investment holding company.",
    "Many billionaires built wealth through ownership stakes rather than salaries.",
    "Public company founders can gain or lose large amounts of wealth as share prices move.",
    "Philanthropy pledges are common among several modern billionaires.",
    "The Forbes billionaires list began tracking global billionaire wealth in the 1980s.",
    "Technology companies have produced many of the world's best-known modern billionaires.",
    "Some billionaire fortunes come from inherited family businesses.",
    "Venture capital can turn early startup stakes into enormous wealth.",
    "Inflation makes historical billionaire comparisons difficult.",
    "Net worth estimates often depend on market prices and private asset valuations.",
    "A billionaire owns assets valued at one billion currency units or more."
  ],
  Environment: [
    "Mangroves protect coastlines and provide habitat for young marine life.",
    "Wetlands can filter water and store carbon.",
    "Plastic pollution can persist in ecosystems for many years.",
    "Recycling aluminum saves significant energy compared with making new aluminum from ore.",
    "Forests help regulate water cycles and store carbon.",
    "Composting turns organic waste into nutrient-rich material.",
    "Biodiversity helps ecosystems recover from stress.",
    "Coral reefs support a large share of marine species despite covering a small ocean area.",
    "Air quality can affect heart and lung health.",
    "Soil erosion can reduce farmland productivity.",
    "Native plants often support local pollinators better than many imported ornamentals.",
    "Clean drinking water depends on healthy watersheds."
  ],
  Climate: [
    "Climate describes long-term weather patterns, not a single day's weather.",
    "Carbon dioxide traps heat in Earth's atmosphere.",
    "Ice cores preserve clues about ancient climates.",
    "The greenhouse effect keeps Earth warmer than it would be without an atmosphere.",
    "Sea levels can rise when land ice melts and ocean water warms.",
    "El Nino can shift weather patterns across large parts of the world.",
    "Methane is a powerful greenhouse gas.",
    "Climate models use physics and data to project future conditions.",
    "Urban heat islands make cities warmer than nearby rural areas.",
    "Tree rings can reveal information about past climate conditions.",
    "A carbon footprint estimates greenhouse gas emissions linked to an activity.",
    "Renewable energy can reduce emissions from electricity generation."
  ],
  Numbers: [
    "Number 0 is the only number that cannot be represented in Roman numerals.",
    "Number 7 is often chosen when people are asked to pick a random number from 1 to 10.",
    "Number 1729 is known as Ramanujan's famous taxi number.",
    "Number 299,792,458 is the speed of light in meters per second in vacuum.",
    "Number 1,000,000 seconds equals about 11.6 days.",
    "Number 60 is used for minutes and seconds because ancient counting systems favored base 60.",
    "Number 2 is the only even prime number.",
    "Number 365 is the common number of days in a non-leap year.",
    "Number 24 appears in the number of hours in a day.",
    "Number 12 appears in months, zodiac signs, and many traditional counting systems.",
    "Number 100 is a perfect square because 10 times 10 equals 100.",
    "Number 1,000,000,000 is one billion in the short scale."
  ],
  "Years & Events": [
    "1969: Humans landed on the Moon.",
    "1991: The World Wide Web became publicly available.",
    "2007: The first iPhone launched.",
    "1947: India became independent.",
    "1950: The Constitution of India came into effect.",
    "1912: The Titanic sank in the North Atlantic.",
    "1492: Columbus reached the Americas during a Spanish expedition.",
    "1776: The United States Declaration of Independence was adopted.",
    "1983: India won its first Cricket World Cup.",
    "2011: India won the Cricket World Cup on home soil.",
    "2008: The first Android phone was released.",
    "2020: The Tokyo Olympics were postponed because of the COVID-19 pandemic."
  ],
  "Language Facts": [
    "The word alphabet comes from alpha and beta, the first two Greek letters.",
    "English has borrowed words from hundreds of languages.",
    "Sanskrit is one of the world's oldest documented Indo-Aryan languages.",
    "Kannada has a long literary tradition with early inscriptions dating back over a thousand years.",
    "A palindrome reads the same backward and forward.",
    "Morse code represents letters with dots and dashes.",
    "Emoji were first developed in Japan.",
    "The Rosetta Stone helped scholars understand Egyptian hieroglyphs.",
    "A pangram uses every letter of an alphabet at least once.",
    "Hindi is written in the Devanagari script.",
    "Sign languages have grammar and structure just like spoken languages.",
    "Loanwords are words adopted from another language."
  ],
  "Food Facts": [
    "Chocolate comes from cacao beans.",
    "Sourdough bread rises with the help of wild yeast and bacteria.",
    "Rice is a staple food for more than half of the world's population.",
    "Saffron is one of the most expensive spices by weight.",
    "Idli batter ferments before steaming.",
    "Tea leaves come from the Camellia sinensis plant.",
    "Capsaicin gives chili peppers their heat.",
    "Bananas are botanically berries, while strawberries are not true berries.",
    "Fermentation is used to make yogurt, kimchi, and many cheeses.",
    "Coffee beans are seeds from coffee cherries.",
    "Turmeric contains the yellow pigment curcumin.",
    "Honey's low moisture helps it resist spoilage."
  ],
  "Mystery Facts": [
    "The Voynich manuscript remains undeciphered despite many attempts.",
    "The Antikythera mechanism was an ancient Greek geared device used for astronomical calculations.",
    "The identity of Jack the Ripper remains unknown.",
    "The exact purpose of some Stonehenge rituals is still debated.",
    "The Nazca Lines are giant geoglyphs in Peru.",
    "The cause of the Tunguska event is widely linked to an airburst from a space object.",
    "The Mary Celeste was found abandoned in 1872.",
    "The Indus script has not been fully deciphered.",
    "The Bermuda Triangle is famous in popular culture, but many incidents have ordinary explanations.",
    "The Piri Reis map is often discussed because of its early depiction of coastlines.",
    "The Dancing Plague of 1518 remains debated by historians.",
    "Some deep-sea sounds were mysterious until scientists linked them to natural sources."
  ]
};

function normalizeFact(item) {
  if (!item || !item.category || !item.text) return null;
  return {
    category: categoryAliases[item.category] || item.category,
    text: String(item.text).trim()
  };
}

function expandFacts() {
  const existing = JSON.parse(fs.readFileSync(factsPath, "utf8"));
  const seen = new Set();
  const facts = [];

  for (const item of existing.facts || []) {
    const normalized = normalizeFact(item);
    if (!normalized) continue;
    const key = normalized.text.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    facts.push(normalized);
  }

  for (const [category, entries] of Object.entries(supplementalFacts)) {
    for (const text of entries) {
      const key = text.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      facts.push({ category, text });
    }
  }

  const categories = Array.from(new Set(requestedCategories.concat(facts.map((fact) => fact.category))));
  const output = {
    version: 3,
    totalFacts: facts.length,
    categories,
    facts
  };
  fs.writeFileSync(factsPath, JSON.stringify(output, null, 2) + "\n");
  return output;
}

const seedPuzzles = [
  { difficulty: "Easy", type: "Riddle", question: "What has keys but no locks?", answers: ["Piano", "Map", "Clock"], correct: "Piano", hint: "It plays notes." },
  { difficulty: "Easy", type: "Riddle", question: "What has hands but cannot clap?", answers: ["Clock", "Chair", "River"], correct: "Clock", hint: "Its hands show time." },
  { difficulty: "Medium", type: "Word puzzle", question: "You see me once in June, twice in November, but not in May. What am I?", answers: ["Letter E", "Letter N", "Letter M"], correct: "Letter E", hint: "Count letters in the month names." },
  { difficulty: "Hard", type: "Logic puzzle", question: "Three switches control one bulb in another room. What clue can identify the right switch?", answers: ["Heat", "Color", "Sound"], correct: "Heat", hint: "One switch can warm the bulb before you enter." },
  { difficulty: "Hard", type: "Lateral thinking", question: "A person pushes a car to a hotel and loses money. What are they playing?", answers: ["Monopoly", "Chess", "Cricket"], correct: "Monopoly", hint: "Think of a board game, not a real car." },
  { difficulty: "Hard", type: "Lateral thinking", question: "A room has no doors or windows, but someone says there is a way out. What kind of room is it?", answers: ["Mushroom", "Bedroom", "Classroom"], correct: "Mushroom", hint: "It is a wordplay puzzle." },
  { difficulty: "Medium", type: "Deduction puzzle", question: "Three boxes are labeled apples, oranges, and mixed, but every label is wrong. Which box should you sample first?", answers: ["Mixed", "Apples", "Oranges"], correct: "Mixed", hint: "The box labeled mixed cannot be mixed." },
  { difficulty: "Hard", type: "Deduction puzzle", question: "Two guards stand by two doors; one always lies and one always tells the truth. What should you ask?", answers: ["Ask what the other guard would say", "Ask your favorite color", "Ask the time"], correct: "Ask what the other guard would say", hint: "Use one guard's answer to cancel the uncertainty." },
  { difficulty: "Medium", type: "Logic puzzle", question: "If all bloops are razzies and all razzies are lazzies, are all bloops lazzies?", answers: ["Yes", "No", "Cannot tell"], correct: "Yes", hint: "Follow the chain of categories." },
  { difficulty: "Hard", type: "Lateral thinking", question: "A person is found safe after jumping from a plane without a parachute. How?", answers: ["The plane was on the ground", "They landed in water", "They were a pilot"], correct: "The plane was on the ground", hint: "Question the assumption that the plane was flying." },
  { difficulty: "Medium", type: "Deduction puzzle", question: "A code changes CAT to DBU. What does DOG become?", answers: ["EPH", "CNE", "FQI"], correct: "EPH", hint: "Move each letter one step forward." },
  { difficulty: "Hard", type: "Logic puzzle", question: "You have a 3-liter jug and a 5-liter jug. What target amount is classic to measure exactly?", answers: ["4 liters", "6 liters", "7 liters"], correct: "4 liters", hint: "Fill, pour, and leave a remainder." },
  { difficulty: "Medium", type: "Lateral thinking", question: "What gets wetter the more it dries?", answers: ["Towel", "Fire", "Mirror"], correct: "Towel", hint: "It dries other things." },
  { difficulty: "Easy", type: "Riddle", question: "What has a neck but no head?", answers: ["Bottle", "Shirt", "Road"], correct: "Bottle", hint: "Think of a container." },
  { difficulty: "Easy", type: "Riddle", question: "What can travel around the world while staying in a corner?", answers: ["Stamp", "Cloud", "Compass"], correct: "Stamp", hint: "It sits on mail." },
  { difficulty: "Medium", type: "Word puzzle", question: "What word is pronounced the same if you remove four of its five letters?", answers: ["Queue", "Apple", "Train"], correct: "Queue", hint: "Only the first letter sound remains." }
];

function makeOptions(correct, alternatives) {
  const list = [String(correct)];
  for (const alt of alternatives) {
    const value = String(alt);
    if (!list.includes(value)) list.push(value);
    if (list.length === 3) break;
  }
  while (list.length < 3) {
    const fallback = String(Number(correct) + list.length + 1);
    if (!list.includes(fallback)) list.push(fallback);
  }
  return list
    .map((value) => ({ value, sort: Math.sin(value.length * 13 + value.charCodeAt(0)) }))
    .sort((a, b) => a.sort - b.sort)
    .map((item) => item.value);
}

function addPuzzle(puzzles, puzzle) {
  const key = puzzle.question.toLowerCase();
  if (puzzles.some((item) => item.question.toLowerCase() === key)) return;
  puzzles.push(puzzle);
}

function generatePuzzles() {
  const puzzles = [];
  seedPuzzles.forEach((puzzle) => addPuzzle(puzzles, puzzle));

  for (let i = 1; i <= 95; i += 1) {
    const start = (i % 9) + 2;
    const step = (i % 7) + 2;
    const sequence = [start, start + step, start + step * 2, start + step * 3];
    const correct = start + step * 4;
    addPuzzle(puzzles, {
      difficulty: "Easy",
      type: "Pattern puzzle",
      question: `${sequence.join(", ")}, ?`,
      answers: makeOptions(correct, [correct + step, correct - step, correct + 1]),
      correct: String(correct),
      hint: `Add ${step} each time.`
    });
  }

  for (let i = 1; i <= 85; i += 1) {
    const a = 8 + (i % 19);
    const b = 3 + (i % 13);
    const correct = a + b;
    addPuzzle(puzzles, {
      difficulty: "Easy",
      type: "Mental math",
      question: `What is ${a} + ${b}?`,
      answers: makeOptions(correct, [correct - 1, correct + 2, correct + 5]),
      correct: String(correct),
      hint: `Add ${a} and ${b}.`
    });
  }

  for (let i = 1; i <= 95; i += 1) {
    const a = 35 + i;
    const b = 4 + (i % 17);
    const correct = a - b;
    addPuzzle(puzzles, {
      difficulty: "Easy",
      type: "Mental math",
      question: `What is ${a} - ${b}?`,
      answers: makeOptions(correct, [correct - 2, correct + 1, correct + 4]),
      correct: String(correct),
      hint: `Subtract ${b} from ${a}.`
    });
  }

  for (let i = 1; i <= 90; i += 1) {
    const start = (i % 6) + 1;
    const multiplier = (i % 3) + 2;
    const sequence = [start, start * multiplier, start * multiplier ** 2, start * multiplier ** 3];
    const correct = start * multiplier ** 4;
    addPuzzle(puzzles, {
      difficulty: "Medium",
      type: "Pattern puzzle",
      question: `${sequence.join(", ")}, ?`,
      answers: makeOptions(correct, [correct / multiplier, correct + multiplier, correct - multiplier]),
      correct: String(correct),
      hint: `Multiply by ${multiplier} each time.`
    });
  }

  for (let i = 1; i <= 80; i += 1) {
    const a = 2 + (i % 9);
    const x = 3 + (i % 18);
    const b = 4 + (i % 11);
    const result = a * x + b;
    addPuzzle(puzzles, {
      difficulty: "Medium",
      type: "Algebra puzzle",
      question: `If ${a}x + ${b} = ${result}, what is x?`,
      answers: makeOptions(x, [x + 1, x - 1, x + 2]),
      correct: String(x),
      hint: `Subtract ${b}, then divide by ${a}.`
    });
  }

  for (let i = 1; i <= 90; i += 1) {
    const percent = [10, 20, 25, 50][i % 4];
    const base = 40 + i * 4;
    const correct = (base * percent) / 100;
    addPuzzle(puzzles, {
      difficulty: "Medium",
      type: "Percentage puzzle",
      question: `What is ${percent}% of ${base}?`,
      answers: makeOptions(correct, [correct + 4, Math.max(1, correct - 4), correct * 2]),
      correct: String(correct),
      hint: `${percent}% means ${percent} parts out of 100.`
    });
  }

  for (let i = 1; i <= 80; i += 1) {
    const a = i + 2;
    const sequence = [a * a, (a + 1) * (a + 1), (a + 2) * (a + 2), (a + 3) * (a + 3)];
    const correct = (a + 4) * (a + 4);
    addPuzzle(puzzles, {
      difficulty: "Hard",
      type: "Number pattern",
      question: `${sequence.join(", ")}, ?`,
      answers: makeOptions(correct, [correct + a, correct - a, (a + 5) * (a + 5)]),
      correct: String(correct),
      hint: "These are consecutive square numbers."
    });
  }

  for (let i = 1; i <= 95; i += 1) {
    const a = (i % 12) + 2;
    const sequence = [a ** 3, (a + 1) ** 3, (a + 2) ** 3, (a + 3) ** 3];
    const correct = (a + 4) ** 3;
    addPuzzle(puzzles, {
      difficulty: "Hard",
      type: "Number pattern",
      question: `${sequence.join(", ")}, ?`,
      answers: makeOptions(correct, [correct + a * a, correct - a * a, (a + 5) ** 3]),
      correct: String(correct),
      hint: "These are consecutive cube numbers."
    });
  }

  for (let i = 1; i <= 80; i += 1) {
    const mod = 5 + (i % 8);
    const remainder = 1 + (i % (mod - 1));
    const base = 20 + i;
    const number = base * mod + remainder;
    addPuzzle(puzzles, {
      difficulty: "Hard",
      type: "Modular reasoning",
      question: `What is the remainder when ${number} is divided by ${mod}?`,
      answers: makeOptions(remainder, [remainder + 1, Math.max(0, remainder - 1), mod - remainder]),
      correct: String(remainder),
      hint: `${number} = ${base} x ${mod} + ${remainder}.`
    });
  }

  for (let i = 1; i <= 70; i += 1) {
    const people = 3 + (i % 6);
    const handshakes = (people * (people - 1)) / 2;
    addPuzzle(puzzles, {
      difficulty: i % 2 ? "Medium" : "Hard",
      type: "Logic puzzle",
      question: `${people} people each shake hands with every other person once. How many handshakes happen?`,
      answers: makeOptions(handshakes, [handshakes + people, handshakes - 1, people * people]),
      correct: String(handshakes),
      hint: `Use n x (n - 1) / 2 for ${people} people.`
    });
  }

  return {
    version: 1,
    totalPuzzles: puzzles.length,
    difficulties: ["Easy", "Medium", "Hard"],
    puzzles
  };
}

const factOutput = expandFacts();
const puzzleOutput = generatePuzzles();
fs.writeFileSync(puzzlesPath, JSON.stringify(puzzleOutput, null, 2) + "\n");

console.log(JSON.stringify({
  facts: factOutput.totalFacts,
  factCategories: factOutput.categories.length,
  puzzles: puzzleOutput.totalPuzzles,
  puzzleDifficulties: puzzleOutput.difficulties
}, null, 2));
