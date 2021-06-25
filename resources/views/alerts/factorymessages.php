<ul class="list-unstyled hide" ng-class="{'show': errorMessage}">
	<li class="alert alert-danger margin-bottom-5 text-center">
		<i class="fa fa-info-circle"></i> <span ng-bind-html="errorMessage | renderHTMLCorrectly"></span>
	</li>
</ul>

<ul class="list-unstyled hide" ng-class="{'show': successMessage}">
	<li class="alert alert-success margin-bottom-5 text-center">
        <i class="fa fa-info-circle"></i> <span ng-bind-html="successMessage | renderHTMLCorrectly"></span>
	</li>
</ul>


<ul class="list-unstyled hide" ng-class="{'show': errorMessages.length}">
	<li class="alert alert-danger margin-bottom-5 text-center">
		<div ng-repeat="message in errorMessages track by $index"><i class="fa fa-info-circle"></i> <% message %></div>
	</li>
</ul>

<ul class="list-unstyled hide" ng-class="{'show': successMessages.length}">
	<li class="alert alert-success margin-bottom-5 text-center" ng-repeat="message in successMessages track by $index">
		<i class="fa fa-info-circle"></i> <% message %>
	</li>
</ul>
