// static API Base URL
const API_BASE = 'https://ms-production-3df4.up.railway.app';

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
    const isLoginPage = window.location.href.includes('login.html');

    if (!token && !isLoginPage) {
        window.location.href = 'login.html';
        return;
    }

    // 2. Theme Initialization
    if (localStorage.getItem('mas_theme') === 'light') {
        document.body.classList.add('light-mode');
        document.getElementById('theme-icon')?.classList.replace('fa-moon', 'fa-sun');
    }

    // 3. User Info Display & Default View Load
    if (!isLoginPage) {
        displayUserInfo();
        const defaultNav = document.querySelector('.nav-item.active');
        switchView('overview', defaultNav);
        initProgressBars();
    }
});

function displayUserInfo() {
    const userStr = localStorage.getItem('mas_user');
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            // Sidebar footer info
            const nameEl = document.querySelector('.sidebar-footer .name');
            if (nameEl) nameEl.innerText = user.name || user.username || 'المدير العام';
            const roleEl = document.querySelector('.sidebar-footer .role');
            if (roleEl) roleEl.innerText = user.role || 'Admin';
            const avatarEl = document.querySelector('.sidebar-footer .avatar');
            if (avatarEl) avatarEl.innerText = (user.name || 'م').charAt(0);

            // Welcome message in navbar
            const subtitleEl = document.querySelector('.page-subtitle');
            if (subtitleEl) subtitleEl.innerText = `مرحباً بك في مركز التحكم الموحد لـ MAS MEDICAL HUB.`;

            // Role based menu trimming: Hide Doctors and Management views for Doctor role
            if (user.role === 'DOCTOR') {
                document.querySelectorAll('.nav-item').forEach(item => {
                    const clickAttr = item.getAttribute('onclick');
                    if (clickAttr && (clickAttr.includes("'doctors'") || clickAttr.includes("'management'") || clickAttr.includes("'secretaries'"))) {
                        item.style.display = 'none';
                    }
                });
            }

            // Capture Browser Device Info
            const browserInfo = navigator.userAgent.split(') ')[0].split(' (')[1] || 'Web Dashboard';
            localStorage.setItem('mas_last_device', browserInfo);
        } catch (e) {
            console.error("Error parsing user data", e);
        }
    }
}

async function fetchDashboardData() {
    const token = localStorage.getItem('mas_token');
    try {
        // Only fetch stats initially for speed. Other data is fetched when their view is loaded.
        const statsRes = await fetch(`${API_BASE}/stats/`, { headers: { 'Authorization': `Token ${token}` } });
        const statsData = await statsRes.json();

        updateDashboardUI({
            diagnoses_today: statsData?.stats?.today_diagnoses || 0,
            accuracy: statsData?.stats?.ai_accuracy || '98.5%',
            recent_queue: statsData?.recent_queue || []
        });

    } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
    }
}

function updateDashboardUI(data) {
    // Update Stat Cards with new IDs
    const docEl = document.getElementById('stat-total-doctors');
    if (docEl) docEl.innerText = data.total_doctors;

    const diagEl = document.getElementById('stat-diagnoses');
    if (diagEl) diagEl.innerText = data.diagnoses_today;

    const accEl = document.getElementById('stat-accuracy');
    if (accEl) accEl.innerText = data.accuracy;

    const patEl = document.getElementById('stat-total-patients'); // We should add this ID if needed or use total_patients elsewhere

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
                    <td>${item.confidence || '---'}</td>
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

// 2. Navigation Logic (Lazy Loading)
async function switchView(viewId, element) {
    const contentDiv = document.getElementById('dynamic-content');
    if (!contentDiv) return;

    // Show loader
    contentDiv.innerHTML = '<div class="loader" style="margin: 50px auto; display: block; text-align: center;">جاري التحميل...</div>';

    // Update active state in sidebar
    if (element) {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });
        element.classList.add('active');
    }

    // Update Header Text
    const titleObj = {
        'overview': 'نظرة عامة (Overview)',
        'users': 'سجل المرضى والمستفيدين',
        'doctors': 'الطاقم الطبي التخصصي',
        'secretaries': 'إدارة السكرتارية والموظفين',
        'management': 'إدارة العيادات والفروع',
        'ads': 'إحصائيات وإعلانات المركز',
        'system': 'لوحة التحكم المتقدمة للنظام'
    };

    const headerTitle = document.getElementById('current-page-title');
    if (headerTitle && titleObj[viewId]) {
        headerTitle.innerText = titleObj[viewId];
    }

    try {
        // Fetch HTML view dynamically
        const response = await fetch(`views/${viewId}.html`);
        if (!response.ok) throw new Error('View not found');
        const html = await response.text();

        // Inject HTML
        contentDiv.innerHTML = html;

        // Add animation class
        const firstChild = contentDiv.firstElementChild;
        if (firstChild && firstChild.classList) {
            firstChild.classList.add('view-section');
            setTimeout(() => firstChild.classList.add('active'), 10);
        }

        // Trigger Specific Data Fetching for the newly loaded view
        if (viewId === 'overview') {
            fetchDashboardData();
            // Need to re-initialize stats specific to overview if needed
            fetchStatsAndTotals();
        }
        if (viewId === 'users') fetchUsers();
        if (viewId === 'doctors') fetchDoctors();
        if (viewId === 'secretaries') fetchSecretaries();
        if (viewId === 'management') fetchBranches();
        if (viewId === 'ads') fetchAds();

    } catch (err) {
        console.error('Failed to load view:', err);
        contentDiv.innerHTML = `
            <div class="glass-panel" style="padding: 4rem; text-align: center;">
                <i class="fa-solid fa-tools" style="font-size: 4rem; color: var(--accent-light); margin-bottom: 2rem;"></i>
                <h2>جاري تطوير هذه الصفحة</h2>
                <p style="color: var(--text-muted);">هذه الوحدة الإدارية للذكاء الاصطناعي قيد الإنشاء ضمن التحديثات القادمة للوحة التحكم.</p>
            </div>`;
    }
}

// Helper to fetch totals for the overview page lazily
async function fetchStatsAndTotals() {
    const token = localStorage.getItem('mas_token');
    try {
        const [doctorsRes, patientsRes, branchesRes] = await Promise.all([
            fetch(`${API_BASE}/doctors/`, { headers: { 'Authorization': `Token ${token}` } }),
            fetch(`${API_BASE}/users/`, { headers: { 'Authorization': `Token ${token}` } }),
            fetch(`${API_BASE}/branches/`, { headers: { 'Authorization': `Token ${token}` } })
        ]);

        const doctors = await doctorsRes.json();
        const patients = await patientsRes.json();
        const branches = await branchesRes.json();

        const docEl = document.getElementById('stat-total-doctors');
        if (docEl) docEl.innerText = Array.isArray(doctors) ? doctors.length : 0;

        // Can add more stats mapping here if needed in overview
    } catch (err) {
        console.error('Stats and Totals fetch failed', err);
    }
}

// --- Modals ---
function openModal(id) {
    document.getElementById(id).style.display = 'block';
    if (id === 'addSecretaryModal') {
        populateBranchDropdown();
    }
}

function closeModal(id) {
    document.getElementById(id).style.display = 'none';
}

// Close on outside click
window.onclick = function (event) {
    if (event.target.className === 'modal') {
        event.target.style.display = "none";
    }
}

// --- Management Features ---

// 1. Branches Management
async function fetchBranches() {
    const TOKEN = localStorage.getItem('mas_token');
    try {
        const response = await fetch(`${API_BASE}/branches/`, {
            headers: { 'Authorization': `Token ${TOKEN}` }
        });
        const branches = await response.json();
        const tbody = document.querySelector('#branchesTable tbody');
        if (!tbody) return;
        tbody.innerHTML = '';

        branches.forEach(b => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${b.id}</td>
                <td>${b.governorate}</td>
                <td>${b.street_name}</td>
                <td>${b.contact_number || '---'}</td>
                <td><span class="badge badge-success">يعمل كعيادة</span></td>
                <td>
                    <div class="action-btns">
                        <button class="btn-icon delete" onclick="deleteBranch(${b.id})"><i class="fa-solid fa-trash"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Error fetching branches:", err);
    }
}

async function handleCreateBranch(e) {
    e.preventDefault();
    const TOKEN = localStorage.getItem('mas_token');
    const data = {
        governorate: document.getElementById('branchGov').value,
        street_name: document.getElementById('branchStreet').value,
        contact_number: document.getElementById('branchContact').value
    };

    try {
        const response = await fetch(`${API_BASE}/branches/`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Token ${TOKEN}`
            },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('تم إضافة العيادة بنجاح!');
            closeModal('addBranchModal');
            fetchBranches();
            document.getElementById('addBranchForm').reset();
        } else {
            alert('حدث خطأ أثناء الإضافة');
        }
    } catch (err) {
        alert('فشل الاتصال بالسيرفر');
    }
}

async function deleteBranch(id) {
    if (!confirm('هل أنت متأكد من حذف هذه العيادة؟')) return;
    const TOKEN = localStorage.getItem('mas_token');

    try {
        const response = await fetch(`${API_BASE}/branches/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${TOKEN}` }
        });

        if (response.ok) {
            fetchBranches();
            alert('تم الحذف بنجاح');
        } else {
            alert('فشل الحذف');
        }
    } catch (err) {
        alert('حدث خطأ');
    }
}

// 2. Secretaries Management
async function fetchSecretaries() {
    const TOKEN = localStorage.getItem('mas_token');
    const target = document.getElementById('secretariesList');
    if (!target) return;
    target.innerHTML = '<div class="loader">جاري التحميل...</div>';

    try {
        const response = await fetch(`${API_BASE}/secretaries/`, {
            headers: { 'Authorization': `Token ${TOKEN}` }
        });
        const data = await response.json();
        renderSecretaryTable(data);
    } catch (err) {
        target.innerHTML = 'خطأ في التحميل';
    }
}

function renderSecretaryTable(secretaries) {
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>الموظف</th>
                    <th>الفرع المسؤول</th>
                    <th>تاريخ التعيين</th>
                    <th>إجراءات</th>
                </tr>
            </thead>
            <tbody>
    `;

    secretaries.forEach(s => {
        const joinDate = s.user_details?.date_joined ? new Date(s.user_details.date_joined).toLocaleDateString('ar-SA') : 'غير محدد';
        html += `
            <tr>
                <td>
                    <div style="font-weight: 600;">${s.user_details?.first_name} ${s.user_details?.last_name || ''}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted);">${s.user_details?.email}</div>
                </td>
                <td>${s.branch_details?.governorate || '---'}</td>
                <td>${joinDate}</td>
                <td>
                    <button class="btn-icon delete" onclick="deleteSecretary(${s.id})"><i class="fa-solid fa-trash"></i></button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.getElementById('secretariesList').innerHTML = html;
}

async function populateBranchDropdown() {
    const TOKEN = localStorage.getItem('mas_token');
    try {
        const response = await fetch(`${API_BASE}/branches/`, {
            headers: { 'Authorization': `Token ${TOKEN}` }
        });
        const branches = await response.json();
        const select = document.getElementById('secBranch');
        if (!select) return;
        select.innerHTML = '<option value="">اختر العيادة / الفرع...</option>';

        branches.forEach(b => {
            const opt = document.createElement('option');
            opt.value = b.id;
            opt.textContent = `${b.governorate} - ${b.street_name}`;
            select.appendChild(opt);
        });
    } catch (err) {
        console.error("Error populating dropdown:", err);
    }
}

async function handleRegisterSecretary(e) {
    e.preventDefault();
    const data = {
        username: document.getElementById('secEmail').value,
        email: document.getElementById('secEmail').value,
        password: document.getElementById('secPassword').value,
        first_name: document.getElementById('secName').value,
        role: 'SECRETARY',
        branch_id: document.getElementById('secBranch').value
    };

    try {
        const response = await fetch(`${API_BASE}/register/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        if (response.ok) {
            alert('تم تسجيل الموظف بنجاح!');
            closeModal('addSecretaryModal');
            fetchSecretaries();
            document.getElementById('addSecretaryForm').reset();
        } else {
            const errData = await response.json();
            alert('خطأ: ' + (errData.error || 'حدث خطأ في التسجيل'));
        }
    } catch (err) {
        alert('فشل الاتصال بالسيرفر');
    }
}

async function deleteSecretary(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الحساب للموظف؟')) return;
    const TOKEN = localStorage.getItem('mas_token');

    try {
        const response = await fetch(`${API_BASE}/secretaries/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${TOKEN}` }
        });

        if (response.ok) {
            fetchSecretaries();
            alert('تم الحذف بنجاح');
        } else {
            alert('فشل الحذف');
        }
    } catch (err) {
        alert('حدث خطأ');
    }
}

// 3. Doctors Management (Viewing stats & joining dates)
async function fetchDoctors() {
    const token = localStorage.getItem('mas_token');
    const target = document.getElementById('doctorsList');
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

function renderDoctorTable(doctors) {
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>الطبيب</th>
                    <th>التخصص</th>
                    <th>العيادات / العمال</th>
                    <th>تاريخ الانضمام</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    doctors.forEach(d => {
        const joinDate = d.user_details?.date_joined ? new Date(d.user_details.date_joined).toLocaleDateString('ar-SA') : '---';
        html += `
            <tr>
                <td>
                    <div style="font-weight: 700; color: var(--accent-main)">د. ${d.user_details?.first_name} ${d.user_details?.last_name || ''}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">${d.user_details?.email}</div>
                </td>
                <td>${d.specialty}</td>
                <td>
                    <div class="stats-mini">
                        <span><i class="fa-solid fa-hospital"></i> ${d.branch_count || 0}</span>
                        <span><i class="fa-solid fa-user-tie"></i> ${d.secretary_count || 0}</span>
                    </div>
                </td>
                <td>${joinDate}</td>
                <td><span class="badge badge-success">نشط حالياً</span></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.getElementById('doctorsList').innerHTML = html;
}

// 4. Patients (Users) Management
async function fetchUsers() {
    const token = localStorage.getItem('mas_token');
    const target = document.getElementById('patientsList');
    if (!target) return;
    target.innerHTML = '<div class="loader">جاري التحميل...</div>';

    try {
        const response = await fetch(`${API_BASE}/users/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        // Filter for Patients only for this view
        const patients = data.filter(u => u.role === 'PATIENT');
        renderPatientTable(patients);
    } catch (err) {
        target.innerHTML = 'خطأ في التحميل';
    }
}

function renderPatientTable(patients) {
    let html = `
        <table class="admin-table">
            <thead>
                <tr>
                    <th>اسم المريض</th>
                    <th>البريد الإلكتروني</th>
                    <th>رقم الهاتف</th>
                    <th>تاريخ التسجيل</th>
                    <th>الحالة</th>
                </tr>
            </thead>
            <tbody>
    `;

    patients.forEach(p => {
        const joinDate = p.date_joined ? new Date(p.date_joined).toLocaleDateString('ar-SA') : '---';
        html += `
            <tr>
                <td>
                    <div style="font-weight: 600;">${p.first_name} ${p.last_name || ''}</div>
                    <div style="font-size: 0.75rem; color: var(--text-muted)">ID: #${p.id}</div>
                </td>
                <td>${p.email}</td>
                <td>${p.phone_number || 'غير متوفر'}</td>
                <td>${joinDate}</td>
                <td><span class="badge badge-primary">مريض مشفر</span></td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    document.getElementById('patientsList').innerHTML = html;
}

// --- Advertising Management ---
async function fetchAds() {
    const token = localStorage.getItem('mas_token');
    const table = document.getElementById('adsTable');
    const loader = document.querySelector('#view-ads .loader');

    try {
        const response = await fetch(`${API_BASE}/ad-banners/`, {
            headers: { 'Authorization': `Token ${token}` }
        });
        const ads = await response.json();

        loader.style.display = 'none';
        table.style.display = 'table';
        renderAdsTable(ads);
    } catch (err) {
        console.error("Error fetching ads:", err);
    }
}

function renderAdsTable(ads) {
    const tbody = document.querySelector('#adsTable tbody');
    tbody.innerHTML = '';

    ads.forEach(ad => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><img src="${ad.image}" class="ad-thumb"></td>
            <td>${ad.title}</td>
            <td>${ad.subtitle}</td>
            <td><span class="badge ${ad.is_active ? 'badge-success' : 'badge-warning'}">${ad.is_active ? 'نشط' : 'متوقف'}</span></td>
            <td>
                <div class="action-btns">
                    <button class="btn-icon delete" onclick="deleteAd(${ad.id})"><i class="fa-solid fa-trash"></i></button>
                    <button class="btn-icon edit"><i class="fa-solid fa-pen"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function previewAdImage(input) {
    const preview = document.getElementById('adImagePreview');
    if (input.files && input.files[0]) {
        const reader = new FileReader();
        reader.onload = function (e) {
            preview.style.display = 'block';
            preview.innerHTML = `<img src="${e.target.result}">`;
        }
        reader.readAsDataURL(input.files[0]);
    }
}

async function handleCreateAd(e) {
    e.preventDefault();
    const TOKEN = localStorage.getItem('mas_token');
    const formData = new FormData();
    formData.append('title', document.getElementById('adTitle').value);
    formData.append('subtitle', document.getElementById('adSubtitle').value);
    if (document.getElementById('adLink').value) {
        formData.append('link_url', document.getElementById('adLink').value);
    }
    formData.append('image', document.getElementById('adImage').files[0]);
    formData.append('is_active', true);

    try {
        const response = await fetch(`${API_BASE}/ad-banners/`, {
            method: 'POST',
            headers: { 'Authorization': `Token ${TOKEN}` },
            body: formData
        });

        if (response.ok) {
            alert('تم إضافة الإعلان بنجاح!');
            closeModal('addAdModal');
            fetchAds();
            document.getElementById('addAdForm').reset();
            document.getElementById('adImagePreview').style.display = 'none';
        } else {
            alert('خطأ في إضافة الإعلان');
        }
    } catch (err) {
        alert('فشل الاتصال بالسيرفر');
    }
}

async function deleteAd(id) {
    if (!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    const TOKEN = localStorage.getItem('mas_token');

    try {
        const response = await fetch(`${API_BASE}/ad-banners/${id}/`, {
            method: 'DELETE',
            headers: { 'Authorization': `Token ${TOKEN}` }
        });

        if (response.ok) {
            fetchAds();
        } else {
            alert('فشل في الحذف');
        }
    } catch (err) {
        alert('حدث خطأ');
    }
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

// --- Administrator System Controls ---
async function toggleSystemFeature(feature, isEnabled) {
    const token = localStorage.getItem('mas_token');

    // Optimistic UI update or simple alert for now
    // In a real scenario, this would send a request to a /settings/ endpoint on backend
    console.log(`Setting feature ${feature} to ${isEnabled}`);

    try {
        let featureName = '';
        switch (feature) {
            case 'brats': featureName = 'فحص أورام الدماغ'; break;
            case 'pneumonia': featureName = 'فحص التهاب الرئة'; break;
            case 'skin': featureName = 'أمراض الجلد'; break;
            case 'chat': featureName = 'المحادثة مع الذكاء الاصطناعي (Gemma)'; break;
            case 'maintenance': featureName = 'وضع الصيانة الشامل'; break;
        }

        const statusText = isEnabled ? 'تم تفعيله بنجاح' : 'تم إيقافه بنجاح';
        alert(`نظام MAS: ${featureName} ${statusText}.`);

        if (feature === 'maintenance' && isEnabled) {
            if (confirm("تحذير: لقد قمت بتفعيل وضع الصيانة العام. هل ترغب في تسجيل الخروج الآن؟")) {
                logout();
            }
        }

    } catch (err) {
        console.error("Failed to toggle feature", err);
        alert("فشل في تحديث إعدادات النظام. يرجى المحاولة لاحقاً.");
    }
}
