# DIR (ድር) THE FOUNDATION — Premium Fashion Storefront Redesign Specification

## Purpose

Redesign the existing storefront into a **genuinely premium fashion ecommerce experience** using the existing application as the source of truth for business logic and the Rumusha clothing-store project as an engineering/reference foundation.

The visual and UX direction should combine the strongest characteristics of:

- PrettyLittleThing — commercial fashion merchandising, strong category discovery, campaign-led commerce
- Oh Polly — premium product presentation and fashion imagery
- MESHKI — elevated, refined editorial commerce
- White Fox — contemporary, social/trend-led fashion retail
- Princess Polly — fashion-first ecommerce usability
- House of CB — luxury-adjacent visual refinement
- REVOLVE — sophisticated editorial merchandising
- ASOS — scalable ecommerce UX, filtering, search and product discovery
- Rumusha — reusable component architecture, product interactions, responsive implementation and subtle motion

This is **not** a request to clone another brand.

The result must be an original DIR (ድር) THE FOUNDATION storefront using those design principles.

---

# 1. NON-NEGOTIABLE QUALITY BAR

## EVERYTHING MUST FEEL PREMIUM

This is the single most important requirement.

Do not stop at:

- "modern"
- "clean"
- "responsive"
- "nice looking"
- "professional"

Those are not sufficient.

The finished interface must feel like a **real, established, premium fashion retailer with a serious design and engineering budget**.

The final result must communicate:

> premium fashion  
> editorial confidence  
> excellent photography  
> refined typography  
> high-quality materials  
> intentional composition  
> sophisticated ecommerce  
> polished interactions  
> effortless shopping

The application must **never** feel like:

- AI-generated UI
- AI Slop
- generic ecommerce template
- SaaS dashboard
- startup landing page
- developer portfolio
- design-system showcase
- generic Tailwind template
- glassmorphism demo
- excessive shadcn-style UI
- "Dribbble concept"
- component-library showcase

Every visual decision must serve the fashion brand.

---

# 2. BRAND

## Brand Name

The company/brand is:

**DIR (ድር) THE FOUNDATION**

Preserve the exact brand name.

Use the correct Ethiopian/Amharic text:

**ድር**

Do not transliterate it incorrectly.

## Existing Logo

The company already has a good logo.

**Use the existing official DIR (ድር) THE FOUNDATION logo.**

Do NOT redesign the logo.

Do NOT generate a replacement logo.

Do NOT create an AI-generated logo.

Do NOT place the logo inside a generic rounded container.

The logo should be treated as a premium brand asset.

Inspect the existing project for:

- SVG logo
- PNG logo
- WebP logo
- light logo
- dark logo
- favicon
- alternate logo marks

Use the highest-quality appropriate version.

If multiple logo variants exist, choose based on background contrast.

The logo should receive appropriate negative space and should not be crowded by the navigation.

---

# 3. BUSINESS CATALOG CONSTRAINT

The store is intentionally focused.

It does **not** have a huge fashion catalog.

There are only:

- **two clothing types**
- products are available for **women**
- products are available for **men**
- products are available for **children**

This is a critical business constraint.

Do NOT invent dozens of categories just because large fashion retailers have them.

Do NOT imitate the enormous navigation architecture of PLT literally.

The website should feel premium through:

- art direction
- photography
- typography
- spacing
- product presentation
- content hierarchy
- motion
- usability

—not through a huge number of fake categories.

## Navigation should remain simple and premium

Use the real categories from the existing backend.

Possible high-level structure:

- New In
- Women
- Men
- Kids
- Category 1
- Category 2
- Collections / Featured
- Sale

Only show items that actually exist in the application.

If the existing store has exact category names, use those names.

Do not create fake taxonomy.

---

# 4. PRIMARY DESIGN REFERENCES

## PrettyLittleThing

Use PLT primarily for:

- commercial fashion composition
- fashion-first product merchandising
- category discovery
- editorial shopping
- product grids
- promotional hierarchy
- typography proportions
- strong image dominance
- desktop/mobile commerce patterns

Do not copy:

- logo
- exact text
- proprietary assets
- exact page implementation

## Oh Polly

Use for:

- premium fashion imagery
- product card refinement
- editorial layout
- campaign presentation
- high-quality ecommerce composition

## MESHKI

Use for:

- luxury refinement
- restrained spacing
- sophisticated product presentation
- editorial storytelling

## House of CB

Use for:

- elegant visual hierarchy
- luxury-adjacent presentation
- refined typography
- high-fashion campaign feel

## White Fox / Princess Polly

Use for:

- youth-oriented fashion commerce
- social merchandising
- trend-led product presentation

## REVOLVE

Use for:

- editorial commerce
- curated collections
- premium merchandising

## ASOS

Use for:

- search
- filters
- sorting
- product detail UX
- responsive commerce usability

## Fashion Nova

Use for:

- efficient product discovery
- conversion-oriented merchandising
- practical ecommerce interaction patterns

## Rumusha

Use primarily for:

- component structure
- responsive architecture
- image hover/crossfade behavior
- product-card interaction patterns
- Framer Motion patterns
- Swiper/carousel patterns
- responsive image loading
- accessibility
- SEO
- reusable ecommerce components

Do not copy Rumusha branding or content.

---

# 5. THE CORE VISUAL DIRECTION

The target style is:

**PLT commercial fashion**
+
**Oh Polly premium presentation**
+
**MESHKI refinement**
+
**House of CB luxury restraint**
+
**REVOLVE editorial merchandising**
+
**Rumusha component engineering**

The result should feel:

- fashion editorial
- contemporary
- confident
- minimal but not empty
- rich but not cluttered
- commercial but not cheap
- premium but not sterile

---

# 6. TYPOGRAPHY — IMPORTANT

## Do NOT simply use the default Rumusha typography

The typography needs to be intentionally different from the original Rumusha design.

The typography should have a visual character **in the same general family of contemporary fashion retailers such as PLT**, while remaining original and using legally available fonts.

Do not claim to use the exact proprietary PLT typeface unless it is publicly documented and legally available.

## Typography strategy

Use a **fashion-oriented sans-serif** as the primary interface typeface.

Optional:
Use a refined editorial display face for selected hero/editorial headlines.

The primary sans-serif should feel:

- clean
- slightly editorial
- contemporary
- confident
- premium
- compact
- highly legible
- slightly fashion-magazine-like

Avoid generic:

- Inter everywhere
- Roboto everywhere
- Arial everywhere
- system-ui everywhere

unless the existing brand system explicitly requires it.

Prefer a high-quality font with character.

Possible classes of fonts to evaluate:

- Helvetica Neue-like contemporary neo-grotesk alternatives
- Avenir-like geometric/humanist alternatives
- modern condensed fashion sans
- high-quality open/licensed contemporary retail sans

Inspect the available project fonts first.

Choose **one primary sans-serif** that feels branded.

Do not use five different fonts.

## Optional display font

A tasteful serif/display font may be used for:

- major campaign headlines
- selected editorial section headings
- brand storytelling

Do not use it for:

- navigation
- product names
- product prices
- filters
- buttons
- checkout
- utility UI

## Suggested hierarchy

These are starting ranges, not absolute values.

### Hero display

Desktop:
56–84px

Tablet:
42–60px

Mobile:
32–44px

### Section title

Desktop:
28–42px

Tablet:
24–34px

Mobile:
22–28px

### Product title

12–14px

### Price

12–15px

### Navigation

11–13px

### Utility labels

10–12px

The final font sizes must be visually balanced rather than blindly following these numbers.

## Letter spacing

Use tighter tracking for:

- large headlines
- brand moments

Use slightly wider tracking for:

- uppercase navigation
- product metadata
- small labels

Avoid excessive letter spacing.

---

# 7. COLOR DIRECTION

The brand should be driven primarily by:

- black
- white
- warm white
- soft neutral gray
- charcoal
- one controlled brand accent if present

Avoid colorful UI components.

Do not introduce:

- neon gradients
- purple/blue SaaS gradients
- rainbow accents
- decorative color blobs

Campaign photography should provide most of the visual richness.

Create centralized design tokens.

Example:

```css
--color-background
--color-surface
--color-text
--color-muted
--color-border
--color-accent
--color-sale
--color-overlay
```

Use the actual DIR brand colors if they already exist.

---

# 8. SHAPE LANGUAGE

Premium fashion retail should use **restrained geometry**.

Prefer:

- square corners
- 2px radius
- 4px radius
- 6px radius

Occasionally:
8px where justified.

Avoid:

- huge rounded cards
- `rounded-2xl`
- `rounded-3xl`
- pill-shaped everything

Do not make every control look like a floating mobile app chip.

---

# 9. SHADOWS

Use shadows very sparingly.

Good use:

- dropdown
- modal
- navigation drawer

Avoid:

- shadows around every card
- shadows under every image
- shadows on every button

The richness should come from:

- photography
- spacing
- typography
- composition

---

# 10. HEADER

The header should feel like a real fashion brand.

## Desktop

Suggested structure:

PROMO BAR
↓
MAIN HEADER
↓
CATEGORY NAVIGATION

### Main header

Left:
DIR logo

Center:
fashion navigation

Right:
search
account
cart/bag

If wishlist is not currently supported, do NOT add a wishlist icon just for appearance.

The current store does not have wishlist functionality.

The main header must not imply functionality that doesn't exist.

## Mobile

Use:

menu
logo
search
cart/bag

Do not cram desktop navigation into mobile.

Create an intentional mobile navigation drawer.

---

# 11. MOBILE NAVIGATION

The mobile menu should be a premium full-screen or large slide-over drawer.

Organize actual catalog navigation.

Potential structure:

NEW IN

WOMEN

MEN

KIDS

CATEGORY 1

CATEGORY 2

COLLECTIONS

SALE

Only expose real categories.

Use typography and spacing instead of colored cards.

---

# 12. MEGA MENU

Because the catalog is small, the mega menu must remain restrained.

Do not create an enormous department-store mega menu.

Use:

- category columns
- new-in links
- featured links
- one editorial image if appropriate

Keep it elegant.

---

# 13. HOMEPAGE STRUCTURE

The homepage should tell a fashion story.

Suggested structure:

1. Announcement/promotion strip
2. Premium header
3. Full-width hero campaign
4. New In
5. Category image tiles
6. Featured products
7. Editorial campaign section
8. More products / best sellers
9. Shop the look / styled collection
10. Brand story
11. Social/campaign gallery
12. Newsletter
13. Footer

This structure can be adapted to the available assets.

---

# 14. HERO

The hero must NOT feel like a SaaS landing page.

No centered gradient.

No abstract illustration.

No floating cards.

No giant rounded container.

Use:

**large high-quality fashion image/video**

Prefer full-width.

Desktop:
approximately 70–90vh depending on composition.

Mobile:
approximately 65–85vh depending on image.

Hero composition:

small eyebrow
large editorial headline
short supporting line
CTA

Example structure:

```text
NEW COLLECTION

THE NEW STANDARD

Discover the latest DIR collection.

SHOP NOW
```

Use actual brand copy where available.

---

# 15. PRODUCT CARDS — VERY IMPORTANT

The product card is one of the most important UI elements.

It must feel like:

**fashion merchandising**

not:

**generic ecommerce component**

## Basic structure

```text
[PRODUCT IMAGE]

wishlist / utility control
optional badge

PRODUCT NAME
short descriptor / variant info
PRICE
optional sale/original price
```

The image dominates the card.

The card itself should have nearly no visible container.

Avoid:

- large card borders
- giant card shadows
- rounded card background
- oversized permanent buttons

---

# 16. PRODUCT IMAGE RATIO

Prefer:

3:4
or
4:5

depending on the actual product photography.

The image should be large.

Maintain consistent ratios across the product grid.

Avoid inconsistent image heights.

---

# 17. PRODUCT IMAGE HOVER

Use Rumusha-style image interaction where product data contains multiple images.

Desktop:

default = primary product image

hover:

crossfade to secondary product image

Animation:
180–300ms

Do not zoom aggressively.

Do not distort the model/product.

Mobile:

do not depend on hover.

Use:

- swipe
- gallery
- quick-view
- product page gallery

as appropriate.

---

# 18. PRODUCT CARD WISHLIST — DO NOT ADD FAKE FUNCTIONALITY

The existing storefront **does not currently have a wishlist feature**.

Therefore:

### Default implementation

Do NOT add a wishlist icon unless there is a real backend/state implementation behind it.

Never display an apparently clickable heart that does nothing.

Never create fake wishlist state.

### Optional implementation

Wishlist may be added as a future/optional feature only if it is implemented properly.

If adding wishlist:

- database persistence
- authenticated user state
- add/remove API
- product-level state
- guest behavior if desired
- wishlist page/drawer
- count synchronization
- accessible labels
- loading states
- empty state

But wishlist is NOT required for the initial redesign.

A complete, honest product card is more premium than fake functionality.

---

# 19. PRODUCT BADGES

Only use real business information.

Allowed:

NEW
SALE
BESTSELLER
BACK IN STOCK
LOW STOCK

Do not fabricate these statuses.

Keep badges small and restrained.

No giant colorful pills.

---

# 20. QUICK ADD

Optional.

If implemented, use:

desktop hover
↓
small "QUICK ADD"
↓
size/variant selection
↓
add to cart

Never show giant "ADD TO CART" buttons beneath every product.

If quick add complicates the existing architecture, prioritize the product card and product page instead.

---

# 21. PRODUCT CARD TYPOGRAPHY

Example:

```text
DIR SIGNATURE TOP
Relaxed cotton fit

$49.00
```

or:

```text
DIR CLASSIC SET
2-piece everyday essential

$79.00   $99.00
```

Product names:
12–14px

Descriptors:
10–12px muted

Prices:
12–15px medium

Sale:
current price strong
original price muted/struck through

Do not over-format.

---

# 22. PRODUCT GRID

Desktop:

4 columns preferred.

At very wide layouts:
possibly 5 if image sizes remain premium.

Tablet:
3 columns.

Mobile:
2 columns.

Use approximately:

Desktop gap:
12–20px

Mobile gap:
6–10px

Do not make the mobile product cards tiny.

---

# 23. CATEGORY / PRODUCT LISTING PAGE

Structure:

breadcrumb
category title
short description
optional category navigation
filter/sort toolbar
product count
product grid

Example:

```text
WOMEN

Discover the latest DIR essentials.

[NEW IN] [TOPS] [BOTTOMS] ...

FILTER                    SORT
```

Keep the introduction concise.

Do not put a giant marketing article above the product grid.

---

# 24. FILTERS

Desktop:

FILTER
Category
Size
Color
Price
Availability

SORT BY

Use clean text and dividers.

Do not make filters giant rounded pills.

Mobile:

sticky toolbar:

```text
FILTER        SORT
```

Open a drawer/bottom sheet.

Must support:

- multiple selections
- selected states
- clear all
- apply
- result count

Use the actual backend/product filtering system.

Do not fake filters in the frontend.

---

# 25. SEARCH

Search should feel fast and premium.

Desktop:

search icon → expanded search or overlay.

Search overlay may include:

- input
- recent searches
- suggestions
- category suggestions
- matching products

Do not fake search results.

Use existing search/data services.

---

# 26. PRODUCT DETAIL PAGE

Product page should feel significantly more premium than a standard CRUD ecommerce page.

Desktop:

LEFT:
large product image/gallery

RIGHT:
product information

Suggested order:

category
product name
price
color
variant
size
size guide
availability
quantity
add to bag
details
materials/care
shipping/returns

No giant card wrapping all information.

---

# 27. PRODUCT IMAGE GALLERY

Large primary image.

Desktop:
approximately 60–65% page width

Product information:
approximately 35–40%

Mobile:
horizontal image swipe

Use high-quality images.

Do not use tiny thumbnail-heavy galleries.

---

# 28. ADD TO BAG

Primary CTA:

dark or brand color
rectangular
44–56px high
clear label

Example:

**ADD TO BAG**

No:

- gradient
- giant pill
- glowing shadow
- excessive animation

Subtle hover state only.

---

# 29. SIZE SELECTOR

Use real available sizes.

Example:

XS
S
M
L
XL

Style:

- thin border
- square/very small radius
- clear selected state

Out-of-stock:
disabled visually.

Never let users select unavailable variants.

---

# 30. PRODUCT ACCORDIONS

Use:

Product Details
Fit & Sizing
Materials & Care
Shipping
Returns

Appearance:

thin divider
small heading
plus/minus icon

No giant cards.

---

# 31. CART

Cart must feel like a premium fashion shopping bag.

Include:

- product image
- product name
- size/variant
- quantity
- price
- remove
- subtotal
- checkout

Use a drawer if existing architecture allows it.

Avoid excessive decoration.

---

# 32. CHECKOUT

Preserve existing checkout/business logic.

Only apply the new visual system safely.

Do not break:

- payment
- address
- order creation
- inventory
- pricing
- authentication

---

# 33. EDITORIAL SECTIONS

Premium fashion sites do not consist entirely of product grids.

Use sections such as:

## Full-width campaign

Large image.

## Split editorial

```text
IMAGE | TEXT
```

or

```text
TEXT | IMAGE
```

## Category image grid

Women / Men / Kids / actual clothing types.

## Shop the Look

Campaign image + related products.

## Brand Story

DIR (ድር) THE FOUNDATION story.

These sections should use composition, not decorative cards.

---

# 34. BRAND STORY

Create a premium brand-story section introducing:

**DIR (ድር) THE FOUNDATION**

Use real company information if available.

Do not invent company history.

If content does not exist yet, create a structured content placeholder for the real copy.

The visual presentation should feel editorial.

---

# 35. CATEGORY MODEL

Because the catalog is small, categories should be made visually powerful.

Instead of 20 tiny category tiles:

use a few strong, high-quality fashion sections.

For example:

```text
WOMEN
[large image]

MEN
[large image]

KIDS
[large image]
```

Then the two actual clothing types can be surfaced as secondary navigation or product category links.

This will feel much more premium than forcing a giant taxonomy onto a small catalog.

---

# 36. CHILDREN'S SHOPPING EXPERIENCE

The kids category should have its own visual treatment where appropriate.

Do not simply reuse the adult category layout and swap the title.

Maintain:

- same DIR design system
- same typography
- same product-grid quality

but allow:

- different imagery
- more playful campaign photography
- age/size grouping where supported

Do not introduce childish UI elements unless the brand strategy requires it.

Premium children’s fashion still needs to feel premium.

---

# 37. SCROLLING — EXTREMELY IMPORTANT

The scrolling experience must feel:

**SOOOO BUTTERY.**

**SMOOTH.**

**SILKY.**

**PREMIUM.**

This is a major design requirement.

The page should never feel:

- stiff
- jerky
- cheap
- over-animated
- laggy
- sticky in the wrong places
- scroll-jacked

## Principles

Use native browser scrolling unless there is a strong technical reason not to.

Do NOT replace normal browser scrolling with an unnecessarily heavy custom-scroll engine.

If a smooth-scroll library is already present and performs well, evaluate it.

If adding one, it must:

- preserve native accessibility
- preserve keyboard navigation
- preserve touch scrolling
- work correctly on iOS/Android
- respect reduced-motion
- not hurt performance
- not cause input lag

## Scrolling behavior

The site should have subtle:

- reveal animations
- fade-ins
- gentle translation
- image transitions

Sections may enter the viewport with:

opacity 0 → 1
translateY 12–24px → 0

Do not animate everything.

## Sticky behavior

Header can transition between states as the user scrolls.

Example:

At top:
larger brand header

After scrolling:
slightly compact header

Transition:
150–300ms

Do not make the header jump.

---

# 38. CAROUSEL MOTION

Product rails should feel smooth.

Use Swiper or the existing carousel library if already available.

Animations should be:

- controlled
- low friction
- smooth
- responsive

Mobile:

native-feeling horizontal swipe.

Do not make carousels snap violently.

Do not autoplay product carousels aggressively.

---

# 39. SCROLL PERFORMANCE

Scrolling quality is a first-class requirement.

Verify:

- 60fps target where practical
- no large blocking scripts
- no scroll event handler doing heavy work
- no unnecessary layout reads/writes
- no giant background videos on low-powered mobile devices
- lazy-load below-the-fold media
- use intersection observers where appropriate
- avoid excessive DOM animation
- avoid unnecessary canvas effects

Use GPU-friendly transforms:

transform
opacity

Avoid animating:

width
height
top
left

unless necessary.

---

# 40. REDUCED MOTION

Respect:

`prefers-reduced-motion: reduce`

When reduced motion is enabled:

- minimize transitions
- disable large entrance animations
- disable non-essential scroll motion
- preserve usability

---

# 41. RESPONSIVE DESIGN

Test:

320px
375px
390px
430px
768px
834px
1024px
1280px
1440px
1600px
1920px

Nothing may overflow horizontally.

No accidental horizontal body scrolling.

---

# 42. MOBILE COMPOSITION

Do NOT simply shrink desktop.

Mobile should have its own composition.

Priorities:

1. brand
2. search
3. categories
4. products
5. filters
6. cart

Reduce or restructure editorial content where needed.

Images remain strong.

Typography remains readable.

Touch targets remain accessible.

---

# 43. RESPONSIVE IMAGE STRATEGY

Use the existing image optimization system.

If using Next.js:

- use `next/image` where appropriate
- provide correct sizes
- load correct image dimensions
- lazy load below-fold images
- prioritize hero media only

Do not download desktop-size images on mobile.

---

# 44. PERFORMANCE

The redesign must remain fast.

Avoid:

- huge JS libraries for tiny interactions
- unnecessary dependencies
- duplicate packages
- excessive motion libraries
- unoptimized videos
- oversized images

Preserve:

- server-side rendering where appropriate
- static generation where appropriate
- image optimization
- code splitting
- lazy loading

---

# 45. ACCESSIBILITY

Maintain/improve:

- semantic HTML
- keyboard navigation
- focus states
- screen-reader support
- accessible buttons
- accessible dialogs
- accessible drawers
- accessible filters
- sufficient color contrast
- proper headings
- alt text

Do not sacrifice accessibility for aesthetics.

---

# 46. SEO

Preserve/improve:

- metadata
- canonical URLs
- OpenGraph
- social metadata
- structured data
- product schema
- breadcrumb schema
- semantic content
- clean routes

Do not break existing SEO.

---

# 47. ADMIN PANEL SAFETY

The existing admin panel must continue functioning.

Do not accidentally apply:

- storefront typography
- storefront colors
- storefront buttons
- storefront radius
- storefront layout
- storefront header styles

to the admin panel.

Scope storefront-specific CSS/tokens where necessary.

---

# 48. DATA / BACKEND SAFETY

Never replace real data with mock data.

Never hardcode:

- products
- prices
- stock
- categories
- customer data
- order data

Use existing APIs/state/data models.

The redesign is a frontend/storefront transformation.

---

# 49. COMPONENT ARCHITECTURE

Recommended structure:

```text
StorefrontLayout
AnnouncementBar
SiteHeader
DesktopNavigation
MobileNavigation
MegaMenu
SearchOverlay

HeroCampaign
EditorialSection
CategoryFeature
ProductRail
ProductGrid
ProductCard
ProductBadge
QuickAdd

FilterBar
FilterDrawer
SortControl

ProductGallery
ProductInformation
SizeSelector
VariantSelector
AddToBagButton
ProductAccordion
RelatedProducts

CartDrawer
Newsletter
StorefrontFooter
```

Reuse existing components where practical.

Do not create needless abstraction.

---

# 50. DESIGN TOKENS

Centralize:

- colors
- typography
- spacing
- container sizes
- breakpoints
- border radius
- shadows
- motion durations
- image ratios
- z-index

Example:

```text
--brand-black
--brand-white
--brand-muted
--brand-border
--brand-accent

--font-primary
--font-editorial

--space-xs
--space-sm
--space-md
--space-lg
--space-xl

--motion-fast
--motion-normal
--motion-slow
```

---

# 51. NO GENERIC COMPONENT LIBRARY LOOK

If the project uses shadcn/ui or another component library:

Use it only where it helps accessibility/functionality.

Do not let default component styling determine the brand appearance.

Override:

- radius
- colors
- typography
- borders
- shadows
- spacing

The fashion design system must have final authority.

---

# 52. NO AI-GENERATED VISUAL NOISE

Do not add:

- gradient blobs
- glass cards
- abstract 3D shapes
- floating decorative elements
- artificial glowing gradients
- meaningless animated backgrounds
- giant gradient text
- generic AI fashion illustrations

Real fashion imagery should provide the visual impact.

---

# 53. IMAGE ART DIRECTION

Photography should feel:

- editorial
- premium
- clean
- fashion-focused
- consistent

Use the existing DIR assets first.

Do not replace them with random stock photography.

Do not use AI-generated fashion models unless explicitly instructed later.

Do not alter products using fake imagery.

---

# 54. PROMOTIONAL BAR

Use a restrained announcement bar.

Examples:

FREE DELIVERY ON ORDERS OVER X
NEW SEASON NOW LIVE
SHOP THE LATEST DIR COLLECTION

Use real promotional information.

Do not fabricate commercial terms.

---

# 55. NEWSLETTER

Keep it premium.

Example layout:

```text
STAY IN THE LOOP

Sign up for new arrivals, collections and DIR updates.

[ Email address                         ][ SIGN UP ]
```

Avoid:

- giant colorful signup cards
- gradients
- excessive illustrations

---

# 56. FOOTER

Suggested:

SHOP
Women
Men
Kids
Clothing Type 1
Clothing Type 2
New In

HELP
Shipping
Returns
Size Guide
Contact
FAQ

ABOUT
DIR (ድር) THE FOUNDATION
Our Story
Journal / Editorial if applicable

ACCOUNT
Account
Orders
Cart

NEWSLETTER

Social links

Legal

Use actual available routes.

---

# 57. ICONOGRAPHY

Use one icon family.

Icons should be:

- minimal
- consistent
- thin
- approximately 18–20px

Avoid mixing:

- filled icons
- outline icons
- emoji
- random icon libraries

Use real accessible labels.

---

# 58. IMPLEMENTATION PHASES

## Phase 1 — Repository Audit

Inspect:

- framework
- router
- data model
- APIs
- storefront routes
- admin routes
- assets
- fonts
- styling
- state
- existing components

Do not modify anything yet.

## Phase 2 — Design Foundation

Implement:

- DIR logo handling
- typography
- color tokens
- spacing
- buttons
- icon system
- container system
- motion system

## Phase 3 — Storefront Shell

Implement:

- announcement bar
- desktop header
- mobile header
- navigation
- drawer
- search
- footer

## Phase 4 — Product System

Implement:

- product card
- product grid
- product rails
- image hover
- badges
- variant behavior
- quick add if appropriate

## Phase 5 — Homepage

Implement:

- hero
- New In
- category sections
- products
- editorial
- shop the look
- brand story
- newsletter

## Phase 6 — Category / PLP

Implement:

- category header
- filters
- sort
- product grid
- responsive drawer

## Phase 7 — PDP

Implement:

- gallery
- product information
- size
- variants
- add to bag
- details
- related items

## Phase 8 — Cart / Checkout Styling

Preserve functionality.

Apply visual system.

## Phase 9 — Motion & Performance

Optimize:

- scrolling
- transitions
- lazy loading
- image loading
- carousel behavior

## Phase 10 — QA

Test every major route at all target breakpoints.

---

# 59. VISUAL QA CHECKLIST

Before completion, verify:

- logo is correct
- logo has sufficient whitespace
- typography feels fashion-oriented
- product cards feel premium
- product images dominate
- buttons do not look generic
- filters look refined
- header is elegant
- mobile navigation feels intentional
- hero feels editorial
- category sections feel premium
- motion is subtle
- scrolling feels silky
- no accidental horizontal scrolling
- no excessive radius
- no excessive shadows
- no gradients unless brand-authentic
- no AI-style decorative UI
- no broken images
- no console errors
- no hydration warnings

---

# 60. PREMIUM QUALITY REVIEW

Before declaring the redesign complete, inspect the storefront as if you were a fashion creative director.

Ask:

### Brand

Does this unmistakably feel like DIR (ድር) THE FOUNDATION?

### Visual

Does it look premium without relying on decoration?

### Typography

Does the type feel like fashion retail rather than software?

### Photography

Does the imagery lead the experience?

### Commerce

Can users quickly discover and buy products?

### Mobile

Does it feel intentionally designed for mobile?

### Motion

Does scrolling feel buttery and silky?

### Product cards

Do they feel like fashion catalog merchandising?

### UI

Does the interface disappear behind the product?

### Overall

Would this look credible beside serious commercial fashion retailers?

If any answer is no, continue refining.

---

# 61. FINAL ANTI-SLOP RULE

This requirement is absolute:

> **EVERYTHING MUST FEEL PREMIUM.**

Never accept "good enough".

Never accept "technically correct" if the visual execution feels cheap.

Never add a component merely because the component library has it.

Never add animation merely because an animation library exists.

Never add a rounded card merely because rounded cards are common.

Never use a generic font merely because it is convenient.

Never use an arbitrary gradient merely to make the page "modern".

Never fill empty space with decorative UI.

Never create fake functionality.

Never invent catalog categories.

Never show a wishlist button that does not work.

Never destroy the existing business logic to achieve visual similarity.

The final result must look like a **real premium fashion brand**.

---

# 62. FIRST ACTION FOR THE CODING AGENT

Before changing code:

1. Inspect the repository.
2. Identify the existing storefront architecture.
3. Identify the admin architecture.
4. Identify existing DIR logo assets.
5. Identify existing fonts.
6. Identify existing product/category data.
7. Identify the two real clothing types.
8. Identify Women/Men/Kids classification.
9. Identify existing cart and checkout functionality.
10. Identify whether any wishlist code exists.
11. Identify existing image handling.
12. Identify current responsive behavior.
13. Produce a concise implementation plan.

Then begin implementation.

Do not ask for information that can be discovered from the repository.

Do not replace functioning backend logic.

Do not introduce fake products.

Do not introduce a fake wishlist.

Do not touch the admin panel unnecessarily.

Build the storefront as a **premium fashion retail experience for DIR (ድር) THE FOUNDATION**.
