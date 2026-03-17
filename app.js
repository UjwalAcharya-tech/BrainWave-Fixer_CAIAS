/* ===================================
   BRAINWAVE - MAIN APPLICATION
   =================================== */

class BrainWave {
  constructor() {
    this.currentPage = 'chat';
    this.currentQuestion = '';
    this.isListening = false;
    this.recognition = null;
    this.progressChart = null;
    this.userSettings = this.loadSettings();
    this.userStats = this.loadStats();

    this.init();
  }

  init() {
    this.setupElements();
    this.setupEventListeners();
    this.applyTheme();
    this.initChart();
    this.loadInitialPage();
  }

  setupElements() {
    // Navigation
    this.navItems = document.querySelectorAll('.nav-item');
    this.pages = document.querySelectorAll('.page');
    this.themeToggle = document.getElementById('theme-toggle');

    // Chat
    this.messagesContainer = document.getElementById('messages');
    this.responsePanel = document.getElementById('responsePanel');
    this.responseContent = document.getElementById('responseContent');
    this.questionInput = document.getElementById('question');
    this.sendBtn = document.getElementById('send-btn');
    this.voiceBtn = document.getElementById('voice-btn');
    this.errorBox = document.getElementById('error-box');

    // Calculator
    this.calcInput = document.getElementById('calc-input');
    this.calcBtn = document.getElementById('calc-btn');
    this.calcResult = document.getElementById('calc-result');
    this.calcValue = document.getElementById('calc-value');

    // Upload
    this.dropZone = document.getElementById('drop-zone');
    this.fileInput = document.getElementById('file-input');
    this.uploadPreview = document.getElementById('uploadPreview');
    this.analyzeBtn = document.getElementById('analyze-btn');
    this.previewName = document.getElementById('previewName');
    this.previewSize = document.getElementById('previewSize');
    this.previewIcon = document.getElementById('previewIcon');
    this.filesList = document.getElementById('filesList');

    // Settings
    this.darkModeToggle = document.getElementById('dark-mode-toggle');
    this.usernameInput = document.getElementById('username-input');
    this.nameSaveBtn = document.getElementById('name-save-btn');
    this.notificationsToggle = document.getElementById('notifications-toggle');
    this.voiceOutputToggle = document.getElementById('voice-output-toggle');
    this.resetBtn = document.getElementById('reset-btn');

    // Quiz
    this.quizContent = document.getElementById('quiz-content');
    this.quizEmpty = document.getElementById('quiz-empty');
    this.quizResults = document.getElementById('quiz-results');
    this.quizTitle = document.getElementById('quiz-title');
    this.questionText = document.getElementById('question-text');
    this.optionsGrid = document.getElementById('options-grid');
    this.quizSubmitBtn = document.getElementById('quiz-submit-btn');
    this.quizNextBtn = document.getElementById('quiz-next-btn');
    this.quizRetryBtn = document.getElementById('quiz-retry-btn');
    this.quizFeedback = document.getElementById('quiz-feedback');
    this.quizCounter = document.getElementById('quiz-counter');
    this.quizProgressFill = document.getElementById('quiz-progress-fill');

    this.currentQuiz = null;
    this.currentQuestionIndex = 0;
    this.selectedAnswer = null;
    this.quizScore = 0;
  }

  setupEventListeners() {
    // Navigation
    this.navItems.forEach(item => {
      item.addEventListener('click', (e) => this.navigateTo(item.dataset.page));
    });

    // Theme
    this.themeToggle.addEventListener('change', () => this.toggleTheme());

    // Chat
    this.sendBtn.addEventListener('click', () => this.sendMessage());
    this.voiceBtn.addEventListener('click', () => this.toggleVoice());
    this.questionInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Calculator
    this.calcBtn?.addEventListener('click', () => this.calculateExpression());
    this.calcInput?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.calculateExpression();
      }
    });

    // Upload
    this.dropZone.addEventListener('click', () => this.fileInput.click());
    this.dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropZone.style.borderColor = 'var(--accent-green)';
    });
    this.dropZone.addEventListener('dragleave', () => {
      this.dropZone.style.borderColor = '';
    });
    this.dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropZone.style.borderColor = '';
      if (e.dataTransfer.files.length) {
        this.handleFileSelect(e.dataTransfer.files[0]);
      }
    });

    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files.length) {
        this.handleFileSelect(e.target.files[0]);
      }
    });

    this.analyzeBtn?.addEventListener('click', () => this.analyzeFile());

    // Settings
    this.darkModeToggle?.addEventListener('change', (e) => {
      document.body.classList.toggle('light-mode', !e.target.checked);
      this.userSettings.darkMode = e.target.checked;
      this.saveSettings();
    });

    this.nameSaveBtn?.addEventListener('click', () => this.saveName());
    this.resetBtn?.addEventListener('click', () => this.resetProgress());

    this.notificationsToggle?.addEventListener('change', (e) => {
      this.userSettings.notifications = e.target.checked;
      this.saveSettings();
    });

    this.voiceOutputToggle?.addEventListener('change', (e) => {
      this.userSettings.voiceOutput = e.target.checked;
      this.saveSettings();
    });

    // Quiz
    this.quizSubmitBtn?.addEventListener('click', () => this.submitQuizAnswer());
    this.quizNextBtn?.addEventListener('click', () => this.nextQuestion());
    this.quizRetryBtn?.addEventListener('click', () => this.retakeQuiz());
  }

  // ===== NAVIGATION =====

  navigateTo(page) {
    this.currentPage = page;

    this.navItems.forEach(item => {
      item.classList.toggle('active', item.dataset.page === page);
    });

    this.pages.forEach(p => {
      p.classList.remove('active');
    });

    document.querySelector(`.${page}-page`)?.classList.add('active');

    if (page === 'dashboard') {
      this.updateDashboard();
    } else if (page === 'progress') {
      this.updateProgress();
    } else if (page === 'settings') {
      this.updateSettings();
    } else if (page === 'quiz') {
      this.checkQuizAvailability();
    }
  }

  loadInitialPage() {
    this.navigateTo('chat');
  }

  // ===== CHAT =====

  async sendMessage() {
    const question = this.questionInput.value.trim();
    if (!question) return;

    this.currentQuestion = question;
    this.addMessage(question, 'user');
    this.questionInput.value = '';
    this.showThinkingAnimation();

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      const data = await response.json();
      this.handleAIResponse(data);
    } catch (error) {
      this.removeThinkingAnimation();
      this.addMessage('❌ Unable to connect. Please try again.', 'ai');
    }
  }

  addMessage(text, type = 'user') {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${type}-message`;

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = type === 'user' ? '👤' : '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = text;

    if (type === 'user') {
      messageDiv.appendChild(content);
      messageDiv.appendChild(avatar);
    } else {
      messageDiv.appendChild(avatar);
      messageDiv.appendChild(content);
    }

    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  showThinkingAnimation() {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message ai-message';
    messageDiv.id = 'thinking-message';

    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.textContent = '🤖';

    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = `
      <div style="display: flex; gap: 4px; align-items: center;">
        <span style="animation: bounce 1.4s infinite">●</span>
        <span style="animation: bounce 1.4s infinite 0.2s">●</span>
        <span style="animation: bounce 1.4s infinite 0.4s">●</span>
        <p style="margin: 0; margin-left: 4px; font-size: 14px; color: var(--text-secondary);">Thinking...</p>
      </div>
    `;

    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    this.messagesContainer.appendChild(messageDiv);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  removeThinkingAnimation() {
    const thinkingMsg = document.getElementById('thinking-message');
    if (thinkingMsg) thinkingMsg.remove();
  }

  handleAIResponse(data) {
    this.removeThinkingAnimation();

    const responseText = data.introduction || data.lecture_explanation || 'Response received';
    this.addMessage(responseText, 'ai');

    // Detailed ChatGPT-style sections
    const detailedSections = [
      {
        icon: '🎯',
        title: 'Overview',
        content: data.introduction,
        detailed: true
      },
      {
        icon: '📚',
        title: 'Detailed Explanation',
        content: this.formatDetailedContent(data.lecture_explanation),
        detailed: true
      },
      {
        icon: '🔬',
        title: 'Technical Deep Dive',
        content: this.formatDetailedContent(data.deep_dive),
        detailed: true
      },
      {
        icon: '💡',
        title: 'Practical Examples',
        content: this.formatExamples(data.example),
        detailed: true
      },
      {
        icon: '✨',
        title: 'Summary & Key Points',
        content: this.formatSummary(data.summary),
        detailed: true
      }
    ];

    this.responseContent.innerHTML = '';
    detailedSections.forEach((section, index) => {
      if (section.content && section.content.trim()) {
        const sectionDiv = document.createElement('div');
        sectionDiv.className = 'response-section detailed-section';
        sectionDiv.style.animationDelay = `${index * 0.15}s`;
        
        // Enhanced formatting for detailed content
        const formattedContent = this.parseAndFormatContent(section.content);
        
        sectionDiv.innerHTML = `
          <h4>${section.icon} ${section.title}</h4>
          <div class="section-body">${formattedContent}</div>
        `;
        this.responseContent.appendChild(sectionDiv);
      }
    });

    // Add comprehensive tips section
    const tipsDiv = document.createElement('div');
    tipsDiv.className = 'response-section tips-section';
    tipsDiv.style.animationDelay = `${detailedSections.length * 0.15}s`;
    tipsDiv.style.borderLeft = '4px solid var(--accent-purple)';
    tipsDiv.style.background = 'rgba(168, 85, 247, 0.08)';
    tipsDiv.innerHTML = `
      <h4>💬 Pro Tips for Better Understanding</h4>
      <ul class="tips-list">
        <li><strong>Practice:</strong> Apply these concepts with real-world examples</li>
        <li><strong>Review:</strong> Come back to this explanation periodically to reinforce learning</li>
        <li><strong>Connect:</strong> Link this knowledge to other concepts you know</li>
        <li><strong>Teach:</strong> Try explaining this to someone else in your own words</li>
        <li><strong>Question:</strong> Ask yourself "why" and "how" questions about the content</li>
      </ul>
    `;
    this.responseContent.appendChild(tipsDiv);

    // Store quiz if available
    if (data.quiz && data.quiz.questions && Array.isArray(data.quiz.questions)) {
      this.currentQuiz = {
        topic: this.currentQuestion,
        questions: data.quiz.questions
      };
    } else {
      this.currentQuiz = this.generateDetailedQuiz(this.currentQuestion, responseText);
    }
    
    this.currentQuestionIndex = 0;
    this.quizScore = 0;
    this.selectedAnswer = null;

    if (this.userSettings.voiceOutput) {
      this.speak(responseText);
    }

    this.updateStats();
  }

  parseAndFormatContent(content) {
    if (!content) return '';
    
    // Format paragraphs with proper spacing
    let formatted = content
      .split('\n\n')
      .filter(para => para.trim())
      .map(para => {
        // Check for bullet points or numbered lists
        if (para.trim().match(/^[\d\-\*]/)) {
          return `<p class="list-item">${para.trim()}</p>`;
        }
        return `<p>${para.trim()}</p>`;
      })
      .join('');

    // Convert markdown-style bold
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    formatted = formatted.replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Convert markdown-style italic
    formatted = formatted.replace(/\*(.*?)\*/g, '<em>$1</em>');
    formatted = formatted.replace(/_(.*?)_/g, '<em>$1</em>');

    return formatted;
  }

  formatDetailedContent(content) {
    if (!content) return '';
    
    // Enhanced formatting for technical content
    const sections = content.split(/\n(?=[-•]|\d\.)/);
    
    return sections
      .map(section => {
        section = section.trim();
        if (section.match(/^[-•\d\.]/)) {
          return `<li class="detail-item">${section.replace(/^[-•\d\.]\s*/, '')}</li>`;
        }
        return `<p>${section}</p>`;
      })
      .join('');
  }

  formatExamples(content) {
    if (!content) return '';
    
    // Format examples with code-block style
    return `
      <div class="example-box">
        <pre class="example-code">${content}</pre>
      </div>
    `;
  }

  formatSummary(content) {
    if (!content) return '';
    
    // Format summary as key points
    const points = content.split(/[\n•-]/).filter(p => p.trim());
    
    return `
      <div class="summary-points">
        ${points.map(point => `<div class="point">• ${point.trim()}</div>`).join('')}
      </div>
    `;
  }

  generateDetailedQuiz(topic, content) {
    // Generate 5 comprehensive quiz questions
    return {
      topic: topic,
      questions: [
        {
          question: `Explain the main concept of "${topic}" in your own words.`,
          options: [
            'It is a fundamental approach to understanding this subject',
            'It is only theoretical with no practical application',
            'It was invented just recently',
            'It has no importance in modern context'
          ],
          correct_index: 0,
          explanation: `${topic} is indeed a fundamental and important concept with broad applications.`
        },
        {
          question: `What is the primary importance of "${topic}"?`,
          options: [
            'It provides a foundation for deeper understanding and practical applications',
            'It is just academic and rarely used',
            'It confuses most students',
            'It became obsolete over time'
          ],
          correct_index: 0,
          explanation: `Understanding "${topic}" is crucial as it forms the basis for advanced learning and real-world problem-solving.`
        },
        {
          question: `How would you apply what you learned about "${topic}" in real life?`,
          options: [
            'By identifying relevant situations and using the learned principles to solve problems',
            'It cannot be applied outside classroom',
            'Only experts can apply this knowledge',
            'It is not meant to be practical'
          ],
          correct_index: 0,
          explanation: `Real-world application is key to truly understanding "${topic}" - look for scenarios where these principles apply.`
        },
        {
          question: `Which of these best describes your current understanding of "${topic}"?`,
          options: [
            'I have a solid grasp and can apply it in various contexts',
            'I understand the basics but need more practice',
            'I am still confused about most concepts',
            'I have not understood anything yet'
          ],
          correct_index: 0,
          explanation: `Good! If you\'re at this level, continue practicing and reviewing. Learning is a continuous process.`
        },
        {
          question: `What would be your next step to deepen your knowledge of "${topic}"?`,
          options: [
            'Practice with real examples, explore related topics, and teach others',
            'Stop learning as you now know everything',
            'Only memorize facts without understanding',
            'Avoid related topics as they are too complex'
          ],
          correct_index: 0,
          explanation: `Excellent approach! Continuous learning through practice, exploration, and teaching others is the best way to master "${topic}".`
        }
      ]
    };
  }

  speak(text) {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  }

  async calculateExpression() {
    const expression = this.calcInput.value.trim();
    if (!expression) return;

    try {
      const response = await fetch('/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: expression })
      });

      const data = await response.json();
      
      // Extract the math result from the response
      let result = data.math_result || data.introduction || 'Unable to calculate';
      
      // Clean up the result to show just the answer
      if (typeof result === 'string') {
        // Extract just the numeric/symbolic result
        const match = result.match(/Result:\s*(.+?)(?:\n|$)/i) || 
                     result.match(/=\s*(.+?)(?:\n|$)/i) ||
                     result.match(/:\s*(.+?)(?:\n|$)/i);
        result = match ? match[1].trim() : result;
      }

      // Display the result
      this.calcValue.textContent = result;
      this.calcResult.style.display = 'block';

      // Clear input
      this.calcInput.value = '';
    } catch (error) {
      this.calcValue.textContent = 'Error: Unable to calculate';
      this.calcResult.style.display = 'block';
    }
  }

  toggleVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      this.showError('Speech Recognition not supported. Use Chrome/Edge.');
      return;
    }

    if (!this.recognition) {
      this.recognition = new SR();
      this.recognition.lang = 'en-US';
      this.recognition.onstart = () => {
        this.isListening = true;
        this.voiceBtn.style.background = 'rgba(34, 197, 94, 0.3)';
        this.voiceBtn.style.borderColor = 'var(--accent-green)';
      };
      this.recognition.onend = () => {
        this.isListening = false;
        this.voiceBtn.style.background = '';
        this.voiceBtn.style.borderColor = '';
      };
      this.recognition.onresult = (event) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          this.questionInput.value = transcript;
          setTimeout(() => this.sendMessage(), 500);
        }
      };
      this.recognition.onerror = (event) => {
        this.showError(`Voice error: ${event.error}`);
        this.isListening = false;
        this.voiceBtn.style.background = '';
      };
    }

    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  showError(message) {
    this.errorBox.textContent = message;
    setTimeout(() => {
      this.errorBox.textContent = '';
    }, 4000);
  }

  // ===== DASHBOARD =====

  updateDashboard() {
    const stats = this.userStats;
    document.getElementById('total-time').textContent = `${stats.learningHours}h ${stats.learningMinutes}m`;
    document.getElementById('topics-count').textContent = stats.topicsCovered;
    document.getElementById('quiz-accuracy').textContent = `${stats.quizAccuracy}%`;
    document.getElementById('streak-count').textContent = `${stats.streak} days`;

    this.updateChart();
  }

  initChart() {
    const ctx = document.getElementById('progressChart');
    if (!ctx) return;

    this.progressChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        datasets: [{
          label: 'Learning Time (minutes)',
          data: [30, 45, 60, 40, 75, 50, 65],
          borderColor: '#22c55e',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
          fill: true,
          pointBackgroundColor: '#22c55e',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            labels: {
              color: 'var(--text)',
              font: { size: 12 }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: 'var(--text-secondary)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          },
          x: {
            ticks: { color: 'var(--text-secondary)' },
            grid: { color: 'rgba(255, 255, 255, 0.05)' }
          }
        }
      }
    });
  }

  updateChart() {
    if (this.progressChart) {
      this.progressChart.data.datasets[0].data = this.generateWeeklyData();
      this.progressChart.update();
    }
  }

  generateWeeklyData() {
    return Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 20));
  }

  // ===== PROGRESS =====

  updateProgress() {
    // Stats are displayed in the progress page HTML
    // This method can be extended for dynamic updates
  }

  // ===== QUIZ =====

  checkQuizAvailability() {
    if (!this.currentQuiz) {
      this.quizEmpty.style.display = 'flex';
      this.quizContent.style.display = 'none';
      this.quizResults.style.display = 'none';
    } else {
      this.quizEmpty.style.display = 'none';
      this.quizContent.style.display = 'block';
      this.quizResults.style.display = 'none';
      this.displayQuestion();
    }
  }

  displayQuestion() {
    if (!this.currentQuiz || !this.currentQuiz.questions) {
      return;
    }

    const question = this.currentQuiz.questions[this.currentQuestionIndex];
    if (!question) return;

    this.quizTitle.textContent = this.currentQuiz.topic;
    this.questionText.textContent = question.question;
    const total = this.currentQuiz.questions.length;
    const current = this.currentQuestionIndex + 1;
    this.quizCounter.textContent = `Question ${current} of ${total}`;
    this.quizProgressFill.style.width = `${(current / total) * 100}%`;

    this.optionsGrid.innerHTML = '';
    this.selectedAnswer = null;
    this.quizFeedback.style.display = 'none';
    this.quizSubmitBtn.style.display = 'block';
    this.quizNextBtn.style.display = 'none';

    if (question.options && Array.isArray(question.options)) {
      question.options.forEach((option, index) => {
        const btn = document.createElement('button');
        btn.className = 'option-button';
        btn.textContent = option;
        btn.addEventListener('click', () => this.selectOption(index));
        this.optionsGrid.appendChild(btn);
      });
    }
  }

  selectOption(index) {
    this.selectedAnswer = index;
    const buttons = this.optionsGrid.querySelectorAll('.option-button');
    buttons.forEach((btn, i) => {
      btn.classList.toggle('selected', i === index);
    });
  }

  submitQuizAnswer() {
    if (this.selectedAnswer === null) {
      this.showError('Please select an answer');
      return;
    }

    const question = this.currentQuiz.questions[this.currentQuestionIndex];
    const isCorrect = this.selectedAnswer === question.correct_index;

    if (isCorrect) {
      this.quizScore++;
    }

    // Show feedback
    this.quizFeedback.style.display = 'block';
    this.quizFeedback.className = isCorrect ? 'quiz-feedback correct' : 'quiz-feedback incorrect';
    this.quizFeedback.innerHTML = isCorrect 
      ? `<strong>✓ Correct!</strong> ${question.explanation || 'Great job!'}`
      : `<strong>✗ Incorrect</strong> The correct answer is: <strong>${question.options[question.correct_index]}</strong>${question.explanation ? '<br>' + question.explanation : ''}`;

    // Disable options
    const buttons = this.optionsGrid.querySelectorAll('.option-button');
    buttons.forEach((btn, i) => {
      btn.disabled = true;
      if (i === question.correct_index) {
        btn.classList.add('correct');
      } else if (i === this.selectedAnswer && !isCorrect) {
        btn.classList.add('incorrect');
      }
    });

    this.quizSubmitBtn.style.display = 'none';
    this.quizNextBtn.style.display = 'block';
  }

  nextQuestion() {
    this.currentQuestionIndex++;
    if (this.currentQuestionIndex < this.currentQuiz.questions.length) {
      this.displayQuestion();
    } else {
      this.showResults();
    }
  }

  showResults() {
    this.quizContent.style.display = 'none';
    this.quizResults.style.display = 'block';

    const total = this.currentQuiz.questions.length;
    const percentage = Math.round((this.quizScore / total) * 100);
    
    let icon = '🎉';
    let title = 'Excellent!';
    let message = 'You have mastered this topic!';

    if (percentage < 60) {
      icon = '📚';
      title = 'Keep Practicing!';
      message = 'Review the concept and try again!';
    } else if (percentage < 80) {
      icon = '👏';
      title = 'Good Job!';
      message = 'You understand most of the concept!';
    }

    document.getElementById('results-icon').textContent = icon;
    document.getElementById('results-title').textContent = title;
    document.getElementById('results-score').textContent = `Your Score: ${this.quizScore}/${total} (${percentage}%)`;
    document.getElementById('results-message').textContent = message;
  }

  retakeQuiz() {
    this.currentQuestionIndex = 0;
    this.quizScore = 0;
    this.selectedAnswer = null;
    this.checkQuizAvailability();
  }

  // ===== UPLOAD =====

  handleFileSelect(file) {
    const validTypes = ['application/pdf', 'text/plain', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    
    if (!validTypes.includes(file.type)) {
      this.showError('Unsupported file type. Please upload PDF, TXT, DOC, or IMAGE.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.showError('File is too large. Maximum size is 10MB.');
      return;
    }

    const icons = {
      'application/pdf': '📕',
      'text/plain': '📄',
      'image/jpeg': '🖼️',
      'image/png': '🖼️',
      'application/msword': '📗',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📗'
    };

    this.previewIcon.textContent = icons[file.type] || '📄';
    this.previewName.textContent = file.name;
    this.previewSize.textContent = (file.size / 1024).toFixed(2) + ' KB';
    this.uploadPreview.style.display = 'flex';

    this.currentFile = file;
  }

  analyzeFile() {
    if (!this.currentFile) return;

    const formData = new FormData();
    formData.append('file', this.currentFile);

    fetch('/upload', {
      method: 'POST',
      body: formData
    })
      .then(res => res.json())
      .then(data => {
        this.addMessage(`✅ File "${this.currentFile.name}" uploaded successfully!`, 'ai');
        this.updateFilesList();

        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        fileItem.textContent = `📁 ${this.currentFile.name}`;
        this.filesList.appendChild(fileItem);
      })
      .catch(err => {
        this.showError('Upload failed. Please try again.');
      });
  }

  updateFilesList() {
    // Fetch and display uploaded files
  }

  // ===== SETTINGS =====

  updateSettings() {
    this.usernameInput.value = this.userSettings.username || 'User';
    this.darkModeToggle.checked = this.userSettings.darkMode !== false;
    this.notificationsToggle.checked = this.userSettings.notifications !== false;
    this.voiceOutputToggle.checked = this.userSettings.voiceOutput !== false;
  }

  saveName() {
    const newName = this.usernameInput.value.trim();
    if (newName) {
      this.userSettings.username = newName;
      this.saveSettings();
      this.showError('✅ Name saved!');
    }
  }

  resetProgress() {
    if (confirm('⚠️ This will reset all your progress. Are you sure?')) {
      this.userStats = {
        learningHours: 0,
        learningMinutes: 0,
        topicsCovered: 0,
        quizAccuracy: 0,
        streak: 0,
        questionsAsked: 0
      };
      localStorage.removeItem('brainwave-stats');
      location.reload();
    }
  }

  // ===== THEME =====

  toggleTheme() {
    const isDark = this.themeToggle.checked;
    document.body.classList.toggle('light-mode', !isDark);
    this.userSettings.darkMode = isDark;
    this.saveSettings();
  }

  applyTheme() {
    const isDark = this.userSettings.darkMode !== false;
    if (!isDark) {
      document.body.classList.add('light-mode');
    }
    this.themeToggle.checked = isDark;
  }

  // ===== STATS & STORAGE =====

  updateStats() {
    this.userStats.questionsAsked++;
    this.userStats.learningMinutes += 5;
    if (this.userStats.learningMinutes >= 60) {
      this.userStats.learningHours++;
      this.userStats.learningMinutes = 0;
    }
    this.userStats.topicsCovered = Math.min(this.userStats.topicsCovered + 1, 50);
    this.userStats.quizAccuracy = Math.min(this.userStats.quizAccuracy + 2, 100);
    this.saveStats();
  }

  saveSettings() {
    localStorage.setItem('brainwave-settings', JSON.stringify(this.userSettings));
  }

  loadSettings() {
    const saved = localStorage.getItem('brainwave-settings');
    return saved ? JSON.parse(saved) : {
      username: 'User',
      darkMode: true,
      notifications: true,
      voiceOutput: true
    };
  }

  saveStats() {
    localStorage.setItem('brainwave-stats', JSON.stringify(this.userStats));
  }

  loadStats() {
    const saved = localStorage.getItem('brainwave-stats');
    return saved ? JSON.parse(saved) : {
      learningHours: 0,
      learningMinutes: 0,
      topicsCovered: 0,
      quizAccuracy: 0,
      streak: 0,
      questionsAsked: 0
    };
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new BrainWave();
});

// Add bounce animation to CSS
const style = document.createElement('style');
style.textContent = `
  @keyframes bounce {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-6px); }
  }
`;
document.head.appendChild(style);
