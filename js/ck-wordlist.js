// Chef's Kiss customizable cards: the family-friendly word list (customizable cards spec, section 7).
// Any player-written card, and any "Add salt and pepper" option, that contains one of these whole
// words (or a simple plural) is rejected at every level. Add to this list; keep it lower case.
export const FAMILY_BLOCKED_WORDS = [
  // profanity and crude words
  'damn', 'dammit', 'hell', 'crap', 'crappy', 'piss', 'pissed', 'shit', 'shitty', 'bullshit', 'fuck', 'fucking', 'fucked', 'motherfucker',
  'bitch', 'bastard', 'ass', 'asshole', 'arse', 'dick', 'dickhead', 'cock', 'prick', 'pussy', 'twat', 'wanker', 'bollocks', 'bugger',
  'slut', 'whore', 'skank', 'douche', 'douchebag', 'jackass', 'dumbass', 'butthole', 'boob', 'boobs', 'tits', 'titties', 'nipple',
  // sexual content
  'sex', 'sexy', 'sexual', 'porn', 'porno', 'nude', 'naked', 'horny', 'orgasm', 'condom', 'erection', 'stripper', 'strip club',
  'hooker', 'hookup', 'make out', 'making out', 'one night stand', 'thong', 'lingerie', 'viagra',
  // drugs, alcohol and smoking
  'drunk', 'beer', 'vodka', 'whiskey', 'tequila', 'booze', 'hangover', 'weed', 'marijuana', 'stoned', 'high af',
  'cocaine', 'meth', 'heroin', 'drugs', 'bong', 'vape', 'vaping', 'cigarette', 'cigarettes', 'smoking',
  // violence and self-harm
  'kill', 'killing', 'killed', 'murder', 'suicide', 'gun', 'guns', 'shoot', 'shooting', 'stab', 'stabbing', 'blood', 'bloody', 'gore',
  'rape', 'abuse', 'torture', 'bomb', 'terrorist', 'dead body', 'corpse',
  // insults and slurs (punching down is never allowed)
  'stupid', 'idiot', 'moron', 'retard', 'retarded', 'loser', 'ugly', 'fatso', 'fat ass', 'dumb', 'freak', 'psycho',
  'hate', 'shut up',
];
