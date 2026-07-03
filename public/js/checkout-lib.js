// Shared Razorpay checkout helper used by both course checkout and the video
// generator. Self-contained (does not depend on app.js). Handles dev-bypass
// mode transparently: when the server has no Razorpay keys, the order is
// completed immediately so the flow is testable locally.

(function () {
  async function postJSON(url, body) {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body || {}),
    });
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('application/json') ? await res.json() : await res.text();
    if (!res.ok) throw new Error((data && data.error) || `Request failed (${res.status})`);
    return data;
  }

  function loadRazorpayScript() {
    return new Promise((resolve, reject) => {
      if (window.Razorpay) return resolve();
      const s = document.createElement('script');
      s.src = 'https://checkout.razorpay.com/v1/checkout.js';
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Could not load the payment library. Check your connection.'));
      document.head.appendChild(s);
    });
  }

  /**
   * @param {object} orderResp  response from POST /api/orders
   * @param {{onSuccess:Function,onError?:Function,onDismiss?:Function}} cbs
   */
  async function payAndVerify(orderResp, cbs) {
    const { onSuccess, onError, onDismiss } = cbs || {};
    const rz = orderResp.razorpay || {};
    const verify = (payload) => postJSON(`/api/orders/${orderResp.order_id}/verify`, payload);

    if (!rz.configured) {
      try {
        await verify({ razorpay_order_id: rz.order_id, razorpay_payment_id: 'dev', razorpay_signature: 'dev' });
        onSuccess && onSuccess();
      } catch (e) { onError && onError(e); }
      return;
    }

    try {
      await loadRazorpayScript();
    } catch (e) { return onError && onError(e); }

    const options = {
      key: rz.key_id,
      amount: rz.amount_paise,
      currency: orderResp.currency || 'INR',
      name: rz.name || 'Checkout',
      description: orderResp.product ? orderResp.product.title : 'Order',
      order_id: rz.order_id,
      prefill: rz.prefill || {},
      theme: { color: '#4f46e5' },
      handler: async (resp) => {
        try { await verify(resp); onSuccess && onSuccess(); }
        catch (e) { onError && onError(e); }
      },
      modal: { ondismiss: () => onDismiss && onDismiss() },
    };
    const r = new window.Razorpay(options);
    r.on('payment.failed', (resp) => {
      onError && onError(new Error((resp.error && resp.error.description) || 'Payment failed'));
    });
    r.open();
  }

  window.Checkout = { payAndVerify, postJSON };
})();
