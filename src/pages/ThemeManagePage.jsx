import { useEffect, useState } from 'react';
import { fetchThemes, createTheme, updateTheme, deleteTheme } from '../api/index.js';
import styles from './ManagePage.module.css'; // 시간 관리 페이지와 CSS 공유

export default function ThemeManagePage({ onBack, showToast }) {
    const [themes, setThemes] = useState([]);
    const [isEditing, setIsEditing] = useState(false);
    const [editId, setEditId] = useState(null);

    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [thumbnailUrl, setThumbnailUrl] = useState('');

    const loadThemes = () => {
        fetchThemes().then(setThemes).catch(e => showToast(e.message));
    };

    useEffect(() => {
        loadThemes();
    }, []);

    const resetForm = () => {
        setIsEditing(false);
        setEditId(null);
        setName('');
        setDescription('');
        setThumbnailUrl('');
    };

    const handleEditClick = (theme) => {
        setIsEditing(true);
        setEditId(theme.id);
        setName(theme.name);
        setDescription(theme.description || '');
        setThumbnailUrl(theme.thumbnailUrl || '');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!name.trim()) return;

        const payload = { name, description, thumbnailUrl };
        try {
            if (isEditing) {
                await updateTheme(editId, payload);
                showToast('테마가 수정되었습니다.', 'success');
            } else {
                await createTheme(payload);
                showToast('새 테마가 추가되었습니다.', 'success');
            }
            resetForm();
            loadThemes();
        } catch (e) {
            showToast(e.message);
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('정말 이 테마를 삭제하시겠습니까?')) return;
        try {
            await deleteTheme(id);
            showToast('테마가 삭제되었습니다.', 'success');
            loadThemes();
        } catch (e) {
            showToast(e.message);
        }
    };

    return (
        <div className={styles.page}>
            <button className={styles.back} onClick={onBack}>← 돌아가기</button>
            <h2>테마 관리</h2>

            <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                    <label>테마 이름</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="예: 공포의 저택" />
                </div>
                <div className={styles.field}>
                    <label>설명</label>
                    <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="테마 설명 입력" />
                </div>
                <div className={styles.field}>
                    <label>썸네일 URL</label>
                    <input type="text" value={thumbnailUrl} onChange={e => setThumbnailUrl(e.target.value)} placeholder="https://..." />
                </div>
                <div className={styles.btnGroup}>
                    <button type="submit" className={styles.submitBtn}>{isEditing ? '수정하기' : '추가하기'}</button>
                    {isEditing && <button type="button" className={styles.cancelBtn} onClick={resetForm}>취소</button>}
                </div>
            </form>

            <ul className={styles.list}>
                {themes.map(t => (
                    <li key={t.id} className={styles.card}>
                        <div className={styles.info}>
                            <strong>{t.name}</strong>
                            <p>{t.description}</p>
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
