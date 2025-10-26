// --- Configuración y Estado Global ---
const BASE_URL = 'http://127.0.0.1:5000/api'; // URL del backend Flask
let state = {
    view: 'login', // login | dashboard | habits | challenges | ranking
    token: localStorage.getItem('ecoTrackToken') || null,
    user: null,
    dashboardData: null,
    challengeData: [],
    rankingData: []
};
const mockData = {
  login: { token: "mock-token-123" },
  register: { message: "User registered successfully" },
  dashboard: {
    user: { username: "MockUser", email: "mock@example.com" },
    summary: { actions: 15, points: 250, co2_saved: 12.5 },
    achievements: [
      { name: "Primer Paso", desc: "Registraste tu primer hábito", icon: "🌱" },
      { name: "Reciclador", desc: "Reciclaste 10 veces", icon: "♻️" }
    ],
    progress_chart: [
      { day: "Lun", co2: 2.1, points: 30 },
      { day: "Mar", co2: 1.8, points: 25 },
      { day: "Mié", co2: 2.5, points: 35 },
      { day: "Jue", co2: 1.2, points: 20 },
      { day: "Vie", co2: 3.0, points: 40 },
      { day: "Sáb", co2: 2.7, points: 38 },
      { day: "Dom", co2: 1.9, points: 28 }
    ]
  },
  habits: { points: 10, co2: 1.5 },
  challenges: [
    {
      id: 1,
      title: "Recicla 5 veces",
      description: "Recicla al menos 5 artículos de plástico esta semana.",
      progress: 3,
      target_value: 5,
      percentage: 60,
      completed: 0,
      reward_points: 50
    },
    {
      id: 2,
      title: "Usa transporte sostenible",
      description: "Camina o usa bicicleta para 10 viajes.",
      progress: 7,
      target_value: 10,
      percentage: 70,
      completed: 0,
      reward_points: 75
    },
    {
      id: 3,
      title: "Ahorra agua",
      description: "Toma duchas de menos de 5 minutos por 7 días.",
      progress: 5,
      target_value: 7,
      percentage: 71,
      completed: 0,
      reward_points: 60
    }
  ],
  challengesComplete: { message: "¡Reto completado! Has ganado puntos extra." },
  ranking: {
    ranking: [
      { position: 1, username: "EcoHero", points: 500, co2_saved: 25.0 },
      { position: 2, username: "GreenWarrior", points: 450, co2_saved: 22.5 },
      { position: 3, username: "PlanetSaver", points: 400, co2_saved: 20.0 },
      { position: 4, username: "EcoFriendly", points: 350, co2_saved: 17.5 },
      { position: 5, username: "MockUser", points: 250, co2_saved: 12.5 },
      { position: 6, username: "NatureLover", points: 200, co2_saved: 10.0 },
      { position: 7, username: "Sustainable", points: 150, co2_saved: 7.5 },
      { position: 8, username: "EcoAdvocate", points: 100, co2_saved: 5.0 },
      { position: 9, username: "GreenThumb", points: 50, co2_saved: 2.5 },
      { position: 10, username: "EarthGuardian", points: 25, co2_saved: 1.25 }
    ],
    personal_rank: { rank: 5, points: 250 }
  }
};

// --- Helpers de UI ---

function showModal(title, body) {
    document.getElementById('modal-title').textContent = title;
    document.getElementById('modal-body').textContent = body;
    document.getElementById('message-modal').classList.remove('hidden');
}

function hideModal() {
    document.getElementById('message-modal').classList.add('hidden');
}

function showLoading() {
    const app = document.getElementById('app');
    app.innerHTML = `
        <div class="flex items-center justify-center min-h-screen">
            <div class="flex flex-col items-center">
                <div class="animate-spin rounded-full h-16 w-16 border-b-4 border-emerald-500 mb-4"></div>
                <p class="text-xl text-emerald-600">Cargando...</p>
            </div>
        </div>
    `;
}

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    sidebar.classList.toggle('hidden');
    overlay.classList.toggle('hidden');
}

// --- Lógica de Peticiones API (Mock) ---

async function apiFetch(endpoint, method = 'GET', data = null) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock authentication check for protected endpoints
    if (endpoint !== '/login' && endpoint !== '/register' && !state.token) {
        throw new Error('No authentication token provided');
    }

    // Mock responses based on endpoint
    if (endpoint === '/login') {
        // Always allow login
        return mockData.login;
    } else if (endpoint === '/register') {
        // Always allow register
        return mockData.register;
    } else if (endpoint === '/dashboard') {
        return mockData.dashboard;
    } else if (endpoint === '/habits') {
        // For POST, update local state if needed
        if (method === 'POST') {
            // Simulate adding points to summary
            mockData.dashboard.summary.actions += 1;
            mockData.dashboard.summary.points += mockData.habits.points;
            mockData.dashboard.summary.co2_saved += mockData.habits.co2;
        }
        return mockData.habits;
    } else if (endpoint === '/challenges') {
        return mockData.challenges;
    } else if (endpoint === '/challenges/complete') {
        // Update challenge status
        const challengeId = data.challenge_id;
        const challenge = mockData.challenges.find(c => c.id === challengeId);
        if (challenge) {
            challenge.completed = 1;
            // Add reward points
            mockData.dashboard.summary.points += challenge.reward_points;
        }
        return mockData.challengesComplete;
    } else if (endpoint === '/ranking') {
        return mockData.ranking;
    } else {
        throw new Error(`Unknown endpoint: ${endpoint}`);
    }
}

// --- Funciones de Autenticación y Sesión ---

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    console.log('Attempting login with email:', email);

    try {
        // 1. Inicia sesión y obtén el token
        const loginResult = await apiFetch('/login', 'POST', { email, password });

        // 2. Guarda el token para que las siguientes peticiones estén autenticadas
        state.token = loginResult.token;
        localStorage.setItem('ecoTrackToken', state.token);
        console.log('Login exitoso. Token recibido:', state.token);

        // 3. ¡PASO CLAVE! Obtén los datos del usuario ANTES de intentar dibujar el dashboard
        const dashboardData = await apiFetch('/dashboard');
        state.user = dashboardData.user; // <-- Esta línea es la que faltaba
        console.log('User data fetched:', state.user);

        // 4. Ahora sí, con los datos del usuario cargados, renderiza el dashboard
        renderView('dashboard');

    } catch (error) {
        console.log('Login failed with error:', error.message);
        // Limpia cualquier token que se haya podido guardar si algo falló a medio camino
        state.token = null;
        localStorage.removeItem('ecoTrackToken');
        showModal('Error de Inicio', error.message);
    }
}

async function handleRegister(e) {
    e.preventDefault();
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;

    try {
        // const result = await apiFetch('/register', 'POST', { email, password });
        // Mock: Always succeed and set token
        state.token = mockData.login.token;
        localStorage.setItem('ecoTrackToken', state.token);
        state.user = mockData.dashboard.user;

        showModal('Registro Exitoso', 'Tu cuenta ha sido creada. ¡Bienvenido!');
        // Directly render dashboard after registration
        renderView('dashboard');
    } catch (error) {
        showModal('Error de Registro', error.message);
    }
}

function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('ecoTrackToken');
    renderView('login');
    showModal('Sesión Cerrada', 'Has cerrado sesión exitosamente. ¡Vuelve pronto!');
}

// --- Renderizado de Vistas ---

function renderLogin() {
    const html = `
        <div class="flex items-center justify-center min-h-screen bg-gray-50 p-4">
            <div class="card w-full max-w-md p-8 text-center">
                <h1 class="text-4xl font-bold text-emerald-600 mb-2">🌱 ECOTrack</h1>
                <p class="text-gray-500 mb-6">Registra tus hábitos ecológicos y ayuda al planeta 🌎.</p>

                <h2 id="auth-card-title" class="text-2xl font-semibold text-gray-800 mb-6">Iniciar Sesión</h2>

                <div id="login-form-container">
                    <form id="login-form" class="space-y-4">
                        <input type="email" id="login-email" placeholder="Correo electrónico" required
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">
                        <input type="password" id="login-password" placeholder="Contraseña" required
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">

                        <button type="submit" class="btn-primary w-full font-semibold">
                            Iniciar Sesión
                        </button>
                    </form>
                    <a href="#" class="text-sm text-emerald-600 hover:text-emerald-800 mt-2 block">¿Olvidaste tu contraseña?</a>
                    <button onclick="toggleAuthView('register')" class="text-sm text-gray-500 hover:text-emerald-600 mt-4 block">
                        ¿No tienes cuenta? <span class="font-semibold text-emerald-600">Regístrate</span>
                    </button>
                </div>

                <div id="register-form-container" class="hidden">
                    <form id="register-form" class="space-y-4">
                        <input type="email" id="register-email" placeholder="Correo electrónico" required
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">
                        <input type="password" id="register-password" placeholder="Contraseña (mín. 6 caracteres)" required
                               class="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">

                        <button type="submit" class="btn-primary w-full font-semibold">
                            Registrarse
                        </button>
                    </form>
                    <button onclick="toggleAuthView('login')" class="text-sm text-gray-500 hover:text-emerald-600 mt-4 block">
                        ¿Ya tienes cuenta? <span class="font-semibold text-emerald-600">Iniciar Sesión</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.getElementById('app').innerHTML = html;
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('register-form').addEventListener('submit', handleRegister);
}

function toggleAuthView(view) {
    const loginContainer = document.getElementById('login-form-container');
    const registerContainer = document.getElementById('register-form-container');
    const title = document.getElementById('auth-card-title');

    if (view === 'register') {
        title.textContent = 'Crear Cuenta';
        loginContainer.classList.add('hidden');
        registerContainer.classList.remove('hidden');
    } else {
        title.textContent = 'Iniciar Sesión';
        loginContainer.classList.remove('hidden');
        registerContainer.classList.add('hidden');
    }
}

// Renderiza el layout principal (sidebar + content)
function renderDashboardLayout() {
    if (!state.user) {
        // Esto no debería pasar si se llama correctamente, pero por seguridad
        renderView('login');
        return;
    }

    const username = state.user.username || 'Usuario';
    const today = new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' });

    const html = `
        <div class="dashboard-layout relative">
            <div id="sidebar-overlay" class="hidden fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" onclick="toggleSidebar()"></div>

            <div id="sidebar" class="sidebar p-6 flex flex-col justify-between fixed h-full z-40 hidden lg:flex lg:relative">
                <div>
                    <div class="text-3xl font-extrabold text-emerald-600 mb-8">
                        🌱 ECOTrack
                        <button class="lg:hidden absolute top-4 right-4 text-gray-500 hover:text-gray-800" onclick="toggleSidebar()">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    <nav class="space-y-2">
                        <div id="nav-dashboard" class="nav-item active" onclick="renderView('dashboard'); toggleSidebar()">
                            <span class="mr-3 text-xl">🧭</span> Panel de Usuario
                        </div>
                        <div id="nav-habits" class="nav-item" onclick="renderView('habits'); toggleSidebar()">
                            <span class="mr-3 text-xl">✍️</span> Registrar Hábito
                        </div>
                        <div id="nav-challenges" class="nav-item" onclick="renderView('challenges'); toggleSidebar()">
                            <span class="mr-3 text-xl">🏆</span> Retos Semanales
                        </div>
                        <div id="nav-ranking" class="nav-item" onclick="renderView('ranking'); toggleSidebar()">
                            <span class="mr-3 text-xl">👑</span> Ranking Comunitario
                        </div>
                    </nav>
                </div>
                <div class="pt-4 border-t border-gray-200">
                    <div class="nav-item text-red-500 hover:bg-red-50" onclick="handleLogout()">
                        <span class="mr-3 text-xl">🚪</span> Cerrar Sesión
                    </div>
                </div>
            </div>

            <div class="main-content w-full">
                <header class="flex justify-between items-center pb-6 border-b border-gray-200 mb-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div class="flex items-center space-x-4">
                        <button class="lg:hidden text-gray-500 hover:text-emerald-600" onclick="toggleSidebar()">
                            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                        <div>
                            <h2 class="text-3xl font-bold text-gray-800" id="page-title">Panel de Usuario</h2>
                            <p class="text-gray-500">${today}</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-xl text-gray-500 hover:text-emerald-600 cursor-pointer">🔔</span>
                        <span class="font-semibold text-gray-700 hidden sm:inline">Hola, ${username}!</span>
                        <div class="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 font-bold">
                            ${username.charAt(0).toUpperCase()}
                        </div>
                    </div>
                </header>

                <div id="content-view" class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    </div>
            </div>
        </div>
    `;
    document.getElementById('app').innerHTML = html;

    updateNavigationView(state.view);
}

function updateNavigationView(view) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    const activeNav = document.getElementById(`nav-${view}`);
    if (activeNav) {
        activeNav.classList.add('active');
        // Actualiza el título de la página principal
        const titles = {
            'dashboard': 'Panel de Usuario',
            'habits': 'Registrar Nuevo Hábito',
            'challenges': 'Retos Semanales',
            'ranking': 'Ranking Comunitario'
        };
        document.getElementById('page-title').textContent = titles[view] || 'ECOTrack';

        // Inyecta el contenido específico
        const contentView = document.getElementById('content-view');
        if (view === 'dashboard') renderDashboardContent(contentView);
        else if (view === 'habits') renderHabitsContent(contentView);
        else if (view === 'challenges') renderChallengesContent(contentView);
        else if (view === 'ranking') renderRankingContent(contentView);
    }
}

// --- Contenido de Vistas Específicas ---

async function renderDashboardContent(container) {
    container.innerHTML = `
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div id="summary-actions" class="card flex items-center justify-between p-6"></div>
            <div id="summary-points" class="card flex items-center justify-between p-6"></div>
            <div id="summary-co2" class="card flex items-center justify-between p-6"></div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div class="lg:col-span-2 card">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">📈 Progreso Semanal</h3>
                <div id="chart-area" class="h-64 flex items-center justify-center">
                    <canvas id="weekly-chart"></canvas>
                </div>
            </div>
            <div class="card">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">🏅 Logros Recientes</h3>
                <ul id="achievements-list" class="space-y-3"></ul>
            </div>
        </div>
    `;

    try {
        const data = await apiFetch('/dashboard');
        state.dashboardData = data; // Almacena data en el estado
        state.user = data.user; // Actualiza datos del usuario

        // 1. Renderizar Resumen
        document.getElementById('summary-actions').innerHTML = `
            <div>
                <p class="text-sm font-medium text-gray-500">Acciones Realizadas</p>
                <p class="text-3xl font-bold text-emerald-600">${data.summary.actions}</p>
            </div>
            <span class="text-4xl">✅</span>
        `;
        document.getElementById('summary-points').innerHTML = `
            <div>
                <p class="text-sm font-medium text-gray-500">Puntos Verdes</p>
                <p class="text-3xl font-bold text-emerald-600">${data.summary.points}</p>
            </div>
            <span class="text-4xl">💰</span>
        `;
        document.getElementById('summary-co2').innerHTML = `
            <div>
                <p class="text-sm font-medium text-gray-500">CO₂ Ahorrado (kg)</p>
                <p class="text-3xl font-bold text-emerald-600">${data.summary.co2_saved.toFixed(2)}</p>
            </div>
            <span class="text-4xl">🍃</span>
        `;

        // 2. Renderizar Logros
        const achievementsList = document.getElementById('achievements-list');
        achievementsList.innerHTML = data.achievements.map(a => `
            <li class="flex items-start p-3 bg-emerald-50 rounded-lg">
                <span class="text-xl mr-3">${a.icon}</span>
                <div>
                    <p class="font-semibold text-gray-800">${a.name}</p>
                    <p class="text-sm text-gray-600">${a.desc}</p>
                </div>
            </li>
        `).join('');

        // 3. Renderizar Gráfica (Usando Canvas, simplificado)
        renderWeeklyChart(data.progress_chart);

    } catch (error) {
        container.innerHTML = `<p class="text-red-500">Error al cargar el dashboard: ${error.message}. Verifica que el backend de Flask esté corriendo.</p>`;
    }
}

// Función de Mock para la gráfica (no usa librería externa)
function renderWeeklyChart(data) {
    const canvas = document.getElementById('weekly-chart');
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const labels = data.map(d => d.day);
    const co2Data = data.map(d => d.co2);
    const pointsData = data.map(d => d.points);

    // Función simplificada para dibujar la gráfica
    const drawChart = () => {
        const chartArea = document.getElementById('chart-area');
        const width = chartArea.clientWidth;
        const height = 250; // Altura fija para el ejemplo
        canvas.width = width;
        canvas.height = height;

        const padding = 30;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const barWidth = chartWidth / (labels.length * 2);

        const maxCo2 = Math.max(...co2Data);
        const maxPoints = Math.max(...pointsData);

        ctx.clearRect(0, 0, width, height);

        // Ejes
        ctx.strokeStyle = '#E5E7EB';
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();

        // Dibujar barras y etiquetas
        labels.forEach((label, i) => {
            const x = padding + i * (barWidth * 2 + barWidth) + barWidth / 2;

            // Barra CO2 (Verde)
            const co2Height = (co2Data[i] / maxCo2) * chartHeight * 0.9;
            ctx.fillStyle = '#10B981'; // Esmeralda 500
            ctx.fillRect(x, height - padding - co2Height, barWidth, co2Height);

            // Barra Puntos (Azul-Verde) - Mocked to be slightly different
            const pointsHeight = (pointsData[i] / maxPoints) * chartHeight * 0.9;
            ctx.fillStyle = '#34D399'; // Esmeralda 400
            ctx.fillRect(x + barWidth, height - padding - pointsHeight, barWidth, pointsHeight);

            // Etiqueta del día
            ctx.fillStyle = '#4B5563';
            ctx.textAlign = 'center';
            ctx.fillText(label, x + barWidth, height - padding + 15);
        });

        // Leyenda (simplificada)
        ctx.fillStyle = '#10B981';
        ctx.fillRect(width - 100, 10, 10, 10);
        ctx.fillStyle = '#4B5563';
        ctx.textAlign = 'left';
        ctx.fillText('CO₂ Ahorrado', width - 85, 20);

        ctx.fillStyle = '#34D399';
        ctx.fillRect(width - 100, 30, 10, 10);
        ctx.fillStyle = '#4B5563';
        ctx.fillText('Puntos', width - 85, 40);
    };

    drawChart();
    window.addEventListener('resize', drawChart);
}

async function handleHabitRegistration(e) {
    e.preventDefault();
    const form = e.target;
    const action = form.elements['action'].value;
    const notes = form.elements['notes'].value;
    const date = form.elements['date'].value;

    if (!action) {
        showModal('Error de Formulario', 'Por favor, selecciona una acción ecológica.');
        return;
    }

    try {
        const result = await apiFetch('/habits', 'POST', { action, notes, date });

        showModal('Hábito Registrado', `¡Hábito "${action}" registrado! Ganaste ${result.points} puntos y ahorraste ${result.co2.toFixed(2)} kg de CO₂.`);
        form.reset();
        // Opcional: Recargar dashboard para ver el impacto
        // renderView('dashboard');
    } catch (error) {
        showModal('Error al Guardar', error.message);
    }
}

function renderHabitsContent(container) {
    const today = new Date().toISOString().split('T')[0];
    container.innerHTML = `
        <div class="card w-full lg:max-w-3xl mx-auto p-8">
            <h3 class="text-2xl font-bold text-gray-800 mb-6">✍️ Registrar Nuevo Hábito</h3>
            <p class="text-gray-600 mb-6">Selecciona la acción ecológica que realizaste para sumar puntos y reducir tu huella de carbono.</p>

            <form id="habit-form" class="space-y-6">
                <div>
                    <label for="action" class="block text-sm font-medium text-gray-700 mb-1">Acción Ecológica</label>
                    <select id="action" name="action" required
                            class="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 bg-white">
                        <option value="" disabled selected>Selecciona un hábito...</option>
                        <option value="Reciclar plástico">Reciclar plástico</option>
                        <option value="Usar bicicleta">Usar bicicleta / Caminar</option>
                        <option value="Ahorro de agua">Ducha corta / Ahorro de agua</option>
                        <option value="Comprar a granel">Comprar a granel / Local</option>
                        <option value="Apagar luces">Apagar luces / Desconectar</option>
                        <option value="Otro">Otra acción positiva</option>
                    </select>
                </div>

                <div>
                    <label for="date" class="block text-sm font-medium text-gray-700 mb-1">Fecha de la Acción</label>
                    <input type="date" id="date" name="date" value="${today}" max="${today}" required
                           class="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500">
                </div>

                <div>
                    <label for="notes" class="block text-sm font-medium text-gray-700 mb-1">Notas/Comentarios (Opcional)</label>
                    <textarea id="notes" name="notes" rows="3" placeholder="Ej: Reciclé 5 botellas de PET."
                              class="w-full p-3 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500"></textarea>
                </div>

                <button type="submit" class="btn-primary w-full font-semibold text-lg">
                    Guardar Hábito
                </button>
            </form>

            <p class="mt-4 text-center text-xs text-gray-400">
                Este registro se sincronizará cuando haya conexión (Mock para modo offline).
            </p>
        </div>
    `;
    document.getElementById('habit-form').addEventListener('submit', handleHabitRegistration);
}

async function handleChallengeCompletion(challengeId) {
    try {
        const result = await apiFetch('/challenges/complete', 'POST', { challenge_id: challengeId });
        showModal('¡Reto Terminado!', result.message);
        // Recargar vista para reflejar el cambio
        renderView('challenges');
    } catch (error) {
        showModal('Error', error.message);
    }
}

async function renderChallengesContent(container) {
    container.innerHTML = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="challenges-grid"></div>`;
    const challengesGrid = document.getElementById('challenges-grid');

    try {
        const data = await apiFetch('/challenges');
        state.challengeData = data;

        challengesGrid.innerHTML = data.map(challenge => {
            const isCompleted = challenge.completed === 1;
            const progressText = `${challenge.progress} de ${challenge.target_value} veces`;

            let buttonHtml = '';
            if (isCompleted) {
                buttonHtml = `<span class="inline-block px-3 py-1 text-sm font-semibold text-white bg-green-500 rounded-full">Completado 🎉</span>`;
            } else if (challenge.progress >= challenge.target_value) {
                 buttonHtml = `<button onclick="handleChallengeCompletion(${challenge.id})" class="btn-primary w-full text-sm">Marcar como Completado</button>`;
            } else {
                buttonHtml = `<span class="inline-block px-3 py-1 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full">En Progreso</span>`;
            }

            return `
                <div class="card p-6 border-l-4 ${isCompleted ? 'border-green-500' : 'border-emerald-500'}">
                    <h4 class="text-xl font-bold text-gray-800 mb-2">${challenge.title}</h4>
                    <p class="text-gray-600 text-sm mb-4">${challenge.description}</p>

                    <div class="mb-4">
                        <p class="text-sm font-medium text-gray-700 mb-1">${progressText}</p>
                        <div class="w-full bg-gray-200 rounded-full h-2.5">
                            <div class="h-2.5 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-emerald-500'}" 
                                 style="width: ${challenge.percentage}%"></div>
                        </div>
                    </div>

                    <div class="flex justify-between items-center pt-3 border-t border-gray-100">
                        <span class="text-sm font-semibold text-yellow-600">
                            Recompensa: ${challenge.reward_points} Puntos
                        </span>
                        ${buttonHtml}
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        challengesGrid.innerHTML = `<p class="text-red-500">Error al cargar los retos: ${error.message}</p>`;
    }
}

async function renderRankingContent(container) {
    container.innerHTML = `
        <div class="card p-8">
            <div class="flex justify-between items-center mb-6">
                <h3 class="text-2xl font-bold text-gray-800">👑 Ranking Comunitario</h3>
                <div id="personal-rank-indicator" class="px-4 py-2 bg-blue-100 text-blue-800 font-semibold rounded-lg shadow">
                    Cargando posición personal...
                </div>
            </div>

            <div class="mb-4 flex space-x-4">
                <input type="text" id="ranking-search" placeholder="Buscar usuario..." onkeyup="filterRanking()"
                       class="p-2 border border-gray-300 rounded-lg w-full max-w-xs focus:ring-emerald-500 focus:border-emerald-500">
                <select id="ranking-filter" onchange="filterRanking()"
                        class="p-2 border border-gray-300 rounded-lg bg-white">
                    <option value="global">Ranking Global</option>
                    <option value="weekly">Ranking Semanal (Mock)</option>
                </select>
            </div>

            <div class="overflow-x-auto rounded-lg border border-gray-200">
                <table class="ranking-table min-w-full divide-y divide-gray-200">
                    <thead>
                        <tr class="bg-gray-50">
                            <th>Posición</th>
                            <th>Usuario</th>
                            <th>Puntos Verdes</th>
                            <th>CO₂ Ahorrado (kg)</th>
                        </tr>
                    </thead>
                    <tbody id="ranking-body" class="divide-y divide-gray-200">
                        </tbody>
                </table>
            </div>
        </div>
    `;

    try {
        const data = await apiFetch('/ranking');
        state.rankingData = data.ranking;
        renderRankingTable(data.ranking);

        const personalRankDiv = document.getElementById('personal-rank-indicator');
        if (data.personal_rank) {
            personalRankDiv.innerHTML = `
                Tu posición: <span class="text-xl">${data.personal_rank.rank}</span> con ${data.personal_rank.points} Pts.
            `;
        } else {
             personalRankDiv.textContent = 'Tu posición no está en el Top 100.';
        }

    } catch (error) {
        container.innerHTML = `<p class="text-red-500">Error al cargar el ranking: ${error.message}</p>`;
    }
}

function renderRankingTable(ranking) {
    const rankingBody = document.getElementById('ranking-body');
    const userId = state.user ? state.user.username : ''; // Usar el username como identificador en este ejemplo

    rankingBody.innerHTML = ranking.map(user => {
        let rowClass = '';
        let medal = '';
        if (user.position === 1) {
            rowClass = 'gold'; medal = '🥇';
        } else if (user.position === 2) {
            rowClass = 'silver'; medal = '🥈';
        } else if (user.position === 3) {
            rowClass = 'bronze'; medal = '🥉';
        }

        // Destacar la fila del usuario actual
        if (user.username === userId) {
            rowClass += ' !bg-emerald-100 border-2 border-emerald-500';
        }

        return `
            <tr class="${rowClass}">
                <td class="font-semibold text-lg">${medal} ${user.position}</td>
                <td class="${user.username === userId ? 'font-bold text-emerald-800' : ''}">${user.username}</td>
                <td class="font-mono">${user.points}</td>
                <td class="font-mono">${user.co2_saved.toFixed(2)}</td>
            </tr>
        `;
    }).join('');
}

function filterRanking() {
    const query = document.getElementById('ranking-search').value.toLowerCase();
    // Filtro simple por nombre de usuario
    const filtered = state.rankingData.filter(user =>
        user.username.toLowerCase().includes(query)
    );
    renderRankingTable(filtered);
}

// --- Router y Función de Control Principal ---

async function checkAuthAndRender() {
    console.log('Checking auth on page load. Token present:', !!state.token);
    if (state.token) {
        console.log('Token found, validating...');
        // Intenta obtener datos del dashboard para validar el token
        try {
            const data = await apiFetch('/dashboard');
            state.user = data.user;
            console.log('Token valid, rendering dashboard');
            renderDashboardLayout();
            // Por defecto, va al dashboard
            renderView('dashboard');
        } catch (error) {
            console.log('Token validation failed:', error.message);
            // Si falla (token inválido/expirado), va al login
            showModal('Sesión Caducada', 'Tu sesión ha caducado o es inválida. Por favor, inicia sesión de nuevo.');
            handleLogout();
        }
    } else {
        console.log('No token found, rendering login');
        renderView('login');
    }
}

function renderView(viewName) {
    state.view = viewName;
    if (viewName === 'login' || viewName === 'register') {
        renderLogin();
    } else {
        // Asegura que el layout de dashboard esté cargado antes de actualizar la sub-vista
        if (document.getElementById('app').innerHTML.indexOf('sidebar') === -1 || !state.user) {
            renderDashboardLayout();
        } else {
            updateNavigationView(viewName);
        }
    }
}

// --- Custom Title Bar Functionality ---

function initCustomTitleBar() {
    const titleBar = document.getElementById('custom-title-bar');
    if (!titleBar) return;

    // Tooltip Icon
    document.getElementById('tooltip-icon').addEventListener('click', () => {
        showModal('Información de ECOTrack',
            'ECOTrack es una aplicación para registrar tus hábitos ecológicos y ayudar al planeta. ' +
            'Registra acciones como reciclar, usar bicicleta o ahorrar agua para ganar puntos y reducir tu huella de carbono.');
    });

    // Hide Title Bar
    let titleBarHidden = false;
    document.getElementById('hide-title-bar').addEventListener('click', () => {
        titleBarHidden = !titleBarHidden;
        titleBar.classList.toggle('hidden', titleBarHidden);
        const btn = document.getElementById('hide-title-bar');
        btn.title = titleBarHidden ? 'Mostrar barra de título' : 'Ocultar barra de título';
        btn.setAttribute('aria-label', titleBarHidden ? 'Mostrar barra de título' : 'Ocultar barra de título');
        // Update icon
        btn.innerHTML = titleBarHidden ?
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" /></svg>' :
            '<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" /></svg>';
    });

    // Settings Dropdown
    const settingsBtn = document.getElementById('settings-btn');
    const settingsDropdown = document.getElementById('settings-dropdown');
    settingsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        settingsDropdown.classList.toggle('hidden');
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
        settingsDropdown.classList.add('hidden');
    });

    // Settings menu items (placeholders)
    settingsDropdown.addEventListener('click', (e) => {
        e.stopPropagation();
        const action = e.target.textContent.toLowerCase();
        switch(action) {
            case 'perfil':
                showModal('Perfil', 'Funcionalidad de perfil próximamente disponible.');
                break;
            case 'notificaciones':
                showModal('Notificaciones', 'Configuración de notificaciones próximamente disponible.');
                break;
            case 'tema':
                showModal('Tema', 'Cambio de tema próximamente disponible.');
                break;
            case 'ayuda':
                showModal('Ayuda', 'Centro de ayuda próximamente disponible.');
                break;
        }
        settingsDropdown.classList.add('hidden');
    });

    // Minimize Button
    document.getElementById('minimize-btn').addEventListener('click', () => {
        if (navigator.windowControlsOverlay && navigator.windowControlsOverlay.visible) {
            // In PWA with overlay, simulate minimize
            showModal('Minimizar', 'Función de minimizar no disponible en modo PWA. Usa los controles del navegador.');
        } else if (window.electronAPI) {
            // For Electron apps
            window.electronAPI.minimizeWindow();
        } else {
            showModal('Minimizar', 'Esta función requiere un entorno de escritorio nativo.');
        }
    });

    // Restore Button
    let isMaximized = false;
    document.getElementById('restore-btn').addEventListener('click', () => {
        if (navigator.windowControlsOverlay && navigator.windowControlsOverlay.visible) {
            // In PWA with overlay, simulate restore/maximize
            showModal('Restaurar', 'Función de restaurar no disponible en modo PWA. Usa los controles del navegador.');
        } else if (window.electronAPI) {
            if (isMaximized) {
                window.electronAPI.restoreWindow();
            } else {
                window.electronAPI.maximizeWindow();
            }
            isMaximized = !isMaximized;
        } else {
            showModal('Restaurar', 'Esta función requiere un entorno de escritorio nativo.');
        }
    });

    // Close Button
    document.getElementById('close-btn').addEventListener('click', () => {
        if (navigator.windowControlsOverlay && navigator.windowControlsOverlay.visible) {
            // In PWA with overlay, simulate close
            if (confirm('¿Estás seguro de que quieres cerrar la aplicación?')) {
                window.close();
            }
        } else if (window.electronAPI) {
            window.electronAPI.closeWindow();
        } else {
            showModal('Cerrar', 'Esta función requiere un entorno de escritorio nativo.');
        }
    });

    // Handle window controls overlay changes
    if ('windowControlsOverlay' in navigator) {
        navigator.windowControlsOverlay.addEventListener('geometrychange', () => {
            // Title bar will automatically adjust via CSS env() variables
            console.log('Window controls overlay geometry changed');
        });
    }
}

// Inicialización al cargar la página
window.onload = () => {
    showLoading(); // Muestra el indicador mientras se comprueba la sesión
    checkAuthAndRender();
    initCustomTitleBar(); // Inicializar la barra de título personalizada
};

// Registro del Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('Service Worker registrado con éxito:', registration.scope);
            })
            .catch(error => {
                console.log('Error al registrar el Service Worker:', error);
            });
    });
}