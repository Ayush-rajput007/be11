import React, { useState, useEffect } from 'react';
import { api } from '../lib/api.js';
import { useAuthStore } from '../store/authStore.js';
import { formatCurrency } from '@be11/shared';
import { useNavigate, useSearchParams } from 'react-router-dom';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  sport: string;
  stock: number;
}

export const KitBuilder: React.FC = () => {
  const { isAuthenticated, user, updateWalletBalance } = useAuthStore();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  // Load type from URL query if exists
  const initialType = searchParams.get('type') || 'custom';

  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>(
    initialType === 'starter' || initialType === 'pro' ? 'preset' : 'custom'
  );
  
  const [selectedPreset, setSelectedPreset] = useState<'starter' | 'intermediate' | 'pro'>(
    initialType === 'pro' ? 'pro' : 'starter'
  );

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Custom kit items: category -> selected Product mapping
  const [customKit, setCustomKit] = useState<Record<string, Product | null>>({
    BATS: null,
    BALLS: null,
    GLOVES: null,
    PADS: null,
  });

  const categories = [
    { key: 'BATS', label: 'Cricket Bat' },
    { key: 'BALLS', label: 'Cricket Ball' },
    { key: 'GLOVES', label: 'Batting Gloves' },
    { key: 'PADS', label: 'Batting Pads' },
  ];

  // Preset configuration details
  const presets = {
    starter: {
      name: 'Beginner Starter Kit',
      price: 5499.0,
      description: 'Excellent Kashmir willow bat, club-grade leather ball, and starter batting protective wear.',
      items: [
        { name: 'Kashmir Willow Beginner Bat', category: 'BATS', price: 3499.0 },
        { name: 'Practice Leather Ball', category: 'BALLS', price: 300.0 },
        { name: 'Starter Batting Gloves', category: 'GLOVES', price: 700.0 },
        { name: 'Starter Protection Pads', category: 'PADS', price: 1000.0 }
      ]
    },
    intermediate: {
      name: 'Intermediate Performance Kit',
      price: 8999.0,
      description: 'Grade 3 English willow bat, match-grade seam ball, leather gloves, and shock-absorbent pads.',
      items: [
        { name: 'Performance Willow Bat', category: 'BATS', price: 5499.0 },
        { name: 'Club Seam Leather Ball', category: 'BALLS', price: 400.0 },
        { name: 'Club Comfort Gloves', category: 'GLOVES', price: 1100.0 },
        { name: 'Impact Guard Pads', category: 'PADS', price: 2000.0 }
      ]
    },
    pro: {
      name: 'Elite Professional Kit',
      price: 14999.0,
      description: 'Top-tier Grade 1 English willow bat, professional alum-tanned leather ball, and elite protective gear bundle.',
      items: [
        { name: 'be11 English Willow Bat', category: 'BATS', price: 9499.0 },
        { name: 'be11 Leather Seam Ball', category: 'BALLS', price: 499.0 },
        { name: 'be11 Professional Batting Gloves', category: 'GLOVES', price: 1299.0 },
        { name: 'be11 Pro Batting Pads', category: 'PADS', price: 2499.0 },
        { name: 'be11 Wheeled Pro Kitbag', category: 'BAGS', price: 1202.0 }
      ]
    }
  };

  const fetchCricketProducts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/shop/products', { params: { sport: 'Cricket' } });
      setProducts(res.data.data.products);
      
      // Seed default items in custom kit
      const pList: Product[] = res.data.data.products;
      const initialCustom: Record<string, Product | null> = {};
      categories.forEach((cat) => {
        const matching = pList.find((p) => p.category === cat.key);
        initialCustom[cat.key] = matching || null;
      });
      setCustomKit(initialCustom);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCricketProducts();
  }, []);

  const getCustomKitPrice = () => {
    return Object.values(customKit).reduce((sum, item) => sum + (item?.price || 0), 0);
  };

  const handleSelectCustomItem = (category: string, product: Product) => {
    setCustomKit((prev) => ({
      ...prev,
      [category]: product,
    }));
  };

  const handleCheckout = async () => {
    if (!isAuthenticated) {
      alert('Please log in from the top account dropdown first.');
      return;
    }

    const price = activeTab === 'preset' ? presets[selectedPreset].price : getCustomKitPrice();

    if (user && user.walletBalance < price) {
      alert(`Insufficient balance. Order total is ${formatCurrency(price)}, but your wallet has ${formatCurrency(user.walletBalance)}.`);
      return;
    }

    setCheckoutLoading(true);
    setSuccessMsg('');

    try {
      let orderItems: any[] = [];
      if (activeTab === 'preset') {
        const pres = presets[selectedPreset];
        orderItems = [
          {
            productId: `kit-preset-${selectedPreset}`,
            name: `${pres.name} Bundle`,
            price: pres.price,
            quantity: 1,
            customDesign: { preset: selectedPreset },
          },
        ];
      } else {
        // Collect custom items
        orderItems = Object.entries(customKit)
          .filter(([_, prod]) => prod !== null)
          .map(([_, prod]) => ({
            productId: prod!.id,
            name: prod!.name,
            price: prod!.price,
            quantity: 1,
          }));
      }

      await api.post('/shop/orders', {
        items: orderItems,
        totalPrice: price,
      });

      if (user) {
        updateWalletBalance(user.walletBalance - price);
      }

      setSuccessMsg('Cricket kit successfully ordered! Payment deducted from your wallet.');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data?.message || 'Kit checkout failed.');
    } finally {
      setCheckoutLoading(false);
    }
  };

  return (
    <div className="pt-24 min-h-screen bg-surface-container-low pb-16 text-left font-body-md">
      <div className="max-w-7xl mx-auto px-container-padding">
        {/* Headers */}
        <div className="mb-8">
          <h1 className="font-poppins font-black text-3xl text-primary flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary text-3xl">sports_cricket</span>
            Cricket Kit Builder
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Build your personalized cricket bundle or choose from our expert curated equipment kits.
          </p>
        </div>

        {successMsg && (
          <div className="bg-on-tertiary-container/10 text-on-tertiary-container p-5 rounded-24 text-sm font-semibold mb-6 flex items-center gap-3">
            <span className="material-symbols-outlined text-green-600">check_circle</span>
            {successMsg}
          </div>
        )}

        {/* Tab switchers */}
        <div className="flex bg-[#EDF2F7] p-1.5 rounded-2xl w-full md:w-fit mb-8">
          <button
            onClick={() => setActiveTab('preset')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'preset' ? 'bg-primary text-white shadow-sm' : 'text-primary'
            }`}
          >
            Curated Expert Kits
          </button>
          <button
            onClick={() => setActiveTab('custom')}
            className={`flex-1 md:flex-none px-6 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'custom' ? 'bg-primary text-white shadow-sm' : 'text-primary'
            }`}
          >
            Custom Kit Builder
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Main Selection Area */}
          <div className="lg:col-span-2 space-y-8">
            {activeTab === 'preset' ? (
              /* Preset Selection Cards */
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {(Object.keys(presets) as Array<'starter' | 'intermediate' | 'pro'>).map((key) => {
                  const pres = presets[key];
                  const isSelected = selectedPreset === key;
                  return (
                    <div
                      key={key}
                      onClick={() => setSelectedPreset(key)}
                      className={`bg-white rounded-24 p-6 border transition-all cursor-pointer hover:shadow-md flex flex-col justify-between ${
                        isSelected
                          ? 'border-secondary ring-2 ring-secondary/20 shadow-sm scale-[1.02]'
                          : 'border-outline-variant/30 hover:scale-[1.01]'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                            key === 'pro'
                              ? 'bg-red-100 text-red-700'
                              : key === 'intermediate'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-green-100 text-green-700'
                          }`}>
                            {key}
                          </span>
                          {isSelected && (
                            <span className="material-symbols-outlined text-secondary text-sm">check_circle</span>
                          )}
                        </div>
                        <h3 className="font-poppins font-bold text-base text-primary mb-2">{pres.name}</h3>
                        <p className="text-outline text-xs leading-relaxed mb-6">{pres.description}</p>
                      </div>

                      <div className="pt-4 border-t">
                        <span className="text-[9px] text-outline uppercase tracking-wider block font-bold">Bundle Price</span>
                        <span className="font-poppins font-black text-lg text-primary">{formatCurrency(pres.price)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Custom Builder Lists */
              <div className="space-y-6">
                {categories.map((cat) => {
                  const selectedProduct = customKit[cat.key];
                  const categoryProducts = products.filter((p) => p.category === cat.key);

                  return (
                    <div key={cat.key} className="bg-white rounded-24 p-6 border border-outline-variant/30 shadow-sm">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-poppins font-bold text-sm text-primary uppercase tracking-wider">
                          Choose {cat.label}
                        </h3>
                        {selectedProduct && (
                          <span className="text-xs font-bold text-secondary">{selectedProduct.name}</span>
                        )}
                      </div>

                      {loading ? (
                        <div className="text-xs text-outline">Loading catalog gear...</div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {categoryProducts.map((p) => {
                            const isChosen = selectedProduct?.id === p.id;
                            return (
                              <div
                                key={p.id}
                                onClick={() => handleSelectCustomItem(cat.key, p)}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer ${
                                  isChosen
                                    ? 'border-secondary bg-secondary/5 font-bold'
                                    : 'border-outline-variant/20 hover:bg-[#F8FAFC]'
                                }`}
                              >
                                <img
                                  src={p.image}
                                  alt={p.name}
                                  className="w-12 h-12 object-cover rounded-lg border bg-gray-50 flex-shrink-0"
                                />
                                <div className="min-w-0 flex-grow text-left">
                                  <h4 className="text-xs text-primary truncate font-bold">{p.name}</h4>
                                  <span className="text-[11px] text-[#138808] font-bold mt-0.5 block">
                                    {formatCurrency(p.price)}
                                  </span>
                                </div>
                                {isChosen && (
                                  <span className="material-symbols-outlined text-secondary text-sm flex-shrink-0">check</span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Invoice summary checkout panel */}
          <div className="bg-white rounded-24 p-8 border border-outline-variant/30 shadow-sm h-fit space-y-6">
            <h3 className="font-poppins font-bold text-lg text-primary border-b pb-2">Order Summary</h3>

            {activeTab === 'preset' ? (
              /* Preset Invoice details */
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-on-surface-variant font-medium">Selected Bundle:</span>
                  <span className="text-primary font-bold">{presets[selectedPreset].name}</span>
                </div>
                <div className="text-xs text-outline leading-relaxed border-b pb-4">
                  Includes:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {presets[selectedPreset].items.map((item, idx) => (
                      <li key={idx}>
                        {item.name} ({formatCurrency(item.price)})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : (
              /* Custom Invoice details */
              <div className="space-y-4">
                <span className="text-[10px] text-outline uppercase tracking-wider block font-bold border-b pb-1">
                  Custom Selections
                </span>
                <div className="space-y-3 text-xs border-b pb-4">
                  {categories.map((cat) => {
                    const item = customKit[cat.key];
                    return (
                      <div key={cat.key} className="flex justify-between items-center">
                        <span className="text-outline font-medium">{cat.label}:</span>
                        <span className="text-primary font-semibold text-right max-w-[180px] truncate">
                          {item ? `${item.name} (${formatCurrency(item.price)})` : 'None'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-primary">Grand Total</span>
              <span className="font-poppins font-black text-xl text-[#138808]">
                {formatCurrency(
                  activeTab === 'preset' ? presets[selectedPreset].price : getCustomKitPrice()
                )}
              </span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              className="w-full py-4 bg-secondary-container hover:bg-[#e07f24] text-white rounded-xl font-label-bold text-xs uppercase tracking-wider shadow-md transition-all cursor-pointer text-center block btn-primary-premium animate-button-shine"
            >
              {checkoutLoading ? 'Processing Checkout...' : 'Purchase and Pay'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KitBuilder;
