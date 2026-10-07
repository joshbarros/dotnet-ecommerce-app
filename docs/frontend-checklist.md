# Frontend interaction checklist

These are manual acceptance checks, not a claim that browser review has already occurred. Open the app at both desktop and 375px-wide mobile sizes.

1. Reset demo data in the footer. Home shows four featured products and category links.
2. Choose Workspace. The catalog URL and selected filter agree. Search “keyboard”, change price sort, test in-stock filtering and page navigation. Clear filters and search a nonexistent product to see the empty state.
3. Open product 1. Add it to the cart, save it to the wishlist, follow a related product and use browser Back. Try product 8 to see its unavailable state. Open an invalid ID for a product-not-found page.
4. In the cart, change quantity, verify totals and shipping, reach the stock limit, remove an item and test an empty cart. Refresh and verify persistence.
5. Submit checkout with empty fields, invalid email/postal code, and without accepting demo terms. Each validation should be readable. Use fictional valid values and submit. Confirm a local order appears, the bag empties and stock decreases.
6. Refresh confirmation; verify the order remains. Navigate to order history/detail. Open a nonexistent order ID. No charge, email or delivery should be implied.
7. Enter a fictional demo profile through login and registration. Edit it and sign out. Validate a short fictional password and mismatched registration confirmation. Passwords must never be saved; no true authentication should be claimed. Guest orders remain local and visible.
8. Toggle wishlist items and remove one. The empty wishlist should offer a collection link.
9. In demo management, add an essential, edit its price/stock, test invalid values, feature it on Home, and confirm product deletion. Existing order item snapshots should remain unchanged. Change a demo order status.
10. Open About, FAQ, Shipping, Privacy and Terms. Validate the contact form; its completion message must say no message was sent.
11. Open an unknown route for the 404 page. Refresh deep routes directly. Inspect mobile navigation, tables, cart, checkout and footer for horizontal overflow.
12. Use the keyboard: skip link, main navigation, product actions, forms and dialogs/confirmation areas. Check focus visibility and live announcements.
13. Clear site storage or use private browsing. The catalog should seed safely. If storage writes are disabled, the UI should warn while keeping in-memory interactions usable.

Future end-to-end coverage should automate the purchase flow in demo mode, then separately against the real API when implemented.
