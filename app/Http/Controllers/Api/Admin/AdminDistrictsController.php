<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\District;
use Illuminate\Http\Request;

class AdminDistrictsController extends Controller
{
    public function index()
    {
        $searchstring = \Request::get('search');
        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        $query = District::withTrashed();
        if($searchstring) $query->search($searchstring);
        $query->orderBy('created_at', 'desc');
        $districts = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($districts->currentPage() > $districts->lastPage()):
            \Request::replace(['page'=>$districts->lastPage()]);
            $districts = $query->paginate($perPage);
        endif;

        $districts->makeVisible([
            'created_at',
            'districts_count'
        ]);

        $districts = $districts->toArray();
        $districts['search'] = $searchstring;
        $districts['search'] = $searchstring;

        return response()->json(['districts' => $districts]);

    }

    public function show($id)
    {
        $district = District::findOrFail($id);
        if (\Auth::user()->is_admin):
            $district->makeVisible(['created_at', 'updated_at']);
            $district->load(
                'Clubs'
            );
        endif;
        return response()->json(['district' => $district]);
    }

}
