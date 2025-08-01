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
    '22:30 - 23:59'
];

const ADMIN_CREDENTIALS = {
    username: 'admin',
    password: '123'
};

// Variables de estado
let currentStartDate = null;
let currentEndDate = null;
let selectedCell = null;
let isAdmin = false;
const storageKey = 'weeklyPlannerData';
const activeWeekKey = 'activeWeek';
const recordsKey = 'weeklyPlannerRecords';

// Elementos del DOM
const elements = {
    loginModal: document.getElementById('login-modal'),
    adminBar: document.getElementById('admin-bar'),
    adminLoginBtn: document.getElementById('admin-login-btn'),
    logoutBtn: document.getElementById('logout-btn'),
    saveRecordBtn: document.getElementById('save-record-btn'),
    viewRecordsBtn: document.getElementById('view-records-btn'),
    usernameInput: document.getElementById('username'),
    passwordInput: document.getElementById('password'),
    loginBtn: document.getElementById('login-btn'),
    cancelLoginBtn: document.getElementById('cancel-login'),
    loginError: document.getElementById('login-error'),
    scheduleTable: document.getElementById('schedule-table'),
    tbody: document.querySelector('#schedule-table tbody'),
    weekRangeElement: document.getElementById('week-range'),
    adminWeekControls: document.getElementById('admin-week-controls'),
    startDateInput: document.getElementById('start-date'),
    endDateInput: document.getElementById('end-date'),
    saveWeekBtn: document.getElementById('save-week-btn'),
    newWeekBtn: document.getElementById('new-week-btn'),
    eventModal: document.getElementById('event-modal'),
    eventText: document.getElementById('event-text'),
    saveEventBtn: document.getElementById('save-event'),
    cancelEventBtn: document.getElementById('cancel-event'),
    closeModalBtn: document.getElementById('close-modal'),
    modalTitle: document.getElementById('modal-title'),
    recordsModal: document.getElementById('records-modal'),
    recordsList: document.getElementById('records-list'),
    closeRecordsModalBtn: document.getElementById('close-records-modal'),
    closeRecordsBtn: document.getElementById('close-records-btn')
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', () => {
    const activeWeek = localStorage.getItem(activeWeekKey);
    if (activeWeek) {
        const [start, end] = activeWeek.split('_');
        currentStartDate = start;
        currentEndDate = end;
    }
    
    initializeTable();
    setupEventListeners();
});

function initializeTable() {
    elements.tbody.innerHTML = '';
    
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
        
        elements.tbody.appendChild(row);
    });
    
    updateWeekInfo();
    loadEvents();
    setupResponsiveBehavior();
    toggleAdminMode();
}

function toggleAdminMode() {
    if (isAdmin) {
        document.body.classList.add('admin-mode');
        elements.adminBar.style.display = 'flex';
        elements.adminLoginBtn.style.display = 'none';
        elements.adminWeekControls.style.display = 'block';
        
        const today = new Date().toISOString().split('T')[0];
        elements.startDateInput.min = today;
        elements.endDateInput.min = today;
        
        if (currentStartDate && currentEndDate) {
            elements.startDateInput.value = formatDateForInput(currentStartDate);
            elements.endDateInput.value = formatDateForInput(currentEndDate);
        }
    } else {
        document.body.classList.remove('admin-mode');
        elements.adminBar.style.display = 'none';
        elements.adminLoginBtn.style.display = 'block';
        elements.adminWeekControls.style.display = 'none';
    }
    
    if (elements.recordsModal.style.display === 'flex') {
        showRecordsModal();
    }
}

function formatDateForInput(dateStr) {
    const [day, month, year] = dateStr.split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function formatDateForDisplay(dateStr) {
    return dateStr || 'Semana sin fecha asignada';
}

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
}

function updateWeekInfo() {
    elements.weekRangeElement.textContent = currentStartDate && currentEndDate 
        ? `Semana del ${currentStartDate} al ${currentEndDate}`
        : 'Semana sin fecha asignada';
}

function getDayName(dayIndex) {
    const days = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
    return days[dayIndex];
}

function loadEvents() {
    if (!currentStartDate || !currentEndDate) return;
    
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) return;
    
    try {
        const allEvents = JSON.parse(savedData);
        const weekKey = `${currentStartDate}_${currentEndDate}`;
        const weekEvents = allEvents[weekKey] || {};
        
        document.querySelectorAll('.editable').forEach(cell => {
            const dayIndex = parseInt(cell.dataset.day);
            const timeSlot = cell.dataset.time;
            const dayName = getDayName(dayIndex);
            
            const eventKey = `${dayName}_${timeSlot}`;
            if (weekEvents[eventKey]) {
                updateCellContent(cell, weekEvents[eventKey]);
            }
        });
    } catch (e) {
        console.error("Error al cargar los datos:", e);
    }
}

function updateCellContent(cell, content) {
    if (isAdmin) {
        cell.innerHTML = `
            <div class="event-content">${content}</div>
            <div class="admin-controls">
                <button class="edit-btn" title="Editar">✏️</button>
                <button class="delete-btn" title="Eliminar">×</button>
            </div>
        `;
        
        cell.querySelector('.edit-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            editEvent(cell);
        });
        
        cell.querySelector('.delete-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            deleteEvent(cell);
        });
    } else {
        cell.innerHTML = `<div class="event-content">${content}</div>`;
    }
    
    cell.classList.add('has-content');
    cell.style.cursor = isAdmin ? 'pointer' : 'default';
}

function setupEventListeners() {
    // Celdas editables
    document.addEventListener('click', (e) => {
        const cell = e.target.closest('.editable:not(.has-content)');
        if (cell) handleCellClick(cell);
    });

    // Modal de eventos
    elements.saveEventBtn.addEventListener('click', saveEvent);
    elements.cancelEventBtn.addEventListener('click', closeModal);
    elements.closeModalBtn.addEventListener('click', closeModal);
    
    // Login
    elements.adminLoginBtn.addEventListener('click', () => {
        elements.loginModal.style.display = 'flex';
        elements.usernameInput.focus();
    });
    
    elements.cancelLoginBtn.addEventListener('click', () => {
        elements.loginModal.style.display = 'none';
        resetLoginForm();
    });
    
    elements.loginBtn.addEventListener('click', handleLogin);
    elements.passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
    
    elements.logoutBtn.addEventListener('click', logout);
    
    // Controles de semana
    elements.saveWeekBtn.addEventListener('click', saveWeek);
    elements.newWeekBtn.addEventListener('click', createNewWeek);
    elements.startDateInput.addEventListener('change', validateDates);
    elements.endDateInput.addEventListener('change', validateDates);
    
    // Registros
    elements.saveRecordBtn.addEventListener('click', saveCurrentRecord);
    elements.viewRecordsBtn.addEventListener('click', showRecordsModal);
    elements.closeRecordsModalBtn.addEventListener('click', closeRecordsModal);
    elements.closeRecordsBtn.addEventListener('click', closeRecordsModal);
    
    elements.recordsModal.addEventListener('click', (e) => {
        if (e.target === elements.recordsModal) closeRecordsModal();
    });
}

function handleCellClick(cell) {
    if (!currentStartDate || !currentEndDate) {
        alert('No se ha asignado una semana para planificar');
        return;
    }
    
    selectedCell = cell;
    const dayIndex = parseInt(cell.dataset.day);
    const timeSlot = cell.dataset.time;
    const dayName = getDayName(dayIndex);
    
    elements.modalTitle.textContent = `Planificación para ${dayName}, ${timeSlot}`;
    elements.eventText.value = cell.classList.contains('has-content') 
        ? cell.querySelector('.event-content').textContent 
        : '';
    elements.eventModal.style.display = 'flex';
    elements.eventText.focus();
}

function editEvent(cell) {
    selectedCell = cell;
    const dayIndex = parseInt(cell.dataset.day);
    const timeSlot = cell.dataset.time;
    const dayName = getDayName(dayIndex);
    
    elements.modalTitle.textContent = `Editar planificación para ${dayName}, ${timeSlot}`;
    elements.eventText.value = cell.querySelector('.event-content').textContent;
    elements.eventModal.style.display = 'flex';
    elements.eventText.focus();
}

function deleteEvent(cell) {
    if (!isAdmin || !confirm('¿Estás seguro de que quieres eliminar esta planificación?')) return;
    
    const dayIndex = parseInt(cell.dataset.day);
    const timeSlot = cell.dataset.time;
    const dayName = getDayName(dayIndex);
    
    const savedData = localStorage.getItem(storageKey);
    let allEvents = savedData ? JSON.parse(savedData) : {};
    const weekKey = `${currentStartDate}_${currentEndDate}`;
    
    if (!allEvents[weekKey]) allEvents[weekKey] = {};
    
    delete allEvents[weekKey][`${dayName}_${timeSlot}`];
    localStorage.setItem(storageKey, JSON.stringify(allEvents));
    
    cell.innerHTML = '';
    cell.classList.remove('has-content');
    cell.style.cursor = 'pointer';
}

function saveEvent() {
    if (!selectedCell || !currentStartDate || !currentEndDate) return;
    
    const content = elements.eventText.value.trim();
    if (!content) {
        alert('Por favor, escribe algo para guardar en este horario.');
        return;
    }
    
    const dayIndex = parseInt(selectedCell.dataset.day);
    const timeSlot = selectedCell.dataset.time;
    const dayName = getDayName(dayIndex);
    
    const savedData = localStorage.getItem(storageKey);
    let allEvents = savedData ? JSON.parse(savedData) : {};
    const weekKey = `${currentStartDate}_${currentEndDate}`;
    
    if (!allEvents[weekKey]) allEvents[weekKey] = {};
    
    const eventKey = `${dayName}_${timeSlot}`;
    
    if (allEvents[weekKey][eventKey] && !isAdmin) {
        alert('Este horario ya ha sido planificado. Solo puedes planificar cada horario una vez.');
        return;
    }
    
    allEvents[weekKey][eventKey] = content;
    localStorage.setItem(storageKey, JSON.stringify(allEvents));
    
    updateCellContent(selectedCell, content);
    closeModal();
}

function closeModal() {
    elements.eventModal.style.display = 'none';
    selectedCell = null;
}

function validateDates() {
    if (!elements.startDateInput.value || !elements.endDateInput.value) return true;
    
    const startDate = new Date(elements.startDateInput.value + 'T12:00:00Z');
    const endDate = new Date(elements.endDateInput.value + 'T12:00:00Z');
    
    if (startDate.getUTCDay() !== 1) {
        alert('La fecha de inicio debe ser un lunes');
        elements.startDateInput.value = '';
        return false;
    }
    
    if (endDate.getUTCDay() !== 0) {
        alert('La fecha final debe ser un domingo');
        elements.endDateInput.value = '';
        return false;
    }
    
    if (endDate <= startDate) {
        alert('La fecha final debe ser posterior a la fecha de inicio');
        elements.endDateInput.value = '';
        return false;
    }
    
    const diffTime = endDate - startDate;
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays !== 6) {
        alert('Debe seleccionar exactamente una semana (7 días de lunes a domingo)');
        elements.startDateInput.value = '';
        elements.endDateInput.value = '';
        return false;
    }
    
    return true;
}

function saveWeek() {
    if (!elements.startDateInput.value || !elements.endDateInput.value) {
        alert('Por favor, asigne fechas válidas para la semana');
        return;
    }
    
    if (!validateDates()) return;
    
    const startDate = formatInputDateToDisplay(elements.startDateInput.value);
    const endDate = formatInputDateToDisplay(elements.endDateInput.value);
    
    currentStartDate = startDate;
    currentEndDate = endDate;
    
    localStorage.setItem(activeWeekKey, `${startDate}_${endDate}`);
    updateWeekInfo();
    alert('Semana guardada correctamente');
}

function formatInputDateToDisplay(dateStr) {
    const date = new Date(dateStr + 'T12:00:00Z');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
}

function createNewWeek() {
    if (confirm('¿Está seguro de que desea crear una nueva semana? Se perderán los cambios no guardados.')) {
        currentStartDate = null;
        currentEndDate = null;
        elements.startDateInput.value = '';
        elements.endDateInput.value = '';
        
        localStorage.removeItem(activeWeekKey);
        document.querySelectorAll('.editable').forEach(cell => {
            cell.innerHTML = '';
            cell.classList.remove('has-content');
            cell.style.cursor = 'pointer';
        });
        
        updateWeekInfo();
    }
}

function handleLogin() {
    const username = elements.usernameInput.value.trim();
    const password = elements.passwordInput.value.trim();
    
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        isAdmin = true;
        elements.loginModal.style.display = 'none';
        resetLoginForm();
        initializeTable();
    } else {
        elements.loginError.textContent = 'Credenciales incorrectas';
    }
}

function resetLoginForm() {
    elements.usernameInput.value = '';
    elements.passwordInput.value = '';
    elements.loginError.textContent = '';
}

function logout() {
    isAdmin = false;
    initializeTable();
}

function saveCurrentRecord() {
    if (!currentStartDate || !currentEndDate) {
        alert('No hay una semana configurada para guardar');
        return;
    }
    
    const savedData = localStorage.getItem(storageKey);
    if (!savedData) {
        alert('No hay datos para guardar como registro');
        return;
    }
    
    const allEvents = JSON.parse(savedData);
    const weekKey = `${currentStartDate}_${currentEndDate}`;
    const weekEvents = allEvents[weekKey];
    
    if (!weekEvents || Object.keys(weekEvents).length === 0) {
        alert('No hay datos para guardar como registro');
        return;
    }
    
    const record = {
        startDate: currentStartDate,
        endDate: currentEndDate,
        events: weekEvents,
        savedAt: new Date().toISOString()
    };
    
    const records = JSON.parse(localStorage.getItem(recordsKey) || '[]');
    records.unshift(record);
    localStorage.setItem(recordsKey, JSON.stringify(records));
    
    alert('Registro guardado exitosamente');
}

function deleteRecord(recordIndex) {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro permanentemente?')) {
        return;
    }
    
    const records = JSON.parse(localStorage.getItem(recordsKey)) || [];
    records.splice(recordIndex, 1);
    localStorage.setItem(recordsKey, JSON.stringify(records));
    
    if (elements.recordsModal.style.display === 'flex') {
        showRecordsModal();
    }
}

function showRecordsModal() {
    const records = JSON.parse(localStorage.getItem(recordsKey)) || [];
    elements.recordsList.innerHTML = '';
    
    if (records.length === 0) {
        elements.recordsList.innerHTML = '<p>No hay registros guardados</p>';
    } else {
        records.forEach((record, index) => {
            const recordItem = document.createElement('div');
            recordItem.className = 'record-item';
            
            const recordHeader = document.createElement('div');
            recordHeader.className = 'record-header';
            recordHeader.innerHTML = `
                <span class="record-dates">${record.startDate} - ${record.endDate}</span>
                <span class="record-date">${new Date(record.savedAt).toLocaleString()}</span>
                ${isAdmin ? `<button class="delete-record-btn" data-index="${index}">Eliminar</button>` : ''}
            `;
            
            const recordContent = document.createElement('div');
            recordContent.className = 'record-content';
            
            let tableHTML = '<table><thead><tr><th>Horario</th>';
            
            const days = ['LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO', 'DOMINGO'];
            days.forEach(day => tableHTML += `<th>${day}</th>`);
            
            tableHTML += '</tr></thead><tbody>';
            
            timeSlots.forEach(timeSlot => {
                tableHTML += `<tr><td class="time-cell">${timeSlot}</td>`;
                
                days.forEach(day => {
                    const eventKey = `${day}_${timeSlot}`;
                    tableHTML += `<td>${record.events[eventKey] || ''}</td>`;
                });
                
                tableHTML += '</tr>';
            });
            
            tableHTML += '</tbody></table>';
            recordContent.innerHTML = tableHTML;
            
            recordHeader.addEventListener('click', (e) => {
                if (!e.target.classList.contains('delete-record-btn')) {
                    recordContent.classList.toggle('show-record');
                }
            });
            
            recordItem.appendChild(recordHeader);
            recordItem.appendChild(recordContent);
            elements.recordsList.appendChild(recordItem);
        });

        document.querySelectorAll('.delete-record-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const index = parseInt(btn.dataset.index);
                deleteRecord(index);
            });
        });
    }
    
    elements.recordsModal.style.display = 'flex';
}

function closeRecordsModal() {
    elements.recordsModal.style.display = 'none';
}