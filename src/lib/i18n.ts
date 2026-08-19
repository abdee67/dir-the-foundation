// Tiny storefront i18n dict (en/am). Admin stays English per conventions.md.
// Bengali rendering: pair with the `.text-bengali` class on the rendered element.

export type Lang = 'en' | 'am'

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

export const STRINGS: Record<StringKey, { en: string; am: string }> = {
  add_to_cart: { en: 'Add to cart', am: 'কার্টে যোগ করুন' },
  checkout: { en: 'Checkout', am: 'চেকআউট' },
  place_order: { en: 'Place order', am: 'অর্ডার করুন' },
  your_cart: { en: 'Your cart', am: 'আপনার কার্ট' },
  cart_empty: { en: 'Your cart is empty', am: 'আপনার কার্ট খালি' },
  subtotal: { en: 'Subtotal', am: 'সাবটোটাল' },
  delivery_charge: { en: 'Delivery charge', am: 'ডেলিভারি চার্জ' },
  total: { en: 'Total', am: 'সর্বমোট' },
  advance_payable: { en: 'Advance payable', am: 'অগ্রিম পরিশোধযোগ্য' },
  cash_on_delivery: { en: 'Cash on delivery', am: 'ক্যাশ অন ডেলিভারি' },
  phone: { en: 'Phone number', am: 'ফোন নম্বর' },
  name: { en: 'Name', am: 'নাম' },
  address: { en: 'Address', am: 'ঠিকানা' },
  district: { en: 'District', am: 'জেলা' },
  track_order: { en: 'Track order', am: 'অর্ডার ট্র্যাক করুন' },
  order_placed: { en: 'Order placed', am: 'অর্ডার সম্পন্ন হয়েছে' },
  continue_shopping: { en: 'Continue shopping', am: 'কেনাকাটা চালিয়ে যান' },
  search: { en: 'Search', am: 'খুঁজুন' },
  all_products: { en: 'All products', am: 'সকল পণ্য' },
  out_of_stock: { en: 'Out of stock', am: 'স্টক নেই' },
  quantity: { en: 'Quantity', am: 'পরিমাণ' },
  remove: { en: 'Remove', am: 'সরান' },
  payment_method: { en: 'Payment method', am: 'পেমেন্ট পদ্ধতি' },
  send_money_instructions: { en: 'Send money instructions', am: 'টাকা পাঠানোর নির্দেশনা' },
  transaction_id: { en: 'Transaction ID', am: 'ট্রানজেকশন আইডি' },
  pending: { en: 'Pending', am: 'অপেক্ষমাণ' },
  assigned: { en: 'Assigned', am: 'বরাদ্দকৃত' },
  picked_up: { en: 'Picked Up', am: 'সংগৃহীত' },
  in_transit: { en: 'In Transit', am: 'পথে আছে' },
  delivered: { en: 'Delivered', am: 'ডেলিভারি সম্পন্ন' },
  failed: { en: 'Failed', am: 'ব্যর্থ' },
  returned: { en: 'Returned', am: 'ফেরত' },
}

export function t(key: StringKey, lang: Lang = 'en'): string {
  return STRINGS[key]?.[lang] ?? STRINGS[key]?.en ?? key
}
