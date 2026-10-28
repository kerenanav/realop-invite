# RealOp invite page

Static page shown when someone taps a RealOp invite link, e.g.
`https://kerenanav.github.io/realop-invite/#K7F2X9QXDM`.

- Hosted free on GitHub Pages (this repository is public on purpose; it contains no secrets or user data).
- The code after `#` is never sent to GitHub's servers. The page sends it only to RealOp's database function `get_invitation_preview`, which returns just the inviter's display name for a usable code.
- No cookies, no analytics, a strict Content-Security-Policy, and `noindex` so search engines skip it.
- The Supabase *publishable* key in `invite.js` is public by design. The database only allows it to call `get_invitation_preview`.

The app's source code lives in the private `realop` repository.
