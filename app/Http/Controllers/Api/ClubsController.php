<?php

namespace App\Http\Controllers\Api;

use App\Models\District;
use Illuminate\Http\Request;
use App\Models\Club;
use App\Models\UserClubChange;
use \Storage;

use App\Http\Requests;

class ClubsController extends \App\Http\Controllers\Controller
{

    public function update(Request $request)
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();

        if($club->user_has_role != 'admin') return response()->json(_('Du behöver ha administratörsbehörighet för din förening för att göra en laganmälan'), 403);

        $data = $request->all();

        if($club):
            // Store the logo.
            if($request->file('logo')){
                $file     = $request->file('logo');
                $filename = str_slug($club->name).'-logo.'.$file->getClientOriginalExtension();
                Storage::disk('local')->put('public/clubs/' . $club->id.'/'.$filename, file_get_contents($file));
                $data['logo'] = $filename;
            }

            $club->update($data);
            return response()->json('Din förening har uppdaterats');
        endif;
    }

    public function search(Request $request)
    {
        $clubs = Club::search($request->get('searchQuery'))->limit(10)->get();
        return response()->json(['clubs' => $clubs]);
    }

    public function getUserClub()
    {
        $user = \Auth::user();
        $club = $user->Clubs->first();
        if ($club):
            $club->load('Admins', 'Users', 'District');
            $club->Users->makeVisible(['email', 'shooting_card_number', 'active']);
        endif;
        $districts = District::orderBy('districts_nr')->select('id','name')->get();
        return response()->json(['club'=>$club, 'districts'=>$districts]);
    }

    public function addNewClub(Request $request)  
    {
        if ($request->has('clubs_nr') && $request->has('name')) {
            $club = Club::create(['name' => $request->get('name'), 'clubs_nr' => $request->get('clubs_nr')]);
            $user = \Auth::user();
            //Update the pivot table with deleted_at timestamps.
            \DB::table('users_clubs')->where('users_id', $user->id)->whereNull('users_clubs.deleted_at')->update(['deleted_at' => date('Y-m-d H:i:s')]);
            $user->Clubs()->attach($club->id);
            $user->load('Clubs');
            return response()->json($user->clubs->first());
        }
    }

    public function addUserToClubs(Request $request)
    {
        if (!$request->has('clubs_id')) return response()->json('Error', 404);

        if ($request->has('clubs_id')):

            if ($request->has('users_id')):
                $user = \App\Models\User::findOrFail($request->get('users_id'));
            else:
                $user = \Auth::user();
            endif;

            if ($club = \App\Models\Club::findOrFail($request->get('clubs_id'))):
                //Update the pivot table with deleted_at timestamps.
                \DB::table('users_clubs')->where('users_id', $user->id)->whereNull('users_clubs.deleted_at')->update(['deleted_at' => date('Y-m-d H:i:s')]);
                $user->Clubs()->attach($club->id);
                $user->load(['Clubs']);
                $club = $user->clubs->first();
                if ($club) $club->load('Admins');
                return response()->json($club);
            else:
                return response()->json('Error', 404);
            endif;

        endif;
    }
    
    public function addUserAsAdmin(Request $request)
    {
        if ($request->has('admin')):
            $user = \Auth::user();
            $club = $user->Clubs->first();
            $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
            $userId = $optimus->decode($request->get('admin'));

            if (\DB::table('clubs_admins')->where('clubs_id', $club->id)->where('users_id', $userId)->count()):
                return response()->json(['message' => _('Användaren finns redan registrerad som admin')], 403);
            endif;
            \DB::table('clubs_admins')->insert(['clubs_id' => $club->id, 'users_id' => $userId, 'role' => 'admin']);
            return response()->json(['message' => _('Användaren är tillagd')]);
        else:
            return response()->json(['message' => _('Du behöver välja en användare i lista')], 403);
        endif;
    }

    public function deleteUserAsAdmin(Request $request)
    {
        if ($request->has('admin')):
            $club = \Auth::user()->Clubs->first();
            if (!$club) return response()->json(['message' => _('Du har inte tillgång till vald förening')]);

            $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
            $userId = $optimus->decode($request->get('admin'));

            \DB::table('clubs_admins')->where('users_id', $userId)->where('clubs_id', $club->id)->delete();
            return response()->json(['message' > _('Användaren har tagits bort som administratör för din förening')]);
        endif;
    }
    
}