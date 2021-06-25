var app = angular.module('app',
	[
		'angular-jwt',
		'ui.router',
		'ui.calendar',
		'ui.bootstrap',
		'ui.bootstrap.datetimepicker',
		'ui.sortable',
		'app.auth',
		'app.admin',
		'app.admin.clubs',
		'app.admin.users',
		'app.calendar',
		'app.championships',
		'app.clubs',
		'app.competitions',
		'app.dashboard',
		'app.errorhandler',
		'app.payments',
		'app.premium',
		'app.settings',
		'app.signups',
		'app.teams',
		'app.users'
	], ["$interpolateProvider", function($interpolateProvider){
		$interpolateProvider.startSymbol('<%');
		$interpolateProvider.endSymbol('%>');
}]);

app.run(["$rootScope", "$state", "$timeout", "ErrorHandlerFactory", "jwtHelper", "AuthFactory", "$window", "$location", function($rootScope, $state, $timeout, ErrorHandlerFactory, jwtHelper, AuthFactory, $window, $location) {

	$window.ga('create', 'UA-76221618-1', 'auto');
	
	$rootScope.$on('$stateChangeStart', function(e, to) {
		var token = localStorage.getItem('token');

		$rootScope.currentRoute = to.name;

		if(token !== null){
			$rootScope.authenticated = true;
			var user = JSON.parse(localStorage.getItem('user'));
			$rootScope.currentUser = user;
		}

		if((to.name.split(".", 1)[0] == 'auth') && $rootScope.authenticated){
			$state.go('dashboard', {}, {location:'replace'});
		}

		if (to.restricted) {

			// Restrict guarded routes.
			if (token === null) {
				e.preventDefault();
				$state.go('auth.login', {}, {location: 'replace'});
			}

			/*
			if (token !== null && jwtHelper.isTokenExpired(token)) {
				AuthFactory.attemptRefreshToken();
			}
			*/

			$rootScope.datepickerOptions = {
				showWeeks: true,
				startingDay: 1
			};
			$rootScope.timepickerOptions = {
				showMeridian: false,
				minuteStep: 15
			};

		}
		$rootScope.loadingState = '';

	});

	$rootScope.$on('$stateChangeSuccess', function (event) {
		$window.ga('send', 'pageview', $location.path());
	});

	/**
	 * Generates flash messages based on given array or string of messages.
	 * Hides every message after 5 seconds.
	 *
	 * @param  mixed  messages
	 * @param  string type
	 * @return void
	 */
	$rootScope.catchError = function(response)
	{
		// Reset all error- and success messages.
		$rootScope.errorMessages = [];
		$rootScope.successMessages = [];

		if(typeof response === 'string')
		{
			$rootScope.errorMessages.push(response);
		}
		else
		{
			console.log(response);
			if(response)
			{
				angular.forEach(response, function(errorMessage){
					var message = (typeof errorMessage === 'string') ? errorMessage : errorMessage[0];
					$rootScope.errorMessages.push(message);
				});

				console.log($rootScope.errorMessages);

				$timeout(function(){
					$rootScope.errorMessages = [];
				}, 5000);
			}
		}
	};


	$rootScope.displayFlashMessages = function(messages, type)
	{
		$timeout.cancel($rootScope.errorMessageTimer);
		$rootScope.errorMessages = [];
		$rootScope.successMessages = [];

		if(angular.isString(messages)) messages = [messages];

		var unwantedMessages = ['token_not_provided'];
		var icon = (type == 'success') ? 'check-circle' : 'info-circle';

		angular.forEach(messages, function(message){

			if(unwantedMessages.indexOf(message) < 0)
			{
				var text = (typeof message === 'string') ? message : message[0];
				if(type == 'error')
				{
					$rootScope.errorMessages.push(text);
				}
				else
				{
					$rootScope.successMessages.push(text);
				}
			}
		});

		$rootScope.errorMessageTimer = $timeout(function(){
			$rootScope.errorMessages = [];
			$rootScope.successMessages = [];
		}, 5000);
	};

	/**
	 * Global function for reporting top level errors. Makes an ajax call for sending a bug report.
	 * @param {object} error
	 * @param {string} cause
	 */
	$rootScope.reportError = function(error, cause)
	{
		if(!cause) cause = 'Frontend';
		if(error){
			ErrorHandlerFactory
				.reportError(error, cause)

				.then(function(response){
					if(response.message){
						if(response.message) $rootScope.displayFlashMessages([response.message], 'warning');
					} else if(response.data){
						if(response.data.message) $rootScope.displayFlashMessages([response.data.message], 'warning');
					}
				});
		}
	};
}]);
angular.module('app.admin.clubs', [])

    .controller("AdminClubsController", ["$rootScope", "$stateParams", "$state", "AdminClubsFactory", function($rootScope, $stateParams, $state, AdminClubsFactory){
    var self = this;

    self.filter = {
        search: '',
        hide_without_users: 1,
        hide_without_admins: null
    };

    self.hideClubsWithoutUsers = function(club){
        if(self.filter.hide_without_users && club.users_count){
            return club;
        }else if(!self.filter.hide_without_users){
            return club;
        }
    };
    self.hideClubsWithoutAdmins = function(club){
        if(self.filter.hide_without_admins && club.admins_count){
            return club;
        }else if(!self.filter.hide_without_admins){
            return club;
        }
    };

    function updatePage(page) {
        $rootScope.loadingState = true;
        AdminClubsFactory.load(page)
            .success(function(response){
                self.clubs = response.clubs;
                $rootScope.loadingState = false;
            });
    }
    function sortList() {}

    this.page = parseInt($stateParams.page, 10);
    this.sort = $stateParams.sort;
    this.sortOptions = ['upvotes', 'date', 'author'];
    sortList();
    updatePage();


    this.nextPage = function() {
        self.page++;
        updatePage(self.page);
        $state.go('.', {page: self.page}, {notify: false});
    };
    this.prevPage = function() {
        if (self.page > 0) {
            self.page--;
            updatePage(self.page);
            $state.go('.', {page: self.page}, {notify: false});
        }
    };
    this.sortChanged = function() {
        sortList();
        $state.go('.', {sort: self.sort}, {notify: false});
    };

}])
.controller("AdminClubController", ["$rootScope", "$scope", "$stateParams", "$state", "$timeout", "AdminClubsFactory", function($rootScope, $scope, $stateParams, $state, $timeout, AdminClubsFactory) {
    var self = this;
    self.searchQuery = '';
    self.selectedclub = {};

    if(!$stateParams.id) $state.go('admin.clubs');

    function find(){
        AdminClubsFactory.find($stateParams.id)
            .success(function(response){
                self.club = response.club;
            })
            .error(function(){
                $state.go('admin.clubs', {}, {location:'replace'});
            });
    }

    self.updateClub = function(club){
        self.state = 'updating';
        AdminClubsFactory.updateClub(club)
            .success(function(response){
                $rootScope.displayFlashMessages(response.message);
                self.clubs.clubs = response.clubs;
                self.state = 'updated';
                $state.go('club', ({id: club.id}));
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response.message, 'error');
            });
    };

    self.deleteClub = function(club){
        AdminClubsFactory.deleteClub(club)
            .success(function(response){
                $state.go('clubs');
            });
    };

    self.searchForClubs = function(searchQuery, club)
    {
        return AdminClubsFactory
            .searchForClubs(searchQuery)
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'warning');
            })
            .then(function(response){
                self.foundMatch = (response.data.clubs.length > 0);
                return response.data.clubs.map(function(item){
                    item.alreadySelected = false;
                    if(club.id == item.id) item.alreadySelected = true;
                    return item;
                });
            });
    };

    self.selectClub = function($item)
    {
        self.selectedclub = $item;
    };

    self.mergeClubs = function(clubsIdFrom, clubsIdTo){
        if(clubsIdFrom && clubsIdTo){
            AdminClubsFactory.mergeClubs(clubsIdFrom, clubsIdTo)
                .success(function(response){
                    $rootScope.displayFlashMessages(response.message);
                    $state.go('admin.clubs.show', {id:clubsIdTo}, {location:'replace'});
                })
                .success(function(response){
                    $rootScope.displayFlashMessages(response.message, 'error');
                });
        }
    };

    find();
}])
.factory('AdminClubsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

    return {
        load: function (page, id) {
            var url = ApiEndpointUrl+'admin/clubs';

            if (!angular.isUndefined(id) && id > 0) url += '/' + id;
            if (page) url += '?page=' + page;

            return $http({
                method: 'GET',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'admin/clubs/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        createClub: function(club) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'admin/clubs',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(club)
            });
        },

        updateClub: function(club) {
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'admin/clubs/'+club.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(club)
            });
        },

        deleteClub: function(club) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'admin/clubs/'+club.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        loadUserClub: function(){
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'admin/clubs/getUserClub',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        addUserToClubs: function(clubs_id){
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'admin/clubs/addUserToClubs',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: $.param({'clubs_id': clubs_id})
            });
        },

        addNewClub: function(club){
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'admin/clubs/addNewClub',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'},
                data: $.param({'clubs_nr': club.clubs_nr, 'name': club.name})
            });
        },

        searchForClubs: function(filter) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'clubs/search',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({'searchQuery': filter})
            });
        },

        addUserAsAdmin: function(admin) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'admin/clubs/addUserAsAdmin',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({'admin': admin})
            });
        },

        deleteUserAsAdmin: function(admin) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'admin/clubs/deleteUserAsAdmin',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({'admin': admin})
            });
        },

        mergeClubs: function(clubsIdFrom, clubsIdTo) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'admin/clubs/merge',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({'clubsIdFrom': clubsIdFrom, 'clubsIdTo': clubsIdTo})
            });
        }
    };
}]);
angular.module('app.admin', [])

.controller("AdminDashboardController", ["$rootScope", "$scope", "$timeout", "AdminFactory", function($rootScope, $scope, $timeout, AdminFactory){
    var self = this;
    function loadDashboard(){
        $rootScope.loadingState = true;
        AdminFactory.loadDashboard()
            .success(function(response){
                self.data = response;
                $rootScope.loadingState = false;
            });
    }

    loadDashboard();
}])
.factory("AdminFactory", ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){
    return {
        loadDashboard: function () {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl + 'admin/dashboard',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        }

    };
}]);


angular.module('app.admin.users', [])

.controller("AdminUsersController", ["$rootScope", "$stateParams", "$state", "AdminUsersFactory", function($rootScope, $stateParams, $state, AdminUsersFactory){
	var self = this;

	self.filter = {
		search: '',
		active: 1
	};

	function updatePage(page) {
		$rootScope.loadingState = true;
		AdminUsersFactory.load(page)
			.success(function(response){
				self.users = response.users;
				$rootScope.loadingState = false;
			});
	}
	function sortList() {}

	this.page = parseInt($stateParams.page, 10);
	this.sort = $stateParams.sort;
	this.sortOptions = ['upvotes', 'date', 'author'];
	sortList();
	updatePage();


	this.nextPage = function() {
		self.page++;
		updatePage(self.page);
		$state.go('.', {page: self.page}, {notify: false});
	};
	this.prevPage = function() {
		if (self.page > 0) {
			self.page--;
			updatePage(self.page);
			$state.go('.', {page: self.page}, {notify: false});
		}
	};
	this.sortChanged = function() {
		sortList();
		$state.go('.', {sort: self.sort}, {notify: false});
	};

}])

.factory('AdminUsersFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

	return {
		load: function (page, id) {
			var url = ApiEndpointUrl+'admin/users';

			if (!angular.isUndefined(id) && id > 0) url += '/' + id;
			if (page) url += '?page=' + page;

			return $http({
				method: 'GET',
				url: url,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			});
		},

		find: function(id) {
			return $http({
				method: 'GET',
				url: ApiEndpointUrl+'admin/users/'+id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
			});
		}

	};
}]);

angular.module('app.auth', ['vcRecaptcha'])
    .controller('AuthController', ["$rootScope", "$scope", "$state", "$stateParams", "AuthFactory", "$uibModal", "$timeout", function($rootScope, $scope, $state, $stateParams, AuthFactory, $uibModal, $timeout){

        $scope.auth =
        {
            email	: '',
            name    : '',
            lastname: '',
            password: '',
            invite_token: $stateParams.invite_token
        };

        $scope.login = function()
        {
            $scope.loggingIn = true;

            var credentials = {
                email: $scope.auth.email,
                password: $scope.auth.password
            };

            AuthFactory.authenticate(credentials)
                .success(function(response) {
                    localStorage.setItem('token', response.token);
                    AuthFactory.getUser()
                        .success(function(response){
                            $timeout(function() {
                                localStorage.setItem('user', JSON.stringify(response.user));
                                $rootScope.currentUser = response.user;
                                $rootScope.authenticated = true;
                                $state.go('dashboard', {}, {location:'replace'});
                            }, 1000);
                        })
                        .error(function(response){
                            localStorage.removeItem('user');
                            localStorage.removeItem('token');
                            $rootScope.authenticated = false;
                            $rootScope.currentUser = null;
                            $scope.loggingIn = false;
                            if(response == 'user_not_active'){
                                $timeout(function() {
                                    $state.go('auth.inactive', {}, {location:'replace'});
                                }, 50);
                            }
                        });
                })
                .error(function(response) {
                    $rootScope.displayFlashMessages(response.message, 'error');
                    $scope.loggingIn = false;
                    $rootScope.loadingState = '';
                    $rootScope.currentUser = false;
                    $rootScope.authenticated = false;
                });

        };
        $scope.register = function() {
            if($scope.auth.recaptcharesponse) {
                $scope.registerState = 'registrering';

                AuthFactory.register($scope.auth)
                    .success(function () {
                        $scope.registerState = 'done';
                        $scope.auth = {};
                    })
                    .error(function (response) {
                        $rootScope.displayFlashMessages(response, 'error');
                        $rootScope.loadingState = '';
                        $scope.registerState = false;
                    });
            }
        };

        /**
         * Makes a request for sending a password reset link.
         *
         * @return void
         */
        $scope.reset = {email: ''};
        $scope.requestPasswordReset = function()
        {
            AuthFactory
                .requestPasswordReset({email: $scope.reset.email})
                .success(function(response){
                    $scope.reset.email = '';
                    $scope.passwordRequested = true;
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                    $scope.passwordRequested = false;
                })
                .then(function(response){
                    if(response.data.status !== 'success')
                    {
                        $scope.passwordRequested = true;
                    }
                });
        };

        $scope.termsModalOpen = function () {
            self.termsModal = $uibModal.open({
                animation: $scope.animationsEnabled,
                templateUrl: '/publicviews/terms',
                size: 'md',
                controller: ["$uibModalInstance", function($uibModalInstance){
                    this.close = function () {
                        $uibModalInstance.dismiss('cancel');
                    };
                }],
                controllerAs: 'modal'
            });
        };

    }])

    .controller('ActivationController', ["$state", "$rootScope", "$scope", "$http", "$stateParams", "AuthFactory", "$timeout", function($state, $rootScope, $scope, $http, $stateParams, AuthFactory, $timeout){
        $scope.activate = {
            token: $stateParams.token
        };
        $scope.no_password = false;
        $scope.verifyToken = function() {
            AuthFactory.activate($scope.activate)
                .success(function(response){
                    $scope.activated = true;
                })
                .error(function(response){
                    if(response.error == 'invalid_code'){
                        $rootScope.displayFlashMessages(response.message, 'error');
                    }else if(response.error == 'no_password'){
                        $scope.no_password = true;
                        $rootScope.displayFlashMessages(response.message, 'warning');
                    }
                    $scope.activated = false;
                });
        };
    }])

    .factory('AuthFactory', ["$http", "$filter", "$timeout", "$state", "$rootScope", "ApiEndpointUrl", function($http, $filter, $timeout, $state, $rootScope, ApiEndpointUrl){
        return {

            /**
             * Stores the user data and updates the rootscope variables. Then redirects to dashboard.
             *
             * @param  object  $user
             * @return void
             */
            authenticate: function(credentials){
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'authenticate',
                    data: credentials
                });
            },

            getUser: function(){
                return $http({
                    method: 'GET',
                    url: ApiEndpointUrl+'authenticate/user'
                });
            },

            /**
             * Clears all user data and rootscope user variables. Then redirects to login form.
             *
             * @return void
             */
            logout: function()
            {
                localStorage.removeItem('user');
                localStorage.removeItem('token');
                $rootScope.authenticated = false;
                $rootScope.currentUser = null;
                $state.go('auth.login', {}, {location: 'replace'});
            },

            requestPasswordReset: function(credentials) {
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'password/email',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(credentials)
                });
            },

            resetPassword: function(credentials) {
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'password/reset',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(credentials)
                });
            },

            register: function(credentials) {
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'register',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(credentials)
                });
            },

            activate: function(token) {
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'activate',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(token)
                });
            },

            attemptRefreshToken: function(requestTodoWhenDone){

                // Run the call to refresh the token.
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'refresh'
                })
                    .success(function(response)
                    {
                        // If no response token is retrieved, go to the login page,
                        // prevent the request from being retried by setting requestTodoWhenDone = false and
                        // return false to allow for custom callbacks by checking if(AuthFactory.attemptRefreshToken() === false).
                        if(!response.token)
                        {
                            requestTodoWhenDone = undefined;
                            localStorage.removeItem('user');
                            localStorage.removeItem('token');
                            $rootScope.authenticated = false;
                            $rootScope.currentUser = null;

                            $state.go('auth.login');
                            return false;
                        }

                        // Set the refreshed token.
                        localStorage.setItem('token', response.token);
                        // If a request should be retried after refresh, for example on pull-to-refresh, the request config
                        // is passed into the requestTodoWhenDone parameter. Set the authorization token to the newly retrieved
                        // token and run the request again.
                        /*
                        if(!angular.isUndefined(requestTodoWhenDone) && requestTodoWhenDone.length !== 0)
                        {
                            requestTodoWhenDone.headers = {
                                'Authorization': 'Bearer ' + localStorage.getItem('token')
                            };
                            return $http(requestTodoWhenDone);
                        }
                        */
                        location.reload(true);
                    })
                    .error(function(){
                        requestTodoWhenDone = undefined;
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        $rootScope.authenticated = false;
                        $rootScope.currentUser = null;

                        $state.go('auth.login');
                        return false;
                    });
            }
        };
    }]);
angular.module('app.calendar', [])

/**
 * calendarDemoApp - 0.1.3
 */
.controller('CalendarController', ["$scope", "$http", "$timeout", "ApiEndpointUrl", function($scope,$http,$timeout, ApiEndpointUrl) {
	
	function init(){
		
		$apiUrl = ApiEndpointUrl+'calendar';
	
		$scope.calendarEvents = [{
            url: ApiEndpointUrl+"calendar",
        }];
	
	    $scope.uiConfig = {
	      calendar:{
		    lang: 'sv',
		    buttonText: {
			    today:    'idag',
			    month:    'månad',
			    week:     'vecka',
			    day:      'dag'
			},
			firstDay: '1',
			weekNumbers: true,
			header: {
				left: 'prev,next today',
				center: 'title',
				right: 'month,agendaWeek,agendaDay'
			},
			columnFormat: {
				day: 'ddd DD/MM',
				week: 'ddd DD/MM',
				month: 'ddd'
			},
			titleFormat: {
			    month: 'MMMM YYYY', // September 2009
			    week: "MMMM D YYYY", // Sep 13 2009
			    day: 'MMMM D YYYY'  // September 8 2009
			},
			weekNumberTitle: '',
			axisFormat: 'H:mm',
			timeFormat: 'H:mm',
			minTime: '6:00',
			maxTime: '23:59',
			allDaySlot: false,
			defaultView: 'month',
	        height: 500,
	        editable: false,
	        viewRender: function(view, element) {
				var start = Date.parse(view.start._d);
				var end = Date.parse(view.end._d);
				$scope.calendarEvents = [{
		            url: ApiEndpointUrl+"calendar?start="+start+"&end="+end
		        }];
        	},
			eventClick: $scope.alertOnEventClick,
	        eventDrop: $scope.alertOnDrop,
	        eventResize: function(view, element) {
		        console.log(view);
	        }
	      }
	    };

	    $scope.changeView = function(view,calendar) {
	      calendar.fullCalendar('changeView',view);
	    };
	
	    $scope.renderCalender = function(calendar) {
	       $timeout(function(){
		       console.log(123); 
				if(calendar){
				calendar.fullCalendar('render');
				}
	       }, 0);
	    };
	}
	
	init();

}]);
angular.module('app.championships', [])

.controller("ChampionshipsController", ["$rootScope", "$scope", "$stateParams", "$state", "ChampionshipsFactory", function($rootScope, $scope, $stateParams, $state, ChampionshipsFactory){
    var self = this;

    function updatePage(page) {
        ChampionshipsFactory.load(page)
            .success(function(response){
                self.championships = response.championships;
            });
    }
    function sortList() {}

    this.page = parseInt($stateParams.page, 10);
    this.sort = $stateParams.sort;
    this.sortOptions = ['upvotes', 'date', 'author'];
    sortList();
    updatePage();


}])
.controller("ChampionshipController", ["$rootScope", "$scope", "$stateParams", "$state", "ChampionshipsFactory", function($rootScope, $scope, $stateParams, $state, ChampionshipsFactory) {
    var self = this;

    function find(){
        ChampionshipsFactory.find($stateParams.id)
            .success(function(response){
                self.championships = response.championships;
                self.user = JSON.parse(localStorage.getItem('user'));
            })
            .error(function(){
                $state.go('championships', {}, {location:'replace'});
            });
    }

}])

.factory('ChampionshipsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {

    return {
        load: function (page, id) {
            var url = ApiEndpointUrl+'championships';

            if (!angular.isUndefined(id) && id > 0) url += '/' + id;
            if (page) url += '?page=' + page;

            return $http({
                method: 'GET',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'championships/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        createSignup: function(signup) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'signup',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(signup)
            });
        },

        updateSignup: function(signup) {
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'signup/'+signup.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(signup)
            });
        },

        deleteSignup: function(signup) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'signup/'+signup.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        }
    };
}]);


angular.module('app.clubs', [])

.controller("ClubController", ["$rootScope", "$scope", "$state", "ClubsFactory", function($rootScope, $scope, $state, ClubsFactory){
	var self = this;

	self.filter = {
		users: {
			search: ''
		}
	};

	self.add_admin = null;

	function loadUserClub() {
		$rootScope.loadingState = true;
		ClubsFactory.loadUserClub()
			.success(function(response){
				self.selectedClubs = '';
				if(!response.id){
					$state.go('club.connect', {}, {location:'replace'});
				}
				self.club = response;
				$rootScope.loadingState = false;
			});
	}

	self.updateClub = function(){
		ClubsFactory.updateClub(self.club)
			.success(function(response){
				$state.go('club.information', {}, {location:'replace'});
			})
			.error(function(response){
				$rootScope.displayFlashMessages(response, 'error');
			});
	};

	self.addUserAsAdmin = function(admin)
	{
		if(admin){
			ClubsFactory.addUserAsAdmin(admin)
				.success(function(){
					loadUserClub();
				})
				.error(function(response){
					$rootScope.displayFlashMessages(response.message);
				});
		}
	};

	self.deleteUserAsAdmin = function(admin)
	{
		if(admin){
			ClubsFactory.deleteUserAsAdmin(admin)
				.success(function(){
					loadUserClub();
				})
				.error(function(response){
					$rootScope.displayFlashMessages(response.message);
				});
		}
	};

	loadUserClub();
}])

.controller("ClubConnectController", ["$rootScope", "$scope", "$state", "ClubsFactory", function($rootScope, $scope, $state, ClubsFactory) {
	var self = this;

	self.searchQuery = '';
	self.selectedclub = {};
	self.new_club = null;
	self.add_clubs_nr = '';
	self.changeClub = false;

	function loadUserClub() {
		$rootScope.loadingState = true;
		ClubsFactory.loadUserClub()
			.success(function(response){
				self.selectedClubs = '';
				if(response.id){
					$state.go('club.information', {}, {location:'replace'});
				}
				self.club = response;
				$rootScope.loadingState = false;

			});
	}

	self.searchForClubs = function(searchQuery, club)
	{
		return ClubsFactory
			.searchForClubs(searchQuery)
			.error(function(response){
				$rootScope.displayFlashMessages(response, 'warning');
			})
			.then(function(response){
				self.foundMatch = (response.data.clubs.length > 0);
				return response.data.clubs.map(function(item){
					item.alreadySelected = false;
					if(club.id == item.id) item.alreadySelected = true;
					return item;
				});
			});
	};

	self.selectClub = function($item)
	{
		if($item.alreadySelected === true) return false;
		self.noMatchingClubs = null;
		self.new_club = $item;
	};

	self.noClubsFound = function()
	{
		self.noMatchingClubs = true;
		self.new_club = null;
	};

	self.addUserToClubs = function(club)
	{
		ClubsFactory.addUserToClubs(club.id)
			.success(function(response){
				self.new_club = null;
				self.changeClub = false;
				self.club = response;
				$state.go('club.information', {}, {location: 'replace'});
			});
	};

	self.addNewClub = function()
	{
		if(!self.searchQuery || !self.add_clubs_nr) return false;
		var club = {
			name: self.searchQuery,
			clubs_nr: self.add_clubs_nr
		};

		ClubsFactory.addNewClub(club)
			.success(function(response){
				self.searchQuery = '';
				self.add_clubs_nr = '';
				self.new_club = null;
				self.changeClub = false;
				self.club = response;
				$state.go('club.information', {}, {location: 'replace'});
			});
	};

	loadUserClub();

}])

.factory('ClubsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

	return {
		load: function (page, id) {
			var url = ApiEndpointUrl+'clubs';

			if (!angular.isUndefined(id) && id > 0) url += '/' + id;
			if (page) url += '?page=' + page;

			return $http({
				method: 'GET',
				url: url,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			});
		},

		find: function(id) {
			return $http({
				method: 'GET',
				url: ApiEndpointUrl+'clubs/'+id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
			});
		},

		createClub: function(club) {
			return $http({
				method: 'POST',
				url: ApiEndpointUrl+'clubs',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param(club)
			});
		},

		updateClub: function(club) {
			return $http({
				method: 'PUT',
				url: ApiEndpointUrl+'clubs',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param(club)
			});
		},

		deleteClub: function(club) {
			return $http({
				method: 'DELETE',
				url: ApiEndpointUrl+'clubs/'+club.id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
			});
		},

		loadUserClub: function(){
			return $http({
				method: 'GET',
				url: ApiEndpointUrl+'clubs/getUserClub',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			});
		},

		addUserToClubs: function(clubs_id){
			return $http({
				method: 'POST',
				url: ApiEndpointUrl+'clubs/addUserToClubs',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: $.param({'clubs_id': clubs_id})
			});
		},

		addNewClub: function(club){
			return $http({
				method: 'POST',
				url: ApiEndpointUrl+'clubs/addNewClub',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: $.param({'clubs_nr': club.clubs_nr, 'name': club.name})
			});
		},

		searchForClubs: function(filter) {
			return $http({
				method: 'POST',
				url: ApiEndpointUrl+'clubs/search',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param({'searchQuery': filter})
			});
		},

		addUserAsAdmin: function(admin) {
			return $http({
				method: 'POST',
				url: ApiEndpointUrl+'clubs/addUserAsAdmin',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param({'admin': admin})
			});
		},

		deleteUserAsAdmin: function(admin) {
			return $http({
				method: 'DELETE',
				url: ApiEndpointUrl+'clubs/deleteUserAsAdmin',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param({'admin': admin})
			});
		}
	};
}]);
angular.module('app.competitions', [])

.controller("CompetitionsController", ["$rootScope", "$scope", "$stateParams", "$state", "CompetitionsFactory", function($rootScope, $scope, $stateParams, $state, CompetitionsFactory){
    var self = this;

    function updatePage(page) {
        $rootScope.loadingState = true;
        CompetitionsFactory.load(page)
            .success(function(response){
                self.competitions = response.competitions;
                $rootScope.loadingState = false;
            });
    }
    function sortList() {}

    this.page = parseInt($stateParams.page, 10);
    this.sort = $stateParams.sort;
    this.sortOptions = ['upvotes', 'date', 'author'];
    sortList();
    updatePage();


    this.nextPage = function() {
        self.page++;
        updatePage(self.page);
        $state.go('.', {page: self.page}, {notify: false});
    };
    this.prevPage = function() {
        if (self.page > 0) {
            self.page--;
            updatePage(self.page);
            $state.go('.', {page: self.page}, {notify: false});
        }
    };
    this.sortChanged = function() {
        sortList();
        $state.go('.', {sort: self.sort}, {notify: false});
    };
}])
.controller("CompetitionController", ["$rootScope", "$scope", "$stateParams", "$state", "$timeout", "CompetitionsFactory", "SignupsFactory", function($rootScope, $scope, $stateParams, $state, $timeout, CompetitionsFactory, SignupsFactory){
    var self = this;

    function find(){
        $rootScope.loadingState = true;
        CompetitionsFactory.find($stateParams.id)
            .success(function(response){
                self.competitions = response.competitions;
                self.user = JSON.parse(localStorage.getItem('user'));
                $rootScope.loadingState = false;
            })
            .error(function(){
                $state.go('competitions', {}, {location:'replace'});
                $rootScope.loadingState = false;
            });
    }

    self.createSignup = function(weaponclasses_id){
        var signup = {
            'competitions_id': self.competitions.id,
            'weaponclasses_id': weaponclasses_id,
            'users_id': self.user.user_id
        };
        SignupsFactory.createSignup(signup)
            .success(function(response){
                response.weaponclasses_id = parseInt(response.weaponclasses_id);
                self.competitions.usersignups.push(response);
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            });
    };

    self.deleteSignup = function(signup){
        SignupsFactory.deleteSignup(signup)
            .success(function(response){

                // Remove the shift from the calendar.
                angular.forEach(self.competitions.usersignups, function(signups, index){
                    if(signups.id == signup.id)
                    {
                        self.competitions.usersignups.splice(index, 1);
                    }
                });
            });
    };

    find();
}])

.factory('CompetitionsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {

    return {
        load: function (page, id) {
            var url = ApiEndpointUrl+'competitions';

            if (!angular.isUndefined(id) && id > 0) url += '/' + id;
            if (page) url += '?page=' + page;

            return $http({
                method: 'GET',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'competitions/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        }

    };
}]);
angular.module('app.dashboard', [])

    .controller("DashboardController", ["$rootScope", "$scope", "$timeout", function($rootScope, $scope, $timeout){
        $rootScope.loadingState = true;
        $scope.$on('$viewContentLoaded', function() {
            $timeout(function(){
                (function(d, s, id) {
                    FB = null;
                    var js, fjs = d.getElementsByTagName(s)[0];
                    //if (d.getElementById(id)) return;
                    js = d.createElement(s); js.id = id;
                    js.src = "//connect.facebook.net/sv_SE/sdk.js#xfbml=1&version=v2.6&appId=956867524398222";
                    fjs.parentNode.insertBefore(js, fjs);
                }(document, 'script', 'facebook-jssdk'));
                $rootScope.loadingState = false;
            }, 500);
        });

    }]);


angular.module('app.errorhandler', [])

	.controller("ErrorHandlerController", ["$rootScope", "$scope", "ErrorHandlerFactory", function($rootScope, $scope, ErrorHandlerFactory){

	}])

	.factory('ErrorHandlerFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

		return {

			reportError: function(error, cause) {
				return $http({
					method: 'POST',
					url: ApiEndpointUrl+'error/report',
					headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
					data: $.param({error: error, cause: cause})
				});
			}

		};

	}]);

angular.module('app.payments', [])

.controller("PaymentsController", ["$rootScope", "$stateParams", "$state", "PaymentsFactory", function($rootScope, $stateParams, $state, PaymentsFactory) {
    var self = this;

    function loadPayments(){
        $rootScope.loadingState = true;
        PaymentsFactory.load()
            .success(function(response){
                self.payments = response;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    loadPayments();
}])
.factory('PaymentsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

    return {
        load: function() {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'clubpayments/',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'clubpayments/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        createUser: function(user){
            var data = angular.copy(user);
            data.birthday = data.birthday+'-01-01';
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'users',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        },

        saveUser: function(user){
            var data = angular.copy(user);
            data.birthday = data.birthday+'-01-01';
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'users/'+data.user_id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        }

    };
}]);

angular.module('app.premium', [])
.controller("PremiumController", ["$rootScope", "$scope", "$state", "PremiumFactory", function($rootScope, $scope, $state, PremiumFactory){
    var self = this;
    
    self.loadPremium = function(){
        $rootScope.loadingState = true;
        PremiumFactory.loadPremium()
            .success(function(response){
                self.club = response;
                $rootScope.loadingState = false;
            });
    };

    self.registerPremium = function(){
        PremiumFactory.registerPremium()
            .success(function(response){
                self.club = response;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            });
    };

    self.loadPremium();
}])
.factory('PremiumFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {
    return {
        loadPremium: function () {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl + 'premium',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        registerPremium: function () {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl + 'premium',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        }
    };
}]);

angular.module('app.settings', [])

.controller("SettingsController", ["$rootScope", "$scope", "$state", "SettingsFactory", function($rootScope, $scope, $state, SettingsFactory) {
    var self = this;

    self.cancelaccount = function(){
        $rootScope.loadingState = true;
        SettingsFactory.cancelaccount()
            .success(function(response){
                $rootScope.displayFlashMessages(response.message);
                $rootScope.loadingState = false;
                $state.go('auth.logout');
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response.error);
                $rootScope.loadingState = false;
            });
    };
}])

.controller("PasswordController", ["$rootScope", "$scope", "$state", "SettingsFactory", function($rootScope, $scope, $state, SettingsFactory){
    var self = this;
    self.reset = {
        'current_password':'',
        'password': '',
        'password_confirmation':''
    };

    self.updatePassword = function() {
        SettingsFactory.updatePassword(self.reset)
            .success(function(response){
                self.reset = {
                    'current_password':'',
                    'password': '',
                    'password_confirmation':''
                };
                $rootScope.displayFlashMessages(response);
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            });
    };

}])

.controller("UserProfileController", ["$rootScope", "$scope", "$state", "SettingsFactory", function($rootScope, $scope, $state, SettingsFactory){
    var self = this;
    function loadUserprofile() {
        $rootScope.loadingState = true;
        SettingsFactory.loadUserprofile()
            .success(function(response){
                self.userprofile = response.user;
                $rootScope.loadingState = false;
            });
    }

    self.datePickerOptions = {startingDay: 1, start: {opened: false}, end: {opened: false}};

    self.saveUserprofile = function(){
        $rootScope.loadingState = true;
        SettingsFactory.saveUserprofile(self.userprofile)
            .success(function(response){
                localStorage.setItem('user', JSON.stringify(response.user));
                self.userprofile = response.user;
                $rootScope.loadingState = false;
                $state.go('settings.user');
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    };

    self.cancelUserprofile = function(){
        loadUserprofile();
        $state.go('settings.user');
    };

    loadUserprofile();

}])

.controller("UserClubsController", ["$rootScope", "$scope", "$state", "ClubsFactory", function($rootScope, $scope, $state, ClubsFactory){
    var self = this;

    self.searchQuery = '';
    self.new_club = null;
    self.add_clubs_nr = '';
    self.changeClub = false;

    function loadUserClubs() {
        $rootScope.loadingState = true;
        ClubsFactory.loadUserClubs()
            .success(function(response){
                self.selectedClubs = '';
                self.clubs = response.clubs;
                $rootScope.loadingState = false;
            });
    }

    self.searchForClubs = function(searchQuery, clubs)
    {
        return ClubsFactory
            .searchForClubs(searchQuery)
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'warning');
            })
            .then(function(response){
                self.foundMatch = (response.data.clubs.length > 0);
                return response.data.clubs.map(function(item){
                    item.alreadySelected = false;
                    angular.forEach(clubs, function(club){
                        if(club.id == item.id) item.alreadySelected = true;
                    });

                    return item;
                });
            });
    };

    self.selectClub = function($item)
    {
        if($item.alreadySelected === true) return false;
        self.noMatchingClubs = null;
        self.new_club = $item; 
    };

    self.noClubsFound = function()
    {
        console.log(1234);
        self.noMatchingClubs = true;
        self.new_club = null;
    };

    self.addUserToClubs = function(club)
    {
        ClubsFactory.addUserToClubs(club.id)
            .success(function(response){
                self.new_club = null;
                self.changeClub = false;
                self.clubs = response.clubs;
            });
    };

    self.addNewClub = function()
    {
        if(!self.searchQuery || !self.add_clubs_nr) return false;
        var club = {
            name: self.searchQuery,
            clubs_nr: self.add_clubs_nr
        };

        ClubsFactory.addNewClub(club)
            .success(function(response){
                self.searchQuery = '';
                self.add_clubs_nr = '';
                self.new_club = null;
                self.changeClub = false;
                self.clubs = response.clubs;
            });
    };

    loadUserClubs();
}])

.controller("InviteController", ["$rootScope", "$scope", "$state", "InviteFactory", function($rootScope, $scope, $state, InviteFactory){
    var self = this;

    self.loadInvites = function() {
        InviteFactory.loadInvites()
            .success(function(response){
                self.invites = response.invites;
            });
    };
    self.loadInvites();

    self.invite = function()
    {
        $rootScope.loadingState = true;
        InviteFactory
            .invite(self.user)
            .success(function(response){
                self.user = {
                    name: '',
                    lastname: '',
                    email: ''
                };
                self.loadInvites();
                $rootScope.displayFlashMessages(response.message);
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    };
}])

.factory("InviteFactory", ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){
    return {
        loadInvites: function(){
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'users/invite',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        invite: function(user) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'users/invite',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(user)
            });
        }

    };
}])

.factory("SettingsFactory", ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){
    return {
        loadUserprofile: function(){
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'authenticate/user',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        saveUserprofile: function(user){
            var data = angular.copy(user);
            data.birthday = data.birthday+'-01-01';
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'authenticate/user',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        },

        updatePassword: function(credentials) {
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'authenticate/updatePassword',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(credentials)
            });
        },

        cancelaccount: function() {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'authenticate/cancelAccount',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        }

    };
}]);
angular.module('app.signups', [])

.controller("SignupsController", ["$rootScope", "$scope", "$stateParams", "$state", "SignupsFactory", function($rootScope, $scope, $stateParams, $state, SignupsFactory){
    var self = this;

    function updatePage(page) {
        $rootScope.loadingState = true;
        SignupsFactory.load(page)
            .success(function(response){
                self.signups = response.signups;
                $rootScope.loadingState = false;
            });
    }
    function sortList() {}

    this.page = parseInt($stateParams.page, 10);
    this.sort = $stateParams.sort;
    this.sortOptions = ['upvotes', 'date', 'author'];
    sortList();
    updatePage();
}])
.controller("SignupController", ["$rootScope", "$scope", "$stateParams", "$state", "$timeout", "SignupsFactory", function($rootScope, $scope, $stateParams, $state, $timeout, SignupsFactory) {
    var self = this;

    function find(){
        $rootScope.loadingState = true;
        SignupsFactory.find($stateParams.id)
            .success(function(response){
                self.signups = response.signups;
                self.user = JSON.parse(localStorage.getItem('user'));
                $rootScope.loadingState = false;
            })
            .error(function(){
                $rootScope.loadingState = false;
                $state.go('signups', {}, {location:'replace'});
            });
    }

    self.updateSignup = function(signup){
        self.state = 'updating';
        SignupsFactory.updateSignup(signup)
            .success(function(response){
                $rootScope.displayFlashMessages(response.message);
                response.signups.participate_out_of_competition = parseInt(response.signups.participate_out_of_competition);
                response.signups.weaponclasses_id = parseInt(response.signups.weaponclasses_id);
                self.signups.signups = response.signups;
                self.state = 'updated';
                $state.go('signup', ({id: signup.id}));
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response.message, 'error');
            });
    };

    self.deleteSignup = function(signup){
        SignupsFactory.deleteSignup(signup)
            .success(function(response){
                $state.go('signups');
            });
    };



    find();
}])
.controller("ClubSignupController", ["$rootScope", "$scope", "$stateParams", "$state", "$timeout", "SignupsFactory", function($rootScope, $scope, $stateParams, $state, $timeout, SignupsFactory) {
    var self = this;

    function loadClubSignups(){
        $rootScope.loadingState = true;
        SignupsFactory.loadClubSignups($stateParams.id)
            .success(function(response){
                self.competition = response.competition;
                self.club = response.club;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response.message, 'error');
                $rootScope.loadingState = false;
            });
    }


    self.createSignup = function(user_id, weaponclasses_id){
        var signup = {
            'competitions_id': $stateParams.id,
            'weaponclasses_id': weaponclasses_id,
            'users_id': user_id
        };
        SignupsFactory.createSignup(signup)
            .success(function(response){
                response.weaponclasses_id = parseInt(response.weaponclasses_id);
                self.competition.signups.push(response);
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            });
    };

    self.deleteSignup = function(signup){
        SignupsFactory.deleteSignup(signup)
            .success(function(response){

                // Remove the shift from the calendar.
                angular.forEach(self.competition.signups, function(signups, index){
                    if(signups.id == signup.id)
                    {
                        self.competition.signups.splice(index, 1);
                    }
                });
            });
    };



    loadClubSignups();
}])
.factory('SignupsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {

        return {
            load: function (page, id) {
                var url = ApiEndpointUrl+'signup';

                if (!angular.isUndefined(id) && id > 0) url += '/' + id;
                if (page) url += '?page=' + page;

                return $http({
                    method: 'GET',
                    url: url,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });
            },

            find: function(id) {
                return $http({
                    method: 'GET',
                    url: ApiEndpointUrl+'signup/'+id,
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
                });
            },

            createSignup: function(signup) {
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'signup',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(signup)
                });
            },

            updateSignup: function(signup) {
                return $http({
                    method: 'PUT',
                    url: ApiEndpointUrl+'signup/'+signup.id,
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(signup)
                });
            },

            deleteSignup: function(signup) {
                return $http({
                    method: 'DELETE',
                    url: ApiEndpointUrl+'signup/'+signup.id,
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
                });
            },

            loadClubSignups: function(competitions_id) {
                return $http({
                    method: 'GET',
                    url: ApiEndpointUrl + 'competitions/' + competitions_id + '/clubsignups',
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                });
            }
        };
    }]);


angular.module('app.teams', [])
.controller('TeamSignupController', ["$rootScope", "$scope", "$stateParams", "$state", "CompetitionsFactory", "TeamsFactory", function($rootScope, $scope, $stateParams, $state, CompetitionsFactory, TeamsFactory){
    var self = this;

    function loadTeams() {
        $rootScope.loadingState = true;
        if($stateParams.teams_id){
            TeamsFactory.load($stateParams.id, $stateParams.teams_id)
                .success(function(response){
                    self.teams = response.teams;
                    self.signups = response.signups;

                    angular.forEach(self.teams.signups, function(signup, key){
                        if(signup.pivot.position == 1) self.teams.teams_signups_first  = signup.id;
                        if(signup.pivot.position == 2) self.teams.teams_signups_second = signup.id;
                        if(signup.pivot.position == 3) self.teams.teams_signups_third = signup.id;
                        if(signup.pivot.position == 4) self.teams.teams_signups_fourth = signup.id;
                        if(signup.pivot.position == 5) self.teams.teams_signups_fifth = signup.id;
                    });

                    self.teams.signups = null;
                    $rootScope.loadingState = false;

                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                    $rootScope.loadingState = false;
                });
        }else{
            TeamsFactory.load($stateParams.id, $stateParams.teams_id)
                .success(function(response){
                    self.addTeam = {
                        name: '',
                        weaponclasses_id: '',
                        teams_signups_first: null,
                        teams_signups_second: null,
                        teams_signups_third: null,
                        teams_signups_fourth: null,
                        teams_signups_fifth: null
                    };
                    self.teams = response.teams;
                    self.signups = response.signups;
                    $rootScope.loadingState = false;
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                    $rootScope.loadingState = false;
                });
        }

    }

    self.createTeam = function(){
        if(self.addTeam.name && self.addTeam.weaponclasses_id){
            TeamsFactory.store($stateParams.id, self.addTeam)
                .success(function(response){
                    $rootScope.displayFlashMessages(response.message);
                    $state.go('competition.teamsignups', {id: $stateParams.id}, {reload:true});
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response.message, 'error');
                    if(response.redirect_to_edit){
                        $state.go('competition.teamsignups.edit', {id: $stateParams.id, teams_id: response.redirect_to_edit}, {reload:true});
                    }
                });
        }
    };
    
    self.updateTeam = function(team){
        if(self.teams.name && self.teams.weaponclasses_id){
            TeamsFactory.update($stateParams.id, self.teams.id, team)
                .success(function(response){
                    $rootScope.displayFlashMessages(response.message);
                    $state.go('competition.teamsignups', {id: $stateParams.id}, {reload:true});
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response.message, 'error');
                    if(response.redirect_to_edit){
                        $state.go('competition.teamsignups.edit', {id: $stateParams.id, teams_id: response.redirect_to_edit}, {reload:true});
                    }
                });
        }
    };

    self.cancelTeam = function(){
        $state.go('competition.teamsignups',{id: $stateParams.id}, {reload:true});
    };

    self.deleteTeam = function(teams_id){
        if(teams_id){
            TeamsFactory.delete($stateParams.id, teams_id)
                .success(function(response){
                    $rootScope.displayFlashMessages(response);
                    $state.go('competition.teamsignups', {id: $stateParams.id}, {reload:true});
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response.message, 'error');
                });
        }
    };

    loadTeams();

}])
.factory('TeamsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {
    return {
        load: function (competitions_id, teams_id) {
            if(competitions_id && teams_id){
                url = ApiEndpointUrl+'competitions/'+competitions_id+'/teamsignups/'+teams_id;
            } else {
                url = ApiEndpointUrl+'competitions/'+competitions_id+'/teamsignups';
            }
            return $http({
                method: 'GET',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/teamsignups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        store: function(competitions_id, team){
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/teamsignups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(team)
            });
        },

        update: function(competitions_id, teams_id, team){
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/teamsignups/'+teams_id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(team)
            });
        },

        delete: function(competitions_id, teams_id){
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/teamsignups/'+teams_id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        }

    };
}]);

angular.module('app.users', [])

.controller("UserController", ["$rootScope", "$stateParams", "$state", "UsersFactory", function($rootScope, $stateParams, $state, UsersFactory){
    var self = this;
    function loadUser(){
        $rootScope.loadingState = true;
        if($stateParams.user_id){
            UsersFactory.find($stateParams.user_id)
                .success(function(response){
                    self.user = response;
                    $rootScope.loadingState = false;
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                    self.user = '';
                    $rootScope.loadingState = false;
                });
        }else{
            self.user = {};
            $rootScope.loadingState = false;
        }
    }
    loadUser();

    self.saveUser = function(user){
        UsersFactory.saveUser(user)
            .success(function(response){
                $rootScope.displayFlashMessages(response);
                $state.go('club.users.index', {}, {location: 'reload'});
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            });
    };

    self.createUser = function(user){
        UsersFactory.createUser(user)
            .success(function(response){
                $rootScope.displayFlashMessages(response);
                $state.go('club.users.index', {}, {location: 'reload'});
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            });
    };

}])

.factory('UsersFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

    return {
        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'users/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        createUser: function(user){
            var data = angular.copy(user);
            data.birthday = data.birthday+'-01-01';
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'users',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        },

        saveUser: function(user){
            var data = angular.copy(user);
            data.birthday = data.birthday+'-01-01';
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'users/'+data.user_id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        }

    };
}]);

/*
app.config(function($provide, $httpProvider) {
	function redirectWhenLoggedOut($q, $injector, $rootScope) {
        return {
			
            responseError: function(rejection) {
                var $state = $injector.get('$state');

				// The possible reasons the token might not be valid. Specified in AuthenticateController.
                var rejectionReasons = ['token_not_provided', 'token_expired', 'token_absent', 'token_invalid'];

                // Loop through each rejection reason and redirect to the login
                // state if one is encountered.
                angular.forEach(rejectionReasons, function(value, key) {

                    if(rejection.data.error === value) {

                        // Reset user data.
                        localStorage.removeItem('user');
                        $rootScope.authenticated 	= false;
						$rootScope.currentUser 		= null;
						
						$('.modal').modal('hide');

                        // Redirect to the login page.
                        $state.go('auth.login');
                    }
                });

                return $q.reject(rejection);
            }
        };
    }

    // Setup for the $httpInterceptor
    $provide.factory('redirectWhenLoggedOut', redirectWhenLoggedOut);

    // Push the new factory onto the $http interceptor array
    $httpProvider.interceptors.push('redirectWhenLoggedOut');
	
});
    */
/**
 * Global error handling for top level errors.
 * Catches any exceptions and sends them to the $rootScope.reportError function.
 */
app.config(["$provide", function($provide) {
    $provide.decorator("$exceptionHandler", ["$delegate", "$injector", function($delegate, $injector) {
		return function(exception, cause) {
			$delegate(exception, cause);
			
			var $rootScope = $injector.get("$rootScope");
			return $rootScope.reportError(exception, cause);
		};
	}]);
}]);
app.config(["$httpProvider", function ($httpProvider) {
    $httpProvider.interceptors.push(["$q", "$injector", "$rootScope", function ($q, $injector, $rootScope) {
        return {

            request: function (config) {
                // Make sure the token is set for the request.
                var token = localStorage.getItem('token');
                if(token !== null){
                    config.headers.Authorization = 'Bearer ' + token;
                }

                config.headers['X-Requested-With'] = 'XMLHttpRequest';

                return config;
            },

            // Detect if the token has expired on a http call. Refresh the token and try again.
            responseError: function(response) {
                var AuthFactory = $injector.get('AuthFactory');
                var state = $injector.get('$state');
                if(response.data !== undefined){
                    if (response.data.error == 'token_expired') {
                        return AuthFactory.attemptRefreshToken(response.config);
                    } else if (response.data.error == 'user_inactive') {
                        $rootScope.displayFlashMessages(response.data.message, 'error');
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        $rootScope.authenticated = false;
                        $rootScope.currentUser = null;
                        state.go('auth.login', {}, {location: 'replace'});
                    }else if (response.data.error == 'user_is_not_admin') {
                        $rootScope.displayFlashMessages(response.data.message, 'error');
                        return state.go('dashboard');
                    }else if (response.data.error == 'api_version_update') {
                        $rootScope.displayFlashMessages(response.data.message, 'error');
                        return location.reload(true);
                    }
                }

                if(response.error !== undefined){
                    if (response.error == 'token_expired') {
                        return AuthFactory.attemptRefreshToken(response.config);
                    } else if (response.error == 'user_inactive') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        $rootScope.displayFlashMessages(response.data.message, 'error');
                        localStorage.removeItem('user');
                        localStorage.removeItem('token');
                        $rootScope.authenticated = false;
                        $rootScope.currentUser = null;
                        state.go('auth.login', {}, {location: 'replace'});
                    }else if (response.error == 'user_is_not_admin') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        return state.go('dashboard');
                    }else if (response.error == 'api_version_update') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        return location.reload(true);
                    }
                }
                return $q.reject(response);
            }

        };
    }]);

}]);
/*
*  AngularJs Fullcalendar Wrapper for the JQuery FullCalendar
*  API @ http://arshaw.com/fullcalendar/
*
*  Angular Calendar Directive that takes in the [eventSources] nested array object as the ng-model and watches it deeply changes.
*       Can also take in multiple event urls as a source object(s) and feed the events per view.
*       The calendar will watch any eventSource array and update itself when a change is made.
*
*/

angular.module('ui.calendar', [])
  .constant('uiCalendarConfig', {})
  .controller('uiCalendarCtrl', ['$scope', '$timeout', '$locale', function($scope, $timeout, $locale){

      var sourceSerialId = 1,
          eventSerialId = 1,
          sources = $scope.eventSources,
          extraEventSignature = $scope.calendarWatchEvent ? $scope.calendarWatchEvent : angular.noop,

          wrapFunctionWithScopeApply = function(functionToWrap){
              var wrapper;

              if (functionToWrap){
                  wrapper = function(){
                      // This happens outside of angular context so we need to wrap it in a timeout which has an implied apply.
                      // In this way the function will be safely executed on the next digest.

                      var args = arguments;
                      var _this = this;
                      $timeout(function(){
                        functionToWrap.apply(_this, args);
                      });
                  };
              }

              return wrapper;
          };

      this.eventsFingerprint = function(e) {
        if (!e._id) {
          e._id = eventSerialId++;
        }
        // This extracts all the information we need from the event. http://jsperf.com/angular-calendar-events-fingerprint/3
        return "" + e._id + (e.id || '') + (e.title || '') + (e.url || '') + (+e.start || '') + (+e.end || '') +
          (e.allDay || '') + (e.className || '') + extraEventSignature(e) || '';
      };

      this.sourcesFingerprint = function(source) {
          return source.__id || (source.__id = sourceSerialId++);
      };

      this.allEvents = function() {
        // return sources.flatten(); but we don't have flatten
        var arraySources = [];
        for (var i = 0, srcLen = sources.length; i < srcLen; i++) {
          var source = sources[i];
          if (angular.isArray(source)) {
            // event source as array
            arraySources.push(source);
          } else if(angular.isObject(source) && angular.isArray(source.events)){
            // event source as object, ie extended form
            var extEvent = {};
            for(var key in source){
              if(key !== '_uiCalId' && key !== 'events'){
                 extEvent[key] = source[key];
              }
            }
            for(var eI = 0;eI < source.events.length;eI++){
              angular.extend(source.events[eI],extEvent);
            }
            arraySources.push(source.events);
          }
        }

        return Array.prototype.concat.apply([], arraySources);
      };

      // Track changes in array by assigning id tokens to each element and watching the scope for changes in those tokens
      // arguments:
      //  arraySource array of function that returns array of objects to watch
      //  tokenFn function(object) that returns the token for a given object
      this.changeWatcher = function(arraySource, tokenFn) {
        var self;
        var getTokens = function() {
          var array = angular.isFunction(arraySource) ? arraySource() : arraySource;
          var result = [], token, el;
          for (var i = 0, n = array.length; i < n; i++) {
            el = array[i];
            token = tokenFn(el);
            map[token] = el;
            result.push(token);
          }
          return result;
        };
        // returns elements in that are in a but not in b
        // subtractAsSets([4, 5, 6], [4, 5, 7]) => [6]
        var subtractAsSets = function(a, b) {
          var result = [], inB = {}, i, n;
          for (i = 0, n = b.length; i < n; i++) {
            inB[b[i]] = true;
          }
          for (i = 0, n = a.length; i < n; i++) {
            if (!inB[a[i]]) {
              result.push(a[i]);
            }
          }
          return result;
        };

        // Map objects to tokens and vice-versa
        var map = {};

        var applyChanges = function(newTokens, oldTokens) {
          var i, n, el, token;
          var replacedTokens = {};
          var removedTokens = subtractAsSets(oldTokens, newTokens);
          for (i = 0, n = removedTokens.length; i < n; i++) {
            var removedToken = removedTokens[i];
            el = map[removedToken];
            delete map[removedToken];
            var newToken = tokenFn(el);
            // if the element wasn't removed but simply got a new token, its old token will be different from the current one
            if (newToken === removedToken) {
              self.onRemoved(el);
            } else {
              replacedTokens[newToken] = removedToken;
              self.onChanged(el);
            }
          }

          var addedTokens = subtractAsSets(newTokens, oldTokens);
          for (i = 0, n = addedTokens.length; i < n; i++) {
            token = addedTokens[i];
            el = map[token];
            if (!replacedTokens[token]) {
              self.onAdded(el);
            }
          }
        };
        self = {
          subscribe: function(scope, onChanged) {
            scope.$watch(getTokens, function(newTokens, oldTokens) {
              if (!onChanged || onChanged(newTokens, oldTokens) !== false) {
                applyChanges(newTokens, oldTokens);
              }
            }, true);
          },
          onAdded: angular.noop,
          onChanged: angular.noop,
          onRemoved: angular.noop
        };
        return self;
      };

      this.getFullCalendarConfig = function(calendarSettings, uiCalendarConfig){
          var config = {};

          angular.extend(config, uiCalendarConfig);
          angular.extend(config, calendarSettings);
         
          angular.forEach(config, function(value,key){
            if (typeof value === 'function'){
              config[key] = wrapFunctionWithScopeApply(config[key]);
            }
          });

          return config;
      };

    this.getLocaleConfig = function(fullCalendarConfig) {
      if (!fullCalendarConfig.lang || fullCalendarConfig.useNgLocale) {
        // Configure to use locale names by default
        var tValues = function(data) {
          // convert {0: "Jan", 1: "Feb", ...} to ["Jan", "Feb", ...]
          var r, k;
          r = [];
          for (k in data) {
            r[k] = data[k];
          }
          return r;
        };
        var dtf = $locale.DATETIME_FORMATS;
        return {
          monthNames: tValues(dtf.MONTH),
          monthNamesShort: tValues(dtf.SHORTMONTH),
          dayNames: tValues(dtf.DAY),
          dayNamesShort: tValues(dtf.SHORTDAY)
        };
      }
      return {};
    };
  }])
  .directive('uiCalendar', ['uiCalendarConfig', function(uiCalendarConfig) {
    return {
      restrict: 'A',
      scope: {eventSources:'=ngModel',calendarWatchEvent: '&'},
      controller: 'uiCalendarCtrl',
      link: function(scope, elm, attrs, controller) {

        var sources = scope.eventSources,
            sourcesChanged = false,
            eventSourcesWatcher = controller.changeWatcher(sources, controller.sourcesFingerprint),
            eventsWatcher = controller.changeWatcher(controller.allEvents, controller.eventsFingerprint),
            options = null;

        function getOptions(){
          var calendarSettings = attrs.uiCalendar ? scope.$parent.$eval(attrs.uiCalendar) : {},
              fullCalendarConfig;

          fullCalendarConfig = controller.getFullCalendarConfig(calendarSettings, uiCalendarConfig);

          var localeFullCalendarConfig = controller.getLocaleConfig(fullCalendarConfig);
          angular.extend(localeFullCalendarConfig, fullCalendarConfig);

          options = { eventSources: sources };
          angular.extend(options, localeFullCalendarConfig);

          var options2 = {};
          for(var o in options){
            if(o !== 'eventSources'){
              options2[o] = options[o];
            }
          }
          return JSON.stringify(options2);
        }

        scope.destroy = function(){
          if(scope.calendar && scope.calendar.fullCalendar){
            scope.calendar.fullCalendar('destroy');
          }
          if(attrs.calendar) {
            scope.calendar = scope.$parent[attrs.calendar] =  $(elm).html('');
          } else {
            scope.calendar = $(elm).html('');
          }
        };

        scope.init = function(){
          scope.calendar.fullCalendar(options);
        };

        eventSourcesWatcher.onAdded = function(source) {
            scope.calendar.fullCalendar('addEventSource', source);
            sourcesChanged = true;
        };

        eventSourcesWatcher.onRemoved = function(source) {
          scope.calendar.fullCalendar('removeEventSource', source);
          sourcesChanged = true;
        };

        eventsWatcher.onAdded = function(event) {
          scope.calendar.fullCalendar('renderEvent', event);
        };

        eventsWatcher.onRemoved = function(event) {
          scope.calendar.fullCalendar('removeEvents', function(e) { 
            return e._id === event._id;
          });
        };

        eventsWatcher.onChanged = function(event) {
          event._start = $.fullCalendar.moment(event.start);
          event._end = $.fullCalendar.moment(event.end);
          scope.calendar.fullCalendar('updateEvent', event);
        };

        eventSourcesWatcher.subscribe(scope);
        eventsWatcher.subscribe(scope, function(newTokens, oldTokens) {
          if (sourcesChanged === true) {
            sourcesChanged = false;
            // prevent incremental updates in this case
            return false;
          }
        });

        scope.$watch(getOptions, function(newO,oldO){
            scope.destroy();
            scope.init();
        });
      }
    };
}]);
app.directive('ngEnter', function() {
    return function(scope, element, attrs) {
        element.bind("keydown keypress", function(event) {
            if(!event.altKey && !event.shiftKey && !event.ctrlKey && event.which === 13) {
                scope.$apply(function(){
                    scope.$eval(attrs.ngEnter, {'event': event});
                });

                event.preventDefault();
            }
        });
    };
});
app.directive('ngInfiniteScroll', ["$window", function($window) {
    return function(scope, element, attrs) {
        angular.element($window).bind("scroll", function() {
		    var windowHeight 	= "innerHeight" in window ? window.innerHeight : document.documentElement.offsetHeight;
		    var body 			= document.body, html = document.documentElement;
		    var docHeight 		= Math.max(body.scrollHeight, body.offsetHeight, html.clientHeight,  html.scrollHeight, html.offsetHeight);
		    windowBottom 		= windowHeight + window.pageYOffset;
		    
		    if (windowBottom >= docHeight) {
			    // Insert loader code here.
			    scope.offset = scope.offset + scope.limit;
		        scope.load();
		    }
		});
    };
}]);
app.directive('stringToNumber', function() {
  return {
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      ngModel.$parsers.push(function(value) {
        return '' + value;
      });
      ngModel.$formatters.push(function(value) {
        return parseFloat(value, 10);
      });
    }
  };
});
app.filter('cutString', function () {
    return function (value, wordwise, max, tail) {
        if (!value) return '';

        max = parseInt(max, 10);
        if (!max) return value;
        if (value.length <= max) return value;

        value = value.substr(0, max);
        if (wordwise) {
            var lastspace = value.lastIndexOf(' ');
            if (lastspace != -1) {
                value = value.substr(0, lastspace);
            }
        }

        return value + (tail || '…');
    };
});

app.filter('dateToISO', function() {
    return function(input) {
        if(input !== undefined){
            var a = input.split(/[^0-9]/);
            var d=new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5] );
            return new Date(d).toISOString();
        }
    };
});
app.filter('isEmpty', [function() {
    return function(object) {
        return angular.equals({}, object);
    };
}]);
app.filter('num', function() {
    return function(input) {
        return parseInt(input, 10);
    };
});
app.filter('range', function() {
    return function(input, start, end) {
        start = parseInt(start);
        end = parseInt(end);
        var i;
        if(start < end){
            for (i=start; i<end; i++)
                input.push(i);
        }else{
            for (i=start; i>end; i--)
                input.push(i);
        }
        return input;
    };
});
app.filter('renderHTMLCorrectly', ["$sce", function($sce)
{
    return function(stringToParse)
    {
        return $sce.trustAsHtml(stringToParse);
    };
}]);

app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {

    $stateProvider.state('admin', {
        url: '/admin',
        parent: 'root',
        abstract: true,
        restricted: true
    });

    $stateProvider.state('admin.dashboard', {
        url: '/dashboard',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.dashboard',
                controller: 'AdminDashboardController as dashboard'
            }
        }
    });

    $stateProvider.state('admin.users', {
        url: '/users',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.users.index',
                controller: 'AdminUsersController as users'
            }
        }
    });

    $stateProvider.state('admin.clubs', {
        url: '/clubs',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.clubs.index',
                controller: 'AdminClubsController as clubs'
            }
        }
    });
    $stateProvider.state('admin.clubs.show', {
        url: '/:id',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.clubs.show',
                controller: 'AdminClubController as clubs'
            }
        }
    });
    $stateProvider.state('admin.clubs.show.users', {
        url: '/users',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.clubs.users'
            }
        }
    });
    $stateProvider.state('admin.clubs.show.admins', {
        url: '/admins',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.clubs.admins'
            }
        }
    });
    $stateProvider.state('admin.clubs.show.merge', {
        url: '/merge',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.clubs.merge'
            }
        }
    });
}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {
//	$locationProvider.html5Mode(true);

	// Auth.
	$stateProvider.state('auth', {
		url: '/auth',
		parent: 'public',
		abstract: true,
		views: {
			'content@': {
				templateUrl: '/publicviews/index',
				controller: 'AuthController'
			}
		}
	});
	$urlRouterProvider.when('/auth', '/auth/login');
	$stateProvider.state('auth.register', {
		url: '/register',
		templateUrl: '/publicviews/register'
	});
	$stateProvider.state('auth.invite', {
		url: '/register/:invite_token',
		templateUrl: '/publicviews/register',
		controller: 'AuthController'
	});
	$stateProvider.state('auth.inactive', {
		url: '/inactive',
		templateUrl: '/publicviews/inactive'
	});
	$stateProvider.state('auth.activate', {
		url: '/activate/:token',
		templateUrl: '/publicviews/activate',
		controller: 'ActivationController'
	});
	$stateProvider.state('auth.login', {
		url: '/login',
		templateUrl: '/publicviews/login'
	});
	$stateProvider.state('auth.password', {
		url: '/password',
		templateUrl: '/publicviews/password'
	});
	$stateProvider.state('auth.reset', {
		url: '/reset/:token',
		templateUrl: '/publicviews/reset',
		controller: ["$rootScope", "$scope", "$stateParams", "AuthFactory", function($rootScope, $scope, $stateParams, AuthFactory){
			$scope.reset = {email: '', token: $stateParams.token};

			$scope.resetPassword = function()
			{

				AuthFactory
					.resetPassword($scope.reset)
					.success(function(response){
						$scope.passwordRequested = true;
						$scope.reset = {email: '', token: $stateParams.token};
					})
					.error(function(response){
						$rootScope.displayFlashMessages(response, 'error');
						$scope.passwordRequested = false;
					})
					.then(function(response){
						if(response.data.status !== 'success')
						{
							$scope.passwordRequested = true;
						}
					});
			};
		}]
	});
	$stateProvider.state('auth.logout', {
		url: '/logout',
		controller: ["AuthFactory", function(AuthFactory){
			AuthFactory.logout();
		}],
		restricted: true
	});

}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {


	$stateProvider.state('championships', {
		url: '/championships',
		parent: 'root',
		views:{
			'content@': {
				templateUrl: '/views/partials.championships.index',
				controller: 'ChampionshipsController',
				controllerAs: 'championships'
			}
		},
		restricted: true
	});
	$stateProvider.state('championship', {
		url: '/championship/:id',
		parent: 'root',
		views: {
			'content@': {
				templateUrl: '/views/partials.championships.show',
				controller: 'ChampionshipController',
				controllerAs: 'championships'
			}
		},
		restricted: true
	});
	$stateProvider.state('championship.show', {
		url: '/:view',
		views: {
			'main': {
				templateUrl: function($stateParams){
					return '/views/partials.championships.show.'+$stateParams.view;
				},
				controller: ["$rootScope", "$stateParams", function($rootScope, $stateParams){
					$rootScope.currentView = $stateParams.view;
				}]
			}
		},
		restricted: true
	});
}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {

    $stateProvider.state('club', {
        url: '/club',
        parent: 'root',
        abstract: true,
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.club.index',
                controller: 'ClubController as club'
            }
        }
    });

    $stateProvider.state('club.connect', {
        url: '/club/connect',
        parent: 'root',
        views: {
            'content@': {
                templateUrl : '/views/partials.club.connect',
                controller: 'ClubConnectController as club'
            }
        }
    });

    $stateProvider.state('club.information', {
        url: '/information',
        views: {
            'main':{
                templateUrl: '/views/partials.club.information',
                controller: 'ClubController as club'
            }
        },
        restricted: true
    });

    $stateProvider.state('club.edit', {
        url: '/edit',
        views: {
            'main':{
                templateUrl: '/views/partials.club.edit',
                controller: 'ClubController as club'
            }
        },
        restricted: true
    });

    $stateProvider.state('club.admins', {
        url: '/admins',
        views: {
            'main':{
                templateUrl: '/views/partials.club.admins',
            }
        },
        restricted: true
    });

    $stateProvider.state('club.premium', {
        url: '/premium',
        views: {
            'main': {
                templateUrl: '/views/partials.club.premium',
                controller: 'PremiumController as premium'
            }
        }
    });

    $stateProvider.state('club.users', {
        abstract: true,
        url: '/users',
        restricted: true
    });
    $stateProvider.state('club.users.index', {
        url: '',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.users.index',
                controller: 'ClubController as club'
            }
        }
    });

    $stateProvider.state('club.users.create', {
        url: '/create',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.users.create',
                controller: 'UserController as user'
            }
        }
    });

    $stateProvider.state('club.users.edit', {
        url: '/:user_id/edit',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.users.edit',
                controller: 'UserController as user'
            }
        }
    });

    $stateProvider.state('club.payments', {
        abstract: true,
        url: '/payments',
        restricted: true
    });
    $stateProvider.state('club.payments.index', {
        url: '',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.payments.index',
                controller: 'PaymentsController as payments'
            }
        }
    });


}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {


	$stateProvider.state('competitions', {
		url: '/competitions?page&sort',
		parent: 'root',
		views:{
			'content@': {
				templateUrl: '/views/partials.competitions.index',
				controller: 'CompetitionsController',
				controllerAs: 'competitions'
			}
		},
		params: {
			page: {
				value: '0',
				squash: true
			},
			sort: {
				value: 'date',
				squash: true
			}
		},
		restricted: true
	});
	$stateProvider.state('competition', {
		url: '/competition/:id',
		parent: 'root',
		views: {
			'content@': {
				templateUrl: '/views/partials.competitions.show',
				controller: 'CompetitionController',
				controllerAs: 'competitions'
			}
		},
		restricted: true
	});
	$stateProvider.state('competition.clubsignups', {
		url: '/clubsignups',
		views: {
			'main': {
				templateUrl: '/views/partials.competitions.show.clubsignups',
				controller: 'ClubSignupController as clubsignups'
			}
		},
		restricted: true
	});
	$stateProvider.state('competition.teamsignups', {
		url: '/teamsignups',
		views: {
			'main': {
				templateUrl: '/views/partials.competitions.show.teamsignups.index',
				controller: 'TeamSignupController as teamsignups'
			}
		},
		restricted: true
	});
	$stateProvider.state('competition.teamsignups.create', {
		url: '/create',
		views: {
			'': {
				templateUrl: '/views/partials.competitions.show.teamsignups.create'
			}
		},
		restricted: true
	});
	$stateProvider.state('competition.teamsignups.edit', {
		url: '/:teams_id',
		views: {
			'': {
				templateUrl: '/views/partials.competitions.show.teamsignups.edit',
				controller: 'TeamSignupController as teamsignups'
			}
		},
		restricted: true
	});
	$stateProvider.state('competition.signup', {
		url: '/signup',
		restricted: true,
		views:{
			'main':{
				templateUrl:'/views/partials.competitions.show.signup',
				controller: 'CompetitionController as competitions'
			}
		}
	});
	$stateProvider.state('competition.signups', {
		url: '/signups',
		restricted: true,
		views:{
			'main':{
				templateUrl:'/views/partials.competitions.show.signups',
				controller: 'CompetitionController as competitions'
			}
		}
	});


	$stateProvider.state('competition.show', {
		url: '/:view',
		views: {
			'main': {
				templateUrl: function($stateParams){
					return '/views/partials.competitions.show.'+$stateParams.view;

				},
				controller: ["$rootScope", "$stateParams", function($rootScope, $stateParams){
					$rootScope.currentView = $stateParams.view;
				}]
			}
		},
		restricted: true
	});
}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {

    $stateProvider.state('premium', {
        url: '/premium',
        parent: 'root',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.premium.index',
                controller: 'PremiumController as premium'
            }
        }
    });
}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {

    $locationProvider.html5Mode(true);

    $urlRouterProvider.otherwise('/competitions');

    if(localStorage.getItem('user'))
    {
        $urlRouterProvider.otherwise('/competitions');
    }
    else
    {
        $urlRouterProvider.otherwise('/auth/register');
    }

    $stateProvider.state('root', {
        abstract: true,
        views:{
            'navigation@': {
                templateUrl: '/views/partials.navigation'
            }
        }
    });

    $stateProvider.state('public', {
        abstract: true,
        views:{
            'navigation@': {
                templateUrl: '/publicviews/navigation'
            }
        }
    });

    $stateProvider.state('dashboard', {
        url: '/',
        parent: 'root',
        views: {
            'content@': {
                templateUrl: '/views/partials.dashboard',
                controller: 'DashboardController'
            }
        },
        restricted: true
    });

}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {

    $stateProvider.state('settings', {
        url: '/settings',
        parent: 'root',
        abstract: true,
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.settings.index',
                controller: 'SettingsController',
                controllerAs: 'settings'
            }
        }
    });

    $stateProvider.state('settings.index', {
        url:'/',
        views: {
            'setting': {
                controller: ["$state", function($state){
                    $state.go('settings.user');
                }]
            }
        },
        restricted: true
    });

    $stateProvider.state('settings.user', {
        url: '/user',
        views: {
            'setting':{
                templateUrl: '/views/partials.settings.user',
                controller: "UserProfileController as userprofile"
            }
        },
        restricted: true
    });

    $stateProvider.state('settings.editprofile', {
        url: '/editprofile',
        views: {
            'setting': {
                templateUrl: '/views/partials.settings.useredit',
                controller: "UserProfileController as userprofile"
            }
        },
        restricted: true
    });

    $stateProvider.state('settings.cancelaccount', {
        url: '/cancelaccount',
        views: {
            'setting': {
                templateUrl: '/views/partials.settings.cancelaccount'
            }
        },
        restricted: true
    });


    $stateProvider.state('settings.password', {
        url: '/password',
        views: {
            'setting':{
                templateUrl: '/views/partials.settings.password',
                controller: "PasswordController as password"
            }
        },
        restricted: true
    });
    
    $stateProvider.state('settings.invite', {
        url: '/invite',
        views: {
            'setting':{
                templateUrl: '/views/partials.settings.invite',
                controller: "InviteController as invite"
            }
        },
        restricted: true
    });

}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {


	$stateProvider.state('signups', {
		url: '/signups',
		parent: 'root',
		views:{
			'content@': {
				templateUrl: '/views/partials.signups.index',
				controller: 'SignupsController',
				controllerAs: 'signups'
			}
		},
		restricted: true
	});
	$stateProvider.state('signup', {
		url: '/signup/:id',
		parent: 'root',
		views: {
			'content@': {
				templateUrl: '/views/partials.signups.show',
				controller: 'SignupController',
				controllerAs: 'signups'
			}
		},
		restricted: true
	});

	$stateProvider.state('signup.edit', {
		url: '/edit',
		views: {
			'content@': {
				templateUrl: '/views/partials.signups.edit',
				controller: 'SignupController',
				controllerAs: 'signups'
			}
		},
		restricted: true
	});

}]);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJtb2R1bGVzL2FkbWluLmNsdWJzLm1vZHVsZS5qcyIsIm1vZHVsZXMvYWRtaW4ubW9kdWxlLmpzIiwibW9kdWxlcy9hZG1pbi51c2Vycy5tb2R1bGUuanMiLCJtb2R1bGVzL2F1dGgubW9kdWxlLmpzIiwibW9kdWxlcy9jYWxlbmRhci5tb2R1bGUuanMiLCJtb2R1bGVzL2NoYW1waW9uc2hpcHMubW9kdWxlLmpzIiwibW9kdWxlcy9jbHVicy5tb2R1bGUuanMiLCJtb2R1bGVzL2NvbXBldGl0aW9ucy5tb2R1bGUuanMiLCJtb2R1bGVzL2Rhc2hib2FyZC5tb2R1bGUuanMiLCJtb2R1bGVzL2Vycm9yaGFuZGxpbmcubW9kdWxlLmpzIiwibW9kdWxlcy9wYXltZW50cy5tb2R1bGUuanMiLCJtb2R1bGVzL3ByZW1pdW0ubW9kdWxlLmpzIiwibW9kdWxlcy9zZXR0aW5ncy5tb2R1bGUuanMiLCJtb2R1bGVzL3NpZ251cHMubW9kdWxlLmpzIiwibW9kdWxlcy90ZWFtcy5tb2R1bGUuanMiLCJtb2R1bGVzL3VzZXJzLm1vZHVsZS5qcyIsImNvbmZpZy9lcnJvcmhhbmRsaW5nLmNvbmZpZy5qcyIsImNvbmZpZy9pbnRlcmNlcHRvcnMuanMiLCJkaXJlY3RpdmVzL25nLWZ1bGxjYWxlbmRhci5qcyIsImRpcmVjdGl2ZXMvbmdFbnRlci5qcyIsImRpcmVjdGl2ZXMvbmdJbmZpbml0ZVNjcm9sbC5qcyIsImRpcmVjdGl2ZXMvbmdTdHJpbmdUb051bWJlci5qcyIsImZpbHRlcnMvY3V0U3RyaW5nLmZpbHRlci5qcyIsImZpbHRlcnMvZGF0ZVRvSXNvLmZpbHRlci5qcyIsImZpbHRlcnMvaXNFbXB0eS5maWx0ZXIuanMiLCJmaWx0ZXJzL251bS5maWx0ZXIuanMiLCJmaWx0ZXJzL3JhbmdlLmZpbHRlci5qcyIsImZpbHRlcnMvcmVuZGVySFRNTENvcnJlY3RseS5maWx0ZXIuanMiLCJyb3V0aW5nL2FkbWluLnJvdXRpbmcuanMiLCJyb3V0aW5nL2F1dGgucm91dGluZy5qcyIsInJvdXRpbmcvY2hhbXBpb25zaGlwcy5yb3V0aW5nLmpzIiwicm91dGluZy9jbHVicy5yb3V0aW5nLmpzIiwicm91dGluZy9jb21wZXRpdGlvbnMucm91dGluZy5qcyIsInJvdXRpbmcvcHJlbWl1bS5yb3V0aW5nLmpzIiwicm91dGluZy9yb3V0aW5nLmpzIiwicm91dGluZy9zZXR0aW5ncy5yb3V0aW5nLmpzIiwicm91dGluZy9zaWdudXAucm91dGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLE1BQUEsUUFBQSxPQUFBO0NBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs2QkFDQSxTQUFBLHFCQUFBO0VBQ0EscUJBQUEsWUFBQTtFQUNBLHFCQUFBLFVBQUE7OztBQUdBLElBQUEsb0hBQUEsU0FBQSxZQUFBLFFBQUEsVUFBQSxxQkFBQSxXQUFBLGFBQUEsU0FBQSxXQUFBOztDQUVBLFFBQUEsR0FBQSxVQUFBLGlCQUFBOztDQUVBLFdBQUEsSUFBQSxxQkFBQSxTQUFBLEdBQUEsSUFBQTtFQUNBLElBQUEsUUFBQSxhQUFBLFFBQUE7O0VBRUEsV0FBQSxlQUFBLEdBQUE7O0VBRUEsR0FBQSxVQUFBLEtBQUE7R0FDQSxXQUFBLGdCQUFBO0dBQ0EsSUFBQSxPQUFBLEtBQUEsTUFBQSxhQUFBLFFBQUE7R0FDQSxXQUFBLGNBQUE7OztFQUdBLEdBQUEsQ0FBQSxHQUFBLEtBQUEsTUFBQSxLQUFBLEdBQUEsTUFBQSxXQUFBLFdBQUEsY0FBQTtHQUNBLE9BQUEsR0FBQSxhQUFBLElBQUEsQ0FBQSxTQUFBOzs7RUFHQSxJQUFBLEdBQUEsWUFBQTs7O0dBR0EsSUFBQSxVQUFBLE1BQUE7SUFDQSxFQUFBO0lBQ0EsT0FBQSxHQUFBLGNBQUEsSUFBQSxDQUFBLFVBQUE7Ozs7Ozs7OztHQVNBLFdBQUEsb0JBQUE7SUFDQSxXQUFBO0lBQ0EsYUFBQTs7R0FFQSxXQUFBLG9CQUFBO0lBQ0EsY0FBQTtJQUNBLFlBQUE7Ozs7RUFJQSxXQUFBLGVBQUE7Ozs7Q0FJQSxXQUFBLElBQUEsdUJBQUEsVUFBQSxPQUFBO0VBQ0EsUUFBQSxHQUFBLFFBQUEsWUFBQSxVQUFBOzs7Ozs7Ozs7OztDQVdBLFdBQUEsYUFBQSxTQUFBO0NBQ0E7O0VBRUEsV0FBQSxnQkFBQTtFQUNBLFdBQUEsa0JBQUE7O0VBRUEsR0FBQSxPQUFBLGFBQUE7RUFDQTtHQUNBLFdBQUEsY0FBQSxLQUFBOzs7RUFHQTtHQUNBLFFBQUEsSUFBQTtHQUNBLEdBQUE7R0FDQTtJQUNBLFFBQUEsUUFBQSxVQUFBLFNBQUEsYUFBQTtLQUNBLElBQUEsVUFBQSxDQUFBLE9BQUEsaUJBQUEsWUFBQSxlQUFBLGFBQUE7S0FDQSxXQUFBLGNBQUEsS0FBQTs7O0lBR0EsUUFBQSxJQUFBLFdBQUE7O0lBRUEsU0FBQSxVQUFBO0tBQ0EsV0FBQSxnQkFBQTtPQUNBOzs7Ozs7Q0FNQSxXQUFBLHVCQUFBLFNBQUEsVUFBQTtDQUNBO0VBQ0EsU0FBQSxPQUFBLFdBQUE7RUFDQSxXQUFBLGdCQUFBO0VBQ0EsV0FBQSxrQkFBQTs7RUFFQSxHQUFBLFFBQUEsU0FBQSxXQUFBLFdBQUEsQ0FBQTs7RUFFQSxJQUFBLG1CQUFBLENBQUE7RUFDQSxJQUFBLE9BQUEsQ0FBQSxRQUFBLGFBQUEsaUJBQUE7O0VBRUEsUUFBQSxRQUFBLFVBQUEsU0FBQSxRQUFBOztHQUVBLEdBQUEsaUJBQUEsUUFBQSxXQUFBO0dBQ0E7SUFDQSxJQUFBLE9BQUEsQ0FBQSxPQUFBLFlBQUEsWUFBQSxVQUFBLFFBQUE7SUFDQSxHQUFBLFFBQUE7SUFDQTtLQUNBLFdBQUEsY0FBQSxLQUFBOzs7SUFHQTtLQUNBLFdBQUEsZ0JBQUEsS0FBQTs7Ozs7RUFLQSxXQUFBLG9CQUFBLFNBQUEsVUFBQTtHQUNBLFdBQUEsZ0JBQUE7R0FDQSxXQUFBLGtCQUFBO0tBQ0E7Ozs7Ozs7O0NBUUEsV0FBQSxjQUFBLFNBQUEsT0FBQTtDQUNBO0VBQ0EsR0FBQSxDQUFBLE9BQUEsUUFBQTtFQUNBLEdBQUEsTUFBQTtHQUNBO0tBQ0EsWUFBQSxPQUFBOztLQUVBLEtBQUEsU0FBQSxTQUFBO0tBQ0EsR0FBQSxTQUFBLFFBQUE7TUFDQSxHQUFBLFNBQUEsU0FBQSxXQUFBLHFCQUFBLENBQUEsU0FBQSxVQUFBO1lBQ0EsR0FBQSxTQUFBLEtBQUE7TUFDQSxHQUFBLFNBQUEsS0FBQSxTQUFBLFdBQUEscUJBQUEsQ0FBQSxTQUFBLEtBQUEsVUFBQTs7Ozs7O0FDdktBLFFBQUEsT0FBQSxtQkFBQTs7S0FFQSxXQUFBLHNGQUFBLFNBQUEsWUFBQSxjQUFBLFFBQUEsa0JBQUE7SUFDQSxJQUFBLE9BQUE7O0lBRUEsS0FBQSxTQUFBO1FBQ0EsUUFBQTtRQUNBLG9CQUFBO1FBQ0EscUJBQUE7OztJQUdBLEtBQUEsd0JBQUEsU0FBQSxLQUFBO1FBQ0EsR0FBQSxLQUFBLE9BQUEsc0JBQUEsS0FBQSxZQUFBO1lBQ0EsT0FBQTtjQUNBLEdBQUEsQ0FBQSxLQUFBLE9BQUEsbUJBQUE7WUFDQSxPQUFBOzs7SUFHQSxLQUFBLHlCQUFBLFNBQUEsS0FBQTtRQUNBLEdBQUEsS0FBQSxPQUFBLHVCQUFBLEtBQUEsYUFBQTtZQUNBLE9BQUE7Y0FDQSxHQUFBLENBQUEsS0FBQSxPQUFBLG9CQUFBO1lBQ0EsT0FBQTs7OztJQUlBLFNBQUEsV0FBQSxNQUFBO1FBQ0EsV0FBQSxlQUFBO1FBQ0Esa0JBQUEsS0FBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsUUFBQSxTQUFBO2dCQUNBLFdBQUEsZUFBQTs7O0lBR0EsU0FBQSxXQUFBOztJQUVBLEtBQUEsT0FBQSxTQUFBLGFBQUEsTUFBQTtJQUNBLEtBQUEsT0FBQSxhQUFBO0lBQ0EsS0FBQSxjQUFBLENBQUEsV0FBQSxRQUFBO0lBQ0E7SUFDQTs7O0lBR0EsS0FBQSxXQUFBLFdBQUE7UUFDQSxLQUFBO1FBQ0EsV0FBQSxLQUFBO1FBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7O0lBRUEsS0FBQSxXQUFBLFdBQUE7UUFDQSxJQUFBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsS0FBQTtZQUNBLFdBQUEsS0FBQTtZQUNBLE9BQUEsR0FBQSxLQUFBLENBQUEsTUFBQSxLQUFBLE9BQUEsQ0FBQSxRQUFBOzs7SUFHQSxLQUFBLGNBQUEsV0FBQTtRQUNBO1FBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7Ozs7Q0FJQSxXQUFBLDJHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxVQUFBLG1CQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsS0FBQSxjQUFBO0lBQ0EsS0FBQSxlQUFBOztJQUVBLEdBQUEsQ0FBQSxhQUFBLElBQUEsT0FBQSxHQUFBOztJQUVBLFNBQUEsTUFBQTtRQUNBLGtCQUFBLEtBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsT0FBQSxTQUFBOzthQUVBLE1BQUEsVUFBQTtnQkFDQSxPQUFBLEdBQUEsZUFBQSxJQUFBLENBQUEsU0FBQTs7OztJQUlBLEtBQUEsYUFBQSxTQUFBLEtBQUE7UUFDQSxLQUFBLFFBQUE7UUFDQSxrQkFBQSxXQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBO2dCQUNBLEtBQUEsTUFBQSxRQUFBLFNBQUE7Z0JBQ0EsS0FBQSxRQUFBO2dCQUNBLE9BQUEsR0FBQSxTQUFBLENBQUEsSUFBQSxLQUFBOzthQUVBLE1BQUEsU0FBQSxTQUFBO2dCQUNBLFdBQUEscUJBQUEsU0FBQSxTQUFBOzs7O0lBSUEsS0FBQSxhQUFBLFNBQUEsS0FBQTtRQUNBLGtCQUFBLFdBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxPQUFBLEdBQUE7Ozs7SUFJQSxLQUFBLGlCQUFBLFNBQUEsYUFBQTtJQUNBO1FBQ0EsT0FBQTthQUNBLGVBQUE7YUFDQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7O2FBRUEsS0FBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxjQUFBLFNBQUEsS0FBQSxNQUFBLFNBQUE7Z0JBQ0EsT0FBQSxTQUFBLEtBQUEsTUFBQSxJQUFBLFNBQUEsS0FBQTtvQkFDQSxLQUFBLGtCQUFBO29CQUNBLEdBQUEsS0FBQSxNQUFBLEtBQUEsSUFBQSxLQUFBLGtCQUFBO29CQUNBLE9BQUE7Ozs7O0lBS0EsS0FBQSxhQUFBLFNBQUE7SUFDQTtRQUNBLEtBQUEsZUFBQTs7O0lBR0EsS0FBQSxhQUFBLFNBQUEsYUFBQSxVQUFBO1FBQ0EsR0FBQSxlQUFBLFVBQUE7WUFDQSxrQkFBQSxXQUFBLGFBQUE7aUJBQ0EsUUFBQSxTQUFBLFNBQUE7b0JBQ0EsV0FBQSxxQkFBQSxTQUFBO29CQUNBLE9BQUEsR0FBQSxvQkFBQSxDQUFBLEdBQUEsWUFBQSxDQUFBLFNBQUE7O2lCQUVBLFFBQUEsU0FBQSxTQUFBO29CQUNBLFdBQUEscUJBQUEsU0FBQSxTQUFBOzs7OztJQUtBOztDQUVBLFFBQUEsaURBQUEsU0FBQSxPQUFBLGVBQUE7O0lBRUEsT0FBQTtRQUNBLE1BQUEsVUFBQSxNQUFBLElBQUE7WUFDQSxJQUFBLE1BQUEsZUFBQTs7WUFFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtZQUNBLElBQUEsTUFBQSxPQUFBLFdBQUE7O1lBRUEsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7UUFJQSxNQUFBLFNBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxlQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztRQUlBLFlBQUEsU0FBQSxNQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQTs7OztRQUlBLFlBQUEsU0FBQSxNQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBLGVBQUEsS0FBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7UUFJQSxZQUFBLFNBQUEsTUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxlQUFBLEtBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O1FBSUEsY0FBQSxVQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztRQUlBLGdCQUFBLFNBQUEsU0FBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBOzs7O1FBSUEsWUFBQSxTQUFBLEtBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsWUFBQSxLQUFBLFVBQUEsUUFBQSxLQUFBOzs7O1FBSUEsZ0JBQUEsU0FBQSxRQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLGVBQUE7Ozs7UUFJQSxnQkFBQSxTQUFBLE9BQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsU0FBQTs7OztRQUlBLG1CQUFBLFNBQUEsT0FBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBOzs7O1FBSUEsWUFBQSxTQUFBLGFBQUEsV0FBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxR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QTtPQUNBLFVBQUE7T0FDQSxVQUFBOztHQUVBLFVBQUE7R0FDQSxhQUFBO0dBQ0EsUUFBQTtJQUNBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsT0FBQTs7R0FFQSxjQUFBO0lBQ0EsS0FBQTtJQUNBLE1BQUE7SUFDQSxPQUFBOztHQUVBLGFBQUE7T0FDQSxPQUFBO09BQ0EsTUFBQTtPQUNBLEtBQUE7O0dBRUEsaUJBQUE7R0FDQSxZQUFBO0dBQ0EsWUFBQTtHQUNBLFNBQUE7R0FDQSxTQUFBO0dBQ0EsWUFBQTtHQUNBLGFBQUE7U0FDQSxRQUFBO1NBQ0EsVUFBQTtTQUNBLFlBQUEsU0FBQSxNQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsS0FBQSxNQUFBLEtBQUEsTUFBQTtJQUNBLElBQUEsTUFBQSxLQUFBLE1BQUEsS0FBQSxJQUFBO0lBQ0EsT0FBQSxpQkFBQSxDQUFBO2NBQ0EsS0FBQSxlQUFBLGtCQUFBLE1BQUEsUUFBQTs7O0dBR0EsWUFBQSxPQUFBO1NBQ0EsV0FBQSxPQUFBO1NBQ0EsYUFBQSxTQUFBLE1BQUEsU0FBQTtVQUNBLFFBQUEsSUFBQTs7Ozs7S0FLQSxPQUFBLGFBQUEsU0FBQSxLQUFBLFVBQUE7T0FDQSxTQUFBLGFBQUEsYUFBQTs7O0tBR0EsT0FBQSxpQkFBQSxTQUFBLFVBQUE7UUFDQSxTQUFBLFVBQUE7U0FDQSxRQUFBLElBQUE7SUFDQSxHQUFBLFNBQUE7SUFDQSxTQUFBLGFBQUE7O1dBRUE7Ozs7Q0FJQTs7O0FDL0VBLFFBQUEsT0FBQSxxQkFBQTs7Q0FFQSxXQUFBLHNHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxxQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLFdBQUEsTUFBQTtRQUNBLHFCQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGdCQUFBLFNBQUE7OztJQUdBLFNBQUEsV0FBQTs7SUFFQSxLQUFBLE9BQUEsU0FBQSxhQUFBLE1BQUE7SUFDQSxLQUFBLE9BQUEsYUFBQTtJQUNBLEtBQUEsY0FBQSxDQUFBLFdBQUEsUUFBQTtJQUNBO0lBQ0E7Ozs7Q0FJQSxXQUFBLHFHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxzQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLE1BQUE7UUFDQSxxQkFBQSxLQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGdCQUFBLFNBQUE7Z0JBQ0EsS0FBQSxPQUFBLEtBQUEsTUFBQSxhQUFBLFFBQUE7O2FBRUEsTUFBQSxVQUFBO2dCQUNBLE9BQUEsR0FBQSxpQkFBQSxJQUFBLENBQUEsU0FBQTs7Ozs7O0NBTUEsUUFBQSxvREFBQSxTQUFBLE9BQUEsZ0JBQUE7O0lBRUEsT0FBQTtRQUNBLE1BQUEsVUFBQSxNQUFBLElBQUE7WUFDQSxJQUFBLE1BQUEsZUFBQTs7WUFFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtZQUNBLElBQUEsTUFBQSxPQUFBLFdBQUE7O1lBRUEsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7UUFJQSxNQUFBLFNBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxpQkFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7UUFJQSxjQUFBLFNBQUEsUUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7UUFJQSxjQUFBLFNBQUEsUUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxVQUFBLE9BQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBOzs7O1FBSUEsY0FBQSxTQUFBLFFBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUEsVUFBQSxPQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7Ozs7OztBQ25GQSxRQUFBLE9BQUEsYUFBQTs7Q0FFQSxXQUFBLHFFQUFBLFNBQUEsWUFBQSxRQUFBLFFBQUEsYUFBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLFNBQUE7RUFDQSxPQUFBO0dBQ0EsUUFBQTs7OztDQUlBLEtBQUEsWUFBQTs7Q0FFQSxTQUFBLGVBQUE7RUFDQSxXQUFBLGVBQUE7RUFDQSxhQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGdCQUFBO0lBQ0EsR0FBQSxDQUFBLFNBQUEsR0FBQTtLQUNBLE9BQUEsR0FBQSxnQkFBQSxJQUFBLENBQUEsU0FBQTs7SUFFQSxLQUFBLE9BQUE7SUFDQSxXQUFBLGVBQUE7Ozs7Q0FJQSxLQUFBLGFBQUEsVUFBQTtFQUNBLGFBQUEsV0FBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxPQUFBLEdBQUEsb0JBQUEsSUFBQSxDQUFBLFNBQUE7O0lBRUEsTUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFVBQUE7Ozs7Q0FJQSxLQUFBLGlCQUFBLFNBQUE7Q0FDQTtFQUNBLEdBQUEsTUFBQTtHQUNBLGFBQUEsZUFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBLEtBQUEsb0JBQUEsU0FBQTtDQUNBO0VBQ0EsR0FBQSxNQUFBO0dBQ0EsYUFBQSxrQkFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBOzs7Q0FHQSxXQUFBLDRFQUFBLFNBQUEsWUFBQSxRQUFBLFFBQUEsY0FBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLGNBQUE7Q0FDQSxLQUFBLGVBQUE7Q0FDQSxLQUFBLFdBQUE7Q0FDQSxLQUFBLGVBQUE7Q0FDQSxLQUFBLGFBQUE7O0NBRUEsU0FBQSxlQUFBO0VBQ0EsV0FBQSxlQUFBO0VBQ0EsYUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsS0FBQSxnQkFBQTtJQUNBLEdBQUEsU0FBQSxHQUFBO0tBQ0EsT0FBQSxHQUFBLG9CQUFBLElBQUEsQ0FBQSxTQUFBOztJQUVBLEtBQUEsT0FBQTtJQUNBLFdBQUEsZUFBQTs7Ozs7Q0FLQSxLQUFBLGlCQUFBLFNBQUEsYUFBQTtDQUNBO0VBQ0EsT0FBQTtJQUNBLGVBQUE7SUFDQSxNQUFBLFNBQUEsU0FBQTtJQUNBLFdBQUEscUJBQUEsVUFBQTs7SUFFQSxLQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsY0FBQSxTQUFBLEtBQUEsTUFBQSxTQUFBO0lBQ0EsT0FBQSxTQUFBLEtBQUEsTUFBQSxJQUFBLFNBQUEsS0FBQTtLQUNBLEtBQUEsa0JBQUE7S0FDQSxHQUFBLEtBQUEsTUFBQSxLQUFBLElBQUEsS0FBQSxrQkFBQTtLQUNBLE9BQUE7Ozs7O0NBS0EsS0FBQSxhQUFBLFNBQUE7Q0FDQTtFQUNBLEdBQUEsTUFBQSxvQkFBQSxNQUFBLE9BQUE7RUFDQSxLQUFBLGtCQUFBO0VBQ0EsS0FBQSxXQUFBOzs7Q0FHQSxLQUFBLGVBQUE7Q0FDQTtFQUNBLEtBQUEsa0JBQUE7RUFDQSxLQUFBLFdBQUE7OztDQUdBLEtBQUEsaUJBQUEsU0FBQTtDQUNBO0VBQ0EsYUFBQSxlQUFBLEtBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsV0FBQTtJQUNBLEtBQUEsYUFBQTtJQUNBLEtBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxvQkFBQSxJQUFBLENBQUEsVUFBQTs7OztDQUlBLEtBQUEsYUFBQTtDQUNBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsZUFBQSxDQUFBLEtBQUEsY0FBQSxPQUFBO0VBQ0EsSUFBQSxPQUFBO0dBQ0EsTUFBQSxLQUFBO0dBQ0EsVUFBQSxLQUFBOzs7RUFHQSxhQUFBLFdBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsY0FBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLEtBQUEsV0FBQTtJQUNBLEtBQUEsYUFBQTtJQUNBLEtBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxvQkFBQSxJQUFBLENBQUEsVUFBQTs7OztDQUlBOzs7O0NBSUEsUUFBQSw0Q0FBQSxTQUFBLE9BQUEsZUFBQTs7Q0FFQSxPQUFBO0VBQ0EsTUFBQSxVQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsTUFBQSxlQUFBOztHQUVBLElBQUEsQ0FBQSxRQUFBLFlBQUEsT0FBQSxLQUFBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQTs7R0FFQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztFQUlBLE1BQUEsU0FBQSxJQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQSxTQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O0VBSUEsWUFBQSxTQUFBLE1BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7RUFJQSxZQUFBLFNBQUEsTUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQTs7OztFQUlBLFlBQUEsU0FBQSxNQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQSxTQUFBLEtBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7RUFJQSxjQUFBLFVBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O0VBSUEsZ0JBQUEsU0FBQSxTQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsWUFBQTs7OztFQUlBLFlBQUEsU0FBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsWUFBQSxLQUFBLFVBQUEsUUFBQSxLQUFBOzs7O0VBSUEsZ0JBQUEsU0FBQSxRQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsZUFBQTs7OztFQUlBLGdCQUFBLFNBQUEsT0FBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFNBQUE7Ozs7RUFJQSxtQkFBQSxTQUFBLE9BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBOzs7OztBQzNQQSxRQUFBLE9BQUEsb0JBQUE7O0NBRUEsV0FBQSxvR0FBQSxTQUFBLFlBQUEsUUFBQSxjQUFBLFFBQUEsb0JBQUE7SUFDQSxJQUFBLE9BQUE7O0lBRUEsU0FBQSxXQUFBLE1BQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxvQkFBQSxLQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxlQUFBLFNBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7SUFHQSxTQUFBLFdBQUE7O0lBRUEsS0FBQSxPQUFBLFNBQUEsYUFBQSxNQUFBO0lBQ0EsS0FBQSxPQUFBLGFBQUE7SUFDQSxLQUFBLGNBQUEsQ0FBQSxXQUFBLFFBQUE7SUFDQTtJQUNBOzs7SUFHQSxLQUFBLFdBQUEsV0FBQTtRQUNBLEtBQUE7UUFDQSxXQUFBLEtBQUE7UUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7SUFFQSxLQUFBLFdBQUEsV0FBQTtRQUNBLElBQUEsS0FBQSxPQUFBLEdBQUE7WUFDQSxLQUFBO1lBQ0EsV0FBQSxLQUFBO1lBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEs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QTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsVUFBQSxTQUFBO2dCQUNBLFdBQUEsZUFBQTs7O0lBR0EsU0FBQSxXQUFBOztJQUVBLEtBQUEsT0FBQSxTQUFBLGFBQUEsTUFBQTtJQUNBLEtBQUEsT0FBQSxhQUFBO0lBQ0EsS0FBQSxjQUFBLENBQUEsV0FBQSxRQUFBO0lBQ0E7SUFDQTs7Q0FFQSxXQUFBLHFHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxVQUFBLGdCQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsTUFBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLGVBQUEsS0FBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxVQUFBLFNBQUE7Z0JBQ0EsS0FBQSxPQUFBLEtBQUEsTUFBQSxhQUFBLFFBQUE7Z0JBQ0EsV0FBQSxlQUFBOzthQUVBLE1BQUEsVUFBQTtnQkFDQSxXQUFBLGVBQUE7Z0JBQ0EsT0FBQSxHQUFBLFdBQUEsSUFBQSxDQUFBLFNBQUE7Ozs7SUFJQSxLQUFBLGVBQUEsU0FBQSxPQUFBO1FBQ0EsS0FBQSxRQUFBO1FBQ0EsZUFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBO2dCQUNBLFNBQUEsUUFBQSxpQ0FBQSxTQUFBLFNBQUEsUUFBQTtnQkFDQSxTQUFBLFFBQUEsbUJBQUEsU0FBQSxTQUFBLFFBQUE7Z0JBQ0EsS0FBQSxRQUFBLFVBQUEsU0FBQTtnQkFDQSxLQUFBLFFBQUE7Z0JBQ0EsT0FBQSxHQUFBLFdBQUEsQ0FBQSxJQUFBLE9BQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Ozs7SUFJQSxLQUFBLGVBQUEsU0FBQSxPQUFBO1FBQ0EsZUFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsT0FBQSxHQUFBOzs7Ozs7SUFNQTs7Q0FFQSxXQUFBLHlHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxVQUFBLGdCQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsaUJBQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxlQUFBLGdCQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGNBQUEsU0FBQTtnQkFDQSxLQUFBLE9BQUEsU0FBQTtnQkFDQSxXQUFBLGVBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7OztJQUtBLEtBQUEsZUFBQSxTQUFBLFNBQUEsaUJBQUE7UUFDQSxJQUFBLFNBQUE7WUFDQSxtQkFBQSxhQUFBO1lBQ0Esb0JBQUE7WUFDQSxZQUFBOztRQUVBLGVBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLFNBQUEsbUJBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsWUFBQSxRQUFBLEtBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBOzs7O0lBSUEsS0FBQSxlQUFBLFNBQUEsT0FBQTtRQUNBLGVBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBOzs7Z0JBR0EsUUFBQSxRQUFBLEtBQUEsWUFBQSxTQUFBLFNBQUEsU0FBQSxNQUFBO29CQUNBLEdBQUEsUUFBQSxNQUFBLE9BQUE7b0JBQ0E7d0JBQ0EsS0FBQSxZQUFBLFFBQUEsT0FBQSxPQUFBOzs7Ozs7OztJQVFBOztDQUVBLFFBQUEsOENBQUEsU0FBQSxPQUFBLGdCQUFBOztRQUVBLE9BQUE7WUFDQSxNQUFBLFVBQUEsTUFBQSxJQUFBO2dCQUNBLElBQUEsTUFBQSxlQUFBOztnQkFFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtnQkFDQSxJQUFBLE1BQUEsT0FBQSxXQUFBOztnQkFFQSxPQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxLQUFBO29CQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztZQUlBLE1BQUEsU0FBQSxJQUFBO2dCQUNBLE9BQUEsTUFBQTtvQkFDQSxRQUFBO29CQUNBLEtBQUEsZUFBQSxV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QUFBLE9BQUEsUUFBQTs7WUFFQSxJQUFBLFdBQUE7WUFDQSxJQUFBLElBQUEsT0FBQSxPQUFBO2NBQ0EsR0FBQSxRQUFBLGNBQUEsUUFBQSxTQUFBO2lCQUNBLFNBQUEsT0FBQSxPQUFBOzs7WUFHQSxJQUFBLElBQUEsS0FBQSxFQUFBLEtBQUEsT0FBQSxPQUFBLE9BQUEsS0FBQTtjQUNBLFFBQUEsT0FBQSxPQUFBLE9BQUEsSUFBQTs7WUFFQSxhQUFBLEtBQUEsT0FBQTs7OztRQUlBLE9BQUEsTUFBQSxVQUFBLE9BQUEsTUFBQSxJQUFBOzs7Ozs7O01BT0EsS0FBQSxnQkFBQSxTQUFBLGFBQUEsU0FBQTtRQUNBLElBQUE7UUFDQSxJQUFBLFlBQUEsV0FBQTtVQUNBLElBQUEsUUFBQSxRQUFBLFdBQUEsZUFBQSxnQkFBQTtVQUNBLElBQUEsU0FBQSxJQUFBLE9BQUE7VUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsTUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO1lBQ0EsS0FBQSxNQUFBO1lBQ0EsUUFBQSxRQUFBO1lBQ0EsSUFBQSxTQUFBO1lBQ0EsT0FBQSxLQUFBOztVQUVBLE9BQUE7Ozs7UUFJQSxJQUFBLGlCQUFBLFNBQUEsR0FBQSxHQUFBO1VBQ0EsSUFBQSxTQUFBLElBQUEsTUFBQSxJQUFBLEdBQUE7VUFDQSxLQUFBLElBQUEsR0FBQSxJQUFBLEVBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtZQUNBLElBQUEsRUFBQSxNQUFBOztVQUVBLEtBQUEsSUFBQSxHQUFBLElBQUEsRUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO1lBQ0EsSUFBQSxDQUFBLElBQUEsRUFBQSxLQUFBO2NBQ0EsT0FBQSxLQUFBLEVBQUE7OztVQUdBLE9BQUE7Ozs7UUFJQSxJQUFBLE1BQUE7O1FBRUEsSUFBQSxlQUFBLFNBQUEsV0FBQSxXQUFBO1VBQ0EsSUFBQSxHQUFBLEdBQUEsSUFBQTtVQUNBLElBQUEsaUJBQUE7VUFDQSxJQUFBLGdCQUFBLGVBQUEsV0FBQTtVQUNBLEtBQUEsSUFBQSxHQUFBLElBQUEsY0FBQSxR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LE9BQUEsU0FBQTtNQUNBLElBQUEsY0FBQSxLQUFBLElBQUEsS0FBQSxjQUFBLEtBQUEsY0FBQSxLQUFBLGVBQUEsS0FBQSxjQUFBLEtBQUE7TUFDQSxpQkFBQSxlQUFBLE9BQUE7O01BRUEsSUFBQSxnQkFBQSxXQUFBOztPQUVBLE1BQUEsU0FBQSxNQUFBLFNBQUEsTUFBQTtVQUNBLE1BQUE7Ozs7O0FDWEEsSUFBQSxVQUFBLGtCQUFBLFdBQUE7RUFDQSxPQUFBO0lBQ0EsU0FBQTtJQUNBLE1BQUEsU0FBQSxPQUFBLFNBQUEsT0FBQSxTQUFBO01BQ0EsUUFBQSxTQUFBLEtBQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxLQUFBOztNQUVBLFFBQUEsWUFBQSxLQUFBLFNBQUEsT0FBQTtRQUNBLE9BQUEsV0FBQSxPQUFBOzs7OztBQ1JBLElBQUEsT0FBQSxhQUFBLFlBQUE7SUFDQSxPQUFBLFVBQUEsT0FBQSxVQUFBLEtBQUEsTUFBQTtRQUNBLElBQUEsQ0FBQSxPQUFBLE9BQUE7O1FBRUEsTUFBQSxTQUFBLEtBQUE7UUFDQSxJQUFBLENBQUEsS0FBQSxPQUFBO1FBQ0EsSUFBQSxNQUFBLFVBQUEsS0FBQSxPQUFBOztRQUVBLFFBQUEsTUFBQSxPQUFBLEdBQUE7UUFDQSxJQUFBLFVBQUE7WUFDQSxJQUFBLFlBQUEsTUFBQSxZQUFBO1lBQ0EsSUFBQSxhQUFBLENBQUEsR0FBQTtnQkFDQSxRQUFBLE1BQUEsT0FBQSxHQUFBOzs7O1FBSUEsT0FBQSxTQUFBLFFBQUE7Ozs7QUNoQkEsSUFBQSxPQUFBLGFBQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsR0FBQSxVQUFBLFVBQUE7WUFDQSxJQUFBLElBQUEsTUFBQSxNQUFBO1lBQ0EsSUFBQSxFQUFBLElBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQTtZQUNBLE9BQUEsSUFBQSxLQUFBLEdBQUE7Ozs7QUNMQSxJQUFBLE9BQUEsV0FBQSxDQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsUUFBQTtRQUNBLE9BQUEsUUFBQSxPQUFBLElBQUE7OztBQ0ZBLElBQUEsT0FBQSxPQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQTtRQUNBLE9BQUEsU0FBQSxPQUFBOzs7QUNGQSxJQUFBLE9BQUEsU0FBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUEsT0FBQSxLQUFBO1FBQ0EsUUFBQSxTQUFBO1FBQ0EsTUFBQSxTQUFBO1FBQ0EsSUFBQTtRQUNBLEdBQUEsUUFBQSxJQUFBO1lBQ0EsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBO2dCQUNBLE1BQUEsS0FBQTthQUNBO1lBQ0EsS0FBQSxFQUFBLE9BQUEsRUFBQSxLQUFBO2dCQUNBLE1BQUEsS0FBQTs7UUFFQSxPQUFBOzs7QUNaQSxJQUFBLE9BQUEsZ0NBQUEsU0FBQTtBQUNBO0lBQ0EsT0FBQSxTQUFBO0lBQ0E7UUFDQSxPQUFBLEtBQUEsWUFBQTs7OztBQ0pBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7SUFFQSxlQUFBLE1BQUEsU0FBQTtRQUNBLEtBQUE7UUFDQSxRQUFBO1FBQ0EsVUFBQTtRQUNBLFlBQUE7OztJQUdBLGVBQUEsTUFBQSxtQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxlQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7O0lBS0EsZUFBQSxNQUFBLGVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxvQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDBCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDJCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDBCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7OztBQzFFQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7Ozs7Q0FJQSxlQUFBLE1BQUEsUUFBQTtFQUNBLEtBQUE7RUFDQSxRQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxZQUFBO0lBQ0EsYUFBQTtJQUNBLFlBQUE7Ozs7Q0FJQSxtQkFBQSxLQUFBLFNBQUE7Q0FDQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsZUFBQTtFQUNBLEtBQUE7RUFDQSxhQUFBO0VBQ0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTtFQUNBLFlBQUE7O0NBRUEsZUFBQSxNQUFBLGNBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsY0FBQTtFQUNBLEtBQUE7RUFDQSxhQUFBO0VBQ0Esb0VBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxZQUFBO0dBQ0EsT0FBQSxRQUFBLENBQUEsT0FBQSxJQUFBLE9BQUEsYUFBQTs7R0FFQSxPQUFBLGdCQUFBO0dBQ0E7O0lBRUE7TUFDQSxjQUFBLE9BQUE7TUFDQSxRQUFBLFNBQUEsU0FBQTtNQUNBLE9BQUEsb0JBQUE7TUFDQSxPQUFBLFFBQUEsQ0FBQSxPQUFBLElBQUEsT0FBQSxhQUFBOztNQUVBLE1BQUEsU0FBQSxTQUFBO01BQ0EsV0FBQSxxQkFBQSxVQUFBO01BQ0EsT0FBQSxvQkFBQTs7TUFFQSxLQUFBLFNBQUEsU0FBQTtNQUNBLEdBQUEsU0FBQSxLQUFBLFdBQUE7TUFDQTtPQUNBLE9BQUEsb0JBQUE7Ozs7OztDQU1BLGVBQUEsTUFBQSxlQUFBO0VBQ0EsS0FBQTtFQUNBLDRCQUFBLFNBQUEsWUFBQTtHQUNBLFlBQUE7O0VBRUEsWUFBQTs7OztBQzNFQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7OztDQUdBLGVBQUEsTUFBQSxpQkFBQTtFQUNBLEtBQUE7RUFDQSxRQUFBO0VBQ0EsTUFBQTtHQUNBLFlBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7OztFQUdBLFlBQUE7O0NBRUEsZUFBQSxNQUFBLGdCQUFBO0VBQ0EsS0FBQTtFQUNBLFFBQUE7RUFDQSxPQUFBO0dBQ0EsWUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBO0lBQ0EsY0FBQTs7O0VBR0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEscUJBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7SUFDQSxhQUFBLFNBQUEsYUFBQTtLQUNBLE9BQUEsc0NBQUEsYUFBQTs7SUFFQSwyQ0FBQSxTQUFBLFlBQUEsYUFBQTtLQUNBLFdBQUEsY0FBQSxhQUFBOzs7O0VBSUEsWUFBQTs7O0FDdkNBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7SUFFQSxlQUFBLE1BQUEsUUFBQTtRQUNBLEtBQUE7UUFDQSxRQUFBO1FBQ0EsVUFBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7O0lBS0EsZUFBQSxNQUFBLGdCQUFBO1FBQ0EsS0FBQTtRQUNBLFFBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxjQUFBO2dCQUNBLFlBQUE7Ozs7O0lBS0EsZUFBQSxNQUFBLG9CQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7O1FBR0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLGFBQUE7UUFDQSxLQUFBO1FBQ0EsT0FBQTtZQUNBLE9BQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7UUFHQSxZQUFBOzs7SUFHQSxlQUFBLE1BQUEsZUFBQTtRQUNBLEtBQUE7UUFDQSxPQUFBO1lBQ0EsT0FBQTtnQkFDQSxhQUFBOzs7UUFHQSxZQUFBOzs7SUFHQSxlQUFBLE1BQUEsZ0JBQUE7UUFDQSxLQUFBO1FBQ0EsT0FBQTtZQUNBLFFBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxjQUFBO1FBQ0EsVUFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBOztJQUVBLGVBQUEsTUFBQSxvQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGFBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxxQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGFBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxtQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGFBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxpQkFBQTtRQUNBLFVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTs7SUFFQSxlQUFBLE1BQUEsdUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxhQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7OztBQ3JIQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7OztDQUdBLGVBQUEsTUFBQSxnQkFBQTtFQUNBLEtBQUE7RUFDQSxRQUFBO0VBQ0EsTUFBQTtHQUNBLFlBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7OztFQUdBLFFBQUE7R0FDQSxNQUFBO0lBQ0EsT0FBQTtJQUNBLFFBQUE7O0dBRUEsTUFBQTtJQUNBLE9BQUE7SUFDQSxRQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxlQUFBO0VBQ0EsS0FBQTtFQUNBLFFBQUE7RUFDQSxPQUFBO0dBQ0EsWUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBO0lBQ0EsY0FBQTs7O0VBR0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsMkJBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTs7O0VBR0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsMkJBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTs7O0VBR0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsa0NBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLElBQUE7SUFDQSxhQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxnQ0FBQTtFQUNBLEtBQUE7RUFDQSxPQUFBO0dBQ0EsSUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxzQkFBQTtFQUNBLEtBQUE7RUFDQSxZQUFBO0VBQ0EsTUFBQTtHQUNBLE9BQUE7SUFDQSxZQUFBO0lBQ0EsWUFBQTs7OztDQUlBLGVBQUEsTUFBQSx1QkFBQTtFQUNBLEtBQUE7RUFDQSxZQUFBO0VBQ0EsTUFBQTtHQUNBLE9BQUE7SUFDQSxZQUFBO0lBQ0EsWUFBQTs7Ozs7O0NBTUEsZUFBQSxNQUFBLG9CQUFBO0VBQ0EsS0FBQTtFQUNBLE9BQUE7R0FDQSxRQUFBO0lBQ0EsYUFBQSxTQUFBLGFBQUE7S0FDQSxPQUFBLHFDQUFBLGFBQUE7OztJQUdBLDJDQUFBLFNBQUEsWUFBQSxhQUFBO0tBQ0EsV0FBQSxjQUFBLGFBQUE7Ozs7RUFJQSxZQUFBOzs7QUMvR0EsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOztJQUVBLGVBQUEsTUFBQSxXQUFBO1FBQ0EsS0FBQTtRQUNBLFFBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztBQ1RBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7SUFFQSxrQkFBQSxVQUFBOztJQUVBLG1CQUFBLFVBQUE7O0lBRUEsR0FBQSxhQUFBLFFBQUE7SUFDQTtRQUNBLG1CQUFBLFVBQUE7OztJQUdBO1FBQ0EsbUJBQUEsVUFBQTs7O0lBR0EsZUFBQSxNQUFBLFFBQUE7UUFDQSxVQUFBO1FBQ0EsTUFBQTtZQUNBLGVBQUE7Z0JBQ0EsYUFBQTs7Ozs7SUFLQSxlQUFBLE1BQUEsVUFBQTtRQUNBLFVBQUE7UUFDQSxNQUFBO1lBQ0EsZUFBQTtnQkFDQSxhQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxhQUFBO1FBQ0EsS0FBQTtRQUNBLFFBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7OztRQUdBLFlBQUE7Ozs7QUMxQ0EsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOztJQUVBLGVBQUEsTUFBQSxZQUFBO1FBQ0EsS0FBQTtRQUNBLFFBQUE7UUFDQSxVQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTtnQkFDQSxjQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxrQkFBQTtRQUNBLElBQUE7UUFDQSxPQUFBO1lBQ0EsV0FBQTtnQkFDQSx1QkFBQSxTQUFBLE9BQUE7b0JBQ0EsT0FBQSxHQUFBOzs7O1FBSUEsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLGlCQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxVQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7O1FBR0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLHdCQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxXQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7O1FBR0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLDBCQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxXQUFBO2dCQUNBLGFBQUE7OztRQUdBLFlBQUE7Ozs7SUFJQSxlQUFBLE1BQUEscUJBQUE7UUFDQSxLQUFBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7UUFHQSxZQUFBOzs7SUFHQSxlQUFBLE1BQUEsbUJBQUE7UUFDQSxLQUFBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7UUFHQSxZQUFBOzs7O0FDaEZBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7O0NBR0EsZUFBQSxNQUFBLFdBQUE7RUFDQSxLQUFBO0VBQ0EsUUFBQTtFQUNBLE1BQUE7R0FDQSxZQUFBO0lBQ0EsYUFBQTtJQUNBLFlBQUE7SUFDQSxjQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxVQUFBO0VBQ0EsS0FBQTtFQUNBLFFBQUE7RUFDQSxPQUFBO0dBQ0EsWUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBO0lBQ0EsY0FBQTs7O0VBR0EsWUFBQTs7O0NBR0EsZUFBQSxNQUFBLGVBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLFlBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7OztFQUdBLFlBQUE7OztJQUdBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJyxcblx0W1xuXHRcdCdhbmd1bGFyLWp3dCcsXG5cdFx0J3VpLnJvdXRlcicsXG5cdFx0J3VpLmNhbGVuZGFyJyxcblx0XHQndWkuYm9vdHN0cmFwJyxcblx0XHQndWkuYm9vdHN0cmFwLmRhdGV0aW1lcGlja2VyJyxcblx0XHQndWkuc29ydGFibGUnLFxuXHRcdCdhcHAuYXV0aCcsXG5cdFx0J2FwcC5hZG1pbicsXG5cdFx0J2FwcC5hZG1pbi5jbHVicycsXG5cdFx0J2FwcC5hZG1pbi51c2VycycsXG5cdFx0J2FwcC5jYWxlbmRhcicsXG5cdFx0J2FwcC5jaGFtcGlvbnNoaXBzJyxcblx0XHQnYXBwLmNsdWJzJyxcblx0XHQnYXBwLmNvbXBldGl0aW9ucycsXG5cdFx0J2FwcC5kYXNoYm9hcmQnLFxuXHRcdCdhcHAuZXJyb3JoYW5kbGVyJyxcblx0XHQnYXBwLnBheW1lbnRzJyxcblx0XHQnYXBwLnByZW1pdW0nLFxuXHRcdCdhcHAuc2V0dGluZ3MnLFxuXHRcdCdhcHAuc2lnbnVwcycsXG5cdFx0J2FwcC50ZWFtcycsXG5cdFx0J2FwcC51c2Vycydcblx0XSwgZnVuY3Rpb24oJGludGVycG9sYXRlUHJvdmlkZXIpe1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCc8JScpO1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnJT4nKTtcbn0pO1xuXG5hcHAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIEVycm9ySGFuZGxlckZhY3RvcnksIGp3dEhlbHBlciwgQXV0aEZhY3RvcnksICR3aW5kb3csICRsb2NhdGlvbikge1xuXG5cdCR3aW5kb3cuZ2EoJ2NyZWF0ZScsICdVQS03NjIyMTYxOC0xJywgJ2F1dG8nKTtcblx0XG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvKSB7XG5cdFx0dmFyIHRva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJyk7XG5cblx0XHQkcm9vdFNjb3BlLmN1cnJlbnRSb3V0ZSA9IHRvLm5hbWU7XG5cblx0XHRpZih0b2tlbiAhPT0gbnVsbCl7XG5cdFx0XHQkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuXHRcdFx0dmFyIHVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuXHRcdFx0JHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHVzZXI7XG5cdFx0fVxuXG5cdFx0aWYoKHRvLm5hbWUuc3BsaXQoXCIuXCIsIDEpWzBdID09ICdhdXRoJykgJiYgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkKXtcblx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHR9XG5cblx0XHRpZiAodG8ucmVzdHJpY3RlZCkge1xuXG5cdFx0XHQvLyBSZXN0cmljdCBndWFyZGVkIHJvdXRlcy5cblx0XHRcdGlmICh0b2tlbiA9PT0gbnVsbCkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYXV0aC5sb2dpbicsIHt9LCB7bG9jYXRpb246ICdyZXBsYWNlJ30pO1xuXHRcdFx0fVxuXG5cdFx0XHQvKlxuXHRcdFx0aWYgKHRva2VuICE9PSBudWxsICYmIGp3dEhlbHBlci5pc1Rva2VuRXhwaXJlZCh0b2tlbikpIHtcblx0XHRcdFx0QXV0aEZhY3RvcnkuYXR0ZW1wdFJlZnJlc2hUb2tlbigpO1xuXHRcdFx0fVxuXHRcdFx0Ki9cblxuXHRcdFx0JHJvb3RTY29wZS5kYXRlcGlja2VyT3B0aW9ucyA9IHtcblx0XHRcdFx0c2hvd1dlZWtzOiB0cnVlLFxuXHRcdFx0XHRzdGFydGluZ0RheTogMVxuXHRcdFx0fTtcblx0XHRcdCRyb290U2NvcGUudGltZXBpY2tlck9wdGlvbnMgPSB7XG5cdFx0XHRcdHNob3dNZXJpZGlhbjogZmFsc2UsXG5cdFx0XHRcdG1pbnV0ZVN0ZXA6IDE1XG5cdFx0XHR9O1xuXG5cdFx0fVxuXHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gJyc7XG5cblx0fSk7XG5cblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQkd2luZG93LmdhKCdzZW5kJywgJ3BhZ2V2aWV3JywgJGxvY2F0aW9uLnBhdGgoKSk7XG5cdH0pO1xuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgZmxhc2ggbWVzc2FnZXMgYmFzZWQgb24gZ2l2ZW4gYXJyYXkgb3Igc3RyaW5nIG9mIG1lc3NhZ2VzLlxuXHQgKiBIaWRlcyBldmVyeSBtZXNzYWdlIGFmdGVyIDUgc2Vjb25kcy5cblx0ICpcblx0ICogQHBhcmFtICBtaXhlZCAgbWVzc2FnZXNcblx0ICogQHBhcmFtICBzdHJpbmcgdHlwZVxuXHQgKiBAcmV0dXJuIHZvaWRcblx0ICovXG5cdCRyb290U2NvcGUuY2F0Y2hFcnJvciA9IGZ1bmN0aW9uKHJlc3BvbnNlKVxuXHR7XG5cdFx0Ly8gUmVzZXQgYWxsIGVycm9yLSBhbmQgc3VjY2VzcyBtZXNzYWdlcy5cblx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMgPSBbXTtcblx0XHQkcm9vdFNjb3BlLnN1Y2Nlc3NNZXNzYWdlcyA9IFtdO1xuXG5cdFx0aWYodHlwZW9mIHJlc3BvbnNlID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaChyZXNwb25zZSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0XHRpZihyZXNwb25zZSlcblx0XHRcdHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLCBmdW5jdGlvbihlcnJvck1lc3NhZ2Upe1xuXHRcdFx0XHRcdHZhciBtZXNzYWdlID0gKHR5cGVvZiBlcnJvck1lc3NhZ2UgPT09ICdzdHJpbmcnKSA/IGVycm9yTWVzc2FnZSA6IGVycm9yTWVzc2FnZVswXTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaChtZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coJHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzKTtcblxuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdFx0XHR9LCA1MDAwKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblxuXHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzID0gZnVuY3Rpb24obWVzc2FnZXMsIHR5cGUpXG5cdHtcblx0XHQkdGltZW91dC5jYW5jZWwoJHJvb3RTY29wZS5lcnJvck1lc3NhZ2VUaW1lcik7XG5cdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzID0gW107XG5cdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblxuXHRcdGlmKGFuZ3VsYXIuaXNTdHJpbmcobWVzc2FnZXMpKSBtZXNzYWdlcyA9IFttZXNzYWdlc107XG5cblx0XHR2YXIgdW53YW50ZWRNZXNzYWdlcyA9IFsndG9rZW5fbm90X3Byb3ZpZGVkJ107XG5cdFx0dmFyIGljb24gPSAodHlwZSA9PSAnc3VjY2VzcycpID8gJ2NoZWNrLWNpcmNsZScgOiAnaW5mby1jaXJjbGUnO1xuXG5cdFx0YW5ndWxhci5mb3JFYWNoKG1lc3NhZ2VzLCBmdW5jdGlvbihtZXNzYWdlKXtcblxuXHRcdFx0aWYodW53YW50ZWRNZXNzYWdlcy5pbmRleE9mKG1lc3NhZ2UpIDwgMClcblx0XHRcdHtcblx0XHRcdFx0dmFyIHRleHQgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnKSA/IG1lc3NhZ2UgOiBtZXNzYWdlWzBdO1xuXHRcdFx0XHRpZih0eXBlID09ICdlcnJvcicpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaCh0ZXh0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnN1Y2Nlc3NNZXNzYWdlcy5wdXNoKHRleHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZVRpbWVyID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblx0XHR9LCA1MDAwKTtcblx0fTtcblxuXHQvKipcblx0ICogR2xvYmFsIGZ1bmN0aW9uIGZvciByZXBvcnRpbmcgdG9wIGxldmVsIGVycm9ycy4gTWFrZXMgYW4gYWpheCBjYWxsIGZvciBzZW5kaW5nIGEgYnVnIHJlcG9ydC5cblx0ICogQHBhcmFtIHtvYmplY3R9IGVycm9yXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjYXVzZVxuXHQgKi9cblx0JHJvb3RTY29wZS5yZXBvcnRFcnJvciA9IGZ1bmN0aW9uKGVycm9yLCBjYXVzZSlcblx0e1xuXHRcdGlmKCFjYXVzZSkgY2F1c2UgPSAnRnJvbnRlbmQnO1xuXHRcdGlmKGVycm9yKXtcblx0XHRcdEVycm9ySGFuZGxlckZhY3Rvcnlcblx0XHRcdFx0LnJlcG9ydEVycm9yKGVycm9yLCBjYXVzZSlcblxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0aWYocmVzcG9uc2UubWVzc2FnZSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5tZXNzYWdlKSAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKFtyZXNwb25zZS5tZXNzYWdlXSwgJ3dhcm5pbmcnKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYocmVzcG9uc2UuZGF0YSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5kYXRhLm1lc3NhZ2UpICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMoW3Jlc3BvbnNlLmRhdGEubWVzc2FnZV0sICd3YXJuaW5nJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmFkbWluLmNsdWJzJywgW10pXG5cbiAgICAuY29udHJvbGxlcihcIkFkbWluQ2x1YnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBBZG1pbkNsdWJzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi5maWx0ZXIgPSB7XG4gICAgICAgIHNlYXJjaDogJycsXG4gICAgICAgIGhpZGVfd2l0aG91dF91c2VyczogMSxcbiAgICAgICAgaGlkZV93aXRob3V0X2FkbWluczogbnVsbFxuICAgIH07XG5cbiAgICBzZWxmLmhpZGVDbHVic1dpdGhvdXRVc2VycyA9IGZ1bmN0aW9uKGNsdWIpe1xuICAgICAgICBpZihzZWxmLmZpbHRlci5oaWRlX3dpdGhvdXRfdXNlcnMgJiYgY2x1Yi51c2Vyc19jb3VudCl7XG4gICAgICAgICAgICByZXR1cm4gY2x1YjtcbiAgICAgICAgfWVsc2UgaWYoIXNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF91c2Vycyl7XG4gICAgICAgICAgICByZXR1cm4gY2x1YjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2VsZi5oaWRlQ2x1YnNXaXRob3V0QWRtaW5zID0gZnVuY3Rpb24oY2x1Yil7XG4gICAgICAgIGlmKHNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF9hZG1pbnMgJiYgY2x1Yi5hZG1pbnNfY291bnQpe1xuICAgICAgICAgICAgcmV0dXJuIGNsdWI7XG4gICAgICAgIH1lbHNlIGlmKCFzZWxmLmZpbHRlci5oaWRlX3dpdGhvdXRfYWRtaW5zKXtcbiAgICAgICAgICAgIHJldHVybiBjbHViO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzb3J0TGlzdCgpIHt9XG5cbiAgICB0aGlzLnBhZ2UgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMucGFnZSwgMTApO1xuICAgIHRoaXMuc29ydCA9ICRzdGF0ZVBhcmFtcy5zb3J0O1xuICAgIHRoaXMuc29ydE9wdGlvbnMgPSBbJ3Vwdm90ZXMnLCAnZGF0ZScsICdhdXRob3InXTtcbiAgICBzb3J0TGlzdCgpO1xuICAgIHVwZGF0ZVBhZ2UoKTtcblxuXG4gICAgdGhpcy5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLnBhZ2UrKztcbiAgICAgICAgdXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuICAgICAgICAkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcbiAgICB9O1xuICAgIHRoaXMucHJldlBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHNlbGYucGFnZSA+IDApIHtcbiAgICAgICAgICAgIHNlbGYucGFnZS0tO1xuICAgICAgICAgICAgdXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuICAgICAgICAgICAgJHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc29ydENoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ydExpc3QoKTtcbiAgICAgICAgJHN0YXRlLmdvKCcuJywge3NvcnQ6IHNlbGYuc29ydH0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgfTtcblxufSlcbi5jb250cm9sbGVyKFwiQWRtaW5DbHViQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdGltZW91dCwgQWRtaW5DbHVic0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuICAgIHNlbGYuc2VsZWN0ZWRjbHViID0ge307XG5cbiAgICBpZighJHN0YXRlUGFyYW1zLmlkKSAkc3RhdGUuZ28oJ2FkbWluLmNsdWJzJyk7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YiA9IHJlc3BvbnNlLmNsdWI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbi5jbHVicycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLnVwZGF0ZUNsdWIgPSBmdW5jdGlvbihjbHViKXtcbiAgICAgICAgc2VsZi5zdGF0ZSA9ICd1cGRhdGluZyc7XG4gICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5LnVwZGF0ZUNsdWIoY2x1YilcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YnMuY2x1YnMgPSByZXNwb25zZS5jbHVicztcbiAgICAgICAgICAgICAgICBzZWxmLnN0YXRlID0gJ3VwZGF0ZWQnO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2x1YicsICh7aWQ6IGNsdWIuaWR9KSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuZGVsZXRlQ2x1YiA9IGZ1bmN0aW9uKGNsdWIpe1xuICAgICAgICBBZG1pbkNsdWJzRmFjdG9yeS5kZWxldGVDbHViKGNsdWIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjbHVicycpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuc2VhcmNoRm9yQ2x1YnMgPSBmdW5jdGlvbihzZWFyY2hRdWVyeSwgY2x1YilcbiAgICB7XG4gICAgICAgIHJldHVybiBBZG1pbkNsdWJzRmFjdG9yeVxuICAgICAgICAgICAgLnNlYXJjaEZvckNsdWJzKHNlYXJjaFF1ZXJ5KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnd2FybmluZycpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmZvdW5kTWF0Y2ggPSAocmVzcG9uc2UuZGF0YS5jbHVicy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5jbHVicy5tYXAoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNsdWIuaWQgPT0gaXRlbS5pZCkgaXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLnNlbGVjdENsdWIgPSBmdW5jdGlvbigkaXRlbSlcbiAgICB7XG4gICAgICAgIHNlbGYuc2VsZWN0ZWRjbHViID0gJGl0ZW07XG4gICAgfTtcblxuICAgIHNlbGYubWVyZ2VDbHVicyA9IGZ1bmN0aW9uKGNsdWJzSWRGcm9tLCBjbHVic0lkVG8pe1xuICAgICAgICBpZihjbHVic0lkRnJvbSAmJiBjbHVic0lkVG8pe1xuICAgICAgICAgICAgQWRtaW5DbHVic0ZhY3RvcnkubWVyZ2VDbHVicyhjbHVic0lkRnJvbSwgY2x1YnNJZFRvKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbi5jbHVicy5zaG93Jywge2lkOmNsdWJzSWRUb30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmaW5kKCk7XG59KVxuLmZhY3RvcnkoJ0FkbWluQ2x1YnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuICAgICAgICAgICAgdmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicyc7XG5cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG4gICAgICAgICAgICBpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUNsdWI6IGZ1bmN0aW9uKGNsdWIpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oY2x1YilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUNsdWI6IGZ1bmN0aW9uKGNsdWIpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy8nK2NsdWIuaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjbHViKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVsZXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzLycrY2x1Yi5pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9hZFVzZXJDbHViOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzL2dldFVzZXJDbHViJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkVXNlclRvQ2x1YnM6IGZ1bmN0aW9uKGNsdWJzX2lkKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvYWRkVXNlclRvQ2x1YnMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oeydjbHVic19pZCc6IGNsdWJzX2lkfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZE5ld0NsdWI6IGZ1bmN0aW9uKGNsdWIpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy9hZGROZXdDbHViJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHsnY2x1YnNfbnInOiBjbHViLmNsdWJzX25yLCAnbmFtZSc6IGNsdWIubmFtZX0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzZWFyY2hGb3JDbHViczogZnVuY3Rpb24oZmlsdGVyKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL3NlYXJjaCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh7J3NlYXJjaFF1ZXJ5JzogZmlsdGVyfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZFVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy9hZGRVc2VyQXNBZG1pbicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVsZXRlVXNlckFzQWRtaW46IGZ1bmN0aW9uKGFkbWluKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvZGVsZXRlVXNlckFzQWRtaW4nLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oeydhZG1pbic6IGFkbWlufSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIG1lcmdlQ2x1YnM6IGZ1bmN0aW9uKGNsdWJzSWRGcm9tLCBjbHVic0lkVG8pIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvbWVyZ2UnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oeydjbHVic0lkRnJvbSc6IGNsdWJzSWRGcm9tLCAnY2x1YnNJZFRvJzogY2x1YnNJZFRvfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuYWRtaW4nLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJBZG1pbkRhc2hib2FyZENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgQWRtaW5GYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gbG9hZERhc2hib2FyZCgpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEFkbWluRmFjdG9yeS5sb2FkRGFzaGJvYXJkKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmRhdGEgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbG9hZERhc2hib2FyZCgpO1xufSlcbi5mYWN0b3J5KFwiQWRtaW5GYWN0b3J5XCIsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZERhc2hib2FyZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwgKyAnYWRtaW4vZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5hZG1pbi51c2VycycsIFtdKVxuXG4uY29udHJvbGxlcihcIkFkbWluVXNlcnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBBZG1pblVzZXJzRmFjdG9yeSl7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmZpbHRlciA9IHtcblx0XHRzZWFyY2g6ICcnLFxuXHRcdGFjdGl2ZTogMVxuXHR9O1xuXG5cdGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuXHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcblx0XHRBZG1pblVzZXJzRmFjdG9yeS5sb2FkKHBhZ2UpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYudXNlcnMgPSByZXNwb25zZS51c2Vycztcblx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9XG5cdGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuXHR0aGlzLnBhZ2UgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMucGFnZSwgMTApO1xuXHR0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcblx0dGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuXHRzb3J0TGlzdCgpO1xuXHR1cGRhdGVQYWdlKCk7XG5cblxuXHR0aGlzLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VsZi5wYWdlKys7XG5cdFx0dXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuXHRcdCRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuXHR9O1xuXHR0aGlzLnByZXZQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHNlbGYucGFnZSA+IDApIHtcblx0XHRcdHNlbGYucGFnZS0tO1xuXHRcdFx0dXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuXHRcdFx0JHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLnNvcnRDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG5cdFx0c29ydExpc3QoKTtcblx0XHQkc3RhdGUuZ28oJy4nLCB7c29ydDogc2VsZi5zb3J0fSwge25vdGlmeTogZmFsc2V9KTtcblx0fTtcblxufSlcblxuLmZhY3RvcnkoJ0FkbWluVXNlcnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuXHRyZXR1cm4ge1xuXHRcdGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuXHRcdFx0dmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydhZG1pbi91c2Vycyc7XG5cblx0XHRcdGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG5cdFx0XHRpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL3VzZXJzLycraWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0fTtcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5hdXRoJywgWyd2Y1JlY2FwdGNoYSddKVxuICAgIC5jb250cm9sbGVyKCdBdXRoQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsIEF1dGhGYWN0b3J5LCAkdWliTW9kYWwsICR0aW1lb3V0KXtcblxuICAgICAgICAkc2NvcGUuYXV0aCA9XG4gICAgICAgIHtcbiAgICAgICAgICAgIGVtYWlsXHQ6ICcnLFxuICAgICAgICAgICAgbmFtZSAgICA6ICcnLFxuICAgICAgICAgICAgbGFzdG5hbWU6ICcnLFxuICAgICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgICAgaW52aXRlX3Rva2VuOiAkc3RhdGVQYXJhbXMuaW52aXRlX3Rva2VuXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgICAkc2NvcGUubG9nZ2luZ0luID0gdHJ1ZTtcblxuICAgICAgICAgICAgdmFyIGNyZWRlbnRpYWxzID0ge1xuICAgICAgICAgICAgICAgIGVtYWlsOiAkc2NvcGUuYXV0aC5lbWFpbCxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogJHNjb3BlLmF1dGgucGFzc3dvcmRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIEF1dGhGYWN0b3J5LmF1dGhlbnRpY2F0ZShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCByZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIEF1dGhGYWN0b3J5LmdldFVzZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHJlc3BvbnNlLnVzZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnZGFzaGJvYXJkJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvZ2dpbmdJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlID09ICd1c2VyX25vdF9hY3RpdmUnKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGguaW5hY3RpdmUnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvZ2dpbmdJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5yZWdpc3RlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYoJHNjb3BlLmF1dGgucmVjYXB0Y2hhcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVnaXN0ZXJTdGF0ZSA9ICdyZWdpc3RyZXJpbmcnO1xuXG4gICAgICAgICAgICAgICAgQXV0aEZhY3RvcnkucmVnaXN0ZXIoJHNjb3BlLmF1dGgpXG4gICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWdpc3RlclN0YXRlID0gJ2RvbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmF1dGggPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlZ2lzdGVyU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ha2VzIGEgcmVxdWVzdCBmb3Igc2VuZGluZyBhIHBhc3N3b3JkIHJlc2V0IGxpbmsuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAgICAgKi9cbiAgICAgICAgJHNjb3BlLnJlc2V0ID0ge2VtYWlsOiAnJ307XG4gICAgICAgICRzY29wZS5yZXF1ZXN0UGFzc3dvcmRSZXNldCA9IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgQXV0aEZhY3RvcnlcbiAgICAgICAgICAgICAgICAucmVxdWVzdFBhc3N3b3JkUmVzZXQoe2VtYWlsOiAkc2NvcGUucmVzZXQuZW1haWx9KVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0LmVtYWlsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnc3VjY2VzcycpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudGVybXNNb2RhbE9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnRlcm1zTW9kYWwgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiAkc2NvcGUuYW5pbWF0aW9uc0VuYWJsZWQsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvdGVybXMnLFxuICAgICAgICAgICAgICAgIHNpemU6ICdtZCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHVpYk1vZGFsSW5zdGFuY2Upe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdtb2RhbCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSlcblxuICAgIC5jb250cm9sbGVyKCdBY3RpdmF0aW9uQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzdGF0ZSwgJHJvb3RTY29wZSwgJHNjb3BlLCAkaHR0cCwgJHN0YXRlUGFyYW1zLCBBdXRoRmFjdG9yeSwgJHRpbWVvdXQpe1xuICAgICAgICAkc2NvcGUuYWN0aXZhdGUgPSB7XG4gICAgICAgICAgICB0b2tlbjogJHN0YXRlUGFyYW1zLnRva2VuXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5ub19wYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUudmVyaWZ5VG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIEF1dGhGYWN0b3J5LmFjdGl2YXRlKCRzY29wZS5hY3RpdmF0ZSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZXJyb3IgPT0gJ2ludmFsaWRfY29kZScpe1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYocmVzcG9uc2UuZXJyb3IgPT0gJ25vX3Bhc3N3b3JkJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9fcGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnd2FybmluZycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9KVxuXG4gICAgLmZhY3RvcnkoJ0F1dGhGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRmaWx0ZXIsICR0aW1lb3V0LCAkc3RhdGUsICRyb290U2NvcGUsIEFwaUVuZHBvaW50VXJsKXtcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTdG9yZXMgdGhlIHVzZXIgZGF0YSBhbmQgdXBkYXRlcyB0aGUgcm9vdHNjb3BlIHZhcmlhYmxlcy4gVGhlbiByZWRpcmVjdHMgdG8gZGFzaGJvYXJkLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSAgb2JqZWN0ICAkdXNlclxuICAgICAgICAgICAgICogQHJldHVybiB2b2lkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogZnVuY3Rpb24oY3JlZGVudGlhbHMpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBjcmVkZW50aWFsc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0VXNlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXNlcidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xlYXJzIGFsbCB1c2VyIGRhdGEgYW5kIHJvb3RzY29wZSB1c2VyIHZhcmlhYmxlcy4gVGhlbiByZWRpcmVjdHMgdG8gbG9naW4gZm9ybS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9nb3V0OiBmdW5jdGlvbigpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlcXVlc3RQYXNzd29yZFJlc2V0OiBmdW5jdGlvbihjcmVkZW50aWFscykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydwYXNzd29yZC9lbWFpbCcsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzZXRQYXNzd29yZDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncGFzc3dvcmQvcmVzZXQnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihjcmVkZW50aWFscykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydyZWdpc3RlcicsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYWN0aXZhdGU6IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FjdGl2YXRlJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0odG9rZW4pXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhdHRlbXB0UmVmcmVzaFRva2VuOiBmdW5jdGlvbihyZXF1ZXN0VG9kb1doZW5Eb25lKXtcblxuICAgICAgICAgICAgICAgIC8vIFJ1biB0aGUgY2FsbCB0byByZWZyZXNoIHRoZSB0b2tlbi5cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncmVmcmVzaCdcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbm8gcmVzcG9uc2UgdG9rZW4gaXMgcmV0cmlldmVkLCBnbyB0byB0aGUgbG9naW4gcGFnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgdGhlIHJlcXVlc3QgZnJvbSBiZWluZyByZXRyaWVkIGJ5IHNldHRpbmcgcmVxdWVzdFRvZG9XaGVuRG9uZSA9IGZhbHNlIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGZhbHNlIHRvIGFsbG93IGZvciBjdXN0b20gY2FsbGJhY2tzIGJ5IGNoZWNraW5nIGlmKEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4oKSA9PT0gZmFsc2UpLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLnRva2VuKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RUb2RvV2hlbkRvbmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5sb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSByZWZyZXNoZWQgdG9rZW4uXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCByZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhIHJlcXVlc3Qgc2hvdWxkIGJlIHJldHJpZWQgYWZ0ZXIgcmVmcmVzaCwgZm9yIGV4YW1wbGUgb24gcHVsbC10by1yZWZyZXNoLCB0aGUgcmVxdWVzdCBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIHBhc3NlZCBpbnRvIHRoZSByZXF1ZXN0VG9kb1doZW5Eb25lIHBhcmFtZXRlci4gU2V0IHRoZSBhdXRob3JpemF0aW9uIHRva2VuIHRvIHRoZSBuZXdseSByZXRyaWV2ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRva2VuIGFuZCBydW4gdGhlIHJlcXVlc3QgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWFuZ3VsYXIuaXNVbmRlZmluZWQocmVxdWVzdFRvZG9XaGVuRG9uZSkgJiYgcmVxdWVzdFRvZG9XaGVuRG9uZS5sZW5ndGggIT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdFRvZG9XaGVuRG9uZS5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAocmVxdWVzdFRvZG9XaGVuRG9uZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RUb2RvV2hlbkRvbmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jYWxlbmRhcicsIFtdKVxuXG4vKipcbiAqIGNhbGVuZGFyRGVtb0FwcCAtIDAuMS4zXG4gKi9cbi5jb250cm9sbGVyKCdDYWxlbmRhckNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsJGh0dHAsJHRpbWVvdXQsIEFwaUVuZHBvaW50VXJsKSB7XG5cdFxuXHRmdW5jdGlvbiBpbml0KCl7XG5cdFx0XG5cdFx0JGFwaVVybCA9IEFwaUVuZHBvaW50VXJsKydjYWxlbmRhcic7XG5cdFxuXHRcdCRzY29wZS5jYWxlbmRhckV2ZW50cyA9IFt7XG4gICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsK1wiY2FsZW5kYXJcIixcbiAgICAgICAgfV07XG5cdFxuXHQgICAgJHNjb3BlLnVpQ29uZmlnID0ge1xuXHQgICAgICBjYWxlbmRhcjp7XG5cdFx0ICAgIGxhbmc6ICdzdicsXG5cdFx0ICAgIGJ1dHRvblRleHQ6IHtcblx0XHRcdCAgICB0b2RheTogICAgJ2lkYWcnLFxuXHRcdFx0ICAgIG1vbnRoOiAgICAnbcOlbmFkJyxcblx0XHRcdCAgICB3ZWVrOiAgICAgJ3ZlY2thJyxcblx0XHRcdCAgICBkYXk6ICAgICAgJ2RhZydcblx0XHRcdH0sXG5cdFx0XHRmaXJzdERheTogJzEnLFxuXHRcdFx0d2Vla051bWJlcnM6IHRydWUsXG5cdFx0XHRoZWFkZXI6IHtcblx0XHRcdFx0bGVmdDogJ3ByZXYsbmV4dCB0b2RheScsXG5cdFx0XHRcdGNlbnRlcjogJ3RpdGxlJyxcblx0XHRcdFx0cmlnaHQ6ICdtb250aCxhZ2VuZGFXZWVrLGFnZW5kYURheSdcblx0XHRcdH0sXG5cdFx0XHRjb2x1bW5Gb3JtYXQ6IHtcblx0XHRcdFx0ZGF5OiAnZGRkIEREL01NJyxcblx0XHRcdFx0d2VlazogJ2RkZCBERC9NTScsXG5cdFx0XHRcdG1vbnRoOiAnZGRkJ1xuXHRcdFx0fSxcblx0XHRcdHRpdGxlRm9ybWF0OiB7XG5cdFx0XHQgICAgbW9udGg6ICdNTU1NIFlZWVknLCAvLyBTZXB0ZW1iZXIgMjAwOVxuXHRcdFx0ICAgIHdlZWs6IFwiTU1NTSBEIFlZWVlcIiwgLy8gU2VwIDEzIDIwMDlcblx0XHRcdCAgICBkYXk6ICdNTU1NIEQgWVlZWScgIC8vIFNlcHRlbWJlciA4IDIwMDlcblx0XHRcdH0sXG5cdFx0XHR3ZWVrTnVtYmVyVGl0bGU6ICcnLFxuXHRcdFx0YXhpc0Zvcm1hdDogJ0g6bW0nLFxuXHRcdFx0dGltZUZvcm1hdDogJ0g6bW0nLFxuXHRcdFx0bWluVGltZTogJzY6MDAnLFxuXHRcdFx0bWF4VGltZTogJzIzOjU5Jyxcblx0XHRcdGFsbERheVNsb3Q6IGZhbHNlLFxuXHRcdFx0ZGVmYXVsdFZpZXc6ICdtb250aCcsXG5cdCAgICAgICAgaGVpZ2h0OiA1MDAsXG5cdCAgICAgICAgZWRpdGFibGU6IGZhbHNlLFxuXHQgICAgICAgIHZpZXdSZW5kZXI6IGZ1bmN0aW9uKHZpZXcsIGVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIHN0YXJ0ID0gRGF0ZS5wYXJzZSh2aWV3LnN0YXJ0Ll9kKTtcblx0XHRcdFx0dmFyIGVuZCA9IERhdGUucGFyc2Uodmlldy5lbmQuX2QpO1xuXHRcdFx0XHQkc2NvcGUuY2FsZW5kYXJFdmVudHMgPSBbe1xuXHRcdCAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrXCJjYWxlbmRhcj9zdGFydD1cIitzdGFydCtcIiZlbmQ9XCIrZW5kXG5cdFx0ICAgICAgICB9XTtcbiAgICAgICAgXHR9LFxuXHRcdFx0ZXZlbnRDbGljazogJHNjb3BlLmFsZXJ0T25FdmVudENsaWNrLFxuXHQgICAgICAgIGV2ZW50RHJvcDogJHNjb3BlLmFsZXJ0T25Ecm9wLFxuXHQgICAgICAgIGV2ZW50UmVzaXplOiBmdW5jdGlvbih2aWV3LCBlbGVtZW50KSB7XG5cdFx0ICAgICAgICBjb25zb2xlLmxvZyh2aWV3KTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5jaGFuZ2VWaWV3ID0gZnVuY3Rpb24odmlldyxjYWxlbmRhcikge1xuXHQgICAgICBjYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ2NoYW5nZVZpZXcnLHZpZXcpO1xuXHQgICAgfTtcblx0XG5cdCAgICAkc2NvcGUucmVuZGVyQ2FsZW5kZXIgPSBmdW5jdGlvbihjYWxlbmRhcikge1xuXHQgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHQgICAgICAgY29uc29sZS5sb2coMTIzKTsgXG5cdFx0XHRcdGlmKGNhbGVuZGFyKXtcblx0XHRcdFx0Y2FsZW5kYXIuZnVsbENhbGVuZGFyKCdyZW5kZXInKTtcblx0XHRcdFx0fVxuXHQgICAgICAgfSwgMCk7XG5cdCAgICB9O1xuXHR9XG5cdFxuXHRpbml0KCk7XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhbXBpb25zaGlwcycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNoYW1waW9uc2hpcHNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENoYW1waW9uc2hpcHNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcbiAgICAgICAgQ2hhbXBpb25zaGlwc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhbXBpb25zaGlwcyA9IHJlc3BvbnNlLmNoYW1waW9uc2hpcHM7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG5cblxufSlcbi5jb250cm9sbGVyKFwiQ2hhbXBpb25zaGlwQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDaGFtcGlvbnNoaXBzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbmQoKXtcbiAgICAgICAgQ2hhbXBpb25zaGlwc0ZhY3RvcnkuZmluZCgkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGFtcGlvbnNoaXBzID0gcmVzcG9uc2UuY2hhbXBpb25zaGlwcztcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2hhbXBpb25zaGlwcycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbn0pXG5cbi5mYWN0b3J5KCdDaGFtcGlvbnNoaXBzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHBhZ2UsIGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NoYW1waW9uc2hpcHMnO1xuXG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjaGFtcGlvbnNoaXBzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cC8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHNpZ251cClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jbHVicycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNsdWJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBDbHVic0ZhY3Rvcnkpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5maWx0ZXIgPSB7XG5cdFx0dXNlcnM6IHtcblx0XHRcdHNlYXJjaDogJydcblx0XHR9XG5cdH07XG5cblx0c2VsZi5hZGRfYWRtaW4gPSBudWxsO1xuXG5cdGZ1bmN0aW9uIGxvYWRVc2VyQ2x1YigpIHtcblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG5cdFx0Q2x1YnNGYWN0b3J5LmxvYWRVc2VyQ2x1YigpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuc2VsZWN0ZWRDbHVicyA9ICcnO1xuXHRcdFx0XHRpZighcmVzcG9uc2UuaWQpe1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5jb25uZWN0Jywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi51cGRhdGVDbHViID0gZnVuY3Rpb24oKXtcblx0XHRDbHVic0ZhY3RvcnkudXBkYXRlQ2x1YihzZWxmLmNsdWIpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5pbmZvcm1hdGlvbicsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0XHR9KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZFVzZXJBc0FkbWluID0gZnVuY3Rpb24oYWRtaW4pXG5cdHtcblx0XHRpZihhZG1pbil7XG5cdFx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlckFzQWRtaW4oYWRtaW4pXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0bG9hZFVzZXJDbHViKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xuXG5cdHNlbGYuZGVsZXRlVXNlckFzQWRtaW4gPSBmdW5jdGlvbihhZG1pbilcblx0e1xuXHRcdGlmKGFkbWluKXtcblx0XHRcdENsdWJzRmFjdG9yeS5kZWxldGVVc2VyQXNBZG1pbihhZG1pbilcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRsb2FkVXNlckNsdWIoKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG5cblx0bG9hZFVzZXJDbHViKCk7XG59KVxuXG4uY29udHJvbGxlcihcIkNsdWJDb25uZWN0Q29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cdHNlbGYuc2VsZWN0ZWRjbHViID0ge307XG5cdHNlbGYubmV3X2NsdWIgPSBudWxsO1xuXHRzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuXHRzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcblxuXHRmdW5jdGlvbiBsb2FkVXNlckNsdWIoKSB7XG5cdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdENsdWJzRmFjdG9yeS5sb2FkVXNlckNsdWIoKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnNlbGVjdGVkQ2x1YnMgPSAnJztcblx0XHRcdFx0aWYocmVzcG9uc2UuaWQpe1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5pbmZvcm1hdGlvbicsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2VsZi5jbHViID0gcmVzcG9uc2U7XG5cdFx0XHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi5zZWFyY2hGb3JDbHVicyA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5LCBjbHViKVxuXHR7XG5cdFx0cmV0dXJuIENsdWJzRmFjdG9yeVxuXHRcdFx0LnNlYXJjaEZvckNsdWJzKHNlYXJjaFF1ZXJ5KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ3dhcm5pbmcnKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuZm91bmRNYXRjaCA9IChyZXNwb25zZS5kYXRhLmNsdWJzLmxlbmd0aCA+IDApO1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YS5jbHVicy5tYXAoZnVuY3Rpb24oaXRlbSl7XG5cdFx0XHRcdFx0aXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXR1cm4gaXRlbTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLnNlbGVjdENsdWIgPSBmdW5jdGlvbigkaXRlbSlcblx0e1xuXHRcdGlmKCRpdGVtLmFscmVhZHlTZWxlY3RlZCA9PT0gdHJ1ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdHNlbGYubm9NYXRjaGluZ0NsdWJzID0gbnVsbDtcblx0XHRzZWxmLm5ld19jbHViID0gJGl0ZW07XG5cdH07XG5cblx0c2VsZi5ub0NsdWJzRm91bmQgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IHRydWU7XG5cdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdH07XG5cblx0c2VsZi5hZGRVc2VyVG9DbHVicyA9IGZ1bmN0aW9uKGNsdWIpXG5cdHtcblx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlclRvQ2x1YnMoY2x1Yi5pZClcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdFx0XHRcdHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdFx0JHN0YXRlLmdvKCdjbHViLmluZm9ybWF0aW9uJywge30sIHtsb2NhdGlvbjogJ3JlcGxhY2UnfSk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZE5ld0NsdWIgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRpZighc2VsZi5zZWFyY2hRdWVyeSB8fCAhc2VsZi5hZGRfY2x1YnNfbnIpIHJldHVybiBmYWxzZTtcblx0XHR2YXIgY2x1YiA9IHtcblx0XHRcdG5hbWU6IHNlbGYuc2VhcmNoUXVlcnksXG5cdFx0XHRjbHVic19ucjogc2VsZi5hZGRfY2x1YnNfbnJcblx0XHR9O1xuXG5cdFx0Q2x1YnNGYWN0b3J5LmFkZE5ld0NsdWIoY2x1Yilcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuXHRcdFx0XHRzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuXHRcdFx0XHRzZWxmLm5ld19jbHViID0gbnVsbDtcblx0XHRcdFx0c2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG5cdFx0XHRcdHNlbGYuY2x1YiA9IHJlc3BvbnNlO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2NsdWIuaW5mb3JtYXRpb24nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdGxvYWRVc2VyQ2x1YigpO1xuXG59KVxuXG4uZmFjdG9yeSgnQ2x1YnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuXHRyZXR1cm4ge1xuXHRcdGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuXHRcdFx0dmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydjbHVicyc7XG5cblx0XHRcdGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG5cdFx0XHRpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzLycraWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oY2x1Yilcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHR1cGRhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicycsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKGNsdWIpXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvJytjbHViLmlkLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGxvYWRVc2VyQ2x1YjogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2dldFVzZXJDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGRVc2VyVG9DbHViczogZnVuY3Rpb24oY2x1YnNfaWQpe1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2FkZFVzZXJUb0NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19pZCc6IGNsdWJzX2lkfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGROZXdDbHViOiBmdW5jdGlvbihjbHViKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy9hZGROZXdDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19ucic6IGNsdWIuY2x1YnNfbnIsICduYW1lJzogY2x1Yi5uYW1lfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRzZWFyY2hGb3JDbHViczogZnVuY3Rpb24oZmlsdGVyKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvc2VhcmNoJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydzZWFyY2hRdWVyeSc6IGZpbHRlcn0pXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0YWRkVXNlckFzQWRtaW46IGZ1bmN0aW9uKGFkbWluKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvYWRkVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGRlbGV0ZVVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvZGVsZXRlVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jb21wZXRpdGlvbnMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJDb21wZXRpdGlvbnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENvbXBldGl0aW9uc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENvbXBldGl0aW9uc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG5cblxuICAgIHRoaXMubmV4dFBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5wYWdlKys7XG4gICAgICAgIHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcbiAgICAgICAgJHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgfTtcbiAgICB0aGlzLnByZXZQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzZWxmLnBhZ2UgPiAwKSB7XG4gICAgICAgICAgICBzZWxmLnBhZ2UtLTtcbiAgICAgICAgICAgIHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNvcnRDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNvcnRMaXN0KCk7XG4gICAgICAgICRzdGF0ZS5nbygnLicsIHtzb3J0OiBzZWxmLnNvcnR9LCB7bm90aWZ5OiBmYWxzZX0pO1xuICAgIH07XG59KVxuLmNvbnRyb2xsZXIoXCJDb21wZXRpdGlvbkNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgJHRpbWVvdXQsIENvbXBldGl0aW9uc0ZhY3RvcnksIFNpZ251cHNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ29tcGV0aXRpb25zRmFjdG9yeS5maW5kKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9ucyA9IHJlc3BvbnNlLmNvbXBldGl0aW9ucztcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbnMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmNyZWF0ZVNpZ251cCA9IGZ1bmN0aW9uKHdlYXBvbmNsYXNzZXNfaWQpe1xuICAgICAgICB2YXIgc2lnbnVwID0ge1xuICAgICAgICAgICAgJ2NvbXBldGl0aW9uc19pZCc6IHNlbGYuY29tcGV0aXRpb25zLmlkLFxuICAgICAgICAgICAgJ3dlYXBvbmNsYXNzZXNfaWQnOiB3ZWFwb25jbGFzc2VzX2lkLFxuICAgICAgICAgICAgJ3VzZXJzX2lkJzogc2VsZi51c2VyLnVzZXJfaWRcbiAgICAgICAgfTtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkuY3JlYXRlU2lnbnVwKHNpZ251cClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXNwb25zZS53ZWFwb25jbGFzc2VzX2lkID0gcGFyc2VJbnQocmVzcG9uc2Uud2VhcG9uY2xhc3Nlc19pZCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbnMudXNlcnNpZ251cHMucHVzaChyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmRlbGV0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNoaWZ0IGZyb20gdGhlIGNhbGVuZGFyLlxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmNvbXBldGl0aW9ucy51c2Vyc2lnbnVwcywgZnVuY3Rpb24oc2lnbnVwcywgaW5kZXgpe1xuICAgICAgICAgICAgICAgICAgICBpZihzaWdudXBzLmlkID09IHNpZ251cC5pZClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbnMudXNlcnNpZ251cHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZpbmQoKTtcbn0pXG5cbi5mYWN0b3J5KCdDb21wZXRpdGlvbnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zJztcblxuICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzVW5kZWZpbmVkKGlkKSAmJiBpZCA+IDApIHVybCArPSAnLycgKyBpZDtcbiAgICAgICAgICAgIGlmIChwYWdlKSB1cmwgKz0gJz9wYWdlPScgKyBwYWdlO1xuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXNoYm9hcmQnLCBbXSlcblxuICAgIC5jb250cm9sbGVyKFwiRGFzaGJvYXJkQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICR0aW1lb3V0KXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICAkc2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgKGZ1bmN0aW9uKGQsIHMsIGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIEZCID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzLCBmanMgPSBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKHMpWzBdO1xuICAgICAgICAgICAgICAgICAgICAvL2lmIChkLmdldEVsZW1lbnRCeUlkKGlkKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBqcyA9IGQuY3JlYXRlRWxlbWVudChzKTsganMuaWQgPSBpZDtcbiAgICAgICAgICAgICAgICAgICAganMuc3JjID0gXCIvL2Nvbm5lY3QuZmFjZWJvb2submV0L3N2X1NFL3Nkay5qcyN4ZmJtbD0xJnZlcnNpb249djIuNiZhcHBJZD05NTY4Njc1MjQzOTgyMjJcIjtcbiAgICAgICAgICAgICAgICAgICAgZmpzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGpzLCBmanMpO1xuICAgICAgICAgICAgICAgIH0oZG9jdW1lbnQsICdzY3JpcHQnLCAnZmFjZWJvb2stanNzZGsnKSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZXJyb3JoYW5kbGVyJywgW10pXG5cblx0LmNvbnRyb2xsZXIoXCJFcnJvckhhbmRsZXJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgRXJyb3JIYW5kbGVyRmFjdG9yeSl7XG5cblx0fSlcblxuXHQuZmFjdG9yeSgnRXJyb3JIYW5kbGVyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cblx0XHRyZXR1cm4ge1xuXG5cdFx0XHRyZXBvcnRFcnJvcjogZnVuY3Rpb24oZXJyb3IsIGNhdXNlKSB7XG5cdFx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnZXJyb3IvcmVwb3J0Jyxcblx0XHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0XHRkYXRhOiAkLnBhcmFtKHtlcnJvcjogZXJyb3IsIGNhdXNlOiBjYXVzZX0pXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHR9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAucGF5bWVudHMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJQYXltZW50c0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIFBheW1lbnRzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRQYXltZW50cygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFBheW1lbnRzRmFjdG9yeS5sb2FkKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnBheW1lbnRzID0gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBsb2FkUGF5bWVudHMoKTtcbn0pXG4uZmFjdG9yeSgnUGF5bWVudHNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJwYXltZW50cy8nLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJwYXltZW50cy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVVc2VyOiBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgICAgIHZhciBkYXRhID0gYW5ndWxhci5jb3B5KHVzZXIpO1xuICAgICAgICAgICAgZGF0YS5iaXJ0aGRheSA9IGRhdGEuYmlydGhkYXkrJy0wMS0wMSc7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlVXNlcjogZnVuY3Rpb24odXNlcil7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGFuZ3VsYXIuY29weSh1c2VyKTtcbiAgICAgICAgICAgIGRhdGEuYmlydGhkYXkgPSBkYXRhLmJpcnRoZGF5KyctMDEtMDEnO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzLycrZGF0YS51c2VyX2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oZGF0YSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnByZW1pdW0nLCBbXSlcbi5jb250cm9sbGVyKFwiUHJlbWl1bUNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIFByZW1pdW1GYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXG4gICAgc2VsZi5sb2FkUHJlbWl1bSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgUHJlbWl1bUZhY3RvcnkubG9hZFByZW1pdW0oKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YiA9IHJlc3BvbnNlO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5yZWdpc3RlclByZW1pdW0gPSBmdW5jdGlvbigpe1xuICAgICAgICBQcmVtaXVtRmFjdG9yeS5yZWdpc3RlclByZW1pdW0oKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YiA9IHJlc3BvbnNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5sb2FkUHJlbWl1bSgpO1xufSlcbi5mYWN0b3J5KCdQcmVtaXVtRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWRQcmVtaXVtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCArICdwcmVtaXVtJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVnaXN0ZXJQcmVtaXVtOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwgKyAncHJlbWl1bScsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zZXR0aW5ncycsIFtdKVxuXG4uY29udHJvbGxlcihcIlNldHRpbmdzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgU2V0dGluZ3NGYWN0b3J5KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi5jYW5jZWxhY2NvdW50ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTZXR0aW5nc0ZhY3RvcnkuY2FuY2VsYWNjb3VudCgpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5sb2dvdXQnKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xufSlcblxuLmNvbnRyb2xsZXIoXCJQYXNzd29yZENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIFNldHRpbmdzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHNlbGYucmVzZXQgPSB7XG4gICAgICAgICdjdXJyZW50X3Bhc3N3b3JkJzonJyxcbiAgICAgICAgJ3Bhc3N3b3JkJzogJycsXG4gICAgICAgICdwYXNzd29yZF9jb25maXJtYXRpb24nOicnXG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlUGFzc3dvcmQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgU2V0dGluZ3NGYWN0b3J5LnVwZGF0ZVBhc3N3b3JkKHNlbGYucmVzZXQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5yZXNldCA9IHtcbiAgICAgICAgICAgICAgICAgICAgJ2N1cnJlbnRfcGFzc3dvcmQnOicnLFxuICAgICAgICAgICAgICAgICAgICAncGFzc3dvcmQnOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgJ3Bhc3N3b3JkX2NvbmZpcm1hdGlvbic6JydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG59KVxuXG4uY29udHJvbGxlcihcIlVzZXJQcm9maWxlQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgU2V0dGluZ3NGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gbG9hZFVzZXJwcm9maWxlKCkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFNldHRpbmdzRmFjdG9yeS5sb2FkVXNlcnByb2ZpbGUoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYudXNlcnByb2ZpbGUgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmRhdGVQaWNrZXJPcHRpb25zID0ge3N0YXJ0aW5nRGF5OiAxLCBzdGFydDoge29wZW5lZDogZmFsc2V9LCBlbmQ6IHtvcGVuZWQ6IGZhbHNlfX07XG5cbiAgICBzZWxmLnNhdmVVc2VycHJvZmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgU2V0dGluZ3NGYWN0b3J5LnNhdmVVc2VycHJvZmlsZShzZWxmLnVzZXJwcm9maWxlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VyJywgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UudXNlcikpO1xuICAgICAgICAgICAgICAgIHNlbGYudXNlcnByb2ZpbGUgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzZXR0aW5ncy51c2VyJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuY2FuY2VsVXNlcnByb2ZpbGUgPSBmdW5jdGlvbigpe1xuICAgICAgICBsb2FkVXNlcnByb2ZpbGUoKTtcbiAgICAgICAgJHN0YXRlLmdvKCdzZXR0aW5ncy51c2VyJyk7XG4gICAgfTtcblxuICAgIGxvYWRVc2VycHJvZmlsZSgpO1xuXG59KVxuXG4uY29udHJvbGxlcihcIlVzZXJDbHVic0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIENsdWJzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuICAgIHNlbGYubmV3X2NsdWIgPSBudWxsO1xuICAgIHNlbGYuYWRkX2NsdWJzX25yID0gJyc7XG4gICAgc2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG5cbiAgICBmdW5jdGlvbiBsb2FkVXNlckNsdWJzKCkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENsdWJzRmFjdG9yeS5sb2FkVXNlckNsdWJzKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNlbGVjdGVkQ2x1YnMgPSAnJztcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuc2VhcmNoRm9yQ2x1YnMgPSBmdW5jdGlvbihzZWFyY2hRdWVyeSwgY2x1YnMpXG4gICAge1xuICAgICAgICByZXR1cm4gQ2x1YnNGYWN0b3J5XG4gICAgICAgICAgICAuc2VhcmNoRm9yQ2x1YnMoc2VhcmNoUXVlcnkpXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICd3YXJuaW5nJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuZm91bmRNYXRjaCA9IChyZXNwb25zZS5kYXRhLmNsdWJzLmxlbmd0aCA+IDApO1xuICAgICAgICAgICAgICAgIHJldHVybiByZXNwb25zZS5kYXRhLmNsdWJzLm1hcChmdW5jdGlvbihpdGVtKXtcbiAgICAgICAgICAgICAgICAgICAgaXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNsdWJzLCBmdW5jdGlvbihjbHViKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKGNsdWIuaWQgPT0gaXRlbS5pZCkgaXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaXRlbTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLnNlbGVjdENsdWIgPSBmdW5jdGlvbigkaXRlbSlcbiAgICB7XG4gICAgICAgIGlmKCRpdGVtLmFscmVhZHlTZWxlY3RlZCA9PT0gdHJ1ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IG51bGw7XG4gICAgICAgIHNlbGYubmV3X2NsdWIgPSAkaXRlbTsgXG4gICAgfTtcblxuICAgIHNlbGYubm9DbHVic0ZvdW5kID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgY29uc29sZS5sb2coMTIzNCk7XG4gICAgICAgIHNlbGYubm9NYXRjaGluZ0NsdWJzID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5uZXdfY2x1YiA9IG51bGw7XG4gICAgfTtcblxuICAgIHNlbGYuYWRkVXNlclRvQ2x1YnMgPSBmdW5jdGlvbihjbHViKVxuICAgIHtcbiAgICAgICAgQ2x1YnNGYWN0b3J5LmFkZFVzZXJUb0NsdWJzKGNsdWIuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5uZXdfY2x1YiA9IG51bGw7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2VsZi5jbHVicyA9IHJlc3BvbnNlLmNsdWJzO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuYWRkTmV3Q2x1YiA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIGlmKCFzZWxmLnNlYXJjaFF1ZXJ5IHx8ICFzZWxmLmFkZF9jbHVic19ucikgcmV0dXJuIGZhbHNlO1xuICAgICAgICB2YXIgY2x1YiA9IHtcbiAgICAgICAgICAgIG5hbWU6IHNlbGYuc2VhcmNoUXVlcnksXG4gICAgICAgICAgICBjbHVic19ucjogc2VsZi5hZGRfY2x1YnNfbnJcbiAgICAgICAgfTtcblxuICAgICAgICBDbHVic0ZhY3RvcnkuYWRkTmV3Q2x1YihjbHViKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc2VhcmNoUXVlcnkgPSAnJztcbiAgICAgICAgICAgICAgICBzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuICAgICAgICAgICAgICAgIHNlbGYubmV3X2NsdWIgPSBudWxsO1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YnMgPSByZXNwb25zZS5jbHVicztcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsb2FkVXNlckNsdWJzKCk7XG59KVxuXG4uY29udHJvbGxlcihcIkludml0ZUNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIEludml0ZUZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYubG9hZEludml0ZXMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgSW52aXRlRmFjdG9yeS5sb2FkSW52aXRlcygpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZpdGVzID0gcmVzcG9uc2UuaW52aXRlcztcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG4gICAgc2VsZi5sb2FkSW52aXRlcygpO1xuXG4gICAgc2VsZi5pbnZpdGUgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEludml0ZUZhY3RvcnlcbiAgICAgICAgICAgIC5pbnZpdGUoc2VsZi51c2VyKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYudXNlciA9IHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIGxhc3RuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgZW1haWw6ICcnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRJbnZpdGVzKCk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG59KVxuXG4uZmFjdG9yeShcIkludml0ZUZhY3RvcnlcIiwgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkSW52aXRlczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKyd1c2Vycy9pbnZpdGUnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBpbnZpdGU6IGZ1bmN0aW9uKHVzZXIpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsndXNlcnMvaW52aXRlJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHVzZXIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pXG5cbi5mYWN0b3J5KFwiU2V0dGluZ3NGYWN0b3J5XCIsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZFVzZXJwcm9maWxlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2F1dGhlbnRpY2F0ZS91c2VyJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2F2ZVVzZXJwcm9maWxlOiBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgICAgIHZhciBkYXRhID0gYW5ndWxhci5jb3B5KHVzZXIpO1xuICAgICAgICAgICAgZGF0YS5iaXJ0aGRheSA9IGRhdGEuYmlydGhkYXkrJy0wMS0wMSc7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYXV0aGVudGljYXRlL3VzZXInLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oZGF0YSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZVBhc3N3b3JkOiBmdW5jdGlvbihjcmVkZW50aWFscykge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2F1dGhlbnRpY2F0ZS91cGRhdGVQYXNzd29yZCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbmNlbGFjY291bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvY2FuY2VsQWNjb3VudCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5zaWdudXBzJywgW10pXG5cbi5jb250cm9sbGVyKFwiU2lnbnVwc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgU2lnbnVwc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG59KVxuLmNvbnRyb2xsZXIoXCJTaWdudXBDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR0aW1lb3V0LCBTaWdudXBzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbmQoKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5maW5kKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgICAgIHNlbGYudXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2lnbnVwcycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLnVwZGF0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAndXBkYXRpbmcnO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS51cGRhdGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc2lnbnVwcy5wYXJ0aWNpcGF0ZV9vdXRfb2ZfY29tcGV0aXRpb24gPSBwYXJzZUludChyZXNwb25zZS5zaWdudXBzLnBhcnRpY2lwYXRlX291dF9vZl9jb21wZXRpdGlvbik7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc2lnbnVwcy53ZWFwb25jbGFzc2VzX2lkID0gcGFyc2VJbnQocmVzcG9uc2Uuc2lnbnVwcy53ZWFwb25jbGFzc2VzX2lkKTtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi5zdGF0ZSA9ICd1cGRhdGVkJztcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NpZ251cCcsICh7aWQ6IHNpZ251cC5pZH0pKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVTaWdudXAgPSBmdW5jdGlvbihzaWdudXApe1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5kZWxldGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2lnbnVwcycpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgICBmaW5kKCk7XG59KVxuLmNvbnRyb2xsZXIoXCJDbHViU2lnbnVwQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdGltZW91dCwgU2lnbnVwc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBsb2FkQ2x1YlNpZ251cHMoKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5sb2FkQ2x1YlNpZ251cHMoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb24gPSByZXNwb25zZS5jb21wZXRpdGlvbjtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWIgPSByZXNwb25zZS5jbHViO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHNlbGYuY3JlYXRlU2lnbnVwID0gZnVuY3Rpb24odXNlcl9pZCwgd2VhcG9uY2xhc3Nlc19pZCl7XG4gICAgICAgIHZhciBzaWdudXAgPSB7XG4gICAgICAgICAgICAnY29tcGV0aXRpb25zX2lkJzogJHN0YXRlUGFyYW1zLmlkLFxuICAgICAgICAgICAgJ3dlYXBvbmNsYXNzZXNfaWQnOiB3ZWFwb25jbGFzc2VzX2lkLFxuICAgICAgICAgICAgJ3VzZXJzX2lkJzogdXNlcl9pZFxuICAgICAgICB9O1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5jcmVhdGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlLndlYXBvbmNsYXNzZXNfaWQgPSBwYXJzZUludChyZXNwb25zZS53ZWFwb25jbGFzc2VzX2lkKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9uLnNpZ251cHMucHVzaChyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmRlbGV0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNoaWZ0IGZyb20gdGhlIGNhbGVuZGFyLlxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmNvbXBldGl0aW9uLnNpZ251cHMsIGZ1bmN0aW9uKHNpZ251cHMsIGluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwcy5pZCA9PSBzaWdudXAuaWQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb24uc2lnbnVwcy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG5cblxuICAgIGxvYWRDbHViU2lnbnVwcygpO1xufSlcbi5mYWN0b3J5KCdTaWdudXBzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuXG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ3NpZ251cCc7XG5cbiAgICAgICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuICAgICAgICAgICAgICAgIGlmIChwYWdlKSB1cmwgKz0gJz9wYWdlPScgKyBwYWdlO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cC8nK2lkLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY3JlYXRlU2lnbnVwOiBmdW5jdGlvbihzaWdudXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oc2lnbnVwKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgdXBkYXRlU2lnbnVwOiBmdW5jdGlvbihzaWdudXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydzaWdudXAvJytzaWdudXAuaWQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHNpZ251cClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGRlbGV0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgbG9hZENsdWJTaWdudXBzOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsICsgJ2NvbXBldGl0aW9ucy8nICsgY29tcGV0aXRpb25zX2lkICsgJy9jbHVic2lnbnVwcycsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGVhbXMnLCBbXSlcbi5jb250cm9sbGVyKCdUZWFtU2lnbnVwQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENvbXBldGl0aW9uc0ZhY3RvcnksIFRlYW1zRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbG9hZFRlYW1zKCkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIGlmKCRzdGF0ZVBhcmFtcy50ZWFtc19pZCl7XG4gICAgICAgICAgICBUZWFtc0ZhY3RvcnkubG9hZCgkc3RhdGVQYXJhbXMuaWQsICRzdGF0ZVBhcmFtcy50ZWFtc19pZClcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGVhbXMgPSByZXNwb25zZS50ZWFtcztcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzID0gcmVzcG9uc2Uuc2lnbnVwcztcblxuICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi50ZWFtcy5zaWdudXBzLCBmdW5jdGlvbihzaWdudXAsIGtleSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gMSkgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX2ZpcnN0ICA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSAyKSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfc2Vjb25kID0gc2lnbnVwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDMpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc190aGlyZCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSA0KSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfZm91cnRoID0gc2lnbnVwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDUpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc19maWZ0aCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi50ZWFtcy5zaWdudXBzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LmxvYWQoJHN0YXRlUGFyYW1zLmlkLCAkc3RhdGVQYXJhbXMudGVhbXNfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZFRlYW0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYXBvbmNsYXNzZXNfaWQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19maXJzdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYW1zX3NpZ251cHNfc2Vjb25kOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc190aGlyZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYW1zX3NpZ251cHNfZm91cnRoOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19maWZ0aDogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRlYW1zID0gcmVzcG9uc2UudGVhbXM7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfVxuXG4gICAgc2VsZi5jcmVhdGVUZWFtID0gZnVuY3Rpb24oKXtcbiAgICAgICAgaWYoc2VsZi5hZGRUZWFtLm5hbWUgJiYgc2VsZi5hZGRUZWFtLndlYXBvbmNsYXNzZXNfaWQpe1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LnN0b3JlKCRzdGF0ZVBhcmFtcy5pZCwgc2VsZi5hZGRUZWFtKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5yZWRpcmVjdF90b19lZGl0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMuZWRpdCcsIHtpZDogJHN0YXRlUGFyYW1zLmlkLCB0ZWFtc19pZDogcmVzcG9uc2UucmVkaXJlY3RfdG9fZWRpdH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIHNlbGYudXBkYXRlVGVhbSA9IGZ1bmN0aW9uKHRlYW0pe1xuICAgICAgICBpZihzZWxmLnRlYW1zLm5hbWUgJiYgc2VsZi50ZWFtcy53ZWFwb25jbGFzc2VzX2lkKXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS51cGRhdGUoJHN0YXRlUGFyYW1zLmlkLCBzZWxmLnRlYW1zLmlkLCB0ZWFtKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5yZWRpcmVjdF90b19lZGl0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMuZWRpdCcsIHtpZDogJHN0YXRlUGFyYW1zLmlkLCB0ZWFtc19pZDogcmVzcG9uc2UucmVkaXJlY3RfdG9fZWRpdH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWxUZWFtID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycse2lkOiAkc3RhdGVQYXJhbXMuaWR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVUZWFtID0gZnVuY3Rpb24odGVhbXNfaWQpe1xuICAgICAgICBpZih0ZWFtc19pZCl7XG4gICAgICAgICAgICBUZWFtc0ZhY3RvcnkuZGVsZXRlKCRzdGF0ZVBhcmFtcy5pZCwgdGVhbXNfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxvYWRUZWFtcygpO1xuXG59KVxuLmZhY3RvcnkoJ1RlYW1zRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChjb21wZXRpdGlvbnNfaWQsIHRlYW1zX2lkKSB7XG4gICAgICAgICAgICBpZihjb21wZXRpdGlvbnNfaWQgJiYgdGVhbXNfaWQpe1xuICAgICAgICAgICAgICAgIHVybCA9IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcy8nK3RlYW1zX2lkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmwgPSBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RvcmU6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgdGVhbSl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHRlYW0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgdGVhbXNfaWQsIHRlYW0pe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzLycrdGVhbXNfaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh0ZWFtKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHRlYW1zX2lkKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcy8nK3RlYW1zX2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC51c2VycycsIFtdKVxuXG4uY29udHJvbGxlcihcIlVzZXJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBVc2Vyc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBsb2FkVXNlcigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIGlmKCRzdGF0ZVBhcmFtcy51c2VyX2lkKXtcbiAgICAgICAgICAgIFVzZXJzRmFjdG9yeS5maW5kKCRzdGF0ZVBhcmFtcy51c2VyX2lkKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51c2VyID0gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51c2VyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgc2VsZi51c2VyID0ge307XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxvYWRVc2VyKCk7XG5cbiAgICBzZWxmLnNhdmVVc2VyID0gZnVuY3Rpb24odXNlcil7XG4gICAgICAgIFVzZXJzRmFjdG9yeS5zYXZlVXNlcih1c2VyKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2x1Yi51c2Vycy5pbmRleCcsIHt9LCB7bG9jYXRpb246ICdyZWxvYWQnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmNyZWF0ZVVzZXIgPSBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgVXNlcnNGYWN0b3J5LmNyZWF0ZVVzZXIodXNlcilcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NsdWIudXNlcnMuaW5kZXgnLCB7fSwge2xvY2F0aW9uOiAncmVsb2FkJ30pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG59KVxuXG4uZmFjdG9yeSgnVXNlcnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsndXNlcnMvJytpZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlVXNlcjogZnVuY3Rpb24odXNlcil7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGFuZ3VsYXIuY29weSh1c2VyKTtcbiAgICAgICAgICAgIGRhdGEuYmlydGhkYXkgPSBkYXRhLmJpcnRoZGF5KyctMDEtMDEnO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKyd1c2VycycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShkYXRhKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2F2ZVVzZXI6IGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBhbmd1bGFyLmNvcHkodXNlcik7XG4gICAgICAgICAgICBkYXRhLmJpcnRoZGF5ID0gZGF0YS5iaXJ0aGRheSsnLTAxLTAxJztcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKyd1c2Vycy8nK2RhdGEudXNlcl9pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pO1xuIiwiLyoqXG4gKiBHbG9iYWwgZXJyb3IgaGFuZGxpbmcgZm9yIHRvcCBsZXZlbCBlcnJvcnMuXG4gKiBDYXRjaGVzIGFueSBleGNlcHRpb25zIGFuZCBzZW5kcyB0aGVtIHRvIHRoZSAkcm9vdFNjb3BlLnJlcG9ydEVycm9yIGZ1bmN0aW9uLlxuICovXG5hcHAuY29uZmlnKGZ1bmN0aW9uKCRwcm92aWRlKSB7XG4gICAgJHByb3ZpZGUuZGVjb3JhdG9yKFwiJGV4Y2VwdGlvbkhhbmRsZXJcIiwgZnVuY3Rpb24oJGRlbGVnYXRlLCAkaW5qZWN0b3IpIHtcblx0XHRyZXR1cm4gZnVuY3Rpb24oZXhjZXB0aW9uLCBjYXVzZSkge1xuXHRcdFx0JGRlbGVnYXRlKGV4Y2VwdGlvbiwgY2F1c2UpO1xuXHRcdFx0XG5cdFx0XHR2YXIgJHJvb3RTY29wZSA9ICRpbmplY3Rvci5nZXQoXCIkcm9vdFNjb3BlXCIpO1xuXHRcdFx0cmV0dXJuICRyb290U2NvcGUucmVwb3J0RXJyb3IoZXhjZXB0aW9uLCBjYXVzZSk7XG5cdFx0fTtcblx0fSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChmdW5jdGlvbiAoJHEsICRpbmplY3RvciwgJHJvb3RTY29wZSkge1xuICAgICAgICByZXR1cm4ge1xuXG4gICAgICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSB0b2tlbiBpcyBzZXQgZm9yIHRoZSByZXF1ZXN0LlxuICAgICAgICAgICAgICAgIHZhciB0b2tlbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuICAgICAgICAgICAgICAgIGlmKHRva2VuICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCZWFyZXIgJyArIHRva2VuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzWydYLVJlcXVlc3RlZC1XaXRoJ10gPSAnWE1MSHR0cFJlcXVlc3QnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIERldGVjdCBpZiB0aGUgdG9rZW4gaGFzIGV4cGlyZWQgb24gYSBodHRwIGNhbGwuIFJlZnJlc2ggdGhlIHRva2VuIGFuZCB0cnkgYWdhaW4uXG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBBdXRoRmFjdG9yeSA9ICRpbmplY3Rvci5nZXQoJ0F1dGhGYWN0b3J5Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gJGluamVjdG9yLmdldCgnJHN0YXRlJyk7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ3Rva2VuX2V4cGlyZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQXV0aEZhY3RvcnkuYXR0ZW1wdFJlZnJlc2hUb2tlbihyZXNwb25zZS5jb25maWcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ3VzZXJfaW5hY3RpdmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLmRhdGEubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ3VzZXJfaXNfbm90X2FkbWluJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5kYXRhLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ2FwaV92ZXJzaW9uX3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UuZGF0YS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5lcnJvciAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yID09ICd0b2tlbl9leHBpcmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4ocmVzcG9uc2UuY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5lcnJvciA9PSAndXNlcl9pbmFjdGl2ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLmRhdGEubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmVycm9yID09ICd1c2VyX2lzX25vdF9hZG1pbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAocmVzcG9uc2UuZXJyb3IgPT0gJ2FwaV92ZXJzaW9uX3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiAkcS5yZWplY3QocmVzcG9uc2UpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgIH07XG4gICAgfSk7XG5cbn0pOyIsIi8qXG4qICBBbmd1bGFySnMgRnVsbGNhbGVuZGFyIFdyYXBwZXIgZm9yIHRoZSBKUXVlcnkgRnVsbENhbGVuZGFyXG4qICBBUEkgQCBodHRwOi8vYXJzaGF3LmNvbS9mdWxsY2FsZW5kYXIvXG4qXG4qICBBbmd1bGFyIENhbGVuZGFyIERpcmVjdGl2ZSB0aGF0IHRha2VzIGluIHRoZSBbZXZlbnRTb3VyY2VzXSBuZXN0ZWQgYXJyYXkgb2JqZWN0IGFzIHRoZSBuZy1tb2RlbCBhbmQgd2F0Y2hlcyBpdCBkZWVwbHkgY2hhbmdlcy5cbiogICAgICAgQ2FuIGFsc28gdGFrZSBpbiBtdWx0aXBsZSBldmVudCB1cmxzIGFzIGEgc291cmNlIG9iamVjdChzKSBhbmQgZmVlZCB0aGUgZXZlbnRzIHBlciB2aWV3LlxuKiAgICAgICBUaGUgY2FsZW5kYXIgd2lsbCB3YXRjaCBhbnkgZXZlbnRTb3VyY2UgYXJyYXkgYW5kIHVwZGF0ZSBpdHNlbGYgd2hlbiBhIGNoYW5nZSBpcyBtYWRlLlxuKlxuKi9cblxuYW5ndWxhci5tb2R1bGUoJ3VpLmNhbGVuZGFyJywgW10pXG4gIC5jb25zdGFudCgndWlDYWxlbmRhckNvbmZpZycsIHt9KVxuICAuY29udHJvbGxlcigndWlDYWxlbmRhckN0cmwnLCBbJyRzY29wZScsICckdGltZW91dCcsICckbG9jYWxlJywgZnVuY3Rpb24oJHNjb3BlLCAkdGltZW91dCwgJGxvY2FsZSl7XG5cbiAgICAgIHZhciBzb3VyY2VTZXJpYWxJZCA9IDEsXG4gICAgICAgICAgZXZlbnRTZXJpYWxJZCA9IDEsXG4gICAgICAgICAgc291cmNlcyA9ICRzY29wZS5ldmVudFNvdXJjZXMsXG4gICAgICAgICAgZXh0cmFFdmVudFNpZ25hdHVyZSA9ICRzY29wZS5jYWxlbmRhcldhdGNoRXZlbnQgPyAkc2NvcGUuY2FsZW5kYXJXYXRjaEV2ZW50IDogYW5ndWxhci5ub29wLFxuXG4gICAgICAgICAgd3JhcEZ1bmN0aW9uV2l0aFNjb3BlQXBwbHkgPSBmdW5jdGlvbihmdW5jdGlvblRvV3JhcCl7XG4gICAgICAgICAgICAgIHZhciB3cmFwcGVyO1xuXG4gICAgICAgICAgICAgIGlmIChmdW5jdGlvblRvV3JhcCl7XG4gICAgICAgICAgICAgICAgICB3cmFwcGVyID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAvLyBUaGlzIGhhcHBlbnMgb3V0c2lkZSBvZiBhbmd1bGFyIGNvbnRleHQgc28gd2UgbmVlZCB0byB3cmFwIGl0IGluIGEgdGltZW91dCB3aGljaCBoYXMgYW4gaW1wbGllZCBhcHBseS5cbiAgICAgICAgICAgICAgICAgICAgICAvLyBJbiB0aGlzIHdheSB0aGUgZnVuY3Rpb24gd2lsbCBiZSBzYWZlbHkgZXhlY3V0ZWQgb24gdGhlIG5leHQgZGlnZXN0LlxuXG4gICAgICAgICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBhcmd1bWVudHM7XG4gICAgICAgICAgICAgICAgICAgICAgdmFyIF90aGlzID0gdGhpcztcbiAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgZnVuY3Rpb25Ub1dyYXAuYXBwbHkoX3RoaXMsIGFyZ3MpO1xuICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgIHJldHVybiB3cmFwcGVyO1xuICAgICAgICAgIH07XG5cbiAgICAgIHRoaXMuZXZlbnRzRmluZ2VycHJpbnQgPSBmdW5jdGlvbihlKSB7XG4gICAgICAgIGlmICghZS5faWQpIHtcbiAgICAgICAgICBlLl9pZCA9IGV2ZW50U2VyaWFsSWQrKztcbiAgICAgICAgfVxuICAgICAgICAvLyBUaGlzIGV4dHJhY3RzIGFsbCB0aGUgaW5mb3JtYXRpb24gd2UgbmVlZCBmcm9tIHRoZSBldmVudC4gaHR0cDovL2pzcGVyZi5jb20vYW5ndWxhci1jYWxlbmRhci1ldmVudHMtZmluZ2VycHJpbnQvM1xuICAgICAgICByZXR1cm4gXCJcIiArIGUuX2lkICsgKGUuaWQgfHwgJycpICsgKGUudGl0bGUgfHwgJycpICsgKGUudXJsIHx8ICcnKSArICgrZS5zdGFydCB8fCAnJykgKyAoK2UuZW5kIHx8ICcnKSArXG4gICAgICAgICAgKGUuYWxsRGF5IHx8ICcnKSArIChlLmNsYXNzTmFtZSB8fCAnJykgKyBleHRyYUV2ZW50U2lnbmF0dXJlKGUpIHx8ICcnO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5zb3VyY2VzRmluZ2VycHJpbnQgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgICByZXR1cm4gc291cmNlLl9faWQgfHwgKHNvdXJjZS5fX2lkID0gc291cmNlU2VyaWFsSWQrKyk7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLmFsbEV2ZW50cyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyByZXR1cm4gc291cmNlcy5mbGF0dGVuKCk7IGJ1dCB3ZSBkb24ndCBoYXZlIGZsYXR0ZW5cbiAgICAgICAgdmFyIGFycmF5U291cmNlcyA9IFtdO1xuICAgICAgICBmb3IgKHZhciBpID0gMCwgc3JjTGVuID0gc291cmNlcy5sZW5ndGg7IGkgPCBzcmNMZW47IGkrKykge1xuICAgICAgICAgIHZhciBzb3VyY2UgPSBzb3VyY2VzW2ldO1xuICAgICAgICAgIGlmIChhbmd1bGFyLmlzQXJyYXkoc291cmNlKSkge1xuICAgICAgICAgICAgLy8gZXZlbnQgc291cmNlIGFzIGFycmF5XG4gICAgICAgICAgICBhcnJheVNvdXJjZXMucHVzaChzb3VyY2UpO1xuICAgICAgICAgIH0gZWxzZSBpZihhbmd1bGFyLmlzT2JqZWN0KHNvdXJjZSkgJiYgYW5ndWxhci5pc0FycmF5KHNvdXJjZS5ldmVudHMpKXtcbiAgICAgICAgICAgIC8vIGV2ZW50IHNvdXJjZSBhcyBvYmplY3QsIGllIGV4dGVuZGVkIGZvcm1cbiAgICAgICAgICAgIHZhciBleHRFdmVudCA9IHt9O1xuICAgICAgICAgICAgZm9yKHZhciBrZXkgaW4gc291cmNlKXtcbiAgICAgICAgICAgICAgaWYoa2V5ICE9PSAnX3VpQ2FsSWQnICYmIGtleSAhPT0gJ2V2ZW50cycpe1xuICAgICAgICAgICAgICAgICBleHRFdmVudFtrZXldID0gc291cmNlW2tleV07XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGZvcih2YXIgZUkgPSAwO2VJIDwgc291cmNlLmV2ZW50cy5sZW5ndGg7ZUkrKyl7XG4gICAgICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKHNvdXJjZS5ldmVudHNbZUldLGV4dEV2ZW50KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGFycmF5U291cmNlcy5wdXNoKHNvdXJjZS5ldmVudHMpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBBcnJheS5wcm90b3R5cGUuY29uY2F0LmFwcGx5KFtdLCBhcnJheVNvdXJjZXMpO1xuICAgICAgfTtcblxuICAgICAgLy8gVHJhY2sgY2hhbmdlcyBpbiBhcnJheSBieSBhc3NpZ25pbmcgaWQgdG9rZW5zIHRvIGVhY2ggZWxlbWVudCBhbmQgd2F0Y2hpbmcgdGhlIHNjb3BlIGZvciBjaGFuZ2VzIGluIHRob3NlIHRva2Vuc1xuICAgICAgLy8gYXJndW1lbnRzOlxuICAgICAgLy8gIGFycmF5U291cmNlIGFycmF5IG9mIGZ1bmN0aW9uIHRoYXQgcmV0dXJucyBhcnJheSBvZiBvYmplY3RzIHRvIHdhdGNoXG4gICAgICAvLyAgdG9rZW5GbiBmdW5jdGlvbihvYmplY3QpIHRoYXQgcmV0dXJucyB0aGUgdG9rZW4gZm9yIGEgZ2l2ZW4gb2JqZWN0XG4gICAgICB0aGlzLmNoYW5nZVdhdGNoZXIgPSBmdW5jdGlvbihhcnJheVNvdXJjZSwgdG9rZW5Gbikge1xuICAgICAgICB2YXIgc2VsZjtcbiAgICAgICAgdmFyIGdldFRva2VucyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgIHZhciBhcnJheSA9IGFuZ3VsYXIuaXNGdW5jdGlvbihhcnJheVNvdXJjZSkgPyBhcnJheVNvdXJjZSgpIDogYXJyYXlTb3VyY2U7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCB0b2tlbiwgZWw7XG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIG4gPSBhcnJheS5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGVsID0gYXJyYXlbaV07XG4gICAgICAgICAgICB0b2tlbiA9IHRva2VuRm4oZWwpO1xuICAgICAgICAgICAgbWFwW3Rva2VuXSA9IGVsO1xuICAgICAgICAgICAgcmVzdWx0LnB1c2godG9rZW4pO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuICAgICAgICAvLyByZXR1cm5zIGVsZW1lbnRzIGluIHRoYXQgYXJlIGluIGEgYnV0IG5vdCBpbiBiXG4gICAgICAgIC8vIHN1YnRyYWN0QXNTZXRzKFs0LCA1LCA2XSwgWzQsIDUsIDddKSA9PiBbNl1cbiAgICAgICAgdmFyIHN1YnRyYWN0QXNTZXRzID0gZnVuY3Rpb24oYSwgYikge1xuICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgaW5CID0ge30sIGksIG47XG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IGIubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBpbkJbYltpXV0gPSB0cnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYS5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGlmICghaW5CW2FbaV1dKSB7XG4gICAgICAgICAgICAgIHJlc3VsdC5wdXNoKGFbaV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9O1xuXG4gICAgICAgIC8vIE1hcCBvYmplY3RzIHRvIHRva2VucyBhbmQgdmljZS12ZXJzYVxuICAgICAgICB2YXIgbWFwID0ge307XG5cbiAgICAgICAgdmFyIGFwcGx5Q2hhbmdlcyA9IGZ1bmN0aW9uKG5ld1Rva2Vucywgb2xkVG9rZW5zKSB7XG4gICAgICAgICAgdmFyIGksIG4sIGVsLCB0b2tlbjtcbiAgICAgICAgICB2YXIgcmVwbGFjZWRUb2tlbnMgPSB7fTtcbiAgICAgICAgICB2YXIgcmVtb3ZlZFRva2VucyA9IHN1YnRyYWN0QXNTZXRzKG9sZFRva2VucywgbmV3VG9rZW5zKTtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gcmVtb3ZlZFRva2Vucy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHZhciByZW1vdmVkVG9rZW4gPSByZW1vdmVkVG9rZW5zW2ldO1xuICAgICAgICAgICAgZWwgPSBtYXBbcmVtb3ZlZFRva2VuXTtcbiAgICAgICAgICAgIGRlbGV0ZSBtYXBbcmVtb3ZlZFRva2VuXTtcbiAgICAgICAgICAgIHZhciBuZXdUb2tlbiA9IHRva2VuRm4oZWwpO1xuICAgICAgICAgICAgLy8gaWYgdGhlIGVsZW1lbnQgd2Fzbid0IHJlbW92ZWQgYnV0IHNpbXBseSBnb3QgYSBuZXcgdG9rZW4sIGl0cyBvbGQgdG9rZW4gd2lsbCBiZSBkaWZmZXJlbnQgZnJvbSB0aGUgY3VycmVudCBvbmVcbiAgICAgICAgICAgIGlmIChuZXdUb2tlbiA9PT0gcmVtb3ZlZFRva2VuKSB7XG4gICAgICAgICAgICAgIHNlbGYub25SZW1vdmVkKGVsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgIHJlcGxhY2VkVG9rZW5zW25ld1Rva2VuXSA9IHJlbW92ZWRUb2tlbjtcbiAgICAgICAgICAgICAgc2VsZi5vbkNoYW5nZWQoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cblxuICAgICAgICAgIHZhciBhZGRlZFRva2VucyA9IHN1YnRyYWN0QXNTZXRzKG5ld1Rva2Vucywgb2xkVG9rZW5zKTtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYWRkZWRUb2tlbnMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICB0b2tlbiA9IGFkZGVkVG9rZW5zW2ldO1xuICAgICAgICAgICAgZWwgPSBtYXBbdG9rZW5dO1xuICAgICAgICAgICAgaWYgKCFyZXBsYWNlZFRva2Vuc1t0b2tlbl0pIHtcbiAgICAgICAgICAgICAgc2VsZi5vbkFkZGVkKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHNlbGYgPSB7XG4gICAgICAgICAgc3Vic2NyaWJlOiBmdW5jdGlvbihzY29wZSwgb25DaGFuZ2VkKSB7XG4gICAgICAgICAgICBzY29wZS4kd2F0Y2goZ2V0VG9rZW5zLCBmdW5jdGlvbihuZXdUb2tlbnMsIG9sZFRva2Vucykge1xuICAgICAgICAgICAgICBpZiAoIW9uQ2hhbmdlZCB8fCBvbkNoYW5nZWQobmV3VG9rZW5zLCBvbGRUb2tlbnMpICE9PSBmYWxzZSkge1xuICAgICAgICAgICAgICAgIGFwcGx5Q2hhbmdlcyhuZXdUb2tlbnMsIG9sZFRva2Vucyk7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIHRydWUpO1xuICAgICAgICAgIH0sXG4gICAgICAgICAgb25BZGRlZDogYW5ndWxhci5ub29wLFxuICAgICAgICAgIG9uQ2hhbmdlZDogYW5ndWxhci5ub29wLFxuICAgICAgICAgIG9uUmVtb3ZlZDogYW5ndWxhci5ub29wXG4gICAgICAgIH07XG4gICAgICAgIHJldHVybiBzZWxmO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5nZXRGdWxsQ2FsZW5kYXJDb25maWcgPSBmdW5jdGlvbihjYWxlbmRhclNldHRpbmdzLCB1aUNhbGVuZGFyQ29uZmlnKXtcbiAgICAgICAgICB2YXIgY29uZmlnID0ge307XG5cbiAgICAgICAgICBhbmd1bGFyLmV4dGVuZChjb25maWcsIHVpQ2FsZW5kYXJDb25maWcpO1xuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgY2FsZW5kYXJTZXR0aW5ncyk7XG4gICAgICAgICBcbiAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY29uZmlnLCBmdW5jdGlvbih2YWx1ZSxrZXkpe1xuICAgICAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gJ2Z1bmN0aW9uJyl7XG4gICAgICAgICAgICAgIGNvbmZpZ1trZXldID0gd3JhcEZ1bmN0aW9uV2l0aFNjb3BlQXBwbHkoY29uZmlnW2tleV0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgIH07XG5cbiAgICB0aGlzLmdldExvY2FsZUNvbmZpZyA9IGZ1bmN0aW9uKGZ1bGxDYWxlbmRhckNvbmZpZykge1xuICAgICAgaWYgKCFmdWxsQ2FsZW5kYXJDb25maWcubGFuZyB8fCBmdWxsQ2FsZW5kYXJDb25maWcudXNlTmdMb2NhbGUpIHtcbiAgICAgICAgLy8gQ29uZmlndXJlIHRvIHVzZSBsb2NhbGUgbmFtZXMgYnkgZGVmYXVsdFxuICAgICAgICB2YXIgdFZhbHVlcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAvLyBjb252ZXJ0IHswOiBcIkphblwiLCAxOiBcIkZlYlwiLCAuLi59IHRvIFtcIkphblwiLCBcIkZlYlwiLCAuLi5dXG4gICAgICAgICAgdmFyIHIsIGs7XG4gICAgICAgICAgciA9IFtdO1xuICAgICAgICAgIGZvciAoayBpbiBkYXRhKSB7XG4gICAgICAgICAgICByW2tdID0gZGF0YVtrXTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHI7XG4gICAgICAgIH07XG4gICAgICAgIHZhciBkdGYgPSAkbG9jYWxlLkRBVEVUSU1FX0ZPUk1BVFM7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgbW9udGhOYW1lczogdFZhbHVlcyhkdGYuTU9OVEgpLFxuICAgICAgICAgIG1vbnRoTmFtZXNTaG9ydDogdFZhbHVlcyhkdGYuU0hPUlRNT05USCksXG4gICAgICAgICAgZGF5TmFtZXM6IHRWYWx1ZXMoZHRmLkRBWSksXG4gICAgICAgICAgZGF5TmFtZXNTaG9ydDogdFZhbHVlcyhkdGYuU0hPUlREQVkpXG4gICAgICAgIH07XG4gICAgICB9XG4gICAgICByZXR1cm4ge307XG4gICAgfTtcbiAgfV0pXG4gIC5kaXJlY3RpdmUoJ3VpQ2FsZW5kYXInLCBbJ3VpQ2FsZW5kYXJDb25maWcnLCBmdW5jdGlvbih1aUNhbGVuZGFyQ29uZmlnKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgIHJlc3RyaWN0OiAnQScsXG4gICAgICBzY29wZToge2V2ZW50U291cmNlczonPW5nTW9kZWwnLGNhbGVuZGFyV2F0Y2hFdmVudDogJyYnfSxcbiAgICAgIGNvbnRyb2xsZXI6ICd1aUNhbGVuZGFyQ3RybCcsXG4gICAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxtLCBhdHRycywgY29udHJvbGxlcikge1xuXG4gICAgICAgIHZhciBzb3VyY2VzID0gc2NvcGUuZXZlbnRTb3VyY2VzLFxuICAgICAgICAgICAgc291cmNlc0NoYW5nZWQgPSBmYWxzZSxcbiAgICAgICAgICAgIGV2ZW50U291cmNlc1dhdGNoZXIgPSBjb250cm9sbGVyLmNoYW5nZVdhdGNoZXIoc291cmNlcywgY29udHJvbGxlci5zb3VyY2VzRmluZ2VycHJpbnQpLFxuICAgICAgICAgICAgZXZlbnRzV2F0Y2hlciA9IGNvbnRyb2xsZXIuY2hhbmdlV2F0Y2hlcihjb250cm9sbGVyLmFsbEV2ZW50cywgY29udHJvbGxlci5ldmVudHNGaW5nZXJwcmludCksXG4gICAgICAgICAgICBvcHRpb25zID0gbnVsbDtcblxuICAgICAgICBmdW5jdGlvbiBnZXRPcHRpb25zKCl7XG4gICAgICAgICAgdmFyIGNhbGVuZGFyU2V0dGluZ3MgPSBhdHRycy51aUNhbGVuZGFyID8gc2NvcGUuJHBhcmVudC4kZXZhbChhdHRycy51aUNhbGVuZGFyKSA6IHt9LFxuICAgICAgICAgICAgICBmdWxsQ2FsZW5kYXJDb25maWc7XG5cbiAgICAgICAgICBmdWxsQ2FsZW5kYXJDb25maWcgPSBjb250cm9sbGVyLmdldEZ1bGxDYWxlbmRhckNvbmZpZyhjYWxlbmRhclNldHRpbmdzLCB1aUNhbGVuZGFyQ29uZmlnKTtcblxuICAgICAgICAgIHZhciBsb2NhbGVGdWxsQ2FsZW5kYXJDb25maWcgPSBjb250cm9sbGVyLmdldExvY2FsZUNvbmZpZyhmdWxsQ2FsZW5kYXJDb25maWcpO1xuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGxvY2FsZUZ1bGxDYWxlbmRhckNvbmZpZywgZnVsbENhbGVuZGFyQ29uZmlnKTtcblxuICAgICAgICAgIG9wdGlvbnMgPSB7IGV2ZW50U291cmNlczogc291cmNlcyB9O1xuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKG9wdGlvbnMsIGxvY2FsZUZ1bGxDYWxlbmRhckNvbmZpZyk7XG5cbiAgICAgICAgICB2YXIgb3B0aW9uczIgPSB7fTtcbiAgICAgICAgICBmb3IodmFyIG8gaW4gb3B0aW9ucyl7XG4gICAgICAgICAgICBpZihvICE9PSAnZXZlbnRTb3VyY2VzJyl7XG4gICAgICAgICAgICAgIG9wdGlvbnMyW29dID0gb3B0aW9uc1tvXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIEpTT04uc3RyaW5naWZ5KG9wdGlvbnMyKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHNjb3BlLmRlc3Ryb3kgPSBmdW5jdGlvbigpe1xuICAgICAgICAgIGlmKHNjb3BlLmNhbGVuZGFyICYmIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcil7XG4gICAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ2Rlc3Ryb3knKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYoYXR0cnMuY2FsZW5kYXIpIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyID0gc2NvcGUuJHBhcmVudFthdHRycy5jYWxlbmRhcl0gPSAgJChlbG0pLmh0bWwoJycpO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzY29wZS5jYWxlbmRhciA9ICQoZWxtKS5odG1sKCcnKTtcbiAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgc2NvcGUuaW5pdCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKG9wdGlvbnMpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50U291cmNlc1dhdGNoZXIub25BZGRlZCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgICAgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKCdhZGRFdmVudFNvdXJjZScsIHNvdXJjZSk7XG4gICAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlci5vblJlbW92ZWQgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ3JlbW92ZUV2ZW50U291cmNlJywgc291cmNlKTtcbiAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IHRydWU7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRzV2F0Y2hlci5vbkFkZGVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ3JlbmRlckV2ZW50JywgZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50c1dhdGNoZXIub25SZW1vdmVkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ3JlbW92ZUV2ZW50cycsIGZ1bmN0aW9uKGUpIHsgXG4gICAgICAgICAgICByZXR1cm4gZS5faWQgPT09IGV2ZW50Ll9pZDtcbiAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudHNXYXRjaGVyLm9uQ2hhbmdlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgZXZlbnQuX3N0YXJ0ID0gJC5mdWxsQ2FsZW5kYXIubW9tZW50KGV2ZW50LnN0YXJ0KTtcbiAgICAgICAgICBldmVudC5fZW5kID0gJC5mdWxsQ2FsZW5kYXIubW9tZW50KGV2ZW50LmVuZCk7XG4gICAgICAgICAgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKCd1cGRhdGVFdmVudCcsIGV2ZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudFNvdXJjZXNXYXRjaGVyLnN1YnNjcmliZShzY29wZSk7XG4gICAgICAgIGV2ZW50c1dhdGNoZXIuc3Vic2NyaWJlKHNjb3BlLCBmdW5jdGlvbihuZXdUb2tlbnMsIG9sZFRva2Vucykge1xuICAgICAgICAgIGlmIChzb3VyY2VzQ2hhbmdlZCA9PT0gdHJ1ZSkge1xuICAgICAgICAgICAgc291cmNlc0NoYW5nZWQgPSBmYWxzZTtcbiAgICAgICAgICAgIC8vIHByZXZlbnQgaW5jcmVtZW50YWwgdXBkYXRlcyBpbiB0aGlzIGNhc2VcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIHNjb3BlLiR3YXRjaChnZXRPcHRpb25zLCBmdW5jdGlvbihuZXdPLG9sZE8pe1xuICAgICAgICAgICAgc2NvcGUuZGVzdHJveSgpO1xuICAgICAgICAgICAgc2NvcGUuaW5pdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xufV0pOyIsImFwcC5kaXJlY3RpdmUoJ25nRW50ZXInLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGVsZW1lbnQuYmluZChcImtleWRvd24ga2V5cHJlc3NcIiwgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGlmKCFldmVudC5hbHRLZXkgJiYgIWV2ZW50LnNoaWZ0S2V5ICYmICFldmVudC5jdHJsS2V5ICYmIGV2ZW50LndoaWNoID09PSAxMykge1xuICAgICAgICAgICAgICAgIHNjb3BlLiRhcHBseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBzY29wZS4kZXZhbChhdHRycy5uZ0VudGVyLCB7J2V2ZW50JzogZXZlbnR9KTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCduZ0luZmluaXRlU2Nyb2xsJywgZnVuY3Rpb24oJHdpbmRvdykge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgYW5ndWxhci5lbGVtZW50KCR3aW5kb3cpLmJpbmQoXCJzY3JvbGxcIiwgZnVuY3Rpb24oKSB7XG5cdFx0ICAgIHZhciB3aW5kb3dIZWlnaHQgXHQ9IFwiaW5uZXJIZWlnaHRcIiBpbiB3aW5kb3cgPyB3aW5kb3cuaW5uZXJIZWlnaHQgOiBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQub2Zmc2V0SGVpZ2h0O1xuXHRcdCAgICB2YXIgYm9keSBcdFx0XHQ9IGRvY3VtZW50LmJvZHksIGh0bWwgPSBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQ7XG5cdFx0ICAgIHZhciBkb2NIZWlnaHQgXHRcdD0gTWF0aC5tYXgoYm9keS5zY3JvbGxIZWlnaHQsIGJvZHkub2Zmc2V0SGVpZ2h0LCBodG1sLmNsaWVudEhlaWdodCwgIGh0bWwuc2Nyb2xsSGVpZ2h0LCBodG1sLm9mZnNldEhlaWdodCk7XG5cdFx0ICAgIHdpbmRvd0JvdHRvbSBcdFx0PSB3aW5kb3dIZWlnaHQgKyB3aW5kb3cucGFnZVlPZmZzZXQ7XG5cdFx0ICAgIFxuXHRcdCAgICBpZiAod2luZG93Qm90dG9tID49IGRvY0hlaWdodCkge1xuXHRcdFx0ICAgIC8vIEluc2VydCBsb2FkZXIgY29kZSBoZXJlLlxuXHRcdFx0ICAgIHNjb3BlLm9mZnNldCA9IHNjb3BlLm9mZnNldCArIHNjb3BlLmxpbWl0O1xuXHRcdCAgICAgICAgc2NvcGUubG9hZCgpO1xuXHRcdCAgICB9XG5cdFx0fSk7XG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ3N0cmluZ1RvTnVtYmVyJywgZnVuY3Rpb24oKSB7XG4gIHJldHVybiB7XG4gICAgcmVxdWlyZTogJ25nTW9kZWwnLFxuICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycywgbmdNb2RlbCkge1xuICAgICAgbmdNb2RlbC4kcGFyc2Vycy5wdXNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiAnJyArIHZhbHVlO1xuICAgICAgfSk7XG4gICAgICBuZ01vZGVsLiRmb3JtYXR0ZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuIHBhcnNlRmxvYXQodmFsdWUsIDEwKTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfTtcbn0pOyIsImFwcC5maWx0ZXIoJ2N1dFN0cmluZycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24gKHZhbHVlLCB3b3Jkd2lzZSwgbWF4LCB0YWlsKSB7XG4gICAgICAgIGlmICghdmFsdWUpIHJldHVybiAnJztcblxuICAgICAgICBtYXggPSBwYXJzZUludChtYXgsIDEwKTtcbiAgICAgICAgaWYgKCFtYXgpIHJldHVybiB2YWx1ZTtcbiAgICAgICAgaWYgKHZhbHVlLmxlbmd0aCA8PSBtYXgpIHJldHVybiB2YWx1ZTtcblxuICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cigwLCBtYXgpO1xuICAgICAgICBpZiAod29yZHdpc2UpIHtcbiAgICAgICAgICAgIHZhciBsYXN0c3BhY2UgPSB2YWx1ZS5sYXN0SW5kZXhPZignICcpO1xuICAgICAgICAgICAgaWYgKGxhc3RzcGFjZSAhPSAtMSkge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyKDAsIGxhc3RzcGFjZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdmFsdWUgKyAodGFpbCB8fCAn4oCmJyk7XG4gICAgfTtcbn0pO1xuIiwiYXBwLmZpbHRlcignZGF0ZVRvSVNPJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIGlmKGlucHV0ICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgdmFyIGEgPSBpbnB1dC5zcGxpdCgvW14wLTldLyk7XG4gICAgICAgICAgICB2YXIgZD1uZXcgRGF0ZSAoYVswXSxhWzFdLTEsYVsyXSxhWzNdLGFbNF0sYVs1XSApO1xuICAgICAgICAgICAgcmV0dXJuIG5ldyBEYXRlKGQpLnRvSVNPU3RyaW5nKCk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcignaXNFbXB0eScsIFtmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBhbmd1bGFyLmVxdWFscyh7fSwgb2JqZWN0KTtcbiAgICB9O1xufV0pOyIsImFwcC5maWx0ZXIoJ251bScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcigncmFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXQsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgc3RhcnQgPSBwYXJzZUludChzdGFydCk7XG4gICAgICAgIGVuZCA9IHBhcnNlSW50KGVuZCk7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBpZihzdGFydCA8IGVuZCl7XG4gICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk8ZW5kOyBpKyspXG4gICAgICAgICAgICAgICAgaW5wdXQucHVzaChpKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk+ZW5kOyBpLS0pXG4gICAgICAgICAgICAgICAgaW5wdXQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcbn0pOyIsImFwcC5maWx0ZXIoJ3JlbmRlckhUTUxDb3JyZWN0bHknLCBmdW5jdGlvbigkc2NlKVxue1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmdUb1BhcnNlKVxuICAgIHtcbiAgICAgICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwoc3RyaW5nVG9QYXJzZSk7XG4gICAgfTtcbn0pO1xuIiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluJywge1xuICAgICAgICB1cmw6ICcvYWRtaW4nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5kYXNoYm9hcmQnLCB7XG4gICAgICAgIHVybDogJy9kYXNoYm9hcmQnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmRhc2hib2FyZCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluRGFzaGJvYXJkQ29udHJvbGxlciBhcyBkYXNoYm9hcmQnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2VycycsIHtcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi51c2Vycy5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluVXNlcnNDb250cm9sbGVyIGFzIHVzZXJzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMnLCB7XG4gICAgICAgIHVybDogJy9jbHVicycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pbkNsdWJzQ29udHJvbGxlciBhcyBjbHVicydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93Jywge1xuICAgICAgICB1cmw6ICcvOmlkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5zaG93JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5DbHViQ29udHJvbGxlciBhcyBjbHVicydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93LnVzZXJzJywge1xuICAgICAgICB1cmw6ICcvdXNlcnMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMudXNlcnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy5hZG1pbnMnLCB7XG4gICAgICAgIHVybDogJy9hZG1pbnMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuYWRtaW5zJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzLnNob3cubWVyZ2UnLCB7XG4gICAgICAgIHVybDogJy9tZXJnZScsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5tZXJnZSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuLy9cdCRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcblxuXHQvLyBBdXRoLlxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aCcsIHtcblx0XHR1cmw6ICcvYXV0aCcsXG5cdFx0cGFyZW50OiAncHVibGljJyxcblx0XHRhYnN0cmFjdDogdHJ1ZSxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9pbmRleCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdBdXRoQ29udHJvbGxlcidcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHQkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgnLCAnL2F1dGgvbG9naW4nKTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgucmVnaXN0ZXInLCB7XG5cdFx0dXJsOiAnL3JlZ2lzdGVyJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9yZWdpc3Rlcidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmludml0ZScsIHtcblx0XHR1cmw6ICcvcmVnaXN0ZXIvOmludml0ZV90b2tlbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcmVnaXN0ZXInLFxuXHRcdGNvbnRyb2xsZXI6ICdBdXRoQ29udHJvbGxlcidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmluYWN0aXZlJywge1xuXHRcdHVybDogJy9pbmFjdGl2ZScsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvaW5hY3RpdmUnXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5hY3RpdmF0ZScsIHtcblx0XHR1cmw6ICcvYWN0aXZhdGUvOnRva2VuJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9hY3RpdmF0ZScsXG5cdFx0Y29udHJvbGxlcjogJ0FjdGl2YXRpb25Db250cm9sbGVyJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgubG9naW4nLCB7XG5cdFx0dXJsOiAnL2xvZ2luJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9sb2dpbidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLnBhc3N3b3JkJywge1xuXHRcdHVybDogJy9wYXNzd29yZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcGFzc3dvcmQnXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5yZXNldCcsIHtcblx0XHR1cmw6ICcvcmVzZXQvOnRva2VuJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9yZXNldCcsXG5cdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEF1dGhGYWN0b3J5KXtcblx0XHRcdCRzY29wZS5yZXNldCA9IHtlbWFpbDogJycsIHRva2VuOiAkc3RhdGVQYXJhbXMudG9rZW59O1xuXG5cdFx0XHQkc2NvcGUucmVzZXRQYXNzd29yZCA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblxuXHRcdFx0XHRBdXRoRmFjdG9yeVxuXHRcdFx0XHRcdC5yZXNldFBhc3N3b3JkKCRzY29wZS5yZXNldClcblx0XHRcdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0XHQkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJlc2V0ID0ge2VtYWlsOiAnJywgdG9rZW46ICRzdGF0ZVBhcmFtcy50b2tlbn07XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHRcdFx0XHQkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHRcdGlmKHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnc3VjY2VzcycpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmxvZ291dCcsIHtcblx0XHR1cmw6ICcvbG9nb3V0Jyxcblx0XHRjb250cm9sbGVyOiBmdW5jdGlvbihBdXRoRmFjdG9yeSl7XG5cdFx0XHRBdXRoRmFjdG9yeS5sb2dvdXQoKTtcblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjaGFtcGlvbnNoaXBzJywge1xuXHRcdHVybDogJy9jaGFtcGlvbnNoaXBzJyxcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHR2aWV3czp7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNoYW1waW9uc2hpcHMuaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ2hhbXBpb25zaGlwc0NvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdjaGFtcGlvbnNoaXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoYW1waW9uc2hpcCcsIHtcblx0XHR1cmw6ICcvY2hhbXBpb25zaGlwLzppZCcsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2hhbXBpb25zaGlwcy5zaG93Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NoYW1waW9uc2hpcENvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdjaGFtcGlvbnNoaXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoYW1waW9uc2hpcC5zaG93Jywge1xuXHRcdHVybDogJy86dmlldycsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdtYWluJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogZnVuY3Rpb24oJHN0YXRlUGFyYW1zKXtcblx0XHRcdFx0XHRyZXR1cm4gJy92aWV3cy9wYXJ0aWFscy5jaGFtcGlvbnNoaXBzLnNob3cuJyskc3RhdGVQYXJhbXMudmlldztcblx0XHRcdFx0fSxcblx0XHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmN1cnJlbnRWaWV3ID0gJHN0YXRlUGFyYW1zLnZpZXc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1YicsIHtcbiAgICAgICAgdXJsOiAnL2NsdWInLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NsdWJDb250cm9sbGVyIGFzIGNsdWInXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLmNvbm5lY3QnLCB7XG4gICAgICAgIHVybDogJy9jbHViL2Nvbm5lY3QnLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybCA6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5jb25uZWN0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1YkNvbm5lY3RDb250cm9sbGVyIGFzIGNsdWInXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLmluZm9ybWF0aW9uJywge1xuICAgICAgICB1cmw6ICcvaW5mb3JtYXRpb24nLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLmluZm9ybWF0aW9uJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1YkNvbnRyb2xsZXIgYXMgY2x1YidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuZWRpdCcsIHtcbiAgICAgICAgdXJsOiAnL2VkaXQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLmVkaXQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViQ29udHJvbGxlciBhcyBjbHViJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5hZG1pbnMnLCB7XG4gICAgICAgIHVybDogJy9hZG1pbnMnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLmFkbWlucycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnByZW1pdW0nLCB7XG4gICAgICAgIHVybDogJy9wcmVtaXVtJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIucHJlbWl1bScsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ1ByZW1pdW1Db250cm9sbGVyIGFzIHByZW1pdW0nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnVzZXJzJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnVzZXJzLmluZGV4Jywge1xuICAgICAgICB1cmw6ICcnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW5AY2x1Yic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLnVzZXJzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1YkNvbnRyb2xsZXIgYXMgY2x1YidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIudXNlcnMuY3JlYXRlJywge1xuICAgICAgICB1cmw6ICcvY3JlYXRlJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi51c2Vycy5jcmVhdGUnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdVc2VyQ29udHJvbGxlciBhcyB1c2VyJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi51c2Vycy5lZGl0Jywge1xuICAgICAgICB1cmw6ICcvOnVzZXJfaWQvZWRpdCcsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIudXNlcnMuZWRpdCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ1VzZXJDb250cm9sbGVyIGFzIHVzZXInXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnBheW1lbnRzJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdXJsOiAnL3BheW1lbnRzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnBheW1lbnRzLmluZGV4Jywge1xuICAgICAgICB1cmw6ICcnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW5AY2x1Yic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLnBheW1lbnRzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnUGF5bWVudHNDb250cm9sbGVyIGFzIHBheW1lbnRzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9ucycsIHtcblx0XHR1cmw6ICcvY29tcGV0aXRpb25zP3BhZ2Umc29ydCcsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6e1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25zQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ2NvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHBhcmFtczoge1xuXHRcdFx0cGFnZToge1xuXHRcdFx0XHR2YWx1ZTogJzAnLFxuXHRcdFx0XHRzcXVhc2g6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRzb3J0OiB7XG5cdFx0XHRcdHZhbHVlOiAnZGF0ZScsXG5cdFx0XHRcdHNxdWFzaDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uJywge1xuXHRcdHVybDogJy9jb21wZXRpdGlvbi86aWQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NvbXBldGl0aW9uQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ2NvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbi5jbHVic2lnbnVwcycsIHtcblx0XHR1cmw6ICcvY2x1YnNpZ251cHMnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnbWFpbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cuY2x1YnNpZ251cHMnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ2x1YlNpZ251cENvbnRyb2xsZXIgYXMgY2x1YnNpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLCB7XG5cdFx0dXJsOiAnL3RlYW1zaWdudXBzJyxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnRlYW1zaWdudXBzLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1RlYW1TaWdudXBDb250cm9sbGVyIGFzIHRlYW1zaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmNyZWF0ZScsIHtcblx0XHR1cmw6ICcvY3JlYXRlJyxcblx0XHR2aWV3czoge1xuXHRcdFx0Jyc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cudGVhbXNpZ251cHMuY3JlYXRlJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmVkaXQnLCB7XG5cdFx0dXJsOiAnLzp0ZWFtc19pZCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCcnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnRlYW1zaWdudXBzLmVkaXQnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnVGVhbVNpZ251cENvbnRyb2xsZXIgYXMgdGVhbXNpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24uc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAnLFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWUsXG5cdFx0dmlld3M6e1xuXHRcdFx0J21haW4nOntcblx0XHRcdFx0dGVtcGxhdGVVcmw6Jy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuc2hvdy5zaWdudXAnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25Db250cm9sbGVyIGFzIGNvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24uc2lnbnVwcycsIHtcblx0XHR1cmw6ICcvc2lnbnVwcycsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czp7XG5cdFx0XHQnbWFpbic6e1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDonL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnNpZ251cHMnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25Db250cm9sbGVyIGFzIGNvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnNob3cnLCB7XG5cdFx0dXJsOiAnLzp2aWV3Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiBmdW5jdGlvbigkc3RhdGVQYXJhbXMpe1xuXHRcdFx0XHRcdHJldHVybiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LicrJHN0YXRlUGFyYW1zLnZpZXc7XG5cblx0XHRcdFx0fSxcblx0XHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmN1cnJlbnRWaWV3ID0gJHN0YXRlUGFyYW1zLnZpZXc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJlbWl1bScsIHtcbiAgICAgICAgdXJsOiAnL3ByZW1pdW0nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5wcmVtaXVtLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnUHJlbWl1bUNvbnRyb2xsZXIgYXMgcHJlbWl1bSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2NvbXBldGl0aW9ucycpO1xuXG4gICAgaWYobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSlcbiAgICB7XG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9jb21wZXRpdGlvbnMnKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2F1dGgvcmVnaXN0ZXInKTtcbiAgICB9XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHZpZXdzOntcbiAgICAgICAgICAgICduYXZpZ2F0aW9uQCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5uYXZpZ2F0aW9uJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHVibGljJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdmlld3M6e1xuICAgICAgICAgICAgJ25hdmlnYXRpb25AJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL25hdmlnYXRpb24nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5kYXNoYm9hcmQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncycsIHtcbiAgICAgICAgdXJsOiAnL3NldHRpbmdzJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnU2V0dGluZ3NDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdzZXR0aW5ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLmluZGV4Jywge1xuICAgICAgICB1cmw6Jy8nLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOiB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHN0YXRlKXtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzZXR0aW5ncy51c2VyJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MudXNlcicsIHtcbiAgICAgICAgdXJsOiAnL3VzZXInLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy51c2VyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlVzZXJQcm9maWxlQ29udHJvbGxlciBhcyB1c2VycHJvZmlsZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5lZGl0cHJvZmlsZScsIHtcbiAgICAgICAgdXJsOiAnL2VkaXRwcm9maWxlJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdzZXR0aW5nJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLnVzZXJlZGl0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlVzZXJQcm9maWxlQ29udHJvbGxlciBhcyB1c2VycHJvZmlsZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5jYW5jZWxhY2NvdW50Jywge1xuICAgICAgICB1cmw6ICcvY2FuY2VsYWNjb3VudCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnc2V0dGluZyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy5jYW5jZWxhY2NvdW50J1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5wYXNzd29yZCcsIHtcbiAgICAgICAgdXJsOiAnL3Bhc3N3b3JkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdzZXR0aW5nJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MucGFzc3dvcmQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiUGFzc3dvcmRDb250cm9sbGVyIGFzIHBhc3N3b3JkXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuICAgIFxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5pbnZpdGUnLCB7XG4gICAgICAgIHVybDogJy9pbnZpdGUnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy5pbnZpdGUnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiSW52aXRlQ29udHJvbGxlciBhcyBpbnZpdGVcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXBzJywge1xuXHRcdHVybDogJy9zaWdudXBzJyxcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHR2aWV3czp7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNpZ251cHMuaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnU2lnbnVwc0NvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdzaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cCcsIHtcblx0XHR1cmw6ICcvc2lnbnVwLzppZCcsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2lnbnVwcy5zaG93Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1NpZ251cENvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdzaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwLmVkaXQnLCB7XG5cdFx0dXJsOiAnL2VkaXQnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNpZ251cHMuZWRpdCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
