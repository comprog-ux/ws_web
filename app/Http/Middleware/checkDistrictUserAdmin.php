<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;

class checkDistrictUserAdmin
{
    /**
     * The Guard implementation.
     *
     * @var Guard
     */
    protected $auth;

    /**
     * Create a new filter instance.
     *
     * @param  Guard  $auth
     * @return void
     */
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
    public function handle($request, Closure $next)
    {
        $exists = \DB::table('districts_admins')
                ->whereUsersId($this->auth->user()->id)
                ->whereDistrictsId($request->district)
                ->whereRole('admin')
                ->count() > 0;
        if(!$exists):
            return response()->json(['message'=>_('Du behöver ha administratörsbehörighet för denna krets')], 403);
        else:
            return $next($request);
        endif;
    }
}
