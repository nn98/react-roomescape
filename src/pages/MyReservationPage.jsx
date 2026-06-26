import { useState } from 'react';
import { getReservationsByName, getPaymentHistory, deleteReservation, deleteWaiting } from '../api/index.js';
import styles from './MyReservationPage.module.css';

// 결제 상태별 배지 색상 클래스. 라벨(결제 대기/확정/실패/확인 필요)은 서버 statusLabel을 그대로 사용.
const PAYMENT_STATUS_CLASS = {
    CONFIRMED: styles.confirmed,
    PENDING: styles.pending,
    FAILED: styles.failed,
    UNKNOWN: styles.unknown,
};

const getTheme = (item) => item.themeResponse ?? item.theme;
const getTime = (item) => item.timeResponse ?? item.time;
const isReservedItem = (item) => item.isReserved ?? true;
const getReservationType = (isReserved) => isReserved ? '예약' : '대기';
const getReservationTypeWithObjectParticle = (isReserved) => isReserved ? '예약을' : '대기를';
const getCancelCompleteMessage = (isReserved) => isReserved ? '예약이 취소되었습니다.' : '대기가 취소되었습니다.';
const formatTime = (time) => time?.startAt?.slice(0, 5) ?? '';
const getItemKey = (item) => {
    const theme = getTheme(item);
    const time = getTime(item);

    return item.id ?? `${item.name}-${item.date}-${time?.id}-${theme?.id}-${item.waitingNumber ?? 'reserved'}`;
};

export default function MyReservationPage({ onBack, showToast }) {
    const [userName, setUserName] = useState('');
    const [reservations, setReservations] = useState([]);
    const [payments, setPayments] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // 삭제 확인용 타겟 상태

    const handleSearch = (e) => {
        e.preventDefault(); // 폼 제출 시 새로고침 방지 (엔터 키 지원)
        if (!userName.trim()) return;
        reloadReservations().catch((e) => showToast(e.message));
    };

    const reloadReservations = () => {
        return Promise.all([getReservationsByName(userName), getPaymentHistory(userName)])
            .then(([reservationData, paymentData]) => {
                setReservations(reservationData);
                setPayments(paymentData);
                setHasSearched(true);
            });
    };

    const confirmDelete = () => {
        const isReserved = isReservedItem(deleteTarget);
        const deleteRequest = isReserved
            ? deleteReservation(deleteTarget.id, userName)
            : deleteWaiting(deleteTarget.id, userName);

        deleteRequest
            .then(() => {
                showToast(getCancelCompleteMessage(isReserved), 'success');
                setDeleteTarget(null);
                return reloadReservations();
            })
            .catch((e) => {
                showToast(e.message);
                setDeleteTarget(null);
            });
    };

    return (
        <div className={styles.page}>
            <button className={styles.back} onClick={onBack}>← 돌아가기</button>
            <h2>내 예약 조회</h2>

            <form onSubmit={handleSearch} className={styles.searchForm}>
                <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="예약자 이름을 입력하세요"
                    required
                />
                <button type="submit" className={styles.searchBtn}>조회</button>
            </form>

            {hasSearched && (
                <div className={styles.list}>
                    {reservations.length === 0 ? (
                        <p className={styles.empty}>조회된 예약 또는 대기가 없습니다.</p>
                    ) : (
                        reservations.map(item => {
                            const theme = getTheme(item);
                            const time = getTime(item);
                            const isReserved = isReservedItem(item);
                            const canCancel = item.id != null;

                            return (
                                <div key={getItemKey(item)} className={styles.card}>
                                    <div className={styles.info}>
                                        <div className={styles.titleRow}>
                                            <p className={styles.themeName}>{theme.name}</p>
                                            <span className={`${styles.statusBadge} ${isReserved ? styles.reserved : styles.waiting}`}>
                                                {getReservationType(isReserved)}
                                            </span>
                                        </div>
                                        <p className={styles.dateTime}>{item.date} | {formatTime(time)}</p>
                                        {!isReserved && (
                                            <p className={styles.waitingNumber}>대기 순번 {item.waitingNumber}번</p>
                                        )}
                                    </div>
                                    {canCancel && (
                                        <button className={styles.deleteBtn} onClick={() => setDeleteTarget(item)}>취소</button>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}

            {hasSearched && payments.length > 0 && (
                <>
                    <h3 className={styles.sectionTitle}>주문 / 결제 내역</h3>
                    <div className={styles.list}>
                        {payments.map((payment) => {
                            const time = getTime(payment);
                            const statusClass = PAYMENT_STATUS_CLASS[payment.status] ?? '';

                            return (
                                <div key={payment.orderId} className={styles.card}>
                                    <div className={styles.info}>
                                        <div className={styles.titleRow}>
                                            <p className={styles.themeName}>{payment.theme?.name ?? '주문'}</p>
                                            <span className={`${styles.statusBadge} ${statusClass}`}>
                                                {payment.statusLabel}
                                            </span>
                                        </div>
                                        {payment.date && (
                                            <p className={styles.dateTime}>{payment.date} | {formatTime(time)}</p>
                                        )}
                                        {payment.amount != null && (
                                            <p className={styles.amount}>{payment.amount.toLocaleString()}원</p>
                                        )}
                                        {payment.status === 'UNKNOWN' && (
                                            <p className={styles.unknownHint}>
                                                결제 결과가 확인되지 않았습니다. 잠시 후 다시 시도해 상태를 확인하세요.
                                            </p>
                                        )}
                                        <p className={styles.orderId}>주문번호 {payment.orderId}</p>
                                        {payment.paymentKey && (
                                            <p className={styles.orderId}>결제키 {payment.paymentKey}</p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* 삭제 확인 모달 */}
            {deleteTarget && (() => {
                const theme = getTheme(deleteTarget);
                const time = getTime(deleteTarget);
                const isReserved = isReservedItem(deleteTarget);

                return (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>정말 {getReservationTypeWithObjectParticle(isReserved)} 취소하시겠습니까?</h3>
                        <div className={styles.modalInfo}>
                            <p><strong>테마:</strong> {theme.name}</p>
                            <p><strong>날짜:</strong> {deleteTarget.date}</p>
                            <p><strong>시간:</strong> {formatTime(time)}</p>
                            {!isReserved && <p><strong>대기 순번:</strong> {deleteTarget.waitingNumber}번</p>}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>닫기</button>
                            <button className={styles.confirmDeleteBtn} onClick={confirmDelete}>
                                {getReservationType(isReserved)} 취소
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}
        </div>
    );
}
