/* ============================================
   MINBAR – DA'WAH TRAINING PLATFORM
   Main JavaScript File
   ============================================ */

/* ============================================
   GOOGLE GEMINI API INTEGRATION
   ============================================ */
const GEMINI_API_KEY = "AIzaSyCqfrxBXx9UxE3efeB0owEtpu8neudHD7w";

async function callGemini(promptOrHistory, systemContext = "") {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  // Handle string format or array history format
  const contents = Array.isArray(promptOrHistory) 
    ? promptOrHistory 
    : [{ role: "user", parts: [{ text: promptOrHistory }] }];

  const body = {
    system_instruction: {
      parts: [{ text: systemContext }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 1500
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text;
}

// ============================================
// PAGE NAVIGATION
// ============================================

/**
 * Show a specific page by ID, hide all others
 */
function showPage(pageId) {
  // Auth check for dashboard
  if (pageId === "dashboard-page") {
    const isAuth = localStorage.getItem('minbar_auth');
    if (!isAuth) {
      window.location.href = 'login.html';
      return;
    }
  }

  const pages = document.querySelectorAll(".page");
  pages.forEach((page) => page.classList.remove("active"));

  const target = document.getElementById(pageId);
  if (target) {
    target.classList.add("active");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Trigger animations when dashboard is shown
  if (pageId === "dashboard-page") {
    setTimeout(() => {
      animateKPIBars();
      initScenarios();
      updateDashboardNumbers(); // Task 8: Dynamic numbers
    }, 300);
  }

  // Trigger landing animations
  if (pageId === "landing-page") {
    animateCounters();
    animateProgressBars();
  }
}

// ============================================
// SIDEBAR TOGGLE
// ============================================

let sidebarOpen = false;

/**
 * Toggle sidebar open/closed on mobile
 */
function toggleSidebar() {
  const sidebar = document.getElementById("sidebar");
  const overlay = document.getElementById("sidebar-overlay");
  sidebarOpen = !sidebarOpen;

  if (sidebarOpen) {
    sidebar.classList.add("open");
    overlay.classList.add("active");
    document.body.style.overflow = "hidden";
  } else {
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
  }
}

/**
 * Close sidebar on window resize if screen is large
 */
window.addEventListener("resize", () => {
  if (window.innerWidth > 900 && sidebarOpen) {
    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    sidebar.classList.remove("open");
    overlay.classList.remove("active");
    document.body.style.overflow = "";
    sidebarOpen = false;
  }
});

// ============================================
// DASHBOARD SECTION NAVIGATION
// ============================================

const pageTitles = {
  overview: "لوحة التحكم",
  training: "التدريب الصوتي",
  simulation: "مواقف وأسئلة مجتمعية",
  progress: "تقدمي",
  achievements: "الإنجازات",
  library: "المكتبة الإسلامية",
  consultation: "طلب استشارة",
  about: "عن المشروع"
};

/**
 * Show a dashboard sub-section
 */
function showDashboardSection(section, navElement) {
  // Hide all sections
  const sections = document.querySelectorAll(".dashboard-section");
  sections.forEach((s) => s.classList.remove("active"));

  // Remove active from all nav items
  const navItems = document.querySelectorAll(".nav-item");
  navItems.forEach((item) => item.classList.remove("active"));

  // Show target section
  const targetSection = document.getElementById(`${section}-section`);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Set active nav item
  if (navElement) {
    navElement.classList.add("active");
  }

  // Update page title
  const titleEl = document.getElementById("page-title");
  if (titleEl && pageTitles[section]) {
    titleEl.textContent = pageTitles[section];
  }

  // Handle section specific logic
  if (section === 'about') {
    animateProgressBars();
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 900 && sidebarOpen) {
    toggleSidebar();
  }

  // Trigger section-specific animations
  if (section === "progress") {
    setTimeout(animateKPIBars, 200);
  }
}

// ============================================
// MOBILE MENU TOGGLE
// ============================================

/**
 * Toggle mobile navigation menu
 */
function toggleMobileMenu() {
  const menu = document.getElementById("mobile-menu");
  menu.classList.toggle("open");
}

// ============================================
// COUNTER ANIMATIONS (Landing Page)
// ============================================

let countersAnimated = false;

/**
 * Animate number counters in the hero section
 */
function animateCounters() {
  if (countersAnimated) return;
  countersAnimated = true;

  const counters = document.querySelectorAll(".stat-number[data-target]");

  counters.forEach((counter) => {
    const target = parseInt(counter.getAttribute("data-target"));
    const duration = 2000;
    const step = target / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      counter.textContent = Math.floor(current).toLocaleString("ar");
    }, 16);
  });
}

// ============================================
// PROGRESS BAR ANIMATIONS (Landing Page)
// ============================================

/**
 * Animate progress bars in the about section
 */
function animateProgressBars() {
  const bars = document.querySelectorAll(".progress-bar-fill");
  bars.forEach((bar) => {
    const target = bar.style.getPropertyValue("--target") || "0%";
    setTimeout(() => {
      bar.style.width = target;
    }, 300);
  });
}

/**
 * Animate KPI bars in dashboard progress section
 */
function animateKPIBars() {
  const bars = document.querySelectorAll(".kpi-bar");
  bars.forEach((bar, i) => {
    const width = bar.style.getPropertyValue("--kpi-width") || "0%";
    setTimeout(() => {
      bar.style.width = width;
    }, i * 100);
  });
}

// ============================================
// RECORDING / TRAINING SECTION
// ============================================

let isRecording = false;
let recordingTimer = null;
let seconds = 0;
let waveformInterval = null;

/**
 * Toggle recording state
 */
function toggleRecording() {
  if (!isRecording) {
    startRecording();
  } else {
    pauseRecording();
  }
}

/**
 * Start the recording simulation
 */
function startRecording() {
  isRecording = true;

  const circle = document.getElementById("recording-circle");
  const pulse = document.getElementById("recording-pulse");
  const icon = document.getElementById("recording-icon");
  const label = document.getElementById("recording-label");
  const toggleBtn = document.getElementById("rec-toggle-btn");
  const stopBtn = document.getElementById("rec-stop-btn");

  // Update UI state
  circle.classList.add("recording");
  pulse.classList.add("active");
  icon.className = "fas fa-pause";
  label.textContent = "جاري التسجيل...";
  toggleBtn.innerHTML = '<i class="fas fa-pause"></i><span>إيقاف مؤقت</span>';
  stopBtn.disabled = false;

  // Start timer
  recordingTimer = setInterval(() => {
    seconds++;
    const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
    const secs = String(seconds % 60).padStart(2, "0");
    document.getElementById("recording-timer").textContent = `${mins}:${secs}`;
  }, 1000);

  // Start waveform animation
  startWaveformAnimation();
}

/**
 * Pause the recording
 */
function pauseRecording() {
  isRecording = false;

  const circle = document.getElementById("recording-circle");
  const pulse = document.getElementById("recording-pulse");
  const icon = document.getElementById("recording-icon");
  const label = document.getElementById("recording-label");
  const toggleBtn = document.getElementById("rec-toggle-btn");

  circle.classList.remove("recording");
  pulse.classList.remove("active");
  icon.className = "fas fa-play";
  label.textContent = "متابعة";
  toggleBtn.innerHTML = '<i class="fas fa-play"></i><span>متابعة</span>';

  clearInterval(recordingTimer);
  stopWaveformAnimation();
}

/**
 * Stop recording and show analysis
 */
function stopAndAnalyze() {
  if (seconds < 1) {
    showToast("يرجى التسجيل لمدة ثانية على الأقل");
    return;
  }

  // Stop recording
  isRecording = false;
  clearInterval(recordingTimer);
  stopWaveformAnimation();

  const circle = document.getElementById("recording-circle");
  const pulse = document.getElementById("recording-pulse");
  const icon = document.getElementById("recording-icon");
  const label = document.getElementById("recording-label");
  const toggleBtn = document.getElementById("rec-toggle-btn");
  const stopBtn = document.getElementById("rec-stop-btn");

  circle.classList.remove("recording");
  pulse.classList.remove("active");
  icon.className = "fas fa-microphone";
  label.textContent = "تم التسجيل";
  toggleBtn.innerHTML = '<i class="fas fa-play"></i><span>تسجيل</span>';
  stopBtn.disabled = true;

  // Get transcript from textarea
  const transcript = document.getElementById("stt-textarea").value.trim();

  // Show analyzing state
  showAnalysis(transcript);
}

/**
 * Handle newsletter subscription
 */
function subscribeNewsletter(event) {
  if (event) event.preventDefault();
  const input = document.querySelector('.newsletter-input input');
  const email = input.value;
  
  if (!email || !email.includes('@')) {
    showToast("يرجى إدخال بريد إلكتروني صحيح", "error");
    return;
  }
  
  const btn = document.querySelector('.newsletter-input button');
  const originalIcon = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
  btn.disabled = true;
  
  setTimeout(() => {
    showToast("تم الاشتراك في النشرة بنجاح! 🎉", "success");
    input.value = '';
    btn.innerHTML = originalIcon;
    btn.disabled = false;
  }, 1500);
}

/**
 * Handle consultation form submission
 */
function submitConsultation(event) {
  event.preventDefault();
  
  const form = document.getElementById("consultation-form");
  const btn = form.querySelector('button[type="submit"]');
  const originalText = btn.innerHTML;
  
  // Extract values
  const name = document.getElementById('cons-name').value;
  const age = document.getElementById('cons-age').value;
  const phone = document.getElementById('cons-phone').value;
  const mosque = document.getElementById('cons-mosque').value;
  const topic = document.getElementById('cons-topic').value;
  
  // Basic validation
  if (name.length < 3 || topic.length < 10) {
    showToast("يرجى إكمال البيانات بشكل صحيح", "error");
    return;
  }
  
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحويل...';
  btn.disabled = true;
  
  // Format Message for WhatsApp
  const whatsappNumber = "+201125195847";
  const message = `*طلب استشارة جديدة - منصة خطبة*%0A%0A` +
                  `*الاسم:* ${name}%0A` +
                  `*السن:* ${age}%0A` +
                  `*الهاتف:* ${phone}%0A` +
                  `*المسجد:* ${mosque}%0A%0A` +
                  `*الاستشارة:*%0A${topic}`;
  
  const waUrl = `https://wa.me/${whatsappNumber}?text=${message}`;
  
  setTimeout(() => {
    showToast("تم تجهيز الاستشارة! سيتم تحويلك الآن إلى واتساب.", "success");
    
    setTimeout(() => {
      window.open(waUrl, '_blank');
      form.reset();
      btn.innerHTML = originalText;
      btn.disabled = false;
    }, 1500);
  }, 1000);
}

/**
 * Show a toast notification
 */
function showToast(message, type = "info") {
  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-content">
      <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'}"></i>
      <span>${message}</span>
    </div>
  `;
  document.body.appendChild(toast);
  
  setTimeout(() => toast.classList.add("show"), 100);
  setTimeout(() => {
    toast.classList.remove("show");
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Start waveform animation
 */
function startWaveformAnimation() {
  const waveform = document.getElementById("waveform");
  waveform.classList.add("animating");

  const bars = waveform.querySelectorAll("span");

  waveformInterval = setInterval(() => {
    bars.forEach((bar) => {
      const height = Math.floor(Math.random() * 56) + 8;
      bar.style.height = `${height}px`;
    });
  }, 150);
}

/**
 * Stop waveform animation
 */
function stopWaveformAnimation() {
  const waveform = document.getElementById("waveform");
  waveform.classList.remove("animating");

  const bars = waveform.querySelectorAll("span");
  bars.forEach((bar) => {
    bar.style.height = "8px";
  });

  clearInterval(waveformInterval);
}

/**
 * Show real AI analysis results
 */
async function showAnalysis(transcript) {
  const badge = document.getElementById("analyzing-badge");
  badge.style.display = "flex";
  
  // If no transcript, use mock data or show warning
  if (!transcript) {
    showToast("لا يوجد نص للتحليل. قم بلصق نص الخطبة في المربع المخصص.", "error");
    badge.style.display = "none";
    return;
  }

  try {
    const systemPrompt = `حلل هذا النص الخطابي أو الكلام من حيث:
1. السرعة (قيّم من 1 إلى 100)
2. الوضوح (قيّم من 1 إلى 100)
3. الثقة (قيّم من 1 إلى 100)
وأعط تقييماً عاماً (overall) من 1 إلى 100 مع ملخص قصير (summary) ونقاط القوة (strengths) ومقترحات للتحسين (improvements).
مهم جداً: أعد النتيجة بصيغة JSON فقط بهذه الهيكلية بالضبط دون أي نصوص إضافية:
{
  "speed": 85,
  "clarity": 90,
  "confidence": 75,
  "overall": 80,
  "summary": "نص قصير...",
  "strengths": ["نقطة 1", "نقطة 2"],
  "improvements": ["مقترح 1", "مقترح 2"]
}`;

    const replyText = await callGemini(transcript, systemPrompt);
    const cleanJson = replyText.replace(/```json/i, '').replace(/```/g, '').trim();
    const data = JSON.parse(cleanJson);
    
    badge.style.display = "none";

    if (data.error) {
      showToast("فشل تحليل النص. حاول مرة أخرى.", "error");
      return;
    }

    // Update Metrics
    animateMetric("speed", data.speed, "سرعة إلقائك بناءً على النص المُقدم.", getSpeedLabel(data.speed));
    setTimeout(() => {
      animateMetric("clarity", data.clarity, "مدى وضوح الأفكار وترابطها في خطابك.", getClarityLabel(data.clarity));
    }, 200);
    setTimeout(() => {
      animateMetric("confidence", data.confidence, "مستوى الثقة في اختيار الكلمات والأسلوب الخطابي.", getConfidenceLabel(data.confidence));
    }, 400);

    // Show overall score and AI summary
    setTimeout(() => {
      showOverallScore(data.overall, data.summary);
      saveProgressUpdate(data.overall);
    }, 800);

    // Render Strengths & Improvements
    renderFeedbackLists(data.strengths, data.improvements);

  } catch (error) {
    console.error("Analysis Error:", error);
    badge.style.display = "none";
    showToast("حدث خطأ أثناء الاتصال بالذكاء الاصطناعي.", "error");
  }
}

function renderFeedbackLists(strengths, improvements) {
  // Assuming these exist in HTML or we add them
  const feedbackPanel = document.getElementById("feedback-panel");
  
  // Remove existing lists if any
  const oldLists = feedbackPanel.querySelectorAll(".ai-feedback-lists");
  oldLists.forEach(l => l.remove());
  
  const listsDiv = document.createElement("div");
  listsDiv.className = "ai-feedback-lists";
  listsDiv.style.marginTop = "20px";
  listsDiv.innerHTML = `
    <div style="margin-bottom: 15px;">
      <h4 style="color: #66BB6A; margin-bottom: 8px;"><i class="fas fa-check-circle"></i> نقاط القوة</h4>
      <ul style="padding-right: 20px; font-size: 0.9rem;">
        ${strengths.map(s => `<li>${s}</li>`).join('')}
      </ul>
    </div>
    <div>
      <h4 style="color: #FF8C69; margin-bottom: 8px;"><i class="fas fa-lightbulb"></i> مقترحات للتحسين</h4>
      <ul style="padding-right: 20px; font-size: 0.9rem;">
        ${improvements.map(i => `<li>${i}</li>`).join('')}
      </ul>
    </div>
  `;
  feedbackPanel.appendChild(listsDiv);
}

// Helper labels
function getSpeedLabel(v) { return v > 80 ? "ممتاز" : v > 60 ? "جيد" : "يحتاج هدوء"; }
function getClarityLabel(v) { return v > 80 ? "بليغة" : v > 60 ? "واضحة" : "تحتاج تبسيط"; }
function getConfidenceLabel(v) { return v > 80 ? "خطيب مفوه" : v > 60 ? "واثق" : "تحتاج تدريب"; }

/**
 * AI Improve Transcription
 */
async function improveTranscription() {
  const textarea = document.getElementById("stt-textarea");
  const text = textarea.value.trim();
  const btn = document.querySelector(".ai-improve-action button");

  if (!text || text.length < 10) {
    showToast("يرجى إدخال نص كافٍ للتحسين (أكثر من 10 أحرف)", "error");
    return;
  }

  const originalHTML = btn.innerHTML;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحسين...';
  btn.disabled = true;

  try {
    const systemPrompt = "أنت خبير في فن الخطابة الإسلامية. حسّن هذه الخطبة من حيث: الأسلوب، الترتيب، قوة المقدمة والخاتمة. احتفظ بالمعنى الأصلي ولا تضف معلومات من عندك. أعد الخطبة كاملة بعد التحسين دون إضافات أو شروحات جانبية.";
    
    // Call frontend Gemini API
    const replyText = await callGemini(text, systemPrompt);
    
    if (replyText) {
      textarea.value = replyText;
      showToast("تم تحسين النص بنجاح! ✨", "success");
    } else {
      showToast("لم نتمكن من تحسين النص.", "error");
    }
  } catch (err) {
    showToast("تعذر الاتصال بالذكاء الاصطناعي.", "error");
    console.error("AI Improvement Error:", err);
  } finally {
    btn.innerHTML = originalHTML;
    btn.disabled = false;
  }
}

/**
 * Task 8: Dynamic Dashboard Numbers
 */
function updateDashboardNumbers() {
    const sessionsEl = document.getElementById('sessions-count');
    const progressEl = document.querySelector('.stat-card:nth-child(3) .stat-card-value');
    
    // Get from storage or use defaults
    const sessions = localStorage.getItem('minbar_sessions') || "24";
    const avgProgress = localStorage.getItem('minbar_avg_progress') || "72";
    
    if(sessionsEl) sessionsEl.textContent = sessions;
    if(progressEl) progressEl.textContent = avgProgress + "%";
}

function saveProgressUpdate(score) {
    let sessions = parseInt(localStorage.getItem('minbar_sessions') || "24");
    sessions++;
    localStorage.setItem('minbar_sessions', sessions);
    
    // Simple moving average for progress
    let avg = parseInt(localStorage.getItem('minbar_avg_progress') || "72");
    avg = Math.round((avg + score) / 2);
    localStorage.setItem('minbar_avg_progress', avg);
    
    updateDashboardNumbers();
}

function handleLogout() {
    localStorage.removeItem('minbar_auth');
    window.location.href = 'index.html';
}

/**
 * Animate a single metric bar and value
 */
function animateMetric(name, value, description, label) {
  const bar = document.getElementById(`${name}-bar`);
  const valueEl = document.getElementById(`${name}-value`);
  const descEl = document.getElementById(`${name}-desc`);

  bar.style.width = `${value}%`;
  valueEl.textContent = `${value}% – ${label}`;
  descEl.textContent = description;
}

/**
 * Show the overall score card
 */
function showOverallScore(score, summary) {
  const scoreCard = document.getElementById("overall-score");
  const scoreNumber = document.getElementById("score-number");
  const scoreTitle = document.getElementById("score-title");
  const scoreTip = document.getElementById("score-tip");

  scoreCard.style.display = "flex";

  // Animate number
  let current = 0;
  const step = Math.max(1, score / 40);
  const timer = setInterval(() => {
    current += step;
    if (current >= score) {
      current = score;
      clearInterval(timer);
    }
    scoreNumber.textContent = Math.floor(current);
  }, 30);

  // Set title and tip based on score
  if (score >= 80) {
    scoreTitle.textContent = "ممتاز! 🌟";
    scoreTip.textContent = "أداؤك رائع، استمر في هذا المستوى المتميز!";
  } else if (score >= 65) {
    scoreTitle.textContent = "جيد جداً 👍";
    scoreTip.textContent = "أنت في طريق صحيح، تدرّب أكثر لتحسين ثقتك بنفسك.";
  } else {
    scoreTitle.textContent = "يحتاج تحسين 💪";
    scoreTip.textContent = "لا تستسلم! الممارسة المستمرة هي مفتاح النجاح.";
  }
}

/**
 * Update the sessions count in the dashboard
 */
function updateSessionCount() {
  const el = document.getElementById("sessions-count");
  if (el) {
    const current = parseInt(el.textContent);
    el.textContent = current + 1;
    el.style.color = "#5FA8D3";
    setTimeout(() => {
      el.style.color = "";
    }, 1000);
    // Persist real progress
    if (typeof saveProgressUpdate === 'function') {
      saveProgressUpdate(1, null);
    }
  }
}

/**
 * Reset recording to initial state
 */
function resetRecording() {
  isRecording = false;
  seconds = 0;

  clearInterval(recordingTimer);
  clearInterval(waveformInterval);
  stopWaveformAnimation();

  document.getElementById("recording-timer").textContent = "00:00";
  document.getElementById("recording-circle").classList.remove("recording");
  document.getElementById("recording-pulse").classList.remove("active");
  document.getElementById("recording-icon").className = "fas fa-microphone";
  document.getElementById("recording-label").textContent = "ابدأ التسجيل";
  document.getElementById("rec-toggle-btn").innerHTML =
    '<i class="fas fa-play"></i><span>تسجيل</span>';
  document.getElementById("rec-stop-btn").disabled = true;
  document.getElementById("analyzing-badge").style.display = "none";
  document.getElementById("overall-score").style.display = "none";

  // Reset bars
  ["speed", "clarity", "confidence"].forEach((name) => {
    document.getElementById(`${name}-bar`).style.width = "0%";
    document.getElementById(`${name}-value`).textContent = "--";
    document.getElementById(`${name}-desc`).textContent =
      "سجّل صوتك لرؤية التحليل";
  });
}

// Helper functions for metric descriptions
function getSpeedLabel(v) {
  if (v >= 80) return "سريع";
  if (v >= 60) return "مناسب";
  return "بطيء";
}

function getSpeedDesc(v) {
  if (v >= 80) return "وتيرتك سريعة قليلاً، حاول التباطؤ لتوضيح أفكارك أكثر.";
  if (v >= 60) return "وتيرتك مناسبة جداً، استمر!";
  return "وتيرتك بطيئة بعض الشيء، جرب أن تكون أكثر تدفقاً.";
}

function getClarityLabel(v) {
  if (v >= 80) return "واضح جداً";
  if (v >= 60) return "واضح";
  return "يحتاج تحسين";
}

function getClarityDesc(v) {
  if (v >= 80) return "وضوح صوتك ممتاز، المستمعون يفهمون كلامك بسهولة.";
  if (v >= 60) return "وضوحك جيد، تدرّب على مخارج الحروف أكثر.";
  return "حاول التحدث بشكل أوضح وتمرّن على مخارج الحروف.";
}

function getConfidenceLabel(v) {
  if (v >= 80) return "واثق جداً";
  if (v >= 60) return "واثق";
  return "يحتاج تعزيز";
}

function getConfidenceDesc(v) {
  if (v >= 80) return "ثقتك بنفسك عالية جداً، هذا رائع للداعية!";
  if (v >= 60) return "ثقتك جيدة، استمر في التدريب لتعزيزها أكثر.";
  return "تدرّب أمام المرآة يومياً لتعزيز ثقتك بنفسك.";
}

// ============================================
// SIMULATION / SCENARIOS
// ============================================

const scenarios = [
  {
    "category": "رد الشبهات",
    "difficulty": "medium",
    "text": "يسألك مسند: 'إذا كان الله رؤوفاً، فلماذا خلق الشر والأمراض؟'",
    "choices": [
      {
        "text": "الشر ليس غاية بل ابتلاء، والدنيا دار اختبار لتظهر حكمة الله.",
        "correct": true
      },
      {
        "text": "هذا للردع والانتقام فقط.",
        "correct": false
      },
      {
        "text": "الشر غاية بحد ذاته.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "توضيح دقيق لحكمة الابتلاء.",
      "wrong": "إجابة سطحية للأسف."
    }
  },
  {
    "category": "استشارات",
    "difficulty": "easy",
    "text": "شاب يفضل العزلة وترك الصلاة بالمسجد تجنباً لفتن المجتمع، كيف تنصحه؟",
    "choices": [
      {
        "text": "المؤمن الذي يخالط الناس ويصبر على أذاهم خير من الذي لا يخالطهم.",
        "correct": true
      },
      {
        "text": "شجعه على العزلة لحفظ دينه.",
        "correct": false
      },
      {
        "text": "لا بأس طالما يصلي بالبيت.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "إشارة جيدة للهدى النبوي.",
      "wrong": "العزلة المفرطة ليست من هدي النبي."
    }
  },
  {
    "category": "فقه المعاملات",
    "difficulty": "hard",
    "text": "تاجر يسأل عن حكم العملات المشفرة مع التذبذب العالي.",
    "choices": [
      {
        "text": "يجب تحذيره من الغرر وربطه بقرارات المجامع الفقهية.",
        "correct": true
      },
      {
        "text": "مباحة لأنها تجارة رابحة.",
        "correct": false
      },
      {
        "text": "محرمة مطلقاً.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "التريث وربط الفتوى بأهل الاختصاص هو الأصوب.",
      "wrong": "لا يجب التعميم بلا علم مرجعي."
    }
  },
  {
    "category": "منبر الجمعة",
    "difficulty": "hard",
    "text": "أثناء خطبة الجمعة، لاحظت أن بعض المصلين يشعرون بالنعاس.",
    "choices": [
      {
        "text": "أقوم بتغيير نبرة صوتي واستخدام قصة قصيرة.",
        "correct": true
      },
      {
        "text": "أتوقف عن الخطبة وأوبخهم.",
        "correct": false
      },
      {
        "text": "أستمر بنفس الرتابة.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "أحسنت التنويع الصوتي.",
      "wrong": "التوبيخ ينفّر."
    }
  },
  {
    "category": "الاستشارات العائلية",
    "difficulty": "medium",
    "text": "شاب يشتكي من قسوة والده المستمرة ويفكر في مقاطعته.",
    "choices": [
      {
        "text": "أنصحه بالصبر والمصانعة بالمعروف.",
        "correct": true
      },
      {
        "text": "أشجعه على المقاطعة ليرتاح نفسياً.",
        "correct": false
      },
      {
        "text": "أقول له اصبر بدون توجيه عملي.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "توجيه حكيم.",
      "wrong": "المقاطعة قطيعة رحم."
    }
  },
  {
    "category": "حوار الشباب",
    "difficulty": "hard",
    "text": "شاب يقول لك: أشعر أن الدين يقيّد حريتي.",
    "choices": [
      {
        "text": "أحاوره بأن الحرية المطلقة وهم وأن الدين يحررنا من الشهوات.",
        "correct": true
      },
      {
        "text": "أخبره أنه إن لم يلتزم سيُعذب.",
        "correct": false
      },
      {
        "text": "أتفق معه.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "ربطت الحرية بالتحرر الداخلي.",
      "wrong": "الترهيب المباشر ينفّر."
    }
  },
  {
    "category": "التوجيه الروحي",
    "difficulty": "easy",
    "text": "شخص يشكو من قسوة قلبه.",
    "choices": [
      {
        "text": "أنصحه بالاستغفار ومجالسة الصالحين.",
        "correct": true
      },
      {
        "text": "أقول له هذا طبيعي.",
        "correct": false
      },
      {
        "text": "لا علاج لك.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "وصفة نبوية مجربة.",
      "wrong": "التيئيس خطأ."
    }
  },
  {
    "category": "المواقف المحرجة",
    "difficulty": "hard",
    "text": "سألك أحدهم سؤالاً فقهياً ولا تعرف الإجابة.",
    "choices": [
      {
        "text": "أقول ببساطة (لا أدري) وأبحث لاحقاً.",
        "correct": true
      },
      {
        "text": "أستنتج الإجابة من عقلي.",
        "correct": false
      },
      {
        "text": "أتهرب من السؤال.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "النصف من العلم لا أدري.",
      "wrong": "الإفتاء بغير علم ذنب."
    }
  },
  {
    "category": "التاريخ الإسلامي",
    "difficulty": "easy",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 9) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "أصول الدعوة",
    "difficulty": "medium",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 10) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "حوار الأديان",
    "difficulty": "hard",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 11) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "السيرة النبوية",
    "difficulty": "easy",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 12) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "فقه العبادات",
    "difficulty": "medium",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 13) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "تزكية النفوس",
    "difficulty": "hard",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 14) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "التاريخ الإسلامي",
    "difficulty": "easy",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 15) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "أصول الدعوة",
    "difficulty": "medium",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 16) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "حوار الأديان",
    "difficulty": "hard",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 17) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "السيرة النبوية",
    "difficulty": "easy",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 18) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "فقه العبادات",
    "difficulty": "medium",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 19) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "تزكية النفوس",
    "difficulty": "hard",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 20) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "التاريخ الإسلامي",
    "difficulty": "easy",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 21) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "أصول الدعوة",
    "difficulty": "medium",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 22) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "حوار الأديان",
    "difficulty": "hard",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 23) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  },
  {
    "category": "السيرة النبوية",
    "difficulty": "easy",
    "text": "يسألك أحدهم سؤالاً من واقع الحياة الشائكة والميدان (الموقف رقم 24) يتطلب حكمة وبصيرة في الرد.",
    "choices": [
      {
        "text": "أجيب بحكمة ورويّة، مع تأصيل شرعي واضح.",
        "correct": true
      },
      {
        "text": "أتسرع في الإجابة بالمنع.",
        "correct": false
      },
      {
        "text": "أتجنب الإجابة وأخرج من المجلس.",
        "correct": false
      }
    ],
    "feedback": {
      "correct": "تصرّف ناضج وموفق! هكذا يجب التعامل مع السائل.",
      "wrong": "التسرع أو الهروب يضعف ثقة الناس."
    }
  }
];

let currentScenario = 0;
let correctCount = 0;
let wrongCount = 0;
let simScore = 0;
let scenarioResults = [];

/**
 * Initialize the scenarios section
 */
function initScenarios() {
  currentScenario = 0;
  correctCount = 0;
  wrongCount = 0;
  simScore = 0;
  scenarioResults = new Array(scenarios.length).fill(null);

  updateScoreboard();
  renderScenarioDots();
  loadScenario(0);
}

/**
 * Load a specific scenario
 */
function loadScenario(index) {
  if (index >= scenarios.length) {
    showSimulationComplete();
    return;
  }

  const s = scenarios[index];

  // Update scenario info
  document.getElementById("scenario-category").textContent = s.category;
  document.getElementById("scenario-counter").textContent = `سيناريو ${index + 1} من ${scenarios.length}`;

  const diffEl = document.querySelector(".scenario-difficulty");
  diffEl.className = `scenario-difficulty ${s.difficulty}`;
  diffEl.textContent = s.difficulty === "easy" ? "سهل" : s.difficulty === "medium" ? "متوسط" : "صعب";

  // Update scenario text with animation
  const textEl = document.getElementById("scenario-text");
  textEl.style.opacity = "0";
  setTimeout(() => {
    textEl.textContent = s.text;
    textEl.style.opacity = "1";
    textEl.style.transition = "opacity 0.4s ease";
  }, 200);

  // Hide result area
  const resultArea = document.getElementById("result-area");
  resultArea.style.display = "none";

  // Render choices
  const container = document.getElementById("choices-container");
  container.style.opacity = "0";
  container.innerHTML = "";

  setTimeout(() => {
    s.choices.forEach((choice, i) => {
      const letters = ["أ", "ب", "ج", "د"];
      const btn = document.createElement("button");
      btn.className = "choice-btn";
      btn.innerHTML = `
        <span class="choice-letter">${letters[i]}</span>
        ${choice.text}
      `;
      btn.onclick = () => selectChoice(i, choice.correct, s.feedback);
      container.appendChild(btn);
    });

    container.style.opacity = "1";
    container.style.transition = "opacity 0.4s ease";
  }, 300);

  // Update dots
  renderScenarioDots();
}

/**
 * Handle choice selection
 */
function selectChoice(choiceIndex, isCorrect, feedback) {
  const container = document.getElementById("choices-container");
  const buttons = container.querySelectorAll(".choice-btn");
  const scenario = scenarios[currentScenario];

  // Disable all buttons
  buttons.forEach((btn) => (btn.disabled = true));

  // Mark correct and wrong
  buttons.forEach((btn, i) => {
    if (scenario.choices[i].correct) {
      btn.classList.add("correct");
    } else if (i === choiceIndex && !isCorrect) {
      btn.classList.add("wrong");
    }
  });

  // Update scores
  if (isCorrect) {
    correctCount++;
    simScore += 25;
    scenarioResults[currentScenario] = "correct";
  } else {
    wrongCount++;
    scenarioResults[currentScenario] = "wrong";
  }

  updateScoreboard();
  renderScenarioDots();

  // Show result after delay
  setTimeout(() => {
    showResult(isCorrect, feedback);
  }, 800);
}

/**
 * Show result card
 */
function showResult(isCorrect, feedback) {
  const resultArea = document.getElementById("result-area");
  const resultCard = document.getElementById("result-card");
  const resultIcon = document.getElementById("result-icon");
  const resultTitle = document.getElementById("result-title");
  const resultMessage = document.getElementById("result-message");

  resultCard.className = `result-card ${isCorrect ? "correct" : "wrong"}`;
  resultIcon.textContent = isCorrect ? "✅" : "❌";
  resultTitle.textContent = isCorrect ? "إجابة صحيحة! 🎉" : "إجابة خاطئة";
  resultMessage.textContent = isCorrect ? feedback.correct : feedback.wrong;

  resultArea.style.display = "block";

  // Scroll to result
  resultArea.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

/**
 * Move to the next scenario
 */
function nextScenario() {
  currentScenario++;
  loadScenario(currentScenario);
}

/**
 * Update scoreboard numbers
 */
function updateScoreboard() {
  document.getElementById("correct-count").textContent = correctCount;
  document.getElementById("wrong-count").textContent = wrongCount;
  document.getElementById("sim-score").textContent = simScore;
}

/**
 * Render scenario progress dots
 */
function renderScenarioDots() {
  const container = document.getElementById("scenario-dots");
  if (!container) return;

  container.innerHTML = "";

  scenarios.forEach((_, i) => {
    const dot = document.createElement("div");
    dot.className = "scenario-dot";

    if (i === currentScenario) {
      dot.classList.add("active");
    } else if (scenarioResults[i] === "correct") {
      dot.classList.add("done-correct");
    } else if (scenarioResults[i] === "wrong") {
      dot.classList.add("done-wrong");
    }

    dot.textContent = i + 1;
    dot.onclick = () => {
      if (scenarioResults[i] !== null || i <= currentScenario) {
        // Allow navigation to already-answered scenarios
        currentScenario = i;
        loadScenario(i);
      }
    };

    container.appendChild(dot);
  });
}

/**
 * Show simulation complete screen
 */
function showSimulationComplete() {
  const panel = document.querySelector(".scenario-panel");

  const percentage = Math.round((correctCount / scenarios.length) * 100);
  let grade, emoji;

  if (percentage >= 75) {
    grade = "ممتاز! أنت داعية محترف 🌟";
    emoji = "🏆";
  } else if (percentage >= 50) {
    grade = "جيد! استمر في التدريب 👍";
    emoji = "📚";
  } else {
    grade = "تحتاج مزيداً من التدريب 💪";
    emoji = "🎯";
  }

  panel.innerHTML = `
    <div class="result-card correct" style="padding:40px;text-align:center;flex-direction:column;align-items:center;gap:16px;display:flex;background:linear-gradient(135deg,rgba(95,168,211,0.08),rgba(62,124,166,0.12));border:2px solid rgba(95,168,211,0.2);">
      <div style="font-size:4rem">${emoji}</div>
      <h3 style="font-size:1.4rem;font-weight:800;color:var(--dark)">أكملت جميع السيناريوهات!</h3>
      <p style="font-size:1.1rem;color:var(--primary);font-weight:600">${grade}</p>
      <div style="display:flex;gap:24px;margin:12px 0;">
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800;color:#66BB6A">${correctCount}</div>
          <div style="font-size:0.82rem;color:var(--text-light)">إجابة صحيحة</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800;color:#EF5350">${wrongCount}</div>
          <div style="font-size:0.82rem;color:var(--text-light)">إجابة خاطئة</div>
        </div>
        <div style="text-align:center">
          <div style="font-size:2rem;font-weight:800;color:var(--primary)">${simScore}</div>
          <div style="font-size:0.82rem;color:var(--text-light)">نقطة</div>
        </div>
      </div>
      <button class="btn-primary" onclick="initScenarios()" style="margin-top:8px">
        <i class="fas fa-redo"></i>
        إعادة المحاولة
      </button>
    </div>
  `;
}

// ============================================
// CHATBOT
// ============================================

let chatbotIsOpen = false;

/**
 * Open the chatbot window
 */
function openChatbot() {
  chatbotIsOpen = true;
  document.getElementById("chatbot-window").classList.add("open");

  // Hide notification badge
  const badge = document.querySelector(".chatbot-badge");
  if (badge) badge.style.display = "none";
}

/**
 * Close the chatbot window
 */
function closeChatbot() {
  chatbotIsOpen = false;
  document.getElementById("chatbot-window").classList.remove("open");
}

/**
 * Handle keyboard input in chatbot
 */
function handleChatInput(event) {
  if (event.key === "Enter") {
    sendChatMessage();
  }
}

/**
 * Send a message from quick reply buttons
 */
function sendQuickReply(text) {
  const input = document.getElementById("chatbot-input");
  input.value = text;
  sendChatMessage();

  // Remove quick replies after first use
  const quickReplies = document.querySelector(".quick-replies");
  if (quickReplies) quickReplies.remove();
}

/**
 * Send a chat message
 */
/**
 * Send a chat message
 */
let chatHistoryList = [];

async function sendChatMessage() {
  const input = document.getElementById("chatbot-input");
  const text = input.value.trim();

  if (!text) return;

  // Add user message
  addMessage(text, "user");
  input.value = "";
  
  showTyping();
  scrollChatToBottom();
  
  // Prepare chat history
  chatHistoryList.push({ role: "user", parts: [{ text: text }] });

  try {
    const systemPrompt = "أنت مساعد ذكي متخصص في منصة خطبة لتدريب الدعاة. تجيب على أسئلة الخطابة والدعوة الإسلامية فقط. ردودك باللغة العربية الفصحى. إذا سُئلت عن موضوع خارج الدعوة، اعتذر بلطف وأعد المستخدم للموضوع.";
    
    // Call Gemini Frontend Function
    const replyText = await callGemini(chatHistoryList, systemPrompt);
    
    hideTyping();
    
    if (replyText) {
      addMessage(replyText, "bot");
      // Update history with model response
      chatHistoryList.push({ role: "model", parts: [{ text: replyText }] });
      if (chatHistoryList.length > 20) chatHistoryList = chatHistoryList.slice(-20);
      scrollChatToBottom();
    } else {
      addMessage("عذراً، حدث خطأ في معالجة الرد.", "bot");
    }
  } catch (error) {
    hideTyping();
    // Revert user message from history if API fails
    chatHistoryList.pop();
    addMessage("عذراً، حدث خطأ أثناء الاتصال. يرجى المحاولة لاحقاً.", "bot");
    console.error("Chat Error:", error);
  }
}

/**
 * Add a message bubble to the chat
 */
function addMessage(text, sender) {
  const messagesEl = document.getElementById("chatbot-messages");

  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const msgDiv = document.createElement("div");
  msgDiv.className = `message ${sender === "user" ? "user-message" : "bot-message"}`;

  if (sender === "bot") {
    msgDiv.innerHTML = `
      <div class="message-avatar"><i class="fas fa-robot"></i></div>
      <div class="message-bubble">
        <p>${text}</p>
        <span class="message-time">${time}</span>
      </div>
    `;
  } else {
    msgDiv.innerHTML = `
      <div class="message-bubble">
        <p>${text}</p>
        <span class="message-time">${time}</span>
      </div>
      <div class="message-avatar" style="background:linear-gradient(135deg,#5FA8D3,#3E7CA6)">أ</div>
    `;
  }

  messagesEl.appendChild(msgDiv);
  scrollChatToBottom();
}

/**
 * Show typing indicator
 */
function showTyping() {
  const messagesEl = document.getElementById("chatbot-messages");
  const typing = document.createElement("div");
  typing.className = "typing-indicator";
  typing.id = "typing-indicator";
  typing.innerHTML = `
    <div class="message-avatar"><i class="fas fa-robot"></i></div>
    <div class="typing-dots">
      <span></span><span></span><span></span>
    </div>
  `;
  messagesEl.appendChild(typing);
  scrollChatToBottom();
}

/**
 * Hide typing indicator
 */
function hideTyping() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

/**
 * Scroll chat to the bottom
 */
function scrollChatToBottom() {
  const messagesEl = document.getElementById("chatbot-messages");
  setTimeout(() => {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }, 50);
}

/**
 * Clear all chat messages
 */
function clearChat() {
  const messagesEl = document.getElementById("chatbot-messages");
  messagesEl.innerHTML = `
    <div class="message bot-message">
      <div class="message-avatar"><i class="fas fa-robot"></i></div>
      <div class="message-bubble">
        <p>تم مسح المحادثة. كيف يمكنني مساعدتك؟ 😊</p>
        <span class="message-time">الآن</span>
      </div>
    </div>
  `;
}

/**
 * Generate bot responses based on keywords
 */
function getBotResponse(userMessage) {
  const msg = userMessage.toLowerCase();

  // Greeting
  if (msg.includes("سلام") || msg.includes("مرحبا") || msg.includes("هلا") || msg.includes("أهلا")) {
    return "وعليكم السلام ورحمة الله! 😊 يسعدني مساعدتك في رحلتك التدريبية. ما الذي تودّ معرفته؟";
  }

  // Start training
  if (msg.includes("ابدأ") || msg.includes("كيف أبدأ") || msg.includes("بداية") || msg.includes("أول")) {
    return "للبدء في التدريب، انقر على 'التدريب الصوتي' في القائمة الجانبية. ستجد زر التسجيل الكبير 🎙️ اضغط عليه وابدأ بتسجيل خطابك، ثم ستحصل على تحليل فوري لأدائك!";
  }

  // Skill levels
  if (msg.includes("مستوى") || msg.includes("مستويات") || msg.includes("درجة")) {
    return "في منبر لدينا ثلاثة مستويات:\n\n🌱 مبتدئ: تتعلم أساسيات الخطابة\n📈 متوسط: تطور أسلوبك وثقتك\n🏆 متقدم: تتقن فنون الإقناع والتأثير\n\nيتم تحديد مستواك تلقائياً بناءً على أدائك في الجلسات.";
  }

  // Tips for speaking
  if (msg.includes("نصائح") || msg.includes("خطابة") || msg.includes("تحسين")) {
    return "إليك أهم نصائح الخطابة المؤثرة:\n\n🎯 ابدأ بقوة وجملة جاذبة\n🌬️ تنفس بعمق قبل البدء\n👁️ حافظ على تواصل بصري\n🎭 تنوع في نبرة صوتك\n⏱️ لا تتسرع، الوضوح أهم من السرعة\n💪 تدرّب يومياً لو 10 دقائق فقط!";
  }

  // Scenarios
  if (msg.includes("سيناريو") || msg.includes("محاكاة") || msg.includes("شبهات")) {
    return "رائع! السيناريوهات هي من أقوى أدوات التدريب 🧠 ستجدها في قسم 'محاكاة السيناريوهات'. تشمل مواقف الرد على الشبهات، الدعوة للأسرة، والحوار مع أصحاب الأفكار المختلفة.";
  }

  // Progress
  if (msg.includes("تقدم") || msg.includes("إحصائيات") || msg.includes("نتائج")) {
    return "يمكنك متابعة تقدمك التفصيلي في قسم 'تقدمي' 📊 ستجد فيه مؤشرات أدائك في الخطابة، الأسلوب، الثقة، ورد الشبهات، مع إحصائيات أسبوعية وأهداف شهرية.";
  }

  // Achievements
  if (msg.includes("إنجاز") || msg.includes("جائزة") || msg.includes("شهادة")) {
    return "الإنجازات محفزة جداً! 🏆 ستجد قسم 'الإنجازات' في القائمة. تشمل شارات للخطابة، حل السيناريوهات، والانتظام في التدريب. كلما تقدمت، كلما فتحت إنجازات جديدة!";
  }

  // Dawah topics
  if (msg.includes("دعوة") || msg.includes("داعية") || msg.includes("دعاة")) {
    return "الدعوة إلى الله شرف عظيم! 🌟 منصة منبر مصممة خصيصاً لتطوير مهاراتك الدعوية بأسلوب علمي ومنهجي. من أهم مهارات الداعية: الحكمة، وحسن الخلق، والعلم، والصبر.";
  }

  // Confidence
  if (msg.includes("ثقة") || msg.includes("خوف") || msg.includes("رهبة") || msg.includes("قلق")) {
    return "الخوف من الجمهور طبيعي جداً! 😊 للتغلب عليه:\n\n✅ تدرّب أمام المرآة يومياً\n✅ ابدأ بجمهور صغير من الأصدقاء\n✅ تنفس بعمق قبل البدء\n✅ ذكّر نفسك بالهدف النبيل\n✅ استخدم التسجيلات الصوتية للمراجعة";
  }

  // Help
  if (msg.includes("مساعدة") || msg.includes("مساعد") || msg.includes("ساعد")) {
    return "بكل سرور! 💙 أنا هنا لمساعدتك في أي استفسار عن:\n\n🎙️ التدريب الصوتي\n🧠 السيناريوهات التدريبية\n📊 متابعة التقدم\n🏆 الإنجازات والشهادات\n💡 نصائح الدعوة والخطابة\n\nاسألني عن أي موضوع!";
  }

  // Quran / hadith
  if (msg.includes("قرآن") || msg.includes("حديث") || msg.includes("آية")) {
    return 'قال الله تعالى: ﴿ادْعُ إِلَىٰ سَبِيلِ رَبِّكَ بِالْحِكْمَةِ وَالْمَوْعِظَةِ الْحَسَنَةِ﴾ [النحل: 125]\n\nهذه الآية هي دستور الداعية! الحكمة في الأسلوب، والموعظة الحسنة في المحتوى، والجدال بالتي هي أحسن في النقاش.';
  }

  // Default responses
  const defaults = [
    "شكراً على سؤالك! للحصول على مساعدة أكثر تخصصاً، يمكنك تصفح أقسام المنصة المختلفة. هل تريد أن أساعدك في شيء محدد؟ 😊",
    "سؤال رائع! 🌟 أنا هنا لمساعدتك في رحلتك الدعوية. هل تريد نصائح عن الخطابة أو التدريب الصوتي؟",
    "أفهم ما تقصده! 💡 المنصة تحتوي على موارد كثيرة تساعدك. تصفح الأقسام المختلفة أو اسألني عن موضوع محدد.",
    "جيد! دعني أساعدك. يمكنني تزويدك بمعلومات عن التدريب، السيناريوهات، أو نصائح الدعوة. ما الذي يهمك أكثر؟",
  ];

  return defaults[Math.floor(Math.random() * defaults.length)];
}

// ============================================
// AUTH MODAL & BACKEND LOGIC
// ============================================

let currentAuthMode = 'login';

function openAuthModal(mode) {
  currentAuthMode = mode;
  document.getElementById("auth-title").textContent = mode === 'login' ? 'تسجيل الدخول' : 'إنشاء حساب جديد';
  document.getElementById("auth-submit-btn").textContent = mode === 'login' ? 'دخول' : 'تسجيل';
  document.querySelector(".auth-switch").innerHTML = mode === 'login' 
    ? 'ليس لديك حساب؟ <a href="#" onclick="toggleAuthMode()">سجل الآن</a>'
    : 'لديك حساب بالفعل؟ <a href="#" onclick="toggleAuthMode()">تسجيل الدخول</a>';
  
  const modal = document.getElementById("auth-modal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
  document.getElementById("auth-error").style.display = "none";
}

function closeAuthModal() {
  const modal = document.getElementById("auth-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

function toggleAuthMode() {
  openAuthModal(currentAuthMode === 'login' ? 'register' : 'login');
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const username = document.getElementById("auth-username").value;
  const password = document.getElementById("auth-password").value;
  const errorEl = document.getElementById("auth-error");
  
  try {
    const res = await fetch(`http://localhost:3000/api/auth/${currentAuthMode}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    
    if (res.ok) {
      localStorage.setItem('minbar_token', data.token);
      localStorage.setItem('minbar_user', data.username);
      closeAuthModal();
      showToast("تم " + (currentAuthMode === 'login' ? "تسجيل الدخول" : "الاشتراك") + " بنجاح!", "success");
      loadUserProgress();
      showPage('dashboard-page');
    } else {
      errorEl.textContent = data.error || 'حدث خطأ';
      errorEl.style.display = "block";
    }
  } catch (err) {
    errorEl.textContent = 'تعذر الاتصال بالخادم';
    errorEl.style.display = "block";
  }
}

async function loadUserProgress() {
  try {
    const res = await fetch('http://localhost:3000/api/user/progress');
    if (res.ok) {
      const data = await res.json();
      if(document.getElementById("sessions-count")) document.getElementById("sessions-count").textContent = data.sessions_count || 0;
      
      const userLevel = data.level || 'مبتدئ';
      document.querySelectorAll(".user-level").forEach(el => el.innerHTML = `<i class="fas fa-star"></i> داعية ${userLevel}`);
      document.querySelectorAll(".user-name").forEach(el => el.textContent = data.name);
    }
  } catch (err) {
    console.error("Failed to load progress", err);
  }
}

async function saveProgressUpdate(sessionCountIncr, kpiUpdate) {
  try {
    const currentRes = await fetch('http://localhost:3000/api/user/progress');
    if (!currentRes.ok) return;
    const currentData = await currentRes.json();
    
    await fetch('http://localhost:3000/api/user/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessions_count: (currentData.sessions_count || 0) + (sessionCountIncr || 0),
        kpi_score: kpiUpdate || currentData.kpi_score
      })
    });
  } catch (err) {
    console.error("Failed to save progress", err);
  }
}

// ============================================
// LIBRARY SECTION LOGIC
// ============================================
let libraryData = [];

const libraryItems = {
  books: [
    { id: 101, title: "مدارج السالكين", author: "ابن القيم الجوزية", category: "تزكية", icon: "leaf" },
    { id: 102, title: "إحياء علوم الدين", author: "أبو حامد الغزالي", category: "تزكية", icon: "leaf" },
    { id: 103, title: "منهاج القاصدين", author: "ابن الجوزي", category: "تزكية", icon: "leaf" },
    { id: 104, title: "المغني", author: "ابن قدامة المقدسي", category: "فقه", icon: "gavel" },
    { id: 105, title: "بداية المجتهد", author: "ابن رشد", category: "فقه", icon: "gavel" },
    { id: 106, title: "المجموع", author: "الإمام النووي", category: "فقه", icon: "gavel" },
    { id: 107, title: "رياض الصالحين", author: "الإمام النووي", category: "حديث", icon: "book" },
    { id: 108, title: "بلوغ المرام", author: "ابن حجر العسقلاني", category: "حديث", icon: "book" },
    { id: 111, title: "أصول الدعوة", author: "د. عبد الكريم زيدان", category: "أصول دعوة", icon: "paper-plane" }
  ],
  hadith: [
    { id: 201, title: "صحيح البخاري", author: "الإمام البخاري", category: "الكتب التسعة", icon: "scroll" },
    { id: 202, title: "صحيح مسلم", author: "الإمام مسلم", category: "الكتب التسعة", icon: "scroll" },
    { id: 203, title: "سنن أبي داود", author: "أبو داود السجستاني", category: "الكتب التسعة", icon: "scroll" },
    { id: 204, title: "جامع الترمذي", author: "الإمام الترمذي", category: "الكتب التسعة", icon: "scroll" },
    { id: 205, title: "سنن النسائي", author: "الإمام النسائي", category: "الكتب التسعة", icon: "scroll" },
    { id: 206, title: "سنن ابن ماجه", author: "ابن ماجه القزويني", category: "الكتب التسعة", icon: "scroll" },
    { id: 207, title: "مسند الإمام أحمد", author: "الإمام أحمد بن حنبل", category: "الكتب التسعة", icon: "scroll" },
    { id: 208, title: "موطأ الإمام مالك", author: "الإمام مالك بن أنس", category: "الكتب التسعة", icon: "scroll" },
    { id: 209, title: "سنن الدارمي", author: "الإمام الدارمي", category: "الكتب التسعة", icon: "scroll" }
  ],
  quran: [
    { id: 301, title: "سورة الفاتحة", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 302, title: "سورة البقرة", author: "مدنية", category: "القرآن الكريم", icon: "quran" },
    { id: 303, title: "سورة آل عمران", author: "مدنية", category: "القرآن الكريم", icon: "quran" },
    { id: 304, title: "سورة الأنعام", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 305, title: "سورة الكهف", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 306, title: "سورة مريم", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 307, title: "سورة طه", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 308, title: "سورة يس", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 309, title: "سورة الرحمن", author: "مدنية", category: "القرآن الكريم", icon: "quran" },
    { id: 310, title: "سورة الواقعة", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 311, title: "سورة الملك", author: "مكية", category: "القرآن الكريم", icon: "quran" },
    { id: 312, title: "سورة الإخلاص", author: "مكية", category: "القرآن الكريم", icon: "quran" }
  ]
};

// HASH ROUTING (FOR EDITOR REDIRECT)
window.addEventListener('load', () => {
  if (window.location.hash === '#overview') {
    showPage('dashboard-page');
    showDashboardSection('overview', document.querySelector('[onclick*="overview"]'));
  }
});

// SCROLL EFFECTS
window.addEventListener('scroll', () => {
  const nav = document.querySelector('.navbar');
  if (nav) {
    if (window.scrollY > 50) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }
});

// PROGRESS BAR ANIMATION ON SCROLL
const progressObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const bars = entry.target.querySelectorAll('.animate-bar');
      bars.forEach(bar => {
        const targetAttr = bar.getAttribute('data-target');
        const target = parseInt(targetAttr) || 0;
        bar.style.width = target + '%';
        
        // Target number animation
        const valueDisplay = bar.closest('.progress-item').querySelector('.progress-value');
        if (valueDisplay && target > 0) {
          let current = 0;
          const interval = setInterval(() => {
            current += 1;
            if (current >= target) {
              valueDisplay.innerText = target + '%';
              clearInterval(interval);
            } else {
              valueDisplay.innerText = current + '%';
            }
          }, 20);
        }
      });
      progressObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.2 });


async function loadLibraryCategory(category) {
  document.querySelectorAll('.lib-tab').forEach(tab => tab.classList.remove('active'));
  const activeTab = Array.from(document.querySelectorAll('.lib-tab')).find(t => t.innerText.includes(category === 'books' ? 'كتب' : category === 'quran' ? 'القرآن' : 'الأحاديث'));
  if (activeTab) activeTab.classList.add('active');

  const container = document.getElementById('library-container');
  const loader = document.getElementById('library-loading');
  if (!container || !loader) return;

  container.innerHTML = '';
  loader.style.display = 'block';

  // Simulate network delay
  setTimeout(() => {
    libraryData = libraryItems[category] || [];
    loader.style.display = 'none';
    renderLibraryData(libraryData);
  }, 300);
}

function renderLibraryData(items) {
  const container = document.getElementById('library-container');
  if (!container) return;
  container.innerHTML = '';
  items.forEach(item => {
    container.innerHTML += `
      <div class="lib-card">
        <div class="lib-card-badge">${item.category}</div>
        <img src="https://api.dicebear.com/7.x/initials/svg?seed=${item.title}&backgroundColor=b6e3f4" alt="${item.title}" />
        <div class="lib-card-info">
          <h4>${item.title}</h4>
          <p class="lib-card-author"><i class="fas fa-user-edit"></i> ${item.author}</p>
        </div>
        <div style="display:flex; gap:10px; margin-top:auto;">
          <button class="lib-action" style="flex:1;">قراءة <i class="fas fa-book-open"></i></button>
          <button class="btn-primary" style="flex:1; font-size:0.8rem; padding:8px;" onclick="showToast('تمت الإضافة للمحرر', 'success')"><i class="fas fa-plus"></i> إدراج</button>
        </div>
      </div>
    `;
  });
}

// ============================================
// THEME MANAGEMENT (DARK MODE)
// ============================================

/**
 * Initialize theme based on preference or system settings
 */
function initTheme() {
  const root = document.documentElement;
  const saved = localStorage.getItem('theme');
  
  if (saved) {
    root.setAttribute('data-theme', saved);
    updateThemeIcon(saved);
  } else {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    root.setAttribute('data-theme', theme);
    updateThemeIcon(theme);
  }
}

/**
 * Toggle between light and dark themes
 */
function toggleDarkMode() {
  const root = document.documentElement;
  const current = root.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  updateThemeIcon(next);
}

/**
 * Update the theme toggle icon
 */
function updateThemeIcon(theme) {
  const icons = document.querySelectorAll('#theme-toggle-landing i, .theme-toggle i, #theme-toggle i');
  icons.forEach(icon => {
    icon.className = theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  });
}

// Initialize on load
initTheme();

window.sendToEditor = function(type, text) {
  let storageKey = 'pending_poetry'; 
  if(type === 'آية قرآنية') storageKey = 'pending_quran';
  if(type === 'حديث شريف') storageKey = 'pending_hadith';
  
  localStorage.setItem(storageKey, text);
  if(typeof showToast === 'function') {
    showToast('تمت الإضافة للمسودة! افتح محرر الخطب لإدراجها', 'success');
  } else {
    alert('تمت الإضافة للمسودة!');
  }
}

function filterLibraryResults() {
  const query = document.getElementById('lib-search-input').value.toLowerCase();
  const filtered = libraryData.filter(item => item.title.toLowerCase().includes(query) || item.content.toLowerCase().includes(query));
  renderLibraryData(filtered);
}

// ============================================
// DEMO MODAL
// ============================================

/**
 * Show the demo video modal
 */
function showDemoVideo() {
  const modal = document.getElementById("demo-modal");
  modal.classList.add("active");
  document.body.style.overflow = "hidden";
}

/**
 * Close the demo modal
 */
function closeDemoModal() {
  const modal = document.getElementById("demo-modal");
  modal.classList.remove("active");
  document.body.style.overflow = "";
}

// ============================================
// SCROLL UTILITIES
// ============================================

/**
 * Scroll to a section on the landing page
 */
function scrollToSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (el) {
    const offset = 80;
    const top = el.getBoundingClientRect().top + window.pageYOffset - offset;
    window.scrollTo({ top, behavior: "smooth" });
  }
}

// ============================================
// INTERSECTION OBSERVER (For animations)
// ============================================

/**
 * Observe elements for scroll-triggered animations
 */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.style.opacity = "1";
          entry.target.style.transform = "translateY(0)";

          // Trigger counter animation when hero stats are visible
          if (entry.target.classList.contains("hero-stats")) {
            animateCounters();
          }

          // Trigger progress bars when about section is visible
          if (entry.target.classList.contains("progress-showcase")) {
            animateProgressBars();
          }
        }
      });
    },
    { threshold: 0.15 }
  );

  // Observe feature cards
  document.querySelectorAll(".feature-card").forEach((card, i) => {
    card.style.opacity = "0";
    card.style.transform = "translateY(30px)";
    card.style.transition = `opacity 0.6s ease ${i * 0.1}s, transform 0.6s ease ${i * 0.1}s`;
    observer.observe(card);
  });

  // Observe hero stats
  const heroStats = document.querySelector(".hero-stats");
  if (heroStats) observer.observe(heroStats);

  // Observe progress showcase
  const showcase = document.querySelector(".progress-showcase");
  if (showcase) observer.observe(showcase);

  // Observe about list items
  document.querySelectorAll(".about-list li").forEach((item, i) => {
    item.style.opacity = "0";
    item.style.transform = "translateX(20px)";
    item.style.transition = `opacity 0.5s ease ${i * 0.15}s, transform 0.5s ease ${i * 0.15}s`;
    observer.observe(item);
  });
}

// ============================================
// TOAST NOTIFICATION
// ============================================

/**
 * Show a toast notification
 */

// ============================================
// FAKE DATA UPDATES
// ============================================

/**
 * Simulate live data updates for demo purposes
 */
function startFakeDataUpdates() {
  // Randomly update session count
  setInterval(() => {
    const el = document.getElementById("sessions-count");
    if (el && document.getElementById("dashboard-page").classList.contains("active")) {
      const current = parseInt(el.textContent);
      if (Math.random() > 0.95) {
        el.textContent = current + 1;
        showToast("جلسة تدريب جديدة مكتملة! 🎉", "success");
      }
    }
  }, 15000);
}

// ============================================
// KEYBOARD SHORTCUTS
// ============================================

/**
 * Handle global keyboard shortcuts
 */
document.addEventListener("keydown", (e) => {
  // Escape key
  if (e.key === "Escape") {
    closeDemoModal();
    if (chatbotIsOpen) closeChatbot();
    if (sidebarOpen) toggleSidebar();
  }
});

// ============================================
// INITIALIZATION
// ============================================

/**
 * Initialize everything when DOM is ready
 */
document.addEventListener("DOMContentLoaded", () => {
  // Always start at landing page when entering site directly
  // Initialize Dark Mode
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  // Handle routing
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash + '-section')) {
    showPage("dashboard-page", true);
    showDashboardSection(hash, document.querySelector(`[onclick*="${hash}"]`), true);
  } else if (hash === 'dashboard' || hash === 'overview') {
    showPage("dashboard-page", true);
    showDashboardSection('overview', null, true);
  } else {
    showPage("landing-page", true);
  }

  // Init Khutbah Editor
  initEditor();

  loadUserProgress();

  // Start scroll animations
  initScrollAnimations();

  // Animate progress bar values
  const showcase = document.querySelector('.progress-showcase');
  if (showcase) progressObserver.observe(showcase);

  // Animate counters
  animateCounters();

  // Start fake data updates
  startFakeDataUpdates();

  // Initialize scenarios data for sidebar dots
  scenarioResults = new Array(scenarios.length).fill(null);

  // Add smooth hover effects to nav items
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("mouseenter", function () {
      this.style.paddingRight = "20px";
    });
    item.addEventListener("mouseleave", function () {
      this.style.paddingRight = "";
    });
  });

  // Newsletter form
  const newsletterBtn = document.querySelector(".newsletter-input button");
  if (newsletterBtn) {
    newsletterBtn.addEventListener("click", () => {
      const input = document.querySelector(".newsletter-input input");
      if (input && input.value) {
        showToast("شكراً! تم اشتراكك في النشرة البريدية ✅", "success");
        input.value = "";
      } else {
        showToast("يرجى إدخال بريدك الإلكتروني", "error");
      }
    });
  }

  // Initial Library Load
  if (typeof loadLibraryCategory === 'function') {
    loadLibraryCategory('books');
  }

  console.log("🕌 Khotba Platform initialized successfully!");
  console.log("📚 Use showPage('dashboard-page') to navigate to dashboard");
  console.log("🤖 Chatbot is ready at bottom-left corner");
});

// Dropdown toggle logic
function toggleDropdown(event, id) {
  event.stopPropagation();
  const menu = document.getElementById(id);
  const isVisible = menu.style.display === 'block';
  
  // Close all other dropdowns
  document.querySelectorAll('.dropdown-menu').forEach(el => el.style.display = 'none');
  
  if (!isVisible && menu) {
    menu.style.display = 'block';
  }
}

// Close dropdowns if clicked outside
document.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown-wrapper')) {
    document.querySelectorAll('.dropdown-menu').forEach(el => el.style.display = 'none');
  }
});


/* ============================================
   EDITOR LOGIC
   ============================================ */

function initEditor() {
  const pendingQuran = localStorage.getItem('pending_quran');
  if (pendingQuran && document.getElementById('ev-quran')) {
    document.getElementById('ev-quran').value = pendingQuran;
    localStorage.removeItem('pending_quran');
  }
  
  const pendingHadith = localStorage.getItem('pending_hadith');
  if (pendingHadith && document.getElementById('ev-hadith')) {
    document.getElementById('ev-hadith').value = pendingHadith;
    localStorage.removeItem('pending_hadith');
  }
  
  const pendingPoetry = localStorage.getItem('pending_poetry');
  if (pendingPoetry && document.getElementById('ev-poetry')) {
    document.getElementById('ev-poetry').value = pendingPoetry;
    localStorage.removeItem('pending_poetry');
  }
  
  const savedStr = localStorage.getItem('current_khutbah');
  if (savedStr && document.getElementById('khutbah-title')) {
    try {
      const s = JSON.parse(savedStr);
      document.getElementById('khutbah-title').value = s.title || '';
      document.getElementById('box-intro').value = s.intro || '';
      if(document.getElementById('box-elements')) document.getElementById('box-elements').value = s.elements || '';
      document.getElementById('box-body').value = s.body || '';
      document.getElementById('box-conclusion').value = s.conclusion || '';
      if (!document.getElementById('ev-quran').value) document.getElementById('ev-quran').value = s.quran || '';
      if (!document.getElementById('ev-hadith').value) document.getElementById('ev-hadith').value = s.hadith || '';
      if (!document.getElementById('ev-poetry').value) document.getElementById('ev-poetry').value = s.poetry || '';
    } catch(e) {}
  }
}

async function saveKhutbah() {
  const title = document.getElementById('khutbah-title').value.trim();
  const intro = document.getElementById('box-intro').value.trim();
  const elements = document.getElementById('box-elements') ? document.getElementById('box-elements').value.trim() : "";
  const body = document.getElementById('box-body').value.trim();
  const conclusion = document.getElementById('box-conclusion').value.trim();
  const quran = document.getElementById('ev-quran').value.trim();
  const hadith = document.getElementById('ev-hadith').value.trim();
  const poetry = document.getElementById('ev-poetry').value.trim();

  const khutbahData = { title, intro, elements, body, conclusion, quran, hadith, poetry };
  localStorage.setItem('current_khutbah', JSON.stringify(khutbahData));

  if (!title || (!intro && !body)) {
    alert("يرجى كتابة العنوان وبعض المحتوى الرئيسي قبل الحفظ.");
    return;
  }

  try {
    const res = await fetch('http://localhost:3000/api/khutbahs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(khutbahData)
    });
    if(res.ok) {
      showToast("تم حفظ مسودة الخطبة بنجاح!", "success");
    } else {
      showToast("تعذر الحفظ في الخادم، ولكن تم الحفظ محلياً.", "success");
    }
  } catch(e) {
    console.error("Error saving khutbah:", e);
    showToast("تم الحفظ محلياً (وضع عدم الاتصال).", "success");
  }
}


/**
 * Helper to get the absolute API URL if running on a different port (e.g., Live Server)
 */
function getApiUrl(endpoint) {
  const BACKEND_PORT = 3000;
  if (window.location.port && window.location.port !== BACKEND_PORT.toString() && window.location.hostname === 'localhost') {
    return `http://localhost:${BACKEND_PORT}${endpoint}`;
  }
  return endpoint;
}