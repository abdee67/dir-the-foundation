import { redirect } from 'next/navigation'

/** Homepage promotional blocks, including banners, are managed in CMS. */
export default function BannerManagementPage() { redirect('/admin/cms/pages') }
