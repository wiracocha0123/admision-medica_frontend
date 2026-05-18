<?php

namespace App\Http\Controllers\Traits;

trait ApiResponse
{
    protected function success(, string  = 'Éxito', int  = 200)
    {
        if ( instanceof \Illuminate\Pagination\LengthAwarePaginator) {
            return response()->json(array_merge(
                ->toArray(),
                ['message' => ]
            ), );
        }

        return response()->json(['data' => , 'message' => ], );
    }

    protected function error(, string  = 'Error', int  = 400)
    {
        return response()->json(['errors' => , 'message' => ], );
    }
}
