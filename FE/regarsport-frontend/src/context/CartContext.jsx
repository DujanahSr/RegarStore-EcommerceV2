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

const CartContext = createContext();

export const CartProvider = ({
  children,
}) => {
  const [cartItems, setCartItems] =
    useState([]);
  const [loading, setLoading] = useState(true);

  const [
    selectedItems,
    setSelectedItems,
  ] = useState([]);
  const { user, loading: authLoading } = useAuth();

  const loadCart = useCallback(async () => {
    if (!user) {
      setCartItems([]);
      setSelectedItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await api.get("/cart");
      const list = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
        ? res.data
        : [];

      // Normalize items to support both flat properties and nested .products structure
      const normalized = list.map((item) => ({
        ...item,
        size: item.size || "L",
        customName: item.customName || null,
        customNumber: item.customNumber || null,
        customCollar: item.customCollar || null,
        customTeam: item.customTeam || null,
        products: {
          id: item.productId,
          name: item.productName,
          price: item.price,
          image_url: item.productImage || "https://placehold.co/200x200",
          stock: 999,
        },
      }));

      setCartItems(normalized);
    } catch (error) {
      console.log(error);
      setCartItems([]);
    }

    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    loadCart();
  }, [authLoading, loadCart]);

  const addToCart = useCallback(
    async (product, qty = 1, size = "L", customOptions = null) => {
      try {
        await api.post("/cart", {
          productId: product.id,
          productName: product.name,
          productImage: product.imageUrl || product.image_url || "",
          price: Number(product.price),
          quantity: Number(qty) || 1,
          size: size || "L",
          customName: customOptions?.customName || null,
          customNumber: customOptions?.customNumber || null,
          customCollar: customOptions?.customCollar || null,
          customTeam: customOptions?.customTeam || null,
        });

        await loadCart();
        toast.success(
          size
            ? `Produk (${size}) ditambahkan ke keranjang`
            : "Produk ditambahkan ke keranjang"
        );
      } catch (error) {
        console.log(error);
        toast.error(
          error.response?.data?.message || "Gagal menambahkan ke keranjang"
        );
      }
    },
    [loadCart]
  );

  const increaseQty = useCallback(
    async (cartId, qty) => {
      try {
        await api.put(`/cart/${cartId}`, {
          quantity: qty + 1,
        });

        await loadCart();
      } catch (error) {
        console.log(error);
        toast.error(
          error.response?.data?.message || "Gagal mengubah jumlah item"
        );
      }
    },
    [loadCart]
  );

  const removeFromCart = useCallback(
    async (cartId) => {
      try {
        await api.delete(`/cart/${cartId}`);

        setSelectedItems((prev) => prev.filter((id) => id !== cartId));

        await loadCart();
        toast.success("Item dihapus dari keranjang");
      } catch (error) {
        console.log(error);
        toast.error(error.response?.data?.message || "Gagal menghapus item");
      }
    },
    [loadCart]
  );

  const decreaseQty = useCallback(
    async (cartId, qty) => {
      try {
        if (qty <= 1) {
          await removeFromCart(cartId);
          return;
        }

        await api.put(`/cart/${cartId}`, {
          quantity: qty - 1,
        });

        await loadCart();
      } catch (error) {
        console.log(error);
        toast.error(
          error.response?.data?.message || "Gagal mengubah jumlah item"
        );
      }
    },
    [loadCart, removeFromCart]
  );

  const clearCart = useCallback(async () => {
    try {
      await api.delete("/cart");

      setCartItems([]);
      setSelectedItems([]);
      toast.success("Keranjang dikosongkan");
    } catch (error) {
      console.log(error);
      toast.error(
        error.response?.data?.message || "Gagal mengosongkan keranjang"
      );
    }
  }, []);

  const toggleSelectItem = useCallback((cartId) => {
    setSelectedItems((prev) =>
      prev.includes(cartId)
        ? prev.filter(
          (id) =>
            id !== cartId
        )
        : [...prev, cartId]
    );
  }, []);

  const selectAllItems = useCallback(() => {
    if (
      selectedItems.length ===
      cartItems.length
    ) {
      setSelectedItems([]);
      return;
    }

    setSelectedItems(
      cartItems.map(
        (item) => item.id
      )
    );
  }, [cartItems, selectedItems.length]);

  const value = useMemo(
    () => ({
      cartItems,
      loading,
      loadCart,

      addToCart,
      increaseQty,
      decreaseQty,
      removeFromCart,
      clearCart,

      selectedItems,
      setSelectedItems,
      toggleSelectItem,
      selectAllItems,
    }),
    [
      addToCart,
      cartItems,
      clearCart,
      decreaseQty,
      increaseQty,
      loadCart,
      loading,
      removeFromCart,
      selectAllItems,
      selectedItems,
      toggleSelectItem,
    ]
  );

  return (
    <CartContext.Provider
      value={value}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () =>
  useContext(CartContext);
