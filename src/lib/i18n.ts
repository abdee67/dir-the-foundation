// Tiny storefront i18n dict (en/ET). Admin stays English per conventions.md.
// Bengali rendering: pair with the `.text-bengali` class on the rendered element.

export type Lang = 'en' | 'ET'

export type StringKey =
  | 'add_to_cart'
  | 'checkout'
  | 'place_order'
  | 'your_cart'
  | 'cart_empty'
  | 'subtotal'
  | 'delivery_charge'
  | 'total'
  | 'advance_payable'
  | 'cash_on_delivery'
  | 'phone'
  | 'name'
  | 'address'
  | 'district'
  | 'track_order'
  | 'order_placed'
  | 'continue_shopping'
  | 'search'
  | 'all_products'
  | 'out_of_stock'
  | 'quantity'
  | 'remove'
  | 'payment_method'
  | 'send_money_instructions'
  | 'transaction_id'
  // Delivery/track-page statuses (src/lib/status.ts DeliveryStatus) — shared across
  // the public /track/[code] page and any storefront delivery-status display.
  | 'pending'
  | 'assigned'
  | 'picked_up'
  | 'in_transit'
  | 'delivered'
  | 'failed'
  | 'returned'

export const STRINGS: Record<StringKey, { en: string; ET: string }> = {
  add_to_cart: { en: 'Add to cart', ET: 'ቅርጫት ውስጥ ይጨምሩ' },
  checkout: { en: 'Checkout', ET: 'ውጣ' },
  place_order: { en: 'Place order', ET: 'ትዕዛዙን አስቀምጥ' },
  your_cart: { en: 'Your cart', ET: 'የእርስዎ ቅርጫት' },
  cart_empty: { en: 'Your cart is empty', ET: 'የለም' },
  subtotal: { en: 'Subtotal', ET: 'ጠቅላላ' },
  delivery_charge: { en: 'Delivery charge', ET: 'የመላክ ክፍያ' },
  total: { en: 'Total', ET: 'ጠቅላላ ክፍያ' },
  advance_payable: { en: 'Advance payable', ET: 'የመጀመሪያ ክፍያ' },
  cash_on_delivery: { en: 'Cash on delivery', ET: 'የገንዘብ ክፍያ በቦታው ' },
  phone: { en: 'Phone number', ET: 'ስልክ ቁጥር' },
  name: { en: 'Name', ET: 'ስም' },
  address: { en: 'Address', ET: 'አድራሻ' },
  district: { en: 'District', ET: 'ክፍለ ከተማ' },
  track_order: { en: 'Track order', ET: 'ትዕዛዙን ይከታተሉ' },
  order_placed: { en: 'Order placed', ET: 'ትዕዛዙ ተቀምጧል' },
  continue_shopping: { en: 'Continue shopping', ET: 'መገበያየት ቀጥል' },
  search: { en: 'Search', ET: 'ፈልግ' },
  all_products: { en: 'All products', ET: 'ሁሉም ምርቶች' },
  out_of_stock: { en: 'Out of stock', ET: 'የለም' },
  quantity: { en: 'Quantity', ET: 'ብዛት' },
  remove: { en: 'Remove', ET: 'አስወግድ' },
  payment_method: { en: 'Payment method', ET: 'የክፍያ ዘዴ' },
  send_money_instructions: { en: 'Send money instructions', ET: 'ገንዘብ የመላክ መመሪያዎች' },
  transaction_id: { en: 'Transaction ID', ET: 'የግብይት መለያ ቁጥር' },
  pending: { en: 'Pending', ET: 'በመጠባበቅ ላይ' },
  assigned: { en: 'Assigned', ET: 'ተመድቧል' },
  picked_up: { en: 'Picked Up', ET: 'ተሰብስቦል' },
  in_transit: { en: 'In Transit', ET: 'በመንገድ ላይ' },
  delivered: { en: 'Delivered', ET: 'ተረክቧል' },
  failed: { en: 'Failed', ET: 'አልተሳካም' },
  returned: { en: 'Returned', ET: 'ተመልሷል' },
}

export function t(key: StringKey, lang: Lang = 'en'): string {
  return STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key
}
