# 변경 명세 — react-roomescape

## 개요

초기 레포 대비 **Toss Payments SDK v2 위젯 연동** 및 **결제 리디렉션 처리**가 핵심 변경이다.

| 구분 | 변경 내용 |
|------|-----------|
| **결제 위젯** | Toss SDK v2 스크립트 로드. `TossPayments.ANONYMOUS` 위젯으로 카드/간편결제 UI 렌더링 |
| **2단계 플로우** | 예약 폼 제출 → `POST /payments/prepare` (서버 orderId 발급) → 위젯 렌더링 → `requestPayment` → Toss 인증 페이지 리디렉션 |
| **성공 처리** | `/?payment=success` 로 돌아오면 `PaymentSuccessPage` 가 URL 파라미터 + sessionStorage 에서 데이터 복원 후 `POST /reservations` 호출 |
| **실패·취소 처리** | `/?payment=fail` 또는 `USER_CANCEL` 예외 시 `DELETE /payments/prepare/{orderId}` 로 서버 pending 레코드 정리 후 에러 토스트 |
| **금액 고정** | 결제 금액 50,000원 상수(`FIXED_AMOUNT`) 고정. 금액 입력 UI 제거 |
| **React 18 대응** | `useRef(false)` 가드로 Strict Mode 이중 `useEffect` 실행 방지 (결제 승인 중복 호출 차단) |

---

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

---

# [2차] orderId 서버 발급 및 결제 취소 정리

> 요구사항: orderId를 클라이언트가 생성하면 임의 값 삽입 가능. 서버가 발급하고 금액과 함께 저장 후 검증해야 한다. 결제 취소/실패 시 서버 pending 레코드를 정리해야 한다.

---

## 6. vite.config.js — /payments 프록시 추가

**요구사항**: `POST /payments/prepare`, `DELETE /payments/prepare/{orderId}` 호출을 개발 서버에서 백엔드(8080)로 전달해야 한다.

**파일**: `vite.config.js`

```js
'/payments': { target: 'http://localhost:8080', changeOrigin: true }
```

---

## 7. api/index.js — 결제 준비/취소 API 추가

**파일**: `src/api/index.js`

```js
preparePayment(amount)          // POST /payments/prepare → { orderId }
cancelPreparedPayment(orderId)  // DELETE /payments/prepare/{orderId} → 204
```

---

## 8. ReservationPage — orderId 서버 발급으로 교체

**요구사항**: `crypto.randomUUID()`로 클라이언트에서 생성하면 임의 값 주입 가능. 서버가 orderId를 발급해야 한다.

**파일**: `src/pages/ReservationPage.jsx`

```js
// 변경 전
const orderId = crypto.randomUUID();

// 변경 후 (서버 발급 + pending_payment 행 생성)
const { orderId } = await preparePayment(FIXED_AMOUNT);
```

결제 위젯 진입 전에 `preparePayment`가 성공해야 위젯이 렌더링된다. 실패 시 에러 표시 후 위젯 진입 안 함.

---

## 9. App.jsx — failUrl에서 pending 레코드 정리

**요구사항**: 결제 취소/실패 시 서버에 생성된 `pending_payment` 레코드를 삭제해야 한다.

**파일**: `src/App.jsx`

```js
// PAY_PROCESS_CANCELED 등 일부 에러코드는 orderId가 URL에 없음
// → sessionStorage fallback으로 null 가드 처리
const urlOrderId = params.get('orderId');
const pending = JSON.parse(sessionStorage.getItem('pendingReservation') || 'null');
const orderId = urlOrderId ?? pending?.orderId;
if (orderId) cancelPreparedPayment(orderId).catch(() => {}); // fire-and-forget
```

---

---

# [3차] 결과 불명확(확인 필요) 처리 · 주문/결제 내역

> 서버 3차(타임아웃 방어·멱등 재시도·주문/결제 내역) 대응. confirm이 read timeout으로 불명확하게
> 끝난 경우를 "실패"로 단정하지 않고 "확인 필요"로 안내하며, 내 예약 페이지에서 결제 상태를 함께 본다.

## 10. api/index.js — 에러 code/status 노출 + 결제 내역 API

**파일**: `src/api/index.js`

- `parseResponse`가 ProblemDetail의 `code`와 HTTP `status`를 throw하는 `Error` 객체에 함께 싣는다.
  호출부가 `e.code === 'PAYMENT_RESULT_UNKNOWN'`처럼 분기할 수 있게 한다. (기존 `e.message` 동작 유지)
- `getPaymentHistory(userName)` 추가 → `GET /payments?userName=` (프록시는 기존 `/payments` 재사용)

---

## 결제 전체 흐름 요약 (2차 기준)

```
[ReservationPage]
  폼 작성 → POST /payments/prepare → orderId 서버 발급
    → sessionStorage 저장 → Toss 위젯 렌더링
      → requestPayment() → (Toss 인증 페이지)
        → 성공: /?payment=success&paymentKey=...&orderId=...&amount=...
            → [PaymentSuccessPage] POST /reservations (paymentKey, orderId, amount 포함)
              → [ConfirmPage]
        → 실패/취소: /?payment=fail or USER_CANCEL 예외
            → DELETE /payments/prepare/{orderId} (pending 레코드 정리)
            → 에러 토스트, 홈으로
```
