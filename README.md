## Description
This project is created mostly by AI prompts in an effort to understand the advantages and challenges of using prompts for AI for software development.
The code was developed using OpenAi's o4-mini reasoning model.
This page mainly looks at some Adblock Plus filters and uses Anthropic's Claude 3.7 model API to explain the ABP filter in plain english.

## 2 takeaways or first impressions.
### Good
Programming/Coding output from LLM is pretty good, but in small doses. Developers still need to plan the approach and execute the plan in steps (atleast for now)

### Bad
Sometimes the code output lacked consistency, minor mistakes can go under the radar because roughly 95% of times the output code is correct. 


https://github.com/user-attachments/assets/134b265b-7758-499f-95af-aea54d5269b9

## Input to Anthropic
 @@ -110,7 +110,8 @@ ebay.com#$#hide-if-contains-visible-text /Sponsored/ 'div[data-testid="x-pda-pla
 ebay.com#$#hide-if-contains-visible-text /Sponsored/ 'div[id*="placement_"]>div' 'div[data-viewport]>span>div[aria-labelledby]>div[aria-hidden]'
 
 ! ta
ebay.*#$#override-property-read inlineScriptEle undefined; hide-if-matches-xpath './/button[contains(@aria-controls,"@container]-2-overlay")][@aria-expanded]/parent::span/ancestor::div[@id][contains(@style,"144px")]';
ebay.*#$#override-property-read Symbol.for noopFunc false;
 
 ! cp
 ebay.*#$#hide-if-contains-visible-text /(S*p*o*n*s*o*r*e*d|A*n*z*e*i*g*e|S*p*o*n*s*o*r*i*s*é|P*a*t*r*o*c*i*n*a*d*o|S*p*o*n*s*o*r*i*z*z*a*t*o)/ 'li[class*="brwrvr__item-card"]' 'div[class="su-component su-sponsored-label"] > span[class="su-sponsored-label__sep"] > span[aria-labelledby][role="text"]'
 
## Output from Anthropic

# Explanation of the eBay Adblock Plus Filter Rules

This appears to be a Git diff showing a change to an adblock filter file (line 110 being replaced with lines 110-111). Let me explain the filter rules:

## The Changed Rule:
```
ebay.*#$#override-property-read inlineScriptEle undefined; hide-if-matches-xpath './/button[contains(@aria-controls,"@container]-2-overlay")][@aria-expanded]/parent::span/ancestor::div[@id][contains(@style,"144px")]';
```

This rule has two components combined with a semicolon:

1. `override-property-read inlineScriptEle undefined` - This prevents eBay's script from accessing a property called `inlineScriptEle` by setting it to `undefined`, likely disabling some anti-adblock functionality.

2. `hide-if-matches-xpath './/button[contains(@aria-controls,"@container]-2-overlay")][@aria-expanded]/parent::span/ancestor::div[@id][contains(@style,"144px")]'` - Uses XPath to identify and hide sponsored content containers that have specific characteristics:
   - Looking for buttons with aria-controls containing "@container]-2-overlay"
   - That have an aria-expanded attribute
   - Then navigating up to find their containing div that has an ID and a style containing "144px"

## The Added Rule:
```
ebay.*#$#override-property-read Symbol.for noopFunc false;
```

This rule prevents eBay's scripts from using `Symbol.for` by overriding it with a value of `false`. This is a more robust approach to prevent anti-adblock detection, as `Symbol.for` is often used in sophisticated scripts to check for tampering or to create unique identifiers for tracking.

## The Context:
Both rules target all eBay domains (`ebay.*`) and use the `#$#` syntax for scriptlet/extended hiding rules. The surrounding rules suggest this is part of a section targeting eBay's sponsored content across different parts of the site, with different strategies for different page layouts.

The change likely represents an improvement to block newer or modified advertising techniques on eBay.

## Bonus
### Explanation by Open AI's o4-mini
Below is a line-by-line “decoder ring” for the two ABP snippet-filter rules you posted.  I’ll move from left-to-right, explaining each token and why the snippet helps on eBay pages.

⸻

1️⃣ Rule #1

ebay.*#$#override-property-read inlineScriptEle undefined; 
        hide-if-matches-xpath './/button[contains(@aria-controls,"@container]-2-overlay")][@aria-expanded]/parent::span/ancestor::div[@id][contains(@style,"144px")]';

Piece	What it does	Why it matters
ebay.*	Domain part of the filter. The plain wildcard * after the dot means “match every eBay TLD” – ebay.com, ebay.co.uk, ebay.de, etc.	
#$#	Signals that what follows is a snippet filter (i.e., run JavaScript helpers from ABP’s library instead of ordinary CSS hiding)  ￼	
override-property-read inlineScriptEle undefined	Uses the override-property-read snippet to intercept reads of window.inlineScriptEle and make them return undefined.  The value keyword undefined is one of the built-in override constants that ABP accepts  ￼.Effect: if eBay relies on that global to inject or track inline ads, the stubbed value prevents the code from running correctly (harmlessly “defanging” it).	
;	You can chain multiple snippets in one rule; a semicolon separates them  ￼.	
hide-if-matches-xpath '…'	A conditional-hiding snippet: it attaches a MutationObserver and hides any element that matches the XPath expression you supply  ￼.	
The XPath string'.//button[contains(@aria-controls,"@container]-2-overlay")][@aria-expanded]/parent::span/ancestor::div[@id][contains(@style,"144px")]'	◾ Find any <button> whose aria-controls attribute contains the marker text @container]-2-overlay and which has an aria-expanded attribute (only the little toggle buttons that open eBay’s overlay menus fit).◾ Step to that button’s parent <span>.◾ Ascend to the nearest ancestor <div> that has an id and whose inline style attribute contains “144px” (that’s the fixed-height overlay frame).◾ Hide that div – the entire sticky overlay disappears.	

Net result: on every eBay site the filter (a) neutralises a helper global scripts might probe for and (b) surgically removes the floating overlay container that the toggle button would open.

⸻

2️⃣ Rule #2

ebay.*#$#override-property-read Symbol.for noopFunc false;

Piece	Meaning
ebay.*#$#	Same domain + snippet prefix as above.
override-property-read Symbol.for noopFunc false	• Targets the built-in Symbol.for method.• Replaces it with noopFunc – a predefined value meaning “a function with an empty body”  ￼. Any page script that calls Symbol.for() now gets nothing useful back.• The trailing false sets configurable:false, making the new stub immutable so page code cannot restore the original function.

Why stub Symbol.for?  Some anti-adblock or tracking scripts use the global symbol registry (Symbol.for(…)) as a covert channel to store or read flags.  By turning the method into a no-op ABP prevents that channel from working and eliminates a point of detection.

⸻

Take-aways
	•	override-property-read is for breaking JavaScript capabilities that ad/anti-adblock code depends on; you choose what value to feed back (undefined, noopFunc, false, numbers, etc.).
	•	hide-if-matches-xpath is for hiding DOM elements when CSS selectors are too limited – XPath lets you follow relationships like “this button’s ancestor div”.
	•	Both snippets run after the HTML is parsed and keep watching for mutations, so dynamically inserted overlays & scripts are still caught.

Feel free to ask if you’d like to tweak the XPath or see live-testing tips!


