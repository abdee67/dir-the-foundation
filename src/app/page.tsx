import StoreLayout from '@/app/(store)/layout'
import { StorefrontHomePage } from '@/modules/storefront/storefront-home-page'

export const dynamic = 'force-dynamic'

// Route groups do not wrap this root-level page. The storefront content is a
// shared component so `/` has a single App Router page definition.
export default async function RootPage() {
  return (
    <StoreLayout>
      <StorefrontHomePage />
    </StoreLayout>
  )
}
