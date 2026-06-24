import { useEffect, useState } from 'react';
import { fetchTimes, createTime, updateTime, deleteTime } from '../api/index.js';
import styles from './ManagePage.module.css'; // 테마 관리 페이지와 CSS 공유

export default function TimeManagePage({ onBack, showToast }) {
    const [times, setTimes] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);
    const [startAt, setStartAt] = useState('');

    const loadTimes = () => {
        fetchTimes().then(setTimes).catch(e => showToast(e.message));
    };

    useEffect(() => {
        loadTimes();
    }, []);

    const resetForm = () => {
        setIsEditing(false);
        setEditId(null);
        setStartAt('');
    };

    const handleEditClick = (time) => {
        setIsEditing(true);
        setEditId(time.id);
        setStartAt(time.startAt.slice(0, 5)); // HH:mm:ss -> HH:mm
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!startAt) return;

        try {
            if (isEditing) {
                await updateTime(editId, { startAt });
                showToast('시간이 수정되었습니다.', 'success');
            } else {
                await createTime({ startAt });
                showToast('새 시간이 추가되었습니다.', 'success');
            }
            resetForm();
            loadTimes();
        } catch (e) {
            showToast(e.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말 이 시간을 삭제하시겠습니까?')) return;
        try {
            await deleteTime(id);
            showToast('시간이 삭제되었습니다.', 'success');
            loadTimes();
        } catch (e) {
            showToast(e.message);
        }
    };

    return (
        <div className={styles.page}>
            <button className={styles.back} onClick={onBack}>← 돌아가기</button>
            <h2>시간 관리</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                    <label>예약 시간</label>
                    <input type="time" value={startAt} onChange={e => setStartAt(e.target.value)} required />
                </div>
                <div className={styles.btnGroup}>
                    <button type="submit" className={styles.submitBtn}>{isEditing ? '수정하기' : '추가하기'}</button>
                    {isEditing && <button type="button" className={styles.cancelBtn} onClick={resetForm}>취소</button>}
                </div>
            </form>

            <ul className={styles.list}>
                {times.map(t => (
                    <li key={t.id} className={styles.card}>
                        <div className={styles.info}>
                            <strong>{t.startAt.slice(0, 5)}</strong>
                        </div>
                        <div className={styles.actions}>
                            <button className={styles.editBtn} onClick={() => handleEditClick(t)}>수정</button>
                            <button className={styles.deleteBtn} onClick={() => handleDelete(t.id)}>삭제</button>
                        </div>
                    </li>
                ))}
            </ul>
        </div>
    );
}
