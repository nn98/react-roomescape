// api/index.js

const parseResponse = async (response) => {
  const responseText = await response.text();

  if (!response.ok) {
    let errorMsg = `${response.status} ${response.statusText}`;
    let errorCode;
    try {
      // ProblemDetail 규격인 'detail' 필드를 최우선으로 파싱하고,
      // 기존 하위 호환성을 위해 'message' 필드도 확인합니다.
      const errorData = JSON.parse(responseText);
      if (errorData.detail) {
        errorMsg = errorData.detail;
      } else if (errorData.message) {
        errorMsg = errorData.message;
      }
      errorCode = errorData.code;
    } catch (e) {
      // JSON 파싱 실패 시 기존 HTTP 에러 메시지 유지
    }
    // read timeout(PAYMENT_RESULT_UNKNOWN) 등 결과가 불명확한 응답을 호출부가
    // "실패"와 구분해 안내할 수 있도록 code/status를 에러에 함께 싣는다.
    const error = new Error(errorMsg);
    error.status = response.status;
    if (errorCode) error.code = errorCode;
    throw error;
  }
  if (response.status === 204 || !responseText) {
    return null;
  }
  return JSON.parse(responseText);
};

const fetchJson = async (url, options) => {
  const response = await fetch(url, options);
  return parseResponse(response);
};

const createQueryString = (params) => new URLSearchParams(params).toString();

// --- Theme API ---
export const fetchThemes = () => fetchJson('/themes');
export const fetchTheme = (id) => fetchJson(`/themes/${id}`);
export const createTheme = (body) => fetchJson('/themes', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const deleteTheme = (id) => fetchJson(`/themes/${id}`, { method: 'DELETE' });

export const fetchPopularThemes = (topCount = 10, during = 10) =>
    fetchJson(`/themes?topCount=${topCount}&during=${during}`);

export const updateTheme = (id, body) => fetchJson(`/themes/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

// --- Time API ---
export const fetchTimes = () => fetchJson('/times');
export const fetchAvailableTimes = (date, themeId) => fetchJson(`/times?themeId=${themeId}&date=${date}`);
export const createTime = (body) => fetchJson('/times', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const deleteTime = (id) => fetchJson(`/times/${id}`, { method: 'DELETE' });

export const updateTime = (id, body) => fetchJson(`/times/${id}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(body)
});

// --- Reservation API (User Domain) ---
export const fetchReservations = () => fetchJson('/reservations');
export const fetchReservation = (id) => fetchJson(`/reservations/${id}`);
export const getReservationsByName = (userName) => fetchJson(`/reservations?${createQueryString({ userName })}`);
export const createReservation = (body) => fetchJson('/reservations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const deleteReservation = (id, userName) => fetchJson(`/reservations/${id}?${createQueryString({ userName })}`, { method: 'DELETE' });
export const putReservation = (id, userName, body) => fetchJson(`/reservations/${id}?${createQueryString({ userName })}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const patchReservation = (id, userName, body) => fetchJson(`/reservations/${id}?${createQueryString({ userName })}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

// --- Session API ---
export const fetchSessions = () => fetchJson('/sessions');
export const createSession = (body) => fetchJson('/sessions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
export const createSessionsBatch = (date) => fetchJson(`/sessions/batch?${createQueryString({ date })}`, { method: 'POST' });

// --- Payment API ---
export const preparePayment = (amount) =>
    fetchJson('/payments/prepare', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ amount }) });

export const cancelPreparedPayment = (orderId) =>
    fetchJson(`/payments/prepare/${orderId}`, { method: 'DELETE' });

// 주문/결제 내역: 결제 상태(결제 대기/확정/실패/확인 필요)·orderId·paymentKey·금액을 예약 정보와 함께 반환
export const getPaymentHistory = (userName) => fetchJson(`/payments?${createQueryString({ userName })}`);

// --- Waiting API ---
export const createWaiting = (body) =>
    fetchJson('/waitings', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

export const deleteWaiting = (id, userName) =>
    fetchJson(`/waitings/${id}?${createQueryString({ userName })}`, { method: 'DELETE' });
