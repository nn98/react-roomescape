import { useEffect, useState } from 'react';
import HomePage from './pages/HomePage.jsx';
import ReservationPage from './pages/ReservationPage.jsx';
import ConfirmPage from './pages/ConfirmPage.jsx';
import MyReservationPage from './pages/MyReservationPage.jsx';
import ThemeManagePage from './pages/ThemeManagePage.jsx';
import TimeManagePage from './pages/TimeManagePage.jsx';
import SessionManagePage from './pages/SessionManagePage.jsx';
import PaymentSuccessPage from './pages/PaymentSuccessPage.jsx';
import styles from './App.module.css';

const getInitialPage = () => {
    const payment = new URLSearchParams(window.location.search).get('payment');
    if (payment === 'success') return 'paymentSuccess';
    if (payment === 'fail') return 'paymentFail';
    return 'home';
};

export default function App() {
    const [page, setPage] = useState(getInitialPage);
    const [reservation, setReservation] = useState(null);
    const [toast, setToast] = useState({ message: '', type: 'error' });

    const showToast = (message, type = 'error') => {
        setToast({ message, type });
        setTimeout(() => setToast({ message: '', type: 'error' }), 3000);
    };

    // 결제 실패 리디렉션 처리
    useEffect(() => {
        if (page !== 'paymentFail') return;
        const message = new URLSearchParams(window.location.search).get('message') || '결제가 취소되었습니다.';
        window.history.replaceState({}, '', '/');
        showToast(message);
        setPage('home');
    }, []);

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
                    <ReservationPage
                        onConfirm={(data) => { setReservation(data); setPage('confirm'); }}
                        onBack={() => setPage('home')}
                        showToast={showToast}
                    />
                )}
                {page === 'paymentSuccess' && (
                    <PaymentSuccessPage
                        onConfirm={(data) => { setReservation(data); setPage('confirm'); }}
                        onBack={() => setPage('home')}
                        showToast={showToast}
                    />
                )}
                {page === 'confirm' && <ConfirmPage reservation={reservation} onHome={() => setPage('home')} />}
                {page === 'myReservations' && <MyReservationPage onBack={() => setPage('home')} showToast={showToast} />}

                {page === 'themeManage' && <ThemeManagePage onBack={() => setPage('home')} showToast={showToast} />}
                {page === 'timeManage' && <TimeManagePage onBack={() => setPage('home')} showToast={showToast} />}
                {page === 'sessionManage' && <SessionManagePage onBack={() => setPage('home')} showToast={showToast} />}
            </main>

            {toast.message && (
                <div className={toast.type === 'success' ? styles.toastSuccess : styles.toast}>
                    {toast.message}
                </div>
            )}
        </div>
    );
}
