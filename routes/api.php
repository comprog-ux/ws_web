<?php

use Illuminate\Http\Request;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::post('/auth/register', ['as'=>'auth.register', 'uses'=>'AuthenticateController@register']);

Route::group(['prefix'=>'v'.env('API_VERSION')], function(){
    Route::post('activate', 'AuthenticateController@activate');
    Route::post('register', 'AuthenticateController@register');
    #Route::post('refresh', 'AuthenticateController@refresh');
    Route::post('password/email', 'PasswordController@postEmail');
    Route::post('password/reset', 'PasswordController@postReset');

    Route::group(['prefix'=>'public'], function(){
    Route::resource('competitions', 'PublicCompetitionsController', ['only' => ['index', 'show']]);
    });


    Route::group(['middleware'=>['auth:api', 'checkUserActive']], function(){
 
        Route::get('authenticate/user', 'AuthenticateController@getAuthenticatedUser');
        Route::put('authenticate/user', 'AuthenticateController@updateAuthenticatedUser');
        Route::put('authenticate/updatePassword', 'AuthenticateController@updatePassword');
        Route::post('authenticate/cancelAccount', 'AuthenticateController@cancelAccount');
        Route::get('users/invite', 'AuthenticateController@getInvite');
        Route::post('users/invite', 'AuthenticateController@sendInvite');
        Route::put('clubs', ['as'=>'clubs.update', 'uses'=>'ClubsController@update']);
        Route::get('clubs/getUserClub', ['as'=>'clubs.getUserClub', 'uses'=>'ClubsController@getUserClub']);
        Route::post('clubs/addNewClub', ['as'=>'clubs.addNewClub', 'uses'=>'ClubsController@addNewClub']);
        Route::post('clubs/addUserToClubs', ['as'=>'clubs.addUserToClubs', 'uses'=>'ClubsController@addUserToClubs']);
        Route::post('clubs/addUserAsAdmin', ['as'=>'clubs.addUserAsAdmin', 'uses'=>'ClubsController@addUserAsAdmin']);
        Route::delete('clubs/deleteUserAsAdmin', ['as'=>'clubs.deleteUserAsAdmin', 'uses'=>'ClubsController@deleteUserAsAdmin']);
        Route::post('clubs/search', ['as'=>'clubs.search', 'uses'=>'ClubsController@search']);
        Route::resource('users/{id}/clubChanges', 'ClubChangeUserController', ['only' => ['index', 'store']]);
        Route::put('clubs/clubChanges/{id}/approve', 'ClubChangeController@approve');
        Route::put('clubs/clubChanges/{id}/cancel', 'ClubChangeController@cancel');
        Route::resource('clubs/clubChanges', 'ClubChangeController', ['only' => ['index', 'store']]);
        Route::post('users/{id}/initiateClubChange', 'ClubUsersController@initiateClubChange');
        Route::resource('users', 'ClubUsersController', ['only'=>['show', 'store', 'update']]);

        Route::resource('districts', 'DistrictsController', ['only'=>['index', 'show', 'update']]);
        Route::get('districts/{district}/invoices/print', 'DistrictsInvoicesController@downloadInvoiceList');
        Route::resource('districts/{district}/invoices', 'DistrictsInvoicesController', ['only'=>['index', 'show', 'update']]);
        Route::get('districts/{district}/invoices/{invoice}/download', 'DistrictsInvoicesController@download');

        Route::get('invoices/pendingsignups', 'InvoicesController@getPendingSignups');
        Route::get('invoices/{id}/download', 'InvoicesController@download');
        Route::resource('invoices', 'InvoicesController', ['only'=>['index', 'show', 'update', 'store']]);
        Route::get('clubinvoices/print', 'ClubInvoicesController@downloadInvoiceList');
        Route::get('clubinvoices/pendingsignups', 'ClubInvoicesController@getPendingSignups');
        Route::get('clubinvoices/{id}/download', 'ClubInvoicesController@download');
        Route::resource('clubinvoices', 'ClubInvoicesController', ['only'=>['index', 'show', 'update', 'store']]);

        /**
         * Temporairly disable premium registration.
         */
        Route::get('premium', ['as'=>'premium.index', 'uses'=>'PremiumController@index']);
        #Route::post('premium', ['as'=>'premium.store', 'uses'=>'PremiumController@store']);

        Route::resource('competitions', 'CompetitionsController', ['only' => ['index', 'show', 'create', 'store']]);
        Route::resource('competitions.patrols', 'CompetitionsPatrolsController', ['only' => ['index']]);
        Route::resource('competitions.teams', 'CompetitionsTeamsController', ['only' => ['index']]);
        Route::resource('competitions.signups', 'CompetitionsSignupsController', ['only' => ['index']]);
        Route::post('competitions/{competition}/results/export', 'CompetitionsResultsController@export');
        Route::resource('competitions.results', 'CompetitionsResultsController', ['only' => ['index']]);
        Route::resource('competitions.teamsignups', 'TeamsignupsController', ['only' => ['index', 'show', 'store', 'update', 'destroy']]);
        Route::resource('competitions.clubsignups', 'ClubSignupsController', ['only' => ['index']]);

        /**
         * Competitions Administration.
         */
        Route::group(['prefix'=>'competitions/{competitionsId}/admin'], function(){
            Route::get('', 'CompetitionsAdminController@index');
            Route::put('', 'CompetitionsAdminController@update');
            Route::post('close', 'CompetitionsAdminController@close');
            Route::get('signups', 'CompetitionsAdminSignupsController@index');
            Route::post('signups', 'CompetitionsAdminSignupsController@store');
            Route::put('signups/{signupId}/approve', 'CompetitionsAdminSignupsController@approveSignup');
            Route::delete('signups/{signupId}', 'CompetitionsAdminSignupsController@destroy');
            Route::put('signups/{signupId}', 'CompetitionsAdminPatrolsController@updateSignup');
            Route::get('users/{userId}', 'CompetitionsAdminUsersController@show');
            Route::get('users', 'CompetitionsAdminUsersController@index');
            Route::post('users', 'CompetitionsAdminUsersController@store');
            Route::get('invoices/{id}/download', 'CompetitionsAdminInvoiceController@download');
            Route::get('invoices/{invoice}', 'CompetitionsAdminInvoiceController@show');
            Route::post('invoice', 'CompetitionsAdminInvoiceController@store');
            Route::resource('teamsignups', 'CompetitionsAdminTeamsignupsController');

            Route::post('patrols/generate', 'CompetitionsAdminPatrolsController@generate');
            Route::post('patrols/generate/finals', 'CompetitionsAdminPatrolsController@generateFinalsPatrols');
            Route::post('patrols/generate/distinguish', 'CompetitionsAdminPatrolsController@generateDistinguishPatrols');
            Route::post('patrols/export', 'CompetitionsAdminPatrolsController@export');
            Route::get('patrols', 'CompetitionsAdminPatrolsController@index');
            Route::get('patrolsextended', 'CompetitionsAdminPatrolsController@getPatrolsExtended');
            Route::post('patrols', 'CompetitionsAdminPatrolsController@store');
            Route::post('patrols/{patrolId}/empty', 'CompetitionsAdminPatrolsController@emptyPatrol');
            Route::delete('patrols/signups', 'CompetitionsAdminPatrolsController@destroySignups');
            Route::delete('patrols/all', 'CompetitionsAdminPatrolsController@destroyAll');
            Route::delete('patrols/{patrolId}', 'CompetitionsAdminPatrolsController@destroy');
            Route::put('patrols/{patrolId}', 'CompetitionsAdminPatrolsController@update');
            Route::post('patrols/signups', 'CompetitionsAdminPatrolsController@storeSignups');

            Route::put('stations/{patrolId}', 'CompetitionsStationsController@update');
            Route::delete('stations/{patrolId}', 'CompetitionsStationsController@destroy');
            Route::get('stations', 'CompetitionsStationsController@index');
            Route::post('stations', 'CompetitionsStationsController@store');

            Route::put('weaponclasses/{weaponclassId}', 'CompetitionsAdminWeaponclassesController@update');
            Route::delete('weaponclasses/{weaponclassId}', 'CompetitionsAdminWeaponclassesController@destroy');
            Route::get('weaponclasses', 'CompetitionsAdminWeaponclassesController@index');
            Route::post('weaponclasses', 'CompetitionsAdminWeaponclassesController@store');

            Route::delete('admins/{id}', 'CompetitionsAdminAdminsController@destroy');
            Route::get('admins', 'CompetitionsAdminAdminsController@index');
            Route::post('admins', 'CompetitionsAdminAdminsController@store');

            Route::post('export/shootingcards', 'CompetitionsAdminController@exportShootingcards');
            Route::post('export/teams', 'CompetitionsAdminController@exportTeams');
            Route::post('export/signups', 'CompetitionsAdminController@exportSignups');
            Route::post('export/signups/xlsx', 'CompetitionsAdminController@exportSignupsAsXlsx');
            Route::post('results/export', 'CompetitionsAdminResultsController@export');
            Route::post('results/teams', 'CompetitionsAdminResultsController@exportTeamsResults');
            Route::post('results/registration', 'CompetitionsAdminResultsController@getResultsForRegistration');
            Route::post('results/registration', 'CompetitionsAdminResultsController@getResultsForRegistration');
            Route::put('results/registration', 'CompetitionsAdminResultsController@storeResults');
            Route::get('results/prices', 'CompetitionsAdminResultsPricesController@index');
            Route::put('results/prices/{price}', 'CompetitionsAdminResultsPricesController@update');
        });

        Route::get('championships/{championshipsId}/signups', 'ChampionshipsController@getSignups');
        Route::resource('championships', 'ChampionshipsController', ['only' => ['index', 'show', 'store']]);
        Route::resource('signup', 'SignupController', ['only' => ['index', 'show', 'store', 'update', 'destroy']]);
        Route::resource('results', 'ResultsController', ['only' => ['index']]);

        Route::get('map', 'Api\CompetitionsController@list');

        /**
         * System Administration
         */
        Route::group(['middleware'=>['checkUserAdmin'], 'prefix'=>'admin', 'namespace'=>'Admin'], function(){
            Route::get('dashboard', ['as'=>'admin.dashboard', 'uses'=>'AdminDashboardController@dashboard']);
            Route::resource('users', 'AdminUsersController', ['only'=>['index','show','update']]);
            Route::post('users/import', 'AdminUsersController@import');
            Route::resource('signups', 'AdminSignupsController', ['only'=>['index', 'show', 'update']]);
            Route::post('clubs/merge', ['as'=>'clubs.merge', 'uses'=>'AdminClubsController@mergeClubs']);
            Route::post('clubs/search', ['as'=>'clubs.search', 'uses'=>'AdminClubsController@search']);
            Route::resource('clubs', 'AdminClubsController', ['only'=>['index', 'show', 'update']]);
            Route::resource('districts', 'AdminDistrictsController', ['only'=>['index','show']]);
            Route::get('invoices/{id}/download', 'AdminInvoicesController@download');
            Route::resource('invoices', 'AdminInvoicesController', ['only'=>['index','show']]);

            Route::get('clubChanges', 'AdminClubChangesController@index');
            Route::put('clubChanges/{id}/approve', 'AdminClubChangesController@approve');
            Route::put('clubChanges/{id}/cancel', 'AdminClubChangesController@cancel');
        });
    });
    /**
     * Frontend error handling routes.
     */
    Route::post('error/report', function(){
        $error = (Request::exists('error')) ? Request::get('error') : 'unknown';
        $cause = (Request::exists('cause')) ? Request::get('cause') : 'unknown';

        if(env('APP_SEND_ERROR_MAIL', false)):
            \App\Models\ErrorHandler::sendFrontendErrorReport($error, $cause);
        endif;

        $message = \App\Models\ErrorHandler::getErrorMessage('default');

        return response()->json(['message' => $message]);
    });
});

/**
 * Frontend error handling routes.
 */
Route::post('error/report', function(){
    $error = (Request::exists('error')) ? Request::get('error') : 'unknown';
    $cause = (Request::exists('cause')) ? Request::get('cause') : 'unknown';

    if(env('APP_SEND_ERROR_MAIL', false)):
        \App\Models\ErrorHandler::sendFrontendErrorReport($error, $cause);
    endif;

    $message = \App\Models\ErrorHandler::getErrorMessage('default');

    return response()->json(['message' => $message]);
});

Route::group(['prefix'=>'v{api_version}'], function(){
    Route::any('/{path1?}/{path2?}/{path3?}/{path4?}/{path5?}/{path6?}/{path7?}/', function($api_version){
        if($api_version != env('API_VERSION')):
            return response()->json(['error'=>'api_version_update', 'message'=>_('Webshooter har uppdaterats med en ny version och laddas nu om.')], 404);
        else:
            return response()->json(['error'=>'page_not_found','message'=>_('Sidan kan inte hittas')], 404);
        endif;
    });
});

