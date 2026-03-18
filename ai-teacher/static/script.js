/* ============================================
   ADVANCED AI TEACHER PLATFORM - FUTURISTIC UI
   ============================================ */

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", function() {
  initializeApp();
});

// Main app initialization
function initializeApp() {
  // Elements
  const themeSwitches = [
    document.getElementById("theme-toggle"),
    document.getElementById("dark-mode-toggle")
  ].filter(Boolean);
  const questionEl = document.getElementById("question");
  const sendBtn = document.getElementById("sendBtn");
  const micBtn = document.getElementById("voice-btn");
  const messagesContainer = document.getElementById("messages");
  const responseView = document.getElementById("responseView");
  const quizBtn = document.getElementById("quizBtn");
  const fileInput = document.getElementById("fileInput");
  const uploadZone = document.getElementById("upload-zone");
  const uploadSubmitBtn = document.getElementById("uploadSubmitBtn");
  const uploadModal = document.getElementById("upload-modal");

  // State
  let isListening = false;
  let recognition = null;
  let currentQuestion = "";

  // =====================
  // THEME TOGGLE
  // =====================
  const modeLabel = document.querySelector(".settings-group .setting-item label");

  const applyTheme = (mode) => {
    if (mode === "light") {
      document.body.classList.add("light-mode");
    } else {
      document.body.classList.remove("light-mode");
    }
    localStorage.setItem("theme", mode);
    themeSwitches.forEach((sw) => (sw.checked = mode === "light"));
    if (modeLabel) {
      modeLabel.textContent = mode === "light" ? "Light Mode" : "Dark Mode";
    }
  };

  if (themeSwitches.length) {
    themeSwitches.forEach((sw) => {
      sw.addEventListener("change", function() {
        applyTheme(this.checked ? "light" : "dark");
      });
    });

    const savedTheme = localStorage.getItem("theme");
    applyTheme(savedTheme === "light" ? "light" : "dark");
  }

  // =====================
  // CHAT FUNCTIONALITY
  // =====================
  const addMessage = (text, type = "user") => {
    const messageDiv = document.createElement("div");
    messageDiv.className = `message ${type}-message`;
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = type === "user" ? "👤" : "🤖";

    const content = document.createElement("div");
    content.className = "message-content";
    content.innerHTML = text;

    if (type === "user") {
      messageDiv.appendChild(content);
      messageDiv.appendChild(avatar);
    } else {
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(content);
    }

    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const showThinkingAnimation = () => {
    const messageDiv = document.createElement("div");
    messageDiv.className = "message ai-message";
    messageDiv.id = "thinking-message";
    
    const avatar = document.createElement("div");
    avatar.className = "message-avatar";
    avatar.textContent = "🤖";

    const content = document.createElement("div");
    content.className = "message-content ai-thinking";
    content.innerHTML = `
      <div class="thinking-loader">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
        <p>BrainWave is thinking...</p>
      </div>
    `;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  };

  const removeThinkingAnimation = () => {
    const thinkingMsg = document.getElementById("thinking-message");
    if (thinkingMsg) {
      thinkingMsg.remove();
    }
  };

  const displayResponse = (data) => {
    removeThinkingAnimation();

    // Add response message
    const responseText = data.introduction || data.lecture_explanation || "Response received";
    addMessage(responseText, "ai");

    // Update response panel
    if (responseView) {
      const cards = [
        { title: "Introduction", content: data.introduction || "No introduction available" },
        { title: "Explanation", content: data.lecture_explanation || "No explanation available" },
        { title: "Deep Dive", content: data.deep_dive || "No deep dive available" },
        { title: "Example", content: data.example || "No examples available" },
        { title: "Summary", content: data.summary || "No summary available" }
      ];

      responseView.innerHTML = "";
      cards.forEach((card, index) => {
        const cardEl = document.createElement("div");
        cardEl.className = "response-card";
        cardEl.style.animationDelay = `${index * 100}ms`;
        cardEl.innerHTML = `
          <div class="card-badge">${card.title}</div>
          <p>${card.content}</p>
        `;
        responseView.appendChild(cardEl);
      });
    }

    // Speak the response
    speak(responseText);
  };

  const sendMessage = async () => {
    const question = questionEl.value.trim();
    if (!question) return;

    currentQuestion = question;
    addMessage(question, "user");
    questionEl.value = "";
    showThinkingAnimation();

    try {
      const response = await fetch("/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: question })
      });

      const data = await response.json();
      
      if (data.error) {
        removeThinkingAnimation();
        addMessage("❌ " + data.error, "ai");
      } else {
        displayResponse(data);
      }
    } catch (error) {
      removeThinkingAnimation();
      addMessage("❌ Unable to connect. Please try again.", "ai");
      console.error("Error:", error);
    }
  };

  // Send button click
  if (sendBtn) {
    sendBtn.addEventListener("click", sendMessage);
  }

  // Enter key to send
  if (questionEl) {
    questionEl.addEventListener("keypress", function(e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  // =====================
  // VOICE INPUT/OUTPUT
  // =====================
  const speak = (text) => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    }
  };

  if (micBtn) {
    micBtn.addEventListener("click", function(e) {
      e.preventDefault();
      if (!recognition) {
        recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = "en-US";

        recognition.onstart = function() {
          isListening = true;
          micBtn.classList.add("active");
        };

        recognition.onend = function() {
          isListening = false;
          micBtn.classList.remove("active");
        };

        recognition.onresult = function(event) {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          if (transcript) {
            questionEl.value = transcript;
            setTimeout(sendMessage, 500);
          }
        };

        recognition.onerror = function(event) {
          console.log("Voice error:", event.error);
          micBtn.classList.remove("active");
        };
      }

      if (isListening) {
        recognition.stop();
        isListening = false;
        micBtn.classList.remove("active");
      } else {
        recognition.start();
      }
    });
  }

  // =====================
  // QUIZ FUNCTIONALITY
  // =====================
  const openQuiz = () => {
    const modal = document.getElementById("quiz-modal");
    if (modal) {
      modal.classList.add("show");
      renderQuiz();
    }
  };

  const closeQuiz = () => {
    const modal = document.getElementById("quiz-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  };

  const renderQuiz = async () => {
    const quizView = document.getElementById("quizView");
    if (!quizView) return;

    try {
      const response = await fetch("/quiz_request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: currentQuestion })
      });

      const data = await response.json();
      if (data.questions && data.questions.length > 0) {
        const q = data.questions[0];
        quizView.innerHTML = `
          <h3>${q.question}</h3>
          <div class="quiz-options">
            ${q.options.map((opt, idx) => `
              <div class="option-card" onclick="selectOption(this, ${idx}, ${q.answer})">
                <span class="option-radio"></span>
                <p>${opt}</p>
              </div>
            `).join("")}
          </div>
          <button class="submit-answer-btn" onclick="submitAnswer(${q.answer})">Check Answer</button>
        `;
      }
    } catch (error) {
      console.error("Quiz error:", error);
    }
  };

  // =====================
  // MODAL MANAGEMENT
  // =====================
  const localOpenProgress = () => {
    const modal = document.getElementById("progress-modal");
    if (modal) {
      modal.classList.add("show");
      updateProgressDashboard();
    }
  };

  const localCloseProgress = () => {
    const modal = document.getElementById("progress-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  };

  const localOpenUpload = () => {
    const modal = document.getElementById("upload-modal");
    if (modal) {
      modal.classList.add("show");
    }
  };

  const localCloseUpload = () => {
    const modal = document.getElementById("upload-modal");
    if (modal) {
      modal.classList.remove("show");
    }
  };

  // =====================
  // UPLOAD FUNCTIONALITY
  // =====================
  if (uploadZone) {
    uploadZone.addEventListener("click", () => fileInput.click());
    uploadZone.addEventListener("dragover", (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = "var(--neon-cyan)";
    });
    uploadZone.addEventListener("dragleave", () => {
      uploadZone.style.borderColor = "";
    });
    uploadZone.addEventListener("drop", (e) => {
      e.preventDefault();
      uploadZone.style.borderColor = "";
      if (e.dataTransfer.files.length) {
        fileInput.files = e.dataTransfer.files;
        handleFileUpload();
      }
    });
  }

  if (fileInput) {
    fileInput.addEventListener("change", handleFileUpload);
  }

  const handleFileUpload = () => {
    const files = fileInput.files;
    if (files.length === 0) return;

    const fileLabel = document.querySelector(".upload-status");
    const file = files[0];
    if (fileLabel) {
      fileLabel.innerHTML = `📁 <strong>${file.name}</strong> (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
    }

    // Upload to server
    const formData = new FormData();
    formData.append("file", file);

    fetch("/upload", {
      method: "POST",
      body: formData
    }).then(res => res.json()).then(data => {
      if (data.success) {
        addMessage(`✅ File "${file.name}" uploaded successfully!`, "ai");
        setTimeout(() => closeUpload(), 1000);
      }
    }).catch(err => console.error("Upload error:", err));
  };

  if (uploadSubmitBtn) {
    uploadSubmitBtn.addEventListener("click", () => {
      if (fileInput.files.length > 0) {
        addMessage("📚 Starting to learn from your document...", "ai");
        closeUpload();
      }
    });
  }

  // =====================
  // PROGRESS DASHBOARD
  // =====================
  const updateProgressDashboard = async () => {
    try {
      const response = await fetch("/progress");
      const data = await response.json();
      
      const xpText = document.getElementById("xp-text");
      if (xpText) {
        xpText.textContent = `${data.current_xp || 0} / 3,000 XP`;
      }

      // Update stats
      const statCards = document.querySelectorAll(".stat-card");
      if (statCards.length >= 4) {
        statCards[0].querySelector(".stat-number").textContent = `${data.streak || 0} days`;
        statCards[1].querySelector(".stat-number").textContent = `${data.topics || 0}`;
        statCards[2].querySelector(".stat-number").textContent = `${data.quiz_score || 0}%`;
        statCards[3].querySelector(".stat-number").textContent = `${data.learning_hours || 0} hrs`;
      }
    } catch (error) {
      console.error("Progress update error:", error);
    }
  };

  // =====================
  // QUIZ ANSWER SUBMISSION
  // =====================
  window.selectOption = (element, index, correctIndex) => {
    const options = element.parentElement.querySelectorAll(".option-card");
    options.forEach(opt => opt.classList.remove("selected"));
    element.classList.add("selected");
  };

  window.submitAnswer = (correctIndex) => {
    const selectedOption = document.querySelector(".option-card.selected");
    if (!selectedOption) {
      alert("Please select an option");
      return;
    }

    const options = document.querySelectorAll(".option-card");
    let userIndex = -1;
    options.forEach((opt, idx) => {
      if (opt.classList.contains("selected")) {
        userIndex = idx;
      }
    });

    if (userIndex === correctIndex) {
      selectedOption.classList.add("correct");
      addMessage("🎉 Correct answer! Great job!", "ai");
    } else {
      selectedOption.classList.add("wrong");
      options[correctIndex].classList.add("correct");
      addMessage("❌ Incorrect. The correct answer is highlighted.", "ai");
    }

    setTimeout(() => {
      closeQuiz();
    }, 2000);
  };

  // =====================
  // PAGE ANIMATIONS
  // =====================
  const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = "1";
        entry.target.style.transform = "translateY(0)";
      }
    });
  }, observerOptions);

  document.querySelectorAll(".message, .response-card").forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(10px)";
    el.style.transition = "all 0.4s ease-out";
    observer.observe(el);
  });

  // Assign all functions to window scope
  window.selectOption = (element, index, correctIndex) => {
    const options = element.parentElement.querySelectorAll(".option-card");
    options.forEach(opt => opt.classList.remove("selected"));
    element.classList.add("selected");
  };

  window.submitAnswer = (correctIndex) => {
    const selectedOption = document.querySelector(".option-card.selected");
    if (!selectedOption) {
      alert("Please select an option");
      return;
    }

    const options = document.querySelectorAll(".option-card");
    let userIndex = -1;
    options.forEach((opt, idx) => {
      if (opt.classList.contains("selected")) {
        userIndex = idx;
      }
    });

    if (userIndex === correctIndex) {
      selectedOption.classList.add("correct");
      addMessage("🎉 Correct answer! Great job!", "ai");
    } else {
      selectedOption.classList.add("wrong");
      options[correctIndex].classList.add("correct");
      addMessage("❌ Incorrect. The correct answer is highlighted.", "ai");
    }

    setTimeout(() => {
      window.closeQuiz();
    }, 2000);
  };

  window.openQuiz = openQuiz;
  window.closeQuiz = closeQuiz;
  window.openProgress = localOpenProgress;
  window.closeProgress = localCloseProgress;
  window.openUpload = localOpenUpload;
  window.closeUpload = localCloseUpload;
}

// Global wrapper functions for HTML onclick handlers
function openQuiz() { window.openQuiz?.(); }
function closeQuiz() { window.closeQuiz?.(); }
function openProgress() { window.openProgress?.(); }
function closeProgress() { window.closeProgress?.(); }
function openUpload() { window.openUpload?.(); }
function closeUpload() { window.closeUpload?.(); }
function selectOption(e, i, c) { window.selectOption?.(e, i, c); }
function submitAnswer(c) { window.submitAnswer?.(c); }

async function generateQuiz() {
  let topic = prompt("Enter topic for quiz:");

  const res = await fetch("http://localhost:3000/quiz", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ topic }),
  });

  const data = await res.json();
  addMessage("📝 Quiz:\n" + data.quiz, "bot");
}
