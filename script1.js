
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-app.js";
import {
    getAuth,
    signInAnonymously
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    serverTimestamp,
    onSnapshot,
    query,
    where
} from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyC6Oab4i6WzrfsYCKdsSYoNCZ97dZYFEnI",
    authDomain: "geomark-956ca.firebaseapp.com",
    projectId: "geomark-956ca",
    storageBucket: "geomark-956ca.firebasestorage.app",
    messagingSenderId: "571872623382",
    appId: "1:571872623382:web:aa5317a9e4fb33dfbb6e37",
    measurementId: "G-GBPJDP9GBD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Firebase anonymous authentication
const firebaseReady = signInAnonymously(auth)
    .then(({ user }) => {
        console.log("Firebase authentication successful");
        return user;
    })
    .catch(error => {
        console.error("Firebase authentication failed:", error);
        return null;
    });

(() => {
    'use strict';

    const $ = (selector, root = document) =>
        root.querySelector(selector);

    const $$ = (selector, root = document) =>
        [...root.querySelectorAll(selector)];

    function get(key, fallback = '') {
        try {
            return localStorage.getItem(key) ?? fallback;
        } catch {
            return fallback;
        }
    }

    function set(key, value) {
        try {
            localStorage.setItem(key, value);
        } catch {
            // Local storage may be unavailable.
        }
    }

    const modal = $('#login-modal');
    const preLogin = $('#pre-login-view');
    const postLogin = $('#post-login-view');
    const toast = $('#toast');

    let toastTimer;
    let currentStudent = get('geomark-demo-student', '');
    let currentPosition = null;
    let chart = null;
    let chartType = 'doughnut';
    let attendanceResult = null;
    let stopAttendanceListener = null;

    const subjects = [
        {
            name: 'Data Structures',
            time: '10:00 AM – 11:00 AM',
            room: 'Room B204',
            status: 'Upcoming'
        },
        {
            name: 'Database Systems',
            time: '11:15 AM – 12:15 PM',
            room: 'Room A103',
            status: 'Upcoming'
        },
        {
            name: 'Computer Networks',
            time: '01:00 PM – 02:00 PM',
            room: 'Lab 2',
            status: 'Upcoming'
        },
        {
            name: 'Operating Systems',
            time: '02:15 PM – 03:15 PM',
            room: 'Room C201',
            status: 'Upcoming'
        }
    ];

    const chartData = {
        labels: [
            'Data Structures',
            'Database Systems',
            'Computer Networks',
            'Operating Systems',
            'Machine Learning Lab'
        ],
        values: [90, 82, 88, 85, 95]
    };

    // Display a temporary message.
    function showToast(message) {
        if (!toast) return;

        toast.textContent = message;
        toast.classList.remove('hidden');
        toast.classList.add('show');

        clearTimeout(toastTimer);

        toastTimer = setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hidden');
        }, 2800);
    }

    function openLogin() {
        modal?.classList.remove('hidden');
        $('#unique-id')?.focus();
    }

    function closeLogin() {
        modal?.classList.add('hidden');
    }

    // Switch between page views.
    function setView(viewName) {
        const target = document.getElementById(`${viewName}-view`);

        if (!target) return;

        $$('.view').forEach(view => {
            view.classList.toggle('hidden', view !== target);
            view.classList.toggle('active', view === target);
        });

        $$('.nav-link').forEach(button => {
            button.classList.toggle(
                'active',
                button.dataset.view === viewName
            );
        });

        $('#mobile-menu')?.classList.add('hidden');

        if (viewName === 'analytics') {
            drawChart();
        }

        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }

    // Render the timetable and subject statuses.
    function renderTimetable() {
        const list = $('#timetable-list');

        if (!list) return;

        list.innerHTML = subjects.map((subject, index) => `
            <div class="timetable-row">
                <div class="timetable-time">${subject.time}</div>

                <div class="timetable-marker ${index % 2 ? 'purple' : 'blue'
            }"></div>

                <div class="timetable-details">
                    <strong>${subject.name}</strong>
                    <span>${subject.room}</span>
                </div>

                <span class="status-chip">${subject.status}</span>
            </div>
        `).join('');
    }

    function resetDataStructuresStatus() {
        const subject = subjects.find(
            item => item.name === 'Data Structures'
        );

        if (subject) {
            subject.status = 'Upcoming';
        }

        renderTimetable();
    }

    // Listen for this demo student's attendance records in Firestore.
    // This function is inside the same scope as its variables.
    function listenForAttendance() {
        if (stopAttendanceListener) {
            stopAttendanceListener();
            stopAttendanceListener = null;
        }

        const user = auth.currentUser;

        if (!user || !currentStudent) return;

        const attendanceQuery = query(
            collection(db, 'attendance'),
            where('uid', '==', user.uid),
            where('studentId', '==', String(currentStudent)),
            where('subject', '==', 'Data Structures')
        );

        stopAttendanceListener = onSnapshot(
            attendanceQuery,
            snapshot => {
                const today = new Date();

                const isPresentToday = snapshot.docs.some(doc => {
                    const record = doc.data();

                    if (
                        record.status !== 'Present' ||
                        !record.createdAt
                    ) {
                        return false;
                    }

                    return record.createdAt.toDate().toDateString()
                        === today.toDateString();
                });

                const subject = subjects.find(
                    item => item.name === 'Data Structures'
                );

                if (subject) {
                    subject.status = isPresentToday
                        ? 'Present'
                        : 'Upcoming';

                    renderTimetable();
                }
            },
            error => {
                console.error(
                    'Attendance listener failed:',
                    error
                );

                showToast(
                    'Could not load attendance status. Check the Console.'
                );
            }
        );
    }

    window.updateDataStructuresStatus = function (isPresent) {
        const subject = subjects.find(
            item => item.name === 'Data Structures'
        );

        if (!subject) return;

        subject.status = isPresent ? 'Present' : 'Upcoming';
        renderTimetable();
    };

    // Demo login.
    async function login(event) {
        event.preventDefault();

        const id = $('#unique-id')?.value.trim();
        const password = $('#password')?.value;

        if (!id || !password) {
            showToast('Enter an ID and password to continue.');
            return;
        }

        // Wait for Firebase authentication to finish.
        const user = await firebaseReady;

        if (!user || !auth.currentUser) {
            showToast(
                'Firebase authentication is not ready. Refresh and try again.'
            );
            return;
        }

        // This is demo login, not verified account authentication.
        currentStudent = id;
        set('geomark-demo-student', id);

        resetDataStructuresStatus();
        listenForAttendance();

        const display = $('#student-id-display');

        if (display) {
            display.textContent = id;
        }

        preLogin?.classList.add('hidden');
        postLogin?.classList.remove('hidden');

        closeLogin();
        renderTimetable();
        setView('home');

        showToast(`Welcome, ${id}. Demo dashboard opened.`);
    }

    // Log out the current demo student.
    function logout() {
        if (stopAttendanceListener) {
            stopAttendanceListener();
            stopAttendanceListener = null;
        }

        currentStudent = '';
        set('geomark-demo-student', '');

        currentPosition = null;
        attendanceResult = null;

        resetDataStructuresStatus();

        preLogin?.classList.remove('hidden');
        postLogin?.classList.add('hidden');

        const title = $('#attendance-title');

        if (title) {
            title.textContent = 'Not checked yet';
        }

        const message = $('#attendance-message');

        if (message) {
            message.textContent =
                'Check your current location to see a demo result.';
        }

        const locationInfo = $('#location-info');

        if (locationInfo) {
            locationInfo.textContent =
                'Location has not been checked.';
        }

        setView('home');
        showToast('You have left the demo dashboard.');
    }

    // Calculate distance between two GPS coordinates.
    function getDistanceInMetres(lat1, lon1, lat2, lon2) {
        const radians = degrees => degrees * Math.PI / 180;

        const dLat = radians(lat2 - lat1);
        const dLon = radians(lon2 - lon1);

        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(radians(lat1)) *
            Math.cos(radians(lat2)) *
            Math.sin(dLon / 2) ** 2;

        return 6371000 * 2 *
            Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    // DEMO coordinates: replace these with your actual college coordinates.
    const CAMPUS_LAT = 10.667282;
    const CAMPUS_LON = 80.263584;
    const ALLOWED_RADIUS_METRES = 500;

    // Check the browser's current location and save attendance.
    async function checkLocation() {
        if (!navigator.geolocation) {
            showToast(
                'Geolocation is not supported by this browser.'
            );
            return;
        }

        if (!currentStudent) {
            showToast('Please log in before marking attendance.');
            return;
        }

        const button = $('#check-location-btn');
        const message = $('#attendance-message');
        const locationInfo = $('#location-info');

        if (!button || !message || !locationInfo) return;

        button.disabled = true;
        button.textContent = 'Getting your location...';

        message.textContent = 'Requesting your current location...';
        locationInfo.textContent = '';

        navigator.geolocation.getCurrentPosition(
            async position => {
                try {
                    const latitude = position.coords.latitude;
                    const longitude = position.coords.longitude;
                    const accuracy = position.coords.accuracy;

                    currentPosition = {
                        latitude,
                        longitude,
                        accuracy
                    };

                    locationInfo.innerHTML = `
                        <strong>Your current location</strong><br>
                        Latitude: ${latitude.toFixed(6)}<br>
                        Longitude: ${longitude.toFixed(6)}<br>
                        Accuracy: ±${Math.round(accuracy)} metres
                    `;

                    const distance = getDistanceInMetres(
                        latitude,
                        longitude,
                        CAMPUS_LAT,
                        CAMPUS_LON
                    );

                    if (distance > ALLOWED_RADIUS_METRES) {
                        const subject = subjects.find(
                            item => item.name === 'Data Structures'
                        );

                        if (subject) {
                            subject.status = 'Absent';
                            renderTimetable();
                        }

                        message.textContent =
                            `You are outside the campus area. Distance: ${Math.round(distance)} metres.`;

                        showToast('Absent: You are outside the allowed campus area.');
                        return;
                    }

                    message.textContent =
                        `Location is inside the campus area. ` +
                        `Distance: ${Math.round(distance)} metres.`;

                    const user = await firebaseReady;

                    if (!user || !auth.currentUser) {
                        throw new Error(
                            'Firebase authentication is not ready.'
                        );
                    }

                    await addDoc(collection(db, 'attendance'), {
                        subject: 'Data Structures',
                        studentId: String(currentStudent),
                        uid: auth.currentUser.uid,
                        status: 'Present',
                        createdAt: serverTimestamp()
                    });

                    showToast(
                        'Location verified. You are present!'
                    );

                    message.textContent +=
                        ' Data Structures attendance saved.';
                } catch (error) {
                    console.error(
                        'Attendance save failed:',
                        error
                    );

                    showToast(
                        'Attendance could not be saved. Check the Console.'
                    );

                    message.textContent +=
                        ' Attendance could not be saved. Please try again.';
                } finally {
                    button.disabled = false;
                    button.textContent = 'Check Location Again';
                }
            },
            error => {
                const errors = {
                    1: 'Location permission denied. Allow location access in your browser.',
                    2: 'Your location is currently unavailable. Try again.',
                    3: 'Location request timed out. Try again.'
                };

                message.textContent =
                    errors[error.code] ||
                    'Could not retrieve your location.';

                button.disabled = false;
                button.textContent = 'Try Again';
            },
            {
                enableHighAccuracy: true,
                timeout: 15000,
                maximumAge: 0
            }
        );
    }

    // Attendance analytics chart.
    function drawChart() {
        const canvas = $('#attendanceChart');

        if (!canvas || typeof Chart === 'undefined') return;

        if (chart) {
            chart.destroy();
        }

        chart = new Chart(canvas, {
            type: chartType,

            data: {
                labels: chartData.labels,

                datasets: [{
                    label: 'Attendance',
                    data: chartData.values,

                    backgroundColor: [
                        '#3478f6',
                        '#8b5cf6',
                        '#20b486',
                        '#f59e0b',
                        '#ec6697'
                    ],

                    borderWidth: 0,
                    borderRadius: 6,
                    hoverOffset: 6
                }]
            },

            options: {
                responsive: true,
                maintainAspectRatio: false,

                plugins: {
                    legend: {
                        display: chartType === 'doughnut',
                        position: 'bottom'
                    },

                    tooltip: {
                        callbacks: {
                            label: context =>
                                `${context.label}: ${context.raw}%`
                        }
                    }
                },

                scales: chartType === 'bar'
                    ? {
                        y: {
                            beginAtZero: true,
                            max: 100,

                            ticks: {
                                callback: value => `${value}%`
                            }
                        }
                    }
                    : {}
            }
        });
    }

    // Navigation and scroll links.
    document.addEventListener('click', event => {
        const viewButton = event.target.closest('[data-view]');

        if (viewButton) {
            event.preventDefault();

            const view = viewButton.dataset.view;

            if (view === 'home') {
                if (currentStudent) {
                    preLogin?.classList.add('hidden');
                    postLogin?.classList.remove('hidden');
                } else {
                    preLogin?.classList.remove('hidden');
                    postLogin?.classList.add('hidden');
                }
            }

            setView(view);
        }

        const scrollButton = event.target.closest('[data-scroll]');

        if (scrollButton) {
            document.getElementById(
                scrollButton.dataset.scroll
            )?.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });

    // Login modal buttons.
    $('#get-started-btn')?.addEventListener('click', openLogin);
    $('#cta-login')?.addEventListener('click', openLogin);
    $('#nav-login')?.addEventListener('click', openLogin);
    $('#close-modal-btn')?.addEventListener('click', closeLogin);

    $('#login-form')?.addEventListener('submit', login);
    $('#logout-btn')?.addEventListener('click', logout);

    modal?.addEventListener('click', event => {
        if (event.target === modal) {
            closeLogin();
        }
    });

    // Show or hide the password.
    $('#toggle-password')?.addEventListener('click', () => {
        const password = $('#password');

        if (!password) return;

        const show = password.type === 'password';

        password.type = show ? 'text' : 'password';

        $('#toggle-password').setAttribute(
            'aria-label',
            show ? 'Hide password' : 'Show password'
        );
    });

    // GPS button.
    $('#check-location-btn')?.addEventListener(
        'click',
        checkLocation
    );

    // Mobile navigation.
    $('#mobile-menu-button')?.addEventListener('click', () => {
        $('#mobile-menu')?.classList.toggle('hidden');
    });

    // Light/dark theme.
    $('#theme-toggle')?.addEventListener('click', () => {
        const isDark =
            document.body.classList.toggle('dark-mode');

        document.body.classList.toggle(
            'light-mode',
            !isDark
        );

        $('#theme-toggle').textContent =
            isDark ? '☀' : '☾';

        set('geomark-theme', isDark ? 'dark' : 'light');

        if (chart) {
            drawChart();
        }
    });

    // Chart type controls.
    $('#bar-chart-btn')?.addEventListener('click', () => {
        chartType = 'bar';

        $('#bar-chart-btn')?.classList.add('selected');
        $('#pie-chart-btn')?.classList.remove('selected');

        drawChart();
    });

    $('#pie-chart-btn')?.addEventListener('click', () => {
        chartType = 'doughnut';

        $('#pie-chart-btn')?.classList.add('selected');
        $('#bar-chart-btn')?.classList.remove('selected');

        drawChart();
    });

    // Close the login modal with Escape.
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape') {
            closeLogin();
        }
    });

    // Restore saved theme.
    if (get('geomark-theme') === 'dark') {
        document.body.classList.add('dark-mode');
        document.body.classList.remove('light-mode');

        $('#theme-toggle').textContent = '☀';
    }

    // Initial page state.
    renderTimetable();

    if (currentStudent) {
        const display = $('#student-id-display');

        if (display) {
            display.textContent = currentStudent;
        }

        preLogin?.classList.add('hidden');
        postLogin?.classList.remove('hidden');

        // Restore the student's attendance status after Firebase is ready.
        firebaseReady.then(user => {
            if (user && currentStudent) {
                listenForAttendance();
            }
        });
    } else {
        preLogin?.classList.remove('hidden');
        postLogin?.classList.add('hidden');
    }

    setView('home');
})();
