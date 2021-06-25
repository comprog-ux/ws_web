<?php
namespace App\Repositories;

use Illuminate\Support\Facades\App;
use Illuminate\Http\Request;
use App\Models\Weaponclass;
use App\Models\Competition;

class WeaponclassRepository
{
    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function getCompetitionWeaponclasses($competitionsId)
    {
        $competition = Competition::with(['Weaponclasses'=>function($query){
            $query->orderBy('id');
        }])->find($competitionsId);
        return $competition->Weaponclasses;
    }

    public function updateWeaponclass($competitionsId, $weaponclassId)
    {
        if($competition = Competition::find($competitionsId)):
            $competition->Weaponclasses()->updateExistingPivot($weaponclassId, ['registration_fee' => $this->request->get('pivot')['registration_fee']]);
        endif;
        return $competition->fresh()->Weaponclasses;
    }

    public function storeWeaponclass($competitionsId)
    {
        if($competition = Competition::find($competitionsId)):
            $weaponclassId = $this->request->get('weaponclasses_id');
            if(!$competition->Weaponclasses->contains($weaponclassId)):
                $competition->Weaponclasses()->attach($weaponclassId, ['registration_fee' => $this->request->get('registration_fee')]);
            endif;
            return $competition->fresh()->Weaponclasses;
        endif;
    }

    public function deleteWeaponclass($competitionsId, $weaponclassId)
    {
        if($competition = Competition::whereDoesntHave('Signups', function($query) use ($weaponclassId) {
            $query->where('weaponclasses_id', $weaponclassId);
        })->find($competitionsId)):
            if($competition->Weaponclasses->contains($weaponclassId)):
                $competition->Weaponclasses()->detach($weaponclassId);
                return $competition->fresh()->Weaponclasses;
            endif;
        endif;

    }
}