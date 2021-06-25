<?php

namespace App\Http\Controllers\Api;

use App\Repositories\WeaponclassRepository;
use Illuminate\Http\Request;
use App\Http\Controllers\Controller;

use App\Http\Requests;

class CompetitionsAdminWeaponclassesController extends Controller
{
    public function __construct(WeaponclassRepository $weaponclasses)
    {
        $this->middleware('checkUserCompetitionRole:admin');
        $this->weaponclasses = $weaponclasses;
    }

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index($competitionsId)
    {
        $weaponclasses = $this->weaponclasses->getCompetitionWeaponclasses($competitionsId);
        $allWeaponclasses = \App\Models\Weaponclass::orderBy('classname')->get();
        return response()->json(['weaponclasses'=>$weaponclasses, 'allweaponclasses'=>$allWeaponclasses]);
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request, $competitionsId)
    {
        $weaponclasses = $this->weaponclasses->storeWeaponclass($competitionsId);
        return response()->json(['weaponclasses'=>$weaponclasses]);
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $competitionsId, $id)
    {
        $weaponclasses = $this->weaponclasses->updateWeaponclass($competitionsId, $id);
        return response()->json(['weaponclasses'=>$weaponclasses]);
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($competitionsId, $id)
    {
        $this->weaponclasses->deleteWeaponclass($competitionsId, $id);
        $weaponclasses = $this->weaponclasses->getCompetitionWeaponclasses($competitionsId);
        return response()->json(['weaponclasses'=>$weaponclasses]);
    }
}
