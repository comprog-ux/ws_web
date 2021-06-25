<?php

namespace App\Http\Controllers\Api\Admin;

use App\Models\District;
use Illuminate\Http\Request;
use App\Models\Club;

use App\Http\Requests;

class AdminClubsController extends \App\Http\Controllers\Controller
{
    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index()
    {
        $searchstring = \Request::get('search');
        $hide_without_admins = \Request::get('hide_without_admins');
        $hide_without_users = \Request::get('hide_without_users');
        $hide_deleted = \Request::get('hide_deleted');
        $perPage = (\Request::has('per_page')) ? (int)\Request::get('per_page') : 10;

        $query = Club::with([
            'District'
        ]);
        if(!$hide_deleted) $query->withTrashed();
        if($searchstring) $query->search($searchstring);
        if($hide_without_admins == 1) $query->whereHas('Admins',function(){});
        if($hide_without_users == 1) $query->whereHas('Users',function(){});
        $query->orderBy('created_at', 'desc');
        $clubs = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if($clubs->currentPage() > $clubs->lastPage()):
            \Request::replace(['page'=>$clubs->lastPage()]);
            $clubs = $query->paginate($perPage);
        endif;

        $clubs->makeVisible([
            'created_at',
            'deleted_at',
            'users_count',
            'admins_count'
        ]);

        $clubs = $clubs->toArray();
        $clubs['search'] = $searchstring;
        $clubs['hide_without_admins'] = $hide_without_admins;
        $clubs['hide_without_users'] = $hide_without_users;
        $clubs['hide_deleted'] = $hide_deleted;
        $clubs['search'] = $searchstring;

        return response()->json(['clubs' => $clubs]);
    }

    public function show($id)
    {
        $club = Club::withTrashed()->findOrFail($id);
        if (\Auth::user()->is_admin):
            $club->makeVisible([
                'created_at',
                'updated_at',
                'deleted_at',
                'users_count',
                'admins_count',
                'competitions_count',
                'signups_count'
            ]);
            $club->load(
                'District',
                'Users',
                'Admins',
                'InvoicesIncoming',
                'InvoicesOutgoing',
                'Signups',
                'Signups.User',
                'Signups.Competition',
                'Signups.Weaponclass',
                'Signups.Invoice',
                'Teams',
                'Teams.Weapongroup',
                'Teams.Competition',
                'Teams.Signups',
                'Teams.Signups.Weaponclass',
                'Teams.Signups.User',
                'Teams.Invoice'
            );
            $club->Users->makeVisible(['id', 'email', 'phone', 'mobile', 'birthday', 'shooting_card_number', 'active', 'created_at']);
            $club->Admins->makeVisible(['id', 'email', 'phone', 'mobile', 'birthday', 'shooting_card_number', 'active', 'created_at']);
        endif;
        $districts = District::orderBy('districts_nr')->select('id','name','districts_nr')->get();
        return response()->json(['club' => $club, 'districts'=>$districts]);
    }


    public function update(Request $request, $id)
    {
        $club = Club::findOrFail($id);
        $data = $request->all();
        if($club):
            $club->update($data);

            $club->makeVisible(['created_at', 'updated_at']);
            $club->load(
                'District',
                'Users',
                'Admins',
                'InvoicesIncoming',
                'InvoicesOutgoing',
                'Signups',
                'Signups.User',
                'Signups.Competition',
                'Signups.Weaponclass',
                'Signups.Invoice',
                'Teams',
                'Teams.Weapongroup',
                'Teams.Competition',
                'Teams.Signups',
                'Teams.Signups.Weaponclass',
                'Teams.Signups.User',
                'Teams.Invoice'
            );
            $club->Users->makeVisible(['id', 'email', 'phone', 'mobile', 'birthday', 'shooting_card_number', 'active', 'created_at']);
            $club->Admins->makeVisible(['id', 'email', 'phone', 'mobile', 'birthday', 'shooting_card_number', 'active', 'created_at']);
            $districts = District::orderBy('districts_nr')->select('id','name','districts_nr')->get();
            return response()->json(['club' => $club, 'districts'=>$districts]);
        endif;
    }

    /**
     * Merge two clubs by given ids.
     * Move all connected club admins.
     * Move all connected club premiums.
     * Move all connected competitions.
     * Move all connected competition organizers.
     * Move all connected invoices.
     * Move all connected signups.
     * Move all connected competitors.
     * Move all connected teams.
     * Move all connected users.
     * Copy info from replaced club if missing in taarget.
     * Delete the replaced club.
     *
     * @return mixed
     */
    public function mergeClubs(Request $request)
    {
        if($request->has('clubsIdFrom') && $request->has('clubsIdTo')):
            $clubFrom = Club::findOrFail($request->get('clubsIdFrom'));
            $clubTo = Club::findOrFail($request->get('clubsIdTo'));
            if(($clubFrom && $clubTo) && ($clubFrom->id != $clubTo->id)):

                \DB::transaction(function () use ($clubFrom, $clubTo) {

                    \DB::table('clubs_admins')
                        ->where('clubs_id', $clubFrom->id)
                        ->update(['clubs_id'=>$clubTo->id]);

                    \DB::table('clubs_premium')
                        ->where('clubs_id', $clubFrom->id)
                        ->update(['clubs_id'=>$clubTo->id]);

                    \DB::table('competitions')
                        ->where('clubs_id', $clubFrom->id)
                        ->update(['clubs_id'=>$clubTo->id]);

                    \DB::table('competitions')
                        ->where('invoices_recipient_type', 'App\Models\Club')
                        ->where('invoices_recipient_id', $clubFrom->id)
                        ->update(['invoices_recipient_id'=>$clubTo->id]);

                    \DB::table('competitions_organizers')
                        ->where('clubs_id', $clubFrom->id)
                        ->update(['clubs_id'=>$clubTo->id]);

                    \DB::table('competitions_signups')
                        ->where('clubs_id', $clubFrom->id)
                        ->update(['clubs_id'=>$clubTo->id]);

                    \DB::table('invoices')
                        ->where('recipient_type', 'App\Models\Club')
                        ->where('recipient_id', $clubFrom->id)
                        ->update(['recipient_id'=>$clubTo->id]);

                    \DB::table('invoices')
                        ->where('sender_type', 'App\Models\Club')
                        ->where('sender_id', $clubFrom->id)
                        ->update(['sender_id'=>$clubTo->id]);

                    \DB::table('teams')
                        ->where('clubs_id', $clubFrom->id)
                        ->update(['clubs_id'=>$clubTo->id]);

                    \DB::table('users_clubs')
                        ->where('clubs_id', $clubFrom->id)
                        ->update(['clubs_id'=>$clubTo->id]);

                    $clubTo->clubs_nr = ($clubTo->clubs_nr) ? $clubTo->clubs_nr : $clubFrom->clubs_nr;
                    $clubTo->name = ($clubTo->name) ? $clubTo->name : $clubFrom->name;
                    $clubTo->email = ($clubTo->email) ? $clubTo->email : $clubFrom->email;
                    $clubTo->phone = ($clubTo->phone) ? $clubTo->phone : $clubFrom->phone;
                    $clubTo->address_street = ($clubTo->address_street) ? $clubTo->address_street : $clubFrom->address_street;
                    $clubTo->address_street_2 = ($clubTo->address_street_2) ? $clubTo->address_street_2 : $clubFrom->address_street_2;
                    $clubTo->address_zipcode = ($clubTo->address_zipcode) ? $clubTo->address_zipcode : $clubFrom->address_zipcode;
                    $clubTo->address_city = ($clubTo->address_city) ? $clubTo->address_city : $clubFrom->address_city;
                    $clubTo->address_country = ($clubTo->address_country) ? $clubTo->address_country : $clubFrom->address_country;
                    $clubTo->bankgiro = ($clubTo->bankgiro) ? $clubTo->bankgiro : $clubFrom->bankgiro;
                    $clubTo->postgiro = ($clubTo->postgiro) ? $clubTo->postgiro : $clubFrom->postgiro;
                    $clubTo->swish = ($clubTo->swish) ? $clubTo->swish : $clubFrom->swish;
                    $clubTo->save();

                    $clubFrom->delete();
                });

            endif;

            return response()->json(['message'=>_('Föreningarna är sammanfogade')]);
        else:
            return response()->json(['message'=>_('Du behöver välja två föreningar som ska sammanfogas')], 404);
        endif;
    }

    public function search(Request $request)
    {
        $clubs = Club::search($request->get('searchQuery'))->limit(10)->get();
        $clubs->makeVisible([
            'users_count',
            'admins_count',
            'competitions_count',
            'signups_count',
            'created_at'
        ]);
        return response()->json(['clubs' => $clubs]);
    }



}