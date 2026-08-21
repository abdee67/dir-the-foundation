import StoreLayout from '@/app/(store)/layout'
import { TeaserExperience } from '@/modules/drops/components/teaser-experience'
import { TeaserUnavailable } from '@/modules/drops/components/teaser-unavailable'
import { resolvePublicDrop } from '@/modules/drops/public'
import { StorefrontHomePage } from '@/modules/storefront/storefront-home-page'
import { getSingleStoreOrg } from '@/lib/store-org'

export const dynamic = 'force-dynamic'

// Route groups do not wrap this root-level page. The storefront content is a
// shared component so `/` has a single App Router page definition.
export default async function RootPage() {
  const org = await getSingleStoreOrg()
  const drop = await resolvePublicDrop(org.id)

  if (drop.state === 'teaser') {
    return <TeaserExperience dropId={drop.drop.id} endsAt={drop.drop.endsAt} heroImage={drop.drop.heroImage} />
  }

  if (drop.state === 'unavailable') return <TeaserUnavailable />

  return (
    <StoreLayout>
      <StorefrontHomePage />
    </StoreLayout>
  )
}
