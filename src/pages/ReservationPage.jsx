import { useEffect, useState } from 'react';
import { fetchThemes, fetchAvailableTimes, createReservation, createWaiting } from '../api/index.js';
import styles from './ReservationPage.module.css';

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
  const selectedTimeInfo = times.find((time) => String(time.id) === selectedTime);
  const isWaitingMode = selectedTimeInfo && !selectedTimeInfo.isAvailable;

  useEffect(() => {
    fetchThemes().then(setThemes).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (!selectedTheme || !date) {
      setTimes([]);
      setSelectedTime('');
      return;
    }
    setLoadingTimes(true);
    setSelectedTime('');
    fetchAvailableTimes(date, selectedTheme)
      .then(setTimes)
      .catch((e) => setError(e.message))
      .finally(() => setLoadingTimes(false));
  }, [selectedTheme, date]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTheme || !date || !selectedTime || !name.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        themeId: Number(selectedTheme),
        date,
        timeId: Number(selectedTime),
        name: name.trim(),
      };

      if (isWaitingMode) {
        await createWaiting(body);
        showToast('대기 신청이 완료되었습니다.');
        onBack();
        return;
      }

      const result = await createReservation(body);
      onConfirm(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.page}>
      <button className={styles.back} onClick={onBack}>← 돌아가기</button>
      <h2>예약하기</h2>

      {error && <p className={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.field}>
          <label>테마 선택</label>
          <select
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            required
          >
            <option value="">테마를 선택하세요</option>
            {themes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className={styles.field}>
          <label>날짜 선택</label>
          <input
            type="date"
            value={date}
            min={today}
            onChange={(e) => setDate(e.target.value)}
            required
          />
        </div>

        {selectedTheme && date && (
          <div className={styles.field}>
            <label>예약 및 대기 가능 시간</label>
            {loadingTimes ? (
              <p className={styles.hint}>불러오는 중...</p>
            ) : times.length === 0 ? (
              <p className={styles.hint}>선택 가능한 시간이 없습니다.</p>
            ) : (
              <div className={styles.timeGrid}>
                {times.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={`${styles.timeBtn} ${!t.isAvailable ? styles.unavailable : ''} ${selectedTime === String(t.id) ? styles.selected : ''}`}
                    onClick={() => setSelectedTime(String(t.id))}
                  >
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
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="이름을 입력하세요"
              required
            />
          </div>
        )}

        <button
          type="submit"
          className={styles.submitBtn}
          disabled={!selectedTheme || !date || !selectedTime || !name.trim() || submitting}
        >
          {submitting ? `${isWaitingMode ? '대기 신청' : '예약'} 중...` : `${isWaitingMode ? '대기 신청' : '예약 확정'}`}
        </button>
      </form>
    </div>
  );
}
