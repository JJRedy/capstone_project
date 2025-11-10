// Estado de las tareas
let tasks = [];

// Elementos del DOM
const modal = document.getElementById('taskModal');
const addTaskBtn = document.getElementById('addTaskBtn');
const closeBtn = document.querySelector('.close');
const taskForm = document.getElementById('taskForm');

// API Functions
async function fetchTasks() {
  try {
    const response = await fetch('/api/tasks');
    tasks = await response.json();
    renderAllTasks();
    updateTaskCounts();
  } catch (error) {
    console.error('Error cargando tareas:', error);
  }
}

async function createTaskAPI(taskData) {
  try {
    const response = await fetch('/api/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    });
    const newTask = await response.json();
    tasks.push(newTask);
    renderTask(newTask);
    updateTaskCounts();
  } catch (error) {
    console.error('Error creando tarea:', error);
  }
}

async function updateTaskAPI(taskId, updates) {
  try {
    const response = await fetch(`/api/tasks/${taskId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const updatedTask = await response.json();
    const index = tasks.findIndex(t => t.id === taskId);
    if (index !== -1) {
      tasks[index] = updatedTask;
    }
  } catch (error) {
    console.error('Error actualizando tarea:', error);
  }
}

async function deleteTaskAPI(taskId) {
  try {
    await fetch(`/api/tasks/${taskId}`, { method: 'DELETE' });
    tasks = tasks.filter(task => task.id !== taskId);
    const taskCard = document.querySelector(`[data-task-id="${taskId}"]`);
    taskCard.remove();
    updateTaskCounts();
  } catch (error) {
    console.error('Error eliminando tarea:', error);
  }
}

// Abrir modal
addTaskBtn.addEventListener('click', () => {
  modal.style.display = 'block';
});

// Cerrar modal
closeBtn.addEventListener('click', () => {
  modal.style.display = 'none';
  taskForm.reset();
});

// Cerrar modal al hacer clic fuera
window.addEventListener('click', (e) => {
  if (e.target === modal) {
    modal.style.display = 'none';
    taskForm.reset();
  }
});

// Crear nueva tarea
taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const taskData = {
    title: document.getElementById('taskTitle').value,
    description: document.getElementById('taskDescription').value,
    priority: document.getElementById('taskPriority').value,
    status: 'todo'
  };
  
  await createTaskAPI(taskData);
  
  modal.style.display = 'none';
  taskForm.reset();
});

// Renderizar todas las tareas
function renderAllTasks() {
  // Limpiar contenedores
  document.querySelectorAll('.tasks-container').forEach(container => {
    container.innerHTML = '';
  });
  
  // Renderizar cada tarea
  tasks.forEach(task => renderTask(task));
}

// Renderizar tarea
function renderTask(task) {
  const taskCard = document.createElement('div');
  taskCard.className = 'task-card';
  taskCard.draggable = true;
  taskCard.dataset.taskId = task.id;
  
  taskCard.innerHTML = `
    <div class="task-header">
      <div class="task-title">${task.title}</div>
    </div>
    ${task.description ? `<div class="task-description">${task.description}</div>` : ''}
    <div class="task-footer">
      <span class="task-priority ${task.priority}">${getPriorityText(task.priority)}</span>
      <div class="task-actions">
        <button class="btn-delete" onclick="deleteTask(${task.id})">🗑️</button>
      </div>
    </div>
  `;
  
  // Event listeners para drag and drop
  taskCard.addEventListener('dragstart', handleDragStart);
  taskCard.addEventListener('dragend', handleDragEnd);
  
  const container = document.getElementById(`${task.status}-tasks`);
  container.appendChild(taskCard);
}

// Obtener texto de prioridad
function getPriorityText(priority) {
  const priorities = {
    low: 'Baja',
    medium: 'Media',
    high: 'Alta'
  };
  return priorities[priority];
}

// Eliminar tarea
async function deleteTask(taskId) {
  await deleteTaskAPI(taskId);
}

// Actualizar contadores
function updateTaskCounts() {
  const statuses = ['todo', 'in-progress', 'done'];
  statuses.forEach(status => {
    const count = tasks.filter(task => task.status === status).length;
    const column = document.querySelector(`[data-status="${status}"]`);
    column.querySelector('.task-count').textContent = count;
  });
}

// Drag and Drop
let draggedElement = null;

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
}

async function handleDragEnd() {
  this.classList.remove('dragging');
  draggedElement = null;
  
  // Remover clase drag-over de todos los contenedores
  document.querySelectorAll('.tasks-container').forEach(container => {
    container.classList.remove('drag-over');
  });
}

// Configurar drag and drop en los contenedores
document.querySelectorAll('.tasks-container').forEach(container => {
  container.addEventListener('dragover', (e) => {
    e.preventDefault();
    container.classList.add('drag-over');
  });
  
  container.addEventListener('dragleave', () => {
    container.classList.remove('drag-over');
  });
  
  container.addEventListener('drop', async (e) => {
    e.preventDefault();
    container.classList.remove('drag-over');
    
    if (draggedElement) {
      const taskId = parseInt(draggedElement.dataset.taskId);
      const newStatus = container.id.replace('-tasks', '');
      
      // Actualizar el estado de la tarea en el backend
      await updateTaskAPI(taskId, { status: newStatus });
      
      // Mover visualmente la tarjeta
      container.appendChild(draggedElement);
      updateTaskCounts();
    }
  });
});

// Inicializar: Cargar tareas desde el backend
fetchTasks();