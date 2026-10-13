/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import toast from "react-hot-toast";

import api from "../services/api";
import { useAuth } from "./AuthContext";

const WishlistContext = createContext();

const LOCAL_STORAGE_KEY = "regar_wishlist";

/**
 * Standardize item shape across backend & legacy frontend components
 */
const normalizeItem = (raw) => {
  if (!raw) return null;
  const productId = Number(raw.productId || raw.product_id || raw.products?.id || raw.id);
  const name = raw.productName || raw.products?.name || raw.name || "Produk";
  const price = Number(raw.price || raw.products?.price || 0);
  const imageUrl =
    raw.productImage ||
    raw.products?.image_url ||
    raw.imageUrl ||
    raw.image_url ||
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80";

  return {
    id: raw.id || productId,
    productId,
    product_id: productId,
    userId: raw.userId,
    productName: name,
    productImage: imageUrl,
    price,
    createdAt: raw.createdAt || new Date().toISOString(),
    products: {
      id: productId,
      name,
      price,
      image_url: imageUrl,
    },
  };
};

export const WishlistProvider = ({ children }) => {
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const loadWishlist = useCallback(async () => {
    try {
      setLoading(true);

      // Authenticated User: Fetch from PostgreSQL via API Gateway
      if (user) {
        try {
          const res = await api.get("/wishlist");
          const serverItems = Array.isArray(res.data?.data)
            ? res.data.data
            : Array.isArray(res.data)
            ? res.data
            : [];

          const normalized = serverItems.map(normalizeItem).filter(Boolean);

          // Check if guest items in localStorage need to be merged to server
          const guestSaved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (guestSaved) {
            try {
              const guestItems = JSON.parse(guestSaved);
              if (Array.isArray(guestItems) && guestItems.length > 0) {
                const existingProductIds = new Set(normalized.map((i) => i.productId));

                for (const gItem of guestItems) {
                  const gProdId = Number(gItem.productId || gItem.product_id || gItem.products?.id || gItem.id);
                  if (gProdId && !existingProductIds.has(gProdId)) {
                    try {
                      const payload = {
                        productId: gProdId,
                        productName: gItem.productName || gItem.products?.name || "Produk",
                        productImage: gItem.productImage || gItem.products?.image_url || "",
                        price: Number(gItem.price || gItem.products?.price || 0),
                      };
                      const syncRes = await api.post("/wishlist", payload);
                      if (syncRes.data?.data) {
                        normalized.unshift(normalizeItem(syncRes.data.data));
                        existingProductIds.add(gProdId);
                      }
                    } catch {
                      // ignore individual sync failure
                    }
                  }
                }
              }
            } catch {
              // ignore json parse error
            } finally {
              // Guest items are now synchronized to database, remove local copy
              localStorage.removeItem(LOCAL_STORAGE_KEY);
            }
          }

          setWishlistItems(normalized);
        } catch {
          // Fallback to local storage if network/auth issues occur temporarily
          const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
          if (saved) {
            const items = JSON.parse(saved);
            setWishlistItems(items.map(normalizeItem).filter(Boolean));
          } else {
            setWishlistItems([]);
          }
        }
      } else {
        // Guest Visitor: Load from localStorage
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          const items = JSON.parse(saved);
          setWishlistItems(items.map(normalizeItem).filter(Boolean));
        } else {
          setWishlistItems([]);
        }
      }
    } catch {
      setWishlistItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const addToWishlist = useCallback(
    async (productOrId) => {
      try {
        const prodId =
          typeof productOrId === "object" ? productOrId.id : productOrId;
        let prodObj =
          typeof productOrId === "object" && productOrId.name
            ? productOrId
            : null;

        if (!prodObj) {
          try {
            const res = await api.get(`/products/${prodId}`);
            prodObj = res.data?.data || res.data;
          } catch {
            prodObj = { id: prodId, name: "Produk", price: 0 };
          }
        }

        const payload = {
          productId: Number(prodId),
          productName: prodObj.name || "Produk",
          productImage:
            prodObj.imageUrl ||
            prodObj.image_url ||
            prodObj.productImage ||
            "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&q=80",
          price: Number(prodObj.price) || 0,
        };

        if (user) {
          // Persist to PostgreSQL backend via API Gateway
          const res = await api.post("/wishlist", payload);
          const savedItem = res.data?.data || payload;
          const normalized = normalizeItem(savedItem);

          setWishlistItems((prev) => [
            ...prev.filter((w) => w.productId !== Number(prodId)),
            normalized,
          ]);
        } else {
          // Guest: Store in localStorage
          const normalized = normalizeItem({
            ...payload,
            id: Date.now(),
          });
          const updated = [
            ...wishlistItems.filter((w) => w.productId !== Number(prodId)),
            normalized,
          ];
          setWishlistItems(updated);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }

        toast.success("Produk disimpan ke wishlist");
        return true;
      } catch (err) {
        console.error("Gagal menambahkan ke wishlist:", err);
        toast.error("Gagal menyimpan ke wishlist");
        return false;
      }
    },
    [user, wishlistItems]
  );

  const removeWishlist = useCallback(
    async (productIdOrWishlistId) => {
      try {
        const targetId = Number(productIdOrWishlistId);
        const item = wishlistItems.find(
          (w) =>
            w.id === targetId ||
            w.productId === targetId ||
            w.product_id === targetId
        );
        const prodId = item ? item.productId : targetId;

        if (user && prodId) {
          // Delete from PostgreSQL database
          await api.delete(`/wishlist/${prodId}`);
        }

        const updated = wishlistItems.filter(
          (w) => w.id !== targetId && w.productId !== prodId && w.product_id !== prodId
        );
        setWishlistItems(updated);

        if (!user) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }

        toast.success("Produk dihapus dari wishlist");
        return true;
      } catch (err) {
        console.error("Gagal menghapus wishlist:", err);
        toast.error("Gagal menghapus dari wishlist");
        return false;
      }
    },
    [user, wishlistItems]
  );

  const clearWishlist = useCallback(async () => {
    try {
      if (user) {
        await api.delete("/wishlist");
      }
      setWishlistItems([]);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      toast.success("Wishlist berhasil dikosongkan");
      return true;
    } catch (err) {
      console.error("Gagal mengosongkan wishlist:", err);
      toast.error("Gagal mengosongkan wishlist");
      return false;
    }
  }, [user]);

  const isWishlisted = useCallback(
    (productId) => {
      const targetId = Number(productId);
      return wishlistItems.some(
        (item) =>
          item.productId === targetId ||
          item.product_id === targetId ||
          item.products?.id === targetId
      );
    },
    [wishlistItems]
  );

  const getWishlistItemId = useCallback(
    (productId) => {
      const targetId = Number(productId);
      const item = wishlistItems.find(
        (w) =>
          w.productId === targetId ||
          w.product_id === targetId ||
          w.products?.id === targetId
      );
      return item?.productId || item?.id || targetId;
    },
    [wishlistItems]
  );

  const toggleWishlist = useCallback(
    async (product) => {
      const prodId = Number(product.id || product.productId || product.product_id);
      if (isWishlisted(prodId)) {
        await removeWishlist(prodId);
      } else {
        await addToWishlist(product);
      }
    },
    [addToWishlist, isWishlisted, removeWishlist]
  );

  useEffect(() => {
    if (authLoading) return;
    loadWishlist();
  }, [authLoading, loadWishlist]);

  const value = useMemo(
    () => ({
      wishlistItems,
      loading,
      loadWishlist,
      addToWishlist,
      removeWishlist,
      clearWishlist,
      isWishlisted,
      isInWishlist: isWishlisted,
      toggleWishlist,
      getWishlistItemId,
    }),
    [
      addToWishlist,
      clearWishlist,
      getWishlistItemId,
      isWishlisted,
      loadWishlist,
      loading,
      removeWishlist,
      toggleWishlist,
      wishlistItems,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
