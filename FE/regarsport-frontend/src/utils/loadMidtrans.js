// Snap.js dimuat di index.html dengan data-client-key dari VITE_MIDTRANS_CLIENT_KEY.
// Fungsi ini menunggu window.snap siap (maks ~3 detik).
export const loadMidtransSnap = () => {
  if (!import.meta.env.VITE_MIDTRANS_CLIENT_KEY) {
    return Promise.resolve(null);
  }

  if (typeof window !== "undefined" && window.snap) {
    return Promise.resolve(window.snap);
  }

  return new Promise((resolve, reject) => {
    let attempts = 0;
    const waitForSnap = () => {
      if (window.snap) {
        resolve(window.snap);
        return;
      }
      attempts += 1;
      if (attempts >= 30) {
        reject(new Error("Midtrans Snap belum siap dimuat"));
        return;
      }
      setTimeout(waitForSnap, 100);
    };
    waitForSnap();
  });
};
