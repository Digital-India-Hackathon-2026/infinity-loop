import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  Star, Heart, MapPin, Award, Calendar, ArrowLeft,
  Truck, ShieldCheck, Send
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
  harvest_date: string;
  freshness_badge: string;
  organic_badge: boolean;
  government_verified: boolean;
  farmer_name?: string;
  farmer_village?: string;
  farmer_district?: string;
}

interface Review {
  id: number;
  product_id: number;
  customer_id: number;
  rating: number;
  comment: string;
  created_at: string;
  customer_name?: string;
}

const ProductDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { apiFetch } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [isWished, setIsWished] = useState(false);

  // Review submission form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchReviews();
    checkWishlist();
  }, [id]);

  const fetchProductDetails = async () => {
    try {
      const data = await apiFetch(`/api/marketplace/products/${id}`);
      setProduct(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReviews = async () => {
    try {
      const data = await apiFetch(`/api/marketplace/products/${id}/reviews`);
      setReviews(data);
    } catch (err) {
      console.error(err);
    }
  };

  const checkWishlist = async () => {
    try {
      const data = await apiFetch('/api/wishlist');
      const inWish = data.some((p: any) => p.id === Number(id));
      setIsWished(inWish);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
    try {
      const res = await apiFetch(`/api/wishlist/${product.id}`, { method: 'POST' });
      setIsWished(res.wished);
      if (res.wished) {
        confetti({ particleCount: 30, spread: 40, colors: ['#ff4b4b'] });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
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

  const handleBuyNow = async () => {
    if (!product) return;
    try {
      await apiFetch('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });
      navigate('/cart');
    } catch (err: any) {
      alert(err.message || "Failed to proceed to cart.");
    }
  };

  const handlePostReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    setSubmittingReview(true);
    try {
      await apiFetch(`/api/marketplace/products/${product.id}/reviews`, {
        method: 'POST',
        body: JSON.stringify({ rating: newRating, comment: newComment })
      });
      setNewComment('');
      setNewRating(5);
      fetchReviews();
      fetchProductDetails(); // refresh overall rating
      alert("Review posted successfully!");
    } catch (err: any) {
      alert(err.message || "Failed to post review.");
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin h-8 w-8 border-4 border-orange-655 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-slate-500">
        <p className="text-sm font-bold">Product not found.</p>
        <button onClick={() => navigate('/customer-dashboard')} className="text-xs text-orange-655 font-bold hover:underline mt-2">
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 pb-16">
      
      {/* Detail Header / Nav */}
      <nav className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-30 px-6 py-4 flex items-center justify-between border-b dark:border-slate-800">
        <button
          onClick={() => navigate('/customer-dashboard')}
          className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors font-bold cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Mandi
        </button>
        <span className="text-xs font-bold text-slate-450 dark:text-slate-400">Product Details</span>
        <div className="w-16" />
      </nav>

      {/* Main product wrapper */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid gap-8 md:grid-cols-12">
        
        {/* Left Column: Image Card */}
        <div className="md:col-span-6 space-y-4">
          <div className="relative rounded-3xl overflow-hidden bg-white border border-slate-200 shadow-sm aspect-square max-h-[480px]">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=480'}
              alt={product.name}
              className="h-full w-full object-cover"
            />
            {product.organic_badge && (
              <span className="absolute top-4 left-4 bg-teal-600 border border-teal-500/20 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md">
                🍃 100% Organic
              </span>
            )}
            {product.government_verified && (
              <span className="absolute top-4 right-4 bg-blue-600 border border-blue-500/20 text-white text-[10px] font-extrabold uppercase px-3 py-1 rounded-full shadow-md flex items-center gap-1">
                <Award className="h-4 w-4" />
                Govt Verified
              </span>
            )}
          </div>
        </div>

        {/* Right Column: Descriptions & Actions */}
        <div className="md:col-span-6 space-y-6">
          <div className="space-y-2">
            <span className="inline-block bg-orange-100 dark:bg-orange-950/30 text-orange-655 text-[9px] font-extrabold uppercase px-3 py-1 rounded-full">
              {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              {product.name}
            </h1>

            {/* Farmer Location & Verification */}
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
              <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
              <span>By Farmer: <b>{product.farmer_name}</b></span>
              <span>•</span>
              <span className="underline">{product.farmer_village}, {product.farmer_district}</span>
            </div>

            {/* Ratings and Reviews Summary */}
            <div className="flex items-center gap-2 pt-1">
              <div className="flex items-center text-amber-500 gap-0.5">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`h-4 w-4 ${i < Math.round(product.rating) ? 'fill-amber-500 text-amber-500' : 'text-slate-300 dark:text-slate-700'}`} 
                  />
                ))}
              </div>
              <span className="text-xs font-extrabold text-slate-700 dark:text-slate-300">
                {product.rating} / 5 ({reviews.length} Customer Reviews)
              </span>
            </div>
          </div>

          <hr className="border-slate-200 dark:border-slate-800" />

          {/* Pricing Card */}
          <div className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-3">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-orange-655">₹{product.price}</span>
              <span className="text-xs text-slate-400 line-through">₹{product.original_price}</span>
              <span className="text-xs text-emerald-650 font-extrabold">({product.discount}% OFF)</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold"> per {product.unit}</span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold border-t pt-3">
              <span>Freshness Badge:</span>
              <span className="bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-900/50">
                {product.freshness_badge}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 font-bold">
              <span>Stock Status:</span>
              <span className={product.stock > 0 ? 'text-emerald-600' : 'text-red-500 animate-pulse'}>
                {product.stock > 0 ? `${product.stock} ${product.unit} Available` : 'Out of Stock'}
              </span>
            </div>

            {/* Delivery estimate */}
            <div className="flex items-center gap-2.5 text-xs text-slate-500 dark:text-slate-400 border-t pt-3 font-semibold">
              <Truck className="h-4.5 w-4.5 text-orange-600" />
              <span>Delivery Estimate: <b>Express Delivery in 45 mins</b></span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="flex-1 bg-slate-100 hover:bg-orange-50 dark:bg-slate-800 dark:hover:bg-orange-950/25 border text-slate-750 dark:text-slate-200 hover:text-orange-655 text-xs font-extrabold py-3 rounded-2xl transition-all disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Add to Cart
              </button>
              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-3 rounded-2xl transition-all shadow-md disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
              >
                Buy Now
              </button>
              <button
                onClick={handleToggleWishlist}
                className="p-3 border rounded-2xl bg-white hover:bg-slate-50 transition-all cursor-pointer shadow-sm"
              >
                <Heart className={`h-5 w-5 ${isWished ? 'text-red-500 fill-red-500' : 'text-slate-400'}`} />
              </button>
            </div>
          </div>

          {/* Description & Harvest info */}
          <div className="space-y-3">
            <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Product Info</h3>
            <p className="text-xs text-slate-550 dark:text-slate-400 leading-relaxed font-medium">
              {product.description || 'No description provided by the farmer. Rest assured, all agricultural listings on our DPI portal undergo verification checks for local moisture, weight, and harvesting schedules.'}
            </p>

            <div className="grid grid-cols-2 gap-4 bg-slate-100/50 dark:bg-slate-900/50 p-4 rounded-2xl border text-xs font-semibold">
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Harvest Date</p>
                <p className="text-slate-800 dark:text-white flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-orange-600" />
                  {product.harvest_date || 'N/A'}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Government Support</p>
                <p className="text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-4.5 w-4.5" />
                  Kisan DBT Verified
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Ratings & Reviews block */}
      <div className="max-w-6xl mx-auto px-6 py-8 border-t dark:border-slate-850 mt-8 grid gap-8 md:grid-cols-12">
        {/* Left Column: Post a Review */}
        <div className="md:col-span-5 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Write a Review</h3>
          <form onSubmit={handlePostReview} className="bg-white dark:bg-slate-900 border rounded-3xl p-6 shadow-sm space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Rating</label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 hover:scale-110 transition-transform cursor-pointer"
                  >
                    <Star 
                      className={`h-6 w-6 ${star <= newRating ? 'fill-amber-500 text-amber-500' : 'text-slate-350 dark:text-slate-700'}`} 
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">Comment</label>
              <textarea
                rows={3}
                required
                placeholder="Share your experience with this farmer's produce..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="w-full flex items-center justify-center gap-2 bg-orange-655 hover:bg-orange-700 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-md disabled:opacity-50 transition-all cursor-pointer"
            >
              <Send className="h-4 w-4" />
              Post Review
            </button>
          </form>
        </div>

        {/* Right Column: Reviews List */}
        <div className="md:col-span-7 space-y-4">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Reviews & Ratings</h3>
          
          <div className="space-y-4">
            {reviews.map((rev) => (
              <div key={rev.id} className="bg-white dark:bg-slate-900 border rounded-2xl p-5 shadow-sm space-y-2">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-extrabold text-slate-500">
                      {rev.customer_name?.[0] || 'C'}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-white">{rev.customer_name || 'Customer'}</h4>
                      <p className="text-[9px] text-slate-400 font-semibold">{new Date(rev.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  <div className="flex text-amber-500">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i} 
                        className={`h-3.5 w-3.5 ${i < rev.rating ? 'fill-amber-500 text-amber-500' : 'text-slate-200 dark:text-slate-800'}`} 
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-650 dark:text-slate-350 leading-relaxed font-semibold">
                  {rev.comment}
                </p>
              </div>
            ))}

            {reviews.length === 0 && (
              <div className="text-center py-10 bg-white dark:bg-slate-900 border rounded-2xl text-slate-405 font-bold">
                No reviews yet. Be the first to review this product!
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};

export default ProductDetails;
