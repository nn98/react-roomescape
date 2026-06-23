import styles from './ConfirmPage.module.css';

export default function ConfirmPage({ reservation, onHome }) {
  return (
    <div className={styles.page}>
      <div className={styles.icon}>✅</div>
      <h2>예약이 완료되었습니다!</h2>

      <div className={styles.card}>
        <Row label="예약 번호" value={`#${reservation.id}`} />
        <Row label="테마" value={reservation.theme.name} />
        <Row label="날짜" value={reservation.date} />
        <Row label="시간" value={reservation.time.startAt.slice(0, 5)} />
        <Row label="예약자" value={reservation.name} />
        {reservation.amount != null && (
          <Row label="결제 금액" value={`${reservation.amount.toLocaleString()}원`} />
        )}
      </div>

      <button className={styles.homeBtn} onClick={onHome}>
        홈으로 돌아가기
      </button>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className={styles.row}>
      <span className={styles.label}>{label}</span>
      <span className={styles.value}>{value}</span>
    </div>
  );
}
