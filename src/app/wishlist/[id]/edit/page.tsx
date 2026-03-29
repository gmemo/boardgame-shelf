import { useParams, Navigate } from 'react-router-dom';
import { useWishlistStore } from '../../../../stores';
import WishlistItemForm from '../../../../components/wishlist-item-form';

export default function WishlistEditPage() {
  const { id } = useParams<{ id: string }>();
  const { items } = useWishlistStore();
  const item = items.find((i) => i.id === id);

  if (!item) return <Navigate to="/wishlist" replace />;

  return <WishlistItemForm item={item} />;
}
