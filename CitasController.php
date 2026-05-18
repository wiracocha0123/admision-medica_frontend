<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Cita;
use App\Models\PersonalSalud;
use App\Http\Controllers\Traits\ApiResponse;
use App\Http\Requests\StoreCitaRequest;
use App\Http\Requests\UpdateCitaRequest;

class CitasController extends Controller
{
    use ApiResponse;

    public function index(Request )
    {
        $query = Cita::with(['paciente:id,nombre,apellido,dni,HistoriaClinica as hc', 'personalSalud:id,nombres,apellidos', 'operador:id,nombre,apellido', 'especialidad:id,UPS,especialidad']);
        if ($request->filled('personal_salud_id')) $query->where('personal_salud_id', $request->personal_salud_id);
        if ($request->filled('fecha')) $query->whereDate('fecha', $request->fecha);
        return $this->success($query->orderBy('fecha', 'desc')->orderBy('hora', 'asc')->paginate(25));
    }

    public function getNextTicket(Request )
    {
        if (!$request->filled('fecha')) {
            return $this->success(['next_ticket' => 1]);
        }
        
        // El ticket es global por fecha (independientemente del médico)
        $citas = Cita::whereDate('fecha', $request->fecha)->get();
        $maxTicket = 0;
        foreach ($citas as $c) {
            $numero = (int) $c->nro_ticket;
            if ($numero > $maxTicket) $maxTicket = $numero;
        }
        
        return $this->success(['next_ticket' => $maxTicket + 1]);
    }

    public function store(StoreCitaRequest )
    {
        $data = $request->validated();
        
        // Calcular el ticket basado solo en la fecha (Global)
        $citas = Cita::whereDate('fecha', $data['fecha'])->get();
        $maxTicket = 0;
        foreach ($citas as $c) {
            $numero = (int) $c->nro_ticket;
            if ($numero > $maxTicket) $maxTicket = $numero;
        }
        
        $nuevo = $maxTicket + 1;
        $data['nro_ticket'] = $nuevo;
        
        if (!isset($data['operador_id'])) $data['operador_id'] = auth()->id();
        
        $cita = Cita::create($data);
        return $this->success($cita, 'Ticket #' . $nuevo . ' generado correctamente.', 201);
    }

    public function update(UpdateCitaRequest , $id)
    {
        $cita = Cita::find($id);
        if (!$cita) return $this->error('No encontrado', 404);
        $cita->update($request->validated());
        return $this->success($cita);
    }

    public function destroy($id)
    {
        $cita = Cita::find($id);
        if (!$cita) return $this->error('No encontrado', 404);
        $cita->delete();
        return $this->success(['id' => $id], 'Cita eliminada correctamente');
    }
}
