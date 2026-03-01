// static API Base URL
const API_BASE = 'https://mm-production-48d3.up.railway.app/api/medical';

// --- Core Logic ---
function toggleTheme() {
    const body = document.body;
    const icon = document.getElementById('theme-icon');

    if (body.classList.contains('light-mode')) {
        body.classList.remove('light-mode');
        icon?.classList.replace('fa-sun', 'fa-moon');
        localStorage.setItem('mas_theme', 'dark');
        updateChartTheme(false);
    } else {
        body.classList.add('light-mode');
        icon?.classList.replace('fa-moon', 'fa-sun');
        localStorage.setItem('mas_theme', 'light');
        updateChartTheme(true);
    }
}

function logout() {
    localStorage.removeItem('mas_token');
    localStorage.removeItem('mas_user');
    window.location.href = 'login.html';
}

// Set Initial Theme & Data
document.addEventListener('DOMContentLoaded', () => {
    // 1. Auth Guard
    const token = localStorage.getItem('mas_token');
    if (!token && !window.location.href.includes('login.html')) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Theme Initialization
    if (localStorage.getItem('mas_theme') === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-icon')?.classList.replace('fa-moon', 'fa-sun');
    }

    // 3. User Info Display
    displayUserInfo();

    // 4. Data Initialization
    fetchDashboardData();

    // Initialize Animations
    initProgressBars();
});

function displayUserInfo() {
    const userStr = localStorage.getItem('mas_user');
    if (userStr) {
        const user = JSON.parse(userStr);
        // Sidebar footer info
        const nameEl = document.querySelector('.sidebar-footer .name');
        if (nameEl) nameEl.innerText = user.name;
        const roleEl = document.querySelector('.sidebar-footer .role');
        if (roleEl) roleEl.innerText = user.role;
        const avatarEl = document.querySelector('.sidebar-footer .avatar');
        if (avatarEl) avatarEl.innerText = user.name.charAt(0);

        // Welcome message in navbar
        const subtitleEl = document.querySelector('.page-subtitle');
        if (subtitleEl) subtitleEl.innerText = `أهلاً بك يا ${user.name} في مركز التحكم بـ MAS AI.`;
    }
}

async function fetchDashboardData() {
    const token = localStorage.getItem('mas_token');
    try {
        const response = await fetch(`${API_BASE}/stats/`, {
            headers: { 'Authorization': `Token ${token}` }
        });

        if (!response.ok) throw new Error('Unauthorized');

        const data = await response.json();
        updateDashboardUI(data);
    } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
    }
}

function updateDashboardUI(data) {
    // Update Stat Cards
    const cards = document.querySelectorAll('.stat-details');
    if (cards.length >= 4) {
        cards[0].querySelector('.value').innerText = data.stats.total_users;
        cards[1].querySelector('.value').innerText = data.stats.today_diagnoses;
        cards[2].querySelector('.value').innerText = data.stats.ai_accuracy;
        cards[3].querySelector('.value').innerText = data.stats.server_pressure;
    }

    // Update Table
    const tbody = document.querySelector('.admin-table tbody');
    if (tbody && data.recent_queue) {
        tbody.innerHTML = '';
        data.recent_queue.forEach(item => {
            tbody.innerHTML += `
                <tr>
                    <td>${item.id}</td>
                    <td>
                        <div class="tbl-user">
                            <i class="fa-solid fa-user-circle" style="font-size: 1.5rem; opacity: 0.5;"></i>
                            ${item.user}
                        </div>
                    </td>
                    <td>${item.type}</td>
                    <td>${item.time}</td>
                    <td>${item.confidence}</td>
                    <td><span class="badge badge-success">${item.status}</span></td>
                </tr>
            `;
        });
    }

    // Initialize/Update Chart
    if (document.getElementById('activityChart')) {
        initChart(data.chart_data);
    }
}

// 2. Navigation Logic
function switchView(viewId, element) {
    // Hide all views
    document.querySelectorAll('.view-section').forEach(view => {
        view.classList.remove('active');
        view.style.display = 'none'; // Ensure CSS active state works or force hide
    });

    // Remove active class from navs
    document.querySelectorAll('.nav-item').forEach(nav => {
        nav.classList.remove('active');
    });

    // Activate target
    element.classList.add('active');

    const targetView = document.getElementById('view-' + viewId);
    if (targetView) {
        targetView.classList.add('active');
        targetView.style.display = 'block';
    } else {
        // Fallback placeholder
        document.getElementById('view-placeholder').classList.add('active');
        document.getElementById('view-placeholder').style.display = 'block';
    }

    // Update Header Text
    const titleObj = {
        'overview': 'نظرة عامة (Overview)',
        'users': 'إدارة المستخدمين',
        'ai-models': 'نماذج الذكاء الاصطناعي',
        'doctors': 'الكادر الطبي',
        'system': 'حالة النظام'
    };

    const headerTitle = document.getElementById('current-page-title');
    if (headerTitle && titleObj[viewId]) {
        headerTitle.innerText = titleObj[viewId];
    }

    // Trigger Specific Data Fetching
    if (viewId === 'users') fetchUsers();
    if (viewId === 'doctors') fetchDoctors();
}

async function fetchUsers() {
    const token = localStorage.getItem('mas_token');
    const target = document.querySelector('#view-users .table-responsive');
    if (!target) return;
    target.innerHTML = '<div class="loader">جاري التحميل...</div>';

    try {
        const response = await fetch(`${API_BASE}/profiles/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        renderUserTable(data);
    } catch (err) {
        target.innerHTML = 'خطأ في التحميل';
    }
}

async function fetchDoctors() {
    const token = localStorage.getItem('mas_token');
    const target = document.querySelector('#view-doctors .table-responsive');
    if (!target) return;
    target.innerHTML = '<div class="loader">جاري التحميل...</div>';

    try {
        const response = await fetch(`${API_BASE}/doctors/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        renderDoctorTable(data);
    } catch (err) {
        target.innerHTML = 'خطأ في التحميل';
    }
}

function renderUserTable(users) {
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>المستخدم</th>
                    <th>البريد</th>
                    <th>الدور</th>
                    <th>تاريخ الانضمام</th>
                </tr>
            </thead>
            <tbody>
    `;

    users.forEach(u => {
        html += `
            <tr>
                <td>${u.user_details.first_name} ${u.user_details.last_name || ''}</td>
                <td>${u.user_details.email}</td>
                <td><span class="badge badge-primary">${u.role}</span></td>
                <td>${u.created_at || '---'}</td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.querySelector('#view-users .table-responsive').innerHTML = html;
}

function renderDoctorTable(doctors) {
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>الطبيب</th>
                    <th>التخصص</th>
                    <th>المستوى</th>
                </tr>
            </thead>
            <tbody>
    `;

    doctors.forEach(d => {
        html += `
            <tr>
                <td>د. ${d.user_details.first_name} ${d.user_details.last_name || ''}</td>
                <td>${d.specialty}</td>
                <td><span class="badge badge-success">${d.level}</span></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.querySelector('#view-doctors .table-responsive').innerHTML = html;
}

// 3. UI Animations (Progress Bars)
function initProgressBars() {
    setTimeout(() => {
        document.querySelectorAll('.progress-track').forEach(track => {
            const val = track.style.getPropertyValue('--val');
            const fill = track.querySelector('.progress-fill');
            if (fill) fill.style.width = val;
        });
    }, 500); // Small delay for visual effect on load
}

// 4. Chart.js Implementation
let activityChart;

function initChart(chartData) {
    const ctx = document.getElementById('activityChart').getContext('2d');

    // Fallback if no data
    const labels = chartData && chartData.length ? chartData.map(d => d.day) : ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'];
    const values = chartData && chartData.length ? chartData.map(d => d.count) : [0, 0, 0, 0, 0, 0, 0];

    if (activityChart) {
        activityChart.data.labels = labels;
        activityChart.data.datasets[0].data = values;
        activityChart.update();
        return;
    }

    // Gradient for line
    let gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 212, 255, 0.5)'); // Accent Main
    gradient.addColorStop(1, 'rgba(0, 212, 255, 0.0)');

    const isLight = document.body.classList.contains('light-mode');
    const textColor = isLight ? '#64748b' : '#8b9bb4';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';

    activityChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'عدد التشخيصات الناجحة',
                data: values,
                borderColor: '#00d4ff',
                backgroundColor: gradient,
                borderWidth: 3,
                pointBackgroundColor: '#0a0e17',
                pointBorderColor: '#00d4ff',
                pointBorderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 6,
                fill: true,
                tension: 0.4 // Smooth curves
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15, 21, 34, 0.9)',
                    titleFont: { family: 'Cairo', size: 14 },
                    bodyFont: { family: 'Cairo', size: 14 },
                    padding: 10,
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                    borderWidth: 1,
                    displayColors: false,
                    callbacks: {
                        label: function (context) {
                            return 'تشخيص: ' + context.parsed.y;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: gridColor, drawBorder: false },
                    ticks: { color: textColor, font: { family: 'Cairo' } }
                },
                x: {
                    grid: { display: false, drawBorder: false },
                    ticks: { color: textColor, font: { family: 'Cairo' } }
                }
            }
        }
    });
}

function updateChartTheme(isLight) {
    if (!activityChart) return;

    const textColor = isLight ? '#64748b' : '#8b9bb4';
    const gridColor = isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)';
    const pointBg = isLight ? '#ffffff' : '#0a0e17';

    activityChart.options.scales.x.ticks.color = textColor;
    activityChart.options.scales.y.ticks.color = textColor;
    activityChart.options.scales.y.grid.color = gridColor;
    activityChart.data.datasets[0].pointBackgroundColor = pointBg;

    activityChart.update();
}
