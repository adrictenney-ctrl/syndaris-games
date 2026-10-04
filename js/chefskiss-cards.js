// Chef's Kiss card decks. Every card has a Brain Bulb description.
// Recipe Cards:     "Title | description"
// Ingredient Cards: "kind | Title | description"   kind: p = person/creature, t = thing, e = event/action, c = place/idea
// Official decks stay family-friendly.

const E2026_R = `
The worst thing to bring to a picnic | Something that would ruin a nice lunch outside.
What's really in the secret sauce | The mystery ingredient nobody talks about.
Grandma's secret weapon | What Grandma uses to win every argument.
The first thing I'd save in a fire | The one thing you grab on the way out.
Totally overrated | Something people love way more than it deserves.
My villain origin story | The moment that turned you a little bit evil.
What the dog is thinking right now | Inside the mind of a staring dog.
The perfect excuse for being late | A reason so good nobody can be mad.
A terrible name for a boat | What you should never paint on the side of a boat.
What woke me up at 3 a.m. | The thing that ruined a good night's sleep.
The real reason the dinosaurs disappeared | The truth the textbooks left out.
The best thing about Mondays | There has to be something good about them.
What I'd bring to a deserted island | Your one item for life on an island.
The secret to a happy marriage | Advice for a love that lasts.
The worst superpower to have | A power that's more trouble than it's worth.
What I'm hiding in my closet | The thing you don't want guests to find.
A sign the zombie apocalypse has started | A clue that the undead are on their way.
What my phone autocorrects to | When your phone thinks it knows best.
The theme of my next birthday party | The big idea for your next party.
Something you shouldn't say at a job interview | Words that won't get you hired.
Why the cat knocked it off the table | The real reason cats push things off edges.
What aliens think is weird about us | A human habit that confuses visitors from space.
A rejected theme park ride | A ride that never made it past the drawing board.
My most useless talent | A skill that impresses absolutely no one.
What's at the bottom of my bag | The mystery stuff that piles up in a bag.
The worst gift for a first date | A present that ends the date early.
A brand new Olympic sport | An event that belongs in the next Olympics.
What I'd do with a million dollars | Your first move after getting rich.
A new flavor of ice cream | Something the ice cream shop should try.
My spirit animal | The creature that best represents you.
What the GPS says when it's had enough | When the map voice finally loses patience.
Why I can't come to work today | The excuse you send your boss.
The worst place to fall asleep | Somewhere you really should stay awake.
Always in the junk drawer | The stuff every junk drawer collects.
The best part of a family reunion | What makes the whole trip worth it.
Why the wedding was called off | The surprise that stopped the ceremony.
A feeling with no name yet | An emotion that deserves its own word.
What my houseplant would say | If your plant could finally talk.
A terrible slogan for a hospital | Words that do not inspire confidence.
The next big social media trend | What everyone will be posting next.
An unexpected thing in a sandwich | A surprise between the bread.
A life hack that doesn't work | Advice that sounds smart but fails.
A bad name for a band | A band name that will never sell tickets.
My retirement plan | How you plan to spend your golden years.
The worst thing to hear from the pilot | Words you don't want over the plane speaker.
What's living under the bed | The thing you feared as a kid.
What I'd name my robot butler | The name for your future helper bot.
The most awkward elevator ride | A moment stuck in a small box with strangers.
A smell that brings back memories | A scent that takes you back in time.
What happens when you fall asleep in class | The fallout of a nap at school.
A reality show that needs to happen | A TV show someone should make right now.
The worst thing to say in a wedding toast | Words that ruin a happy speech.
Pure chaos | Something that brings total disorder.
Found in a time capsule from 2010 | A snapshot of life around 2010.
The secret to staying young | How to stay young forever.
A text you don't want from your mom | A message that makes your heart drop.
My last meal | What you'd want to eat one final time.
The scariest thing at the grocery store | What makes shopping frightening.
What I really do when nobody's watching | Your private, secret habit.
A brand new holiday | A day that deserves to be celebrated.
Totally adorable | Something so cute it's hard to handle.
Absolutely unforgettable | Something you could never forget.
Smells suspicious | Something you wouldn't want to sniff.
Would ruin a road trip | Something that turns a fun drive into a disaster.
The peak of human achievement | The greatest thing people have ever done.
`;

const E2026_I = `
p | A goat in pajamas | A farm goat dressed for bed.
p | My third-grade teacher | The teacher who knew all your tricks.
p | A raccoon with a plan | A clever masked bandit up to something.
p | The uncle who won't give up the karaoke mic | The relative who sings every song.
p | A very confused pirate | A sea robber who has lost the map and the plot.
p | Grandpa on a scooter | An older gentleman zooming around town.
p | A mime stuck in a real box | A silent performer who can't get out this time.
p | The world's tiniest horse | A horse small enough to fit in a backpack.
p | A substitute teacher | The stand-in for a class's regular teacher.
p | A sloth in a hurry | The slowest animal trying its very best.
p | A grumpy cat | A cat that looks annoyed at everything.
p | A pigeon with an attitude | A city bird that is not afraid of you.
p | A very polite robot | A machine with perfect manners.
p | Bigfoot | A large, hairy creature said to live in the woods.
p | The Loch Ness Monster | A legendary creature said to live in a Scottish lake.
p | A ninja librarian | A librarian who shushes from the shadows.
p | A dog who thinks he's a cat | A pup with a very confused identity.
p | A toddler with a marker | A small child holding big danger.
p | A llama with a grudge | An animal known for spitting when annoyed.
p | A Viking on vacation | A Norse warrior taking some time off.
p | Your mom's best friend | The person who has heard every story about you.
p | An overly excited weather reporter | Someone very, very thrilled about rain.
p | A wizard who forgot his spells | A magic user having an off day.
p | A dinosaur with tiny arms | A T. rex who can't reach anything.
p | A penguin in a tuxedo | A bird that always looks dressed up.
p | Someone unboxing something online | A person filming themselves opening a package.
p | The group project slacker | The teammate who lets everyone else do the work.
p | A squirrel who found coffee | A jittery little rodent with a lot of energy.
p | A cowboy on a hoverboard | An old-west rider on a modern toy.
p | A choir of cats | Many cats singing, sort of.
p | A suspicious-looking snowman | A snowman who is up to no good.
p | A hamster on a wheel | A small pet running in circles.
p | The ice cream truck driver | The person behind the music-playing truck.
p | A very tired lifeguard | A beach guard who needs a nap.
p | A robot vacuum | A little round machine that cleans the floor.
p | An influencer | Someone who posts online to inspire followers.
p | A grandma on a skateboard | An older lady doing tricks.
p | A clown at a business meeting | Someone in big shoes at a serious meeting.
p | A cat that hates Mondays | A lazy cat with strong opinions.
p | The tooth fairy on strike | A fairy who refuses to pick up teeth.
t | Free Wi-Fi | Internet you don't have to pay for.
t | A selfie stick | A pole for taking photos of yourself.
t | A fidget spinner | A spinning toy that was everywhere in 2017.
t | A flip phone | A phone that folds in half, popular in the 2000s.
t | Socks with sandals | A bold fashion choice.
t | A very large pickle | A pickle much bigger than normal.
t | The emoji keyboard | The menu of little faces and pictures on a phone.
t | Cold leftover pizza | Pizza saved for later and eaten straight from the fridge.
t | A rubber chicken | A floppy fake chicken used for laughs.
t | The last cookie | The final cookie that everyone wants.
t | A haunted toaster | A kitchen appliance with a spooky spirit.
t | Glitter | Tiny sparkles that never, ever go away.
t | A whoopee cushion | A prank cushion that makes a rude noise.
t | Bubble wrap | Plastic with air bubbles that's fun to pop.
t | A smart fridge | A refrigerator connected to the internet.
t | Duct tape | Strong tape that fixes almost anything.
t | A mystery casserole | A baked dish of unknown ingredients.
t | An inflatable dinosaur costume | A blow-up suit that turns you into a T. rex.
t | Light-up sneakers | Shoes with lights that flash as you walk.
t | The TV remote | The clicker that always goes missing.
t | A participation trophy | A prize everyone gets for showing up.
t | A hot dog bun that's too small | A food problem as old as time.
t | Expired coupons | Discounts you can no longer use.
t | A treadmill used as a clothes rack | Exercise gear that now holds laundry.
t | Pineapple on pizza | Pizza with pineapple, a great debate.
t | A bouncy castle | An inflatable castle for jumping.
t | Kale | A leafy green vegetable famous for being healthy.
t | An air fryer | A kitchen gadget that crisps food with hot air.
t | Noise-canceling headphones | Headphones that block out the world.
t | A giant rubber duck | A bath toy the size of a car.
t | A treasure map | A map showing where riches are hidden.
t | Socks that don't match | Two socks from different pairs.
t | The group chat | A text conversation with lots of friends.
t | A fanny pack | A small bag worn around the waist.
t | A spork | A spoon and a fork in one.
t | A 1,000-piece puzzle | A puzzle with a thousand pieces.
t | A really slow internet connection | When pages take forever to load.
t | A cardboard box | A plain box, the best toy for any cat.
t | A garden gnome | A little bearded statue for the yard.
t | A wobbly table | A table that tips when you lean on it.
t | Cotton candy | Spun sugar that melts in your mouth.
t | A hoverboard | A self-balancing two-wheeled board.
t | A karaoke machine | A machine for singing along to songs.
t | A paper airplane | A plane folded out of paper.
t | A stuffed animal collection | A big pile of cuddly toys.
e | Stepping on a toy brick | A tiny plastic brick that hurts to step on.
e | Hitting reply-all by accident | Sending a message to everyone instead of one person.
e | A surprise pop quiz | A test you didn't know was coming.
e | Brain freeze | The pain from eating something cold too fast.
e | Waving back at someone who wasn't waving at you | An awkward mix-up in public.
e | A sneeze during a quiet moment | A loud sneeze at the worst time.
e | Forgetting someone's name | Blanking on a name you should know.
e | A dance-off | A contest to see who dances best.
e | Losing the remote in the couch | When the remote falls into the cushions.
e | A song stuck in your head | A tune that won't go away.
e | Tripping over nothing | Stumbling on a perfectly flat floor.
e | Opening the fridge for no reason | Looking in the fridge just because.
e | A flash mob | A crowd that suddenly breaks into a dance.
e | Burning the popcorn | Ruining the movie-night snack.
e | The ice bucket challenge | A 2014 trend of dumping ice water on yourself for charity.
e | Planking | A 2011 trend of lying stiff in odd places for photos.
e | A tickle fight | A playful battle of tickling.
e | Pressing snooze six times | Putting off waking up again and again.
e | Stubbing your toe | Hitting your toe on the furniture.
e | Binge-watching a whole season | Watching every episode in one sitting.
e | Building a pillow fort | A fort built from pillows and blankets.
e | A food fight | Throwing food at each other for fun.
e | Getting caught singing in the car | Being seen belting out a song.
e | The dab | A dance move with your face in your elbow, big in 2016.
e | A conga line | A party dance in one long line.
e | Running out of toilet paper | An empty roll at the worst possible time.
e | Accidentally liking an old photo | Tapping "like" on a photo from years ago.
e | Spilling coffee on your shirt | A stain right before something important.
e | Parallel parking | Squeezing a car into a tight spot.
e | Getting lost at the mall | Wandering around looking for your group.
e | A water balloon ambush | A surprise attack with water balloons.
e | Hiccups that won't stop | Hiccups that last way too long.
e | Wearing pajamas all day | Never changing out of sleep clothes.
e | Yelling "Bingo!" too early | Calling a win you didn't actually get.
e | A cannonball into the pool | A big, splashing jump.
e | Snoring on a plane | Sleeping loudly in a crowded place.
e | Having screws left over | Building furniture and finding extra parts.
e | A sneaky midnight snack | Eating in the kitchen late at night.
e | Doing the robot | A dance where you move like a stiff machine.
c | The friend zone | When someone only wants to be friends.
c | Monday morning | The start of the work or school week.
c | The DMV | The office where you get a driver's license and wait in line.
c | A really long line | A wait that goes on forever.
c | Awkward silence | When nobody knows what to say.
c | The terms and conditions | The fine print nobody reads.
c | A haunted house | A house said to have ghosts.
c | Grandma's attic | An attic full of old treasures.
c | The middle seat | The squished seat between two others.
c | An all-you-can-eat buffet | A spread of food where you serve yourself.
c | Fashionably late | Arriving late on purpose to look cool.
c | Pure joy | A feeling of total happiness.
c | The Wild West | The rugged frontier of old cowboy stories.
c | A spa day | A day of relaxing and pampering.
c | The fanciest restaurant in town | Where you need a reservation and a nice shirt.
c | Total chaos | Everything going wrong at once.
c | Peer pressure | When friends push you to do something.
c | A family road trip | A long drive with everyone in the car.
c | Summer camp | Where kids swim, do crafts, and sleep in cabins.
c | The back of the bus | Where the cool kids sit.
c | Déjà vu | The feeling you've lived this moment before.
c | Nap time | A short sleep in the afternoon.
c | The Bermuda Triangle | An ocean area where ships are said to vanish.
c | A dentist's waiting room | Where you wait nervously for a checkup.
c | A water park | A park full of slides and pools.
c | Infinity | Something that never ends.
c | The cool aunt | The relative who lets you do fun things.
c | Your search history | The list of everything you've looked up.
`;

const SILLY_R = `
Super silly | Very, very funny and goofy.
Yucky | Something gross you don't want to touch.
Really loud | Something that makes a big noise.
Fluffy | Soft and puffy, like a cloud.
Sticky | Something that sticks to your hands.
The best thing at the zoo | What you want to see most at the zoo.
Something in my lunchbox | What you might find in your lunch.
Wiggly | Something that wiggles and wobbles.
Super fast | Something that goes zoom!
Smelly | Something with a strong smell.
What I want for my birthday | The best present ever.
A great place to hide | Where no one would ever find you.
Something a dragon would eat | A snack for a big, scaly dragon.
Spooky | A little bit scary.
Tiny | Very, very small.
Giant | Very, very big.
Something that makes me giggle | What gets you laughing.
The best pet ever | The pet you want most.
Something at the beach | What you might see by the ocean.
Bouncy | Something that bounces up and down.
Shiny | Something that sparkles in the light.
What a monster is scared of | What makes a monster run away.
Something in space | Something far up past the clouds.
Squishy | Soft enough to squeeze.
Something a pirate needs | What a pirate brings on the ship.
The best snack | Your favorite thing to munch.
Cold | Brrr! Something chilly.
Hot | Something very warm.
Something in my backpack | What you carry to school.
Sleepy | Something tired and yawning.
Something that can fly | Something that goes up in the air.
Messy | Something that makes a big mess.
Something a superhero needs | What helps a hero save the day.
Wet | Something soaked with water.
Something at a birthday party | What you see at a party.
Grumpy | Cranky and in a bad mood.
`;

const SILLY_I = `
p | A dancing banana | A banana that loves to dance.
p | A puppy | A baby dog.
p | A dinosaur | A giant reptile from long, long ago.
p | My little brother | A younger boy in the family.
p | A unicorn | A magic horse with a horn.
p | A monkey | A playful animal that climbs trees.
p | A pirate | A sailor who looks for treasure.
p | A robot | A machine that can move and talk.
p | A dragon | A big flying creature that breathes fire.
p | A kitten | A baby cat.
p | A clown | A funny performer with a red nose.
p | An octopus | A sea animal with eight arms.
p | A superhero | A hero with special powers.
p | A friendly ghost | A floating spirit who just wants to play.
p | A frog | A green animal that hops and croaks.
p | A shark | A big fish with lots of teeth.
p | A wizard | A person who does magic.
p | A penguin | A bird that swims but can't fly.
p | A skunk | An animal that can make a big stink.
p | A giraffe | An animal with a very long neck.
p | My teacher | The grown-up who teaches your class.
p | A princess | The daughter of a king and queen.
p | A bear | A big furry animal that loves honey.
p | An alien | A visitor from another planet.
p | A snail | A slow animal that carries its shell.
p | A baby | A very young child.
p | A pig in a puddle | A pig having fun in the mud.
p | A bumblebee | A fuzzy bee that buzzes.
p | A sleepy owl | A night bird who needs a nap.
p | Grandpa | Your mom's or dad's father.
t | A slice of pizza | A piece of cheesy pizza.
t | A rainbow | Colors in the sky after the rain.
t | Slime | Gooey, stretchy goo.
t | A rocket ship | A ship that flies to space.
t | Bubble gum | Chewy gum that blows bubbles.
t | A big pile of leaves | Leaves raked up to jump in.
t | Mud | Wet, squishy dirt.
t | Ice cream | A frozen sweet treat.
t | A smelly sock | A sock that really needs washing.
t | A bubble bath | A bath full of bubbles.
t | A trampoline | A bouncy mat to jump on.
t | A cupcake | A small cake just for one.
t | A teddy bear | A soft, cuddly toy bear.
t | Broccoli | A green vegetable that looks like a little tree.
t | A cardboard box | A plain brown box.
t | A sandcastle | A castle built of sand at the beach.
t | A balloon | A rubber ball filled with air.
t | A snowball | A ball made of snow.
t | A crown | A fancy hat for a king or queen.
t | A magic wand | A stick for doing magic.
t | A cookie | A sweet baked treat.
t | A worm | A wiggly creature in the dirt.
t | Spaghetti | Long noodles, often with sauce.
t | A big puddle | A pool of rainwater on the ground.
t | A whoopee cushion | A cushion that makes a funny noise.
t | Pajamas | Clothes you sleep in.
t | A volcano | A mountain that can erupt.
t | A wiggly tooth | A tooth that's about to fall out.
t | A hot dog | A sausage in a bun.
t | Sprinkles | Tiny colorful candy bits.
t | A pillow | A soft thing to rest your head on.
t | Glitter | Tiny sparkles.
t | A treasure chest | A box full of gold.
t | A tiny umbrella | An umbrella that's a little too small.
t | A banana peel | The slippery skin of a banana.
t | A slide | Playground fun that goes down.
t | Pancakes | Flat breakfast cakes.
t | A marshmallow | A soft, puffy sweet.
t | A castle | A big stone home for kings and queens.
e | A big burp | A loud noise from your tummy.
e | A tickle | A touch that makes you laugh.
e | A sneeze | Achoo!
e | Jumping in puddles | Splashing in rainwater.
e | A pillow fight | A playful fight with pillows.
e | A dance party | A party where everyone dances.
e | Snoring | A noisy sound while sleeping.
e | Hiccups | Hic! A funny little sound.
e | A water balloon fight | A fight with balloons full of water.
e | Blowing bubbles | Making bubbles float in the air.
e | A cartwheel | Flipping sideways on your hands.
e | Bath time | Time to get clean in the tub.
e | Bedtime | Time to go to sleep.
e | Recess | Playtime at school.
e | A sleepover | Spending the night at a friend's house.
e | Building a fort | Making a hideout with blankets.
e | A snow day | A day off school because of snow.
e | Making a funny face | Scrunching up your face to be silly.
e | A loud toot | An embarrassing noise from your bottom.
e | Dancing like a chicken | Flapping your arms and clucking.
`;

const EASY_R = `
Totally awkward | Something embarrassing and uncomfortable.
Epic fail | A mistake that goes really wrong.
The best day ever | A perfect day from start to finish.
What my parents don't know | A secret you keep from your folks.
Something in a teacher's desk | What's hiding in the teacher's drawer.
The worst school lunch | A cafeteria meal nobody wants.
My dream job | The job you'd love to have someday.
Most likely to go viral | Something everyone online would share.
Way too expensive | Something that costs much more than it should.
Why I didn't do my homework | Your excuse for having no homework.
Something that should be against the rules | A thing that needs a rule against it.
A survival kit for middle school | What you need to make it through.
The scariest thing at a sleepover | What spooks everyone after lights out.
Totally underrated | Something that deserves more love.
The worst thing to forget on a field trip | Something you'll miss when you're far from home.
A new school rule | A rule your school should add.
What my pet does when I'm at school | Your pet's secret daytime life.
Something that gets on my nerves | Something that really annoys you.
The best superpower | The power you'd pick if you could.
My villain name | What you'd be called as a bad guy.
Found in a haunted house | What's waiting in the creepy house.
Unbelievable | Too strange to believe.
The best way to spend a snow day | What to do when school's canceled.
Something that would make class more fun | An idea to liven up the classroom.
A new video game | A game someone should make.
Belongs in a museum | Something worth putting on display.
The worst chore | The job at home nobody wants.
Totally mysterious | Something nobody can explain.
Bad advice from a big sibling | Tips you shouldn't follow.
What I'd invent | A brand new invention.
The best thing about summer | Why summer is the best.
Ridiculous | Silly and hard to take seriously.
What happens at midnight | What goes on while everyone sleeps.
Super dramatic | Over-the-top and full of feelings.
A clue a detective would find | A hint left at the scene.
What I'll be famous for | The reason everyone will know your name.
`;

const EASY_I = `
p | The lunch lady | The person who serves school lunch.
p | A substitute teacher | A teacher filling in for the day.
p | My little cousin | A younger relative who follows you around.
p | A know-it-all | Someone who thinks they know everything.
p | A crossing guard | The person who helps kids cross the street.
p | A mad scientist | A scientist with wild experiments.
p | The school mascot | The costumed character at games.
p | A ninja | A sneaky, skilled fighter.
p | A zombie | A walking creature from monster stories.
p | A secret agent | A spy on a mission.
p | A golden retriever | A friendly, fluffy dog.
p | A talking parrot | A bird that repeats what you say.
p | A vampire | A night creature from scary stories.
p | A mummy | A wrapped-up figure from ancient tombs.
p | A gamer | Someone who loves playing video games.
p | A bodybuilder | Someone with huge muscles.
p | A cranky neighbor | A neighbor who yells "get off my lawn."
p | A babysitter | Someone who watches kids while parents are out.
p | A hamster escape artist | A pet who keeps getting out of its cage.
p | A wise old turtle | A slow animal full of advice.
p | A Bigfoot hunter | Someone searching for a legendary forest creature.
p | A drama kid | A student who loves the school play.
p | A goalie | The player who guards the net.
p | A raccoon | A masked animal that raids trash cans.
p | A lifeguard | Someone who keeps swimmers safe.
p | The principal | The person in charge of the school.
p | A pro skateboarder | An expert at skateboard tricks.
p | A sleepy sloth | A very slow animal that hangs from trees.
t | A pop quiz | A surprise test.
t | An oozing slime volcano | A science project that goes everywhere.
t | A whoopee cushion | A prank cushion that makes rude sounds.
t | Cafeteria meatloaf | A mysterious school lunch.
t | Braces | Wires that straighten teeth.
t | A locker that won't open | A stuck school locker.
t | A permission slip | A form your parent has to sign.
t | A participation trophy | A prize for joining in.
t | A broken pencil | A pencil that keeps snapping.
t | A secret diary | A journal for private thoughts.
t | A game controller | What you hold to play video games.
t | A skateboard | A board with wheels for tricks.
t | A tablet with a cracked screen | A device that's seen better days.
t | A hall pass | A note that lets you leave class.
t | Glow sticks | Sticks that light up after you snap them.
t | A treehouse | A clubhouse up in a tree.
t | Homework | Schoolwork you do at home.
t | A stink bomb | A prank that smells terrible.
t | A pet rock | A rock kept as a pet.
t | Hot sauce | A very spicy sauce.
t | Nachos | Chips with melted cheese.
t | A chocolate fountain | A tower of flowing chocolate.
t | A rubber band ball | A ball made of many rubber bands.
t | A lost retainer | The thing that keeps teeth straight, now missing.
t | An old cell phone | A phone from years ago.
t | A metal detector | A device that beeps near metal.
t | A creepy doll | A doll that might have moved by itself.
t | A friendship bracelet | A woven bracelet you give a friend.
t | A trampoline park | A place full of trampolines.
t | A walkie-talkie | A radio for talking to a friend nearby.
e | Falling asleep in class | Nodding off during a lesson.
e | Tripping in the hallway | Stumbling in front of everyone.
e | Laughing at the wrong time | Giggling when you should be quiet.
e | A group project | Schoolwork done as a team.
e | Forgetting your lines in the play | Blanking on stage.
e | Winning the spelling bee | Spelling every word right.
e | A surprise party | A party the guest of honor doesn't know about.
e | Getting caught passing notes | Being found sending a secret message.
e | Picture day | The day school photos are taken.
e | Sharing a bathroom with siblings | Waiting your turn every morning.
e | A field trip | A class trip outside school.
e | A dodgeball game | A game of throwing and dodging balls.
e | A dance-off | A dance contest.
e | Losing a tooth | When a baby tooth comes out.
e | A camping trip | Sleeping outdoors in a tent.
e | Getting grounded | Being told you can't go out.
e | A cannonball into the pool | A big splash.
e | A thunderstorm | Lightning, thunder, and rain.
e | A power outage | When all the lights go out.
e | Staying up past bedtime | Not going to sleep on time.
e | A sneeze attack | Sneezing again and again.
e | Being the new kid | Your first day at a new school.
c | The cafeteria | Where everyone eats lunch at school.
c | The principal's office | Where you go when you're in trouble.
c | Summer vacation | The long break from school.
c | The back seat of the car | Where kids sit on long rides.
c | A water park | A park with slides and pools.
c | The internet | A whole world of information online.
c | A haunted house | A spooky house with ghosts.
c | Friday afternoon | The best part of the school week.
`;

const D50 = `
t | Poodle skirts | Wide felt skirts with a poodle stitched on.
t | A jukebox | A coin machine that plays records.
t | Hula hoops | Plastic rings spun around the waist, a 1958 craze.
e | Rock 'n' roll | The new, loud music teens loved.
c | A drive-in movie | Watching a film from your car.
t | A milkshake at the soda fountain | A treat from the counter at the drugstore.
p | A greaser | A teen with slicked-back hair and a leather jacket.
t | Saddle shoes | Two-tone shoes worn with bobby socks.
t | A black-and-white TV | The family's brand new television set.
e | A sock hop | A school dance in your socks.
t | A Cadillac with tail fins | A big car with fins on the back.
c | The suburbs | New neighborhoods of matching houses.
t | A TV dinner | A frozen meal in a tray.
t | A coonskin cap | A fur hat made popular by TV frontier heroes.
e | Duck-and-cover drills | School safety drills from the Cold War.
t | A transistor radio | A small radio you could carry anywhere.
p | An Elvis impersonator | Someone dressed as the king of rock 'n' roll.
t | A Slinky | A spring toy that walks down the stairs.
t | Silly Putty | Stretchy putty that bounces and copies comics.
e | The bunny hop | A line dance with lots of hops.
c | The start of the space race | The contest to get into space first.
t | The milkman's delivery | Fresh milk brought right to your door.
t | Bobby socks | White ankle socks worn by teens.
t | A rotary phone | A phone with a dial you spin.
t | A Frisbee | A plastic flying disc.
e | Cruising the strip | Driving slowly down Main Street to show off your car.
t | A booth at the malt shop | Where teens hung out after school.
p | A beatnik poet | A poet in a beret who snaps instead of clapping.
t | Hair pomade | Grease for slicking hair back.
t | 3-D movie glasses | Cardboard glasses with red and blue lenses.
p | A carhop on roller skates | A server who skates food out to your car.
t | Mr. Potato Head | A toy potato with face parts you stick in.
t | A pink flamingo lawn ornament | A plastic bird for the front yard.
t | A cherry cola from the counter | A soda with a shot of cherry syrup.
c | A moody teen rebel | The cool, misunderstood teenager of the movies.
e | Staring at the TV test pattern | Waiting for the shows to start.
`;

const D60 = `
t | A lava lamp | A lamp with floating blobs, invented in 1963.
p | A hippie | A peace-loving free spirit.
t | Tie-dye shirts | Shirts dyed in swirls of color.
e | The moon landing | Astronauts walked on the moon in 1969.
t | Go-go boots | Shiny, knee-high boots.
t | A VW bus | A boxy van loved by road trippers.
e | The twist | A dance where you twist your hips.
t | Bell-bottoms | Pants that flare out at the bottom.
c | Woodstock | A giant outdoor music festival in 1969.
t | Peace signs | The symbol for peace, everywhere.
t | A beehive hairdo | Hair piled high like a beehive.
p | A beach surfer | A sun-tanned wave rider.
t | An Etch A Sketch | A drawing toy with two knobs.
e | Beatlemania | Screaming fans of the Beatles.
c | Flower power | Using flowers as a symbol of peace.
t | Troll dolls | Little dolls with wild, bright hair.
t | A Spirograph | A drawing toy for making swirly patterns.
e | The space race | The race to reach the moon.
t | Go-karts | Small racing cars.
t | Twister | A party game that ties you in knots.
t | Mini skirts | Short skirts that shocked the grown-ups.
p | A secret agent with gadgets | Spy movies were huge in the 60s.
e | A sit-in | A peaceful protest by sitting down.
t | Psychedelic posters | Wild, swirly, colorful art.
t | An 8-track tape | A music cartridge for the car.
t | Hot Wheels cars | Small, fast toy cars, first sold in 1968.
c | Mod fashion | Bold shapes, bright colors, and sharp haircuts.
t | An instant camera | A camera that prints the photo right away.
e | The mashed potato | A popular 60s dance with shuffling feet.
t | A fondue pot | A pot of melted cheese for dipping.
t | A wood-paneled surf wagon | A station wagon for hauling surfboards.
t | Sea-Monkeys | Tiny brine shrimp sold as pets.
t | Love beads | Strings of colorful beads.
c | Far out! | 60s slang for amazing.
t | The lunar module | The spacecraft that landed on the moon.
p | A go-go dancer | A dancer in a cage at the discotheque.
`;

const D70 = `
e | Disco | Dance music with a big beat and mirror balls.
t | A pet rock | A rock in a box, sold as a pet in 1975.
t | Mood rings | Rings that change color with your "mood."
t | Platform shoes | Shoes with very thick soles.
t | A disco ball | A mirrored ball that sparkles.
t | Roller skates | Four-wheeled skates for the rink.
t | Shag carpet | Long, fluffy carpet.
t | A leisure suit | A casual polyester suit.
t | A CB radio | A radio truckers used to chat ("10-4, good buddy").
t | An afro pick | A comb for big, beautiful hair.
t | Pong | One of the first home video games.
t | An 8-track player | A tape player for music cartridges.
t | Smiley face stickers | The yellow smiley face, everywhere.
t | A bean bag chair | A squishy chair filled with beads.
e | The hustle | A popular disco line dance.
t | Avocado-green appliances | The kitchen color of the decade.
t | Pop Rocks | Candy that crackles in your mouth.
t | An Atari | An early game console from 1977.
e | Roller disco | Skating to disco music.
t | Bell-bottom jeans | Super-flared jeans.
t | Feathered hair | The big, swooping hairstyle of the 70s.
p | A disco king | A dancer in a white suit.
t | A wood-paneled station wagon | The family car.
t | Striped tube socks | Long socks pulled up to the knees.
t | A Big Wheel | A plastic tricycle that roared down sidewalks.
c | Groovy | 70s slang for cool.
t | A macramé plant hanger | Knotted string holding a plant.
t | The first Walkman | A portable cassette player, 1979.
e | Waiting in the gas line | Long lines for fuel during the shortage.
t | Space-movie action figures | Toys from the big 1977 space movie.
t | A pinball machine | An arcade game with flippers.
t | Tang | An orange drink powder linked to astronauts.
e | Saturday morning cartoons | Kids glued to the TV.
c | The Bicentennial | America's 200th birthday in 1976.
t | A Stretch Armstrong | A rubbery action figure you could pull to four times his size.
t | A Lite-Brite | A glowing toy where you push colored pegs into a light board.
`;

const D80 = `
t | A Rubik's Cube | A twisty puzzle cube.
t | Leg warmers | Knit tubes worn over the legs.
t | A boombox | A big portable stereo.
t | Big hair | Hair teased high with lots of hairspray.
t | A Walkman | A portable cassette player.
e | Breakdancing | Dancing with spins on the floor.
t | Parachute pants | Shiny, baggy pants.
t | Pac-Man | A yellow arcade hero who eats dots.
t | A mixtape | A cassette of hand-picked songs.
t | Shoulder pads | Pads that made shoulders huge.
t | Neon everything | Bright, glowing colors.
p | A valley girl | A teen saying "like, totally."
t | A mullet | Business in front, party in the back.
t | Cabbage Patch Kids | Dolls that caused shopping stampedes.
t | A VCR | A machine to record and play videotapes.
t | Jelly shoes | Plastic shoes in candy colors.
e | Aerobics in a leotard | Workout videos full of energy.
t | A Trapper Keeper | A school binder with a snap.
t | Scrunchies | Fabric hair ties.
t | A Nintendo | The home game console that saved video games.
t | A car phone | A phone mounted in a car.
t | A jacket with a strap at the collar | The must-have jacket of the decade.
e | Moonwalking | Gliding backward while looking like you walk forward.
t | A talking teddy bear | A bear with a tape player inside.
t | An arcade token | A coin for the arcade.
t | Gross-out trading cards | Sticker cards meant to make you say "ew."
c | Totally tubular | 80s slang for awesome.
t | Swatch watches | Colorful plastic watches.
t | Acid-wash jeans | Jeans with a speckled, faded look.
c | The video rental store | Where you rented movies for the weekend.
t | A Speak & Spell | A talking toy that teaches spelling.
t | A friendly movie alien | The little visitor from a 1982 movie who wanted to phone home.
t | A hair crimper | A tool for zig-zag hair.
t | A keytar | A keyboard worn like a guitar.
t | Care Bears | Colorful bears with pictures on their tummies.
t | A Commodore 64 | A popular early home computer.
`;

const D90 = `
t | A Tamagotchi | A digital pet on a keychain.
t | Dial-up internet | Screechy internet over the phone line.
t | Slap bracelets | Bracelets that snap around your wrist.
t | A pager | A device that beeps with a number to call.
t | Butterfly clips | Tiny clips for your hair.
t | Pogs | Cardboard discs for a slamming game.
t | Beanie Babies | Small beanbag animals people collected.
t | A Discman | A portable CD player.
t | Frosted tips | Spiky hair with bleached ends.
t | A Furby | A chatty, owl-like robot toy.
e | The Macarena | A 1996 dance everyone learned.
e | Y2K panic | The fear computers would crash in the year 2000.
t | A Game Boy | A handheld game system.
t | Overalls with one strap down | A classic look.
t | Rainbow animal folders | Bright school supplies with dolphins and leopards.
t | A brick cell phone | A tough early cell phone you could never break.
t | Gak | A squishy slime toy.
t | Bucket hats | Floppy hats.
t | A choker necklace | A stretchy necklace that looks like a tattoo.
t | Hypercolor shirts | Shirts that change color with heat.
t | Crystal Pepsi | A clear cola from 1992.
t | A movie rental card | A card for renting movies on Friday night.
t | Zip-off cargo pants | Pants that turn into shorts.
e | "You've got mail!" | The sound of a new email.
t | Floppy disks | Square disks for saving files.
t | Tickle Me Elmo | A giggling toy that caused shopping frenzies.
t | Lunchables | Build-your-own snack packs.
e | Rollerblading | Skating on inline wheels.
t | A boy band poster | A poster of five singing heartthrobs.
c | As if! | 90s slang for "no way."
t | Bubble letters | Puffy handwriting on every notebook.
t | Magic Eye pictures | Hidden 3-D images.
t | A Super Soaker | A huge water blaster.
t | Inflatable furniture | Blow-up chairs.
t | Super-wide jeans | Jeans so wide you could hide in them.
t | A screensaver of flying toasters | The computer's sleepy show.
`;

function recipes(text) {
  return text.trim().split('\n').map(l => { const [t, d] = l.split('|').map(s => s.trim()); return { t, d }; });
}
function ingredients(text) {
  return text.trim().split('\n').map(l => { const [k, t, d] = l.split('|').map(s => s.trim()); return { k, t, d }; });
}

// key: { name, group, recipes, ingredients }
export const DECKS = {
  e2026: { name: '2026 Edition', group: 'edition', recipes: recipes(E2026_R), ingredients: ingredients(E2026_I) },
  silly: { name: 'Simply Silly (ages 6–9)', group: 'edition', recipes: recipes(SILLY_R), ingredients: ingredients(SILLY_I) },
  easy: { name: 'Easy Peasy (ages 10–12)', group: 'edition', recipes: recipes(EASY_R), ingredients: ingredients(EASY_I) },
  d50: { name: "'50s", group: 'decade', recipes: [], ingredients: ingredients(D50) },
  d60: { name: "'60s", group: 'decade', recipes: [], ingredients: ingredients(D60) },
  d70: { name: "'70s", group: 'decade', recipes: [], ingredients: ingredients(D70) },
  d80: { name: "'80s", group: 'decade', recipes: [], ingredients: ingredients(D80) },
  d90: { name: "'90s", group: 'decade', recipes: [], ingredients: ingredients(D90) },
};
