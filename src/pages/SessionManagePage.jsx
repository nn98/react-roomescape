import { useEffect, useState } from 'react';
import { fetchSessions, fetchThemes, fetchTimes, createSession, createSessionsBatch } from '../api/index.js';
import styles from './ManagePage.module.css';

const today = new Date().toISOString().split('T')[0];

export default function SessionManagePage({ onBack, showToast }) {
    const [sessions, setSessions] = useState([]);
    const [themes, setThemes] = useState([]);
    const [times, setTimes] = useState([]);

    const [date, setDate] = useState(today);
    const [themeId, setThemeId] = useState('');
    const [timeId, setTimeId] = useState('');

    const [batchDate, setBatchDate] = useState(today);

    useEffect(() => {
        fetchSessions().then(setSessions).catch(e => showToast(e.message));
        fetchThemes().then(setThemes).catch(e => showToast(e.message));
        fetchTimes().then(setTimes).catch(e => showToast(e.message));
    }, []);

    const reloadSessions = () =>
        fetchSessions().then(setSessions).catch(e => showToast(e.message));

    const handleCreateSession = async (e) => {
        e.preventDefault();
        if (!date || !themeId || !timeId) return;
        try {
            await createSession({ date, themeId: Number(themeId), timeId: Number(timeId) });
            showToast('세션이 생성되었습니다.');
            setThemeId('');
            setTimeId('');
            reloadSessions();
        } catch (err) {
            showToast(err.message);
        }
    };

    const handleBatchCreate = async (e) => {
        e.preventDefault();
        if (!batchDate) return;
        try {
            const created = await createSessionsBatch(batchDate);
            showToast(`${batchDate} 세션 ${created.length}개가 일괄 생성되었습니다.`);
            reloadSessions();
        } catch (err) {
            showToast(err.message);
        }
    };

    const getThemeName = (themeObj) => themeObj?.name ?? '-';
    const getTimeName = (timeObj) => timeObj?.startAt?.slice(0, 5) ?? '-';

    return (
        <div className={styles.page}>
            <button className={styles.back} onClick={onBack}>← 돌아가기</button>
            <h2>세션 관리</h2>

            <section>
                <h3 style={{ color: '#aaa', fontSize: '16px', marginBottom: '12px' }}>단일 세션 생성</h3>
                <form onSubmit={handleCreateSession} className={styles.form}>
                    <div className={styles.field}>
                        <label>날짜</label>
                        <input type="date" value={date} min={today} onChange={e => setDate(e.target.value)} required />
                    </div>
                    <div className={styles.field}>
                        <label>테마</label>
                        <select value={themeId} onChange={e => setThemeId(e.target.value)} required>
                            <option value="">테마를 선택하세요</option>
                            {themes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                    </div>
                    <div className={styles.field}>
                        <label>시간</label>
                        <select value={timeId} onChange={e => setTimeId(e.target.value)} required>
                            <option value="">시간을 선택하세요</option>
                            {times.map(t => <option key={t.id} value={t.id}>{t.startAt.slice(0, 5)}</option>)}
                        </select>
                    </div>
                    <div className={styles.btnGroup}>
                        <button type="submit" className={styles.submitBtn}>세션 생성</button>
                    </div>
                </form>
            </section>

            <section style={{ marginBottom: '30px' }}>
                <h3 style={{ color: '#aaa', fontSize: '16px', marginBottom: '12px' }}>날짜별 일괄 생성</h3>
                <form onSubmit={handleBatchCreate} className={styles.form}>
                    <div className={styles.field}>
                        <label>날짜</label>
                        <input type="date" value={batchDate} min={today} onChange={e => setBatchDate(e.target.value)} required />
                    </div>
                    <div className={styles.btnGroup}>
                        <button type="submit" className={styles.submitBtn}>일괄 생성</button>
                    </div>
                </form>
            </section>

            <section>
                <h3 style={{ color: '#aaa', fontSize: '16px', marginBottom: '12px' }}>전체 세션 목록</h3>
                <ul className={styles.list}>
                    {sessions.length === 0 ? (
                        <li style={{ color: '#666', textAlign: 'center', padding: '20px' }}>세션이 없습니다.</li>
                    ) : (
                        sessions.map(s => (
                            <li key={s.id} className={styles.card}>
                                <div className={styles.info}>
                                    <strong>{s.date}</strong>
                                    <p>{getThemeName(s.theme)} | {getTimeName(s.time)}</p>
                                </div>
                            </li>
                        ))
                    )}
                </ul>
            </section>
        </div>
    );
}
