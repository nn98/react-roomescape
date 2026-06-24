# 변경 명세 — react-roomescape

## 1. Toss Payments SDK 로드

**파일**: `index.html`

```html
<script src="https://js.tosspayments.com/v2/standard"></script>
```

전역 `TossPayments` / `TossPayments.ANONYMOUS` 사용 가능. 학습 프로젝트 `checkout.html`과 동일한 SDK.

---

## 2. ReservationPage — 결제 위젯 2단계 플로우

**파일**: `src/pages/ReservationPage.jsx`

### 변경 전
폼 제출 → `createReservation()` 직접 호출

### 변경 후

**1단계 (폼)**: 테마/날짜/시간/이름 입력 → "결제하기" 클릭

- 결제 금액 50,000원 고정 (`FIXED_AMOUNT = 50000`)
- `crypto.randomUUID()`로 `orderId` 생성
- 예약 정보를 `sessionStorage('pendingReservation')`에 저장
- `widgetPhase = true`로 전환

**2단계 (위젯)**: Toss 결제위젯 렌더링

```js
// checkout.html 동일 패턴
const widgets = TossPayments(CLIENT_KEY).widgets({ customerKey: TossPayments.ANONYMOUS });
await widgets.setAmount({ currency: 'KRW', value: FIXED_AMOUNT });
await Promise.all([
  widgets.renderPaymentMethods({ selector: '#payment-method', variantKey: 'DEFAULT' }),
  widgets.renderAgreement({ selector: '#agreement', variantKey: 'AGREEMENT' }),
]);
await widgets.requestPayment({
  orderId, orderName: '방탈출 예약',
  successUrl: window.location.origin + '/?payment=success',
  failUrl: window.location.origin + '/?payment=fail',
});
```

- `USER_CANCEL` 에러는 조용히 무시 (결제창 닫기)
- 대기 신청은 기존 흐름 유지 (결제 없음)

**클라이언트 키**: `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm` (테스트 전용)

---

## 3. PaymentSuccessPage (신규)

**파일**: `src/pages/PaymentSuccessPage.jsx`

Toss 결제 인증 성공 후 `/?payment=success&paymentKey=...&orderId=...&amount=...`로 리디렉션되면 이 페이지가 처리한다.

1. URL 파라미터에서 `paymentKey`, `orderId`, `amount` 추출
2. `sessionStorage`에서 `pendingReservation` 복원 (name/themeId/date/timeId)
3. `createReservation({ ...pending, paymentKey, orderId, amount })` 호출
4. 성공 → `window.history.replaceState({}, '', '/')` 후 ConfirmPage 이동
5. 실패 → 에러 토스트 후 홈 이동

**React Strict Mode 이중 실행 방지**: `useRef(false)` 가드로 `useEffect` 한 번만 실행.

---

## 4. App.jsx — URL 기반 초기 라우팅

**파일**: `src/App.jsx`

```js
const getInitialPage = () => {
  const payment = new URLSearchParams(window.location.search).get('payment');
  if (payment === 'success') return 'paymentSuccess';
  if (payment === 'fail') return 'paymentFail';
  return 'home';
};
const [page, setPage] = useState(getInitialPage);
```

- `?payment=success` → `PaymentSuccessPage` 렌더링
- `?payment=fail` → Toss가 전달한 `message` 파라미터를 에러 토스트로 표시 후 홈

---

## 5. 토스트 성공/실패 색상 구분

**파일**: `src/App.jsx`, `src/App.module.css`

`showToast(message, type = 'error')` — 두 번째 인자로 타입 지정.

| 타입 | 색상 | 사용 예 |
|------|------|---------|
| `'error'` (기본) | 빨강 `#e53e3e` | `.catch(e => showToast(e.message))` |
| `'success'` | 초록 `#38a169` | 완료 메시지 (대기 신청, 세션 생성, 테마/시간 CRUD 등) |

성공 토스트 적용 파일:
- `ReservationPage` — 대기 신청 완료
- `MyReservationPage` — 예약/대기 취소 완료
- `SessionManagePage` — 세션 생성/일괄 생성 완료
- `ThemeManagePage` — 테마 추가/수정/삭제 완료
- `TimeManagePage` — 시간 추가/수정/삭제 완료

---

## 결제 전체 흐름 요약

```
[ReservationPage]
  폼 작성 → sessionStorage 저장 → Toss 위젯 렌더링
    → requestPayment() → (Toss 인증 페이지)
      → 성공: /?payment=success&paymentKey=...&orderId=...&amount=...
        → [PaymentSuccessPage] POST /reservations (paymentKey 포함)
          → [ConfirmPage]
      → 실패/취소: /?payment=fail or USER_CANCEL 예외
        → 에러 토스트, 홈으로
```
