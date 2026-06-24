import { useEffect, useRef, useState } from 'react';
import { fetchThemes, fetchAvailableTimes, createWaiting } from '../api/index.js';
import styles from './ReservationPage.module.css';

const CLIENT_KEY = 'test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm';
const FIXED_AMOUNT = 50000;
const today = new Date().toISOString().split('T')[0];

export default function ReservationPage({ onConfirm, onBack, showToast }) {
  const [themes, setThemes] = useState([]);
  const [selectedTheme, setSelectedTheme] = useState('');
  const [date, setDate] = useState(today);
  const [times, setTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState('');
  const [name, setName] = useState('');
  const [loadingTimes, setLoadingTimes] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  // 결제 위젯 단계
  const [widgetPhase, setWidgetPhase] = useState(false);
  const [widgetReady, setWidgetReady] = useState(false);
  const widgetsRef = useRef(null);
  const orderIdRef = useRef(null);

  const selectedTimeInfo = times.find((t) => String(t.id) === selectedTime);
  const isWaitingMode = selectedTimeInfo && !selectedTimeInfo.isAvailable;

  useEffect(() => {
    fetchThemes().then(setThemes).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedTheme || !date) { setTimes([]); setSelectedTime(''); return; }
    setLoadingTimes(true);
    setSelectedTime('');
    fetchAvailableTimes(date, selectedTheme)
      .then(setTimes)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingTimes(false));
  }, [selectedTheme, date]);

  // 위젯 phase 진입 후 DOM이 준비되면 학습 프로젝트 checkout.html 과 동일한 패턴으로 렌더링
  useEffect(() => {
    if (!widgetPhase) return;
    (async () => {
      try {
        const tossPayments = TossPayments(CLIENT_KEY);
        const widgets = tossPayments.widgets({ customerKey: TossPayments.ANONYMOUS });
        widgetsRef.current = widgets;
        await widgets.setAmount({ currency: 'KRW', value: FIXED_AMOUNT });
        await Promise.all([
          widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
          widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
        ]);
        setWidgetReady(true);
      } catch (e) {
        setError('결제위젯 렌더링 실패: ' + e.message);
      }
    })();
  }, [widgetPhase]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTheme || !date || !selectedTime || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        themeId: Number(selectedTheme), date,
        timeId: Number(selectedTime), name: name.trim(),
        amount: FIXED_AMOUNT,
      };

      if (isWaitingMode) {
        await createWaiting(body);
        showToast('대기 신청이 완료되었습니다.', 'success');
        onBack();
        return;
      }

      // 예약 → 결제 위젯 단계로 이동
      const orderId = crypto.randomUUID();
      orderIdRef.current = orderId;
      sessionStorage.setItem('pendingReservation', JSON.stringify({ ...body, orderId }));
      setWidgetPhase(true);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPayment = async () => {
    try {
      await widgetsRef.current.requestPayment({
        orderId: orderIdRef.current,
        orderName: '방탈출 예약',
        successUrl: window.location.origin + '/?payment=success',
        failUrl: window.location.origin + '/?payment=fail',
      });
    } catch (e) {
      // 사용자가 결제창 닫으면 USER_CANCEL — 조용히 복귀
      if (e.code !== 'USER_CANCEL') setError('결제 요청 실패: ' + e.message);
    }
  };

  if (widgetPhase) {
    return (
      <div className={styles.page}>
        <button className={styles.back} onClick={() => { setWidgetPhase(false); setWidgetReady(false); }}>← 돌아가기</button>
        <h2>결제하기</h2>
        {error && <p className={styles.error}>{error}</p>}
        <div id="payment-method" />
        <div id="agreement" />
        <button
          className={styles.submitBtn}
          disabled={!widgetReady}
          onClick={handleRequestPayment}
        >
          {widgetReady ? '결제하기' : '결제위젯 로딩 중...'}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={onBack}>← 돌아가기</button>
      <h2>예약하기</h2>
      {error && <p className={styles.error}>{error}</p>}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>테마 선택</label>
          <select value={selectedTheme} onChange={(e) => setSelectedTheme(e.target.value)} required>
            <option value="">테마를 선택하세요</option>
            {themes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className={styles.field}>
          <label>날짜 선택</label>
          <input type="date" value={date} min={today} onChange={(e) => setDate(e.target.value)} required />
        </div>
        {selectedTheme && date && (
          <div className={styles.field}>
            <label>예약 및 대기 가능 시간</label>
            {loadingTimes ? <p className={styles.hint}>불러오는 중...</p>
              : times.length === 0 ? <p className={styles.hint}>선택 가능한 시간이 없습니다.</p>
              : (
                <div className={styles.timeGrid}>
                  {times.map((t) => (
                    <button key={t.id} type="button"
                      className={`${styles.timeBtn} ${!t.isAvailable ? styles.unavailable : ''} ${selectedTime === String(t.id) ? styles.selected : ''}`}
                      onClick={() => setSelectedTime(String(t.id))}>
                      {t.startAt.slice(0, 5)}
                      {!t.isAvailable && <span className={styles.tag}>대기 가능</span>}
                    </button>
                  ))}
                </div>
              )}
          </div>
        )}
        {selectedTime && (
          <div className={styles.field}>
            <label>예약자 이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="이름을 입력하세요" required />
          </div>
        )}
        <button type="submit" className={styles.submitBtn}
          disabled={!selectedTheme || !date || !selectedTime || !name.trim() || submitting}>
          {submitting ? `${isWaitingMode ? '대기 신청' : '예약'} 중...` : `${isWaitingMode ? '대기 신청' : '결제하기'}`}
        </button>
      </form>
    </div>
  );
}
