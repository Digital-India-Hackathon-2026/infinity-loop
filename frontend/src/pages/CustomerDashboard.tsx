import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingBag, Search, Filter, Star, Heart, MapPin,
  Award, User, LogOut, Loader2, Sparkles, Bell, Languages
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

const categoriesList = [
  { name: 'All', icon: '🌾' },
  { name: 'Grains', icon: '🌾' },
  { name: 'Pulses', icon: '🫘' },
  { name: 'Fruits', icon: '🍎' },
  { name: 'Vegetables', icon: '🥦' },
  { name: 'Organic', icon: '🍃' }
];

const CustomerDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { name, apiFetch, logout } = useAuth();
  const { t, language, setLanguage } = useLanguage();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [wishlistIds, setWishlistIds] = useState<number[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Filters state
  const [showFilters, setShowFilters] = useState(false);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [organicFilter, setOrganicFilter] = useState<boolean | null>(null);
  const [governmentVerifiedFilter, setGovernmentVerifiedFilter] = useState<boolean | null>(null);

  useEffect(() => {
    fetchProducts();
    fetchWishlist();
    fetchCart();
  }, [selectedCategory, organicFilter, governmentVerifiedFilter]);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const data = await apiFetch('/api/notifications');
      setNotifications(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let url = `/api/marketplace/products?category=${selectedCategory}`;
      if (organicFilter !== null) url += `&organic=${organicFilter}`;
      if (minPrice) url += `&min_price=${minPrice}`;
      if (maxPrice) url += `&max_price=${maxPrice}`;
      
      const data = await apiFetch(url);
      setProducts(data);
    } catch (err: any) {
      console.error("Failed to load products:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const data = await apiFetch('/api/wishlist');
      setWishlistIds(data.map((p: any) => p.id));
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCart = async () => {
    try {
      const data = await apiFetch('/api/cart');
      let totalQty = 0;
      data.items.forEach((item: any) => {
        totalQty += item.quantity;
      });
      setCartCount(totalQty);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProductsSearch();
  };

  const fetchProductsSearch = async () => {
    setLoading(true);
    try {
      let url = `/api/marketplace/products?q=${searchQuery}`;
      const data = await apiFetch(url);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWishlist = async (productId: number) => {
    try {
      const res = await apiFetch(`/api/wishlist/${productId}`, { method: 'POST' });
      if (res.wished) {
        setWishlistIds([...wishlistIds, productId]);
        confetti({ particleCount: 30, spread: 40, colors: ['#ff4b4b'] });
      } else {
        setWishlistIds(wishlistIds.filter(id => id !== productId));
      }
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
      fetchCart();
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
      alert(`Added '${product.name}' to cart!`);
    } catch (err: any) {
      alert(err.message || "Failed to add to cart.");
    }
  };

  const handleBuyNow = async (product: Product) => {
    try {
      await apiFetch('/api/cart/items', {
        method: 'POST',
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });
      navigate('/cart');
    } catch (err: any) {
      alert(err.message || "Failed to buy now.");
    }
  };

  const applyFilters = () => {
    fetchProducts();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setMinPrice('');
    setMaxPrice('');
    setOrganicFilter(null);
    setGovernmentVerifiedFilter(null);
    setSelectedCategory('All');
    setShowFilters(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans pb-16">
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-655 text-white shadow-md">
            <ShoppingBag className="h-5.5 w-5.5" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-orange-600 block">DPI Kisan Mandi</span>
            <span className="text-sm font-extrabold text-slate-900 dark:text-white">Farmer2Customer</span>
          </div>
        </div>

        {/* Search Bar on Header for Desktop */}
        <form onSubmit={handleSearch} className="hidden md:flex items-center bg-slate-100 dark:bg-slate-800 rounded-full px-4 py-2 w-96 border border-slate-200 dark:border-slate-700">
          <input
            type="text"
            placeholder="Search fresh vegetables, rice, grains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-900 dark:text-white"
          />
          <button type="submit" className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Profile, Wishlist, Cart, Logout */}
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/wishlist')}
            className="relative p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer"
          >
            <Heart className="h-4.5 w-4.5 text-red-500 fill-red-500" />
          </button>

          <button 
            onClick={() => navigate('/cart')}
            className="relative p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors cursor-pointer flex items-center justify-center"
          >
            <ShoppingBag className="h-4.5 w-4.5 text-orange-600" />
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full text-[9px] font-extrabold px-1.5 py-0.5 border border-white">
                {cartCount}
              </span>
            )}
          </button>

          {/* Notification Bell Badge */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors border-none flex items-center justify-center cursor-pointer text-slate-600 dark:text-slate-400"
            >
              <Bell className="h-4.5 w-4.5" />
              {notifications.filter(n => !n.is_read).length > 0 && (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-red-500 rounded-full text-[8px] font-bold text-white flex items-center justify-center">
                  {notifications.filter(n => !n.is_read).length}
                </span>
              )}
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2 rounded-2xl shadow-xl z-50 text-slate-700 dark:text-slate-200 max-h-80 overflow-y-auto">
                <div className="text-xs font-bold text-slate-450 p-2 border-b dark:border-slate-800 uppercase tracking-wider">Notifications</div>
                {notifications.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-4">No notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div 
                      key={n.id} 
                      onClick={async () => {
                        if (!n.is_read) {
                          try {
                            await apiFetch(`/api/notifications/${n.id}/read`, { method: 'POST' });
                            setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
                          } catch (e) {
                            console.error(e);
                          }
                        }
                      }}
                      className={`p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer border-b border-slate-50 dark:border-slate-800 last:border-none flex gap-2 ${!n.is_read ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : ''}`}
                    >
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-200 flex justify-between">
                          <span>{n.title}</span>
                          {!n.is_read && <span className="h-1.5 w-1.5 bg-emerald-600 rounded-full mt-1.5" />}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{n.message}</div>
                        <div className="text-[8px] text-slate-400 dark:text-slate-500 font-mono mt-1">{new Date(n.created_at).toLocaleString()}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Languages Selector */}
          <div className="relative group">
            <button className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-full text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-300">
              <Languages className="h-3.5 w-3.5 text-emerald-600" />
              <span className="uppercase">{language}</span>
            </button>
            <div className="absolute right-0 mt-1 hidden w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-lg shadow-lg group-hover:block z-50">
              {['en', 'te', 'hi'].map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l as any)}
                  className="w-full text-left px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-805 text-slate-705 dark:text-slate-300 rounded-md bg-transparent border-none cursor-pointer"
                >
                  {l === 'en' ? 'English' : l === 'te' ? 'తెలుగు' : 'हिंदी'}
                </button>
              ))}
            </div>
          </div>

          <button 
            onClick={() => navigate('/customer-profile')}
            className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-full text-xs font-bold border border-slate-200 dark:border-slate-700 hover:bg-slate-200 cursor-pointer"
          >
            <User className="h-4 w-4 text-slate-500" />
            <span className="hidden sm:inline">{name || 'Customer'}</span>
          </button>

          <button 
            onClick={logout}
            className="p-2 bg-red-50 dark:bg-red-950/20 text-red-650 hover:bg-red-100 rounded-full transition-all cursor-pointer border-none flex items-center justify-center"
            title="Log Out"
          >
          </button>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        
        {/* Banner Section */}
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-orange-500 to-amber-500 p-8 sm:p-12 text-white shadow-lg">
          <div className="absolute right-0 bottom-0 opacity-20 pointer-events-none">
            <ShoppingBag className="h-64 w-64" />
          </div>
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="inline-block bg-white/20 backdrop-blur-md px-3.5 py-1 rounded-full text-[10px] font-extrabold tracking-wider uppercase">Direct Farmer Trade</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">Buy Fresh, Eat Organic, Support Farmers</h1>
            <p className="text-xs sm:text-sm text-white/95 font-medium leading-relaxed">
              Skip the middlemen. Order fresh produce directly from state-verified digital farmers. Delivered to your doorstep with real-time GPS tracking.
            </p>
            <div className="flex gap-3 pt-2">
              <button 
                onClick={() => setSelectedCategory('Organic')} 
                className="bg-white text-orange-600 px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md hover:bg-orange-50 transition-all flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="h-4.5 w-4.5" />
                Shop Organic Produce
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="flex md:hidden items-center bg-white dark:bg-slate-900 rounded-2xl px-4 py-3 border border-slate-200 dark:border-slate-800 shadow-sm">
          <input
            type="text"
            placeholder="Search fresh vegetables, rice, grains..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none text-xs focus:outline-none w-full text-slate-900 dark:text-white"
          />
          <button type="submit" className="text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer">
            <Search className="h-4 w-4" />
          </button>
        </form>

        {/* Categories Bar */}
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider">Mandi Categories</h3>
          <div className="flex items-center gap-3 overflow-x-auto pb-2">
            {categoriesList.map((cat) => (
              <button
                key={cat.name}
                onClick={() => setSelectedCategory(cat.name)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-xs font-bold whitespace-nowrap transition-all shadow-sm cursor-pointer ${
                  selectedCategory === cat.name
                    ? 'bg-orange-600 border-orange-655 text-white'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-850 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                }`}
              >
                <span>{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Filter Controls Header */}
        <div className="flex justify-between items-center border-b pb-4 mb-2">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              🌾 Available Produce
              <span className="text-xs bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                {products.length} Items
              </span>
            </h3>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold bg-white dark:bg-slate-900 hover:bg-slate-50 cursor-pointer"
            >
              <Filter className="h-4 w-4 text-slate-500" />
              Filters
            </button>
          </div>
        </div>

        {/* Filters Panel dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-white dark:bg-slate-900 border rounded-2xl p-6 shadow-md overflow-hidden grid gap-6 sm:grid-cols-3"
            >
              {/* Price filter */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Price Range (₹)</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    placeholder="Min"
                    value={minPrice}
                    onChange={(e) => setMinPrice(e.target.value)}
                    className="w-full text-xs font-semibold py-2 px-3 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="number"
                    placeholder="Max"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    className="w-full text-xs font-semibold py-2 px-3 border rounded-xl bg-slate-50 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Organic filter */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Organic Farming</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setOrganicFilter(organicFilter === true ? null : true)}
                    className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                      organicFilter === true ? 'bg-orange-50 text-orange-655 border-orange-200' : 'bg-slate-50 text-slate-600'
                    }`}
                  >
                    Yes (Organic Only)
                  </button>
                </div>
              </div>

              {/* Government verified filter */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wide text-slate-500">Actions</label>
                <div className="flex gap-2">
                  <button
                    onClick={applyFilters}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-2.5 rounded-xl shadow-md transition-all cursor-pointer"
                  >
                    Apply Filters
                  </button>
                  <button
                    onClick={clearFilters}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading Spinner */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
            <p className="text-xs text-slate-500 font-semibold">Loading mandi produce...</p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => {
              const isWished = wishlistIds.includes(p.id);
              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all hover:translate-y-[-2px] flex flex-col justify-between group"
                >
                  {/* Image, Badges, Heart Button */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                    <img
                      src={p.image_url || 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&q=80&w=400'}
                      alt={p.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                    {/* Freshness Badge */}
                    <span className="absolute top-3 left-3 bg-emerald-600 border border-emerald-500/20 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm">
                      ✨ {p.freshness_badge}
                    </span>

                    {/* Government Verified Badge */}
                    {p.government_verified && (
                      <span className="absolute top-3 right-3 bg-blue-600 border border-blue-500/20 text-white text-[9px] font-extrabold uppercase px-2.5 py-1 rounded-full shadow-sm flex items-center gap-1">
                        <Award className="h-3.5 w-3.5" />
                        Verified
                      </span>
                    )}

                    {/* Organic Badge */}
                    {p.organic_badge && (
                      <span className="absolute bottom-3 left-3 bg-teal-600 border border-teal-500/20 text-white text-[8px] font-extrabold uppercase px-2 py-0.5 rounded shadow-sm">
                        🍃 Organic
                      </span>
                    )}

                    {/* Heart Button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleWishlist(p.id);
                      }}
                      className="absolute bottom-3 right-3 p-2 bg-white/30 hover:bg-white backdrop-blur-md rounded-full shadow-md transition-all cursor-pointer group/btn"
                    >
                      <Heart className={`h-4.5 w-4.5 ${isWished ? 'text-red-500 fill-red-500' : 'text-white group-hover/btn:text-red-500'}`} />
                    </button>
                  </div>

                  {/* Card Body */}
                  <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                    <div className="space-y-1">
                      {/* Farmer Details */}
                      <p className="text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{p.farmer_name || 'Farmer'}</span>
                        <span>•</span>
                        <span className="underline">{p.farmer_village}, {p.farmer_district}</span>
                      </p>
                      {/* Product Name */}
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-white hover:text-orange-655 transition-colors cursor-pointer" onClick={() => navigate(`/product/${p.id}`)}>
                        {p.name}
                      </h4>
                      {/* Description */}
                      <p className="text-xs text-slate-500 leading-snug line-clamp-2">
                        {p.description || 'No description available for this farm-fresh produce.'}
                      </p>
                    </div>

                    {/* Rating and Price */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span>{p.rating} / 5</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[9px] text-slate-400 line-through mr-1 font-bold">₹{p.original_price}</span>
                          <span className="text-sm font-extrabold text-orange-655">₹{p.price}</span>
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold"> / {p.unit}</span>
                        </div>
                      </div>

                      {/* Stock availability indicator */}
                      <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-slate-400 font-bold">
                        <span>Stock Available:</span>
                        <span className={p.stock > 10 ? 'text-emerald-650' : 'text-red-500 animate-pulse'}>
                          {p.stock} {p.unit}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2 pt-1.5">
                        <button
                          onClick={() => handleAddToCart(p)}
                          className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-orange-50 dark:hover:bg-orange-950/20 text-slate-700 dark:text-slate-200 hover:text-orange-655 border border-slate-200 dark:border-slate-750 text-xs font-extrabold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Add to Cart
                        </button>
                        <button
                          onClick={() => handleBuyNow(p)}
                          className="flex-1 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold py-2 rounded-xl transition-all shadow-md cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          Buy Now
                        </button>
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}

            {products.length === 0 && (
              <div className="col-span-full text-center py-20 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-3xl text-slate-405">
                <ShoppingBag className="h-12 w-12 mx-auto opacity-30 mb-2" />
                <p className="text-xs font-bold">No produce matches your search or filters.</p>
                <button onClick={clearFilters} className="text-xs text-orange-655 font-bold hover:underline mt-2 cursor-pointer">
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default CustomerDashboard;
