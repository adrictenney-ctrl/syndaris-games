"""Reference scorer for the Chef's Kiss deck files (pass 3 + Crew tag-review fixes, 18 Nov 2026 evening).
Standalone: needs only Python 3 and the deck JSON files in ./decks.
Reproduces the acceptance numbers: average good answers per hand (of the 4 matched cards),
share of hands with 2+ good answers, and count of weak Recipes (< 1 good answer per hand).
Usage: python3 score_decks.py [decks_dir]"""
import json,math,sys,os
W={'subject':1.0,'tone':1.5,'scale':1.0,'register':1.0,'violation':1.0,'status':1.0}
def ov(t,g): return sum(W[a]*len(set(t.get(a,[]))&set(g.get(a,[]))) for a in W)
def fits(rt,it): return 'any' in rt or bool(set(rt)&set(it))
def score(r,c):  # same formula as the dealer's funnyScore (no jitter, no freshness)
    return 2*max([ov(c['tags'],cb) for cb in r['funnyTargetCombos']] or [0]) - 1.5*ov(c['tags'],r.get('literalTags',{}))
def ok(r,c):     # a "good answer": right answer form and not a plain literal fit
    return fits(r['answerTypes'],c['answerTypes']) and ov(c['tags'],r.get('literalTags',{}))<2
def per_hand(r,pool):
    # The 4 matched cards are drawn from the top T cards by score (T = max(12, pool/4)); ties shared fairly.
    T=max(12,math.ceil(len(pool)/4)); s={c['id']:score(r,c) for c in pool}
    v=sorted(s.values(),reverse=True)[T-1]
    gt=[c for c in pool if s[c['id']]>v]; eq=[c for c in pool if s[c['id']]==v]
    g=sum(ok(r,c) for c in gt)+sum(ok(r,c) for c in eq)*(T-len(gt))/len(eq)
    return 4*g/T
def p2(h): p=h/4; return 1-(1-p)**4-4*p*(1-p)**3
def metric(R,pool):
    v={r['id']:per_hand(r,pool) for r in R}; x=list(v.values())
    return dict(avg_good_per_hand=round(sum(x)/len(x),3),hands_2plus=f"{100*sum(map(p2,x))/len(x):.1f}%",weak_recipes=sum(y<1 for y in x)),v
if __name__=='__main__':
    D=sys.argv[1] if len(sys.argv)>1 else os.path.join(os.path.dirname(os.path.abspath(__file__)),'decks')
    for lvl in ['mild','medium','hot']:
        b=json.load(open(f'{D}/{lvl}_base.json')); e=json.load(open(f'{D}/{lvl}_expansion1.json'))
        for name,R,P in [('base',b['recipes'],b['ingredients']),('expansion alone',e['recipes'],e['ingredients']),('base + expansion',b['recipes']+e['recipes'],b['ingredients']+e['ingredients'])]:
            m,v=metric(R,P); low=sorted(v.items(),key=lambda kv:kv[1])[:3]
            print(f"{lvl:6} {name:17} {m}  lowest: {[(k,round(x,2)) for k,x in low]}")
