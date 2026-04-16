/* ============================================
   MINBAR – DA'WAH TRAINING PLATFORM
   Main JavaScript File
   ============================================ */

/* ============================================
   GROQ API INTEGRATION (LLAMA 3.3)
   ============================================ */
// Function to get the latest config at call time
function getGroqKey() {
  return window.KhotbaConfig?.GROQ_API_KEY || "";
}
function getAssemblyKey() {
  return window.KhotbaConfig?.ASSEMPLY_API_KEY || "";
}

async function callGemini(prompt, systemContext = "", forceJson = false) {
  // Rate limiting (Added previously)
  const now = Date.now();
  if (window._lastGeminiCall && now - window._lastGeminiCall < 3000) {
    throw new Error('برجاء الانتظار قليلاً قبل إرسال رسالة جديدة');
  }
  window._lastGeminiCall = now;
  
  // Handling array format for the ChatBot history
  let messages = [
    { role: "system", content: systemContext || "أنت مساعد متخصص في منصة خطبة لتدريب الدعاة. تجيب باللغة العربية فقط." }
  ];

  if (Array.isArray(prompt)) {
    messages = messages.concat(prompt.map(p => ({
      role: p.role === 'model' ? 'assistant' : 'user',
      content: p.parts[0].text 
    })));
  } else {
    messages.push({ role: "user", content: prompt });
  }

  const reqBody = {
    model: "llama-3.3-70b-versatile",
    messages: messages,
    max_tokens: 1000,
    temperature: 0.7
  };

  if (forceJson) {
    reqBody.response_format = { type: "json_object" };
  }

  const apiKey = getGroqKey();
  if (!apiKey) {
    console.error("Khotba: GROQ_API_KEY is missing. Please ensure config.js is loaded with the correct keys.");
    throw new Error('مفتاح الـ API غير متوفر. يرجى مراجعة إعدادات الموقع.');
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify(reqBody)
  });

  const data = await response.json();
  if (!response.ok) {
    console.error("Groq API Error:", data);
    throw new Error(data.error?.message || "خطأ في الاتصال بالسيرفر");
  }
  return data.choices[0].message.content;
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
// RECORDING / TRAINING SECTION (HYBRID: WEB SPEECH + ASSEMBLY AI FALLBACK)
// ============================================
// (Keys handled by getAssemblyKey function)

let isRecording = false;
let recordingTimer = null;
let seconds = 0;
let waveformInterval = null;

let speechRecognition = null;
let finalTranscript = "";

let mediaRecorder = null;
let audioChunks = [];
let audioStream = null;

/**
 * Toggle recording state
 */
function toggleRecording() {
  if (!isRecording) {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      if (speechRecognition) {
        try { speechRecognition.start(); } catch(e){}
      }
      resumeRecordingUI();
    } else {
      startRecording();
    }
  } else {
    pauseRecording();
  }
}

/**
 * Start the recording simulation
 */
async function startRecording() {
  try {
    // 1. Force real hardware MIC access (This alone solves permissions)
    if (!audioStream) {
      audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
    }

    if (!mediaRecorder || mediaRecorder.state === "inactive") {
      const options = {};
      if (MediaRecorder.isTypeSupported('audio/webm')) {
        options.mimeType = 'audio/webm';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        options.mimeType = 'audio/mp4'; // Fallback for Safari/iOS
      }
      mediaRecorder = new MediaRecorder(audioStream, options);
      audioChunks = [];
      mediaRecorder.addEventListener("dataavailable", event => {
        if (event.data.size > 0) audioChunks.push(event.data);
      });
      mediaRecorder.start(1000); // Timeslice guarantees chunk availability before stop
    }

    // 2. Setup Real-time Web Speech API for "on-the-fly" writing
    if (!speechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        speechRecognition = new SpeechRecognition();
        speechRecognition.lang = 'ar-EG'; // Support Arabic natively
        speechRecognition.continuous = true;
        speechRecognition.interimResults = true;
        
        speechRecognition.onresult = (event) => {
          let interimTranscript = "";
          let currentFinal = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              currentFinal += event.results[i][0].transcript + " ";
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          finalTranscript += currentFinal;
          document.getElementById("stt-textarea").value = finalTranscript + interimTranscript;
        };

        speechRecognition.onerror = (event) => {
          console.error("Speech Recognition Error:", event.error);
        };
        
        speechRecognition.onend = () => {
          if (isRecording) {
            try { speechRecognition.start(); } catch(e) {}
          }
        };
      }
    }
    
    if (!isRecording) {
       finalTranscript = document.getElementById("stt-textarea").value;
       if(finalTranscript.length > 0 && !finalTranscript.endsWith(" ")) finalTranscript += " ";
       if (speechRecognition) {
         try { speechRecognition.start(); } catch(e) {}
       }
    }
    
    resumeRecordingUI();
  } catch (err) {
    console.error("Mic access error:", err);
    showToast("يرجى السماح بالوصول إلى الميكروفون للتسجيل", "error");
  }
}

function resumeRecordingUI() {
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
  label.textContent = "جاري الاستماع... يمكنك التحدث الآن";
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

  if (speechRecognition) {
    try { speechRecognition.stop(); } catch(e) {}
  }
  
  if (mediaRecorder && mediaRecorder.state === "recording") {
    mediaRecorder.pause();
  }

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
    showToast("يرجى التسجيل لمدة ثانية على الأقل", "error");
    return;
  }

  isRecording = false;
  if (speechRecognition) {
    try { speechRecognition.stop(); } catch(e) {}
  }
  
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

  const transcriptText = document.getElementById("stt-textarea").value.trim();
  
  // SCENARIO 1: Web Speech API succeeded in writing text live
  if (transcriptText.length > 5) {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
          mediaRecorder.stop();
          if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
          }
      }
      showToast("تم التقاط الصوت! يتم الآن تقييم الخطبة...", "success");
      showAnalysis(transcriptText);
      stopBtn.innerHTML = '<i class="fas fa-stop"></i><span>إيقاف وتحليل</span>';
      stopBtn.disabled = false;
      return;
  }

  // SCENARIO 2: Web Speech API failed silently (Empty textarea). Fallback to AssemblyAI
  stopBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span> تفريغ الصوت ذكياً...</span>';
  
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.addEventListener("stop", async () => {
          const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunks, { type: actualMimeType });
          if (audioStream) {
            audioStream.getTracks().forEach(track => track.stop());
            audioStream = null;
          }
          
          try {
              // Upload to AssemblyAI
              const uploadRes = await fetch("https://api.assemblyai.com/v2/upload", {
                  method: "POST",
                  headers: { "Authorization": getAssemblyKey() },
                  body: audioBlob
              });
              const uploadData = await uploadRes.json();
              
              if (!uploadData.upload_url) throw new Error("Upload Failed");

              // Start transcription
              const transcriptRes = await fetch("https://api.assemblyai.com/v2/transcript", {
                  method: "POST",
                  headers: { 
                      "Authorization": getAssemblyKey(),
                      "Content-Type": "application/json"
                  },
                  body: JSON.stringify({ 
                      audio_url: uploadData.upload_url,
                      language_code: "ar" 
                  })
              });
              const transcriptData = await transcriptRes.json();
              const transcriptId = transcriptData.id;

              // Poll for completion
              let status = "processing";
              let textResult = "";
              while (status === "processing" || status === "queued") {
                  await new Promise(r => setTimeout(r, 2000));
                  const pollRes = await fetch(`https://api.assemblyai.com/v2/transcript/${transcriptId}`, {
                      headers: { "Authorization": ASSEMBLY_API_KEY }
                  });
                  const pollData = await pollRes.json();
                  status = pollData.status;
                  if (status === "completed") {
                      textResult = pollData.text;
                  } else if (status === "error") {
                      throw new Error("Transcribe Error");
                  }
              }

              const textarea = document.getElementById("stt-textarea");
              textarea.value = textResult;
              
              if (!textResult.trim()) {
                  showToast("لم نتمكن من سماع أي صوت واضح. يرجى تكرار التسجيل.", "error");
                  stopBtn.innerHTML = '<i class="fas fa-stop"></i><span>إيقاف وتحليل</span>';
                  stopBtn.disabled = false;
                  return;
              }
              
              showToast("اكتمل التفريغ عبر AssemblyAI! جاري التقييم...", "success");
              showAnalysis(textResult);

          } catch(err) {
              console.error("AssemblyAI Error:", err);
              showToast("هناك مشكلة في تحويل صوتك. المربع فارغ.", "error");
          } finally {
              stopBtn.innerHTML = '<i class="fas fa-stop"></i><span>إيقاف وتحليل</span>';
              stopBtn.disabled = false;
          }
      });
      mediaRecorder.stop();
  } else {
      showToast("المربع فارغ ولم نستطع التقاط أي صوت.", "error");
      stopBtn.innerHTML = '<i class="fas fa-stop"></i><span>إيقاف وتحليل</span>';
      stopBtn.disabled = false;
  }
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

    const replyText = await callGemini(transcript, systemPrompt, true);
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
    const systemPrompt = `أنت خبير ومحكم صارم في فن الخطابة والدعوة. قوانينك:
1- أعد صياغة هذه الخطبة بأسلوب عربي بليغ ومؤثر جداً.
2- حافظ على المعنى الأصلي تماماً دون تحريف.
3- استخدم ألفاظاً شرعية ورصينة تتناسب مع منبر المسجد.
4- أرسل النص المحسّن بشكل مباشر فقط! لا تكتب أي مقدمات، ولا تضع أي شروحات أو تعليقات خارجية.`;
    
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
    const systemPrompt = `أنت المساعد الأكاديمي والمدرب الأساسي في "منصة خطبة" لإعداد الدعاة والخطباء.
معلومات أساسية عن مطوريك: نحن مجموعة طلاب من كلية الدعوة الإسلامية بجامعة الأزهر بنين القاهرة.

قوانينك الصارمة (طاعتها إجبارية):
1. التخصص والمصادر: تجيب حصرياً في علوم الخطابة والدعوة. استمد علمك من مكتبات إسلامية موثوقة (مثل إسلام ويب) وتحدث كخبير دعوي.
2. المنهجية والخلافات: يُمنع منعاً باتاً الخوض في أي خلافات عقدية (أشاعرة، سلفية، ماتريدية) أو أي صراعات سياسية. يمكنك ذكر الخلافات الفقهية بشكل علمي طبيعي ومحايد. كن دائماً سهلاً، سمحاً، وميسراً للناس.
3. أسلوب وشكل الإجابة: الإجابات يجب أن تكون "مختصرة جداً" ومبسطة لأقصى حد. استخدم دائماً القوائم والنقاط (Bullet points) بحيث تكون كل معلومة في سطر مستقل لسهولة القراءة. تحدث بهدوء وبدون مونولوجات طويلة أو حشو زائد.
4. الموثوقية: اقتصر في الأدلة على القرآن وصحيح السنة فقط. تجنب الأحاديث الضعيفة والقصص الواهية تماماً.
5. الانضباط: إذا سُئلت عن موضوع خارج مساحة الدعوة أو العلوم الشرعية، اعتذر بعبارة واحدة لطيفة.`;
    
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
  // Mock authentication successfully
  try {
    localStorage.setItem('minbar_token', 'mock_token_12345');
    localStorage.setItem('minbar_user', username);
    closeAuthModal();
    showToast("تم " + (currentAuthMode === 'login' ? "تسجيل الدخول" : "الاشتراك") + " بنجاح!", "success");
    loadUserProgress();
    showPage('dashboard-page');
  } catch (err) {
    const errorEl = document.getElementById("auth-error");
    errorEl.textContent = 'حدث خطأ غير متوقع';
    errorEl.style.display = "block";
  }
}

async function loadUserProgress() {
  try {
    // Mock user progress data instead of fetching from localhost server
    const data = {
      sessions_count: parseInt(localStorage.getItem('minbar_sessions') || "24"),
      level: "متقدم",
      name: localStorage.getItem('minbar_user') || "محمد أحمد",
      khitaba: 85,
      uslub: 72,
      tafaul: 68,
      thiqa: 79
    };
    
    if(document.getElementById("sessions-count")) document.getElementById("sessions-count").textContent = data.sessions_count;
    
    const userLevel = data.level;
    document.querySelectorAll(".user-level").forEach(el => el.innerHTML = `<i class="fas fa-star"></i> داعية ${userLevel}`);
    document.querySelectorAll(".user-name").forEach(el => el.textContent = data.name);
  } catch (err) {
    console.error("Failed to load progress", err);
  }
}

async function saveProgressUpdate(sessionCountIncr, kpiUpdate) {
  try {
    let currentSessions = parseInt(localStorage.getItem('minbar_sessions') || "24");
    if (sessionCountIncr) {
      localStorage.setItem('minbar_sessions', currentSessions + sessionCountIncr);
    }
    // Also update overall kpi if provided
    if (kpiUpdate) {
       localStorage.setItem('minbar_avg_progress', kpiUpdate);
    }
  } catch (err) {
    console.error("Failed to save progress", err);
  }
}

// ============================================
// LIBRARY SECTION LOGIC
// ============================================
let libraryData = [];

const libraryItems = {
  "العقيدة": [
    { title: "جوهرة التوحيد", author: "إبراهيم اللقاني", category: "العقيدة", icon: "cube", pdf: "https://ia802804.us.archive.org/3/items/fp91942/91942.pdf" },
    { title: "الخريدة البهية", author: "أحمد الدردير", category: "العقيدة", icon: "cube", pdf: "https://ia800702.us.archive.org/27/items/kharida.bahia.all/khareedahh.pdf" },
    { title: "كبرى اليقينيات الكونية", author: "د. محمد سعيد رمضان البوطي", category: "العقيدة", icon: "cube", pdf: "https://ia800902.us.archive.org/3/items/KubraYYaqiniyat/kubra-yaqiniyat.pdf" }
  ],
  "التفسير": [
    { title: "تفسير ابن كثير", author: "الإمام ابن كثير", category: "التفسير", icon: "book-open", pdf: "https://ia800305.us.archive.org/26/items/Tafseer_Ibn_Katheer/Tafseer_Ibn_Katheer.pdf" },
    { title: "تفسير الطبري", author: "الإمام الطبري", category: "التفسير", icon: "book-open", pdf: "https://ia801300.us.archive.org/23/items/tafseratabari/tafseratabari.pdf" },
    { title: "تيسير الكريم الرحمن", author: "السعدي", category: "التفسير", icon: "book-open", pdf: "https://ia800302.us.archive.org/1/items/Tafseer_Sa3dy_Jame3/t_saadi.pdf" }
  ],
  "الحديث": [
    { title: "صحيح البخاري", author: "الإمام البخاري", category: "الحديث الشريف", icon: "comment-dots", pdf: "https://ia800508.us.archive.org/0/items/sahih-al-bukhari_202010/sahih-bukhari.pdf" },
    { title: "صحيح مسلم", author: "الإمام مسلم", category: "الحديث الشريف", icon: "comment-dots", pdf: "https://ia802908.us.archive.org/11/items/abualhasan_s_m/s_m.pdf" },
    { title: "رياض الصالحين", author: "الإمام النووي", category: "الحديث الشريف", icon: "comment-dots", pdf: "https://ia802803.us.archive.org/4/items/ryadalssalhen/ryadalssalhen.pdf" }
  ],
  "الفقه": [
    { title: "المغني", author: "ابن قدامة المقدسي", category: "الفقه", icon: "scale-balanced", pdf: "https://ia802807.us.archive.org/28/items/Al-mugni/Mugni.pdf" },
    { title: "بداية المجتهد", author: "ابن رشد", category: "الفقه", icon: "scale-balanced", pdf: "https://ia800306.us.archive.org/25/items/bidayat_mujtahid/bidayat.pdf" },
    { title: "فقه السنة", author: "سيد سابق", category: "الفقه", icon: "scale-balanced", pdf: "https://ia800206.us.archive.org/13/items/fiqhusunnah/fiqh_usunnah.pdf" }
  ],
  "السيرة": [
    { title: "الرحيق المختوم", author: "صفي الرحمن المباركفوري", category: "السيرة", icon: "mosque", pdf: "https://ia802807.us.archive.org/10/items/RaheeqMakhtoom/raheeq_makhtoom.pdf" },
    { title: "زاد المعاد", author: "ابن قيم الجوزية", category: "السيرة", icon: "mosque", pdf: "https://ia800201.us.archive.org/15/items/Zad_Al-Maad/Zad.pdf" },
    { title: "سيرة ابن هشام", author: "ابن هشام", category: "السيرة", icon: "mosque", pdf: "https://ia800207.us.archive.org/17/items/SerahIbnHisham/SerahHisham.pdf" }
  ],
  "الرقائق": [
    { title: "مدارج السالكين", author: "ابن قيم الجوزية", category: "الرقائق", icon: "heart", pdf: "https://ia800307.us.archive.org/28/items/Madarij_Salikeen/Madarij.pdf" },
    { title: "إحياء علوم الدين", author: "أبو حامد الغزالي", category: "الرقائق", icon: "heart", pdf: "https://ia800201.us.archive.org/7/items/Ihya_Oloum_Eddin/Ihya.pdf" },
    { title: "الداء والدواء", author: "ابن قيم الجوزية", category: "الرقائق", icon: "heart", pdf: "https://ia802802.us.archive.org/3/items/DaWaDawaZad/dawa2.pdf" }
  ],
  "اللغة": [
    { title: "ألفية ابن مالك", author: "ابن مالك", category: "اللغة", icon: "feather", pdf: "https://ia800306.us.archive.org/34/items/Alfiya_Ibn_Malik/Alfiya.pdf" },
    { title: "مغني اللبيب", author: "ابن هشام الأنصاري", category: "اللغة", icon: "feather", pdf: "https://ia800208.us.archive.org/22/items/MughniLabib/Mughni.pdf" }
  ],
  "عام": [
    { title: "رسالة في آداب البحث", author: "مجهول", category: "بحوث", icon: "layer-group", pdf: "https://ia800908.us.archive.org/24/items/Risalat_Adab_Bahth/Risala.pdf" },
    { title: "فتاوى معاصرة", author: "مجموعة علماء", category: "فتاوى", icon: "layer-group", pdf: "https://ia802901.us.archive.org/25/items/FatawaQaradawi/Fatawa.pdf" }
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


async function openLibCategory(categoryKey) {
  document.getElementById('library-categories').style.display = 'none';
  const booksView = document.getElementById('library-books-view');
  booksView.style.display = 'block';
  
  const titleEl = document.getElementById('current-category-title');
  titleEl.innerHTML = `<i class="fas fa-book"></i> قسم: ${categoryKey}`;

  const container = document.getElementById('library-container');
  const loader = document.getElementById('library-loading');
  
  container.innerHTML = '';
  loader.style.display = 'block';

  // Simulate network fetch for books
  setTimeout(() => {
    loader.style.display = 'none';
    const books = libraryItems[categoryKey] || [];
    renderLibraryData(books);
  }, 400);
}

function backToCategories() {
  document.getElementById('library-books-view').style.display = 'none';
  document.getElementById('library-categories').style.display = 'grid';
  document.getElementById('lib-search-input').value = '';
}

function renderLibraryData(items) {
  const container = document.getElementById('library-container');
  if (!container) return;
  container.innerHTML = '';
  
  if(items.length === 0) {
     container.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: var(--text-light); padding: 40px;">لا يوجد كتب في هذا القسم حالياً.</div>';
     return;
  }
  
  items.forEach(item => {
    container.innerHTML += `
      <div class="lib-card" style="background: var(--bg-card); border: 1px solid var(--border); box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
        <div class="lib-card-badge" style="background:var(--primary); color:white">${item.category}</div>
        <div style="height: 120px; background: linear-gradient(135deg, rgba(95,168,211,0.2), rgba(62,124,166,0.1)); display:flex; align-items:center; justify-content:center;">
           <i class="fas fa-${item.icon} fa-4x" style="color:var(--secondary)"></i>
        </div>
        <div class="lib-card-info" style="padding: 15px;">
          <h4 style="margin-bottom: 8px; color: var(--color-text-primary); font-size: 1.1rem;">${item.title}</h4>
          <p class="lib-card-author" style="color: var(--text-light); font-size: 0.9rem;"><i class="fas fa-user-edit"></i> ${item.author}</p>
        </div>
        <div style="display:flex; gap:10px; margin-top:auto; padding: 0 15px 15px 15px;">
          <button class="lib-action" onclick="window.open('${item.pdf}', '_blank')" style="flex:1; border: 1px solid var(--primary); background: transparent; color: var(--primary); border-radius: 6px; cursor: pointer;">تصفح PDF <i class="fas fa-file-pdf"></i></button>
          <button class="btn-primary" style="flex:1; font-size:0.8rem; padding:8px;" onclick="showToast('تم إرسال الاقتباس للمحرر', 'success')"><i class="fas fa-plus"></i> إدراج</button>
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
    // Mock successful save locally instead of hitting localhost
    showToast("تم حفظ مسودة الخطبة بنجاح محلياً!", "success");
  } catch(e) {
    console.error("Error saving khutbah:", e);
    showToast("حدث خطأ في الحفظ المحلي.", "error");
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