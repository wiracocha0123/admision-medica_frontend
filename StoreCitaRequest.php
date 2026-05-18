<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCitaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'paciente_id' => 'required|exists:pacientes,id',
            'personal_salud_id' => 'required|exists:personal_salud,id',
            'especialidad_id' => 'required|exists:especialidades,id',
            'fecha' => 'required|date',
            'hora' => 'nullable',
            'estado' => 'nullable|string',
            'nro_ticket' => 'nullable|integer',
            'total_tickets_dia' => 'nullable|integer',
            'observaciones' => 'nullable|string',
            'operador_id' => 'nullable|exists:users,id'
        ];
    }
}