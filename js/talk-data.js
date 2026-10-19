// Prompts and decks for the talk-and-laugh party games (talk-games.js). All family friendly.
import { familySafe } from './parental.js?v=1';
const pickOne = a => a[Math.floor(Math.random() * a.length)];

// ---------------------------------------------------------------- Emoji Story: secret stories to tell in emoji
const ALL_EMOJI_PROMPTS = [
  'A dog becomes an astronaut', 'Grandma wins a rap battle', 'A vampire goes to the dentist', 'A pizza falls in love with a pineapple',
  'The cat steals the birthday cake', 'A shark is scared of a goldfish', 'Aliens land at a wedding', 'A chicken crosses a very busy road',
  'A snowman goes on a beach holiday', 'The robot learns to dance', 'A pirate loses his treasure map', 'A wizard turns his teacher into a frog',
  'A ghost is afraid of the dark', 'The baby drives the family car', 'A dinosaur goes shopping', 'A monkey becomes king of the jungle',
  'A cowboy rides a unicorn into town', 'The volcano erupts during a picnic', 'A detective solves the case of the missing cookie', 'A penguin opens an ice-cream shop',
  'A superhero forgets their cape', 'A farmer grows a giant pumpkin', 'The moon falls asleep at work', 'A bee wins a gold medal',
  'A princess rescues a dragon', 'A mouse scares an elephant', 'A teacher gets stuck in a lift', 'The football team is made of cats',
  'A tooth fairy runs out of money', 'A zombie runs a marathon', 'A clown joins a rock band', 'An octopus plays the drums',
  'Santa goes on summer holiday', 'A plane is full of chickens', 'Someone burns the toast on a first date', 'A tree grows money',
  'A frog becomes a famous singer', 'The police chase a runaway sheep', 'A spider knits a sweater', 'A kid finds treasure under the bed',
];

// ---------------------------------------------------------------- Fake Movie Pitch
const TITLE_A = ['Revenge of the', 'The Last', 'Night of the', 'Return of the', 'Attack of the', 'The Secret', 'Planet of the', 'Escape from the', 'Love and the', 'The Curse of the', 'Fast and', 'Mission:', 'The Great', 'Invasion of the', 'Diary of a'];
const TITLE_B = ['Toaster', 'Penguins', 'Grandmas', 'Lawnmower', 'Sock', 'Library', 'Spaghetti', 'Cactus', 'Hamsters', 'Bowling Alley', 'Haunted Fridge', 'Llama', 'Disco', 'Leftovers', 'Garden Gnome', 'Laundry', 'Bubble Wrap', 'Moon Cheese', 'Tuba', 'Rubber Duck'];
export const movieTitle = () => `${pickOne(TITLE_A)} ${pickOne(TITLE_B)}`;
const ALL_GENRES = ['Horror', 'Romantic comedy', 'Action thriller', 'Musical', 'Space adventure', 'Western', 'Courtroom drama', 'Nature documentary', 'Superhero blockbuster', 'Heist movie', 'Sports underdog story', 'Kids cartoon', 'Spy thriller', 'Disaster movie', 'Period drama'];
const ALL_STARS = ['a talking dog', 'your grandma', 'a very tired wizard', 'a retired pirate', 'a nervous robot', 'a famous chef', 'a moody teenager', 'a karate-kid goldfish', 'a time-travelling plumber', 'twin babies', 'a disco-dancing alien', 'a heroic hamster', 'a sleepy dragon', 'the school janitor', 'a cowboy with stage fright', 'an overconfident pigeon'];

// ---------------------------------------------------------------- Hot Takes
const ALL_HOT_TAKES = [
  'Cereal is soup.', 'A hot dog is a sandwich.', 'Pineapple belongs on pizza.', 'Socks with sandals is peak fashion.', 'Breakfast for dinner beats dinner.',
  'Cats are better than dogs.', 'Water is wet.', 'The middle seat on a plane is the best seat.', 'Winter is the best season.', 'Cold pizza beats hot pizza.',
  'Books are always better than the movie.', 'Mondays are actually great.', 'Ketchup is a smoothie.', 'A straw has only one hole.', 'Naps are a waste of time.',
  'Toast is just warm bread with ambition.', 'Every pet should be allowed in restaurants.', 'Homework should be mandatory for adults too.', 'Board games are better than video games.', 'Clowns are not scary at all.',
  'Pancakes are better than waffles.', 'Mint toothpaste ruins orange juice on purpose.', 'The ocean is just big soup.', 'Ice is a type of rock.', 'Popcorn is a breakfast cereal.',
  'Sleeping with socks on is the only way.', 'Every room needs a disco ball.', 'Elevators should play heavy metal.', 'Dessert should be eaten first.', 'Spiders are friendly roommates.',
  'Sandwiches taste better cut into triangles.', 'Rain is the perfect weather.', 'Singing in the shower should be an Olympic sport.', 'Vegetables are just plant snacks.', 'Grown-ups should get recess.',
  'Thumb wars are the fairest way to settle arguments.', 'The best part of a cake is the box.', 'Every house should have a slide instead of stairs.', 'Penguins are just tuxedo ducks.', 'Bedtime is optional.',
  'A taco is a sandwich.', 'Tomatoes belong in fruit salad.', 'Alarm clocks should be illegal.', 'Pajamas are acceptable at weddings.', 'Unicorns definitely existed.',
];

// ---------------------------------------------------------------- Who Said That?
const ALL_QUESTIONS = [
  'What food could you eat every single day?', 'What was your worst ever haircut?', 'What is your secret talent?', 'What is your most-used emoji?', 'What would your superhero name be?',
  'What is the weirdest thing you have ever eaten?', 'Which celebrity would play you in a movie?', 'What is your go-to karaoke song?', 'What did you want to be when you were little?', 'What is your biggest pet peeve?',
  'What is the last thing you searched online?', 'What would you buy first if you won the lottery?', 'What smell do you love that others hate?', 'What is your most embarrassing nickname?', 'What is the best gift you have ever got?',
  'Where would you go if you could teleport right now?', 'What is your guilty-pleasure TV show?', 'What is your unpopular food opinion?', 'What animal would you be?', 'What is your hidden fear?',
  'What would you name a boat?', 'What is the strangest dream you remember?', 'What chore do you secretly enjoy?', 'What is your favourite way to waste time?', 'What is a skill you wish you had?',
  'What three words would your friends use for you?', 'What was your first ever phone or game?', 'What is the worst film you have ever seen?', 'What would your last meal be?', 'What is your useless fact?',
];

// ---------------------------------------------------------------- Worst Gift occasions
const ALL_OCCASIONS = ['For their birthday', 'For their wedding day', 'For graduation', 'For a new job', 'For the holidays', 'For moving house', 'For their retirement', 'Just because'];

// ---------------------------------------------------------------- Interrogation: the case, the alibi and what really happened there
const ALL_ALIBIS = [
  { crime: 'The last slice of cake vanished last night at 8 pm', place: 'at the cinema', facts: ['Watched a cartoon about a penguin', 'Ate nachos with too much cheese', 'Sat in row F'] },
  { crime: 'Someone painted the neighbour’s cat blue on Saturday', place: 'at a football match', facts: ['Home team lost 2–1', 'It rained in the second half', 'Bought a hot dog at half-time'] },
  { crime: 'The school trophy went missing on Friday afternoon', place: 'at the dentist', facts: ['Had a filling on the left side', 'Waited 40 minutes', 'Read an old fishing magazine'] },
  { crime: 'The office coffee machine was broken on Monday morning', place: 'stuck in traffic', facts: ['A truck full of chickens tipped over', 'Listened to a podcast about space', 'Was 50 minutes late'] },
  { crime: 'All the garden gnomes were moved last Sunday', place: 'at your aunt’s birthday party', facts: ['She turned 60', 'There was a magician', 'You won a game of bingo'] },
  { crime: 'Someone ate the entire pizza at 11 pm', place: 'asleep in bed', facts: ['Went to bed at 10:30', 'Woke up once for water', 'Dreamt about a giant duck'] },
  { crime: 'The library book is three months overdue', place: 'on a camping trip', facts: ['The tent leaked', 'You saw a fox', 'Cooked beans on a fire'] },
  { crime: 'The class hamster escaped on Tuesday', place: 'at a swimming lesson', facts: ['Swam 20 lengths', 'Lost a goggle', 'The instructor was called Mo'] },
  { crime: 'Someone rang every doorbell on the street at midnight', place: 'at a concert', facts: ['The band played two encores', 'You lost your voice', 'Took the last bus home'] },
  { crime: 'The fridge was left open all night', place: 'at a sleepover', facts: ['Watched three scary movies', 'Pizza was pepperoni', 'Nobody slept before 2 am'] },
  { crime: 'The family car got a mysterious scratch on Wednesday', place: 'at the hairdresser', facts: ['Got a fringe cut', 'The stylist talked about her dog', 'Paid with cash'] },
  { crime: 'Twelve cupcakes disappeared from the bake sale', place: 'at a piano lesson', facts: ['Practised a piece by Mozart', 'The teacher’s cat sat on the piano', 'Lesson ran 10 minutes late'] },
  { crime: 'Someone changed the Wi-Fi password', place: 'at the supermarket', facts: ['Bought bananas and milk', 'The self-checkout broke', 'Saw your old teacher'] },
  { crime: 'The bathroom flooded on Thursday evening', place: 'at a basketball game', facts: ['Scored 6 points', 'Got a high five from the coach', 'Team won in overtime'] },
  { crime: 'The TV remote has been missing since Friday', place: 'at the zoo', facts: ['Saw a giraffe eat a hat', 'Bought a penguin keyring', 'It was very windy'] },
];

// ---------------------------------------------------------------- Translate This
const ALL_PLAIN = [
  'Please take out the rubbish.', 'I would like a cheese sandwich.', 'The bus is running late again.', 'Can you pass me the salt?', 'It is my turn to choose the movie.',
  'I forgot my homework at home.', 'The Wi-Fi is not working.', 'Please stop eating my crisps.', 'We need to buy more milk.', 'Who left their shoes on the stairs?',
  'Your parking ticket has expired.', 'I lost my keys again.', 'The cat is sitting on my laptop.', 'Dinner is ready in five minutes.', 'Can I have the last cookie?',
  'Please turn the music down.', 'The printer is out of paper.', 'I need a nap.', 'It is raining, bring an umbrella.', 'Your order has been delayed.',
  'Happy birthday, I hope you like socks.', 'Do not touch my sandwich.', 'The meeting starts at nine o’clock.', 'Please wipe your feet.', 'I think I left the oven on.',
];
const ALL_STYLES = [
  { name: 'a pirate', tip: 'Arr, matey! Treasure, ships and parrots' }, { name: 'a toddler', tip: 'Short words, big feelings, maybe a tantrum' },
  { name: 'Shakespeare', tip: 'Thee, thou, forsooth and plenty of drama' }, { name: 'an angry customer-service agent', tip: 'Polite… but furious' },
  { name: 'a sports commentator', tip: 'And he’s going for it — WHAT A MOMENT!' }, { name: 'a nature documentary', tip: 'Here we observe the human in its habitat…' },
  { name: 'a superhero', tip: 'Heroic, booming, saving the day' }, { name: 'a robot', tip: 'BEEP. PROCESSING. HUMAN REQUEST.' },
  { name: 'a fairy-tale narrator', tip: 'Once upon a time…' }, { name: 'a cowboy', tip: 'Howdy, partner — yeehaw' },
  { name: 'a movie-trailer voice', tip: 'In a world where…' }, { name: 'a very dramatic villain', tip: 'Mwahaha!' },
  { name: 'a weather forecaster', tip: 'Light showers of nonsense across the north' }, { name: 'a game-show host', tip: 'Come on down!' },
];

// ---------------------------------------------------------------- Excuses, Excuses
const ALL_SITUATIONS = [
  'Why were you on the roof at 3 a.m.?', 'Why is there a goat in your bedroom?', 'Why did you show up to school in pyjamas?', 'Why are you covered in glitter?', 'Why is the car full of balloons?',
  'Why did you eat the whole birthday cake?', 'Why is your homework written in crayon?', 'Why were you singing in the library?', 'Why is the dog wearing your sunglasses?', 'Why are there 40 pizzas at the door?',
  'Why were you hiding in the fridge?', 'Why did you call your teacher “Mum”?', 'Why is there spaghetti on the ceiling?', 'Why are you wearing a wedding dress to the shop?', 'Why did you bring a duck to the cinema?',
  'Why were you 3 hours late?', 'Why is the bath full of jelly?', 'Why did you sell the sofa?', 'Why is the cat painted purple?', 'Why were you dancing in the car park?',
  'Why do you have 200 rubber ducks?', 'Why is your bike on the roof?', 'Why are you holding a trophy you didn’t win?', 'Why did you text your boss a picture of a potato?', 'Why is there a tent in the living room?',
];

// ---------------------------------------------------------------- Lip Reader
const ALL_PHRASES = [
  'I love pizza', 'Where are my keys', 'Banana pancakes', 'Happy birthday to you', 'Pass the ketchup', 'My cat is a genius', 'Is it lunchtime yet',
  'I need a holiday', 'Purple monkey dishwasher', 'Turn the music up', 'Bubble gum', 'Chocolate cake', 'I forgot my homework', 'Watch out for the shark',
  'See you later alligator', 'The dog ate it', 'Let’s go to the beach', 'Hot chocolate please', 'Nice to meet you', 'Strawberry milkshake',
  'Don’t touch my fries', 'I can’t find my phone', 'Peanut butter jelly', 'Pineapple pizza', 'Good morning sunshine', 'Space cowboy',
  'Fluffy pancakes', 'Where is the bathroom', 'I won the lottery', 'Spaghetti and meatballs', 'Wash your hands', 'The floor is lava',
  'Silly goose', 'Crazy hair day', 'Rubber duck', 'Pumpkin pie', 'Snow day', 'Popcorn time', 'I’m so hungry', 'Big red bus',
];

// ---------------------------------------------------------------- Two Words
const ALL_INVENT = [
  { name: 'product', tip: 'What is it and why would anyone buy it?' }, { name: 'band name', tip: 'Name the band and their big hit' },
  { name: 'superhero', tip: 'Hero name and their superpower' }, { name: 'restaurant', tip: 'Name it and the signature dish' },
  { name: 'video game', tip: 'Title and what you do in it' }, { name: 'sport', tip: 'Name it and how you win' },
];

// ---------------------------------------------------------------- Guilty Conscience: have you ever…
const ALL_CONFESSIONS = [
  'Pretended to be asleep to get out of a chore?', 'Eaten food that fell on the floor?', 'Laughed at a joke you didn’t understand?', 'Re-gifted a present?', 'Sung loudly when you thought nobody could hear?',
  'Walked into a glass door?', 'Blamed a smell on the dog?', 'Lied about reading a book?', 'Waved back at someone who wasn’t waving at you?', 'Fallen asleep in a cinema?',
  'Googled yourself?', 'Talked to a pet like it’s a person?', 'Sent a text to the wrong person?', 'Forgotten someone’s name right after meeting them?', 'Eaten dessert before dinner?',
  'Pretended to be on the phone to avoid someone?', 'Worn clothes inside out all day?', 'Practised an argument in the shower?', 'Cried at a cartoon?', 'Snooped through a present before it was given?',
  'Pressed the lift button again to make it come faster?', 'Danced alone in your room?', 'Kept a library book way too long?', 'Hidden snacks from your family?', 'Pretended to know a song’s lyrics?',
  'Tripped over nothing?', 'Said “you too” when a waiter said “enjoy your meal”?', 'Fallen off a chair?', 'Watched a whole series in one day?', 'Eaten cereal for dinner?',
];

// ---------------------------------------------------------------- Plot Twist: story openings
const ALL_STORIES = [
  'Detective Holmes finally opened the locked room. Inside, the missing diamond sat on the table… next to a sleeping cat.',
  'The rocket counted down: three, two, one… and the captain suddenly shouted “STOP!”',
  'Grandma had always said the attic was off limits. Tonight, the attic door was wide open.',
  'The new teacher wrote her name on the board. The whole class gasped.',
  'After 100 years, the treasure chest was finally opened. Inside was a single, glowing sandwich.',
  'The prince knelt down, held out the ring and said, “Will you…”',
  'The weather forecast promised sunshine. Instead, it started raining frogs.',
  'At the school talent show, the shy kid stepped up to the microphone and…',
  'The scientist pressed the big red button. The machine hummed, flashed and…',
  'The lost hiker followed the strange footprints all the way to a tiny door in a tree.',
  'The ghost had haunted the castle for 300 years. Today, it finally had a visitor.',
  'The robot butler served dinner, smiled, and whispered: “I know what you did.”',
  'Every night at midnight, the toys in the shop came alive. Tonight, one of them didn’t.',
  'The pirate captain unrolled the map. The X was on his own ship.',
  'Two best friends found an old phone in the park. It started ringing.',
];

// Parent Controls: leave out anything with a word this family has blocked.
export const EMOJI_PROMPTS = familySafe(ALL_EMOJI_PROMPTS);
export const GENRES = familySafe(ALL_GENRES);
export const STARS = familySafe(ALL_STARS);
export const HOT_TAKES = familySafe(ALL_HOT_TAKES);
export const QUESTIONS = familySafe(ALL_QUESTIONS);
export const OCCASIONS = familySafe(ALL_OCCASIONS);
export const ALIBIS = familySafe(ALL_ALIBIS);
export const PLAIN = familySafe(ALL_PLAIN);
export const STYLES = familySafe(ALL_STYLES);
export const SITUATIONS = familySafe(ALL_SITUATIONS);
export const PHRASES = familySafe(ALL_PHRASES);
export const INVENT = familySafe(ALL_INVENT);
export const CONFESSIONS = familySafe(ALL_CONFESSIONS);
export const STORIES = familySafe(ALL_STORIES);
