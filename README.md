# Marine Pro Website Template

![Template Version](https://img.shields.io/badge/template--version-1.0.0-blue)
![Next.js](https://img.shields.io/badge/Next.js-14.2.4-black)
![License](https://img.shields.io/badge/license-MIT-green)

A production-ready, white-label website template for marine service professionals. Built by [Boatwork](https://boatwork.co) -- the platform for marine contractors.

**Demo:** Yachts Etc, Fort Lauderdale FL

---

## How to Deploy a New Client Site

1. **Clone this repo** (do NOT fork -- clone for a clean history):
   ```bash
   git clone https://github.com/andi-sailplan/marine-pro-website-template my-client-site
   cd my-client-site
   git remote set-url origin https://github.com/boatworkco/my-client-site
   ```

2. **Update `src/site.config.ts`** -- this is the ONLY file you need to touch for a basic deployment. Update:
   - Business name, tagline, description
   - Phone, email, location, address
   - Services list
   - Service area
   - Boatwork profile URL and slug
   - Social links
   - Theme colors (and mirror them in `src/app/globals.css`)

3. **Update CSS variables** in `src/app/globals.css` to match your theme colors.

4. **Set environment variables** (see below).

5. **Deploy to Vercel**:
   ```bash
   npx vercel --prod
   ```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `RESEND_API_KEY` | Yes | Your Resend API key for contact form emails |

Set on Vercel:
```bash
npx vercel env add RESEND_API_KEY production
```

---

## Enabling Live Boatwork Reviews

By default, reviews are pulled from `siteConfig.boatwork.staticReviews`. To use live data from the Boatwork API:

1. Set `useLiveReviews: true` in `site.config.ts`
2. Implement a fetch in the homepage to call `https://boatwork.co/api/v1/pros/{slug}/reviews`
3. Fall back to `staticReviews` on error

---

## Theming

Colors are defined as CSS variables in `src/app/globals.css`:

```css
:root {
  --primary: #0c2340;      /* Navy -- headers, hero */
  --secondary: #38b2ac;    /* Teal -- CTAs, accents */
  --accent: #f6ad55;       /* Gold -- stars, highlights */
  --background: #f8fafc;   /* Light gray -- section backgrounds */
  --text: #1e293b;         /* Dark -- body text */
}
```

Update these values AND the corresponding values in `site.config.ts` (used for JSON-LD and metadata).

---

## Component Inventory

All shared components live in `src/components/shared/` and are exported from `src/components/shared/index.ts`.

| Component | Description |
|---|---|
| `Logo` | Business name with size/color variants |
| `Navbar` | Sticky responsive nav with mobile hamburger |
| `Footer` | Full footer with nav, social, Boatwork badge, version comment |
| `ServiceCard` | Icon + title + description card |
| `ReviewCard` | Star rating + quote + author |
| `ContactForm` | Client-side form with validation + Resend integration |
| `BoatworkBadge` | "Verified on Boatwork" link badge |
| `SectionWrapper` | Consistent section padding + background variants |

---

## Pages

| Route | Description |
|---|---|
| `/` | Homepage -- hero, services preview, reviews, service area, CTA |
| `/services` | Full services grid + service area |
| `/portfolio` | Photo grid (placeholder) + video placeholder |
| `/contact` | Contact form + contact details |
| `/api/contact` | POST -- validates + sends email via Resend |

---

## Version History

### v1.0.0 (2026-03-15)
- Initial release
- 4 pages: Home, Services, Portfolio, Contact
- Resend contact form integration
- Boatwork profile badge
- Schema.org LocalBusiness JSON-LD
- Responsive design with mobile hamburger nav
- Tailwind CSS with CSS variable theming

---

## Template Sync System

When this template is updated, a GitHub Action automatically opens PRs on all contractor repos (`*-website` repos in YachtSupply org) with the changes.

**Setup:** Add a `SYNC_TOKEN` secret to this repo with a GitHub PAT that has `repo` scope on the YachtSupply org. The existing provisioning PAT works.

**Never synced:** `src/site.config.ts` and `.boatwork-template` — these are contractor-specific.
