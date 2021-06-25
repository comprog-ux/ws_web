<?php

namespace App\Http\Middleware;

use Closure;
use BrowserDetect;

class BrowserCheck
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle($request, Closure $next)
    {

        if(
            BrowserDetect::isIEVersion(6)
            || BrowserDetect::isIEVersion(7)
            || BrowserDetect::isIEVersion(8)
            || BrowserDetect::isIEVersion(9)
        )
        return view()->make('browser');

        return $next($request);
    }
}
