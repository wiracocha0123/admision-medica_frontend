<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use Spatie\Permission\Middleware\RoleMiddleware;

Route::get('/user', function (Request $request) {
    return $request->user();
})->middleware('auth:sanctum');

Route::post('login', [AuthController::class, 'login']);
Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
Route::post('refresh', [AuthController::class, 'refresh'])->middleware('auth:api');
//Route::get('me', [AuthController::class, 'me'])->middleware('auth:api');

// Rutas protegidas: requiere autenticaciÃ³n
Route::middleware('auth:api')->group(function () {
    //Route::apiResource('especialidades', App\Http\Controllers\EspecialidadesController::class)->middleware(RoleMiddleware::class . ':operador|supervisor');
    //Route::apiResource('pacientes', App\Http\Controllers\PacientesController::class)->middleware(RoleMiddleware::class . ':operador|supervisor');
    //Route::apiResource('personal_salud', App\Http\Controllers\PersonaSaludController::class)->middleware(RoleMiddleware::class . ':operador|supervisor');
    //Route::apiResource('citas', App\Http\Controllers\CitasController::class)->middleware(RoleMiddleware::class . ':operador|supervisor');
});

Route::middleware('auth:api')->group(function(){

    Route::get('me', function() {
    $user = auth('api')->user();

    if ($user) {
        // Cargamos la relaciÃ³n para que no sea null
        $user->load('operador'); 
        
        // Agregamos el operador_id directamente al objeto user
        // AsÃ­ el front recibe el objeto tal cual lo esperaba + el nuevo campo
        $user->operador_id = $user->operador?->id;
    }

    return response()->json($user);
});

Route::group(['middleware' => ['role:operador|supervisor']], function () {
    Route::apiResource('operadores', App\Http\Controllers\OperadoresController::class);
    Route::get('reportes/personal', [App\Http\Controllers\ReporteController::class, 'index']);
    Route::get('reportes/personal/{id}/pacientes', [App\Http\Controllers\ReporteController::class, 'showPacientes']);
    Route::apiResource('especialidades', App\Http\Controllers\EspecialidadesController::class);
    
    Route::get('pacientes/next-hc', [App\Http\Controllers\PacientesController::class, 'getNextHC']);

    Route::apiResource('pacientes', App\Http\Controllers\PacientesController::class);
    
    Route::apiResource('personal_salud', App\Http\Controllers\PersonaSaludController::class);
    Route::get('citas/next-ticket', [App\\Http\\Controllers\\CitasController::class, 'getNextTicket']); Route::apiResource('citas', App\\Http\\Controllers\\CitasController::class);
});

    Route::get('operadores/me', function(){ return response()->json(auth('api')->user()->operador ?? null); });
    Route::get('admin/dashboard', function(){ return ['ok' => 'admin']; })->middleware('role:supervisor');
    Route::get('users', [App\Http\Controllers\UsersController::class, 'index'])->middleware('role:supervisor');
});


Route::middleware(['auth:api', RoleMiddleware::class . ':operador'])->group(function () {
    //Route::get('reportes/personal', [App\Http\Controllers\ReporteController::class, 'index']);
    //Route::get('reportes/personal/{id}/pacientes', [App\Http\Controllers\ReporteController::class, 'showPacientes']);
});