import { useEffect, useRef } from 'react';
import { createReservation } from '../api/index.js';

export default function PaymentSuccessPage({ onConfirm, onBack, showToast }) {
  const didRun = useRef(false);

  useEffect(() => {
    // Strict Mode 이중 실행 방지
    if (didRun.current) return;
    didRun.current = true;
    const params = new URLSearchParams(window.location.search);
    const paymentKey = params.get('paymentKey');
    const orderId = params.get('orderId');
    const amount = Number(params.get('amount'));

    const pending = JSON.parse(sessionStorage.getItem('pendingReservation') || 'null');
    sessionStorage.removeItem('pendingReservation');

    if (!paymentKey || !pending) {
      showToast('결제 정보가 올바르지 않습니다.');
      window.history.replaceState({}, '', '/');
      onBack();
      return;
    }

    createReservation({ ...pending, paymentKey, orderId, amount })
      .then((result) => {
        window.history.replaceState({}, '', '/');
        onConfirm(result);
      })
      .catch((e) => {
        showToast(e.message);
        window.history.replaceState({}, '', '/');
        onBack();
      });
  }, []);

  return <p style={{ padding: '40px', textAlign: 'center' }}>결제 처리 중...</p>;
}
