# COD and Meta production release — 4 October 2026

## Authorization and source

The owner explicitly requested production publication after confirming that the
card form works, while reporting insufficient funds. Successful authorization
and completed order acceptance therefore remain pending; deployment approval
does not turn those checks into passes.

Fetched origin before release. PR #61's exact head was
`a8837e478c3da77a243a1323497dbbb9aa155d9f`, with a successful Vercel check and
clean mergeability. Marked it ready and squash-merged with that head constraint.
[PR #61](https://github.com/Rusu91-webdeveloper/STEM-TOYS3/pull/61) merged at
02:29:10 EEST as `9ce31e480b50e0d58dbee080fccc12a6c38add02`. The merged tree
matches the tested PR head exactly. There are no schema, migration, dependency
or environment-variable changes. Scoped migration validation passed.

The release requires a server-priced outbound-shipping authorization for every
eligible COD order, repairs signed guest/authenticated checkout CSRF handling,
and publishes the consent-gated Meta storefront events and restricted Facebook
transport policy. Lockers remain prepaid-only. Details and validation are in the
[COD audit](2026-10-04-mandatory-cod-guarantee.md) and
[Meta audit](2026-10-03-meta-checkout-events.md).

## Deployment

- Project: `stem-toys-3`, framework Next.js, target production.
- Deployment: `dpl_2GkKsmuuepNP7wEg3F51oACiJhzu`, READY.
- Source: `9ce31e480b50e0d58dbee080fccc12a6c38add02`.
- Immutable URL:
  <https://stem-toys-3-gh61qiw6z-rusujobs-3774s-projects.vercel.app>.
- Vercel confirms both `www.techtots.ro` and `techtots.ro` as live aliases.
- Build duration: about 4 minutes 54 seconds, from Vercel timestamps.
- Previous production rollback candidate: `dpl_5fVrJ8Qz1VR2r2sPjyAPc9uBiaMr`,
  source `a635bfb756060180a72c0a179abdd9c293f3e67c`.

The production Git build uses the existing production configuration. The agent
did not promote a preview or change payment keys, auth secrets, feed access,
repository visibility or Git history.

## Live verification

Read-only HTTP checks on www.techtots.ro:

- The policy for a 193.01 lei B2C FanCourier order returns HTTP 200,
  `required: true`, mode `always`. Its `amount: 193.01` is the evaluated order
  total, not the shipping hold amount.
- Fresh anonymous CSRF issuance and a repeat request both return HTTP 200 with
  nonempty tokens and the same guest session. Cookie flags are HttpOnly, Secure
  and SameSite=Lax; caching is `no-store, no-cache, must-revalidate`.
  Token/session/cookie values are omitted from evidence. The response's Vary
  header contains Next router fields rather than the source's Cookie field; the
  response remains explicitly uncacheable.
- Anonymous admin analytics returns 403, admin-access-required and no-store.
- Homepage, shipping, cart and checkout return HTTP 200; the apex redirects to
  www and also resolves successfully.
- Production CSP permits only the observed Facebook tracking path in frame-src
  and form-action, alongside the existing approved directives.

Normal Chrome verifies the mandatory COD wording at `/shipping#rto`. Existing
consent initially had both optional categories selected. Refusal/withdrawal
reloads the page and removes Meta and GA scripts. Advertising-only consent
mounts Meta with public Pixel ID `787839287564208` while GA remains absent;
withdrawing again removes both. Restored the owner's original consent choices
after checking. The existing cart and filled preview checkout tabs are
preserved.

The deployment-scoped production error/fatal query, from merge time through
02:37 EEST, returned no count rows. This is a limited observation window, not
proof that every payment or purchase path works. The build-log connector was
unavailable; successful compilation is confirmed by READY deployment status.

Production checks prove policy, guest token issuance, protected endpoints,
rendered copy and script consent gates. They do not independently prove Meta
account receipt or a paid Purchase. Earlier actual preview event HTTP 200 and
duplicate checks remain recorded in the Meta audit. No card data, real payment,
order submission or direct production database mutation was performed by the
agent.

## Validation and pending acceptance

The released source has 81 passing focused COD/CSRF tests across nine suites.
Required full Jest baseline/candidate comparisons both retain 65 failed suites
and 179 failed tests, with zero additions; TypeScript retains 1207 diagnostics
with zero additions. Existing repository debt remains. The release-record commit
changes only this document and TASKS.md and must pass normal hooks.

The owner still needs funds to authorize the shipping amount and complete a real
guest COD order. For the tested 168 lei cart, the configured shipping
authorization is 19.99 lei. A temporary authorization expires at Stripe's
`capture_before`; operational handling of refusal/capture deadlines remains a
separate task. COD Purchase still requires verified cash collection and a
consent-aware server integration, following the owner's instruction to count it
only after payment is collected.
