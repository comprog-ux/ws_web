@extends('app')

@section('content')

	<div ng-controller="UserController" ng-init="load();">
	
		<div class="row">
			<div class="col-sm-12">
				<h1 class="margin-0 text-light pull-left">{{_('Användare')}}</h1>
			</div>
		</div>

		{{-- Loader. --}}
		<div class="row hide" ng-class="{'show': loadingUsers}">
			<div class="col-sm-12 text-center">
				<img src="{{asset('img/loader.gif')}}" alt="{{_('Laddar')}}">
			</div>
		</div>
	
		<div class="well well-white hide margin-top-20" ng-class="{'show': users}">
			<div class="row">
				<div class="col-sm-12">
					<table class="table table-hover">
						<thead>
							<th>{{_('Namn')}}</th>
							<th>{{_('E-post')}}</th>
							<th>{{_('Registrerad')}}</th>
							<th></th>
						</thead>
						
						<tbody>
							<tr ng-repeat="user in users">
								<td>
									<% user.name %>
									<span class="label label-danger" ng-if="user.deleted_at">
										{{_('Radera')}}
									</span>
									<span class="label label-success" ng-if="user.is_admin">
										{{_('Administratör')}}
									</span>
									<span class="label label-warning" ng-if="!user.active">
										{{_('Inte activerad')}}
									</span>
								</td>
								<td><% user.email %></td>
								<td><% user.created_at | dateToISO | date : 'yyyy-MM-dd' %></td>
								<td>
									<div class="btn-group pull-right" ng-if="user.id !== {{\Auth::id()}}">
										<button type="button" class="btn btn-default btn-xs dropdown-toggle" data-toggle="dropdown" aria-expanded="false">
											<i class="fa fa-cog"></i> <span class="caret"></span>
										</button>
										<ul class="dropdown-menu" role="menu">
		
											{{-- Disable user account. --}}
											<li ng-if="user.deleted_at == null">
												<a ng-click="delete(user);">
													<i class="fa fa-exclamation-triangle"></i> {{_('Inaktivera konto')}}
												</a>
											</li>
											<li ng-if="user.deleted_at != null">
												<a ng-click="user.deleted_at = null; save(user, 'restore');">{{_('Återställ konto')}}</a>
											</li>
											
										</ul>
									</div>
								</td>
							</tr>
						</tbody>
					</table>
					
					<nav>
						<ul class="pagination">
							<li>
								<a aria-label="Previous" ng-click="(currentPage > 1) ? load(currentPage-1) : null;">
									<span aria-hidden="true">&laquo;</span>
								</a>
							</li>
							<li ng-repeat="page in pages" ng-class="{'active': page.active}">
								<a ng-click="load(page.page);"><% page.page %></a>
							</li>
							<li>
								<a aria-label="Next" ng-click="(currentPage < lastPage) ? load(currentPage+1) : null;">
									<span aria-hidden="true">&raquo;</span>
								</a>
							</li>
						</ul>
					</nav>
					
				</div>
			</div>
		</div>

		<div class="well well-white">
			<div class="row">
				<div class="col-sm-12">
					<h1 class="margin-0 text-light pull-left">{{_('Inbjudningar')}}</h1>
				</div>
			</div>
			<table class="table table-hover" ng-class="{'hide':!invites.length}">
				<thead>
					<th>{{_('Namn')}}</th>
					<th>{{_('E-post')}}</th>
					<th>{{_('Skickat')}}</th>
				</thead>
				
				<tbody>
					<tr ng-repeat="invite in invites">
						<td>
							<% invite.name %>
							<span class="label label-success" ng-if="invite.is_admin">
								{{_('Administratör')}}
							</span>
						</td>
						<td><% invite.email %></td>
						<td><% invite.created_at | dateToISO | date : 'yyyy-MM-dd' %></td>
					</tr>
				</tbody>
			</table>
			<hr class="hide" ng-class="{'show':invites.length}">
			<div class="row margin-top-20">
				<div class="col-sm-12">
					<span class="btn btn-primary" ng-click="openUserInviteModal()">{{_('Bjud in en ny användare')}}</span>
				</div>
			</div>
		</div>
		
	</div>
<script type="text/ng-template" id="userInviteModal.html">
	<div class="modal-header">
		<h3 class="margin-0">{{_('Bjud in en ny användare')}}</h3>
	</div>
	<div class="modal-body">
		<ul class="list-unstyled hide" ng-class="{'show': errorMessage}">
			<li class="alert alert-danger margin-bottom-5 text-center" ng-repeat="message in errorMessage">
				<i class="fa fa-info-circle"></i> <% message[0] %>
			</li>
		</ul>
		
		<form>
			<div class="form-group">
				<label>{{_('Namn')}}</label>
				<input type="text" class="form-control input-lg" ng-model="invite.name">
			</div>
			<div class="form-group">
				<label>{{_('E-mail')}}</label>
				<input type="text" class="form-control input-lg" ng-model="invite.email">
			</div>
			<div class="form-group">
				<button type="button" class="btn btn-lg" ng-class="{'btn-success': invite.is_admin, 'btn-default': invite.is_admin != '1' }" ng-model="invite.is_admin" btn-checkbox btn-checkbox-true="1" btn-checkbox-false="0"><span><i class="fa fa-check margin-right-5" ng-class="{'hide':invite.is_admin != '1'}"></i>{{_('Administratör')}}</span></button>
			</div>
		</form>
	</div>
	<div class="modal-footer">
		<span class="btn btn-default" ng-click="closeModals()">{{_('Stäng')}}</span>
		<span class="btn btn-success" ng-click="userInvite()">{{_('Bjud in')}}</span>
	</div>
</script>

@stop