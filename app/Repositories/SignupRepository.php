<?php
namespace App\Repositories;

use Illuminate\Support\Facades\App;
use Illuminate\Http\Request;
use App\Models\Signup;

class SignupRepository
{
    public function __construct(Request $request)
    {
        $this->request = $request;
    }

    public function getCompetitionSignups($competitionId)
    {
        $query = Signup::where('competitions_id', $competitionId);
        $query->with([
            'Weaponclass',
            'User',
            'Club'
        ]);
        $query->where('patrols_id', 0);
        return $query->get();
    }

    public function loadCollidingSignups($signups, $date)
    {
        $signups->each(function ($signup, $key) use ($date) {
            //Load all colliding signups per signups.
            $signup->load([
                'CollidingSignups' => function ($query) use ($date) {
                    #$query->where('patrols_id', '!=', 0);
                    $query->whereHas('Competition', function ($query) use ($date) {
                        $query->where('date', $date);
                    });
                },
                'PossibleFinals' => function ($query) use ($date) {
                    #$query->where('patrols_id', '!=', 0);
                    $query->whereHas('Competition', function ($query) use ($date) {
                        $query->where('final_time','!=','00:00:00');
                        $query->where('date', $date);
                    });
                },
                'CollidingSignups.Weaponclass',
                'CollidingSignups.Competition',
                'PossibleFinals.Weaponclass',
                'PossibleFinals.Competition',
            ]);
        });
    }

    public function update($competitonsId, $signupsId)
    {
        $signup = Signup::where('competitions_id', $competitonsId)->find($signupsId);
        $signup->update($this->request->all());
        return $signup->fresh();
    }
}