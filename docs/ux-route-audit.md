# UX route audit

Audited existing prototype routes: 154. New review route is intentionally excluded from the 154-screen audit.

- Links to missing routes: 0
- Routes without incoming transitions before map fallback: 0
- Routes without outgoing transitions: 0
- Duplicate or component-level screens recommended for merge/delete: 87

| ? | Route | ????? | ???? | ????? | ???????? | ??????? | MVP |
|---|---|---|---|---|---|---|---|
| 1 | `#/home` | home | 404, about, account, account-car, account-cars... | account, article-search, brand, cart, catalog, garage... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 2 | `#/menu` | menu | home, map | account, cart, catalog, contacts, delivery-info, garage... | no blocking routing issue | KEEP/P3: keep and validate copy | yes |
| 3 | `#/search` | search | home, map | account, cart, catalog, empty-results, home, map... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 4 | `#/search-suggestions` | search suggestions | analogs, article-search, compatibility, map, promo... | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 5 | `#/search-history` | search history | analogs, article-search, compatibility, map, promo... | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 6 | `#/city` | city | map | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 7 | `#/contacts-quick` | contacts quick | about, city, contacts, contacts-quick, delivery-info... | account, cart, catalog, contacts-quick, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 8 | `#/garage` | garage | home, map, menu, vehicle-delete | account, cart, catalog, home, map, vehicle-brand... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 9 | `#/vehicle-brand` | vehicle brand | garage, map | account, cart, catalog, home, map, vehicle-model... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 10 | `#/vehicle-model` | vehicle model | map, vehicle-brand | account, cart, catalog, home, map, vehicle-year... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 11 | `#/vehicle-year` | vehicle year | map, vehicle-model | account, cart, catalog, home, map, vehicle-engine... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 12 | `#/vehicle-engine` | vehicle engine | map, vehicle-year | account, cart, catalog, home, map, vehicle-confirm... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 13 | `#/vehicle-confirm` | vehicle confirm | map, vehicle-engine | account, cart, catalog, home, map, vehicle-categories... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 14 | `#/vehicle-profile` | vehicle profile | garage, map, vehicle-edit, vehicle-profile | account, cart, catalog, home, map, vehicle-categories... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 15 | `#/vehicle-categories` | vehicle categories | map, vehicle-confirm, vehicle-profile | account, cart, catalog, home, map, vin | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 16 | `#/vehicle-edit` | vehicle edit | garage, map, vehicle-profile | account, cart, catalog, home, map, vehicle-profile... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 17 | `#/vehicle-delete` | vehicle delete | map | account, cart, catalog, garage, home, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 18 | `#/vin` | vin | 404, about, account, account-car, account-cars... | account, cart, catalog, home, map, vin... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 19 | `#/vin-upload` | vin upload | map, vin, vin-photo-error | account, cart, catalog, home, map, vin... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 20 | `#/vin-preview` | vin preview | map, vin-upload | account, cart, catalog, home, map, vin... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 21 | `#/vin-photo-error` | vin photo error | map, vin-preview | account, cart, catalog, home, map, vin... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 22 | `#/vin-sent` | vin sent | map, vin-preview | account, cart, catalog, home, map, vin... | duplicate/component-level state | MERGE/P0: merge into parent route/component | yes |
| 23 | `#/vin-status` | vin status | map, vin-answer, vin-sent | account, cart, catalog, home, map, vin... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 24 | `#/vin-need-data` | vin need data | map | account, cart, catalog, home, map, vin... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 25 | `#/vin-answer` | vin answer | map, vin-need-data | account, cart, catalog, home, map, vin... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 26 | `#/vin-ready` | vin ready | manager-vin-detail, manager-vin-filters, manager-vin-queue, map, vin-status | account, cart, catalog, home, map, vin... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 27 | `#/vin-selection` | vin selection | map, vin-ready | account, cart, catalog, home, map, product... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 28 | `#/vin-compare` | vin compare | map, vin-selection | account, cart, catalog, home, map, vin... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 29 | `#/vin-pick-product` | vin pick product | map, vin-compare | account, cart, catalog, home, map, product... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 30 | `#/vin-closed` | vin closed | map | account, account-vin-detail, cart, catalog, home, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 31 | `#/categories` | categories | map | account, cart, catalog, home, map, vin | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 32 | `#/subcategory` | subcategory | map | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 33 | `#/catalog` | catalog | 404, about, account, account-car, account-cars... | account, cart, catalog, filters, home, map... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 34 | `#/filters` | filters | catalog, map | account, cart, catalog, home, map, vin | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 35 | `#/sort` | sort | catalog, map | account, cart, catalog, home, map, vin | no blocking routing issue | MERGE/P0: merge into parent route/component | yes |
| 36 | `#/compatibility` | compatibility | map | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 37 | `#/brands` | brands | map | account, brand, cart, catalog, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 38 | `#/brand` | brand | brands, home, map | account, cart, catalog, home, map, product... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 39 | `#/article-search` | article search | home, map | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 40 | `#/search-results` | search results | map | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 41 | `#/analogs` | analogs | map, out-of-stock | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 42 | `#/recent` | recent | map | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 43 | `#/empty-results` | empty results | analogs, article-search, compatibility, map, promo... | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 44 | `#/out-of-stock` | out of stock | map | account, analogs, cart, catalog, home, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 45 | `#/catalog-error` | catalog error | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 46 | `#/promos` | promos | map, menu | account, cart, catalog, home, map, promo... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 47 | `#/promo` | promo | home, map, promos | account, cart, catalog, empty-results, home, map... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 48 | `#/product` | product | analogs, article-search, availability, brand, catalog... | account, availability, cart, catalog, compare-analogs, gallery... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 49 | `#/product-fit-ok` | product fit ok | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P0: merge into parent route/component | yes |
| 50 | `#/product-fit-unknown` | product fit unknown | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P0: merge into parent route/component | yes |
| 51 | `#/product-fit-bad` | product fit bad | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P0: merge into parent route/component | yes |
| 52 | `#/product-no-car` | product no car | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 53 | `#/gallery` | gallery | map, product | account, cart, catalog, home, map, product... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 54 | `#/specs` | specs | map, product | account, cart, catalog, home, map, product... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 55 | `#/plain-description` | plain description | map | account, cart, catalog, home, map, product... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 56 | `#/availability` | availability | map, product | account, cart, catalog, home, map, product... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 57 | `#/supplier` | supplier | map | account, cart, catalog, home, map, product... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 58 | `#/warranty` | warranty | map | account, cart, catalog, home, map, product... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 59 | `#/compare-analogs` | compare analogs | map, product | account, cart, catalog, home, map, vin | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 60 | `#/related` | related | map | account, cart, catalog, home, map, product... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 61 | `#/product-question` | product question | map | account, cart, catalog, home, map, product... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 62 | `#/added-cart` | added cart | map | account, cart, catalog, home, map, vin | duplicate/component-level state | DELETE/P3: do not implement as separate screen | no |
| 63 | `#/added-favorite` | added favorite | map | account, cart, catalog, favorites, home, map... | duplicate/component-level state | DELETE/P3: do not implement as separate screen | no |
| 64 | `#/cart` | cart | 404, about, account, account-car, account-cars... | account, cart, cart-delete, catalog, checkout-contact, home... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 65 | `#/cart-empty` | cart empty | map | account, cart, catalog, home, map, vin | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 66 | `#/cart-qty` | cart qty | map | account, cart, cart-delete, catalog, checkout-contact, home... | duplicate/component-level state | DELETE/P3: do not implement as separate screen | no |
| 67 | `#/cart-delete` | cart delete | cart, cart-qty, map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 68 | `#/cart-out` | cart out | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 69 | `#/cart-price-changed` | cart price changed | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P0: merge into parent route/component | yes |
| 70 | `#/cart-delivery-changed` | cart delivery changed | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 71 | `#/cart-analog` | cart analog | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 72 | `#/promo-code` | promo code | cart, cart-qty, map | account, cart, catalog, home, map, promo-applied... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 73 | `#/promo-applied` | promo applied | map, promo-code | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 74 | `#/promo-error` | promo error | map, promo-code | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 75 | `#/checkout-contact` | checkout contact | cart, cart-qty, map, payment-change | account, cart, catalog, checkout-delivery, home, map... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 76 | `#/checkout-delivery` | checkout delivery | checkout-contact, map | account, cart, catalog, home, map, pickup... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 77 | `#/pickup` | pickup | checkout-delivery, map | account, cart, catalog, home, map, pickup-map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 78 | `#/pickup-map` | pickup map | map, pickup | account, cart, catalog, courier-address, home, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 79 | `#/courier-address` | courier address | map, pickup-map | account, cart, catalog, home, map, transport-company... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 80 | `#/transport-company` | transport company | courier-address, map | account, cart, catalog, delivery-time, home, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 81 | `#/delivery-time` | delivery time | map, transport-company | account, cart, catalog, home, map, payment... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 82 | `#/payment` | payment | delivery-time, map | account, cart, catalog, home, map, order-comment... | no blocking routing issue | MERGE/P0: merge into parent route/component | yes |
| 83 | `#/order-comment` | order comment | map, payment | account, cart, catalog, checkout-review, home, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 84 | `#/checkout-review` | checkout review | map, order-comment | account, cart, catalog, home, map, terms... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 85 | `#/terms` | terms | checkout-review, map | account, cart, catalog, home, map, payment-processing... | no blocking routing issue | MERGE/P1: merge into parent route/component | yes |
| 86 | `#/payment-processing` | payment processing | map, terms | account, cart, catalog, home, map, payment-success... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 87 | `#/payment-success` | payment success | map, payment-processing | account, cart, catalog, home, map, order-success... | duplicate/component-level state | MERGE/P0: merge into parent route/component | yes |
| 88 | `#/payment-error` | payment error | map | account, cart, catalog, home, map, payment-change... | duplicate/component-level state; needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 89 | `#/payment-change` | payment change | map, payment-error | account, cart, catalog, checkout-contact, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 90 | `#/order-success` | order success | map, payment-success | account, cart, catalog, home, map, order-status... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 91 | `#/order-status` | order status | map, order-success | account, cart, catalog, home, map, order-detail... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 92 | `#/order-detail` | order detail | documents, manager-order-detail, manager-order-status, manager-orders, map... | account, cart, catalog, home, map, order-detail... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 93 | `#/tracking` | tracking | map | account, cart, catalog, home, map, order-detail... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 94 | `#/order-confirm-required` | order confirm required | map | account, cart, catalog, home, map, order-detail... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 95 | `#/order-cancelled` | order cancelled | cancel-request, map | account, cart, catalog, home, map, order-detail... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 96 | `#/cancel-request` | cancel request | map | account, cart, catalog, home, map, order-cancelled... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 97 | `#/repeat-order` | repeat order | map | account, cart, catalog, home, map, order-detail... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 98 | `#/order-contact` | order contact | map | account, cart, catalog, home, map, order-detail... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 99 | `#/documents` | documents | map | account, cart, catalog, home, map, order-detail... | duplicate/component-level state | DELETE/P2: do not implement as separate screen | no |
| 100 | `#/login` | login | map | account, cart, catalog, home, map, vin | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 101 | `#/code` | code | code-error, map | account, cart, catalog, home, map, vin | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 102 | `#/code-error` | code error | map | account, cart, catalog, code, home, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 103 | `#/account` | account | 404, about, account, account-car, account-cars... | account, account-cars, account-orders, account-vin, addresses, cart... | needs UX rework before release | REWORK/P1: redesign CTA/proof/context before MVP | yes |
| 104 | `#/account-orders` | account orders | account, account-car, account-cars, account-order, account-orders... | account, account-cars, account-orders, account-vin, addresses, cart... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 105 | `#/account-order` | account order | map | account, account-cars, account-orders, account-vin, addresses, cart... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 106 | `#/account-repeat` | account repeat | map | account, account-cars, account-orders, account-vin, addresses, cart... | duplicate/component-level state | DELETE/P2: do not implement as separate screen | no |
| 107 | `#/account-cars` | account cars | account, account-car, account-cars, account-order, account-orders... | account, account-cars, account-orders, account-vin, addresses, cart... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 108 | `#/account-car` | account car | map | account, account-cars, account-orders, account-vin, addresses, cart... | duplicate/component-level state | DELETE/P3: do not implement as separate screen | no |
| 109 | `#/account-vin` | account vin | account, account-car, account-cars, account-order, account-orders... | account, account-cars, account-orders, account-vin, addresses, cart... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 110 | `#/account-vin-detail` | account vin detail | map, vin-closed | account, account-cars, account-orders, account-vin, addresses, cart... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 111 | `#/favorites` | favorites | account, account-car, account-cars, account-order, account-orders... | account, cart, catalog, home, map, product... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 112 | `#/addresses` | addresses | account, account-car, account-cars, account-order, account-orders... | account, account-cars, account-orders, account-vin, addresses, cart... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 113 | `#/address-add` | address add | map | account, cart, catalog, home, map, vin | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 114 | `#/notifications` | notifications | map | account, account-cars, account-orders, account-vin, addresses, cart... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 115 | `#/notification-settings` | notification settings | map | account, cart, catalog, home, map, vin | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 116 | `#/profile` | profile | account, account-car, account-cars, account-order, account-orders... | account, account-cars, account-orders, account-vin, addresses, cart... | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 117 | `#/profile-edit` | profile edit | map | account, cart, catalog, home, map, vin | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 118 | `#/logout` | logout | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 119 | `#/delete-account` | delete account | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 120 | `#/delivery-info` | delivery info | map, menu | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 121 | `#/returns` | returns | map | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 122 | `#/about` | about | map | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 123 | `#/contacts` | contacts | maintenance, map, menu | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | KEEP/P3: keep and validate copy | no |
| 124 | `#/faq` | faq | map | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 125 | `#/support` | support | callback, map, support-chat | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 126 | `#/support-chat` | support chat | map | account, cart, catalog, home, map, support... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 127 | `#/callback` | callback | map | account, cart, catalog, home, map, support... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 128 | `#/privacy` | privacy | map | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 129 | `#/terms-page` | terms page | map | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 130 | `#/personal-data` | personal data | map | account, cart, catalog, contacts-quick, home, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 131 | `#/404` | 404 | map | account, cart, catalog, home, map, vin | no blocking routing issue | KEEP/P1: keep and validate copy | yes |
| 132 | `#/offline` | offline | map | account, cart, catalog, home, map, vin | duplicate/component-level state; needs UX rework before release | REWORK/P3: redesign CTA/proof/context before MVP | yes |
| 133 | `#/server-error` | server error | map | account, cart, catalog, home, map, vin | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 134 | `#/maintenance` | maintenance | map | account, cart, catalog, contacts, home, map... | duplicate/component-level state | DELETE/P3: do not implement as separate screen | no |
| 135 | `#/manager` | manager | map, menu | account, cart, catalog, home, manager-dashboard, map... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 136 | `#/manager-dashboard` | manager dashboard | manager, manager-comment, manager-compare, manager-contact, manager-preview... | account, cart, catalog, home, manager-orders, manager-product-search... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 137 | `#/manager-vin-queue` | manager vin queue | manager-dashboard, map | account, cart, catalog, home, manager-preview, manager-request-data... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 138 | `#/manager-vin-filters` | manager vin filters | map | account, cart, catalog, home, manager-preview, manager-request-data... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 139 | `#/manager-vin-detail` | manager vin detail | map | account, cart, catalog, home, manager-preview, manager-request-data... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 140 | `#/manager-request-data` | manager request data | manager-vin-detail, manager-vin-filters, manager-vin-queue, map | account, cart, catalog, home, manager-dashboard, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | no |
| 141 | `#/manager-product-search` | manager product search | manager-dashboard, map | account, cart, catalog, home, manager-add-product, map... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 142 | `#/manager-add-product` | manager add product | manager-add-product, manager-catalog, manager-product-search, map | account, cart, catalog, home, manager-add-product, map... | duplicate/component-level state | MERGE/P3: merge into parent route/component | yes |
| 143 | `#/manager-compare` | manager compare | map | account, cart, catalog, home, manager-dashboard, map... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 144 | `#/manager-comment` | manager comment | map | account, cart, catalog, home, manager-dashboard, map... | duplicate/component-level state | LATER/P2: move to post-MVP backlog | no |
| 145 | `#/manager-preview` | manager preview | manager-vin-detail, manager-vin-filters, manager-vin-queue, map | account, cart, catalog, home, manager-dashboard, map... | duplicate/component-level state; needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 146 | `#/manager-send` | manager send | map | account, cart, catalog, home, manager-dashboard, map... | duplicate/component-level state | MERGE/P0: merge into parent route/component | yes |
| 147 | `#/manager-orders` | manager orders | manager-dashboard, map | account, cart, catalog, home, manager-order-status, map... | no blocking routing issue | KEEP/P0: keep and validate copy | yes |
| 148 | `#/manager-order-detail` | manager order detail | map | account, cart, catalog, home, manager-order-status, map... | needs UX rework before release | REWORK/P0: redesign CTA/proof/context before MVP | yes |
| 149 | `#/manager-order-status` | manager order status | manager-order-detail, manager-order-status, manager-orders, map | account, cart, catalog, home, manager-order-status, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 150 | `#/manager-contact` | manager contact | map | account, cart, catalog, home, manager-dashboard, map... | duplicate/component-level state | MERGE/P1: merge into parent route/component | yes |
| 151 | `#/manager-catalog` | manager catalog | map | account, cart, catalog, home, manager-add-product, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 152 | `#/manager-promos` | manager promos | manager-dashboard, map | account, cart, catalog, home, manager-dashboard, map... | no blocking routing issue | LATER/P2: move to post-MVP backlog | no |
| 153 | `#/manager-settings` | manager settings | map | account, cart, catalog, home, manager-dashboard, map... | duplicate/component-level state | DELETE/P2: do not implement as separate screen | no |
| 154 | `#/map` | map | 404, about, account, account-car, account-cars... | 404, about, account, account-car, account-cars, account-order... | no blocking routing issue | KEEP/P3: keep and validate copy | no |
