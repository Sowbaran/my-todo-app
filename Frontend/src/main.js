import './style.css';

const API_URL = 'http://localhost:3000/api';

// DOM Elements
const app = document.getElementById('app');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const todoForm = document.getElementById('todo-form');
const todoList = document.getElementById('todo-list');
const logoutBtn = document.getElementById('logout-btn');
const addTodoBtn = document.getElementById('add-todo-btn');
const todoModal = document.getElementById('todo-modal');
const closeModalBtn = document.getElementById('cancel-modal');
const modalBackdrop = document.getElementById('modal-backdrop');
const modalTitle = document.getElementById('modal-title');
const todoIdInput = document.getElementById('todo-id');
const todoTitleInput = document.getElementById('todo-title');
const todoDescInput = document.getElementById('todo-desc');

// Auth Helpers
const getToken = () => localStorage.getItem('token');
const setToken = (token) => localStorage.setItem('token', token);
const removeToken = () => localStorage.removeItem('token');
const isAuthenticated = () => !!getToken();

// Navigation Guard
const checkAuth = () => {
  const path = window.location.pathname;
  const isAuthPage = path.includes('login.html') || path.includes('register.html') || path === '/' || path.includes('index.html');
  const isDashboard = path.includes('dashboard.html');

  if (isAuthenticated() && isAuthPage) {
    window.location.href = '/dashboard.html';
  } else if (!isAuthenticated() && isDashboard) {
    window.location.href = '/login.html';
  }
};

// Custom Dialog
const createDialog = () => {
  if (document.getElementById('custom-dialog')) return;

  const dialogHTML = `
    <div id="custom-dialog" class="fixed inset-0 z-[60] flex items-center justify-center p-4 opacity-0 pointer-events-none transition-opacity duration-300" aria-hidden="true">
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" id="dialog-backdrop"></div>
        <div class="relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform scale-95 transition-transform duration-300" id="dialog-panel">
            <h3 id="dialog-title" class="text-lg font-bold text-slate-900 dark:text-white mb-2">Notification</h3>
            <p id="dialog-message" class="text-slate-600 dark:text-slate-300 mb-6 text-sm leading-relaxed">Message goes here...</p>
            <div class="flex justify-end gap-3" id="dialog-actions">
                <!-- Buttons injected here -->
            </div>
        </div>
    </div>
    `;
  document.body.insertAdjacentHTML('beforeend', dialogHTML);
};

const showDialog = (message, type = 'alert', onConfirm = null) => {
  createDialog();
  const dialog = document.getElementById('custom-dialog');
  const panel = document.getElementById('dialog-panel');
  const title = document.getElementById('dialog-title');
  const msg = document.getElementById('dialog-message');
  const actions = document.getElementById('dialog-actions');

  // Reset state
  dialog.classList.remove('opacity-0', 'pointer-events-none');
  panel.classList.remove('scale-95');
  panel.classList.add('scale-100');

  msg.textContent = message;
  actions.innerHTML = '';

  const close = () => {
    dialog.classList.add('opacity-0', 'pointer-events-none');
    panel.classList.add('scale-95');
    panel.classList.remove('scale-100');
  };

  if (type === 'confirm') {
    title.textContent = 'Confirm Action';

    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'px-4 py-2 rounded-xl text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors font-medium text-sm';
    cancelBtn.textContent = 'Cancel';
    cancelBtn.onclick = close;

    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'px-4 py-2 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 border border-red-500/20 transition-colors font-medium text-sm';
    confirmBtn.textContent = 'Confirm';
    confirmBtn.onclick = () => {
      if (onConfirm) onConfirm();
      close();
    };

    actions.appendChild(cancelBtn);
    actions.appendChild(confirmBtn);
  } else {
    title.textContent = 'Notification';

    const okBtn = document.createElement('button');
    okBtn.className = 'px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors font-medium text-sm shadow-lg shadow-indigo-500/20';
    okBtn.textContent = 'Okay';
    okBtn.onclick = () => {
      if (onConfirm) onConfirm();
      close();
    };

    actions.appendChild(okBtn);
  }
};

// API Handling
const apiCall = async (endpoint, method = 'GET', body = null) => {
  const headers = { 'Content-Type': 'application/json' };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Something went wrong');
    return data;
  } catch (error) {
    showDialog(error.message, 'alert');
    throw error;
  }
};

// Auth Actions
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;
    try {
      const data = await apiCall('/users/login', 'POST', { username, password });
      setToken(data.token);
      window.location.href = '/dashboard.html';
    } catch (error) {
      console.error(error);
    }
  });
}

if (registerForm) {
  registerForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = registerForm.username.value;
    const password = registerForm.password.value;
    try {
      await apiCall('/users/register', 'POST', { username, password });
      showDialog('Registration successful! Please login.', 'alert', () => {
        window.location.href = '/login.html';
      });
    } catch (error) {
      console.error(error);
    }
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', () => {
    removeToken();
    window.location.href = '/login.html';
  });
}

// Dashboard Logic
const renderTodos = async () => {
  if (!todoList) return;
  todoList.innerHTML = '<div class="col-span-full text-center py-20 text-slate-500">Loading tasks...</div>';

  try {
    const todos = await apiCall('/todos');
    todoList.innerHTML = '';

    if (todos.length === 0) {
      todoList.innerHTML = `
                <div class="col-span-full text-center py-20">
                    <div class="w-16 h-16 bg-slate-100 dark:bg-slate-800/50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg class="w-8 h-8 text-slate-400 dark:text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 class="text-xl font-medium text-slate-900 dark:text-white mb-2">All caught up!</h3>
                    <p class="text-slate-500 dark:text-slate-400">You have no tasks pending.</p>
                </div>
            `;
      return;
    }

    todos.forEach(todo => {
      const card = document.createElement('div');
      card.className = 'glass-panel p-6 hover:translate-y-[-2px] transition-transform duration-300 relative group';
      card.innerHTML = `
                <div class="flex justify-between items-start mb-4">
                    <div class="flex-1">
                        <h3 class="text-lg font-semibold text-slate-900 dark:text-white mb-1 ${todo.completed ? 'line-through text-slate-400 dark:text-slate-500' : ''}">${todo.title}</h3>
                        <p class="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">${todo.description || 'No description'}</p>
                    </div>
                    <button class="text-slate-400 hover:text-red-500 transition-colors ml-2 p-1 delete-btn" data-id="${todo._id}">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
                <div class="flex justify-between items-center mt-4 border-t border-slate-200 dark:border-white/5 pt-4">
                    <span class="text-xs text-slate-500">${new Date(todo.createdAt).toLocaleDateString()}</span>
                    <div class="flex gap-2">
                        <button class="bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 text-xs px-3 py-1 rounded-full transition-colors toggle-btn" data-id="${todo._id}" data-completed="${todo.completed}">
                            ${todo.completed ? 'Mark Active' : 'Mark Complete'}
                        </button>
                        <button class="bg-slate-200/50 dark:bg-slate-700/30 hover:bg-slate-200 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300 text-xs px-3 py-1 rounded-full transition-colors edit-btn" data-id="${todo._id}">
                            Edit
                        </button>
                    </div>
                </div>
            `;
      todoList.appendChild(card);
    });

    // Attach listeners
    document.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => deleteTodo(e.currentTarget.dataset.id));
    });
    document.querySelectorAll('.toggle-btn').forEach(btn => {
      btn.addEventListener('click', (e) => toggleTodo(e.currentTarget.dataset.id, e.currentTarget.dataset.completed === 'true'));
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
      btn.addEventListener('click', (e) => openModal(e.currentTarget.dataset.id));
    });

  } catch (error) {
    console.error("Failed to load todos:", error);
  }
};

// Todo Actions
const createTodo = async (title, description) => {
  try {
    await apiCall('/todos', 'POST', { title, description });
    closeModal();
    renderTodos();
  } catch (error) {
    console.error(error);
  }
};

const updateTodo = async (id, title, description) => {
  try {
    await apiCall(`/todos/${id}`, 'PUT', { title, description });
    closeModal();
    renderTodos();
  } catch (error) {
    console.error(error);
  }
};

const deleteTodo = async (id) => {
  showDialog('Are you sure you want to delete this task?', 'confirm', async () => {
    try {
      await apiCall(`/todos/${id}`, 'DELETE');
      renderTodos();
    } catch (error) {
      console.error(error);
    }
  });
};

const toggleTodo = async (id, isCompleted) => {
  // We need to fetch the existing todo first because the update endpoint might require title/desc
  // But the API might support partial updates if using PATCH, unfortunately api uses PUT
  // Let's assume PUT needs all fields or the backend handles partials?
  // Looking at backend `updateTodo`:
  // const { title, description, completed } = req.body;
  // const todo = await Todo.findByIdAndUpdate(req.params.id, { title, description, completed }, { new: true });
  // It updates ALL fields that are passed. So if I only pass `completed`, others might be undefined if not handled?
  // Wait, Mongoose `findByIdAndUpdate` with an object updates only the fields in that object unless the object overwrite semantics are used.
  // However, if the controller destructures `title` and it is undefined, then `{ title: undefined }` is passed. Use caution.

  // Let's fetch the todo first to be safe.
  try {
    const todo = await apiCall(`/todos/${id}`);
    await apiCall(`/todos/${id}`, 'PUT', {
      title: todo.title,
      description: todo.description,
      completed: !isCompleted
    });
    renderTodos();
  } catch (error) {
    console.error(error);
  }
};

// Modal Logic
const openModal = async (id = null) => {
  todoModal.classList.remove('hidden');
  // Force reflow
  void todoModal.offsetWidth;
  todoModal.classList.add('active');

  if (id) {
    modalTitle.textContent = 'Edit Task';
    todoIdInput.value = id;
    try {
      const todo = await apiCall(`/todos/${id}`);
      todoTitleInput.value = todo.title;
      todoDescInput.value = todo.description || '';
    } catch (error) {
      console.error(error);
    }
  } else {
    modalTitle.textContent = 'Add New Task';
    todoIdInput.value = '';
    todoForm.reset();
  }
};

const closeModal = () => {
  todoModal.classList.remove('active');
  setTimeout(() => {
    todoModal.classList.add('hidden');
  }, 300);
};

if (addTodoBtn) {
  addTodoBtn.addEventListener('click', () => openModal());
}

if (closeModalBtn) {
  closeModalBtn.addEventListener('click', closeModal);
}

if (modalBackdrop) {
  modalBackdrop.addEventListener('click', closeModal);
}

if (todoForm) {
  todoForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = todoIdInput.value;
    const title = todoTitleInput.value;
    const description = todoDescInput.value;

    if (id) {
      updateTodo(id, title, description);
    } else {
      createTodo(title, description);
    }
  });
}

// Theme Logic
const initTheme = () => {
  const themeBtn = document.createElement('button');
  themeBtn.id = 'theme-toggle';
  themeBtn.className = 'fixed bottom-6 right-6 z-50 p-3 rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-110 transition-all duration-300';
  themeBtn.innerHTML = `
        <svg id="sun-icon" class="w-6 h-6 hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
        <svg id="moon-icon" class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
    `;
  document.body.appendChild(themeBtn);

  const sunIcon = document.getElementById('sun-icon');
  const moonIcon = document.getElementById('moon-icon');

  // Check preference
  const savedTheme = localStorage.getItem('theme');
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // Default to dark if no preference or if system is dark
  // The current design is dark-first, so let's default to dark.
  if (savedTheme === 'light') {
    document.documentElement.classList.remove('dark');
    sunIcon.classList.remove('hidden');
    moonIcon.classList.add('hidden');
  } else {
    document.documentElement.classList.add('dark');
    moonIcon.classList.remove('hidden');
    sunIcon.classList.add('hidden');
  }

  themeBtn.addEventListener('click', () => {
    const isDark = document.documentElement.classList.contains('dark');
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      sunIcon.classList.remove('hidden');
      moonIcon.classList.add('hidden');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      moonIcon.classList.remove('hidden');
      sunIcon.classList.add('hidden');
    }
  });
};

// Init
window.addEventListener('load', () => {
  initTheme();
  checkAuth();
  if (window.location.pathname.includes('dashboard.html')) {
    renderTodos();
  }
});
