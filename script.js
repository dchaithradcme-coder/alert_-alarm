window.onload = () => {
  // Request notification permission
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission().then(permission => {
      if (permission !== 'granted') {
        alert('Notifications are blocked. Reminders may not work.');
      }
    });
  }

  // Register service worker and subscribe for push
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').then(reg => {
      console.log('Service Worker registered');

      navigator.serviceWorker.ready.then(reg => {
        return reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array('BD032gsJ_zPYJpno8hxZKg-3JgBZZVuUtelXW9JaCEZLN4mBJ_-ge_KRzrTzcBFphfPjORMFdL3sPpaKZhlKvdY')
        });
      }).then(subscription => {
        fetch('http://localhost:3000/subscribe', {
          method: 'POST',
          body: JSON.stringify(subscription),
          headers: { 'Content-Type': 'application/json' }
        });
      }).catch(err => console.error('Push subscription error:', err));
    });
  }

  // Load saved tasks from backend
  loadTasksFromBackend();
};

function addTask() {
  const taskInput = document.getElementById('taskInput');
  const dateInput = document.getElementById('dateInput');
  const hourInput = document.getElementById('hourInput');
  const minuteInput = document.getElementById('minuteInput');
  const ampmInput = document.getElementById('ampmInput');
  const repeatInput = document.getElementById('repeatInput');

  const taskTitle = taskInput.value.trim();
  const dateValue = dateInput.value;
  const hour = parseInt(hourInput.value);
  const minute = parseInt(minuteInput.value);
  const ampm = ampmInput.value;
  const repeat = repeatInput.value;

  if (!taskTitle || !dateValue || isNaN(hour) || isNaN(minute)) {
    alert('Please enter a valid task, date, and time.');
    return;
  }

  let adjustedHour = hour;
  if (ampm === 'PM' && hour < 12) adjustedHour += 12;
  if (ampm === 'AM' && hour === 12) adjustedHour = 0;

  const [year, month, day] = dateValue.split('-').map(Number);
  const reminderTime = new Date(year, month - 1, day, adjustedHour, minute);

  if (reminderTime <= new Date()) {
    alert('Reminder time must be in the future.');
    return;
  }

  const formattedTime = reminderTime.toLocaleString('en-US', {
    hour: 'numeric',
    minute: 'numeric',
    hour12: true,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });

  const li = document.createElement('li');
  li.textContent = `${taskTitle} - Reminder at ${formattedTime} (${repeat})`;
  document.getElementById('taskList').appendChild(li);

  scheduleLocalReminder(taskTitle, reminderTime);
  saveTaskToBackend(taskTitle, dateValue, hour, minute, ampm, repeat);

  taskInput.value = '';
  dateInput.value = '';
  hourInput.value = '';
  minuteInput.value = '';
  ampmInput.value = 'AM';
  repeatInput.value = 'none';
}

function scheduleLocalReminder(taskTitle, reminderTime) {
  const delay = reminderTime - new Date();
  if (delay > 0) {
    setTimeout(() => {
      const audio = new Audio('https://www.soundjay.com/button/beep-07.wav');
      audio.play();

      const utterance = new SpeechSynthesisUtterance(`Reminder: ${taskTitle}`);
      speechSynthesis.speak(utterance);

      if (Notification.permission === 'granted') {
        new Notification('🔔 Task Reminder', {
          body: `Time to: ${taskTitle}`,
          icon: 'https://via.placeholder.com/100'
        });
      } else {
        alert(`Reminder: ${taskTitle}`);
      }
    }, delay);
  }
}

function saveTaskToBackend(title, date, hour, minute, ampm, repeat) {
  fetch('http://localhost:3000/add-task', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title, date, hour, minute, ampm, repeat })
  }).then(res => res.json())
    .then(data => {
      console.log(data.message);
      alert('Task saved successfully!');
    })
    .catch(err => console.error('Error saving task:', err));
}

function loadTasksFromBackend() {
  fetch('http://localhost:3000/tasks')
    .then(res => res.json())
    .then(tasks => {
      const list = document.getElementById('taskList');
      list.innerHTML = '';
      tasks.forEach(task => {
        const li = document.createElement('li');
        li.textContent = `${task.title} - ${task.date} ${task.hour}:${task.minute} ${task.ampm} (${task.repeat})`;
        list.appendChild(li);
      });
    })
    .catch(err => console.error('Error loading tasks:', err));
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}