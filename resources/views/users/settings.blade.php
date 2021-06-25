@extends('app')

@section('content')

	<div ng-controller="UserController" ng-init="load(undefined, {{\Auth::id()}});">

		<div class="row">
			<div class="col-sm-12">
				<h1 class="margin-0 text-light pull-left">{{_('Din profil')}}</h1>
			</div>
		</div>

		{{-- Loader. --}}
		<div class="row hide" ng-class="{'show': loadingUsers}">
			<div class="col-sm-12 text-center">
				<img src="{{asset('img/loader.gif')}}" alt="{{_('Laddar')}}">
			</div>
		</div>
	
		<div class="well well-white hide margin-top-20" ng-class="{'show': user}">
			
			{{-- Name. --}}
			<div class="row">
				<div class="col-xs-3 text-right padding-top-10">
					<label>{{_('Namn')}}</label>
				</div>
				<div class="col-sm-7 col-xs-6 break-word">
					<div class="margin-top-10" ng-if="editSetting !== 'name'"><% user.name %></div>
					
					{{-- EDITING. --}}
					<span ng-show="editSetting === 'name'">
						<input type="text" 
							class="form-control input-lg margin-top-5 margin-bottom-10" 
							ng-model="user.name" 
							ng-enter="save(user, 'name');">
						
						<a class="btn btn-success" ng-click="save(user, 'name');" ng-class="{'disabled': saving === 'name'}">
							<span ng-show="saving !== 'name'">{{_('Spara')}}</span>
							<span ng-show="saving === 'name'">{{_('Sparar')}}...</span>
						</a>
						<a class="margin-left-10" ng-click="editSetting = '';">{{_('Avbryt')}}</a>
					</span>
				</div>
				<div class="col-sm-2 col-xs-3 text-right">
					<a class="btn btn-success" ng-click="editSetting = 'name'" ng-show="editSetting !== 'name'">
						<i class="fa fa-edit"></i>
					</a>
				</div>
			</div>
			
			<hr>
			
			{{-- Email. --}}
			<div class="row">
				<div class="col-xs-3 text-right padding-top-10">
					<label>{{_('E-postadress')}}</label>
				</div>
				<div class="col-sm-7 col-xs-6 break-word">
					<div class="margin-top-10" ng-if="editSetting !== 'email'"><% user.email %></div>
					
					{{-- EDITING. --}}
					<span ng-show="editSetting === 'email'">
						<input type="text" 
							class="form-control input-lg margin-top-5 margin-bottom-10" 
							ng-model="user.email"
							ng-enter="save(user, 'email');">
							
						<input type="text" 
							class="form-control input-lg margin-top-5 margin-bottom-10" 
							ng-model="user.email_confirmation" 
							ng-enter="save(user, 'email');"
							placeholder="{{_('Bekräfta e-postadress')}}">
						
						<a class="btn btn-success" ng-click="save(user, 'email');" ng-class="{'disabled': saving === 'email'}">
							<span ng-show="saving !== 'email'">{{_('Spara')}}</span>
							<span ng-show="saving === 'email'">{{_('Sparar')}}...</span>
						</a>
						<a class="margin-left-10" ng-click="editSetting = '';">{{_('Avbryt')}}</a>
					</span>
				</div>
				<div class="col-sm-2 col-xs-3 text-right">
					<a class="btn btn-success" ng-click="editSetting = 'email'" ng-show="editSetting !== 'email'">
						<i class="fa fa-edit"></i>
					</a>
				</div>
			</div>
			
			<hr>
			
			{{-- Password. --}}
			<div class="row">
				<div class="col-xs-3 text-right padding-top-10">
					<label>{{_('Lösenord')}}</label>
				</div>
				<div class="col-sm-7 col-xs-6 break-word">
					<div class="margin-top-10" ng-if="editSetting !== 'password'">*****</div>
				
					<span ng-show="editSetting === 'password'">
						<input type="password" 
							class="form-control input-lg margin-top-5 margin-bottom-10" 
							ng-model="user.current_password"
							ng-enter="save(user, 'password');"
							placeholder="{{_('Nuvarande lösenord')}}">
						
						<input type="password" 
							class="form-control input-lg margin-top-5 margin-bottom-10" 
							ng-model="user.password"
							ng-enter="save(user, 'password');"
							placeholder="{{_('Nytt lösenord')}}">
							
						<input type="password" 
							class="form-control input-lg margin-top-5 margin-bottom-10" 
							ng-model="user.password_confirmation" 
							ng-enter="save(user, 'password');"
							placeholder="{{_('Bekräfta nytt lösenord')}}">
						
						<a class="btn btn-success" ng-click="save(user, 'password');" ng-class="{'disabled': saving === 'password'}">
							<span ng-show="saving !== 'password'">{{_('Spara')}}</span>
							<span ng-show="saving === 'password'">{{_('Sparar')}}...</span>
						</a>
						<a class="margin-left-10" ng-click="editSetting = '';">{{_('Avbryt')}}</a>
					</span>
				</div>
				<div class="col-sm-2 col-xs-3 text-right">
					<a class="btn btn-success" ng-click="editSetting = 'password'" ng-show="editSetting !== 'password'">
						<i class="fa fa-edit"></i>
					</a>
				</div>
			</div>
			
			{{-- Disable langular temporarly
			<hr>
		
			<div class="row">
				<div class="col-xs-3 text-right padding-top-10">
					<label>{{_('Språk')}}</label>
				</div>
				<div class="col-sm-7 col-xs-6 break-word">
					
					<div class="margin-top-10" ng-if="editSetting !== 'language'">
						<span ng-if="!user.newLang">
							{{\Session::get('lang.label')}}
						</span>
						<span ng-if="user.newLang">
							<% user.newLang.label %>
						</span>
					</div>
					
					<span ng-show="editSetting === 'language'">
						<div class="dropdown margin-bottom-10 margin-top-5">
							<button class="btn btn-default dropdown-toggle" type="button" id="langSelection" data-toggle="dropdown" aria-expanded="true">
								
								<span ng-if="!user.newLang">
									{{\Session::get('lang.label')}}
								</span>
								<span ng-if="user.newLang">
									<% user.newLang.label %>
								</span>
								
								<span class="caret"></span>
							</button>
							<ul class="dropdown-menu" role="menu" aria-labelledby="langSelection">
								@foreach(\App\Languages::allowedLanguages() as $code => $label)
									<li>
										<a ng-click="user.language = '{{$code}}'; user.newLang = {'code': '{{$code}}', 'label': '{{$label}}'}">
											{{$label}}
										</a>
									</li>
								@endforeach
							</ul>
						</div>
											
						<a class="btn btn-success" ng-click="save(user, 'language');" ng-class="{'disabled': saving === 'language'}">
							<span ng-show="saving !== 'language'">{{_('Spara')}}</span>
							<span ng-show="saving === 'language'">{{_('Sparar')}}...</span>
						</a>
						<a class="margin-left-10" ng-click="editSetting = '';">{{_('Avbryt')}}</a>
					</span>
				</div>
				<div class="col-sm-2 col-xs-3 text-right">
					<a class="btn btn-success" ng-click="editSetting = 'language'" ng-show="editSetting !== 'language'">
						<i class="fa fa-edit"></i>
					</a>
				</div>
			</div>
			--}}
		</div>
	</div>

@stop