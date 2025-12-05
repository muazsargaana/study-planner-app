// Navigation between screens
function goToPage(page) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach(screen => screen.classList.remove('active'));

  const pageMap = {
    'launch': 'launch-screen',
    'todo': 'todo-screen',
    'calendar': 'calendar-screen',
    'progress': 'progress-screen',
    'recommender': 'recommender-screen'
  };

  document.getElementById(pageMap[page]).classList.add('active');

  // Update active nav button
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  const btnTextMap = {
    'todo': 'To-Do List',
    'calendar': 'Calendar',
    'progress': 'Progress Tracker',
    'recommender': 'Study Method'
  };
  const activeBtn = Array.from(document.querySelectorAll('.nav-btn')).find(btn => btn.textContent.trim() === btnTextMap[page]);
  if (activeBtn) activeBtn.classList.add('active');
}
goToPage('launch'); // Show launch screen on load

// --- Tasks (To-Do List) ---
let tasks = JSON.parse(localStorage.getItem("tasks") || "[]");

function saveTasks() {
  localStorage.setItem("tasks", JSON.stringify(tasks));
  updateTaskList();
  updateProgress();
}

function addTask(e) {
  e.preventDefault();
  const subject = document.getElementById("task-subject").value.trim();
  const title = document.getElementById("task-title").value.trim();
  const priority = document.getElementById("task-priority").value;

  if (!subject || !title) {
    alert("Please fill in both subject and task.");
    return;
  }

  tasks.push({ subject, title, priority, done: false });
  saveTasks();

  e.target.reset();
}

function toggleTask(index) {
  tasks[index].done = !tasks[index].done;
  saveTasks();
}

function deleteTask(index) {
  if (confirm("Are you sure you want to delete this task?")) {
    tasks.splice(index, 1);
    saveTasks();
  }
}

function updateTaskList() {
  const container = document.getElementById("task-list");
  container.innerHTML = "";

  const grouped = tasks.reduce((acc, task, i) => {
    acc[task.subject] = acc[task.subject] || [];
    acc[task.subject].push({ ...task, index: i });
    return acc;
  }, {});

  for (let subject in grouped) {
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<h3>${subject}</h3>`;

    const ul = document.createElement("ul");
    grouped[subject].forEach(task => {
      const li = document.createElement("li");
      li.innerHTML = `
        <input type="checkbox" onchange="toggleTask(${task.index})" ${task.done ? "checked" : ""}>
        <span style="text-decoration:${task.done ? 'line-through' : 'none'}">${task.title}</span>
        ${task.priority !== "none" ? `<span class="tag ${task.priority}">${task.priority} Priority</span>` : ""}
        <button onclick="deleteTask(${task.index})" aria-label="Delete task" style="float:right; background:none; border:none; cursor:pointer;">❌</button>
      `;
      ul.appendChild(li);
    });

    card.appendChild(ul);
    container.appendChild(card);
  }
}

// --- Progress Tracker ---
function updateProgress() {
  const completed = tasks.filter(t => t.done).length;
  const total = tasks.length;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("progress-circle").innerText = percent + "%";
  document.getElementById("progress-msg").innerText = percent >= 70 ? "Great job! Keep it up!" : "Keep pushing!";

  const subjectStats = {};
  tasks.forEach(t => {
    if (!subjectStats[t.subject]) subjectStats[t.subject] = { total: 0, done: 0 };
    subjectStats[t.subject].total++;
    if (t.done) subjectStats[t.subject].done++;
  });

  const container = document.getElementById("subject-progress");
  container.innerHTML = "";

  for (let subject in subjectStats) {
    const { total, done } = subjectStats[subject];
    const p = Math.round((done / total) * 100);
    container.innerHTML += `
      <h4>${subject}</h4>
      <progress value="${done}" max="${total}"></progress>
      <p>${done} / ${total} tasks (${p}%)</p>
    `;
  }
}


// --- Calendar ---
let sessions = JSON.parse(localStorage.getItem("sessions") || "[]");

function saveSessions() {
  localStorage.setItem("sessions", JSON.stringify(sessions));
  renderCalendarGrid();
  updateCalendarSessions();
}

function addSession(e) {
  e.preventDefault();
  const date = document.getElementById("session-date").value;
  const subject = document.getElementById("session-subject").value.trim();
  const time = document.getElementById("session-time").value.trim();

  if (!date || !subject || !time) {
    alert("Please fill in all session details.");
    return;
  }

  sessions.push({ date, subject, time });
  saveSessions();
  e.target.reset();
}

function deleteSession(index) {
  if (confirm("Delete this session?")) {
    sessions.splice(index, 1);
    saveSessions();
  }
}

function updateCalendarSessions() {
  const container = document.getElementById("calendar-sessions");
  container.innerHTML = "<h4>📚 Study Sessions</h4>";
  if (sessions.length === 0) {
    container.innerHTML += "<p>No sessions added yet.</p>";
    return;
  }

  sessions.forEach((s, index) => {
    const div = document.createElement("div");
    div.className = "card";
    div.innerHTML = `<strong>${s.date}</strong> - ${s.subject} (${s.time}) <button onclick="deleteSession(${index})" style="float:right;">🗑</button>`;
    container.appendChild(div);
  });
}

function renderCalendarGrid() {
  const calendar = document.getElementById("calendar");
  calendar.innerHTML = ""; // Clear previous content

  const calendarBody = document.createElement("div");
  calendarBody.className = "calendar-body";
  calendar.appendChild(calendarBody);

  // No header row creation
  // const headerRow = document.createElement("div");
  // headerRow.className = "calendar-row header";
  // calendarBody.appendChild(headerRow);

  const hours = Array.from({ length: 12 }, (_, i) => `${8 + i}:00`);
  for (let i = 0; i < hours.length; i++) {
    const row = document.createElement("div");
    row.className = "calendar-row";

    // No time labels
    // const timeCell = document.createElement("div");
    // timeCell.className = "time-cell";
    // timeCell.textContent = hours[i];
    // row.appendChild(timeCell);

    for (let j = 0; j < 7; j++) { // Create 7 columns for each day
      const cell = document.createElement("div");
      cell.className = "calendar-cell";
      cell.dataset.row = i;
      cell.dataset.col = j;
      row.appendChild(cell);
    }

    calendarBody.appendChild(row);
  }

  
  renderSessionBlocks(); // Call to render existing sessions
}
  
function renderSessionBlocks() {
  sessions.forEach((s, i) => {
    try {
      const dateObj = new Date(s.date);
      const day = (dateObj.getDay() + 6) % 7; // Monday = 0

      const hourPart = s.time.split("-")[0].trim();
      const startHour = parseInt(hourPart.split(":")[0]);
      const row = startHour - 8;

      if (row < 0 || row > 11 || day < 0 || day > 6) return;

      const cell = document.querySelector(`.calendar-cell[data-row="${row}"][data-col="${day}"]`);
      if (!cell) return;

      const sessionBlock = document.createElement("div");
      sessionBlock.className = "session-block";
      sessionBlock.textContent = s.subject;
      sessionBlock.title = s.time;

      const delBtn = document.createElement("button");
      delBtn.textContent = "🗑";
      delBtn.className = "delete-session";
      delBtn.onclick = () => deleteSession(i);

      sessionBlock.appendChild(delBtn);
      cell.appendChild(sessionBlock);
    } catch (err) {
      console.warn("Invalid session skipped:", s, err);
    }
  });
}

// --- Study Method Recommender ---
function generateRecommendations(e) {
  e.preventDefault();

  const style = document.getElementById("learning-style").value;
  const environment = document.getElementById("study-environment").value.trim() || "a quiet space";
  const duration = parseInt(document.getElementById("study-duration").value) || 30;

  const takesNotes = document.getElementById("take-notes").checked;
  const groupStudy = document.getElementById("study-groups").checked;
  const takesBreaks = document.getElementById("take-breaks").checked;
  const activeReview = document.getElementById("active-review").checked;
  const timeBlocking = document.getElementById("time-blocking").checked;
  const motivationTips = document.getElementById("motivation-tips").checked;

  let output = `<h4>🎯 Tailored Study Recommendations</h4>`;
  output += `<p><strong>Environment:</strong> Study in ${environment} to maximise focus.</p>`;
  output += `<p><strong>Session Duration:</strong> ${duration} minutes per study block.</p>`;

  // Learning Style Recommendations
  if (style === "visual") {
    output += `<p>📊 Visual learner: Use diagrams, color-coded notes, mind maps, and videos to understand concepts.</p>`;
  } else if (style === "auditory") {
    output += `<p>🎧 Auditory learner: Listen to recordings, explain concepts out loud, or discuss with friends.</p>`;
  } else if (style === "kinesthetic") {
    output += `<p>🧍 Kinesthetic learner: Engage with flashcards, role-play, hands-on activities, or practice problems physically.</p>`;
  } else {
    output += `<p>📚 Mixed learner: Combine multiple strategies for best results—visual aids, discussions, and hands-on practice.</p>`;
  }

  // Study Habits Recommendations
  if (takesNotes) output += `<p>📝 Take detailed notes and summarise in your own words.</p>`;
  if (groupStudy) output += `<p>👥 Study with friends occasionally to teach and explain concepts.</p>`;
  if (takesBreaks) output += `<p>⏱ Take regular breaks using the Pomodoro Technique: 25 min study, 5 min break.</p>`;
  if (activeReview) output += `<p>💡 Use active recall: quiz yourself, flashcards, or explain aloud to reinforce memory.</p>`;
  if (timeBlocking) output += `<p>📅 Plan study sessions in advance using a calendar or time-blocking method.</p>`;
  if (motivationTips) output += `<p>🔥 Motivation tip: Set small goals, reward yourself, and track progress daily.</p>`;

  // Extra Tailored Tips
  output += `<p><strong>Extra Tip:</strong> Combine Spaced Repetition, mind mapping, and consistent review for maximum retention.</p>`;
  
  document.getElementById("recommendation-output").innerHTML = output;
}

// Bind form submission
document.getElementById("recommender-form").addEventListener("submit", generateRecommendations);

// Initialize app
window.addEventListener("DOMContentLoaded", () => {
  updateTaskList();
  updateProgress();
  renderCalendarGrid();
  updateCalendarSessions();
});
