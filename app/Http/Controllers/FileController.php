<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Requests\FileDownloadRequest;

class FileController extends Controller
{
    public function download(FileDownloadRequest $request){
        $path = storage_path('app/public/'.$request->path);

        if(!file_exists($path)){
            return response()->json(['error' => 'Filen existerar ej.'], 404);
        }

        return response()->download($path);
    }
}
