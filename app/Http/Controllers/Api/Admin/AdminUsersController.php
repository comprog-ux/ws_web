<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Jobs\ImportUsers;
use App\Jobs\SendActivationEmail;
use App\Models\User;
use Illuminate\Http\Request;
use \Storage;

class AdminUsersController extends Controller
{

    /**
     * Display a listing of the resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function index(\Request $request)
    {
        $searchstring = \Request::get('search');
        $status       = \Request::get('status');
        $perPage      = (\Request::has('per_page')) ? (int) \Request::get('per_page') : 10;

        $query = \App\Models\User::with('Clubs');
        $query->withTrashed();
        if ($searchstring) {
            $query->search($searchstring);
        }

        if ($status) {
            $query->filterByStatus($status);
        }

        $query->orderBy('created_at', 'desc');
        $users = $query->paginate($perPage);
        //If the last page is less then current page.
        // Set current last page as current page.
        if ($users->currentPage() > $users->lastPage()):
            \Request::replace(['page' => $users->lastPage()]);
            $users = $query->paginate($perPage);
        endif;

        $users->makeVisible([
            'id',
            'email',
            'shooting_card_number',
            'active',
            'created_at',
        ]);

        $users           = $users->toArray();
        $users['search'] = $searchstring;
        $users['status'] = $status;

        return response()->json(['users' => $users]);
    }

    /**
     * Show the form for creating a new resource.
     *
     * @return \Illuminate\Http\Response
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Illuminate\Http\Response
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function show($id)
    {
        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        $userId  = $optimus->decode($id);
        $user    = User::with([
            'Clubs',
            'Signups',
            'Signups.Competition',
            'Signups.Weaponclass',
            'InvoicesIncoming',
        ])->withTrashed()->find($userId);

        if ($user):
            $user->makeVisible([
                'active',
                'activation_code',
                'email',
                'no_shooting_card_number',
                'shooting_card_number',
                'birthday',
                'phone',
                'mobile',
                'gender',
                'grade_trackshooting',
                'grade_field',
                'created_at',
                'updated_at',
            ]);
        endif;
        return response()->json($user);}

    /**
     * Show the form for editing the specified resource.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function edit($id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function update(Request $request, $id)
    {
        $optimus = new \Jenssegers\Optimus\Optimus(env('OPTIMUS_PRIME'), env('OPTIMUS_INVERSE'), env('OPTIMUS_RANDOM'));
        $userId  = $optimus->decode($id);
        $user    = User::find($userId);

        if ($user):
            $data = $request->all();
            if ($request->has('set_no_shooting_card_number')) {
                $data['no_shooting_card_number'] = date('Y-m-d H:i:s');
            }

            if ($request->has('shooting_card_number')) {
                $data['no_shooting_card_number'] = null;
            }

            if ($request->has('set_no_email_address')) {
                $data['no_email_address'] = date('Y-m-d H:i:s');
            }

            if ($request->has('email')):
                $data['no_email_address'] = null;
                if ($data['email'] != $user->email):
                    $data['activation_code'] = md5($data['email'] . time());
                    $this->dispatch(new SendActivationEmail($user));
                endif;
            else:
                $data['active'] = 0;
            endif;

            $user->update($data);

            $clubIds = $request->has('club_ids') ? $request->club_ids : [];
            $user->Clubs()->sync($clubIds);            

            return response()->json(_('Användaren har uppdaterats'));
        endif;
    }

    /**
     * Remove the specified resource from storage.
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function destroy($id)
    {
        //
    }

    /**
     * Imports a file of users.
     *
     * @param  Request $request
     * @return response
     */
    public function import(Request $request)
    {
        $this->validate($request, ['file' => 'required|file|mimes:xlsx,xls']);

        // Store the file.
        $file     = $request->file('file');
        $filename = 'import-' . time() . '.xlsx';
        Storage::disk('local')->put('user-imports/' . $filename, file_get_contents($file));

        // Fire the import job with the stored filename.
        dispatch(new ImportUsers($filename, auth()->user()));

        return response()->json([
            'message' => _('Listan kommer importeras i bakgrunden. Du kommer få ett mail när den är färdig.'),
        ]);
    }
}
