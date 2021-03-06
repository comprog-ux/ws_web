<?php

namespace App\Exceptions;

use App\Models\ErrorHandler;
use Exception;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use League\OAuth2\Server\Exception\OAuthServerException;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that should not be reported.
     *
     * @var array
     */
    protected $dontReport = [
        \Illuminate\Auth\AuthenticationException::class,
        \Illuminate\Auth\Access\AuthorizationException::class,
        #\Symfony\Component\HttpKernel\Exception\HttpException::class,
        #\Illuminate\Database\Eloquent\ModelNotFoundException::class,
        \Illuminate\Session\TokenMismatchException::class,
        \Illuminate\Validation\ValidationException::class,
        \League\OAuth2\Server\Exception\OAuthServerException::class,
    ];

    /**
     * Report or log an exception.
     *
     * This is a great spot to send exceptions to Sentry, Bugsnag, etc.
     *
     * @param  \Exception  $exception
     * @return void
     */
    public function report(Exception $exception)
    {
        if(!in_array(get_class($exception), $this->dontReport) && env('APP_REPORT_ERROR', false)):

            //Send to Sentry
            if(\Auth::id()):
                app('sentry')->set_user_data(\Auth::id(), \Auth::user()->email, ['name'=>\Auth::user()->name, 'lastname'=>\Auth::user()->lastname]);
            endif;
            app('sentry')->captureException($exception);

            if(env('APP_SEND_ERROR_MAIL', false)):
                ErrorHandler::sendBackendErrorReport($exception);
            endif;
        endif;

        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Exception  $exception
     * @return \Illuminate\Http\Response
     */
    public function render($request, Exception $exception)
    {
        if(env('APP_DEBUG')):
            return parent::render($request, $exception);
        else:
            $message = ErrorHandler::getErrorMessage('default');
            return response()->json(['message' => $message], 500);
        endif;
    }

    /**
     * Convert an authentication exception into an unauthenticated response.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Illuminate\Auth\AuthenticationException  $exception
     * @return \Illuminate\Http\Response
     */
    protected function unauthenticated($request, AuthenticationException $exception)
    {
        if ($request->expectsJson()) {
            return response()->json(['error' => 'unauthenticated'], 401);
        }

        return redirect()->guest('login');
    }
}
