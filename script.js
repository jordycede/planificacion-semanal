// Configuración inicial
const timeSlots = [
    '6:00 - 7:30',
    '7:30 - 9:00',
    '9:00 - 10:30',
    '10:30 - 12:00',
    '12:00 - 13:30',
    '13:30 - 15:00',
    '15:00 - 16:30',
    '16:30 - 18:00',
    '18:00 - 19:30',
    '19:30 - 21:00',
    '21:00 - 22:30',
    '22:30 - 12:00'
];

// Credenciales de administrador
const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '123'
};

// Variables de estado
let currentDate = new Date();
let selectedCell = null;
let isAdmin = false;
const storageKey = 'weeklyPlannerData_v4';

// Elementos del DOM
const loginModal = document.getElementById('login-modal');
const adminBar = document.getElementById('admin-bar');
const adminLoginBtn = document.getElementById('admin-login-btn');
const logoutBtn = document.getElementById('logout-btn');
const usernameInput = document.getElementById('username');
const passwordInput = document.getElementById('password');
const loginBtn = document.getElementById('login-btn');
const cancelLoginBtn = document.getElementById('cancel-login');
const loginError = document.getElementById('login-error');

const scheduleTable = document.getElementById('schedule-table');
const tbody = scheduleTable.querySelector('tbody');
const weekRangeElement = document.getElementById('week-range');
const prevWeekBtn = document.getElementById('prev-week');
const nextWeekBtn = document.getElementById('next-week');
const eventModal = document.getElementById('event-modal');
const eventText = document.getElementById('event-text');
const saveEventBtn = document.getElementById('save-event');
const cancelEventBtn = document.getElementById('cancel-event');
const closeModalBtn = document.getElementById('close-modal');
const modalTitle = document.getElementById('modal-title');

// Inicializar la tabla
function initializeTable() {
    tbody.innerHTML = '';
    
    timeSlots.forEach(timeSlot => {
        const row = document.createElement('tr');
        const timeCell = document.createElement('td');
        timeCell.textContent = timeSlot;
        timeCell.className = 'time-cell';
        row.appendChild(timeCell);
        
        for (let i = 0; i < 7; i++) {
            const cell = document.createElement('td');
            cell.className = 'editable';
            cell.dataset.day = i;
            cell.dataset.time = timeSlot;
            row.appendChild(cell);
        }
        
        tbody.appendChild(row);
    });
    
    updateWeekDates();
    loadEvents();
    setupEventListeners();
    setupResponsiveBehavior();
    
    // Aplicar modo admin si está activo
    if (isAdmin) {
        document.body.classList.add('admin-mode');
        adminBar.style.display = 'flex';
        adminLoginBtn.style.display = 'none';
    } else {
        document.body.classList.remove('admin-mode');
        adminBar.style.display = 'none';
        adminLoginBtn.style.display = 'block';
    }
}

// Configurar comportamiento responsive
function setupResponsiveBehavior() {
    const adjustCellHeights = () => {
        const cells = document.querySelectorAll('td:not(.time-cell)');
        const baseHeight = window.innerWidth < 768 ? 50 : 60;
        
        cells.forEach(cell => {
            cell.style.height = `${baseHeight}px`;
            cell.style.minHeight = `${baseHeight}px`;
        });
    };
    
    adjustCellHeights();
    window.addEventListener('resize', adjustCellHeights);
    
    // Mejorar desplazamiento táctil
    if ('ontouchstart' in window) {
        let startX;
        const tableContainer = document.querySelector('.table-container');
        
        tableContainer.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
        }, { passive: true });
        
        tableContainer.addEventListener('touchmove', (e) => {
            if (Math.abs(e.touches[0].clientX - startX) > 10) {
                e.preventDefault();
            }
        }, { passive: false });
    }
}

// Actualizar las fechas de la semana mostrada
function updateWeekDates() {
    const weekStart = getWeekStart(currentDate);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    
    weekRangeElement.textContent = `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
    
    for (let i = 0; i < 7; i++) {
        const dayDate = new Date(weekStart);
        dayDate.setDate(dayDate.getDate() + i);
        
        const dayElement = document.getElementById(`day-${i}`);
        const dateSpan = dayElement.querySelector('.date');
        dateSpan.textContent = formatDate(dayDate, true);
        
        dayElement.dataset.fullDate = formatDate(dayDate, false, true);
    }
    
    // Deshabilitar botón de semana anterior si estamos en la semana actual
    const today = new Date();
    const currentWeekStart = getWeekStart(today);
    prevWeekBtn.disabled = formatDate(weekStart) === formatDate(currentWeekStart);
}

// Obtener el inicio de la semana (lunes)
function getWeekStart(date) {
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    const weekStart = new Date(date);
    weekStart.setDate(diff);
    weekStart.setHours(0, 0, 0, 0);
    return weekStart;
}

// Formatear fecha
function formatDate(date, short = false, iso = false) {
    if (iso) {
        return date.toISOString().split('T')[0];
    }
    
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    
    if (short) return `${day}/${month}`;
    
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Cargar eventos desde localStorage
function loadEvents() {
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) return;
    
    try {
        const events = JSON.parse(savedData);
        
        document.querySelectorAll('.editable').forEach(cell => {
            const dayIndex = parseInt(cell.dataset.day);
            const timeSlot = cell.dataset.time;
            const dayElement = document.getElementById(`day-${dayIndex}`);
            const date = dayElement.dataset.fullDate;
            
            const eventKey = `${date}_${timeSlot}`;
            if (events[eventKey]) {
                updateCellContent(cell, events[eventKey]);
            }
        });
    } catch (e) {
        console.error("Error al cargar los datos:", e);
    }
}

// Actualizar contenido de celda
function updateCellContent(cell, content) {
    if (isAdmin) {
        cell.innerHTML = `
            <div class="event-content">${content}</div>
            <div class="admin-controls">
                <button class="edit-btn" title="Editar">✏️</button>
                <button class="delete-btn" title="Eliminar">×</button>
            </div>
        `;
    } else {
        cell.innerHTML = `<div class="event-content">${content}</div>`;
    }
    
    cell.classList.add('has-content');
    cell.style.cursor = isAdmin ? 'pointer' : 'default';
    
    if (isAdmin) {
        const editBtn = cell.querySelector('.edit-btn');
        const deleteBtn = cell.querySelector('.delete-btn');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            editEvent(cell);
        });
        
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvent(cell);
        });
    }
}

// Configurar event listeners
function setupEventListeners() {
    // Celda editable
    document.querySelectorAll('.editable:not(.has-content)').forEach(cell => {
        cell.addEventListener('click', handleCellClick);
    });

    // Botones del modal
    saveEventBtn.addEventListener('click', saveEvent);
    cancelEventBtn.addEventListener('click', closeModal);
    closeModalBtn.addEventListener('click', closeModal);
    
    // Navegación por semanas
    prevWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 7);
        initializeTable();
    });
    
    nextWeekBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() + 7);
        initializeTable();
    });

    // Cerrar modal al hacer clic fuera o presionar Escape
    eventModal.addEventListener('click', (e) => {
        if (e.target === eventModal) closeModal();
    });
    
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && eventModal.style.display === 'flex') {
            closeModal();
        }
    });
    
    // Login
    adminLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'flex';
        usernameInput.focus();
    });
    
    cancelLoginBtn.addEventListener('click', () => {
        loginModal.style.display = 'none';
        resetLoginForm();
    });
    
    loginBtn.addEventListener('click', handleLogin);
    
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    logoutBtn.addEventListener('click', logout);
}

// Manejar login
function handleLogin() {
    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAdmin = true;
        loginModal.style.display = 'none';
        resetLoginForm();
        initializeTable();
    } else {
        loginError.textContent = 'Credenciales incorrectas';
    }
}

// Resetear formulario de login
function resetLoginForm() {
    usernameInput.value = '';
    passwordInput.value = '';
    loginError.textContent = '';
}

// Logout
function logout() {
    isAdmin = false;
    initializeTable();
}

// Manejar clic en celda
function handleCellClick() {
    if (this.classList.contains('has-content') && !isAdmin) return;
    
    selectedCell = this;
    const dayIndex = parseInt(this.dataset.day);
    const timeSlot = this.dataset.time;
    const dayName = document.getElementById(`day-${dayIndex}`).textContent.split('\n')[0];
    
    modalTitle.textContent = `Planificación para ${dayName}, ${timeSlot}`;
    eventText.value = this.classList.contains('has-content') 
        ? this.querySelector('.event-content').textContent 
        : '';
    eventModal.style.display = 'flex';
    eventText.focus();
}

// Editar evento
function editEvent(cell) {
    selectedCell = cell;
    const dayIndex = parseInt(cell.dataset.day);
    const timeSlot = cell.dataset.time;
    const dayName = document.getElementById(`day-${dayIndex}`).textContent.split('\n')[0];
    
    modalTitle.textContent = `Editar planificación para ${dayName}, ${timeSlot}`;
    eventText.value = cell.querySelector('.event-content').textContent;
    eventModal.style.display = 'flex';
    eventText.focus();
}

// Eliminar evento
function deleteEvent(cell) {
    if (!isAdmin || !confirm('¿Estás seguro de que quieres eliminar esta planificación?')) {
        return;
    }
    
    const dayIndex = parseInt(cell.dataset.day);
    const timeSlot = cell.dataset.time;
    const dayElement = document.getElementById(`day-${dayIndex}`);
    const date = dayElement.dataset.fullDate;
    const eventKey = `${date}_${timeSlot}`;
    
    // Obtener datos existentes
    const savedData = localStorage.getItem(storageKey);
    let events = savedData ? JSON.parse(savedData) : {};
    
    // Eliminar el evento
    delete events[eventKey];
    localStorage.setItem(storageKey, JSON.stringify(events));
    
    // Restaurar la celda
    cell.innerHTML = '';
    cell.classList.remove('has-content');
    cell.style.cursor = 'pointer';
    cell.addEventListener('click', handleCellClick);
}

// Guardar evento
function saveEvent() {
    if (!selectedCell) return;
    
    const content = eventText.value.trim();
    if (!content) {
        alert('Por favor, escribe algo para guardar en este horario.');
        return;
    }
    
    const dayIndex = parseInt(selectedCell.dataset.day);
    const timeSlot = selectedCell.dataset.time;
    const dayElement = document.getElementById(`day-${dayIndex}`);
    const date = dayElement.dataset.fullDate;
    
    const eventKey = `${date}_${timeSlot}`;
    
    // Obtener datos existentes
    const savedData = localStorage.getItem(storageKey);
    let events = savedData ? JSON.parse(savedData) : {};
    
    // Verificar si ya existe un evento (solo para usuarios normales)
    if (events[eventKey] && !isAdmin) {
        alert('Este horario ya ha sido planificado. Solo puedes planificar cada horario una vez.');
        return;
    }
    
    // Guardar el nuevo evento
    events[eventKey] = content;
    localStorage.setItem(storageKey, JSON.stringify(events));
    
    // Actualizar la celda
    updateCellContent(selectedCell, content);
    
    closeModal();
}

// Cerrar modal
function closeModal() {
    eventModal.style.display = 'none';
    selectedCell = null;
}

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', initializeTable);