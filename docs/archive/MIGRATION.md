# Migration and provenance

Source repository commit: `2dfe33272756fa40574d4602ae6c01485e3dde54`. Analysis used the original implementation plus the previous extraction's SOURCE_MANIFEST, IMPORT_AUDIT, DEPENDENCIES, DISCOVERY and VERIFICATION reports. The previous showcase remains an unchanged archival extraction; this project is a separate working migration.

## Reuse totals

- **66 reused source/test files** (17 byte-identical; the remainder change only local imports/formatting under normalized comparison).
- **10 adapted source files**, retaining substantive original implementation.
- **49 new source/data/test files**, including 19 newly implemented boundary adapters and 30 other new files under `src/` and `e2e/`.
- **10 new generic SVG assets**. Root configuration, lockfile, generated Next type declaration and documentation are additional new infrastructure and excluded from source totals.

The source ledger deliberately does not count a newly written adapter as reused production code merely because it has a compatible interface. Imports/formatting-only classification compares normalized source text, not authorship. Exact original and migrated SHA-256 values are in [migration-sources.json](migration-sources.json). Every source row below identifies its upstream file.

## Dependency map and decisions

| Area | Treatment | Reason |
| --- | --- | --- |
| CartContainer, CartClient, cart price/empty/skeleton/coupon components | Reuse | Preserve composition, interactions, calculations and loading/error branches |
| CartProductTileCard | Adapt | Local imports, fixture stock caps and disable quantity changes during pending requests |
| QuantityInput, Radix Button/Form/Input/Modal/RadioGroup, required icons | Reuse/adapt | Keep real UI and accessibility patterns; exclude unused video-modal support |
| Cart query/mutations and voucher hooks | Reuse/adapt | Preserve HTTP/query-key contracts and invalidation; guest query uses server session rather than requiring a readable auth cookie |
| Delete/voucher actions, locale/price, CMS fields/rendering, notifications | New adapters | Replace remote/CMS/auth-dependent service boundaries without rewriting cart consumers |
| Zustand checkout store | Adapt | Retain state/actions/persistence; use demo namespace and fully reset transient submitting state |
| CartPaymentMethod / CartPaymentTile | Adapt | Keep query, normalization, radio selection and layout; remove card collection and replace continuation with simulated payment |
| useCreateOrderMutation | Adapt | Preserve response/error/navigation handler; add guest customer and idempotency request fields |
| Cart/order/payment/product schemas and utilities | Reuse | Keep compatible contracts and real logic |
| Name/address schema composition | Adapt/reuse | Extract pure required validators from React translation-hook module for server safety; exclude unrelated company/VAT validators |
| Guest checkout form, pages, providers, server session/order/payment service | New | No local standalone page infrastructure or backend implementation existed; production checkout used authentication and address books |
| Commerce mappers and their tests | Reuse | Preserve real transformation tests; outbound analytics/enrichment disabled |
| Catalog fixtures and illustrations | New | No private product responses, commercial product images or CMS data copied |
| Check-in | Absent | No separate implementation found; not invented |

The feature architecture stays recognizable: `features/cart/components`, `hooks`, `actions`, `utils`, `payment-methods`, and shared schemas/state/UI. There is no Express server, new database, Redux, Vite application replacement, or monorepo runtime dependency. Vite is only Vitest's test tooling. Next/React/Tailwind versions follow the original package catalog and lockfile.

## Necessary adaptations and limits

The original application performs authenticated address-book selection and selects payment before order creation. The requested flow is guest checkout → pending order → simulated payment. A new guest form uses the original field primitives, name validators, address shapes/regexes, React Hook Form and Zod. B2B/tax-ID/company validation, saved addresses, production authentication and stored-card management are not claimed to be migrated.

The original order hook's result envelope is retained. The new route returns a mock `adyen.resultCode: Pending`; no provider call happens. Real card form/encryption modules and keys were excluded entirely. Both successful and declined payment simulations update the server order, and confirmation uses the session-owned server snapshot.

The original forms module imported a runtime React translation hook. That caused a Server Component build failure. Pure name validators and the location validator were isolated without changing the name-validation rules; the latter now accepts a translator function. This also removed an unused VAT dependency. The original cart's subtotal workaround remains, and the server ensures supplied line totals are authoritative.

Additional corrections required by live verification: local Host/Origin comparison accommodates Next's URL normalization; payment selections wait for hydration; the radio value remains controlled; source quantity controls use fixture stock and pending state; client completion resets checkout progress. New mock storage/idempotency code was tested explicitly.

No original source, previous extraction, Git state or production configuration was edited. Data lives in one Node process and is lost on restart; no serverless/multi-instance consistency, durable inventory reservation, real provider integration or commercial readiness is claimed.

## Public-release gate

**All rows marked reused/adapted require code-owner redistribution review before publication.** This includes production UI primitives, icons, schemas/API contracts, tests, and identifiers—not just feature components. New boundary adapters also preserve source-facing interfaces/names, which should be reviewed. Some internal original brand identifiers/comments and `adyen` response field names remain solely for provenance/contract compatibility; outbound analytics are disabled. The neutral logo fallback contains newly drawn geometry, not the original commercial logo.

No source license grant is asserted by this migration. Confirm the relationship between repository/package licenses and client ownership, then audit dependency licenses and security updates before release. The application is marked private, contains no production credentials or customer fixtures, and has not been pushed, initialized as Git, or deployed.

## Per-file source ledger

| Standalone file | Original repository file | Classification |
| --- | --- | --- |
| [src/features/cart/actions/applyVoucherAction.ts](src/features/cart/actions/applyVoucherAction.ts) | `packages/features/cart/src/actions/applyVoucherAction.ts` | new adapter |
| [src/features/cart/actions/deleteCartAction.ts](src/features/cart/actions/deleteCartAction.ts) | `packages/features/cart/src/actions/deleteCartAction.ts` | new adapter |
| [src/features/cart/actions/removeVoucherAction.ts](src/features/cart/actions/removeVoucherAction.ts) | `packages/features/cart/src/actions/removeVoucherAction.ts` | new adapter |
| [src/features/cart/components/checkout/payment/CartPaymentMethod.client.tsx](src/features/cart/components/checkout/payment/CartPaymentMethod.client.tsx) | `packages/features/cart/src/components/checkout/payment/CartPaymentMethod.client.tsx` | adapted source |
| [src/features/cart/components/checkout/payment/CartPaymentTile.tsx](src/features/cart/components/checkout/payment/CartPaymentTile.tsx) | `packages/features/cart/src/components/checkout/payment/CartPaymentTile.tsx` | adapted source |
| [src/features/cart/components/shopping-cart/CartClient.tsx](src/features/cart/components/shopping-cart/CartClient.tsx) | `packages/features/cart/src/components/shopping-cart/CartClient.tsx` | reused with local imports/formatting |
| [src/features/cart/components/shopping-cart/CartContainer.tsx](src/features/cart/components/shopping-cart/CartContainer.tsx) | `packages/features/cart/src/components/shopping-cart/CartContainer.tsx` | reused with local imports/formatting |
| [src/features/cart/components/shopping-cart/CartPriceSummary.tsx](src/features/cart/components/shopping-cart/CartPriceSummary.tsx) | `packages/features/cart/src/components/shopping-cart/CartPriceSummary.tsx` | reused with local imports/formatting |
| [src/features/cart/components/shopping-cart/CartProductTileCard.tsx](src/features/cart/components/shopping-cart/CartProductTileCard.tsx) | `packages/features/cart/src/components/shopping-cart/CartProductTileCard.tsx` | adapted source |
| [src/features/cart/components/shopping-cart/CartSkeleton.tsx](src/features/cart/components/shopping-cart/CartSkeleton.tsx) | `packages/features/cart/src/components/shopping-cart/CartSkeleton.tsx` | reused with local imports/formatting |
| [src/features/cart/components/shopping-cart/CouponCodeInput.tsx](src/features/cart/components/shopping-cart/CouponCodeInput.tsx) | `packages/features/cart/src/components/shopping-cart/CouponCodeInput.tsx` | adapted source |
| [src/features/cart/components/shopping-cart/EmptyShoppingCart.tsx](src/features/cart/components/shopping-cart/EmptyShoppingCart.tsx) | `packages/features/cart/src/components/shopping-cart/EmptyShoppingCart.tsx` | reused with local imports/formatting |
| [src/features/cart/hooks/mutations/useAddToCartMutation.ts](src/features/cart/hooks/mutations/useAddToCartMutation.ts) | `packages/features/cart/src/hooks/mutations/useAddToCartMutation.ts` | reused with local imports/formatting |
| [src/features/cart/hooks/mutations/useChangeCartEntryQuantity.ts](src/features/cart/hooks/mutations/useChangeCartEntryQuantity.ts) | `packages/features/cart/src/hooks/mutations/useChangeCartEntryQuantity.ts` | reused with local imports/formatting |
| [src/features/cart/hooks/mutations/useCreateOrderMutation.ts](src/features/cart/hooks/mutations/useCreateOrderMutation.ts) | `packages/features/cart/src/hooks/mutations/useCreateOrderMutation.ts` | adapted source |
| [src/features/cart/hooks/mutations/useDeleteCartItemMutation.ts](src/features/cart/hooks/mutations/useDeleteCartItemMutation.ts) | `packages/features/cart/src/hooks/mutations/useDeleteCartItemMutation.ts` | reused with local imports/formatting |
| [src/features/cart/hooks/mutations/useDeleteCartMutation.ts](src/features/cart/hooks/mutations/useDeleteCartMutation.ts) | `packages/features/cart/src/hooks/mutations/useDeleteCartMutation.ts` | reused with local imports/formatting |
| [src/features/cart/hooks/mutations/voucher/useApplyVoucherMutation.ts](src/features/cart/hooks/mutations/voucher/useApplyVoucherMutation.ts) | `packages/features/cart/src/hooks/mutations/voucher/useApplyVoucherMutation.ts` | reused with local imports/formatting |
| [src/features/cart/hooks/mutations/voucher/useRemoveVoucherMutation.ts](src/features/cart/hooks/mutations/voucher/useRemoveVoucherMutation.ts) | `packages/features/cart/src/hooks/mutations/voucher/useRemoveVoucherMutation.ts` | reused with local imports/formatting |
| [src/features/cart/hooks/queries/useCartDetailsQuery.ts](src/features/cart/hooks/queries/useCartDetailsQuery.ts) | `packages/features/cart/src/hooks/queries/useCartDetailsQuery.ts` | adapted source |
| [src/features/cart/hooks/useCartProductTileQuantity.ts](src/features/cart/hooks/useCartProductTileQuantity.ts) | `packages/features/cart/src/hooks/useCartProductTileQuantity.ts` | reused with local imports/formatting |
| [src/features/cart/utils/calculateSubtotal.ts](src/features/cart/utils/calculateSubtotal.ts) | `packages/features/cart/src/utils/calculateSubtotal.ts` | reused with local imports/formatting |
| [src/features/cart/utils/resolveVoucherDiscount.ts](src/features/cart/utils/resolveVoucherDiscount.ts) | `packages/features/cart/src/utils/resolveVoucherDiscount.ts` | reused with local imports/formatting |
| [src/features/feedback/announcer/AnnouncerProvider.tsx](src/features/feedback/announcer/AnnouncerProvider.tsx) | `packages/features/feedback/src/announcer/AnnouncerProvider.tsx` | new adapter |
| [src/features/feedback/toast/showToast.tsx](src/features/feedback/toast/showToast.tsx) | `packages/features/feedback/src/toast/showToast.tsx` | new adapter |
| [src/features/payment-methods/hooks/queries/usePaymentMethodsQuery.ts](src/features/payment-methods/hooks/queries/usePaymentMethodsQuery.ts) | `packages/features/payment-methods/src/hooks/queries/usePaymentMethodsQuery.ts` | reused with local imports/formatting |
| [src/features/payment-methods/utils/getMethods.ts](src/features/payment-methods/utils/getMethods.ts) | `packages/features/payment-methods/src/utils/getMethods.ts` | reused with local imports/formatting |
| [src/features/tracking/cjAffiliate/hooks/useCjCartEvent.ts](src/features/tracking/cjAffiliate/hooks/useCjCartEvent.ts) | `packages/features/tracking/src/cjAffiliate/hooks/useCjCartEvent.ts` | new adapter |
| [src/features/tracking/ecommerce/__tests__/mappers.test.ts](src/features/tracking/ecommerce/__tests__/mappers.test.ts) | `packages/features/tracking/src/ecommerce/__tests__/mappers.test.ts` | reused with local imports/formatting |
| [src/features/tracking/ecommerce/mappers.ts](src/features/tracking/ecommerce/mappers.ts) | `packages/features/tracking/src/ecommerce/mappers.ts` | reused with local imports/formatting |
| [src/features/tracking/ecommerce/sendEcommerceEvent.ts](src/features/tracking/ecommerce/sendEcommerceEvent.ts) | `packages/features/tracking/src/ecommerce/sendEcommerceEvent.ts` | new adapter |
| [src/features/tracking/ecommerce/types.ts](src/features/tracking/ecommerce/types.ts) | `packages/features/tracking/src/ecommerce/types.ts` | reused unchanged |
| [src/features/tracking/ecommerce/useEcommerceEnrichment.ts](src/features/tracking/ecommerce/useEcommerceEnrichment.ts) | `packages/features/tracking/src/ecommerce/useEcommerceEnrichment.ts` | new adapter |
| [src/shared/api/product/addToCart.ts](src/shared/api/product/addToCart.ts) | `packages/core/api/src/product/addToCart.ts` | new adapter |
| [src/shared/cms/atoms/Image.tsx](src/shared/cms/atoms/Image.tsx) | `jss/atoms/src/Image.tsx` | new adapter |
| [src/shared/cms/atoms/Link.tsx](src/shared/cms/atoms/Link.tsx) | `jss/atoms/src/Link.tsx` | new adapter |
| [src/shared/cms/atoms/RichText.tsx](src/shared/cms/atoms/RichText.tsx) | `jss/atoms/src/RichText.tsx` | new adapter |
| [src/shared/cms/types/fields.ts](src/shared/cms/types/fields.ts) | `jss/types/src/fields.ts` | new adapter |
| [src/shared/constants/auth.ts](src/shared/constants/auth.ts) | `packages/core/constants/src/auth.ts` | reused unchanged |
| [src/shared/constants/cart.ts](src/shared/constants/cart.ts) | `packages/core/constants/src/cart.ts` | reused unchanged |
| [src/shared/constants/formValidationRegex.ts](src/shared/constants/formValidationRegex.ts) | `packages/core/constants/src/formValidationRegex.ts` | reused unchanged |
| [src/shared/hooks/useLocaleParts.ts](src/shared/hooks/useLocaleParts.ts) | `packages/core/hooks/src/useLocaleParts.ts` | new adapter |
| [src/shared/hooks/usePrice.ts](src/shared/hooks/usePrice.ts) | `packages/core/hooks/src/usePrice.ts` | new adapter |
| [src/shared/icons/icons/neo-16x16/add-16.tsx](src/shared/icons/icons/neo-16x16/add-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/add-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/arrow-left-16.tsx](src/shared/icons/icons/neo-16x16/arrow-left-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/arrow-left-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/arrow-right-16.tsx](src/shared/icons/icons/neo-16x16/arrow-right-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/arrow-right-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/check-tick-16.tsx](src/shared/icons/icons/neo-16x16/check-tick-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/check-tick-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/check-tick-in-circle-16.tsx](src/shared/icons/icons/neo-16x16/check-tick-in-circle-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/check-tick-in-circle-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/cross-16.tsx](src/shared/icons/icons/neo-16x16/cross-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/cross-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/cross-in-circle-16.tsx](src/shared/icons/icons/neo-16x16/cross-in-circle-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/cross-in-circle-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/discount-coupon-16.tsx](src/shared/icons/icons/neo-16x16/discount-coupon-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/discount-coupon-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/minus-16.tsx](src/shared/icons/icons/neo-16x16/minus-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/minus-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/shipping-costs-track-order-16.tsx](src/shared/icons/icons/neo-16x16/shipping-costs-track-order-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/shipping-costs-track-order-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/shopping-cart-16.tsx](src/shared/icons/icons/neo-16x16/shopping-cart-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/shopping-cart-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-16x16/trash-16.tsx](src/shared/icons/icons/neo-16x16/trash-16.tsx) | `packages/ui/icons/src/icons/neo-16x16/trash-16.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-24x24/cross-24.tsx](src/shared/icons/icons/neo-24x24/cross-24.tsx) | `packages/ui/icons/src/icons/neo-24x24/cross-24.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-24x24/spinner-24.tsx](src/shared/icons/icons/neo-24x24/spinner-24.tsx) | `packages/ui/icons/src/icons/neo-24x24/spinner-24.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/neo-48x48/cross-48.tsx](src/shared/icons/icons/neo-48x48/cross-48.tsx) | `packages/ui/icons/src/icons/neo-48x48/cross-48.tsx` | reused with local imports/formatting |
| [src/shared/icons/icons/social/grohe-logo-filled.tsx](src/shared/icons/icons/social/grohe-logo-filled.tsx) | `packages/ui/icons/src/icons/social/grohe-logo-filled.tsx` | new adapter |
| [src/shared/icons/utils/svg.d.ts](src/shared/icons/utils/svg.d.ts) | `packages/ui/icons/src/utils/svg.d.ts` | reused unchanged |
| [src/shared/icons/utils/withStyles.tsx](src/shared/icons/utils/withStyles.tsx) | `packages/ui/icons/src/utils/withStyles.tsx` | reused with local imports/formatting |
| [src/shared/schemas/Addresses/deliveryAddress.ts](src/shared/schemas/Addresses/deliveryAddress.ts) | `packages/core/schemas/src/Addresses/deliveryAddress.ts` | reused with local imports/formatting |
| [src/shared/schemas/cart.ts](src/shared/schemas/cart.ts) | `packages/core/schemas/src/cart.ts` | reused with local imports/formatting |
| [src/shared/schemas/createOrder.ts](src/shared/schemas/createOrder.ts) | `packages/core/schemas/src/createOrder.ts` | reused unchanged |
| [src/shared/schemas/facet.ts](src/shared/schemas/facet.ts) | `packages/core/schemas/src/facet.ts` | reused unchanged |
| [src/shared/schemas/forms.ts](src/shared/schemas/forms.ts) | `packages/core/schemas/src/forms.ts` | adapted source |
| [src/shared/schemas/orderDetail.ts](src/shared/schemas/orderDetail.ts) | `packages/core/schemas/src/orderDetail.ts` | reused unchanged |
| [src/shared/schemas/paymentMethods.ts](src/shared/schemas/paymentMethods.ts) | `packages/core/schemas/src/paymentMethods.ts` | reused unchanged |
| [src/shared/schemas/product.ts](src/shared/schemas/product.ts) | `packages/core/schemas/src/product.ts` | reused with local imports/formatting |
| [src/shared/schemas/utils/__tests__/compose.test.tsx](src/shared/schemas/utils/__tests__/compose.test.tsx) | `packages/core/schemas/src/utils/__tests__/compose.test.tsx` | reused unchanged |
| [src/shared/schemas/utils/compose.ts](src/shared/schemas/utils/compose.ts) | `packages/core/schemas/src/utils/compose.ts` | reused unchanged |
| [src/shared/schemas/utils/phoneValidation.ts](src/shared/schemas/utils/phoneValidation.ts) | `packages/core/schemas/src/utils/phoneValidation.ts` | reused unchanged |
| [src/shared/schemas/utils/validationUtils.ts](src/shared/schemas/utils/validationUtils.ts) | `packages/core/schemas/src/utils/validationUtils.ts` | reused with local imports/formatting |
| [src/shared/schemas/voucher.ts](src/shared/schemas/voucher.ts) | `packages/core/schemas/src/voucher.ts` | reused with local imports/formatting |
| [src/shared/store/cart/useCheckoutStore.ts](src/shared/store/cart/useCheckoutStore.ts) | `packages/core/store/src/cart/useCheckoutStore.ts` | adapted source |
| [src/shared/ui-shared/components/GeneralErrorAlert.tsx](src/shared/ui-shared/components/GeneralErrorAlert.tsx) | `packages/ui/shared/src/components/GeneralErrorAlert.tsx` | new adapter |
| [src/shared/ui-shared/components/Link.tsx](src/shared/ui-shared/components/Link.tsx) | `packages/ui/shared/src/components/Link.tsx` | new adapter |
| [src/shared/ui-shared/components/Modal.tsx](src/shared/ui-shared/components/Modal.tsx) | `packages/ui/shared/src/components/Modal.tsx` | adapted source |
| [src/shared/ui-shared/components/QuantityInput.tsx](src/shared/ui-shared/components/QuantityInput.tsx) | `packages/ui/shared/src/components/QuantityInput.tsx` | reused with local imports/formatting |
| [src/shared/ui/actions-inputs/Button.tsx](src/shared/ui/actions-inputs/Button.tsx) | `packages/ui/design-system/src/actions-inputs/Button.tsx` | reused with local imports/formatting |
| [src/shared/ui/actions-inputs/ButtonLink.tsx](src/shared/ui/actions-inputs/ButtonLink.tsx) | `packages/ui/design-system/src/actions-inputs/ButtonLink.tsx` | reused with local imports/formatting |
| [src/shared/ui/actions-inputs/Form.tsx](src/shared/ui/actions-inputs/Form.tsx) | `packages/ui/design-system/src/actions-inputs/Form.tsx` | reused with local imports/formatting |
| [src/shared/ui/actions-inputs/Input.tsx](src/shared/ui/actions-inputs/Input.tsx) | `packages/ui/design-system/src/actions-inputs/Input.tsx` | reused with local imports/formatting |
| [src/shared/ui/actions-inputs/Label.tsx](src/shared/ui/actions-inputs/Label.tsx) | `packages/ui/design-system/src/actions-inputs/Label.tsx` | reused with local imports/formatting |
| [src/shared/ui/actions-inputs/RadioGroup.tsx](src/shared/ui/actions-inputs/RadioGroup.tsx) | `packages/ui/design-system/src/actions-inputs/RadioGroup.tsx` | reused with local imports/formatting |
| [src/shared/ui/cards/ProductCard.tsx](src/shared/ui/cards/ProductCard.tsx) | `packages/ui/design-system/src/cards/ProductCard.tsx` | new adapter |
| [src/shared/ui/content/Modal.tsx](src/shared/ui/content/Modal.tsx) | `packages/ui/design-system/src/content/Modal.tsx` | adapted source |
| [src/shared/ui/custom/Heading.tsx](src/shared/ui/custom/Heading.tsx) | `packages/ui/design-system/src/custom/Heading.tsx` | reused unchanged |
| [src/shared/ui/custom/Skeleton.tsx](src/shared/ui/custom/Skeleton.tsx) | `packages/ui/design-system/src/custom/Skeleton.tsx` | reused with local imports/formatting |
| [src/shared/ui/feedback/Alert.tsx](src/shared/ui/feedback/Alert.tsx) | `packages/ui/design-system/src/feedback/Alert.tsx` | reused with local imports/formatting |
| [src/shared/ui/feedback/LoadingSpinner.tsx](src/shared/ui/feedback/LoadingSpinner.tsx) | `packages/ui/design-system/src/feedback/LoadingSpinner.tsx` | reused with local imports/formatting |
| [src/shared/ui/hooks/useCookie.tsx](src/shared/ui/hooks/useCookie.tsx) | `packages/ui/design-system/src/hooks/useCookie.tsx` | reused unchanged |
| [src/shared/utils/cn.ts](src/shared/utils/cn.ts) | `packages/core/utils/src/cn.ts` | reused unchanged |
| [src/shared/utils/formatPriceWithLocale.ts](src/shared/utils/formatPriceWithLocale.ts) | `packages/core/utils/src/formatPriceWithLocale.ts` | reused unchanged |
| [src/shared/utils/roundMoney.ts](src/shared/utils/roundMoney.ts) | `packages/core/utils/src/roundMoney.ts` | reused unchanged |

## Other new source/data/test files

- [e2e/journey.spec.ts](e2e/journey.spec.ts)
- [src/app/api/[...segments]/route.ts](src/app/api/[...segments]/route.ts)
- [src/app/cart/page.tsx](src/app/cart/page.tsx)
- [src/app/checkout/page.tsx](src/app/checkout/page.tsx)
- [src/app/error.tsx](src/app/error.tsx)
- [src/app/globals.css](src/app/globals.css)
- [src/app/layout.tsx](src/app/layout.tsx)
- [src/app/loading.tsx](src/app/loading.tsx)
- [src/app/not-found.tsx](src/app/not-found.tsx)
- [src/app/order/[id]/page.tsx](src/app/order/[id]/page.tsx)
- [src/app/orders/page.tsx](src/app/orders/page.tsx)
- [src/app/page.tsx](src/app/page.tsx)
- [src/app/payment/page.tsx](src/app/payment/page.tsx)
- [src/app/products/[sku]/page.tsx](src/app/products/[sku]/page.tsx)
- [src/app/products/page.tsx](src/app/products/page.tsx)
- [src/app/providers.tsx](src/app/providers.tsx)
- [src/features/catalog/AddToCart.tsx](src/features/catalog/AddToCart.tsx)
- [src/features/catalog/ProductCard.tsx](src/features/catalog/ProductCard.tsx)
- [src/features/checkout/CheckoutForm.tsx](src/features/checkout/CheckoutForm.tsx)
- [src/features/checkout/OrderCompletion.tsx](src/features/checkout/OrderCompletion.tsx)
- [src/features/checkout/schema.ts](src/features/checkout/schema.ts)
- [src/mocks/products.ts](src/mocks/products.ts)
- [src/mocks/translations.json](src/mocks/translations.json)
- [src/shared/feedback.tsx](src/shared/feedback.tsx)
- [src/shared/services/commerce.ts](src/shared/services/commerce.ts)
- [src/shared/services/session.ts](src/shared/services/session.ts)
- [src/tests/api.test.ts](src/tests/api.test.ts)
- [src/tests/commerce.test.ts](src/tests/commerce.test.ts)
- [src/tests/components.test.tsx](src/tests/components.test.tsx)
- [src/tests/setup.ts](src/tests/setup.ts)
