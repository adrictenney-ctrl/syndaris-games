// Material for the word games.

// Everyday five-letter words (answers for Five Letters; any real word can be guessed).
export const FIVE = `about above actor acute adult after again agent agree ahead alarm album alert alike alive allow alone along alter amber among angel anger angle angry apple apply arena argue arise armor aside asset audio avoid award aware awful bacon badge baker basic beach beard beast begin being below bench berry birth black blade blame blank blast blaze blend bless blind block blond blood bloom board boast bonus boost booth brain brake brand brave bread break brick bride brief bring broad brook brown brush build bunch burst cabin cable camel candy canoe cargo carry catch cause chain chair chalk charm chart chase cheap check cheek cheer chess chest chief child chill choir civic claim class clean clear clerk click cliff climb clock close cloth cloud clown coach coast cocoa comet coral couch count court cover crack craft crane crash crawl crazy cream crisp crowd crown crumb crush curve cycle daily dairy daisy dance delay depth diary dizzy dough dozen draft drain drama dream dress drift drink drive eager eagle early earth eight elbow elder empty enjoy enter entry equal error event exact exist extra fable faint fairy faith false fancy feast fence ferry fever field fifty fight final flame flash fleet flint float flock flood floor flour fluid flute focus force forge forum found frame fresh front frost fruit funny gauge ghost giant glass gleam globe glove grace grade grain grand grape grass gravy great green greet grill groan group guard guess guest guide habit happy harsh heart heavy hedge hello hobby honey honor horse hotel house human humor ideal image index inner input irony ivory jelly jewel joint jolly juice knife knock label laser later laugh layer lemon level light limit linen liver local lodge logic loose lucky lunar lunch magic major maple march match mayor medal melon mercy merit metal minor minus model money month moral motor mount mouse mouth movie music naive nerve never night noble noise north novel nurse ocean offer olive onion opera orbit order organ other otter outer owner paint panel panda panic paper party pasta patch peace peach pearl pedal penny phone photo piano piece pilot pinch pizza place plain plane plant plate plaza point polar porch pound power press price pride prize proud pulse punch puppy queen quest quick quiet quilt quite radio raise rally ranch range rapid raven reach ready realm relax reply rider ridge rifle right river roast robin robot rocky roman rough round route royal rugby ruler salad sauce scale scarf scene scoop score scout screw shade shake shape share shark sharp sheep shelf shell shine shirt shock shore short shout sight skate skill skirt skull sleep slice slide small smart smell smile smoke snack snake solid sound south space spare spark speak speed spell spend spice spine spoon sport spray squad stack staff stage stair stamp stand start steak steam steel stick still stone storm story stove straw strip stuck style sugar suite sunny super sweet swing sword table taste teach teeth thank theme thick thief thing think third thumb tiger toast today token tooth topic torch total tough tower toxic track trade trail train treat trend trial tribe trick truck truly trunk trust truth tulip tuner twist ultra uncle under union unity upper upset urban usual vague valid value vapor video vigor viral visit vital vivid vocal voice wagon waste watch water whale wheat wheel while whole witch woman world worry worth wrist write yacht yield young youth zebra`.split(/\s+/);

// Word Gallows: [category, word or phrase]
export const GALLOWS = [
  ['Animal', 'giraffe'], ['Animal', 'kangaroo'], ['Animal', 'octopus'], ['Animal', 'flamingo'], ['Animal', 'hedgehog'], ['Animal', 'crocodile'], ['Animal', 'penguin'], ['Animal', 'chameleon'],
  ['Food', 'spaghetti'], ['Food', 'pancakes'], ['Food', 'avocado'], ['Food', 'broccoli'], ['Food', 'cinnamon roll'], ['Food', 'mashed potatoes'], ['Food', 'blueberry muffin'], ['Food', 'pineapple'],
  ['Place', 'lighthouse'], ['Place', 'volcano'], ['Place', 'library'], ['Place', 'waterfall'], ['Place', 'supermarket'], ['Place', 'playground'], ['Place', 'rainforest'], ['Place', 'aquarium'],
  ['Thing', 'umbrella'], ['Thing', 'telescope'], ['Thing', 'skateboard'], ['Thing', 'toothbrush'], ['Thing', 'trampoline'], ['Thing', 'wheelbarrow'], ['Thing', 'microwave'], ['Thing', 'headphones'],
  ['Job', 'astronaut'], ['Job', 'firefighter'], ['Job', 'carpenter'], ['Job', 'veterinarian'], ['Job', 'photographer'], ['Job', 'librarian'], ['Job', 'electrician'], ['Job', 'zookeeper'],
  ['Phrase', 'piece of cake'], ['Phrase', 'break the ice'], ['Phrase', 'hit the road'], ['Phrase', 'under the weather'], ['Phrase', 'time flies'], ['Phrase', 'cold feet'], ['Phrase', 'on cloud nine'], ['Phrase', 'spill the beans'],
  ['Sport', 'basketball'], ['Sport', 'badminton'], ['Sport', 'snowboarding'], ['Sport', 'gymnastics'], ['Sport', 'volleyball'], ['Sport', 'skateboarding'], ['Sport', 'table tennis'], ['Sport', 'archery'],
];

// Speed Typist sentences.
export const SENTENCES = [
  'The quick brown fox jumps over the lazy dog.', 'A journey of a thousand miles begins with a single step.', 'Pack my box with five dozen liquor jugs.', 'Every cloud has a silver lining.',
  'The early bird catches the worm.', 'Two wrongs do not make a right.', 'Better late than never, but never late is better.', 'Practice makes progress, not perfect.',
  'The penguin waddled across the frozen lake.', 'My grandmother keeps a parrot that sings opera.', 'Seven sleepy sloths slowly sipped soup.', 'The robot forgot where it parked the spaceship.',
  'Never trust a cat with a calendar.', 'Pancakes taste better on a rainy Sunday.', 'The lighthouse blinked twice and went quiet.', 'A wizard never arrives late to dinner.',
  'Bring an umbrella in case of meatballs.', 'The dragon only eats pizza on Fridays.', 'She sells sea shells by the sea shore.', 'How much wood would a woodchuck chuck?',
  'The museum of socks is closed for repairs.', 'Jellyfish have no brains but plenty of style.', 'Our teacher brought a llama to class.', 'The volcano sneezed and everyone cheered.',
  'Five frogs formed a very fancy band.', 'Do not feed the vending machine after midnight.', 'The moon is made of extremely old cheese.', 'Pirates prefer treasure maps with snacks.',
];

// Fib Finder: [fact with ___ , real answer, other accepted spellings]
export const FIBS = [
  ['A group of flamingos is called a ___.', 'flamboyance'], ['The national animal of Scotland is the ___.', 'unicorn'], ['The dot over a lowercase i is called a ___.', 'tittle'],
  ['A baby puffin is called a ___.', 'puffling'], ['The plastic tip of a shoelace is called an ___.', 'aglet'], ['Wombat droppings are shaped like ___.', 'cubes', 'cube'],
  ['The shortest war in recorded history lasted about ___ minutes.', '38', 'thirty eight'], ['The # symbol is also called an ___.', 'octothorpe'], ['A group of owls is called a ___.', 'parliament'],
  ['Bubble wrap was first invented to be sold as ___.', 'wallpaper'], ['Sea otters hold ___ while they sleep so they don’t drift apart.', 'hands'], ['A “jiffy” is a real unit of ___.', 'time'],
  ['In Switzerland it’s illegal to own just one ___.', 'guinea pig', 'guinea pigs'], ['Sloths can hold their breath longer than ___.', 'dolphins', 'dolphin'],
  ['A group of crows is called a ___.', 'murder'], ['Butterflies taste with their ___.', 'feet'], ['The inventor of the Pringles can had some of his ashes buried in a ___.', 'pringles can', 'pringles tube'],
  ['A group of porcupines is called a ___.', 'prickle'], ['The fear of the number 13 is called ___.', 'triskaidekaphobia'], ['A baby hedgehog is called a ___.', 'hoglet'],
  ['The longest bone in the human body is the ___.', 'femur', 'thigh bone'], ['Honey bees can recognise human ___.', 'faces'], ['The first product scanned with a barcode was a pack of ___.', 'chewing gum', 'gum'],
  ['A group of jellyfish is called a ___.', 'smack'], ['The tiny pocket inside the front pocket of jeans was first made for ___.', 'pocket watches', 'watches', 'pocket watch'], ['The space between your eyebrows is called the ___.', 'glabella'],
  ['A blue whale’s heart is about the size of a small ___.', 'car'],
];

// Slow Reveal: [emoji, answer, alternatives…]
export const REVEAL = [
  ['🦒', 'giraffe'], ['🐘', 'elephant'], ['🦩', 'flamingo'], ['🐙', 'octopus'], ['🦔', 'hedgehog'], ['🐧', 'penguin'], ['🦀', 'crab'], ['🐢', 'turtle', 'tortoise'], ['🦋', 'butterfly'], ['🐝', 'bee'],
  ['🦉', 'owl'], ['🐬', 'dolphin'], ['🦁', 'lion'], ['🐸', 'frog'], ['🐌', 'snail'], ['🦜', 'parrot'], ['🐳', 'whale'], ['🦊', 'fox'], ['🐼', 'panda'], ['🦘', 'kangaroo'],
  ['🍍', 'pineapple'], ['🍉', 'watermelon'], ['🍕', 'pizza'], ['🍩', 'donut', 'doughnut'], ['🌮', 'taco'], ['🍔', 'burger', 'hamburger'], ['🥐', 'croissant'], ['🍓', 'strawberry'], ['🥥', 'coconut'], ['🧁', 'cupcake'],
  ['🚀', 'rocket'], ['🚲', 'bicycle', 'bike'], ['⛵', 'sailboat', 'boat'], ['🚁', 'helicopter'], ['🚂', 'train', 'locomotive'], ['🎸', 'guitar'], ['🎺', 'trumpet'], ['🥁', 'drum', 'drums'], ['🎈', 'balloon'], ['🎁', 'present', 'gift'],
  ['☂️', 'umbrella'], ['⏰', 'alarm clock', 'clock'], ['🔑', 'key'], ['💡', 'light bulb', 'lightbulb', 'bulb'], ['🔭', 'telescope'], ['⚓', 'anchor'], ['🏰', 'castle'], ['🌋', 'volcano'], ['🗽', 'statue of liberty'], ['🌈', 'rainbow'],
  ['⛄', 'snowman'], ['🎃', 'pumpkin', 'jack o lantern'], ['👑', 'crown'], ['🧲', 'magnet'], ['🪁', 'kite'], ['🏆', 'trophy'], ['🕷️', 'spider'], ['🌵', 'cactus'], ['🍄', 'mushroom'], ['🌻', 'sunflower'],
];
