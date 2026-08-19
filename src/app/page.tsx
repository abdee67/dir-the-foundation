import StoreLayout from '@/app/(store)/layout'
import StorefrontHomePage from '@/app/(store)/page'

// Route groups do not wrap this root-level page. Keep the public homepage in
// the same storefront shell as /products, /cart, and /checkout.
export default async function RootPage() {
  return (
    <StoreLayout>
      <StorefrontHomePage />
    </StoreLayout>
  )
}
