<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\Guard;

class CheckUserActive
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
        if($this->auth->user()->activation_code && $this->auth->user()->created_at < date('Y-m-d H:i:s', strtotime('-2 weeks'))) {
            return response()->json(['error' => 'user_inactive', 'message' => _('Din e-postadress har inte aktiverats ännu. Du bör ha ett e-postmeddelande innehållande en aktiveringslänk.')], 401);
        } elseif ($this->auth->user()->deleted_at) {
            return response()->json(['error' => 'user_inactive', 'message' => _('Ditt konto har inaktiverats. Ta kontakt med vår kundsupport om du vill återaktivera ditt konto.')], 401);
        }
        return $next($request);
    }
}
