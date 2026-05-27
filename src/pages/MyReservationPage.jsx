import { useState } from 'react';
import { getReservationsByName, deleteReservation, deleteWaiting } from '../api/index.js';
import styles from './MyReservationPage.module.css';

const getTheme = (item) => item.themeResponse ?? item.theme;
const getTime = (item) => item.timeResponse ?? item.time;
const isReservedItem = (item) => item.isReserved ?? true;
const formatTime = (time) => time?.startAt?.slice(0, 5) ?? '';
const getItemKey = (item) => {
    const theme = getTheme(item);
    const time = getTime(item);

    return item.id ?? `${item.name}-${item.date}-${time?.id}-${theme?.id}-${item.waitingNumber ?? 'reserved'}`;
};

export default function MyReservationPage({ onBack, showToast }) {
    const [userName, setUserName] = useState('');
    const [reservations, setReservations] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState(null); // 삭제 확인용 타겟 상태

    const handleSearch = (e) => {
        e.preventDefault(); // 폼 제출 시 새로고침 방지 (엔터 키 지원)
        if (!userName.trim()) return;

        getReservationsByName(userName)
            .then((data) => {
                setReservations(data);
                setHasSearched(true);
            })
            .catch((e) => showToast(e.message));
    };

    const reloadReservations = () => {
        return getReservationsByName(userName)
            .then((data) => {
                setReservations(data);
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
                showToast(`${isReserved ? '예약' : '대기'}이 성공적으로 취소되었습니다.`);
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
                        <p className={styles.empty}>조회된 예약이 없습니다.</p>
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
                                                {isReserved ? '예약' : '대기'}
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

            {/* 삭제 확인 모달 */}
            {deleteTarget && (() => {
                const theme = getTheme(deleteTarget);
                const time = getTime(deleteTarget);
                const isReserved = isReservedItem(deleteTarget);

                return (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <h3>정말 {isReserved ? '예약' : '대기'}을 취소하시겠습니까?</h3>
                        <div className={styles.modalInfo}>
                            <p><strong>테마:</strong> {theme.name}</p>
                            <p><strong>날짜:</strong> {deleteTarget.date}</p>
                            <p><strong>시간:</strong> {formatTime(time)}</p>
                            {!isReserved && <p><strong>대기 순번:</strong> {deleteTarget.waitingNumber}번</p>}
                        </div>
                        <div className={styles.modalActions}>
                            <button className={styles.cancelBtn} onClick={() => setDeleteTarget(null)}>닫기</button>
                            <button className={styles.confirmDeleteBtn} onClick={confirmDelete}>
                                {isReserved ? '예약' : '대기'} 취소
                            </button>
                        </div>
                    </div>
                </div>
                );
            })()}
        </div>
    );
}
