<?php namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class ErrorHandler extends Model {

    /**
     * The available error messages.
     *
     * @return array
     */
    public static function errorMessages()
    {
        return [
            'default' => _('Ett fel inträffade. Vänligen försök igen.')
        ];
    }

    /**
     * Returns the error message for given error type.
     *
     * @param  string  $type
     * @return string
     */
    public static function getErrorMessage($type = 'default')
    {
        return \App\Models\ErrorHandler::errorMessages()[$type];
    }

    /**
     * Template for sending the error report for frontend errors to administrators.
     *
     * @param  string  $error
     * @param  string  $cause
     * @return boolean
     */
    public static function sendFrontendErrorReport($error, $cause)
    {
        $data = [];

        $data['section'] 	= 'frontend';
        $data['ip'] 		= \Request::server('REMOTE_ADDR');
        $data['server'] 	= \Request::server('HTTP_HOST');
        $data['url'] 		= \Request::server('REQUEST_URI');

        try {

            if($user = \JWTAuth::parseToken()->authenticate()):
                $data['user'] 		= $user;
            else:
                $data['user'] = new \App\Models\User;
            endif;
        } catch (JWTException $e) {
                $data['user'] = new \App\Models\User;
        }

        $data['error'] 		= $error;
        $data['cause'] 		= $cause;

        \Mail::send('emails.error', $data, function($message) use($data)
        {
            $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
            $message->to(env('MAIL_USERNAME'));
            $message->subject(env('APP_NAME').' error');
        });
        return true;
    }

    /**
     * Template for sending the error report for backend errors to administrators.
     *
     * @param  exception  $exception
     * @return boolean
     */
    public static function sendBackendErrorReport($exception)
    {
        $data = [];

        $data['section'] 	= 'backend';

        // Add the exception class name, message and stack trace to response
        $data['exceptionType'] = get_class($exception);
        #$data['statusCode'] = $exception->getStatusCode();
        $data['exception'] 	= $exception;

        $data['ip'] 		= \Request::server('REMOTE_ADDR');
        $data['server'] 	= \Request::server('HTTP_HOST');
        $data['url'] 		= \Request::server('REQUEST_URI');
        if($user = \Auth::user()):
            $data['user'] 		= \Auth::user();
        else:
            $data['user'] = new \App\Models\User;
        endif;

        \Mail::send('emails.error', $data, function($message) use($data)
        {
            $message->from(env('MAIL_USERNAME'), env('MAIL_FROM'));
            $message->to(env('MAIL_USERNAME'));
            $message->subject(env('APP_NAME').' error');
        });

        return true;
    }

}