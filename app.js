import { initializeApp } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, query, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/12.10.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyAFP8jTi8O_yXhLwHmQdXmQ4TjhtuZvER0",
    authDomain: "soundofshine-11625.firebaseapp.com",
    projectId: "soundofshine-11625",
    storageBucket: "soundofshine-11625.firebasestorage.app",
    messagingSenderId: "764740446334",
    appId: "1:764740446334:web:c758cac0aa955bc490d02f",
    measurementId: "G-L3X2HQTP9S"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

document.addEventListener('DOMContentLoaded', () => {
    // === State Management ===
    let currentDate = new Date();
    let selectedDate = new Date();
    let editingReservationId = null;

    // === i18n Dictionary ===
    const translations = {
        ko: {
            "app.title": "희나리 동아리방 <span>예약</span>",
            "app.reserveBtn": "예약하기",
            "main.upcomingTitle": "다가오는 예약",
            "main.loading": "불러오는 중...",
            "main.noUpcoming": "현재 다가오는 예약이 없습니다.",
            "day.sun": "일", "day.mon": "월", "day.tue": "화", "day.wed": "수", "day.thu": "목", "day.fri": "금", "day.sat": "토",
            "main.scheduleBadge": "예약 내역",
            "main.noSchedule": "이 날은 예약이 없습니다.",
            "modal.newResTitle": "새로운 예약",
            "modal.editResTitle": "예약 수정",
            "modal.labelDate": "이용 날짜",
            "modal.labelStart": "시작 시간",
            "modal.labelEnd": "종료 시간",
            "modal.labelTeam": "팀명",
            "modal.phTeam": "예: 밴드팀",
            "modal.labelName": "예약자 이름",
            "modal.phName": "홍길동",
            "modal.labelCount": "사용 인원수",
            "modal.phCount": "예: 5",
            "modal.labelPurpose": "사용 목적",
            "modal.optEnsemble": "🎸 합주",
            "modal.optClass": "📚 강습",
            "modal.optMeeting": "정기회의",
            "modal.btnCancel": "취소",
            "modal.btnSubmit": "예약 완료",
            "modal.btnEdit": "수정 완료",
            "theme.title": "테마 설정",
            "theme.pastel": "파스텔 (기본)",
            "theme.modern": "모던 (깔끔)",
            "theme.dark": "다크 모드",
            "theme.ocean": "오션 (바다)",
            "theme.sunset": "선셋 (노을)",
            "theme.nature": "네이처 (자연)",
            "status.ongoing": "진행중",
            "status.nextDay": "(익일)",
            "btn.edit": "수정",
            "btn.cancel": "취소",
            "alert.confirmDelete": "정말로 [{team}] 팀의 예약을 취소하시겠습니까?",
            "alert.delFail": "예약 취소에 실패했습니다. 네트워크 연결을 확인해주세요.",
            "alert.sameTime": "시작 시간과 종료 시간이 같을 수 없습니다.",
            "alert.overlap": "해당 시간에 이미 예약된 일정이 있습니다. 다른 시간을 선택해주세요.",
            "alert.saveFail": "예약 저장에 실패했습니다. 네트워크 연결을 확인해주세요.",
            "btn.reserving": "예약 중...",
            "btn.editing": "수정 중..."
        },
        en: {
            "app.title": "Heenari Club Room <span>Resv</span>",
            "app.reserveBtn": "Reserve",
            "main.upcomingTitle": "Upcoming Reservations",
            "main.loading": "Loading...",
            "main.noUpcoming": "No upcoming reservations currently.",
            "day.sun": "Sun", "day.mon": "Mon", "day.tue": "Tue", "day.wed": "Wed", "day.thu": "Thu", "day.fri": "Fri", "day.sat": "Sat",
            "main.scheduleBadge": "Schedule",
            "main.noSchedule": "No reservations for this day.",
            "modal.newResTitle": "New Reservation",
            "modal.editResTitle": "Edit Reservation",
            "modal.labelDate": "Date",
            "modal.labelStart": "Start Time",
            "modal.labelEnd": "End Time",
            "modal.labelTeam": "Team Name",
            "modal.phTeam": "e.g., Rock Band",
            "modal.labelName": "Booker Name",
            "modal.phName": "John Doe",
            "modal.labelCount": "Headcount",
            "modal.phCount": "e.g., 5",
            "modal.labelPurpose": "Purpose",
            "modal.optEnsemble": "🎸 Ensemble",
            "modal.optClass": "📚 Class",
            "modal.optMeeting": "Meeting",
            "modal.btnCancel": "Cancel",
            "modal.btnSubmit": "Submit",
            "modal.btnEdit": "Update",
            "theme.title": "Theme Settings",
            "theme.pastel": "Pastel (Default)",
            "theme.modern": "Modern (Clean)",
            "theme.dark": "Dark Mode",
            "theme.ocean": "Ocean (Sea)",
            "theme.sunset": "Sunset (Evening)",
            "theme.nature": "Nature (Green)",
            "status.ongoing": "Ongoing",
            "status.nextDay": "(Next Day)",
            "btn.edit": "Edit",
            "btn.cancel": "Cancel",
            "alert.confirmDelete": "Are you sure you want to cancel the reservation for [{team}]?",
            "alert.delFail": "Failed to cancel reservation. Please check your network connection.",
            "alert.sameTime": "Start and end times cannot be the same.",
            "alert.overlap": "There is already a reservation during this time. Please choose another time.",
            "alert.saveFail": "Failed to save reservation. Please check your network connection.",
            "btn.reserving": "Saving...",
            "btn.editing": "Updating..."
        }
    };

    let currentLang = localStorage.getItem('bitsori_lang') || 'ko';

    // Reservations array (will be populated from Firebase)
    let reservations = [];

    // === DOM Elements ===
    const calendarGrid = document.getElementById('calendarGrid');
    const currentMonthYear = document.getElementById('currentMonthYear');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    const selectedDateTitle = document.getElementById('selectedDateTitle');
    const reservationsList = document.getElementById('reservationsList');
    const upcomingList = document.getElementById('upcomingList');

    const reservationModal = document.getElementById('reservationModal');
    const quickReserveBtn = document.getElementById('quickReserveBtn');
    const langToggleBtn = document.getElementById('langToggleBtn');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    const reservationForm = document.getElementById('reservationForm');
    const resDateInput = document.getElementById('resDate');
    const startTimeSelect = document.getElementById('startTime');
    const endTimeSelect = document.getElementById('endTime');

    // Theme Modal Elements
    const themeSettingsBtn = document.getElementById('themeSettingsBtn');
    const themeModal = document.getElementById('themeModal');
    const closeThemeModalBtn = document.getElementById('closeThemeModalBtn');
    const themeBtns = document.querySelectorAll('.theme-btn');

    // === Initialization ===
    updateLanguage(currentLang);
    populateTimeOptions();
    renderCalendar();
    updateScheduleView(selectedDate);
    setupRealtimeListener();

    // Theme initialization
    const savedTheme = localStorage.getItem('bitsori_theme') || 'pastel';
    document.body.className = savedTheme === 'pastel' ? '' : `theme-${savedTheme}`;
    themeBtns.forEach(btn => {
        if (btn.dataset.theme === savedTheme) {
            btn.style.borderColor = 'var(--accent-color)';
        }
    });

    resDateInput.addEventListener('change', updateAvailableTimeOptions);
    startTimeSelect.addEventListener('change', updateAvailableTimeOptions);

    // === Event Listeners ===
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });

    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });

    quickReserveBtn.addEventListener('click', () => openModal(selectedDate));
    closeModalBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    reservationModal.addEventListener('click', (e) => {
        if (e.target === reservationModal) closeModal();
    });

    reservationForm.addEventListener('submit', handleReservationSubmit);

    langToggleBtn.addEventListener('click', () => {
        currentLang = currentLang === 'ko' ? 'en' : 'ko';
        localStorage.setItem('bitsori_lang', currentLang);
        updateLanguage(currentLang);

        // Re-render components that rely on dynamic JS strings
        renderCalendar();
        updateScheduleView(selectedDate);
        renderUpcomingReservations();
    });

    // === Theme Modal Listeners ===
    themeSettingsBtn.addEventListener('click', () => {
        themeModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    });

    closeThemeModalBtn.addEventListener('click', () => {
        themeModal.classList.remove('active');
        document.body.style.overflow = 'auto';
    });

    themeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.dataset.theme;
            localStorage.setItem('bitsori_theme', theme);
            document.body.className = theme === 'pastel' ? '' : `theme-${theme}`;

            themeBtns.forEach(b => b.style.borderColor = 'transparent');
            btn.style.borderColor = 'var(--accent-color)';
        });
    });

    // === Firebase Functions ===

    function t(key, params = {}) {
        let text = translations[currentLang][key] || key;
        for (const [k, v] of Object.entries(params)) {
            text = text.replace(`{${k}}`, v);
        }
        return text;
    }

    function updateLanguage(lang) {
        // Update Static Texts
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if (translations[lang][key]) {
                el.innerHTML = translations[lang][key]; // innerHTML for <span> inclusion in title
            }
        });

        // Update Placeholders
        document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
            const key = el.getAttribute('data-i18n-placeholder');
            if (translations[lang][key]) {
                el.placeholder = translations[lang][key];
            }
        });

        // Toggle footer language visibility
        document.querySelector('[data-i18n="footer.ko"]').style.display = lang === 'ko' ? 'block' : 'none';
        document.querySelector('[data-i18n="footer.en"]').style.display = lang === 'en' ? 'block' : 'none';

        // Update Month Title dynamically
        updateMonthTitle();
    }

    function updateMonthTitle() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        if (currentLang === 'en') {
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            currentMonthYear.textContent = `${monthNames[month]} ${year}`;
        } else {
            currentMonthYear.textContent = `${year}년 ${month + 1}월`;
        }
    }

    // Initialize Time Dropdowns (30-min intervals)
    function populateTimeOptions() {
        const times = [];
        for (let h = 0; h <= 23; h++) {
            const hour = String(h).padStart(2, '0');
            times.push(`${hour}:00`);
            times.push(`${hour}:30`);
        }
        times.push("24:00");

        times.forEach(time => {
            startTimeSelect.add(new Option(time, time));
            endTimeSelect.add(new Option(time, time));
        });

        // Default values
        startTimeSelect.value = "10:00";
        endTimeSelect.value = "11:00";
    }

    // Listen to real-time updates from Firestore
    function setupRealtimeListener() {
        const q = query(collection(db, "reservations"));
        onSnapshot(q, (snapshot) => {
            reservations = [];
            snapshot.forEach((doc) => {
                reservations.push({ id: doc.id, ...doc.data() });
            });
            // Re-render views when data changes
            renderCalendar();
            updateScheduleView(selectedDate);
            renderUpcomingReservations();
        });
    }

    // === Functions ===

    function renderCalendar() {
        calendarGrid.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        updateMonthTitle(); // Updates currentMonthYear based on language

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        // Add empty cells for days before the 1st
        for (let i = 0; i < firstDay; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            calendarGrid.appendChild(emptyCell);
        }

        // Add day cells
        for (let day = 1; day <= daysInMonth; day++) {
            const cellDate = new Date(year, month, day);
            const dateString = formatDate(cellDate);

            const cell = document.createElement('div');
            cell.className = 'day-cell';

            // Highlight selected date
            if (formatDate(selectedDate) === dateString) {
                cell.classList.add('active');
            }

            // Day Number
            const dayNum = document.createElement('div');
            dayNum.className = 'day-number';
            dayNum.textContent = day;

            // Text color for weekends
            if (cellDate.getDay() === 0) dayNum.style.color = '#ef4444'; // Sunday
            if (cellDate.getDay() === 6) dayNum.style.color = '#3b82f6'; // Saturday

            cell.appendChild(dayNum);

            // Add tiny indicators for existing reservations
            const dayReservations = reservations.filter(r => r.date === dateString);
            if (dayReservations.length > 0) {
                const indicator = document.createElement('div');
                indicator.className = 'res-indicator';
                indicator.textContent = `${dayReservations.length}건`;
                cell.appendChild(indicator);
            }

            // Cell Click
            cell.addEventListener('click', () => {
                selectedDate = cellDate;
                renderCalendar(); // Re-render to update active styling
                updateScheduleView(selectedDate);
            });

            calendarGrid.appendChild(cell);
        }
    }

    function updateScheduleView(date) {
        const weekdaysKo = ['일', '월', '화', '수', '목', '금', '토'];
        const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const weekdays = currentLang === 'en' ? weekdaysEn : weekdaysKo;

        if (currentLang === 'en') {
            selectedDateTitle.textContent = `${date.getMonth() + 1}/${date.getDate()} (${weekdays[date.getDay()]})`;
        } else {
            selectedDateTitle.textContent = `${date.getMonth() + 1}월 ${date.getDate()}일 (${weekdays[date.getDay()]})`;
        }

        const dateString = formatDate(date);
        const dayReservations = reservations.filter(r => r.date === dateString);

        // Sort by start time
        dayReservations.sort((a, b) => a.startTime.localeCompare(b.startTime));

        reservationsList.innerHTML = '';

        if (dayReservations.length === 0) {
            reservationsList.innerHTML = `
                <div class="empty-state">
                    <i class="fa-regular fa-calendar-xmark"></i>
                    <p>${t('main.noSchedule')}</p>
                </div>
            `;
            return;
        }

        dayReservations.forEach(res => {
            const item = document.createElement('div');
            item.className = 'schedule-item';

            const nextDayBadge = res.isNextDay ? ` <span class="next-day-badge">${t('status.nextDay')}</span>` : '';
            // For purpose badge, if it's stored in Korean, we might want to map it if we really need to, but for now we display as is.

            item.innerHTML = `
                <div class="schedule-item-header">
                    <span class="time-range">${res.startTime} - ${res.endTime}${nextDayBadge}</span>
                    <span class="purpose-badge">${res.purpose}</span>
                </div>
                <div class="schedule-meta">
                    <span><i class="fa-regular fa-user"></i> ${res.userName} (${res.peopleCount})</span>
                </div>
                <div class="schedule-team-name">
                    ${res.teamName}
                </div>
                <div class="schedule-actions">
                    <button class="edit-res-btn" data-id="${res.id}">
                        <i class="fa-solid fa-pen"></i> ${t('btn.edit')}
                    </button>
                    <button class="delete-res-btn" data-id="${res.id}">
                        <i class="fa-solid fa-trash-can"></i> ${t('btn.cancel')}
                    </button>
                </div>
            `;

            // Add Event Listener for Buttons
            const editBtn = item.querySelector('.edit-res-btn');
            editBtn.addEventListener('click', () => handleEditReservation(res));

            const deleteBtn = item.querySelector('.delete-res-btn');
            deleteBtn.addEventListener('click', () => handleDeleteReservation(res.id, res.teamName));

            reservationsList.appendChild(item);
        });
    }

    function renderUpcomingReservations() {
        const now = new Date();
        const nowTs = now.getTime();

        // Map and filter reservations to only include future ones
        const upcomingRes = reservations.map(r => {
            return {
                ...r,
                endTs: getReservationTimestamp(r.date, r.endTime, r.isNextDay || false),
                startTs: getReservationTimestamp(r.date, r.startTime, false)
            };
        }).filter(r => r.endTs > nowTs);
        // End time hasn't passed yet means it's still ongoing or upcoming

        // Sort by start closest timeframe
        upcomingRes.sort((a, b) => a.startTs - b.startTs);

        // Take top 5
        const top5 = upcomingRes.slice(0, 5);

        upcomingList.innerHTML = '';

        if (top5.length === 0) {
            upcomingList.innerHTML = `
                <div class="empty-upcoming">
                    <p>${t('main.noUpcoming')}</p>
                </div>
            `;
            return;
        }

        top5.forEach(res => {
            const card = document.createElement('div');
            card.className = 'upcoming-card';

            const d = new Date(res.startTs);
            const m = d.getMonth() + 1;
            const day = d.getDate();
            const dateStr = currentLang === 'en' ? `${m}/${day}` : `${m}월 ${day}일`;

            const isOngoing = (res.startTs <= nowTs && res.endTs > nowTs);
            const statusBadge = isOngoing ? `<span class="status-badge ongoing">${t('status.ongoing')}</span>` : '';
            const nextDayBadge = res.isNextDay ? t('status.nextDay') : '';

            card.innerHTML = `
                <div class="upcoming-card-header">
                    <span class="uc-date">${dateStr}</span>
                    ${statusBadge}
                </div>
                <div class="uc-team">${res.teamName}</div>
                <div class="uc-time">${res.startTime} - ${res.endTime} ${nextDayBadge}</div>
            `;

            upcomingList.appendChild(card);
        });
    }

    function openModal(date) {
        editingReservationId = null;
        // Pre-fill date input if opening from a specific date
        resDateInput.value = formatDate(date);
        document.querySelector('.modal-header h2').textContent = t('modal.newResTitle');
        document.querySelector('#reservationForm button[type="submit"]').textContent = t('modal.btnSubmit');

        updateAvailableTimeOptions();

        reservationModal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }

    function closeModal() {
        reservationModal.classList.remove('active');
        reservationForm.reset();
        editingReservationId = null;

        document.querySelector('.modal-header h2').textContent = t('modal.newResTitle');
        document.querySelector('#reservationForm button[type="submit"]').textContent = t('modal.btnSubmit');

        // Reset time selects logic
        Array.from(startTimeSelect.options).forEach(opt => opt.disabled = false);
        Array.from(endTimeSelect.options).forEach(opt => opt.disabled = false);

        startTimeSelect.value = "10:00";
        endTimeSelect.value = "11:00";

        document.body.style.overflow = 'auto';
    }

    function handleEditReservation(res) {
        editingReservationId = res.id;

        resDateInput.value = res.date;
        document.getElementById('teamName').value = res.teamName;
        document.getElementById('userName').value = res.userName;
        document.getElementById('peopleCount').value = res.peopleCount;
        document.getElementById('purpose').value = res.purpose;

        updateAvailableTimeOptions();

        startTimeSelect.value = res.startTime;
        endTimeSelect.value = res.endTime;

        document.querySelector('#modalTitle').textContent = t('modal.editResTitle');
        document.querySelector('#submitResBtn').textContent = t('modal.btnEdit');

        reservationModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function updateAvailableTimeOptions() {
        const date = resDateInput.value;
        const currentStart = startTimeSelect.value;
        if (!date) return;

        const activeRes = reservations.filter(r => !editingReservationId || r.id !== editingReservationId);

        const scheduled = activeRes.map(r => ({
            startTs: getReservationTimestamp(r.date, r.startTime, false),
            endTs: getReservationTimestamp(r.date, r.endTime, r.isNextDay || false)
        }));

        Array.from(startTimeSelect.options).forEach(opt => {
            const time = opt.value;
            if (time === "24:00") {
                opt.disabled = true;
                return;
            }
            const optTs = getReservationTimestamp(date, time, false);
            const isOverlap = scheduled.some(r => optTs >= r.startTs && optTs < r.endTs);
            opt.disabled = isOverlap;
        });

        if (startTimeSelect.selectedOptions[0]?.disabled) {
            const firstAvailable = Array.from(startTimeSelect.options).find(opt => !opt.disabled);
            if (firstAvailable) startTimeSelect.value = firstAvailable.value;
        }

        const newCurrentStart = startTimeSelect.value;
        const newStartTs = getReservationTimestamp(date, newCurrentStart, false);

        const futureRes = scheduled.filter(r => r.startTs >= newStartTs).sort((a, b) => a.startTs - b.startTs);
        let maxEndTs = newStartTs + (24 * 60 * 60 * 1000);
        if (futureRes.length > 0) {
            maxEndTs = futureRes[0].startTs;
        }

        Array.from(endTimeSelect.options).forEach(opt => {
            const time = opt.value;
            let isNextDay = time <= newCurrentStart;
            if (time === "24:00" && newCurrentStart !== "24:00") {
                isNextDay = false;
            }
            if (time === newCurrentStart) {
                opt.disabled = true;
                return;
            }

            const optEndTs = getReservationTimestamp(date, time, isNextDay);
            opt.disabled = (optEndTs <= newStartTs || optEndTs > maxEndTs);
        });

        if (endTimeSelect.selectedOptions[0]?.disabled) {
            const firstAvailable = Array.from(endTimeSelect.options).find(opt => !opt.disabled);
            if (firstAvailable) endTimeSelect.value = firstAvailable.value;
        }
    }

    async function handleDeleteReservation(id, teamName) {
        const msg = t('alert.confirmDelete', { team: teamName });
        if (confirm(msg)) {
            try {
                // Delete from Firestore
                await deleteDoc(doc(db, "reservations", id));
                // Note: No need to manually refresh the UI or array!
                // The onSnapshot listener will detect the deletion and call renderCalendar / updateScheduleView automatically.
            } catch (e) {
                console.error("Error removing document: ", e);
                alert(t('alert.delFail'));
            }
        }
    }

    async function handleReservationSubmit(e) {
        e.preventDefault();

        const date = document.getElementById('resDate').value;
        const startTime = document.getElementById('startTime').value;
        const endTime = document.getElementById('endTime').value;

        // Validation: End time must be after Start time logic extended to cross-day bounds
        if (startTime === endTime) {
            alert(t('alert.sameTime'));
            return;
        }

        let isNextDay = endTime < startTime;

        // Validation: Overlap check using Timestamps
        const newStartTs = getReservationTimestamp(date, startTime, false);
        const newEndTs = getReservationTimestamp(date, endTime, isNextDay);

        const activeRes = reservations.filter(r => !editingReservationId || r.id !== editingReservationId);
        const isOverlapping = activeRes.some(res => {
            const rStartTs = getReservationTimestamp(res.date, res.startTime, false);
            const rEndTs = getReservationTimestamp(res.date, res.endTime, res.isNextDay || false);
            return (newStartTs < rEndTs && newEndTs > rStartTs);
        });

        if (isOverlapping) {
            alert(t('alert.overlap'));
            return;
        }

        const newReservation = {
            date: date,
            startTime: startTime,
            endTime: endTime,
            isNextDay: isNextDay,
            teamName: document.getElementById('teamName').value,
            userName: document.getElementById('userName').value,
            peopleCount: document.getElementById('peopleCount').value,
            purpose: document.getElementById('purpose').value
        };

        // Add or Update Firestore database
        try {
            const submitBtn = document.querySelector('#reservationForm button[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = editingReservationId ? t('btn.editing') : t('btn.reserving');
            submitBtn.disabled = true;

            if (editingReservationId) {
                await updateDoc(doc(db, "reservations", editingReservationId), newReservation);
            } else {
                newReservation.createdAt = new Date().toISOString();
                await addDoc(collection(db, "reservations"), newReservation);
            }

            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
            closeModal();

            // If the submitted date is the currently selected date, change selected Date focus visually
            if (date !== formatDate(selectedDate)) {
                selectedDate = new Date(date);
                currentDate = new Date(date);
            }
            // Realtime listener will automatically trigger UI update shortly!
        } catch (e) {
            console.error("Error adding document: ", e);
            alert(t('alert.saveFail'));
            const submitBtn = document.querySelector('#reservationForm button[type="submit"]');
            submitBtn.textContent = t('modal.btnSubmit');
            submitBtn.disabled = false;
        }
    }

    // Helper: Format date as YYYY-MM-DD for consistency
    function formatDate(date) {
        if (!date) return '';
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getReservationTimestamp(dateStr, timeStr, isNextDay = false) {
        if (!dateStr || !timeStr) return 0;
        let [year, month, day] = dateStr.split('-');
        let [hours, minutes] = timeStr.split(':');

        let d = new Date(year, month - 1, day, parseInt(hours), parseInt(minutes));
        if (isNextDay) {
            d.setDate(d.getDate() + 1);
        }
        return d.getTime();
    }
});
