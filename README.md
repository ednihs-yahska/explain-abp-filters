## Description
This project is created mostly by AI prompts in an effort to understand the advantages and challenges of using prompts for AI for software development.
The code was developed using OpenAi's o4-mini reasoning model.
This page mainly looks at some Adblock Plus filters and uses Anthropic's Claude 3.7 model API to explain the ABP filter in plain english.

## 2 Major takeaways or first impressions.
### Good
Programming/Coding seems to be easy for AI, but in small doses. Developers still need to plan the approach and execute the plan in steps (atleast for now)

### Bad
Sometimes the code output lacked consistency, minor mistakes can go under the radar because 95% of output code just works. 


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
