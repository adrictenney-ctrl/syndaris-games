// Question material for the quiz-show games.

// [country, ISO code, capital, continent]
export const COUNTRIES = [
  ['France', 'FR', 'Paris', 'Europe'], ['Germany', 'DE', 'Berlin', 'Europe'], ['Italy', 'IT', 'Rome', 'Europe'], ['Spain', 'ES', 'Madrid', 'Europe'],
  ['Portugal', 'PT', 'Lisbon', 'Europe'], ['United Kingdom', 'GB', 'London', 'Europe'], ['Ireland', 'IE', 'Dublin', 'Europe'], ['Netherlands', 'NL', 'Amsterdam', 'Europe'],
  ['Belgium', 'BE', 'Brussels', 'Europe'], ['Switzerland', 'CH', 'Bern', 'Europe'], ['Austria', 'AT', 'Vienna', 'Europe'], ['Sweden', 'SE', 'Stockholm', 'Europe'],
  ['Norway', 'NO', 'Oslo', 'Europe'], ['Denmark', 'DK', 'Copenhagen', 'Europe'], ['Finland', 'FI', 'Helsinki', 'Europe'], ['Iceland', 'IS', 'Reykjavík', 'Europe'],
  ['Poland', 'PL', 'Warsaw', 'Europe'], ['Greece', 'GR', 'Athens', 'Europe'], ['Czechia', 'CZ', 'Prague', 'Europe'], ['Hungary', 'HU', 'Budapest', 'Europe'],
  ['Ukraine', 'UA', 'Kyiv', 'Europe'], ['Romania', 'RO', 'Bucharest', 'Europe'], ['Croatia', 'HR', 'Zagreb', 'Europe'], ['Turkey', 'TR', 'Ankara', 'Asia'],
  ['Russia', 'RU', 'Moscow', 'Europe'], ['United States', 'US', 'Washington, D.C.', 'North America'], ['Canada', 'CA', 'Ottawa', 'North America'], ['Mexico', 'MX', 'Mexico City', 'North America'],
  ['Cuba', 'CU', 'Havana', 'North America'], ['Jamaica', 'JM', 'Kingston', 'North America'], ['Brazil', 'BR', 'Brasília', 'South America'], ['Argentina', 'AR', 'Buenos Aires', 'South America'],
  ['Chile', 'CL', 'Santiago', 'South America'], ['Peru', 'PE', 'Lima', 'South America'], ['Colombia', 'CO', 'Bogotá', 'South America'], ['Venezuela', 'VE', 'Caracas', 'South America'],
  ['Uruguay', 'UY', 'Montevideo', 'South America'], ['Ecuador', 'EC', 'Quito', 'South America'], ['Japan', 'JP', 'Tokyo', 'Asia'], ['China', 'CN', 'Beijing', 'Asia'],
  ['South Korea', 'KR', 'Seoul', 'Asia'], ['India', 'IN', 'New Delhi', 'Asia'], ['Pakistan', 'PK', 'Islamabad', 'Asia'], ['Thailand', 'TH', 'Bangkok', 'Asia'],
  ['Vietnam', 'VN', 'Hanoi', 'Asia'], ['Indonesia', 'ID', 'Jakarta', 'Asia'], ['Philippines', 'PH', 'Manila', 'Asia'], ['Malaysia', 'MY', 'Kuala Lumpur', 'Asia'],
  ['Singapore', 'SG', 'Singapore', 'Asia'], ['Saudi Arabia', 'SA', 'Riyadh', 'Asia'], ['Israel', 'IL', 'Jerusalem', 'Asia'], ['Iran', 'IR', 'Tehran', 'Asia'],
  ['Nepal', 'NP', 'Kathmandu', 'Asia'], ['Mongolia', 'MN', 'Ulaanbaatar', 'Asia'], ['Egypt', 'EG', 'Cairo', 'Africa'], ['Nigeria', 'NG', 'Abuja', 'Africa'],
  ['Kenya', 'KE', 'Nairobi', 'Africa'], ['South Africa', 'ZA', 'Pretoria', 'Africa'], ['Morocco', 'MA', 'Rabat', 'Africa'], ['Ethiopia', 'ET', 'Addis Ababa', 'Africa'],
  ['Ghana', 'GH', 'Accra', 'Africa'], ['Tanzania', 'TZ', 'Dodoma', 'Africa'], ['Senegal', 'SN', 'Dakar', 'Africa'], ['Algeria', 'DZ', 'Algiers', 'Africa'],
  ['Australia', 'AU', 'Canberra', 'Oceania'], ['New Zealand', 'NZ', 'Wellington', 'Oceania'], ['Fiji', 'FJ', 'Suva', 'Oceania'], ['Papua New Guinea', 'PG', 'Port Moresby', 'Oceania'],
];
// A flag as an image (emoji flags don't show on every screen).
export const flagImg = code => `<img class="qz-flag" alt="" src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/${[...code.toLowerCase()].map(c => (0x1f1e6 + c.charCodeAt(0) - 97).toString(16)).join('-')}.svg">`;

// [statement, true?]
export const TRUE_FALSE = [
  ['Octopuses have three hearts.', true], ['Bats are blind.', false], ['A group of crows is called a murder.', true], ['The Great Wall of China is visible from the Moon with the naked eye.', false],
  ['Bananas are berries.', true], ['Strawberries are berries.', false], ['Lightning never strikes the same place twice.', false], ['Honey never spoils if it’s sealed.', true],
  ['Goldfish have a three-second memory.', false], ['Venus is the hottest planet in our solar system.', true], ['Humans use only 10% of their brains.', false], ['A day on Venus is longer than its year.', true],
  ['Sharks are mammals.', false], ['Koalas are bears.', false], ['The Eiffel Tower is taller in summer than in winter.', true], ['Water boils at a lower temperature on a mountain top.', true],
  ['Mount Everest is the tallest mountain measured from base to peak.', false], ['There are more trees on Earth than stars in the Milky Way.', true], ['Ostriches bury their heads in the sand.', false], ['A tomato is a fruit.', true],
  ['Sound travels faster in water than in air.', true], ['The Sahara is the largest desert on Earth.', false], ['Penguins live at the North Pole.', false],
  ['The heart of a blue whale is about the size of a small car.', true], ['Glass is a slow-flowing liquid.', false], ['Dolphins sleep with one eye open.', true], ['Antarctica is the driest continent.', true],
  ['Napoleon was unusually short for his time.', false], ['Peanuts are nuts.', false], ['A shrimp’s heart is in its head.', true],
  ['Diamonds are made of carbon.', true], ['The Atlantic is the largest ocean.', false], ['Some turtles can breathe through their bottoms.', true],
  ['Seahorse fathers carry the babies.', true], ['A jellyfish has a brain.', false], ['Mars has two moons.', true], ['Polar bear skin is black.', true],
  ['Spiders are insects.', false], ['An adult human has more bones than a baby.', false], ['Kangaroos can’t easily walk backwards.', true], ['The Amazon is the longest river in the world by most measures.', false],
  ['Pluto is classed as a dwarf planet.', true], ['Humans and dinosaurs lived at the same time.', false], ['Rubber bands last longer in the fridge.', true], ['Butterflies taste with their feet.', true],
  ['Your fingernails grow faster than your toenails.', true], ['The Pacific Ocean is shrinking.', true], ['A hummingbird can fly backwards.', true], ['Bulls are angered by the colour red.', false],
  ['Lobsters were once considered poor people’s food.', true], ['Mercury is the closest planet to the Sun.', true], ['Elephants are the only animals that can’t jump.', false], ];

// [emoji, phrase or [answers]]
export const EMOJI = [
  ['🌧️🐱🐶', ['raining cats and dogs', 'its raining cats and dogs']], ['🍰', ['piece of cake']], ['🐘🏠', ['elephant in the room']], ['❄️🧊', ['break the ice']],
  ['⏰💸', ['time is money']], ['🍎👁️', ['apple of my eye']], ['🐦🐦🪨', ['kill two birds with one stone', 'two birds one stone']], ['🌙🔵', ['once in a blue moon', 'blue moon']],
  ['🐱👜', ['let the cat out of the bag', 'cat out of the bag']], ['🦵🍀', ['break a leg']], ['🔥🧑‍🚒', ['firefighter', 'fireman']], ['🌟🐟', ['starfish']],
  ['🧈🪰', ['butterfly']], ['☀️🌻', ['sunflower']], ['🐝🏠', ['beehive']], ['🍿🎬', ['movie night', 'movies', 'cinema']],
  ['🎂🎉', ['birthday party']], ['🌈🦄', ['unicorn']], ['🦷🧚', ['tooth fairy']], ['⛄🌨️', ['snowman']],
  ['🌊🏄', ['surfing']], ['🐍🪜', ['snakes and ladders']], ['🏃💨', ['run like the wind']], ['👀🍬', ['eye candy']],
  ['🧊☕', ['iced coffee']], ['🍕👨‍🍳', ['pizza chef']], ['🦈🎵', ['baby shark']], ['🌍🔥', ['global warming']],
  ['🎅🎄', ['christmas']], ['🎃👻', ['halloween']], ['🐢🐇', ['the tortoise and the hare', 'tortoise and the hare']], ['🧸🍯', ['teddy bear']],
  ['🍳🥓', ['breakfast', 'bacon and eggs']], ['🌧️🏹', ['rainbow']], ['🐛📚', ['bookworm']], ['🧑‍🚀🌕', ['moon landing', 'astronaut']],
  ['🪓🌳', ['lumberjack']], ['💤🚶', ['sleepwalking', 'sleep walking']], ['👑🦁', ['lion king', 'king of the jungle']],   ['🐟🍟', ['fish and chips']], ['🍪🍫', ['chocolate chip cookie', 'chocolate cookie']], ['🌶️🔥', ['spicy', 'hot pepper']], ['🐶🏠', ['doghouse', 'in the doghouse']],
];

// [question, option A, option B, index of the answer, note]
export const BIGGER = [
  ['Which is taller?', 'Eiffel Tower', 'Statue of Liberty', 0, 'about 330 m vs 93 m'], ['Which is bigger by area?', 'Canada', 'United States', 0, ''], ['Which has more people?', 'India', 'United States', 0, ''],
  ['Which is longer?', 'Nile', 'Mississippi', 0, ''], ['Which is heavier?', 'Elephant', 'Hippo', 0, 'adult African elephant'], ['Which is faster?', 'Cheetah', 'Racehorse', 0, ''],
  ['Which planet is bigger?', 'Saturn', 'Neptune', 0, ''], ['Which is deeper?', 'Pacific Ocean', 'Atlantic Ocean', 0, ''],
  ['Which has more legs?', 'Spider', 'Ant', 0, '8 vs 6'], ['Which is hotter?', 'Venus', 'Mercury', 0, ''], ['Which is bigger by area?', 'Australia', 'Brazil', 1, 'Brazil ≈ 8.5m km², Australia ≈ 7.7m km²'],
  ['Which has more bones?', 'A baby', 'An adult', 0, 'about 270–300 vs 206'], ['Which came first?', 'The telephone', 'The light bulb (Edison’s)', 0, '1876 vs 1879'], ['Which is longer?', 'A marathon', '40 km', 0, '42.195 km'],
  ['Which has more teeth?', 'Adult human', 'Dog', 1, '42 vs 32'], ['Which is taller?', 'Giraffe', 'African elephant', 0, ''], ['Which lives longer?', 'Tortoise', 'Parrot', 0, ''],
  ['Which is bigger?', 'The Moon', 'Pluto', 0, ''], ['Which is colder?', 'Antarctica', 'The Arctic', 0, ''], ['Which is longer?', 'An Olympic pool', 'A basketball court', 0, '50 m vs 28 m'],
  ['Which has more moons?', 'Mars', 'Earth', 0, '2 vs 1'], ['Which is heavier?', 'A litre of water', 'A litre of olive oil', 0, ''], ['Which is bigger?', 'Greenland', 'Mexico', 0, '2.17m vs 1.96m km²'],
  ['Which is taller?', 'Mount Kilimanjaro', 'Mont Blanc', 0, '5,895 m vs 4,806 m'], ['Which came first?', 'The first Moon landing', 'The first email', 0, '1969 vs 1971'], ['Which has more players on the field?', 'Soccer team', 'Rugby union team', 1, '11 vs 15'],
  ['Which is bigger by area?', 'Texas', 'France (mainland)', 0, ''], ['Which is faster?', 'Peregrine falcon (diving)', 'A Formula 1 car', 0, 'over 380 km/h vs about 360 km/h'], ['Which has more keys?', 'Piano', 'Full-size computer keyboard', 1, '88 vs about 104'],
  ['Which is longer?', 'Great Wall of China', 'Amazon River', 0, ''], ['Which weighs more?', 'Blue whale’s tongue', 'An elephant', 1, 'tongue ≈ 2.7 t; adult elephant ≈ 4–6 t'], ['Which is wider?', 'A football (soccer) goal', 'A hockey goal', 0, '7.32 m vs 1.83 m'],
  ['Which planet is closer to the Sun?', 'Venus', 'Earth', 0, ''], ['Which has more sides?', 'Hexagon', 'Pentagon', 0, ''], ['Which is bigger?', 'A golf ball', 'A table tennis ball', 0, ''],
];

// [riddle, [answers]]
export const RIDDLES = [
  ['What has keys but can’t open locks?', ['piano', 'keyboard']], ['What gets wetter the more it dries?', ['towel']], ['What has a neck but no head?', ['bottle']],
  ['What has hands but can’t clap?', ['clock', 'watch']], ['What can you catch but not throw?', ['cold', 'a cold']], ['What has many teeth but can’t bite?', ['comb', 'zip', 'zipper', 'saw']],
  ['What goes up but never comes down?', ['age', 'your age']], ['What has one eye but can’t see?', ['needle']], ['What is full of holes but still holds water?', ['sponge']],
  ['What runs but never walks?', ['river', 'water', 'tap']], ['The more you take, the more you leave behind. What are they?', ['footsteps', 'steps']], ['What has a thumb and four fingers but isn’t alive?', ['glove']],
  ['What has a head and a tail but no body?', ['coin']], ['What can travel around the world while staying in a corner?', ['stamp', 'postage stamp']], ['What gets bigger the more you take away?', ['hole']],
  ['What belongs to you but others use it more?', ['name', 'your name']], ['What has legs but doesn’t walk?', ['table', 'chair']], ['What can fill a room but takes up no space?', ['light', 'air']],
  ['I’m tall when I’m young and short when I’m old. What am I?', ['candle']], ['What month has 28 days?', ['all of them', 'all', 'every month', 'all months']], ['What is always in front of you but can’t be seen?', ['future', 'the future']],
  ['What can you break without touching it?', ['promise', 'a promise', 'silence']], ['What has words but never speaks?', ['book']], ['What has a bed but never sleeps?', ['river']],
  ['What kind of room has no doors or windows?', ['mushroom']], ['What has cities but no houses, forests but no trees?', ['map']], ['What goes through towns and hills but never moves?', ['road']],
  ['What do you call a bear with no teeth?', ['gummy bear']], ['What has four wheels and flies?', ['bin truck', 'garbage truck', 'rubbish truck']], ['What can’t talk but will reply when spoken to?', ['echo']],
  ['What building has the most stories?', ['library']], ['What starts with T, ends with T and has T in it?', ['teapot']], ['What gets broken without being held?', ['promise', 'record']],
  ['What has 13 hearts but no other organs?', ['deck of cards', 'pack of cards', 'cards']], ['What is so fragile that saying its name breaks it?', ['silence']], ['What has a ring but no finger?', ['phone', 'telephone', 'bell']],
  ['Forward I’m heavy, backward I’m not. What am I?', ['ton']], ['What invention lets you look right through a wall?', ['window']], ['What has an eye but can’t see, and is very windy?', ['hurricane', 'storm', 'tornado']],
  ['What can run but has no legs, and has a mouth but never eats?', ['river']],
];

// [items (the odd one first), why]
export const ODD_ONE = [
  [['Tomato', 'Carrot', 'Potato', 'Onion'], 'a tomato is a fruit'], [['Whale', 'Shark', 'Tuna', 'Salmon'], 'a whale is a mammal'], [['Spider', 'Ant', 'Bee', 'Beetle'], 'a spider isn’t an insect'],
  [['Pluto', 'Mars', 'Venus', 'Jupiter'], 'Pluto is a dwarf planet'], [['Penguin', 'Eagle', 'Sparrow', 'Robin'], 'penguins can’t fly'], [['Violin', 'Trumpet', 'Trombone', 'Tuba'], 'the violin isn’t brass'],
  [['Square', 'Circle', 'Oval', 'Ellipse'], 'a square has corners'], [['Lisbon', 'Barcelona', 'Madrid', 'Seville'], 'Lisbon is in Portugal'], [['Bat', 'Pigeon', 'Owl', 'Parrot'], 'a bat is a mammal'],
  [['Copper', 'Oxygen', 'Nitrogen', 'Helium'], 'copper isn’t a gas'], [['Python', 'Cobra', 'Viper', 'Rattlesnake'], 'a python isn’t venomous'], [['Rugby', 'Tennis', 'Badminton', 'Squash'], 'rugby isn’t a racket sport'],
  [['Sydney', 'Ottawa', 'Canberra', 'Wellington'], 'Sydney isn’t a capital'], [['Frog', 'Lizard', 'Snake', 'Crocodile'], 'a frog is an amphibian'],   [['Mercury', 'Gold', 'Silver', 'Iron'], 'mercury is liquid at room temperature'], [['Peanut', 'Almond', 'Walnut', 'Cashew'], 'a peanut is a legume'],
  [['Sun', 'Moon', 'Mars', 'Venus'], 'the Sun is a star'], [['Cello', 'Flute', 'Clarinet', 'Oboe'], 'the cello isn’t a woodwind'], [['Hexagon', 'Cube', 'Sphere', 'Pyramid'], 'a hexagon is flat'],
  [['Kiwi', 'Emu', 'Ostrich', 'Swan'], 'a swan can fly'], [['Saturn', 'Mercury', 'Venus', 'Mars'], 'Saturn is a gas giant'], [['Ruby', 'Python', 'Cobra', 'Mamba'], 'ruby is a gem, not a snake'],
  [['Nile', 'Sahara', 'Amazon', 'Danube'], 'the Sahara is a desert'], [['Tulip', 'Oak', 'Pine', 'Maple'], 'a tulip isn’t a tree'], [['Thumb', 'Ankle', 'Knee', 'Hip'], 'the thumb isn’t part of the leg'],
  [['Chess', 'Football', 'Basketball', 'Hockey'], 'chess isn’t a ball game'], [['Pencil', 'Pen', 'Marker', 'Ruler'], 'you can’t write with a ruler'], [['Lemon', 'Strawberry', 'Cherry', 'Raspberry'], 'a lemon isn’t red'],
  [['January', 'April', 'June', 'September'], 'January has 31 days'], [['Seven', 'Four', 'Six', 'Eight'], 'seven is odd'], [['Wolf', 'Lion', 'Tiger', 'Leopard'], 'a wolf isn’t a cat'],
  [['Cabbage', 'Apple', 'Banana', 'Mango'], 'a cabbage is a vegetable'], [['Moscow', 'Tokyo', 'Nairobi', 'Lima'], 'Moscow is in Europe'], [['Haiku', 'Novel', 'Biography', 'Encyclopedia'], 'a haiku is a poem'],
];

// [question, right answer, wrong, wrong, wrong]
export const ANIMALS = [
  ['What is the largest animal ever known to have lived?', 'Blue whale', 'Megalodon', 'T. rex', 'African elephant'], ['What do you call a baby kangaroo?', 'Joey', 'Kit', 'Calf', 'Cub'],
  ['How many legs does an insect have?', 'Six', 'Eight', 'Four', 'Ten'], ['Which bird is the fastest diver?', 'Peregrine falcon', 'Golden eagle', 'Swift', 'Albatross'],
  ['What is a group of lions called?', 'A pride', 'A pack', 'A herd', 'A troop'], ['Which animal has the longest neck?', 'Giraffe', 'Ostrich', 'Camel', 'Llama'],
  ['What do pandas mostly eat?', 'Bamboo', 'Fish', 'Berries', 'Grass'], ['Which mammal can truly fly?', 'Bat', 'Flying squirrel', 'Sugar glider', 'Colugo'],
  ['What is the only continent with no native ants?', 'Antarctica', 'Australia', 'Europe', 'South America'], ['Which animal is known for changing colour?', 'Chameleon', 'Gecko', 'Iguana', 'Salamander'],
  ['How many arms does an octopus have?', 'Eight', 'Six', 'Ten', 'Twelve'], ['What is a baby swan called?', 'Cygnet', 'Gosling', 'Duckling', 'Eaglet'],
  ['Which is the largest big cat?', 'Tiger', 'Lion', 'Jaguar', 'Leopard'], ['Where do koalas live in the wild?', 'Australia', 'New Zealand', 'Indonesia', 'South Africa'],
  ['What is the slowest-moving mammal?', 'Three-toed sloth', 'Koala', 'Panda', 'Tortoise'], ['Which bird lays the biggest egg?', 'Ostrich', 'Emu', 'Eagle', 'Penguin'],
  ['What type of animal is a dolphin?', 'Mammal', 'Fish', 'Reptile', 'Amphibian'], ['How do snakes smell?', 'With their tongue', 'With their skin', 'With their eyes', 'They can’t'],
  ['What is a group of fish called?', 'A school', 'A flock', 'A gaggle', 'A colony'], ['Which animal sleeps standing up?', 'Horse', 'Dog', 'Cat', 'Rabbit'],
  ['What colour is a giraffe’s tongue?', 'Dark blue-purple', 'Pink', 'Red', 'Yellow'], ['Which insect makes honey?', 'Bee', 'Wasp', 'Ant', 'Moth'],
  ['What do caterpillars turn into?', 'Butterflies or moths', 'Beetles', 'Dragonflies', 'Bees'], ['Which animal is called the “ship of the desert”?', 'Camel', 'Horse', 'Elephant', 'Donkey'],
  ['How many hearts does an earthworm have?', 'Five', 'One', 'Two', 'Three'], ['Which mammal lays eggs?', 'Platypus', 'Beaver', 'Otter', 'Mole'],
  ['What is the biggest species of shark?', 'Whale shark', 'Great white shark', 'Hammerhead', 'Tiger shark'], ['What is a female deer called?', 'A doe', 'A mare', 'A ewe', 'A sow'],
  ['Which animal has black skin under white fur?', 'Polar bear', 'Arctic fox', 'Snowy owl', 'White rabbit'], ['Where are penguins mostly found?', 'Southern Hemisphere', 'The Arctic', 'Europe', 'North America'],
  ['What is the fastest land animal?', 'Cheetah', 'Pronghorn', 'Lion', 'Greyhound'], ['What is a baby goat called?', 'A kid', 'A lamb', 'A foal', 'A calf'],
  ['Which sea creature has no bones and no brain?', 'Jellyfish', 'Octopus', 'Squid', 'Crab'], ['How long can a camel go without drinking, roughly?', 'Over a week', 'A day', 'Two hours', 'A year'],
];

// [start of proverb, ending, wrong, wrong, wrong]
export const PROVERBS = [
  ['Don’t count your chickens…', 'before they hatch', 'after they cross the road', 'in the dark', 'on a Sunday'], ['The early bird…', 'catches the worm', 'gets the seat', 'sings loudest', 'sleeps first'],
  ['A picture is worth…', 'a thousand words', 'a hundred pounds', 'a second look', 'its frame'], ['Actions speak louder…', 'than words', 'than music', 'in the morning', 'than thunder'],
  ['When in Rome…', 'do as the Romans do', 'eat pizza', 'bring a map', 'look for the Colosseum'], ['Every cloud…', 'has a silver lining', 'brings rain', 'moves on', 'has a shape'],
  ['You can lead a horse to water…', 'but you can’t make it drink', 'but it will swim', 'and it will thank you', 'if it is thirsty'], ['Too many cooks…', 'spoil the broth', 'need a big kitchen', 'make it tasty', 'burn the toast'],
  ['Don’t judge a book…', 'by its cover', 'by its size', 'on the first page', 'in the library'], ['Rome wasn’t built…', 'in a day', 'by one man', 'on sand', 'in winter'],
  ['The grass is always greener…', 'on the other side', 'after the rain', 'in spring', 'in the park'], ['Better late…', 'than never', 'than early', 'than sorry', 'than tired'],
  ['Birds of a feather…', 'flock together', 'fly south', 'sing in tune', 'never land'], ['Look before…', 'you leap', 'you sleep', 'you eat', 'you speak'],
  ['Practice makes…', 'perfect', 'progress', 'noise', 'friends'], ['Two heads…', 'are better than one', 'need two hats', 'cause arguments', 'think alike'],
  ['An apple a day…', 'keeps the doctor away', 'makes you strong', 'is too many', 'keeps you happy'], ['All that glitters…', 'is not gold', 'is pretty', 'is expensive', 'catches the eye'],
  ['Where there’s smoke…', 'there’s fire', 'there’s a barbecue', 'there’s a cloud', 'there’s a chimney'], ['Curiosity killed…', 'the cat', 'the time', 'the mood', 'the mouse'],
  ['Laughter is…', 'the best medicine', 'contagious', 'free', 'loud'], ['Don’t put all your eggs…', 'in one basket', 'in the fridge', 'on the table', 'in a pan'],
  ['A watched pot…', 'never boils', 'always spills', 'gets cold', 'is boring'], ['Beauty is in the eye…', 'of the beholder', 'of the storm', 'of a needle', 'of the camera'],
  ['Honesty is…', 'the best policy', 'rare', 'hard work', 'a gift'], ['The pen is mightier…', 'than the sword', 'than the pencil', 'than the voice', 'than gold'],
  ['Strike while…', 'the iron is hot', 'the sun shines', 'you can', 'it rains'], ['Absence makes the heart…', 'grow fonder', 'beat faster', 'grow colder', 'ache'],
  ['Fortune favours…', 'the bold', 'the rich', 'the patient', 'the lucky'], ['Necessity is the mother…', 'of invention', 'of all things', 'of trouble', 'of wisdom'],
];

// [event, year]
export const EVENTS = [
  ['The first person walks on the Moon', 1969], ['The Titanic sinks', 1912], ['World War II ends', 1945], ['The Berlin Wall falls', 1989], ['Columbus first reaches the Americas', 1492],
  ['The first iPhone goes on sale', 2007], ['The US Declaration of Independence is signed', 1776], ['The Wright brothers’ first powered flight', 1903], ['World War I begins', 1914], ['The French Revolution begins (storming of the Bastille)', 1789],
  ['The first modern Olympic Games, in Athens', 1896], ['Shakespeare is born', 1564], ['The Great Fire of London', 1666], ['Magna Carta is sealed', 1215], ['The Eiffel Tower is completed', 1889],
  ['The first Harry Potter book is published', 1997], ['The World Wide Web is invented by Tim Berners-Lee', 1989], ['Mount Vesuvius buries Pompeii (AD)', 79], ['The Battle of Hastings', 1066],
  ['The Soviet Union launches Sputnik', 1957], ['Abraham Lincoln is assassinated', 1865], ['The Panama Canal opens', 1914], ['Nelson Mandela becomes President of South Africa', 1994], ['The euro coins and notes enter circulation', 2002],
  ['The first email is sent', 1971], ['Charles Darwin publishes On the Origin of Species', 1859], ['Gutenberg prints his Bible (around)', 1455], ['Christopher Columbus is born (around)', 1451], ['The Wall Street Crash', 1929],
  ['The first Star Wars film is released', 1977], ['Queen Elizabeth II is crowned', 1953], ['The Channel Tunnel opens', 1994], ['The first spacecraft reaches the Moon (Luna 2)', 1959], ['Man first climbs Mount Everest', 1953],
  ['The telephone is patented by Alexander Graham Bell', 1876], ['The first Super Bowl is played', 1967], ['The Chernobyl disaster', 1986], ['Facebook is launched', 2004], ['YouTube is founded', 2005],
  ['The Hubble Space Telescope is launched', 1990], ['Leonardo da Vinci is born', 1452], ['The Statue of Liberty is dedicated', 1886], ['The Beatles release their first single', 1962], ['The first FIFA World Cup', 1930],
  ['The Boston Tea Party', 1773], ['Penicillin is discovered by Alexander Fleming', 1928], ['The first ever video game console goes on sale (Magnavox Odyssey)', 1972], ['Pluto is reclassified as a dwarf planet', 2006], ['The Sydney Opera House opens', 1973],
];

// [word, opposite, wrong, wrong]
export const OPPOSITES = [
  ['Ancient', 'Modern', 'Old', 'Historic'], ['Generous', 'Stingy', 'Kind', 'Wealthy'], ['Brave', 'Cowardly', 'Bold', 'Strong'], ['Victory', 'Defeat', 'Triumph', 'Battle'],
  ['Expand', 'Shrink', 'Grow', 'Stretch'], ['Shallow', 'Deep', 'Wide', 'Narrow'], ['Accept', 'Refuse', 'Take', 'Allow'], ['Rough', 'Smooth', 'Hard', 'Bumpy'],
  ['Arrive', 'Depart', 'Reach', 'Enter'], ['Rare', 'Common', 'Unusual', 'Precious'], ['Hero', 'Villain', 'Champion', 'Leader'], ['Freeze', 'Melt', 'Chill', 'Harden'],
  ['Include', 'Exclude', 'Contain', 'Add'], ['Maximum', 'Minimum', 'Most', 'Total'], ['Optimist', 'Pessimist', 'Dreamer', 'Realist'], ['Permanent', 'Temporary', 'Lasting', 'Fixed'],
  ['Visible', 'Invisible', 'Clear', 'Bright'], ['Wealth', 'Poverty', 'Riches', 'Money'], ['Exterior', 'Interior', 'Outside', 'Surface'], ['Fragile', 'Sturdy', 'Delicate', 'Thin'],
  ['Increase', 'Decrease', 'Raise', 'Boost'], ['Ascend', 'Descend', 'Climb', 'Rise'], ['Praise', 'Criticise', 'Applaud', 'Admire'], ['Noisy', 'Silent', 'Loud', 'Rowdy'],
  ['Majority', 'Minority', 'Most', 'Crowd'], ['Vacant', 'Occupied', 'Empty', 'Open'], ['Artificial', 'Natural', 'Fake', 'Plastic'], ['Ally', 'Enemy', 'Friend', 'Partner'],
  ['Transparent', 'Opaque', 'Clear', 'Glassy'], ['Humble', 'Arrogant', 'Modest', 'Quiet'], ['Lend', 'Borrow', 'Give', 'Loan'], ['Dawn', 'Dusk', 'Morning', 'Sunrise'],
  ['Simple', 'Complex', 'Easy', 'Plain'], ['Obey', 'Defy', 'Follow', 'Listen'], ['Plural', 'Singular', 'Many', 'Several'], ['Hostile', 'Friendly', 'Angry', 'Cruel'],
];

// [clue, answer]
export const CLUES = [
  ['Frozen water', 'ice'], ['Opposite of north', 'south'], ['Baby cat', 'kitten'], ['Capital of Italy', 'rome'], ['Planet we live on', 'earth'], ['Seven days', 'week'],
  ['Bee product', 'honey'], ['Large body of salt water', 'ocean'], ['It shines at night in the sky', 'moon'], ['Yellow fruit monkeys love', 'banana'], ['Twelve of these make a year', 'months'],
  ['Number of legs on a spider', 'eight'], ['Red planet', 'mars'], ['Frozen rain in flakes', 'snow'], ['Opposite of always', 'never'], ['Where bread is baked and sold', 'bakery'],
  ['You sleep in it', 'bed'], ['Colour of grass', 'green'], ['King of the jungle', 'lion'], ['Mother of your mother', 'grandmother'], ['Shape with three sides', 'triangle'],
  ['Hot drink from leaves', 'tea'], ['Tool for cutting paper', 'scissors'], ['Dog’s home', 'kennel'], ['First meal of the day', 'breakfast'], ['Big grey animal with a trunk', 'elephant'],
  ['Sport with a shuttlecock', 'badminton'], ['Day after Monday', 'tuesday'], ['Musical instrument with 88 keys', 'piano'], ['Opposite of ancient', 'modern'], ['Person who flies a plane', 'pilot'],
  ['Hard outer layer of a tree', 'bark'], ['It holds up your head', 'neck'], ['Ten years', 'decade'], ['One hundred years', 'century'], ['Device to tell the time', 'clock'],
  ['Season after summer', 'autumn'], ['Frozen dessert in a cone', 'ice cream'], ['Insect that glows', 'firefly'], ['Liquid from a cow', 'milk'], ['Water falling from clouds', 'rain'],
  ['Where you see films', 'cinema'], ['Very big wave', 'tsunami'], ['A doctor for animals', 'vet'], ['Book of maps', 'atlas'], ['Morse code distress signal', 'sos'],
  ['Largest desert', 'antarctica'], ['Shape of a stop sign', 'octagon'], ['Fear of spiders', 'arachnophobia'], ['Opposite of shallow', 'deep'],
];
