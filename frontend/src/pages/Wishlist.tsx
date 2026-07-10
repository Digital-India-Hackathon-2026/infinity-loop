import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  ArrowLeft, Heart, Star, ShoppingBag, MapPin, Trash2, Loader2
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface Product {
  id: number;
  farmer_id: number;
  name: string;
  description: string;
  category: string;
  price: number;
  original_price: number;
  discount: number;
  stock: number;
  unit: string;
  rating: number;
  image_url: string;
  freshness_badge: string;
  organic_badge: boolean;
  government_verified: boolean;
  farmer_name?: string;
  farmer_village?: string;
  farmer_district?: string;
}

const Wishlist: React.FC = () => {
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    setLoading(true);
    try {
      const data = await apiFetch('/api/wishlist');
      setWishlist(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId: number) => {
    try {
      await apiFetch(`/api/wishlist/${productId}`, { method: 'POST' });
      setWishlist(wishlist.filter(p => p.id !== productId));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async (product: Product) => {
    try {
      await apiFetch('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      alert(`Added '${product.name}' to cart!`);
    } catch (err: any) {
      alert(err.message || "Failed to add to cart.");
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <Loader2 className="animate-spin h-8 w-8 text-orange-655" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      
      {/* Navbar */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b dark:border-slate-850">
        <button
          onClick={() => navigate('/customer-dashboard')}
          className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 font-bold transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mandi
        </button>
        <span className="text-xs font-bold text-slate-450 dark:text-slate-400">My Wishlist</span>
        <div className="w-16" />
      </nav>

      {/* Main container */}
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <h2 className="text-xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
          ❤️ My Bookmarked Produce
          <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-450 px-2 py-0.5 rounded-full font-bold">
            {wishlist.length} items
          </span>
        </h2>

        {/* Wishlist grid */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((p) => (
            <div
              key={p.id}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
            >
              {/* Product Cover image */}
              <div className="relative h-44 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                <img
                  src={p.image_url || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=300'}
                  alt={p.name}
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
                
                {/* Trash button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWishlist(p.id);
                  }}
                  className="absolute top-3 right-3 p-2 bg-white/20 hover:bg-white backdrop-blur-md rounded-full shadow-md transition-all cursor-pointer"
                  title="Remove"
                >
                  <Trash2 className="h-4.5 w-4.5 text-white hover:text-red-500 transition-colors" />
                </button>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] text-slate-450 dark:text-slate-405 font-bold uppercase flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{p.farmer_name}</span>
                    <span>•</span>
                    <span>{p.farmer_village}</span>
                  </p>
                  <h4 
                    onClick={() => navigate(`/product/${p.id}`)}
                    className="text-sm font-extrabold text-slate-900 dark:text-white hover:text-orange-655 cursor-pointer"
                  >
                    {p.name}
                  </h4>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-xs font-bold text-amber-505">
                      <Star className="h-4 w-4 fill-amber-500 text-amber-500 mr-0.5" />
                      {p.rating}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-orange-655">₹{p.price}</span>
                      <span className="text-[10px] text-slate-500"> / {p.unit}</span>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleAddToCart(p)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1"
                    >
                      <ShoppingBag className="h-4 w-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>

              </div>

            </div>
          ))}

          {wishlist.length === 0 && (
            <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border rounded-3xl text-slate-400 font-bold">
              <Heart className="h-12 w-12 mx-auto opacity-35 mb-2" />
              <p>Your wishlist is empty.</p>
              <button
                onClick={() => navigate('/customer-dashboard')}
                className="text-xs text-orange-655 font-bold hover:underline mt-2 cursor-pointer"
              >
                Go to Mandi to bookmark items
              </button>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Wishlist;
