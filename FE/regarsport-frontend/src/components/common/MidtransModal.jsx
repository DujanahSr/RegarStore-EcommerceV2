import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import api from "../../services/api";
import { loadMidtransSnap } from "../../utils/loadMidtrans";

export default function MidtransModal({
  isOpen,
  onClose,
  order,
  snapToken: initialSnapToken,
  onSuccess,
}) {
  const isLaunchingRef = useRef(false);
  const orderNumber = order?.orderNumber || (order?.id ? `REGAR-${order.id}` : "");

  useEffect(() => {
    if (!isOpen || !order) {
      isLaunchingRef.current = false;
      toast.dismiss("midtrans-snap-loader");
      return;
    }

    if (isLaunchingRef.current) return;
    isLaunchingRef.current = true;

    let isMounted = true;
    toast.loading("Membuka pembayaran Midtrans Sandbox...", { id: "midtrans-snap-loader" });

    const launchSnap = async () => {
      try {
        const createdAtDate = new Date(order?.createdAt || order?.created_at);
        const isOrderExpired =
          (order?.status || "").toUpperCase() === "CANCELLED" ||
          (!isNaN(createdAtDate.getTime()) && Date.now() - createdAtDate.getTime() > 24 * 60 * 60 * 1000);

        if (isOrderExpired) {
          toast.dismiss("midtrans-snap-loader");
          toast.error("Batas waktu pembayaran pesanan ini telah kedaluwarsa. Silakan lakukan pemesanan ulang.");
          onClose();
          return;
        }

        const snap = await loadMidtransSnap();
        if (!snap || typeof snap.pay !== "function") {
          throw new Error("Pustaka Midtrans Snap belum siap dimuat di browser.");
        }

        let token = initialSnapToken;

        // Ambil token tersimpan atau buat baru via API
        if (!token || token.startsWith("SNAP-TOKEN-")) {
          try {
            const res = await api.get(`/payments/order/${order.id}`);
            const fetchedToken = res.data?.data?.snapToken || res.data?.snapToken;
            if (fetchedToken && !fetchedToken.startsWith("SNAP-TOKEN-")) {
              token = fetchedToken;
            }
          } catch (fetchErr) {
            console.warn("Belum ada payment record tersimpan, membuat token baru:", fetchErr);
          }

          if (!token || token.startsWith("SNAP-TOKEN-")) {
            const createRes = await api.post("/payments/create-token", {
              orderId: Number(order.id),
              orderNumber: order.orderNumber || orderNumber,
              customerEmail: order.customerEmail || "customer@regarstore.com",
              customerName: order.customerName || "Customer",
              amount: Number(order.totalAmount || order.total_amount || 0),
            });
            token = createRes.data?.data?.snapToken || createRes.data?.snapToken;
          }
        }

        if (!isMounted) return;

        if (!token || token.startsWith("SNAP-TOKEN-")) {
          throw new Error("Gagal memperoleh Snap Token resmi dari Midtrans Sandbox.");
        }

        // Hilangkan loading toast tepat sebelum pop-up resmi Midtrans muncul di layar
        toast.dismiss("midtrans-snap-loader");

        snap.pay(token, {
          onSuccess: async function () {
            toast.success("Pembayaran Berhasil! Pesanan Anda telah lunas.");
            try {
              await api.get(`/payments/sync/${orderNumber}`);
            } catch (e) {
              console.warn("Sync error after success:", e);
            }
            if (onSuccess) onSuccess(order);
            onClose();
          },
          onPending: async function () {
            toast("Menunggu pembayaran diselesaikan...", { icon: "⏳" });
            try {
              await api.get(`/payments/sync/${orderNumber}`);
            } catch (e) {
              console.warn("Sync error on pending:", e);
            }
            if (onSuccess) onSuccess(order);
            onClose();
          },
          onError: async function (result) {
            console.warn("Midtrans onError callback:", result);
            toast.error("Pembayaran dibatalkan atau waktu transaksi telah kedaluwarsa.");
            try {
              await api.get(`/payments/sync/${orderNumber}`);
            } catch (e) {
              console.warn("Sync error on error:", e);
            }
            if (onSuccess) onSuccess(order);
            onClose();
          },
          onClose: async function () {
            try {
              await api.get(`/payments/sync/${orderNumber}`);
            } catch (e) {
              console.warn("Sync error on close:", e);
            }
            if (onSuccess) onSuccess(order);
            onClose();
          },
        });
      } catch (err) {
        if (!isMounted) return;
        toast.dismiss("midtrans-snap-loader");
        console.error("Midtrans launch error:", err);
        const msg =
          err.response?.data?.message ||
          err.message ||
          "Gagal menghubungkan ke gateway pembayaran Midtrans.";
        toast.error(msg);
        onClose();
      }
    };

    launchSnap();

    return () => {
      isMounted = false;
      isLaunchingRef.current = false;
      toast.dismiss("midtrans-snap-loader");
    };
  }, [isOpen, order, initialSnapToken, orderNumber, onClose, onSuccess]);

  // Tidak menampilkan modal kartu tambahan agar Midtrans Snap muncul langsung tanpa pop-up ganda
  return null;
}
