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
        // read timeout은 "승인됐는지 모르는" 상태 — "실패"로 단정하지 않고 확인/재시도를 안내한다.
        // (같은 orderId의 멱등키로 재시도해도 서버가 이중 승인을 막는다)
        if (e.code === 'PAYMENT_RESULT_UNKNOWN') {
          showToast('결제 결과가 확인되지 않았습니다. ‘내 예약 조회’의 주문/결제 내역에서 상태를 확인하거나 잠시 후 다시 시도해 주세요.');
        } else if (e.code === 'PAYMENT_GATEWAY_UNREACHABLE') {
          showToast('결제 서버에 연결하지 못했습니다. 잠시 후 다시 시도해 주세요.');
        } else {
          showToast(e.message);
        }
        window.history.replaceState({}, '', '/');
        onBack();
      });
  }, []);

  return <p style={{ padding: '40px', textAlign: 'center' }}>결제 처리 중...</p>;
}
