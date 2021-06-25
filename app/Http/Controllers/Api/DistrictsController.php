<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\District;
use Illuminate\Http\Request;
use \Storage;

class DistrictsController extends Controller
{
    public function __construct()
    {
        $this->middleware('checkDistrictUserAdmin')->only('show','update');
    }

    public function index()
    {
        $user = \Auth::user()->load('DistrictsAdmin');
        $districts = $user->DistrictsAdmin;
        return response()->json(['districts'=>$districts]);
    }

    public function show($id)
    {
        $district = District::find($id);
        return response()->json(['district'=>$district]);
    }

    public function update(Request $request, $id)
    {
        $district = District::find($id);
        $data = $request->all();
        if($district):
            // Store the logo.
            if($request->file('logo')){
                $file     = $request->file('logo');
                $filename = str_slug($district->name).'-logo.'.$file->getClientOriginalExtension();
                Storage::disk('local')->put('public/districts/' . $district->id.'/'.$filename, file_get_contents($file));
                $data['logo'] = $filename;
            }

            $district->update($data);
            return response()->json('Kretsen har uppdaterats');
        endif;
    }

}
