import { useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import ReservationPage from './pages/ReservationPage.jsx';
import ConfirmPage from './pages/ConfirmPage.jsx';
import MyReservationPage from './pages/MyReservationPage.jsx';
import ThemeManagePage from './pages/ThemeManagePage.jsx'; // 추가
import TimeManagePage from './pages/TimeManagePage.jsx';   // 추가
import SessionManagePage from './pages/SessionManagePage.jsx';
import styles from './App.module.css';

export default function App() {
    const [page, setPage] = useState('home');
    const [reservation, setReservation] = useState(null);
    const [toastMessage, setToastMessage] = useState('');

    const showToast = (message) => {
        setToastMessage(message);
        setTimeout(() => setToastMessage(''), 3000);
    };

    return (
        <div className={styles.app}>
            <header className={styles.header}>
                <h1 onClick={() => setPage('home')} className={styles.logo}>🔐 RoomScape</h1>
                <nav style={{ display: 'flex', gap: '8px' }}>
                    {/* 메뉴 추가 */}
                    <button className={styles.navBtn} onClick={() => setPage('themeManage')}>테마 관리</button>
                    <button className={styles.navBtn} onClick={() => setPage('timeManage')}>시간 관리</button>
                    <button className={styles.navBtn} onClick={() => setPage('sessionManage')}>세션 관리</button>
                    <button className={styles.navBtn} onClick={() => setPage('myReservations')}>내 예약 조회</button>
                </nav>
            </header>
            <main className={styles.main}>
                {page === 'home' && <HomePage onReserve={() => setPage('reservation')} showToast={showToast} />}
                {page === 'reservation' && (
                    <ReservationPage onConfirm={(data) => { setReservation(data); setPage('confirm'); }} onBack={() => setPage('home')} showToast={showToast} />
                )}
                {page === 'confirm' && <ConfirmPage reservation={reservation} onHome={() => setPage('home')} />}
                {page === 'myReservations' && <MyReservationPage onBack={() => setPage('home')} showToast={showToast} />}

                {/* 관리 페이지 렌더링 추가 */}
                {page === 'themeManage' && <ThemeManagePage onBack={() => setPage('home')} showToast={showToast} />}
                {page === 'timeManage' && <TimeManagePage onBack={() => setPage('home')} showToast={showToast} />}
                {page === 'sessionManage' && <SessionManagePage onBack={() => setPage('home')} showToast={showToast} />}
            </main>

            {toastMessage && (
                <div className={styles.toast}>
                    {toastMessage}
                </div>
            )}
        </div>
    );
}
