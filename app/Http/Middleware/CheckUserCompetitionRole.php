<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;

class CheckUserCompetitionRole
{
    public function __construct(Guard $auth)
    {
        $this->auth = $auth;
    }
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next, $role=null)
    {
        $user = \Auth::user();
        if(!$user->is_admin):
            $query =\DB::table('competitions_admins');
            $query->select('role');
            $query->where('competitions_id', $request->competitionsId);
            $query->where('users_id', $user->id);
            if($role):
                $query->where(function($query) use ($role) {
                    $query->where('role', 'admin');
                    $query->orWhere('role', $role);
                });
            endif;
            $role = $query->first();
            if(!$role):
                return response()->json([
                    'error' => 'user_is_not_admin',
                    'message' => _('Du är ej administratör.')
                ], 401);
            endif;
        endif;
        return $next($request);
    }
}
