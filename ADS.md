# Ads setup (Google AdSense)

## 1. Create AdSense account
https://www.google.com/adsense/

## 2. Add your site
- Site: `https://github-oauth-login-nine.vercel.app`
- Wait for approval (can take days)

## 3. Create ad units
In AdSense → Ads → By ad unit:
- **Banner** (horizontal / responsive)
- **Footer** (optional)
- **Rectangle** (optional)

Copy **Ad client** (`ca-pub-xxxxxxxx`) and each **Ad slot** id.

## 4. Vercel Environment Variables

| Name | Example |
|------|---------|
| `NEXT_PUBLIC_ADSENSE_CLIENT` | `ca-pub-1234567890123456` |
| `NEXT_PUBLIC_ADSENSE_SLOT_BANNER` | `1234567890` |
| `NEXT_PUBLIC_ADSENSE_SLOT_FOOTER` | `0987654321` |
| `NEXT_PUBLIC_ADSENSE_SLOT_RECT` | `1122334455` |

Save → **Redeploy**.

## 5. Where ads show
- Top of every page (layout)
- Homepage (in-feed + rectangle)
- Footer of every page

Until env vars are set, dashed **placeholder** boxes appear so layout is ready.

## Notes
- Do not click your own ads (AdSense policy).
- Login page intentionally has no ads for cleaner auth UX.
- For other networks (Adsterra, etc.) swap the component later.
