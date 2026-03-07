<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MAS - نظام التحليل الطبي</title>
    <link rel="stylesheet" href="style.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
</head>
<body>
    <div class="app-container">
        <!-- Sidebar -->
        <aside class="sidebar">
            <div class="logo">
                <i class="fa-solid fa-heart-pulse"></i>
                <span>MAS</span> System
            </div>
            <ul class="nav-links">
                <li class="nav-item active">
                    <i class="fa-solid fa-chart-line"></i>
                    <span>لوحة التحكم</span>
                </li>
                <li class="nav-item">
                    <i class="fa-solid fa-user-doctor"></i>
                    <span>المرضى</span>
                </li>
                <li class="nav-item">
                    <i class="fa-solid fa-file-medical"></i>
                    <span>التقارير</span>
                </li>
                <li class="nav-item">
                    <i class="fa-solid fa-gear"></i>
                    <span>الإعدادات</span>
                </li>
            </ul>
        </aside>

        <!-- Main Content -->
        <main class="main-content">
            <header class="header">
                <div>
                    <h1>لوحة التحليل الطبي</h1>
                    <p style="color: var(--text-secondary)">التشخيص والمراقبة بالذكاء الاصطناعي في الوقت الفعلي</p>
                </div>
                <div class="user-profile" style="text-align: right;">
                    <div style="text-align: left;">
                        <div style="font-weight: 600">د. أسامة</div>
                        <div style="font-size: 0.8rem; color: var(--text-secondary)">أخصائي قلب</div>
                    </div>
                    <div class="user-avatar"></div>
                </div>
            </header>

            <div class="dashboard-grid">
                <!-- Chest X-Ray Upload -->
                <div class="card upload-card" id="drop-zone">
                    <div class="card-header">
                        <span class="card-title"><i class="fa-solid fa-x-ray"></i> تحليل أشعة الصدر</span>
                        <span class="badge" style="background: rgba(0, 212, 255, 0.1); color: var(--accent-color); padding: 4px 8px; border-radius: 4px; font-size: 0.8rem;">AI Model v2.1</span>
                    </div>
                    <div class="upload-area" id="upload-area">
                        <i class="fa-solid fa-cloud-arrow-up upload-icon"></i>
                        <h3 style="margin-bottom: 0.5rem">رفع صورة الأشعة</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 1.5rem">اسحب وأفلت أو انقر للتصفح</p>
                        <input type="file" id="file-input" hidden accept="image/*">
                        <button class="btn btn-primary" onclick="document.getElementById('file-input').click()">اختر ملف</button>
                    </div>
                    <div id="preview-area" style="display: none; height: 100%; position: relative;">
                        <img id="image-preview" src="" alt="X-Ray" style="max-height: 100%; max-width: 100%; display: block; margin: 0 auto; border-radius: 8px;">
                        <button class="btn" style="position: absolute; top: 1rem; left: 1rem; right: auto; background: rgba(0,0,0,0.6);" onclick="resetUpload()"><i class="fa-solid fa-times"></i></button>
                    </div>
                </div>

                <!-- Analysis Results -->
                <div class="card results-card">
                    <div class="card-header">
                        <span class="card-title">نتائج التشخيص</span>
                        <i class="fa-solid fa-microscope" style="color: var(--text-secondary)"></i>
                    </div>
                    
                    <div id="loading-state" style="display: none; text-align: center; padding: 2rem;">
                        <div class="loader"></div>
                        <p style="margin-top: 1rem; color: var(--text-secondary)">جاري تحليل الصورة...</p>
                    </div>

                    <div id="results-content">
                        <div class="stat-row">
                            <span class="stat-label">احتمالية الالتهاب الرئوي</span>
                            <span class="stat-value" id="pneumonia-prob">--%</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">درجة الثقة</span>
                            <span class="stat-value" style="color: var(--accent-color)">--</span>
                        </div>
                        <div class="stat-row">
                            <span class="stat-label">جودة المسح</span>
                            <span class="stat-value">--</span>
                        </div>
                        
                        <div style="margin-top: 2rem;">
                            <h4 style="margin-bottom: 1rem; color: var(--text-secondary)">توصية الذكاء الاصطناعي</h4>
                            <p id="recommendation-text" style="font-size: 0.9rem; line-height: 1.6;">
                                الرجاء رفع صورة أشعة للبدء في التحليل.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ECG Reports -->
                <div class="card ecg-card">
                    <div class="card-header">
                        <span class="card-title"><i class="fa-solid fa-heart-pulse" style="color: var(--danger-color)"></i> تقرير تخطيط القلب المباشر</span>
                        <button class="btn" style="padding: 4px 8px; font-size: 0.8rem; background: rgba(255,255,255,0.1)">عرض السجل</button>
                    </div>
                    <div class="graph-placeholder">
                        <div class="ecg-line"></div>
                        <span style="z-index: 1;">تصور مباشر للنظم القلبي</span>
                    </div>
                    <div style="display: flex; gap: 2rem; margin-top: 1rem;">
                        <div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary)">معدل ضربات القلب</div>
                            <div style="font-size: 1.2rem; font-weight: 700">72 <span style="font-size: 0.8rem; font-weight: 400">BPM</span></div>
                        </div>
                         <div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary)">التباين</div>
                            <div style="font-size: 1.2rem; font-weight: 700; color: var(--success-color)">طبيعي</div>
                        </div>
                    </div>
                </div>

                <!-- Breast Cancer Models -->
                <div class="card cancer-card">
                    <div class="card-header">
                        <span class="card-title"><i class="fa-solid fa-ribbon" style="color: #ff69b4"></i> نماذج سرطان الثدي</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
                        <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px;">
                            <div style="font-size: 0.9rem; margin-bottom: 0.5rem">سرطان قنوي غازي</div>
                            <div class="progress-bar" style="height: 6px; background: #333; border-radius: 3px; overflow: hidden;">
                                <div style="width: 15%; height: 100%; background: #ff69b4;"></div>
                            </div>
                            <div style="text-align: left; font-size: 0.8rem; margin-top: 4px;">15% خطر</div>
                        </div>
                         <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px;">
                            <div style="font-size: 0.9rem; margin-bottom: 0.5rem">سرطان فصيصي</div>
                            <div class="progress-bar" style="height: 6px; background: #333; border-radius: 3px; overflow: hidden;">
                                <div style="width: 5%; height: 100%; background: #ff69b4;"></div>
                            </div>
                            <div style="text-align: left; font-size: 0.8rem; margin-top: 4px;">5% خطر</div>
                        </div>
                    </div>
                     <button class="btn btn-primary" style="width: 100%; margin-top: 1rem; background: linear-gradient(90deg, #ff69b4, #ff3366);">تشغيل فحص متقدم</button>
                </div>

            </div>
        </main>
    </div>

    <script src="app.js"></script>
</body>
</html>
