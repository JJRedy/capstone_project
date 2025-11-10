const TASKS_FILE = "./backend/tasks.json";

// Asegurar que el archivo existe
async function ensureTasksFile() {
  try {
    await Deno.readTextFile(TASKS_FILE);
  } catch {
    await Deno.writeTextFile(TASKS_FILE, JSON.stringify([]));
  }
}

// Leer tareas
export async function getTasks() {
  await ensureTasksFile();
  const data = await Deno.readTextFile(TASKS_FILE);
  return JSON.parse(data);
}

// Guardar tareas
export async function saveTasks(tasks: any[]) {
  await Deno.writeTextFile(TASKS_FILE, JSON.stringify(tasks, null, 2));
}

// Crear tarea
export async function createTask(task: any) {
  const tasks = await getTasks();
  const newTask = {
    ...task,
    id: Date.now(), // ID único basado en timestamp
    createdAt: new Date().toISOString()
  };
  tasks.push(newTask);
  await saveTasks(tasks);
  return newTask;
}

// Actualizar tarea
export async function updateTask(taskId: number, updates: any) {
  const tasks = await getTasks();
  const index = tasks.findIndex((t: any) => t.id === taskId);
  
  if (index === -1) {
    throw new Error("Tarea no encontrada");
  }
  
  tasks[index] = { ...tasks[index], ...updates };
  await saveTasks(tasks);
  return tasks[index];
}

// Eliminar tarea
export async function deleteTask(taskId: number) {
  const tasks = await getTasks();
  const filtered = tasks.filter((t: any) => t.id !== taskId);
  await saveTasks(filtered);
  return { success: true };
}

// Manejador de rutas API
export async function handleApiRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const method = req.method;

  // CORS headers
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  // Handle preflight
  if (method === "OPTIONS") {
    return new Response(null, { headers });
  }

  try {
    // GET /api/tasks - Obtener todas las tareas
    if (url.pathname === "/api/tasks" && method === "GET") {
      const tasks = await getTasks();
      return new Response(JSON.stringify(tasks), { headers });
    }

    // POST /api/tasks - Crear nueva tarea
    if (url.pathname === "/api/tasks" && method === "POST") {
      const body = await req.json();
      const newTask = await createTask(body);
      return new Response(JSON.stringify(newTask), { 
        status: 201, 
        headers 
      });
    }

    // PUT /api/tasks/:id - Actualizar tarea
    if (url.pathname.startsWith("/api/tasks/") && method === "PUT") {
      const taskId = parseInt(url.pathname.split("/")[3]);
      const body = await req.json();
      const updated = await updateTask(taskId, body);
      return new Response(JSON.stringify(updated), { headers });
    }

    // DELETE /api/tasks/:id - Eliminar tarea
    if (url.pathname.startsWith("/api/tasks/") && method === "DELETE") {
      const taskId = parseInt(url.pathname.split("/")[3]);
      await deleteTask(taskId);
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    return new Response(JSON.stringify({ error: "Ruta no encontrada" }), {
      status: 404,
      headers,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers }
    );
  }
}