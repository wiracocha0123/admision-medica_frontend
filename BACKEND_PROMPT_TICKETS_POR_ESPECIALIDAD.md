# Prompt para Backend - Implementar Tickets Independientes por Especialidad

## Descripción del Cambio
Actualmente los tickets de citas se asignan de forma global por fecha (1, 2, 3, 4...). Necesitan cambiarse para que sean **independientes por especialidad**, es decir:
- Nutrición (Area A): 1, 2, 3...
- Medicina (Area B): 1, 2, 3...
- Laboratorio (Area C): 1, 2, 3...

Así cada área maneja su propio contador de tickets.

---

## 1. Cambio en CitasController - Método store() o createCita()

**BUSCAR ESTA LÓGICA:**
```php
// ANTES (INCORRECTO - genera tickets globales)
$maxTicket = Cita::whereDate('fecha', $request->fecha)->max('nro_ticket');
$siguienteTicket = ($maxTicket ?? 0) + 1;
$request->merge(['nro_ticket' => $siguienteTicket]);
```

**REEMPLAZAR POR:**
```php
// DESPUÉS (CORRECTO - tickets independientes por especialidad)
$maxTicket = Cita::whereDate('fecha', $request->fecha)
    ->where('especialidad_id', $request->especialidad_id)
    ->max('nro_ticket');
$siguienteTicket = ($maxTicket ?? 0) + 1;

// Validar que no exceda el cupo de esa especialidad
$cupo = $request->total_tickets_dia ?? 16;
if ($siguienteTicket > $cupo) {
    return response()->json([
        'message' => "Se ha alcanzado el cupo máximo ({$cupo}) de tickets para esta especialidad en la fecha {$request->fecha}."
    ], 422);
}

$request->merge(['nro_ticket' => $siguienteTicket]);
```

---

## 2. Cambio en CitasController - Método update()

**BUSCAR ESTA LÓGICA:**
```php
// Si se está actualizando la especialidad o fecha, recalcular el ticket
if ($request->has('especialidad_id') || $request->has('fecha')) {
    // Código anterior que calcula ticket global
}
```

**REEMPLAZAR POR:**
```php
// Si se está actualizando la especialidad o fecha, recalcular el ticket
if ($request->has('especialidad_id') || $request->has('fecha')) {
    $fecha = $request->fecha ?? $cita->fecha;
    $especialidad_id = $request->especialidad_id ?? $cita->especialidad_id;
    
    // Excluir la cita actual de la búsqueda para no contar el mismo ticket
    $maxTicket = Cita::whereDate('fecha', $fecha)
        ->where('especialidad_id', $especialidad_id)
        ->where('id', '!=', $cita->id)
        ->max('nro_ticket');
    
    $siguienteTicket = ($maxTicket ?? 0) + 1;
    
    // Validar cupo
    $cupo = $request->total_tickets_dia ?? $cita->total_tickets_dia ?? 16;
    if ($siguienteTicket > $cupo) {
        return response()->json([
            'message' => "Se ha alcanzado el cupo máximo ({$cupo}) de tickets para esta especialidad."
        ], 422);
    }
    
    $request->merge(['nro_ticket' => $siguienteTicket]);
}
```

---

## 3. Endpoint GET /citas/next-ticket (OPCIONAL - solo si existe)

Si tienes este endpoint, actualizarlo para que devuelva el siguiente ticket POR ESPECIALIDAD:

**BUSCAR:**
```php
public function nextTicket(Request $request)
{
    $maxTicket = Cita::whereDate('fecha', $request->fecha)->max('nro_ticket');
    return response()->json([
        'next_ticket' => ($maxTicket ?? 0) + 1,
        'total_tickets_dia' => 16
    ]);
}
```

**REEMPLAZAR POR:**
```php
public function nextTicket(Request $request)
{
    $maxTicket = Cita::whereDate('fecha', $request->fecha)
        ->where('especialidad_id', $request->especialidad_id)
        ->max('nro_ticket');
    
    $cupo = $request->query('cupo', 16);
    
    return response()->json([
        'next_ticket' => ($maxTicket ?? 0) + 1,
        'total_tickets_dia' => $cupo,
        'especialidad_id' => $request->especialidad_id
    ]);
}
```

---

## 4. Validación en Migraciones/Modelo

**Asegurar que la tabla `citas` tenga:**
- ✅ `especialidad_id` (integer, foreign key)
- ✅ `nro_ticket` (integer o string)
- ✅ `fecha` (date)
- ✅ `total_tickets_dia` (integer, default 16)

**Si falta la validación de uniqueness, AGREGAR:**
```php
// En el modelo Cita.php
protected $fillable = [
    'paciente_id',
    'personal_salud_id',
    'especialidad_id',  // IMPORTANTE
    'fecha',
    'hora',
    'estado',
    'nro_ticket',
    'total_tickets_dia',
    'observaciones',
    'operador_id'
];

// AGREGAR validación en store():
$request->validate([
    'paciente_id' => 'required|exists:pacientes,id',
    'especialidad_id' => 'required|exists:especialidades,id', // IMPORTANTE
    'fecha' => 'required|date',
    'nro_ticket' => 'required|integer|min:1',
    // ... resto de validaciones
]);
```

---

## 5. Base de Datos - Crear Índice (Mejora de Performance)

Para optimizar las búsquedas de tickets por especialidad, crear un índice:

**En una nueva migración:**
```php
Schema::table('citas', function (Blueprint $table) {
    $table->index(['fecha', 'especialidad_id']); // Índice compuesto
});
```

---

## 6. Endpoint GET /citas/cupos-config (OPCIONAL - si necesitas persistencia)

Si quieres guardar la configuración de cupos por especialidad en la BD:

```php
// GET /citas/cupos-config?fecha=YYYY-MM-DD
public function getCuposConfig(Request $request)
{
    $fecha = $request->query('fecha', date('Y-m-d'));
    $cupos = CupoEspecialidad::where('fecha', $fecha)->get();
    
    return response()->json([
        'data' => $cupos->pluck('cupo', 'especialidad_id')
    ]);
}

// POST /citas/cupos-config
public function setCuposConfig(Request $request)
{
    $fecha = $request->fecha;
    $cupos = $request->cupos; // Array: [especialidad_id => cupo]
    
    foreach ($cupos as $especialidad_id => $cupo) {
        CupoEspecialidad::updateOrCreate(
            ['fecha' => $fecha, 'especialidad_id' => $especialidad_id],
            ['cupo' => $cupo]
        );
    }
    
    return response()->json([
        'message' => 'Cupos actualizados correctamente',
        'data' => $cupos
    ]);
}
```

Si usas esto, debes crear:
- **Migracion**: tabla `cupos_especialidades` con campos `id, fecha, especialidad_id, cupo`
- **Modelo**: `CupoEspecialidad`

---

## Resumen de Cambios

| Cambio | Ubicación | Prioridad |
|--------|-----------|-----------|
| Tickets independientes en `store()` | CitasController | **ALTA** |
| Tickets independientes en `update()` | CitasController | **ALTA** |
| Índice BD para performance | Migración | Media |
| Endpoint `/cupos-config` (persistencia) | CitasController/Rutas | Baja |

---

## Testing

Después de implementar, **probar:**

1. **Crear 3 citas en el mismo día, diferentes especialidades:**
   - Especialidad A → ticket debe ser 1
   - Especialidad B → ticket debe ser 1
   - Especialidad A (otra cita) → ticket debe ser 2

2. **Actualizar especialidad de una cita:**
   - La cita debe recalcular su número de ticket basado en la nueva especialidad

3. **Validar cupo:**
   - Si Especialidad A tiene cupo 2 e intentas crear ticket 3 → debe rechazar

---

## Notas

- El frontend YA está enviando `especialidad_id` correctamente en todos los payloads
- El frontend calcula los tickets correctamente en la UI (local)
- Los cambios en backend harán que se guarden correctamente en la BD
- Después de estos cambios, los reportes y PDFs mostrarán tickets independientes por área

