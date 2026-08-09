import { redirect } from 'next/navigation';

/**
 * Alias route: /track-order/:id -> /track?code=:id
 * The full tracking UI lives at /track (see order-success + /track pages) —
 * this route just exists so links shaped like /track-order/SHRQ-... also work,
 * without duplicating the tracking logic in two places.
 */
export default function TrackOrderAliasPage({ params }: { params: { id: string } }) {
  redirect(`/track?code=${encodeURIComponent(params.id)}`);
}
