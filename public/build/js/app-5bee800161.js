var app = angular.module('app',
	[
		'angular-jwt',
		'ui.router',
		'app.auth',
		'app.errorhandler',
		'ui.calendar',
		'ui.bootstrap',
		'ui.bootstrap.datetimepicker',
		'ui.sortable',
		'ngAnimate',
		'app.settings',
		'app.dashboard',
		'app.competitions',
		'app.championships',
		'app.signups',
		'app.users',
		'app.clubs',
		'app.calendar',
		'app.premium',
		'app.teams',
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
						if(response.message) $rootScope.displayFlashMessages([response.data.message], 'warning');
					} else if(response.data){
						if(response.data.message) $rootScope.displayFlashMessages([response.data.message], 'warning');
					}
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
        $scope.verifyToken = function() {
            AuthFactory.activate($scope.activate)
                .success(function(response){
                    $scope.activated = true;
                    $timeout(function() {
                        if($rootScope.authenticated){
                            $state.go('dashboard', {}, {location: 'replace'});
                        } else {
                            $state.go('auth.login', {}, {location:'replace'});
                        }
                    }, 3000);
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
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

	self.searchQuery = '';
	self.selectedclub = {};
	self.new_club = null;
	self.add_clubs_nr = '';
	self.changeClub = false;
	self.add_admin = null;

	function loadUserClub() {
		ClubsFactory.loadUserClub()
			.success(function(response){
				self.selectedClubs = '';
				self.club = response;
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

.controller("AdminClubsController", ["$rootScope", "$stateParams", "$state", "ClubsFactory", function($rootScope, $stateParams, $state, ClubsFactory){
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
		ClubsFactory.load(page)
			.success(function(response){
				self.clubs = response.clubs;
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
.controller("AdminClubController", ["$rootScope", "$scope", "$stateParams", "$state", "$timeout", "ClubsFactory", function($rootScope, $scope, $stateParams, $state, $timeout, ClubsFactory) {
	var self = this;
	self.searchQuery = '';
	self.selectedclub = {};

	if(!$stateParams.id) $state.go('admin.clubs');

	function find(){
		ClubsFactory.find($stateParams.id)
			.success(function(response){
				self.club = response.club;
			})
			.error(function(){
				$state.go('admin.clubs', {}, {location:'replace'});
			});
	}

	self.updateClub = function(club){
		self.state = 'updating';
		ClubsFactory.updateClub(club)
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
		ClubsFactory.deleteClub(club)
			.success(function(response){
				$state.go('clubs');
			});
	};

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
		self.selectedclub = $item;
	};

	self.mergeClubs = function(clubsIdFrom, clubsIdTo){
		if(clubsIdFrom && clubsIdTo){
			ClubsFactory.mergeClubs(clubsIdFrom, clubsIdTo)
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
				url: ApiEndpointUrl+'clubs/'+club.id,
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
		},

		mergeClubs: function(clubsIdFrom, clubsIdTo) {
			return $http({
				method: 'POST',
				url: ApiEndpointUrl+'clubs/merge',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param({'clubsIdFrom': clubsIdFrom, 'clubsIdTo': clubsIdTo})
			});
		}
	};
}]);
angular.module('app.competitions', [])

.controller("CompetitionsController", ["$rootScope", "$scope", "$stateParams", "$state", "CompetitionsFactory", function($rootScope, $scope, $stateParams, $state, CompetitionsFactory){
    var self = this;

    function updatePage(page) {
        CompetitionsFactory.load(page)
            .success(function(response){
                self.competitions = response.competitions;
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
        CompetitionsFactory.find($stateParams.id)
            .success(function(response){
                self.competitions = response.competitions;
                self.user = JSON.parse(localStorage.getItem('user'));
            })
            .error(function(){
                $state.go('competitions', {}, {location:'replace'});
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

angular.module('app.premium', [])
.controller("PremiumController", ["$rootScope", "$scope", "$state", "ClubsFactory", function($rootScope, $scope, $state, ClubsFactory){
    var self = this;
}]);

angular.module('app.settings', [])

.controller("SettingsController", ["$rootScope", "$scope", "$state", "SettingsFactory", function($rootScope, $scope, $state, SettingsFactory) {
    var self = this;

    self.cancelaccount = function(){
        SettingsFactory.cancelaccount()
            .success(function(response){
                $rootScope.displayFlashMessages(response.message);
                $state.go('auth.logout');
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response.error);
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
        SettingsFactory.loadUserprofile()
            .success(function(response){
                self.userprofile = response.user;
            });
    }

    self.datePickerOptions = {startingDay: 1, start: {opened: false}, end: {opened: false}};

    self.saveUserprofile = function(){
        SettingsFactory.saveUserprofile(self.userprofile)
            .success(function(response){
                localStorage.setItem('user', JSON.stringify(response.user));
                self.userprofile = response.user;
                $state.go('settings.user');
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
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
        ClubsFactory.loadUserClubs()
            .success(function(response){
                self.selectedClubs = '';
                self.clubs = response.clubs;
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
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
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
        SignupsFactory.load(page)
            .success(function(response){
                self.signups = response.signups;
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
        SignupsFactory.find($stateParams.id)
            .success(function(response){
                self.signups = response.signups;
                self.user = JSON.parse(localStorage.getItem('user'));
            })
            .error(function(){
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
            }
        };
    }]);


angular.module('app.teams', [])
.controller('TeamSignupController', ["$rootScope", "$scope", "$stateParams", "$state", "CompetitionsFactory", "TeamsFactory", function($rootScope, $scope, $stateParams, $state, CompetitionsFactory, TeamsFactory){
    var self = this;

    function loadTeams() {
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

                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
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
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
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

.controller("UsersController", ["$rootScope", "$stateParams", "$state", "UsersFactory", function($rootScope, $stateParams, $state, UsersFactory){
	var self = this;

	self.filter = {
		search: '',
		active: 1
	};

	function updatePage(page) {
		UsersFactory.load(page)
			.success(function(response){
				self.users = response.users;
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

.factory('UsersFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

	return {
		load: function (page, id) {
			var url = ApiEndpointUrl+'users';

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
				url: ApiEndpointUrl+'users/'+id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
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
			$rootScope.reportError(exception, cause);
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
                        AuthFactory.logout();
                    }else if (response.data.error == 'user_is_not_admin') {
                        $rootScope.displayFlashMessages(response.data.message, 'error');
                        return state.go('dashboard');
                    }else if (response.data.error == 'api_version_update') {
                        $rootScope.displayFlashMessages(response.data.message, 'error');
                        location.reload(true);
                    }
                }

                if(response.error !== undefined){
                    if (response.error == 'user_inactive') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        return AuthFactory.logout();
                    }else if (response.error == 'user_is_not_admin') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        return $state.go('dashboard');
                    }else if (response.error == 'api_version_update') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        location.reload(true);
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
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.index',
                controller: 'AdminController',
                controllerAs: 'admin'
            }
        }
    });

    $stateProvider.state('admin.users', {
        url: '/users',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.users.index',
                controller: 'UsersController as users'
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
                controller: 'ClubController',
                controllerAs: 'club'
            }
        }
    });

    $stateProvider.state('club.information', {
        url: '/information',
        views: {
            'main':{
                templateUrl: '/views/partials.club.information',
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
        views: {
            'content@': {
                templateUrl: '/views/partials.premium.index',
                controller: 'PremiumController as premium'
            }
        }
    });
    $stateProvider.state('premium.buy', {
        url: '/buy',
        views: {
            'premium': {
                templateUrl: '/views/partials.premium.buy'
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

    $stateProvider.state('settings.user.edit', {
        url: '/edit',
        views: {
            'edit': {
                templateUrl: '/views/partials.settings.useredit'
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJtb2R1bGVzL2F1dGgubW9kdWxlLmpzIiwibW9kdWxlcy9jYWxlbmRhci5tb2R1bGUuanMiLCJtb2R1bGVzL2NoYW1waW9uc2hpcHMubW9kdWxlLmpzIiwibW9kdWxlcy9jbHVicy5tb2R1bGUuanMiLCJtb2R1bGVzL2NvbXBldGl0aW9ucy5tb2R1bGUuanMiLCJtb2R1bGVzL2Rhc2hib2FyZC5tb2R1bGUuanMiLCJtb2R1bGVzL2Vycm9yaGFuZGxpbmcubW9kdWxlLmpzIiwibW9kdWxlcy9wcmVtaXVtLm1vZHVsZS5qcyIsIm1vZHVsZXMvc2V0dGluZ3MubW9kdWxlLmpzIiwibW9kdWxlcy9zaWdudXBzLm1vZHVsZS5qcyIsIm1vZHVsZXMvdGVhbXMubW9kdWxlLmpzIiwibW9kdWxlcy91c2Vycy5tb2R1bGUuanMiLCJjb25maWcvZXJyb3JoYW5kbGluZy5jb25maWcuanMiLCJjb25maWcvaW50ZXJjZXB0b3JzLmpzIiwiZGlyZWN0aXZlcy9uZy1mdWxsY2FsZW5kYXIuanMiLCJkaXJlY3RpdmVzL25nRW50ZXIuanMiLCJkaXJlY3RpdmVzL25nSW5maW5pdGVTY3JvbGwuanMiLCJkaXJlY3RpdmVzL25nU3RyaW5nVG9OdW1iZXIuanMiLCJmaWx0ZXJzL2N1dFN0cmluZy5maWx0ZXIuanMiLCJmaWx0ZXJzL2RhdGVUb0lzby5maWx0ZXIuanMiLCJmaWx0ZXJzL2lzRW1wdHkuZmlsdGVyLmpzIiwiZmlsdGVycy9udW0uZmlsdGVyLmpzIiwiZmlsdGVycy9yYW5nZS5maWx0ZXIuanMiLCJmaWx0ZXJzL3JlbmRlckhUTUxDb3JyZWN0bHkuZmlsdGVyLmpzIiwicm91dGluZy9hZG1pbi5yb3V0aW5nLmpzIiwicm91dGluZy9hdXRoLnJvdXRpbmcuanMiLCJyb3V0aW5nL2NoYW1waW9uc2hpcHMucm91dGluZy5qcyIsInJvdXRpbmcvY2x1YnMucm91dGluZy5qcyIsInJvdXRpbmcvY29tcGV0aXRpb25zLnJvdXRpbmcuanMiLCJyb3V0aW5nL3ByZW1pdW0ucm91dGluZy5qcyIsInJvdXRpbmcvcm91dGluZy5qcyIsInJvdXRpbmcvc2V0dGluZ3Mucm91dGluZy5qcyIsInJvdXRpbmcvc2lnbnVwLnJvdXRpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQTtDQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7NkJBQ0EsU0FBQSxxQkFBQTtFQUNBLHFCQUFBLFlBQUE7RUFDQSxxQkFBQSxVQUFBOzs7QUFHQSxJQUFBLG9IQUFBLFNBQUEsWUFBQSxRQUFBLFVBQUEscUJBQUEsV0FBQSxhQUFBLFNBQUEsV0FBQTs7Q0FFQSxRQUFBLEdBQUEsVUFBQSxpQkFBQTs7Q0FFQSxXQUFBLElBQUEscUJBQUEsU0FBQSxHQUFBLElBQUE7RUFDQSxJQUFBLFFBQUEsYUFBQSxRQUFBOztFQUVBLFdBQUEsZUFBQSxHQUFBOztFQUVBLEdBQUEsVUFBQSxLQUFBO0dBQ0EsV0FBQSxnQkFBQTtHQUNBLElBQUEsT0FBQSxLQUFBLE1BQUEsYUFBQSxRQUFBO0dBQ0EsV0FBQSxjQUFBOzs7RUFHQSxHQUFBLENBQUEsR0FBQSxLQUFBLE1BQUEsS0FBQSxHQUFBLE1BQUEsV0FBQSxXQUFBLGNBQUE7R0FDQSxPQUFBLEdBQUEsYUFBQSxJQUFBLENBQUEsU0FBQTs7O0VBR0EsSUFBQSxHQUFBLFlBQUE7OztHQUdBLElBQUEsVUFBQSxNQUFBO0lBQ0EsRUFBQTtJQUNBLE9BQUEsR0FBQSxjQUFBLElBQUEsQ0FBQSxVQUFBOzs7Ozs7Ozs7R0FTQSxXQUFBLG9CQUFBO0lBQ0EsV0FBQTtJQUNBLGFBQUE7O0dBRUEsV0FBQSxvQkFBQTtJQUNBLGNBQUE7SUFDQSxZQUFBOzs7O0VBSUEsV0FBQSxlQUFBOzs7O0NBSUEsV0FBQSxJQUFBLHVCQUFBLFVBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxRQUFBLFlBQUEsVUFBQTs7Ozs7Ozs7Ozs7Q0FXQSxXQUFBLGFBQUEsU0FBQTtDQUNBOztFQUVBLFdBQUEsZ0JBQUE7RUFDQSxXQUFBLGtCQUFBOztFQUVBLEdBQUEsT0FBQSxhQUFBO0VBQ0E7R0FDQSxXQUFBLGNBQUEsS0FBQTs7O0VBR0E7R0FDQSxRQUFBLElBQUE7R0FDQSxHQUFBO0dBQ0E7SUFDQSxRQUFBLFFBQUEsVUFBQSxTQUFBLGFBQUE7S0FDQSxJQUFBLFVBQUEsQ0FBQSxPQUFBLGlCQUFBLFlBQUEsZUFBQSxhQUFBO0tBQ0EsV0FBQSxjQUFBLEtBQUE7OztJQUdBLFFBQUEsSUFBQSxXQUFBOztJQUVBLFNBQUEsVUFBQTtLQUNBLFdBQUEsZ0JBQUE7T0FDQTs7Ozs7O0NBTUEsV0FBQSx1QkFBQSxTQUFBLFVBQUE7Q0FDQTtFQUNBLFNBQUEsT0FBQSxXQUFBO0VBQ0EsV0FBQSxnQkFBQTtFQUNBLFdBQUEsa0JBQUE7O0VBRUEsR0FBQSxRQUFBLFNBQUEsV0FBQSxXQUFBLENBQUE7O0VBRUEsSUFBQSxtQkFBQSxDQUFBO0VBQ0EsSUFBQSxPQUFBLENBQUEsUUFBQSxhQUFBLGlCQUFBOztFQUVBLFFBQUEsUUFBQSxVQUFBLFNBQUEsUUFBQTs7R0FFQSxHQUFBLGlCQUFBLFFBQUEsV0FBQTtHQUNBO0lBQ0EsSUFBQSxPQUFBLENBQUEsT0FBQSxZQUFBLFlBQUEsVUFBQSxRQUFBO0lBQ0EsR0FBQSxRQUFBO0lBQ0E7S0FDQSxXQUFBLGNBQUEsS0FBQTs7O0lBR0E7S0FDQSxXQUFBLGdCQUFBLEtBQUE7Ozs7O0VBS0EsV0FBQSxvQkFBQSxTQUFBLFVBQUE7R0FDQSxXQUFBLGdCQUFBO0dBQ0EsV0FBQSxrQkFBQTtLQUNBOzs7Ozs7OztDQVFBLFdBQUEsY0FBQSxTQUFBLE9BQUE7Q0FDQTtFQUNBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7RUFDQSxHQUFBLE1BQUE7R0FDQTtLQUNBLFlBQUEsT0FBQTs7S0FFQSxLQUFBLFNBQUEsU0FBQTtLQUNBLEdBQUEsU0FBQSxRQUFBO01BQ0EsR0FBQSxTQUFBLFNBQUEs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QUFBLFVBQUE7O0lBRUEsS0FBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGNBQUEsU0FBQSxLQUFBLE1BQUEsU0FBQTtJQUNBLE9BQUEsU0FBQSxLQUFBLE1BQUEsSUFBQSxTQUFBLEtBQUE7S0FDQSxLQUFBLGtCQUFBO0tBQ0EsR0FBQSxLQUFBLE1BQUEsS0FBQSxJQUFBLEtBQUEsa0JBQUE7S0FDQSxPQUFBOzs7OztDQUtBLEtBQUEsYUFBQSxTQUFBO0NBQ0E7RUFDQSxHQUFBLE1BQUEsb0JBQUEsTUFBQSxPQUFBO0VBQ0EsS0FBQSxrQkFBQTtFQUNBLEtBQUEsV0FBQTs7O0NBR0EsS0FBQSxlQUFBO0NBQ0E7RUFDQSxLQUFBLGtCQUFBO0VBQ0EsS0FBQSxXQUFBOzs7Q0FHQSxLQUFBLGlCQUFBLFNBQUE7Q0FDQTtFQUNBLGFBQUEsZUFBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLFdBQUE7SUFDQSxLQUFBLGFBQUE7SUFDQSxLQUFBLE9BQUE7Ozs7Q0FJQSxLQUFBLGFBQUE7Q0FDQTtFQUNBLEdBQUEsQ0FBQSxLQUFBLGVBQUEsQ0FBQSxLQUFBLGNBQUEsT0FBQTtFQUNBLElBQUEsT0FBQTtHQUNBLE1BQUEsS0FBQTtHQUNBLFVBQUEsS0FBQTs7O0VBR0EsYUFBQSxXQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGNBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxLQUFBLFdBQUE7SUFDQSxLQUFBLGFBQUE7SUFDQSxLQUFBLE9BQUE7Ozs7Q0FJQSxLQUFBLGlCQUFBLFNBQUE7Q0FDQTtFQUNBLEdBQUEsTUFBQTtHQUNBLGFBQUEsZUFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBLEtBQUEsb0JBQUEsU0FBQTtDQUNBO0VBQ0EsR0FBQSxNQUFBO0dBQ0EsYUFBQSxrQkFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBOzs7Q0FHQSxXQUFBLGlGQUFBLFNBQUEsWUFBQSxjQUFBLFFBQUEsYUFBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLFNBQUE7RUFDQSxRQUFBO0VBQ0Esb0JBQUE7RUFDQSxxQkFBQTs7O0NBR0EsS0FBQSx3QkFBQSxTQUFBLEtBQUE7RUFDQSxHQUFBLEtBQUEsT0FBQSxzQkFBQSxLQUFBLFlBQUE7R0FDQSxPQUFBO1FBQ0EsR0FBQSxDQUFBLEtBQUEsT0FBQSxtQkFBQTtHQUNBLE9BQUE7OztDQUdBLEtBQUEseUJBQUEsU0FBQSxLQUFBO0VBQ0EsR0FBQSxLQUFBLE9BQUEsdUJBQUEsS0FBQSxhQUFBO0dBQ0EsT0FBQTtRQUNBLEdBQUEsQ0FBQSxLQUFBLE9BQUEsb0JBQUE7R0FDQSxPQUFBOzs7O0NBSUEsU0FBQSxXQUFBLE1BQUE7RUFDQSxhQUFBLEtBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsUUFBQSxTQUFBOzs7Q0FHQSxTQUFBLFdBQUE7O0NBRUEsS0FBQSxPQUFBLFNBQUEsYUFBQSxNQUFBO0NBQ0EsS0FBQSxPQUFBLGFBQUE7Q0FDQSxLQUFBLGNBQUEsQ0FBQSxXQUFBLFFBQUE7Q0FDQTtDQUNBOzs7Q0FHQSxLQUFBLFdBQUEsV0FBQTtFQUNBLEtBQUE7RUFDQSxXQUFBLEtBQUE7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7Q0FFQSxLQUFBLFdBQUEsV0FBQTtFQUNBLElBQUEsS0FBQSxPQUFBLEdBQUE7R0FDQSxLQUFBO0dBQ0EsV0FBQSxLQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7OztDQUdBLEtBQUEsY0FBQSxXQUFBO0VBQ0E7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7OztDQUlBLFdBQUEsc0dBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxRQUFBLFVBQUEsY0FBQTtDQUNBLElBQUEsT0FBQTtDQUNBLEtBQUEsY0FBQTtDQUNBLEtBQUEsZUFBQTs7Q0FFQSxHQUFBLENBQUEsYUFBQSxJQUFBLE9BQUEsR0FBQTs7Q0FFQSxTQUFBLE1BQUE7RUFDQSxhQUFBLEtBQUEsYUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsS0FBQSxPQUFBLFNBQUE7O0lBRUEsTUFBQSxVQUFBO0lBQ0EsT0FBQSxHQUFBLGVBQUEsSUFBQSxDQUFBLFNBQUE7Ozs7Q0FJQSxLQUFBLGFBQUEsU0FBQSxLQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsYUFBQSxXQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFNBQUE7SUFDQSxLQUFBLE1BQUEsUUFBQSxTQUFBO0lBQ0EsS0FBQSxRQUFBO0lBQ0EsT0FBQSxHQUFBLFNBQUEsQ0FBQSxJQUFBLEtBQUE7O0lBRUEsTUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFNBQUEsU0FBQTs7OztDQUlBLEtBQUEsYUFBQSxTQUFBLEtBQUE7RUFDQSxhQUFBLFdBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLE9BQUEsR0FBQTs7OztDQUlBLEtBQUEsaUJBQUEsU0FBQSxhQUFBO0NBQ0E7RUFDQSxPQUFBO0lBQ0EsZUFBQTtJQUNBLE1BQUEsU0FBQSxTQUFBO0lBQ0EsV0FBQSxxQkFBQSxVQUFBOztJQUVBLEtBQUEsU0FBQSxTQUFBO0lBQ0EsS0FBQSxjQUFBLFNBQUEsS0FBQSxNQUFBLFNBQUE7SUFDQSxPQUFBLFNBQUEsS0FBQSxNQUFBLElBQUEsU0FBQSxLQUFBO0tBQ0EsS0FBQSxrQkFBQTtLQUNBLEdBQUEsS0FBQSxNQUFBLEtBQUEsSUFBQSxLQUFBLGtCQUFBO0tBQ0EsT0FBQTs7Ozs7Q0FLQSxLQUFBLGFBQUEsU0FBQTtDQUNBO0VBQ0EsS0FBQSxlQUFBOzs7Q0FHQSxLQUFBLGFBQUEsU0FBQSxhQUFBLFVBQUE7RUFDQSxHQUFBLGVBQUEsVUFBQTtHQUNBLGFBQUEsV0FBQSxhQUFBO0tBQ0EsUUFBQSxTQUFBLFNBQUE7S0FDQSxXQUFBLHFCQUFBLFNBQUE7S0FDQSxPQUFBLEdBQUEsb0JBQUEsQ0FBQSxHQUFBLFlBQUEsQ0FBQSxTQUFBOztLQUVBLFFBQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Ozs7O0NBS0E7OztDQUdBLFFBQUEsNENBQUEsU0FBQSxPQUFBLGVBQUE7O0NBRUEsT0FBQTtFQUNBLE1BQUEsVUFBQSxNQUFBLElBQUE7R0FDQSxJQUFBLE1BQUEsZUFBQTs7R0FFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsTUFBQSxPQUFBLFdBQUE7O0dBRUEsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7RUFJQSxNQUFBLFNBQUEsSUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUEsU0FBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztFQUlBLFlBQUEsU0FBQSxNQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBOzs7O0VBSUEsWUFBQSxTQUFBLE1BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBLFNBQUEsS0FBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBOzs7O0VBSUEsWUFBQSxTQUFBLE1BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBLFNBQUEsS0FBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztFQUlBLGNBQUEsVUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7RUFJQSxnQkFBQSxTQUFBLFNBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBOzs7O0VBSUEsWUFBQSxTQUFBLEtBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxZQUFBLEtBQUEsVUFBQSxRQUFBLEtBQUE7Ozs7RUFJQSxnQkFBQSxTQUFBLFFBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxlQUFBOzs7O0VBSUEsZ0JBQUEsU0FBQSxPQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsU0FBQTs7OztFQUlBLG1CQUFBLFNBQUEsT0FBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFNBQUE7Ozs7RUFJQSxZQUFBLFNBQUEsYUFBQSxXQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsZUFBQSxhQUFBLGFBQUE7Ozs7O0FDNVZBLFFBQUEsT0FBQSxvQkFBQTs7Q0FFQSxXQUFBLG9HQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxvQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLFdBQUEsTUFBQTtRQUNBLG9CQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGVBQUEsU0FBQTs7O0lBR0EsU0FBQSxXQUFBOztJQUVBLEtBQUEsT0FBQSxTQUFBLGFBQUEsTUFBQTtJQUNBLEtBQUEsT0FBQSxhQUFBO0lBQ0EsS0FBQSxjQUFBLENBQUEsV0FBQSxRQUFBO0lBQ0E7SUFDQTs7O0lBR0EsS0FBQSxXQUFBLFdBQUE7UUFDQSxLQUFBO1FBQ0EsV0FBQSxLQUFBO1FBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7O0lBRUEsS0FBQSxXQUFBLFdBQUE7UUFDQSxJQUFBLEtBQUEsT0FBQSxHQUFBO1lBQ0EsS0FBQTtZQUNBLFdBQUEsS0FBQTtZQUNBLE9BQUEsR0FBQSxLQUFBLENBQUEsTUFBQSxLQUFBLE9BQUEsQ0FBQSxRQUFBOzs7SUFHQSxLQUFBLGNBQUEsV0FBQTtRQUNBO1FBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7OztDQUdBLFdBQUEsaUlBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxRQUFBLFVBQUEscUJBQUEsZUFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLE1BQUE7UUFDQSxvQkFBQSxLQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGVBQUEsU0FBQTtnQkFDQSxLQUFBLE9BQUEsS0FBQSxNQUFBLGFBQUEsUUFBQTs7YUFFQSxNQUFBLFVBQUE7Z0JBQ0EsT0FBQSxHQUFBLGdCQUFBLElBQUEsQ0FBQSxTQUFBOzs7O0lBSUEsS0FBQSxlQUFBLFNBQUEsaUJBQUE7UUFDQSxJQUFBLFNBQUE7WUFDQSxtQkFBQSxLQUFBLGFBQUE7WUFDQSxvQkFBQTtZQUNBLFlBQUEsS0FBQSxLQUFBOztRQUVBLGVBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLFNBQUEsbUJBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsYUFBQSxZQUFBLEtBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBOzs7O0lBSUEsS0FBQSxlQUFBLFNBQUEsT0FBQTtRQUNBLGVBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBOzs7Z0JBR0EsUUFBQSxRQUFBLEtBQUEsYUFBQSxhQUFBLFNBQUEsU0FBQSxNQUFBO29CQUNBLEdBQUEsUUFBQSxNQUFBLE9BQUE7b0JBQ0E7d0JBQ0EsS0FBQSxhQUFBLFlBQUEsT0FBQSxPQUFBOzs7Ozs7SUFNQTs7O0NBR0EsUUFBQSxtREFBQSxTQUFBLE9BQUEsZ0JBQUE7O0lBRUEsT0FBQTtRQUNBLE1BQUEsVUFBQSxNQUFBLElBQUE7WUFDQSxJQUFBLE1BQUEsZUFBQTs7WUFFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtZQUNBLElBQUEsTUFBQSxPQUFBLFdBQUE7O1lBRUEsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7UUFJQSxNQUFBLFNBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxnQkFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7OztBQ3hHQSxRQUFBLE9BQUEsaUJBQUE7O0tBRUEsV0FBQSw0REFBQSxTQUFBLFlBQUEsUUFBQSxTQUFBO1lBQ0EsT0FBQSxJQUFBLHNCQUFBLFdBQUE7Z0JBQ0EsU0FBQSxVQUFBO3dCQUNBLENBQUEsU0FBQSxHQUFBLEdBQUEsSUFBQTs0QkFDQSxLQUFBOzRCQUNBLElBQUEsSUFBQSxNQUFBLEVBQUEscUJBQUEsR0FBQTs7NEJBRUEsS0FBQSxFQUFBLGNBQUEsSUFBQSxHQUFBLEtBQUE7NEJBQ0EsR0FBQSxNQUFBOzRCQUNBLElBQUEsV0FBQSxhQUFBLElBQUE7MEJBQ0EsVUFBQSxVQUFBO21CQUNBOzs7Ozs7QUNiQSxRQUFBLE9BQUEsb0JBQUE7O0VBRUEsV0FBQSwwRUFBQSxTQUFBLFlBQUEsUUFBQSxvQkFBQTs7OztFQUlBLFFBQUEsbURBQUEsU0FBQSxPQUFBLGVBQUE7O0VBRUEsT0FBQTs7R0FFQSxhQUFBLFNBQUEsT0FBQSxPQUFBO0lBQ0EsT0FBQSxNQUFBO0tBQ0EsUUFBQTtLQUNBLEtBQUEsZUFBQTtLQUNBLFNBQUEsRUFBQSxpQkFBQTtLQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsT0FBQSxPQUFBLE9BQUE7Ozs7Ozs7O0FDZkEsUUFBQSxPQUFBLGVBQUE7Q0FDQSxXQUFBLHdFQUFBLFNBQUEsWUFBQSxRQUFBLFFBQUEsYUFBQTtJQUNBLElBQUEsT0FBQTs7O0FDRkEsUUFBQSxPQUFBLGdCQUFBOztDQUVBLFdBQUEsNEVBQUEsU0FBQSxZQUFBLFFBQUEsUUFBQSxpQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxLQUFBLGdCQUFBLFVBQUE7UUFDQSxnQkFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLFdBQUEscUJBQUEsU0FBQTtnQkFDQSxPQUFBLEdBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBLFdBQUEsNEVBQUEsU0FBQSxZQUFBLFFBQUEsUUFBQSxnQkFBQTtJQUNBLElBQUEsT0FBQTtJQUNBLEtBQUEsUUFBQTtRQUNBLG1CQUFBO1FBQ0EsWUFBQTtRQUNBLHdCQUFBOzs7SUFHQSxLQUFBLGlCQUFBLFdBQUE7UUFDQSxnQkFBQSxlQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLFFBQUE7b0JBQ0EsbUJBQUE7b0JBQ0EsWUFBQTtvQkFDQSx3QkFBQTs7Z0JBRUEsV0FBQSxxQkFBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7Ozs7OztDQU1BLFdBQUEsK0VBQUEsU0FBQSxZQUFBLFFBQUEsUUFBQSxnQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLGtCQUFBO1FBQ0EsZ0JBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGNBQUEsU0FBQTs7OztJQUlBLEtBQUEsb0JBQUEsQ0FBQSxhQUFBLEdBQUEsT0FBQSxDQUFBLFFBQUEsUUFBQSxLQUFBLENBQUEsUUFBQTs7SUFFQSxLQUFBLGtCQUFBLFVBQUE7UUFDQSxnQkFBQSxnQkFBQSxLQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsYUFBQSxRQUFBLFFBQUEsS0FBQSxVQUFBLFNBQUE7Z0JBQ0EsS0FBQSxjQUFBLFNBQUE7Z0JBQ0EsT0FBQSxHQUFBOzthQUVBLE1BQUEsU0FBQSxTQUFBO2dCQUNBLFdBQUEscUJBQUEsVUFBQTs7OztJQUlBLEtBQUEsb0JBQUEsVUFBQTtRQUNBO1FBQ0EsT0FBQSxHQUFBOzs7SUFHQTs7OztDQUlBLFdBQUEsMEVBQUEsU0FBQSxZQUFBLFFBQUEsUUFBQSxhQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLEtBQUEsY0FBQTtJQUNBLEtBQUEsV0FBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLEtBQUEsYUFBQTs7SUFFQSxTQUFBLGdCQUFBO1FBQ0EsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsZ0JBQUE7Z0JBQ0EsS0FBQSxRQUFBLFNBQUE7Ozs7SUFJQSxLQUFBLGlCQUFBLFNBQUEsYUFBQTtJQUNBO1FBQ0EsT0FBQTthQUNBLGVBQUE7YUFDQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7O2FBRUEsS0FBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxjQUFBLFNBQUEsS0FBQSxNQUFBLFNBQUE7Z0JBQ0EsT0FBQSxTQUFBLEtBQUEsTUFBQSxJQUFBLFNBQUEsS0FBQTtvQkFDQSxLQUFBLGtCQUFBO29CQUNBLFFBQUEsUUFBQSxPQUFBLFNBQUEsS0FBQTt3QkFDQSxHQUFBLEtBQUEsTUFBQSxLQUFBLElBQUEsS0FBQSxrQkFBQTs7O29CQUdBLE9BQUE7Ozs7O0lBS0EsS0FBQSxhQUFBLFNBQUE7SUFDQTtRQUNBLEdBQUEsTUFBQSxvQkFBQSxNQUFBLE9BQUE7UUFDQSxLQUFBLGtCQUFBO1FBQ0EsS0FBQSxXQUFBOzs7SUFHQSxLQUFBLGVBQUE7SUFDQTtRQUNBLFFBQUEsSUFBQTtRQUNBLEtBQUEsa0JBQUE7UUFDQSxLQUFBLFdBQUE7OztJQUdBLEtBQUEsaUJBQUEsU0FBQTtJQUNBO1FBQ0EsYUFBQSxlQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLFdBQUE7Z0JBQ0EsS0FBQSxhQUFBO2dCQUNBLEtBQUEsUUFBQSxTQUFBOzs7O0lBSUEsS0FBQSxhQUFBO0lBQ0E7UUFDQSxHQUFBLENBQUEsS0FBQSxlQUFBLENBQUEsS0FBQSxjQUFBLE9BQUE7UUFDQSxJQUFBLE9BQUE7WUFDQSxNQUFBLEtBQUE7WUFDQSxVQUFBLEtBQUE7OztRQUdBLGFBQUEsV0FBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsY0FBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsS0FBQSxXQUFBO2dCQUNBLEtBQUEsYUFBQTtnQkFDQSxLQUFBLFFBQUEsU0FBQTs7OztJQUlBOzs7Q0FHQSxXQUFBLHdFQUFBLFNBQUEsWUFBQSxRQUFBLFFBQUEsY0FBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxLQUFBLGNBQUEsV0FBQTtRQUNBLGNBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLFVBQUEsU0FBQTs7O0lBR0EsS0FBQTs7SUFFQSxLQUFBLFNBQUE7SUFDQTtRQUNBO2FBQ0EsT0FBQSxLQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxPQUFBO29CQUNBLE1BQUE7b0JBQ0EsVUFBQTtvQkFDQSxPQUFBOztnQkFFQSxLQUFBO2dCQUNBLFdBQUEscUJBQUEsU0FBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7Ozs7O0NBS0EsUUFBQSw2Q0FBQSxTQUFBLE9BQUEsZUFBQTtJQUNBLE9BQUE7UUFDQSxhQUFBLFVBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O1FBSUEsUUFBQSxTQUFBLE1BQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBOzs7Ozs7O0NBT0EsUUFBQSwrQ0FBQSxTQUFBLE9BQUEsZUFBQTtJQUNBLE9BQUE7UUFDQSxpQkFBQSxVQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztRQUlBLGlCQUFBLFNBQUEsS0FBQTtZQUNBLElBQUEsT0FBQSxRQUFBLEtBQUE7WUFDQSxLQUFBLFdBQUEsS0FBQSxTQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQTs7OztRQUlBLGdCQUFBLFNBQUEsYUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7UUFJQSxlQUFBLFdBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7Ozs7QUNsUEEsUUFBQSxPQUFBLGVBQUE7O0NBRUEsV0FBQSwwRkFBQSxTQUFBLFlBQUEsUUFBQSxjQUFBLFFBQUEsZUFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLFdBQUEsTUFBQTtRQUNBLGVBQUEsS0FBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsVUFBQSxTQUFBOzs7SUFHQSxTQUFBLFdBQUE7O0lBRUEsS0FBQSxPQUFBLFNBQUEsYUFBQSxNQUFBO0lBQ0EsS0FBQSxPQUFBLGFBQUE7SUFDQSxLQUFBLGNBQUEsQ0FBQSxXQUFBLFFBQUE7SUFDQTtJQUNBOztDQUVBLFdBQUEscUdBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxRQUFBLFVBQUEsZ0JBQUE7SUFDQSxJQUFBLE9BQUE7O0lBRUEsU0FBQSxNQUFBO1FBQ0EsZUFBQSxLQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLFVBQUEsU0FBQTtnQkFDQSxLQUFBLE9BQUEsS0FBQSxNQUFBLGFBQUEsUUFBQTs7YUFFQSxNQUFBLFVBQUE7Z0JBQ0EsT0FBQSxHQUFBLFdBQUEsSUFBQSxDQUFBLFNBQUE7Ozs7SUFJQSxLQUFBLGVBQUEsU0FBQSxPQUFBO1FBQ0EsS0FBQSxRQUFBO1FBQ0EsZUFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBO2dCQUNBLFNBQUEsUUFBQSxpQ0FBQSxTQUFBLFNBQUEsUUFBQTtnQkFDQSxTQUFBLFFBQUEsbUJBQUEsU0FBQSxTQUFBLFFBQUE7Z0JBQ0EsS0FBQSxRQUFBLFVBQUEsU0FBQTtnQkFDQSxLQUFBLFFBQUE7Z0JBQ0EsT0FBQSxHQUFBLFdBQUEsQ0FBQSxJQUFBLE9BQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Ozs7SUFJQSxLQUFBLGVBQUEsU0FBQSxPQUFBO1FBQ0EsZUFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsT0FBQSxHQUFBOzs7Ozs7SUFNQTs7Q0FFQSxRQUFBLDhDQUFBLFNBQUEsT0FBQSxnQkFBQTs7UUFFQSxPQUFBO1lBQ0EsTUFBQSxVQUFBLE1BQUEsSUFBQTtnQkFDQSxJQUFBLE1BQUEsZUFBQTs7Z0JBRUEsSUFBQSxDQUFBLFFBQUEsWUFBQSxPQUFBLEtBQUEsR0FBQSxPQUFBLE1BQUE7Z0JBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQTs7Z0JBRUEsT0FBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsS0FBQTtvQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7WUFJQSxNQUFBLFNBQUEsSUFBQTtnQkFDQSxPQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxLQUFBLGVBQUEsVUFBQTtvQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7WUFJQSxjQUFBLFNBQUEsUUFBQTtnQkFDQSxPQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxLQUFBLGVBQUE7b0JBQ0EsU0FBQSxFQUFBLGlCQUFBO29CQUNBLE1BQUEsRUFBQSxNQUFBOzs7O1lBSUEsY0FBQSxTQUFBLFFBQUE7Z0JBQ0EsT0FBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsS0FBQSxlQUFBLFVBQUEsT0FBQTtvQkFDQSxTQUFBLEVBQUEsaUJBQUE7b0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7WUFJQSxjQUFBLFNBQUEsUUFBQTtnQkFDQSxPQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxLQUFBLGVBQUEsVUFBQSxPQUFBO29CQUNBLFNBQUEsRUFBQSxpQkFBQTs7Ozs7OztBQzFHQSxRQUFBLE9BQUEsYUFBQTtDQUNBLFdBQUEsa0hBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxRQUFBLHFCQUFBLGFBQUE7SUFDQSxJQUFBLE9BQUE7O0lBRUEsU0FBQSxZQUFBO1FBQ0EsR0FBQSxhQUFBLFNBQUE7WUFDQSxhQUFBLEtBQUEsYUFBQSxJQUFBLGFBQUE7aUJBQ0EsUUFBQSxTQUFBLFNBQUE7b0JBQ0EsS0FBQSxRQUFBLFNBQUE7b0JBQ0EsS0FBQSxVQUFBLFNBQUE7O29CQUVBLFFBQUEsUUFBQSxLQUFBLE1BQUEsU0FBQSxTQUFBLFFBQUEsSUFBQTt3QkFDQSxHQUFBLE9BQUEsTUFBQSxZQUFBLEdBQUEsS0FBQSxNQUFBLHVCQUFBLE9BQUE7d0JBQ0EsR0FBQSxPQUFBLE1BQUEsWUFBQSxHQUFBLEtBQUEsTUFBQSx1QkFBQSxPQUFBO3dCQUNBLEdBQUEsT0FBQSxNQUFBLFlBQUEsR0FBQSxLQUFBLE1BQUEsc0JBQUEsT0FBQTt3QkFDQSxHQUFBLE9BQUEsTUFBQSxZQUFBLEdBQUEsS0FBQSxNQUFBLHVCQUFBLE9BQUE7d0JBQ0EsR0FBQSxPQUFBLE1BQUEsWUFBQSxHQUFBLEtBQUEsTUFBQSxzQkFBQSxPQUFBOzs7b0JBR0EsS0FBQSxNQUFBLFVBQUE7OztpQkFHQSxNQUFBLFNBQUEsU0FBQTtvQkFDQSxXQUFBLHFCQUFBLFVBQUE7O2FBRUE7WUFDQSxhQUFBLEtBQUEsYUFBQSxJQUFBLGFBQUE7aUJBQ0EsUUFBQSxTQUFBLFNBQUE7b0JBQ0EsS0FBQSxVQUFBO3dCQUNBLE1BQUE7d0JBQ0Esa0JBQUE7d0JBQ0EscUJBQUE7d0JBQ0Esc0JBQUE7d0JBQ0EscUJBQUE7d0JBQ0Esc0JBQUE7d0JBQ0EscUJBQUE7O29CQUVBLEtBQUEsUUFBQSxTQUFBO29CQUNBLEtBQUEsVUFBQSxTQUFBOztpQkFFQSxNQUFBLFNBQUEsU0FBQTtvQkFDQSxXQUFBLHFCQUFBLFVBQUE7Ozs7OztJQU1BLEtBQUEsYUFBQSxVQUFBO1FBQ0EsR0FBQSxLQUFBLFFBQUEsUUFBQSxLQUFBLFFBQUEsaUJBQUE7WUFDQSxhQUFBLE1BQUEsYUFBQSxJQUFBLEtBQUE7aUJBQ0EsUUFBQSxTQUFBLFNBQUE7b0JBQ0EsV0FBQSxxQkFBQSxTQUFBO29CQUNBLE9BQUEsR0FBQSwyQkFBQSxDQUFBLElBQUEsYUFBQSxLQUFBLENBQUEsT0FBQTs7aUJBRUEsTUFBQSxTQUFBLFNBQUE7b0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7b0JBQ0EsR0FBQSxTQUFBLGlCQUFBO3dCQUNBLE9BQUEsR0FBQSxnQ0FBQSxDQUFBLElBQUEsYUFBQSxJQUFBLFVBQUEsU0FBQSxtQkFBQSxDQUFBLE9BQUE7Ozs7OztJQU1BLEtBQUEsYUFBQSxTQUFBLEtBQUE7UUFDQSxHQUFBLEtBQUEsTUFBQSxRQUFBLEtBQUEsTUFBQSxpQkFBQTtZQUNBLGFBQUEsT0FBQSxhQUFBLElBQUEsS0FBQSxNQUFBLElBQUE7aUJBQ0EsUUFBQSxTQUFBLFNBQUE7b0JBQ0EsV0FBQSxxQkFBQSxTQUFBO29CQUNBLE9BQUEsR0FBQSwyQkFBQSxDQUFBLElBQUEsYUFBQSxLQUFBLENBQUEsT0FBQTs7aUJBRUEsTUFBQSxTQUFBLFNBQUE7b0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7b0JBQ0EsR0FBQSxTQUFBLGlCQUFBO3dCQUNBLE9BQUEsR0FBQSxnQ0FBQSxDQUFBLElBQUEsYUFBQSxJQUFBLFVBQUEsU0FBQSxtQkFBQSxDQUFBLE9BQUE7Ozs7OztJQU1BLEtBQUEsYUFBQSxVQUFBO1FBQ0EsT0FBQSxHQUFBLDBCQUFBLENBQUEsSUFBQSxhQUFBLEtBQUEsQ0FBQSxPQUFBOzs7SUFHQSxLQUFBLGFBQUEsU0FBQSxTQUFBO1FBQ0EsR0FBQSxTQUFBO1lBQ0EsYUFBQSxPQUFBLGFBQUEsSUFBQTtpQkFDQSxRQUFBLFNBQUEsU0FBQTtvQkFDQSxXQUFBLHFCQUFBO29CQUNBLE9BQUEsR0FBQSwyQkFBQSxDQUFBLElBQUEsYUFBQSxLQUFBLENBQUEsT0FBQTs7aUJBRUEsTUFBQSxTQUFBLFNBQUE7b0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Ozs7O0lBS0E7OztDQUdBLFFBQUEsNENBQUEsU0FBQSxPQUFBLGdCQUFBO0lBQ0EsT0FBQTtRQUNBLE1BQUEsVUFBQSxpQkFBQSxVQUFBO1lBQ0EsR0FBQSxtQkFBQSxTQUFBO2dCQUNBLE1BQUEsZUFBQSxnQkFBQSxnQkFBQSxnQkFBQTttQkFDQTtnQkFDQSxNQUFBLGVBQUEsZ0JBQUEsZ0JBQUE7O1lBRUEsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7UUFJQSxNQUFBLFNBQUEsSUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxnQkFBQSxnQkFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7UUFJQSxPQUFBLFNBQUEsaUJBQUEsS0FBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxnQkFBQSxnQkFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7UUFJQSxRQUFBLFNBQUEsaUJBQUEsVUFBQSxLQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBLGdCQUFBLGdCQUFBLGdCQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQTs7OztRQUlBLFFBQUEsU0FBQSxpQkFBQSxTQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBLGdCQUFBLGdCQUFBLGdCQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7Ozs7OztBQ2hKQSxRQUFBLE9BQUEsYUFBQTs7Q0FFQSxXQUFBLDRFQUFBLFNBQUEsWUFBQSxjQUFBLFFBQUEsYUFBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLFNBQUE7RUFDQSxRQUFBO0VBQ0EsUUFBQTs7O0NBR0EsU0FBQSxXQUFBLE1BQUE7RUFDQSxhQUFBLEtBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsUUFBQSxTQUFBOzs7Q0FHQSxTQUFBLFdBQUE7O0NBRUEsS0FBQSxPQUFBLFNBQUEsYUFBQSxNQUFBO0NBQ0EsS0FBQSxPQUFBLGFBQUE7Q0FDQSxLQUFBLGNBQUEsQ0FBQSxXQUFBLFFBQUE7Q0FDQTtDQUNBOzs7Q0FHQSxLQUFBLFdBQUEsV0FBQTtFQUNBLEtBQUE7RUFDQSxXQUFBLEtBQUE7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7Q0FFQSxLQUFBLFdBQUEsV0FBQTtFQUNBLElBQUEsS0FBQSxPQUFBLEdBQUE7R0FDQSxLQUFBO0dBQ0EsV0FBQSxLQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7OztDQUdBLEtBQUEsY0FBQSxXQUFBO0VBQ0E7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7Ozs7Q0FLQSxRQUFBLDRDQUFBLFNBQUEsT0FBQSxlQUFBOztDQUVBLE9BQUE7RUFDQSxNQUFBLFVBQUEsTUFBQSxJQUFBO0dBQ0EsSUFBQSxNQUFBLGVBQUE7O0dBRUEsSUFBQSxDQUFBLFFBQUEsWUFBQSxPQUFBLEtBQUEsR0FBQSxPQUFBLE1BQUE7R0FDQSxJQUFBLE1BQUEsT0FBQSxXQUFBOztHQUVBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O0VBSUEsTUFBQSxTQUFBLElBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBLFNBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FDNURBLElBQUEsb0JBQUEsU0FBQSxVQUFB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LFFBQUEsUUFBQSxPQUFBLFFBQUE7O1lBRUEsSUFBQSxXQUFBO1lBQ0EsSUFBQSxJQUFBLE9BQUEsT0FBQTtjQUNBLEdBQUEsUUFBQSxjQUFBLFFBQUEsU0FBQTtpQkFDQSxTQUFBLE9BQUEsT0FBQTs7O1lBR0EsSUFBQSxJQUFBLEtBQUEsRUFBQSxLQUFBLE9BQUEsT0FBQSxPQUFBLEtBQUE7Y0FDQSxRQUFBLE9BQUEsT0FBQSxPQUFBLElBQUE7O1lBRUEsYUFBQSxLQUFBLE9BQUE7Ozs7UUFJQSxPQUFBLE1BQUEsVUFBQSxPQUFBLE1BQUEsSUFBQTs7Ozs7OztNQU9BLEtBQUEsZ0JBQUEsU0FBQSxhQUFBLFNBQUE7UUFDQSxJQUFBO1FBQ0EsSUFBQSxZQUFBLFdBQUE7VUFDQSxJQUFBLFFBQUEsUUFBQSxXQUFBLGVBQUEsZ0JBQUE7VUFDQSxJQUFBLFNBQUEsSUFBQSxPQUFBO1VBQ0EsS0FBQSxJQUFBLElBQUEsR0FBQSxJQUFBLE1BQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtZQUNBLEtBQUEsTUFBQTtZQUNBLFFBQUEsUUFBQTtZQUNBLElBQUEsU0FBQTtZQUNBLE9BQUEsS0FBQTs7VUFFQSxPQUFBOzs7O1FBSUEsSUFBQSxpQkFBQSxTQUFBLEdBQUEsR0FBQTtVQUNBLElBQUEsU0FBQSxJQUFBLE1BQUEsSUFBQSxHQUFBO1VBQ0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxFQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7WUFDQSxJQUFBLEVBQUEsTUFBQTs7VUFFQSxLQUFBLElBQUEsR0FBQSxJQUFBLEVBQUEsUUFBQSxJQUFBLEdBQUEsS0FBQTtZQUNBLElBQUEsQ0FBQSxJQUFBLEVBQUEsS0FBQTtjQUNBLE9BQUEsS0FBQSxFQUFBOzs7VUFHQSxPQUFBOzs7O1FBSUEsSUFBQSxNQUFBOztRQUVBLElBQUEsZUFBQSxTQUFBLFdBQUEsV0FBQTtVQUNBLElBQUEsR0FBQSxHQUFBLElBQUE7VUFDQSxJQUFBLGlCQUFBO1VBQ0EsSUFBQSxnQkFBQSxlQUFBLFdBQUE7VUFDQSxLQUFBLElBQUEsR0FBQSxJQUFB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QUEsTUFBQSxPQUFBLFNBQUE7TUFDQSxJQUFBLGNBQUEsS0FBQSxJQUFBLEtBQUEsY0FBQSxLQUFBLGNBQUEsS0FBQSxlQUFBLEtBQUEsY0FBQSxLQUFBO01BQ0EsaUJBQUEsZUFBQSxPQUFBOztNQUVBLElBQUEsZ0JBQUEsV0FBQTs7T0FFQSxNQUFBLFNBQUEsTUFBQSxTQUFBLE1BQUE7VUFDQSxNQUFBOzs7OztBQ1hBLElBQUEsVUFBQSxrQkFBQSxXQUFBO0VBQ0EsT0FBQTtJQUNBLFNBQUE7SUFDQSxNQUFBLFNBQUEsT0FBQSxTQUFBLE9BQUEsU0FBQTtNQUNBLFFBQUEsU0FBQSxLQUFBLFNBQUEsT0FBQTtRQUNBLE9BQUEsS0FBQTs7TUFFQSxRQUFBLFlBQUEsS0FBQSxTQUFBLE9BQUE7UUFDQSxPQUFBLFdBQUEsT0FBQTs7Ozs7QUNSQSxJQUFBLE9BQUEsYUFBQSxZQUFBO0lBQ0EsT0FBQSxVQUFBLE9BQUEsVUFBQSxLQUFBLE1BQUE7UUFDQSxJQUFBLENBQUEsT0FBQSxPQUFBOztRQUVBLE1BQUEsU0FBQSxLQUFBO1FBQ0EsSUFBQSxDQUFBLEtBQUEsT0FBQTtRQUNBLElBQUEsTUFBQSxVQUFBLEtBQUEsT0FBQTs7UUFFQSxRQUFBLE1BQUEsT0FBQSxHQUFBO1FBQ0EsSUFBQSxVQUFBO1lBQ0EsSUFBQSxZQUFBLE1BQUEsWUFBQTtZQUNBLElBQUEsYUFBQSxDQUFBLEdBQUE7Z0JBQ0EsUUFBQSxNQUFBLE9BQUEsR0FBQTs7OztRQUlBLE9BQUEsU0FBQSxRQUFBOzs7O0FDaEJBLElBQUEsT0FBQSxhQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQTtRQUNBLEdBQUEsVUFBQSxVQUFBO1lBQ0EsSUFBQSxJQUFBLE1BQUEsTUFBQTtZQUNBLElBQUEsRUFBQSxJQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUE7WUFDQSxPQUFBLElBQUEsS0FBQSxHQUFBOzs7O0FDTEEsSUFBQSxPQUFBLFdBQUEsQ0FBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLFFBQUE7UUFDQSxPQUFBLFFBQUEsT0FBQSxJQUFBOzs7QUNGQSxJQUFBLE9BQUEsT0FBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUE7UUFDQSxPQUFBLFNBQUEsT0FBQTs7O0FDRkEsSUFBQSxPQUFBLFNBQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxPQUFBLE9BQUEsS0FBQTtRQUNBLFFBQUEsU0FBQTtRQUNBLE1BQUEsU0FBQTtRQUNBLElBQUE7UUFDQSxHQUFBLFFBQUEsSUFBQTtZQUNBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTtnQkFDQSxNQUFBLEtBQUE7YUFDQTtZQUNBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTtnQkFDQSxNQUFBLEtBQUE7O1FBRUEsT0FBQTs7O0FDWkEsSUFBQSxPQUFBLGdDQUFBLFNBQUE7QUFDQTtJQUNBLE9BQUEsU0FBQTtJQUNBO1FBQ0EsT0FBQSxLQUFBLFlBQUE7Ozs7QUNKQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7O0lBRUEsZUFBQSxNQUFBLFNBQUE7UUFDQSxLQUFBO1FBQ0EsUUFBQTtRQUNBLFVBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBO2dCQUNBLGNBQUE7Ozs7O0lBS0EsZUFBQSxNQUFBLGVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7SUFLQSxlQUFBLE1BQUEsZUFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsZUFBQSxNQUFBLG9CQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsMEJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJ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QSxlQUFBLE1BQUEsbUJBQUE7UUFDQSxLQUFBO1FBQ0EsT0FBQTtZQUNBLFVBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7UUFHQSxZQUFBOzs7O0FDL0VBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7O0NBR0EsZUFBQSxNQUFBLFdBQUE7RUFDQSxLQUFBO0VBQ0EsUUFBQTtFQUNBLE1BQUE7R0FDQSxZQUFBO0lBQ0EsYUFBQTtJQUNBLFlBQUE7SUFDQSxjQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxVQUFBO0VBQ0EsS0FBQTtFQUNBLFFBQUE7RUFDQSxPQUFBO0dBQ0EsWUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBO0lBQ0EsY0FBQTs7O0VBR0EsWUFBQTs7O0NBR0EsZUFBQSxNQUFBLGVBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLFlBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7OztFQUdBLFlBQUE7OztJQUdBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJyxcblx0W1xuXHRcdCdhbmd1bGFyLWp3dCcsXG5cdFx0J3VpLnJvdXRlcicsXG5cdFx0J2FwcC5hdXRoJyxcblx0XHQnYXBwLmVycm9yaGFuZGxlcicsXG5cdFx0J3VpLmNhbGVuZGFyJyxcblx0XHQndWkuYm9vdHN0cmFwJyxcblx0XHQndWkuYm9vdHN0cmFwLmRhdGV0aW1lcGlja2VyJyxcblx0XHQndWkuc29ydGFibGUnLFxuXHRcdCduZ0FuaW1hdGUnLFxuXHRcdCdhcHAuc2V0dGluZ3MnLFxuXHRcdCdhcHAuZGFzaGJvYXJkJyxcblx0XHQnYXBwLmNvbXBldGl0aW9ucycsXG5cdFx0J2FwcC5jaGFtcGlvbnNoaXBzJyxcblx0XHQnYXBwLnNpZ251cHMnLFxuXHRcdCdhcHAudXNlcnMnLFxuXHRcdCdhcHAuY2x1YnMnLFxuXHRcdCdhcHAuY2FsZW5kYXInLFxuXHRcdCdhcHAucHJlbWl1bScsXG5cdFx0J2FwcC50ZWFtcycsXG5cdF0sIGZ1bmN0aW9uKCRpbnRlcnBvbGF0ZVByb3ZpZGVyKXtcblx0XHQkaW50ZXJwb2xhdGVQcm92aWRlci5zdGFydFN5bWJvbCgnPCUnKTtcblx0XHQkaW50ZXJwb2xhdGVQcm92aWRlci5lbmRTeW1ib2woJyU+Jyk7XG59KTtcblxuYXBwLnJ1bihmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGUsICR0aW1lb3V0LCBFcnJvckhhbmRsZXJGYWN0b3J5LCBqd3RIZWxwZXIsIEF1dGhGYWN0b3J5LCAkd2luZG93LCAkbG9jYXRpb24pIHtcblxuXHQkd2luZG93LmdhKCdjcmVhdGUnLCAnVUEtNzYyMjE2MTgtMScsICdhdXRvJyk7XG5cdFxuXHQkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihlLCB0bykge1xuXHRcdHZhciB0b2tlbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuXG5cdFx0JHJvb3RTY29wZS5jdXJyZW50Um91dGUgPSB0by5uYW1lO1xuXG5cdFx0aWYodG9rZW4gIT09IG51bGwpe1xuXHRcdFx0JHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gdHJ1ZTtcblx0XHRcdHZhciB1c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcblx0XHRcdCRyb290U2NvcGUuY3VycmVudFVzZXIgPSB1c2VyO1xuXHRcdH1cblxuXHRcdGlmKCh0by5uYW1lLnNwbGl0KFwiLlwiLCAxKVswXSA9PSAnYXV0aCcpICYmICRyb290U2NvcGUuYXV0aGVudGljYXRlZCl7XG5cdFx0XHQkc3RhdGUuZ28oJ2Rhc2hib2FyZCcsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0fVxuXG5cdFx0aWYgKHRvLnJlc3RyaWN0ZWQpIHtcblxuXHRcdFx0Ly8gUmVzdHJpY3QgZ3VhcmRlZCByb3V0ZXMuXG5cdFx0XHRpZiAodG9rZW4gPT09IG51bGwpIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcblx0XHRcdH1cblxuXHRcdFx0Lypcblx0XHRcdGlmICh0b2tlbiAhPT0gbnVsbCAmJiBqd3RIZWxwZXIuaXNUb2tlbkV4cGlyZWQodG9rZW4pKSB7XG5cdFx0XHRcdEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4oKTtcblx0XHRcdH1cblx0XHRcdCovXG5cblx0XHRcdCRyb290U2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMgPSB7XG5cdFx0XHRcdHNob3dXZWVrczogdHJ1ZSxcblx0XHRcdFx0c3RhcnRpbmdEYXk6IDFcblx0XHRcdH07XG5cdFx0XHQkcm9vdFNjb3BlLnRpbWVwaWNrZXJPcHRpb25zID0ge1xuXHRcdFx0XHRzaG93TWVyaWRpYW46IGZhbHNlLFxuXHRcdFx0XHRtaW51dGVTdGVwOiAxNVxuXHRcdFx0fTtcblxuXHRcdH1cblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9ICcnO1xuXG5cdH0pO1xuXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0JHdpbmRvdy5nYSgnc2VuZCcsICdwYWdldmlldycsICRsb2NhdGlvbi5wYXRoKCkpO1xuXHR9KTtcblxuXHQvKipcblx0ICogR2VuZXJhdGVzIGZsYXNoIG1lc3NhZ2VzIGJhc2VkIG9uIGdpdmVuIGFycmF5IG9yIHN0cmluZyBvZiBtZXNzYWdlcy5cblx0ICogSGlkZXMgZXZlcnkgbWVzc2FnZSBhZnRlciA1IHNlY29uZHMuXG5cdCAqXG5cdCAqIEBwYXJhbSAgbWl4ZWQgIG1lc3NhZ2VzXG5cdCAqIEBwYXJhbSAgc3RyaW5nIHR5cGVcblx0ICogQHJldHVybiB2b2lkXG5cdCAqL1xuXHQkcm9vdFNjb3BlLmNhdGNoRXJyb3IgPSBmdW5jdGlvbihyZXNwb25zZSlcblx0e1xuXHRcdC8vIFJlc2V0IGFsbCBlcnJvci0gYW5kIHN1Y2Nlc3MgbWVzc2FnZXMuXG5cdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzID0gW107XG5cdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblxuXHRcdGlmKHR5cGVvZiByZXNwb25zZSA9PT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzLnB1c2gocmVzcG9uc2UpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdFx0aWYocmVzcG9uc2UpXG5cdFx0XHR7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZSwgZnVuY3Rpb24oZXJyb3JNZXNzYWdlKXtcblx0XHRcdFx0XHR2YXIgbWVzc2FnZSA9ICh0eXBlb2YgZXJyb3JNZXNzYWdlID09PSAnc3RyaW5nJykgPyBlcnJvck1lc3NhZ2UgOiBlcnJvck1lc3NhZ2VbMF07XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyk7XG5cblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMgPSBbXTtcblx0XHRcdFx0fSwgNTAwMCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cblx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyA9IGZ1bmN0aW9uKG1lc3NhZ2VzLCB0eXBlKVxuXHR7XG5cdFx0JHRpbWVvdXQuY2FuY2VsKCRyb290U2NvcGUuZXJyb3JNZXNzYWdlVGltZXIpO1xuXHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdCRyb290U2NvcGUuc3VjY2Vzc01lc3NhZ2VzID0gW107XG5cblx0XHRpZihhbmd1bGFyLmlzU3RyaW5nKG1lc3NhZ2VzKSkgbWVzc2FnZXMgPSBbbWVzc2FnZXNdO1xuXG5cdFx0dmFyIHVud2FudGVkTWVzc2FnZXMgPSBbJ3Rva2VuX25vdF9wcm92aWRlZCddO1xuXHRcdHZhciBpY29uID0gKHR5cGUgPT0gJ3N1Y2Nlc3MnKSA/ICdjaGVjay1jaXJjbGUnIDogJ2luZm8tY2lyY2xlJztcblxuXHRcdGFuZ3VsYXIuZm9yRWFjaChtZXNzYWdlcywgZnVuY3Rpb24obWVzc2FnZSl7XG5cblx0XHRcdGlmKHVud2FudGVkTWVzc2FnZXMuaW5kZXhPZihtZXNzYWdlKSA8IDApXG5cdFx0XHR7XG5cdFx0XHRcdHZhciB0ZXh0ID0gKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykgPyBtZXNzYWdlIDogbWVzc2FnZVswXTtcblx0XHRcdFx0aWYodHlwZSA9PSAnZXJyb3InKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzLnB1c2godGV4dCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMucHVzaCh0ZXh0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VUaW1lciA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMgPSBbXTtcblx0XHRcdCRyb290U2NvcGUuc3VjY2Vzc01lc3NhZ2VzID0gW107XG5cdFx0fSwgNTAwMCk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdsb2JhbCBmdW5jdGlvbiBmb3IgcmVwb3J0aW5nIHRvcCBsZXZlbCBlcnJvcnMuIE1ha2VzIGFuIGFqYXggY2FsbCBmb3Igc2VuZGluZyBhIGJ1ZyByZXBvcnQuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBlcnJvclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gY2F1c2Vcblx0ICovXG5cdCRyb290U2NvcGUucmVwb3J0RXJyb3IgPSBmdW5jdGlvbihlcnJvciwgY2F1c2UpXG5cdHtcblx0XHRpZighY2F1c2UpIGNhdXNlID0gJ0Zyb250ZW5kJztcblx0XHRpZihlcnJvcil7XG5cdFx0XHRFcnJvckhhbmRsZXJGYWN0b3J5XG5cdFx0XHRcdC5yZXBvcnRFcnJvcihlcnJvciwgY2F1c2UpXG5cblx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdGlmKHJlc3BvbnNlLm1lc3NhZ2Upe1xuXHRcdFx0XHRcdFx0aWYocmVzcG9uc2UubWVzc2FnZSkgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhbcmVzcG9uc2UuZGF0YS5tZXNzYWdlXSwgJ3dhcm5pbmcnKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYocmVzcG9uc2UuZGF0YSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5kYXRhLm1lc3NhZ2UpICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMoW3Jlc3BvbnNlLmRhdGEubWVzc2FnZV0sICd3YXJuaW5nJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmF1dGgnLCBbJ3ZjUmVjYXB0Y2hhJ10pXG4gICAgLmNvbnRyb2xsZXIoJ0F1dGhDb250cm9sbGVyJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsICRzdGF0ZVBhcmFtcywgQXV0aEZhY3RvcnksICR1aWJNb2RhbCwgJHRpbWVvdXQpe1xuXG4gICAgICAgICRzY29wZS5hdXRoID1cbiAgICAgICAge1xuICAgICAgICAgICAgZW1haWxcdDogJycsXG4gICAgICAgICAgICBuYW1lICAgIDogJycsXG4gICAgICAgICAgICBsYXN0bmFtZTogJycsXG4gICAgICAgICAgICBwYXNzd29yZDogJycsXG4gICAgICAgICAgICBpbnZpdGVfdG9rZW46ICRzdGF0ZVBhcmFtcy5pbnZpdGVfdG9rZW5cbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUubG9naW4gPSBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAgICRzY29wZS5sb2dnaW5nSW4gPSB0cnVlO1xuXG4gICAgICAgICAgICB2YXIgY3JlZGVudGlhbHMgPSB7XG4gICAgICAgICAgICAgICAgZW1haWw6ICRzY29wZS5hdXRoLmVtYWlsLFxuICAgICAgICAgICAgICAgIHBhc3N3b3JkOiAkc2NvcGUuYXV0aC5wYXNzd29yZFxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgQXV0aEZhY3RvcnkuYXV0aGVudGljYXRlKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgQXV0aEZhY3RvcnkuZ2V0VXNlcigpXG4gICAgICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VyJywgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UudXNlcikpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gcmVzcG9uc2UudXNlcjtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdkYXNoYm9hcmQnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDEwMDApO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubG9nZ2luZ0luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYocmVzcG9uc2UgPT0gJ3VzZXJfbm90X2FjdGl2ZScpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5pbmFjdGl2ZScsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUubG9nZ2luZ0luID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnJlZ2lzdGVyID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZigkc2NvcGUuYXV0aC5yZWNhcHRjaGFyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICRzY29wZS5yZWdpc3RlclN0YXRlID0gJ3JlZ2lzdHJlcmluZyc7XG5cbiAgICAgICAgICAgICAgICBBdXRoRmFjdG9yeS5yZWdpc3Rlcigkc2NvcGUuYXV0aClcbiAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlZ2lzdGVyU3RhdGUgPSAnZG9uZSc7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYXV0aCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVnaXN0ZXJTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICAvKipcbiAgICAgICAgICogTWFrZXMgYSByZXF1ZXN0IGZvciBzZW5kaW5nIGEgcGFzc3dvcmQgcmVzZXQgbGluay5cbiAgICAgICAgICpcbiAgICAgICAgICogQHJldHVybiB2b2lkXG4gICAgICAgICAqL1xuICAgICAgICAkc2NvcGUucmVzZXQgPSB7ZW1haWw6ICcnfTtcbiAgICAgICAgJHNjb3BlLnJlcXVlc3RQYXNzd29yZFJlc2V0ID0gZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgICBBdXRoRmFjdG9yeVxuICAgICAgICAgICAgICAgIC5yZXF1ZXN0UGFzc3dvcmRSZXNldCh7ZW1haWw6ICRzY29wZS5yZXNldC5lbWFpbH0pXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVzZXQuZW1haWwgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdzdWNjZXNzJylcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS50ZXJtc01vZGFsT3BlbiA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHNlbGYudGVybXNNb2RhbCA9ICR1aWJNb2RhbC5vcGVuKHtcbiAgICAgICAgICAgICAgICBhbmltYXRpb246ICRzY29wZS5hbmltYXRpb25zRW5hYmxlZCxcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy90ZXJtcycsXG4gICAgICAgICAgICAgICAgc2l6ZTogJ21kJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkdWliTW9kYWxJbnN0YW5jZSl7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY2xvc2UgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ21vZGFsJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICB9KVxuXG4gICAgLmNvbnRyb2xsZXIoJ0FjdGl2YXRpb25Db250cm9sbGVyJywgZnVuY3Rpb24oJHN0YXRlLCAkcm9vdFNjb3BlLCAkc2NvcGUsICRodHRwLCAkc3RhdGVQYXJhbXMsIEF1dGhGYWN0b3J5LCAkdGltZW91dCl7XG4gICAgICAgICRzY29wZS5hY3RpdmF0ZSA9IHtcbiAgICAgICAgICAgIHRva2VuOiAkc3RhdGVQYXJhbXMudG9rZW5cbiAgICAgICAgfTtcbiAgICAgICAgJHNjb3BlLnZlcmlmeVRva2VuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBBdXRoRmFjdG9yeS5hY3RpdmF0ZSgkc2NvcGUuYWN0aXZhdGUpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZigkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnZGFzaGJvYXJkJywge30sIHtsb2NhdGlvbjogJ3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5sb2dpbicsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9KVxuXG4gICAgLmZhY3RvcnkoJ0F1dGhGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRmaWx0ZXIsICR0aW1lb3V0LCAkc3RhdGUsICRyb290U2NvcGUsIEFwaUVuZHBvaW50VXJsKXtcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTdG9yZXMgdGhlIHVzZXIgZGF0YSBhbmQgdXBkYXRlcyB0aGUgcm9vdHNjb3BlIHZhcmlhYmxlcy4gVGhlbiByZWRpcmVjdHMgdG8gZGFzaGJvYXJkLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSAgb2JqZWN0ICAkdXNlclxuICAgICAgICAgICAgICogQHJldHVybiB2b2lkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogZnVuY3Rpb24oY3JlZGVudGlhbHMpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBjcmVkZW50aWFsc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0VXNlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXNlcidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xlYXJzIGFsbCB1c2VyIGRhdGEgYW5kIHJvb3RzY29wZSB1c2VyIHZhcmlhYmxlcy4gVGhlbiByZWRpcmVjdHMgdG8gbG9naW4gZm9ybS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9nb3V0OiBmdW5jdGlvbigpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlcXVlc3RQYXNzd29yZFJlc2V0OiBmdW5jdGlvbihjcmVkZW50aWFscykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydwYXNzd29yZC9lbWFpbCcsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzZXRQYXNzd29yZDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncGFzc3dvcmQvcmVzZXQnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihjcmVkZW50aWFscykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydyZWdpc3RlcicsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYWN0aXZhdGU6IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FjdGl2YXRlJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0odG9rZW4pXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhdHRlbXB0UmVmcmVzaFRva2VuOiBmdW5jdGlvbihyZXF1ZXN0VG9kb1doZW5Eb25lKXtcblxuICAgICAgICAgICAgICAgIC8vIFJ1biB0aGUgY2FsbCB0byByZWZyZXNoIHRoZSB0b2tlbi5cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncmVmcmVzaCdcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbm8gcmVzcG9uc2UgdG9rZW4gaXMgcmV0cmlldmVkLCBnbyB0byB0aGUgbG9naW4gcGFnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgdGhlIHJlcXVlc3QgZnJvbSBiZWluZyByZXRyaWVkIGJ5IHNldHRpbmcgcmVxdWVzdFRvZG9XaGVuRG9uZSA9IGZhbHNlIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGZhbHNlIHRvIGFsbG93IGZvciBjdXN0b20gY2FsbGJhY2tzIGJ5IGNoZWNraW5nIGlmKEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4oKSA9PT0gZmFsc2UpLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLnRva2VuKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RUb2RvV2hlbkRvbmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5sb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSByZWZyZXNoZWQgdG9rZW4uXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCByZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhIHJlcXVlc3Qgc2hvdWxkIGJlIHJldHJpZWQgYWZ0ZXIgcmVmcmVzaCwgZm9yIGV4YW1wbGUgb24gcHVsbC10by1yZWZyZXNoLCB0aGUgcmVxdWVzdCBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIHBhc3NlZCBpbnRvIHRoZSByZXF1ZXN0VG9kb1doZW5Eb25lIHBhcmFtZXRlci4gU2V0IHRoZSBhdXRob3JpemF0aW9uIHRva2VuIHRvIHRoZSBuZXdseSByZXRyaWV2ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRva2VuIGFuZCBydW4gdGhlIHJlcXVlc3QgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWFuZ3VsYXIuaXNVbmRlZmluZWQocmVxdWVzdFRvZG9XaGVuRG9uZSkgJiYgcmVxdWVzdFRvZG9XaGVuRG9uZS5sZW5ndGggIT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdFRvZG9XaGVuRG9uZS5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAocmVxdWVzdFRvZG9XaGVuRG9uZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RUb2RvV2hlbkRvbmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jYWxlbmRhcicsIFtdKVxuXG4vKipcbiAqIGNhbGVuZGFyRGVtb0FwcCAtIDAuMS4zXG4gKi9cbi5jb250cm9sbGVyKCdDYWxlbmRhckNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsJGh0dHAsJHRpbWVvdXQsIEFwaUVuZHBvaW50VXJsKSB7XG5cdFxuXHRmdW5jdGlvbiBpbml0KCl7XG5cdFx0XG5cdFx0JGFwaVVybCA9IEFwaUVuZHBvaW50VXJsKydjYWxlbmRhcic7XG5cdFxuXHRcdCRzY29wZS5jYWxlbmRhckV2ZW50cyA9IFt7XG4gICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsK1wiY2FsZW5kYXJcIixcbiAgICAgICAgfV07XG5cdFxuXHQgICAgJHNjb3BlLnVpQ29uZmlnID0ge1xuXHQgICAgICBjYWxlbmRhcjp7XG5cdFx0ICAgIGxhbmc6ICdzdicsXG5cdFx0ICAgIGJ1dHRvblRleHQ6IHtcblx0XHRcdCAgICB0b2RheTogICAgJ2lkYWcnLFxuXHRcdFx0ICAgIG1vbnRoOiAgICAnbcOlbmFkJyxcblx0XHRcdCAgICB3ZWVrOiAgICAgJ3ZlY2thJyxcblx0XHRcdCAgICBkYXk6ICAgICAgJ2RhZydcblx0XHRcdH0sXG5cdFx0XHRmaXJzdERheTogJzEnLFxuXHRcdFx0d2Vla051bWJlcnM6IHRydWUsXG5cdFx0XHRoZWFkZXI6IHtcblx0XHRcdFx0bGVmdDogJ3ByZXYsbmV4dCB0b2RheScsXG5cdFx0XHRcdGNlbnRlcjogJ3RpdGxlJyxcblx0XHRcdFx0cmlnaHQ6ICdtb250aCxhZ2VuZGFXZWVrLGFnZW5kYURheSdcblx0XHRcdH0sXG5cdFx0XHRjb2x1bW5Gb3JtYXQ6IHtcblx0XHRcdFx0ZGF5OiAnZGRkIEREL01NJyxcblx0XHRcdFx0d2VlazogJ2RkZCBERC9NTScsXG5cdFx0XHRcdG1vbnRoOiAnZGRkJ1xuXHRcdFx0fSxcblx0XHRcdHRpdGxlRm9ybWF0OiB7XG5cdFx0XHQgICAgbW9udGg6ICdNTU1NIFlZWVknLCAvLyBTZXB0ZW1iZXIgMjAwOVxuXHRcdFx0ICAgIHdlZWs6IFwiTU1NTSBEIFlZWVlcIiwgLy8gU2VwIDEzIDIwMDlcblx0XHRcdCAgICBkYXk6ICdNTU1NIEQgWVlZWScgIC8vIFNlcHRlbWJlciA4IDIwMDlcblx0XHRcdH0sXG5cdFx0XHR3ZWVrTnVtYmVyVGl0bGU6ICcnLFxuXHRcdFx0YXhpc0Zvcm1hdDogJ0g6bW0nLFxuXHRcdFx0dGltZUZvcm1hdDogJ0g6bW0nLFxuXHRcdFx0bWluVGltZTogJzY6MDAnLFxuXHRcdFx0bWF4VGltZTogJzIzOjU5Jyxcblx0XHRcdGFsbERheVNsb3Q6IGZhbHNlLFxuXHRcdFx0ZGVmYXVsdFZpZXc6ICdtb250aCcsXG5cdCAgICAgICAgaGVpZ2h0OiA1MDAsXG5cdCAgICAgICAgZWRpdGFibGU6IGZhbHNlLFxuXHQgICAgICAgIHZpZXdSZW5kZXI6IGZ1bmN0aW9uKHZpZXcsIGVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIHN0YXJ0ID0gRGF0ZS5wYXJzZSh2aWV3LnN0YXJ0Ll9kKTtcblx0XHRcdFx0dmFyIGVuZCA9IERhdGUucGFyc2Uodmlldy5lbmQuX2QpO1xuXHRcdFx0XHQkc2NvcGUuY2FsZW5kYXJFdmVudHMgPSBbe1xuXHRcdCAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrXCJjYWxlbmRhcj9zdGFydD1cIitzdGFydCtcIiZlbmQ9XCIrZW5kXG5cdFx0ICAgICAgICB9XTtcbiAgICAgICAgXHR9LFxuXHRcdFx0ZXZlbnRDbGljazogJHNjb3BlLmFsZXJ0T25FdmVudENsaWNrLFxuXHQgICAgICAgIGV2ZW50RHJvcDogJHNjb3BlLmFsZXJ0T25Ecm9wLFxuXHQgICAgICAgIGV2ZW50UmVzaXplOiBmdW5jdGlvbih2aWV3LCBlbGVtZW50KSB7XG5cdFx0ICAgICAgICBjb25zb2xlLmxvZyh2aWV3KTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5jaGFuZ2VWaWV3ID0gZnVuY3Rpb24odmlldyxjYWxlbmRhcikge1xuXHQgICAgICBjYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ2NoYW5nZVZpZXcnLHZpZXcpO1xuXHQgICAgfTtcblx0XG5cdCAgICAkc2NvcGUucmVuZGVyQ2FsZW5kZXIgPSBmdW5jdGlvbihjYWxlbmRhcikge1xuXHQgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHQgICAgICAgY29uc29sZS5sb2coMTIzKTsgXG5cdFx0XHRcdGlmKGNhbGVuZGFyKXtcblx0XHRcdFx0Y2FsZW5kYXIuZnVsbENhbGVuZGFyKCdyZW5kZXInKTtcblx0XHRcdFx0fVxuXHQgICAgICAgfSwgMCk7XG5cdCAgICB9O1xuXHR9XG5cdFxuXHRpbml0KCk7XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhbXBpb25zaGlwcycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNoYW1waW9uc2hpcHNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENoYW1waW9uc2hpcHNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcbiAgICAgICAgQ2hhbXBpb25zaGlwc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhbXBpb25zaGlwcyA9IHJlc3BvbnNlLmNoYW1waW9uc2hpcHM7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG5cblxufSlcbi5jb250cm9sbGVyKFwiQ2hhbXBpb25zaGlwQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDaGFtcGlvbnNoaXBzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbmQoKXtcbiAgICAgICAgQ2hhbXBpb25zaGlwc0ZhY3RvcnkuZmluZCgkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGFtcGlvbnNoaXBzID0gcmVzcG9uc2UuY2hhbXBpb25zaGlwcztcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2hhbXBpb25zaGlwcycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbn0pXG5cbi5mYWN0b3J5KCdDaGFtcGlvbnNoaXBzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHBhZ2UsIGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NoYW1waW9uc2hpcHMnO1xuXG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjaGFtcGlvbnNoaXBzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cC8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHNpZ251cClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jbHVicycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNsdWJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBDbHVic0ZhY3Rvcnkpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuXHRzZWxmLnNlbGVjdGVkY2x1YiA9IHt9O1xuXHRzZWxmLm5ld19jbHViID0gbnVsbDtcblx0c2VsZi5hZGRfY2x1YnNfbnIgPSAnJztcblx0c2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG5cdHNlbGYuYWRkX2FkbWluID0gbnVsbDtcblxuXHRmdW5jdGlvbiBsb2FkVXNlckNsdWIoKSB7XG5cdFx0Q2x1YnNGYWN0b3J5LmxvYWRVc2VyQ2x1YigpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuc2VsZWN0ZWRDbHVicyA9ICcnO1xuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi5zZWFyY2hGb3JDbHVicyA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5LCBjbHViKVxuXHR7XG5cdFx0cmV0dXJuIENsdWJzRmFjdG9yeVxuXHRcdFx0LnNlYXJjaEZvckNsdWJzKHNlYXJjaFF1ZXJ5KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ3dhcm5pbmcnKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuZm91bmRNYXRjaCA9IChyZXNwb25zZS5kYXRhLmNsdWJzLmxlbmd0aCA+IDApO1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YS5jbHVicy5tYXAoZnVuY3Rpb24oaXRlbSl7XG5cdFx0XHRcdFx0aXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXR1cm4gaXRlbTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLnNlbGVjdENsdWIgPSBmdW5jdGlvbigkaXRlbSlcblx0e1xuXHRcdGlmKCRpdGVtLmFscmVhZHlTZWxlY3RlZCA9PT0gdHJ1ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdHNlbGYubm9NYXRjaGluZ0NsdWJzID0gbnVsbDtcblx0XHRzZWxmLm5ld19jbHViID0gJGl0ZW07XG5cdH07XG5cblx0c2VsZi5ub0NsdWJzRm91bmQgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IHRydWU7XG5cdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdH07XG5cblx0c2VsZi5hZGRVc2VyVG9DbHVicyA9IGZ1bmN0aW9uKGNsdWIpXG5cdHtcblx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlclRvQ2x1YnMoY2x1Yi5pZClcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdFx0XHRcdHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHNlbGYuYWRkTmV3Q2x1YiA9IGZ1bmN0aW9uKClcblx0e1xuXHRcdGlmKCFzZWxmLnNlYXJjaFF1ZXJ5IHx8ICFzZWxmLmFkZF9jbHVic19ucikgcmV0dXJuIGZhbHNlO1xuXHRcdHZhciBjbHViID0ge1xuXHRcdFx0bmFtZTogc2VsZi5zZWFyY2hRdWVyeSxcblx0XHRcdGNsdWJzX25yOiBzZWxmLmFkZF9jbHVic19uclxuXHRcdH07XG5cblx0XHRDbHVic0ZhY3RvcnkuYWRkTmV3Q2x1YihjbHViKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cdFx0XHRcdHNlbGYuYWRkX2NsdWJzX25yID0gJyc7XG5cdFx0XHRcdHNlbGYubmV3X2NsdWIgPSBudWxsO1xuXHRcdFx0XHRzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcblx0XHRcdFx0c2VsZi5jbHViID0gcmVzcG9uc2U7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZFVzZXJBc0FkbWluID0gZnVuY3Rpb24oYWRtaW4pXG5cdHtcblx0XHRpZihhZG1pbil7XG5cdFx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlckFzQWRtaW4oYWRtaW4pXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0bG9hZFVzZXJDbHViKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xuXG5cdHNlbGYuZGVsZXRlVXNlckFzQWRtaW4gPSBmdW5jdGlvbihhZG1pbilcblx0e1xuXHRcdGlmKGFkbWluKXtcblx0XHRcdENsdWJzRmFjdG9yeS5kZWxldGVVc2VyQXNBZG1pbihhZG1pbilcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRsb2FkVXNlckNsdWIoKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG5cblx0bG9hZFVzZXJDbHViKCk7XG59KVxuXG4uY29udHJvbGxlcihcIkFkbWluQ2x1YnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDbHVic0ZhY3Rvcnkpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5maWx0ZXIgPSB7XG5cdFx0c2VhcmNoOiAnJyxcblx0XHRoaWRlX3dpdGhvdXRfdXNlcnM6IDEsXG5cdFx0aGlkZV93aXRob3V0X2FkbWluczogbnVsbFxuXHR9O1xuXG5cdHNlbGYuaGlkZUNsdWJzV2l0aG91dFVzZXJzID0gZnVuY3Rpb24oY2x1Yil7XG5cdFx0aWYoc2VsZi5maWx0ZXIuaGlkZV93aXRob3V0X3VzZXJzICYmIGNsdWIudXNlcnNfY291bnQpe1xuXHRcdFx0cmV0dXJuIGNsdWI7XG5cdFx0fWVsc2UgaWYoIXNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF91c2Vycyl7XG5cdFx0XHRyZXR1cm4gY2x1Yjtcblx0XHR9XG5cdH07XG5cdHNlbGYuaGlkZUNsdWJzV2l0aG91dEFkbWlucyA9IGZ1bmN0aW9uKGNsdWIpe1xuXHRcdGlmKHNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF9hZG1pbnMgJiYgY2x1Yi5hZG1pbnNfY291bnQpe1xuXHRcdFx0cmV0dXJuIGNsdWI7XG5cdFx0fWVsc2UgaWYoIXNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF9hZG1pbnMpe1xuXHRcdFx0cmV0dXJuIGNsdWI7XG5cdFx0fVxuXHR9O1xuXG5cdGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuXHRcdENsdWJzRmFjdG9yeS5sb2FkKHBhZ2UpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuY2x1YnMgPSByZXNwb25zZS5jbHVicztcblx0XHRcdH0pO1xuXHR9XG5cdGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuXHR0aGlzLnBhZ2UgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMucGFnZSwgMTApO1xuXHR0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcblx0dGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuXHRzb3J0TGlzdCgpO1xuXHR1cGRhdGVQYWdlKCk7XG5cblxuXHR0aGlzLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VsZi5wYWdlKys7XG5cdFx0dXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuXHRcdCRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuXHR9O1xuXHR0aGlzLnByZXZQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHNlbGYucGFnZSA+IDApIHtcblx0XHRcdHNlbGYucGFnZS0tO1xuXHRcdFx0dXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuXHRcdFx0JHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLnNvcnRDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG5cdFx0c29ydExpc3QoKTtcblx0XHQkc3RhdGUuZ28oJy4nLCB7c29ydDogc2VsZi5zb3J0fSwge25vdGlmeTogZmFsc2V9KTtcblx0fTtcblxufSlcbi5jb250cm9sbGVyKFwiQWRtaW5DbHViQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdGltZW91dCwgQ2x1YnNGYWN0b3J5KSB7XG5cdHZhciBzZWxmID0gdGhpcztcblx0c2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuXHRzZWxmLnNlbGVjdGVkY2x1YiA9IHt9O1xuXG5cdGlmKCEkc3RhdGVQYXJhbXMuaWQpICRzdGF0ZS5nbygnYWRtaW4uY2x1YnMnKTtcblxuXHRmdW5jdGlvbiBmaW5kKCl7XG5cdFx0Q2x1YnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZS5jbHViO1xuXHRcdFx0fSlcblx0XHRcdC5lcnJvcihmdW5jdGlvbigpe1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2FkbWluLmNsdWJzJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi51cGRhdGVDbHViID0gZnVuY3Rpb24oY2x1Yil7XG5cdFx0c2VsZi5zdGF0ZSA9ICd1cGRhdGluZyc7XG5cdFx0Q2x1YnNGYWN0b3J5LnVwZGF0ZUNsdWIoY2x1Yilcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcblx0XHRcdFx0c2VsZi5jbHVicy5jbHVicyA9IHJlc3BvbnNlLmNsdWJzO1xuXHRcdFx0XHRzZWxmLnN0YXRlID0gJ3VwZGF0ZWQnO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2NsdWInLCAoe2lkOiBjbHViLmlkfSkpO1xuXHRcdFx0fSlcblx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmRlbGV0ZUNsdWIgPSBmdW5jdGlvbihjbHViKXtcblx0XHRDbHVic0ZhY3RvcnkuZGVsZXRlQ2x1YihjbHViKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2NsdWJzJyk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLnNlYXJjaEZvckNsdWJzID0gZnVuY3Rpb24oc2VhcmNoUXVlcnksIGNsdWIpXG5cdHtcblx0XHRyZXR1cm4gQ2x1YnNGYWN0b3J5XG5cdFx0XHQuc2VhcmNoRm9yQ2x1YnMoc2VhcmNoUXVlcnkpXG5cdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnd2FybmluZycpO1xuXHRcdFx0fSlcblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5mb3VuZE1hdGNoID0gKHJlc3BvbnNlLmRhdGEuY2x1YnMubGVuZ3RoID4gMCk7XG5cdFx0XHRcdHJldHVybiByZXNwb25zZS5kYXRhLmNsdWJzLm1hcChmdW5jdGlvbihpdGVtKXtcblx0XHRcdFx0XHRpdGVtLmFscmVhZHlTZWxlY3RlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdGlmKGNsdWIuaWQgPT0gaXRlbS5pZCkgaXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdHJldHVybiBpdGVtO1xuXHRcdFx0XHR9KTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHNlbGYuc2VsZWN0Q2x1YiA9IGZ1bmN0aW9uKCRpdGVtKVxuXHR7XG5cdFx0c2VsZi5zZWxlY3RlZGNsdWIgPSAkaXRlbTtcblx0fTtcblxuXHRzZWxmLm1lcmdlQ2x1YnMgPSBmdW5jdGlvbihjbHVic0lkRnJvbSwgY2x1YnNJZFRvKXtcblx0XHRpZihjbHVic0lkRnJvbSAmJiBjbHVic0lkVG8pe1xuXHRcdFx0Q2x1YnNGYWN0b3J5Lm1lcmdlQ2x1YnMoY2x1YnNJZEZyb20sIGNsdWJzSWRUbylcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG5cdFx0XHRcdFx0JHN0YXRlLmdvKCdhZG1pbi5jbHVicy5zaG93Jywge2lkOmNsdWJzSWRUb30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fTtcblxuXHRmaW5kKCk7XG59KVxuXG4uZmFjdG9yeSgnQ2x1YnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuXHRyZXR1cm4ge1xuXHRcdGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuXHRcdFx0dmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydjbHVicyc7XG5cblx0XHRcdGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG5cdFx0XHRpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzLycraWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oY2x1Yilcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHR1cGRhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy8nK2NsdWIuaWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKGNsdWIpXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvJytjbHViLmlkLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGxvYWRVc2VyQ2x1YjogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2dldFVzZXJDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGRVc2VyVG9DbHViczogZnVuY3Rpb24oY2x1YnNfaWQpe1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2FkZFVzZXJUb0NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19pZCc6IGNsdWJzX2lkfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGROZXdDbHViOiBmdW5jdGlvbihjbHViKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy9hZGROZXdDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19ucic6IGNsdWIuY2x1YnNfbnIsICduYW1lJzogY2x1Yi5uYW1lfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRzZWFyY2hGb3JDbHViczogZnVuY3Rpb24oZmlsdGVyKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvc2VhcmNoJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydzZWFyY2hRdWVyeSc6IGZpbHRlcn0pXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0YWRkVXNlckFzQWRtaW46IGZ1bmN0aW9uKGFkbWluKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvYWRkVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGRlbGV0ZVVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvZGVsZXRlVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdG1lcmdlQ2x1YnM6IGZ1bmN0aW9uKGNsdWJzSWRGcm9tLCBjbHVic0lkVG8pIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy9tZXJnZScsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKHsnY2x1YnNJZEZyb20nOiBjbHVic0lkRnJvbSwgJ2NsdWJzSWRUbyc6IGNsdWJzSWRUb30pXG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbXBldGl0aW9ucycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNvbXBldGl0aW9uc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ29tcGV0aXRpb25zRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlUGFnZShwYWdlKSB7XG4gICAgICAgIENvbXBldGl0aW9uc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuICAgIHRoaXMucGFnZSA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5wYWdlLCAxMCk7XG4gICAgdGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG4gICAgdGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuICAgIHNvcnRMaXN0KCk7XG4gICAgdXBkYXRlUGFnZSgpO1xuXG5cbiAgICB0aGlzLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYucGFnZSsrO1xuICAgICAgICB1cGRhdGVQYWdlKHNlbGYucGFnZSk7XG4gICAgICAgICRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuICAgIH07XG4gICAgdGhpcy5wcmV2UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2VsZi5wYWdlID4gMCkge1xuICAgICAgICAgICAgc2VsZi5wYWdlLS07XG4gICAgICAgICAgICB1cGRhdGVQYWdlKHNlbGYucGFnZSk7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zb3J0Q2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzb3J0TGlzdCgpO1xuICAgICAgICAkc3RhdGUuZ28oJy4nLCB7c29ydDogc2VsZi5zb3J0fSwge25vdGlmeTogZmFsc2V9KTtcbiAgICB9O1xufSlcbi5jb250cm9sbGVyKFwiQ29tcGV0aXRpb25Db250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR0aW1lb3V0LCBDb21wZXRpdGlvbnNGYWN0b3J5LCBTaWdudXBzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZmluZCgpe1xuICAgICAgICBDb21wZXRpdGlvbnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuICAgICAgICAgICAgICAgIHNlbGYudXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbnMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi5jcmVhdGVTaWdudXAgPSBmdW5jdGlvbih3ZWFwb25jbGFzc2VzX2lkKXtcbiAgICAgICAgdmFyIHNpZ251cCA9IHtcbiAgICAgICAgICAgICdjb21wZXRpdGlvbnNfaWQnOiBzZWxmLmNvbXBldGl0aW9ucy5pZCxcbiAgICAgICAgICAgICd3ZWFwb25jbGFzc2VzX2lkJzogd2VhcG9uY2xhc3Nlc19pZCxcbiAgICAgICAgICAgICd1c2Vyc19pZCc6IHNlbGYudXNlci51c2VyX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmNyZWF0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uud2VhcG9uY2xhc3Nlc19pZCA9IHBhcnNlSW50KHJlc3BvbnNlLndlYXBvbmNsYXNzZXNfaWQpO1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zLnVzZXJzaWdudXBzLnB1c2gocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVTaWdudXAgPSBmdW5jdGlvbihzaWdudXApe1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5kZWxldGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzaGlmdCBmcm9tIHRoZSBjYWxlbmRhci5cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5jb21wZXRpdGlvbnMudXNlcnNpZ251cHMsIGZ1bmN0aW9uKHNpZ251cHMsIGluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwcy5pZCA9PSBzaWdudXAuaWQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zLnVzZXJzaWdudXBzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmaW5kKCk7XG59KVxuXG4uZmFjdG9yeSgnQ29tcGV0aXRpb25zRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHBhZ2UsIGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucyc7XG5cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG4gICAgICAgICAgICBpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgW10pXG5cbiAgICAuY29udHJvbGxlcihcIkRhc2hib2FyZENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCl7XG4gICAgICAgICAgICAkc2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgKGZ1bmN0aW9uKGQsIHMsIGlkKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgRkIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHZhciBqcywgZmpzID0gZC5nZXRFbGVtZW50c0J5VGFnTmFtZShzKVswXTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAvL2lmIChkLmdldEVsZW1lbnRCeUlkKGlkKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzID0gZC5jcmVhdGVFbGVtZW50KHMpOyBqcy5pZCA9IGlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGpzLnNyYyA9IFwiLy9jb25uZWN0LmZhY2Vib29rLm5ldC9zdl9TRS9zZGsuanMjeGZibWw9MSZ2ZXJzaW9uPXYyLjYmYXBwSWQ9OTU2ODY3NTI0Mzk4MjIyXCI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZmpzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGpzLCBmanMpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfShkb2N1bWVudCwgJ3NjcmlwdCcsICdmYWNlYm9vay1qc3NkaycpKTtcbiAgICAgICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICAgICAgfSk7IFxuXG4gICAgfSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZXJyb3JoYW5kbGVyJywgW10pXG5cblx0LmNvbnRyb2xsZXIoXCJFcnJvckhhbmRsZXJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgRXJyb3JIYW5kbGVyRmFjdG9yeSl7XG5cblx0fSlcblxuXHQuZmFjdG9yeSgnRXJyb3JIYW5kbGVyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cblx0XHRyZXR1cm4ge1xuXG5cdFx0XHRyZXBvcnRFcnJvcjogZnVuY3Rpb24oZXJyb3IsIGNhdXNlKSB7XG5cdFx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnZXJyb3IvcmVwb3J0Jyxcblx0XHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0XHRkYXRhOiAkLnBhcmFtKHtlcnJvcjogZXJyb3IsIGNhdXNlOiBjYXVzZX0pXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHR9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAucHJlbWl1bScsIFtdKVxuLmNvbnRyb2xsZXIoXCJQcmVtaXVtQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc2V0dGluZ3MnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJTZXR0aW5nc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIFNldHRpbmdzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYuY2FuY2VsYWNjb3VudCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIFNldHRpbmdzRmFjdG9yeS5jYW5jZWxhY2NvdW50KClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5sb2dvdXQnKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UuZXJyb3IpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcbn0pXG5cbi5jb250cm9sbGVyKFwiUGFzc3dvcmRDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBTZXR0aW5nc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLnJlc2V0ID0ge1xuICAgICAgICAnY3VycmVudF9wYXNzd29yZCc6JycsXG4gICAgICAgICdwYXNzd29yZCc6ICcnLFxuICAgICAgICAncGFzc3dvcmRfY29uZmlybWF0aW9uJzonJ1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZVBhc3N3b3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFNldHRpbmdzRmFjdG9yeS51cGRhdGVQYXNzd29yZChzZWxmLnJlc2V0KVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYucmVzZXQgPSB7XG4gICAgICAgICAgICAgICAgICAgICdjdXJyZW50X3Bhc3N3b3JkJzonJyxcbiAgICAgICAgICAgICAgICAgICAgJ3Bhc3N3b3JkJzogJycsXG4gICAgICAgICAgICAgICAgICAgICdwYXNzd29yZF9jb25maXJtYXRpb24nOicnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxufSlcblxuLmNvbnRyb2xsZXIoXCJVc2VyUHJvZmlsZUNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIFNldHRpbmdzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbG9hZFVzZXJwcm9maWxlKCkge1xuICAgICAgICBTZXR0aW5nc0ZhY3RvcnkubG9hZFVzZXJwcm9maWxlKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJwcm9maWxlID0gcmVzcG9uc2UudXNlcjtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuZGF0ZVBpY2tlck9wdGlvbnMgPSB7c3RhcnRpbmdEYXk6IDEsIHN0YXJ0OiB7b3BlbmVkOiBmYWxzZX0sIGVuZDoge29wZW5lZDogZmFsc2V9fTtcblxuICAgIHNlbGYuc2F2ZVVzZXJwcm9maWxlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgU2V0dGluZ3NGYWN0b3J5LnNhdmVVc2VycHJvZmlsZShzZWxmLnVzZXJwcm9maWxlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd1c2VyJywgSlNPTi5zdHJpbmdpZnkocmVzcG9uc2UudXNlcikpO1xuICAgICAgICAgICAgICAgIHNlbGYudXNlcnByb2ZpbGUgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2V0dGluZ3MudXNlcicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWxVc2VycHJvZmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxvYWRVc2VycHJvZmlsZSgpO1xuICAgICAgICAkc3RhdGUuZ28oJ3NldHRpbmdzLnVzZXInKTtcbiAgICB9O1xuXG4gICAgbG9hZFVzZXJwcm9maWxlKCk7XG5cbn0pXG5cbi5jb250cm9sbGVyKFwiVXNlckNsdWJzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG4gICAgc2VsZi5uZXdfY2x1YiA9IG51bGw7XG4gICAgc2VsZi5hZGRfY2x1YnNfbnIgPSAnJztcbiAgICBzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIGxvYWRVc2VyQ2x1YnMoKSB7XG4gICAgICAgIENsdWJzRmFjdG9yeS5sb2FkVXNlckNsdWJzKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNlbGVjdGVkQ2x1YnMgPSAnJztcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLnNlYXJjaEZvckNsdWJzID0gZnVuY3Rpb24oc2VhcmNoUXVlcnksIGNsdWJzKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIENsdWJzRmFjdG9yeVxuICAgICAgICAgICAgLnNlYXJjaEZvckNsdWJzKHNlYXJjaFF1ZXJ5KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnd2FybmluZycpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmZvdW5kTWF0Y2ggPSAocmVzcG9uc2UuZGF0YS5jbHVicy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5jbHVicy5tYXAoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjbHVicywgZnVuY3Rpb24oY2x1Yil7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5zZWxlY3RDbHViID0gZnVuY3Rpb24oJGl0ZW0pXG4gICAge1xuICAgICAgICBpZigkaXRlbS5hbHJlYWR5U2VsZWN0ZWQgPT09IHRydWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2VsZi5ub01hdGNoaW5nQ2x1YnMgPSBudWxsO1xuICAgICAgICBzZWxmLm5ld19jbHViID0gJGl0ZW07IFxuICAgIH07XG5cbiAgICBzZWxmLm5vQ2x1YnNGb3VuZCA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIGNvbnNvbGUubG9nKDEyMzQpO1xuICAgICAgICBzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IHRydWU7XG4gICAgICAgIHNlbGYubmV3X2NsdWIgPSBudWxsO1xuICAgIH07XG5cbiAgICBzZWxmLmFkZFVzZXJUb0NsdWJzID0gZnVuY3Rpb24oY2x1YilcbiAgICB7XG4gICAgICAgIENsdWJzRmFjdG9yeS5hZGRVc2VyVG9DbHVicyhjbHViLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYubmV3X2NsdWIgPSBudWxsO1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YnMgPSByZXNwb25zZS5jbHVicztcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmFkZE5ld0NsdWIgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICBpZighc2VsZi5zZWFyY2hRdWVyeSB8fCAhc2VsZi5hZGRfY2x1YnNfbnIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIGNsdWIgPSB7XG4gICAgICAgICAgICBuYW1lOiBzZWxmLnNlYXJjaFF1ZXJ5LFxuICAgICAgICAgICAgY2x1YnNfbnI6IHNlbGYuYWRkX2NsdWJzX25yXG4gICAgICAgIH07XG5cbiAgICAgICAgQ2x1YnNGYWN0b3J5LmFkZE5ld0NsdWIoY2x1YilcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfY2x1YnNfbnIgPSAnJztcbiAgICAgICAgICAgICAgICBzZWxmLm5ld19jbHViID0gbnVsbDtcbiAgICAgICAgICAgICAgICBzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgbG9hZFVzZXJDbHVicygpO1xufSlcblxuLmNvbnRyb2xsZXIoXCJJbnZpdGVDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBJbnZpdGVGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmxvYWRJbnZpdGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEludml0ZUZhY3RvcnkubG9hZEludml0ZXMoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuaW52aXRlcyA9IHJlc3BvbnNlLmludml0ZXM7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuICAgIHNlbGYubG9hZEludml0ZXMoKTtcblxuICAgIHNlbGYuaW52aXRlID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgSW52aXRlRmFjdG9yeVxuICAgICAgICAgICAgLmludml0ZShzZWxmLnVzZXIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VyID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgbGFzdG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogJydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNlbGYubG9hZEludml0ZXMoKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xufSlcblxuLmZhY3RvcnkoXCJJbnZpdGVGYWN0b3J5XCIsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZEludml0ZXM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsndXNlcnMvaW52aXRlJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52aXRlOiBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzL2ludml0ZScsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh1c2VyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KVxuXG4uZmFjdG9yeShcIlNldHRpbmdzRmFjdG9yeVwiLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWRVc2VycHJvZmlsZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXNlcicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhdmVVc2VycHJvZmlsZTogZnVuY3Rpb24odXNlcil7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGFuZ3VsYXIuY29weSh1c2VyKTtcbiAgICAgICAgICAgIGRhdGEuYmlydGhkYXkgPSBkYXRhLmJpcnRoZGF5KyctMDEtMDEnO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2F1dGhlbnRpY2F0ZS91c2VyJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVQYXNzd29yZDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXBkYXRlUGFzc3dvcmQnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oY3JlZGVudGlhbHMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYW5jZWxhY2NvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYXV0aGVudGljYXRlL2NhbmNlbEFjY291bnQnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc2lnbnVwcycsIFtdKVxuXG4uY29udHJvbGxlcihcIlNpZ251cHNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIFNpZ251cHNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG59KVxuLmNvbnRyb2xsZXIoXCJTaWdudXBDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR0aW1lb3V0LCBTaWdudXBzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbmQoKXtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkuZmluZCgkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzID0gcmVzcG9uc2Uuc2lnbnVwcztcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2lnbnVwcycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLnVwZGF0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAndXBkYXRpbmcnO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS51cGRhdGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc2lnbnVwcy5wYXJ0aWNpcGF0ZV9vdXRfb2ZfY29tcGV0aXRpb24gPSBwYXJzZUludChyZXNwb25zZS5zaWdudXBzLnBhcnRpY2lwYXRlX291dF9vZl9jb21wZXRpdGlvbik7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc2lnbnVwcy53ZWFwb25jbGFzc2VzX2lkID0gcGFyc2VJbnQocmVzcG9uc2Uuc2lnbnVwcy53ZWFwb25jbGFzc2VzX2lkKTtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi5zdGF0ZSA9ICd1cGRhdGVkJztcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NpZ251cCcsICh7aWQ6IHNpZ251cC5pZH0pKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVTaWdudXAgPSBmdW5jdGlvbihzaWdudXApe1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5kZWxldGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2lnbnVwcycpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgICBmaW5kKCk7XG59KVxuLmZhY3RvcnkoJ1NpZ251cHNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnc2lnbnVwJztcblxuICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwLycraWQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjcmVhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydzaWdudXAnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB1cGRhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cC8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oc2lnbnVwKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZGVsZXRlU2lnbnVwOiBmdW5jdGlvbihzaWdudXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydzaWdudXAvJytzaWdudXAuaWQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAudGVhbXMnLCBbXSlcbi5jb250cm9sbGVyKCdUZWFtU2lnbnVwQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENvbXBldGl0aW9uc0ZhY3RvcnksIFRlYW1zRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbG9hZFRlYW1zKCkge1xuICAgICAgICBpZigkc3RhdGVQYXJhbXMudGVhbXNfaWQpe1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LmxvYWQoJHN0YXRlUGFyYW1zLmlkLCAkc3RhdGVQYXJhbXMudGVhbXNfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRlYW1zID0gcmVzcG9uc2UudGVhbXM7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG5cbiAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGYudGVhbXMuc2lnbnVwcywgZnVuY3Rpb24oc2lnbnVwLCBrZXkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDEpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc19maXJzdCAgPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gMikgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX3NlY29uZCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSAzKSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfdGhpcmQgPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gNCkgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX2ZvdXJ0aCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSA1KSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfZmlmdGggPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGVhbXMuc2lnbnVwcyA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5pZCwgJHN0YXRlUGFyYW1zLnRlYW1zX2lkKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRUZWFtID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWFwb25jbGFzc2VzX2lkOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYW1zX3NpZ251cHNfZmlyc3Q6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX3NlY29uZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYW1zX3NpZ251cHNfdGhpcmQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX2ZvdXJ0aDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYW1zX3NpZ251cHNfZmlmdGg6IG51bGxcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50ZWFtcyA9IHJlc3BvbnNlLnRlYW1zO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHNlbGYuY3JlYXRlVGVhbSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKHNlbGYuYWRkVGVhbS5uYW1lICYmIHNlbGYuYWRkVGVhbS53ZWFwb25jbGFzc2VzX2lkKXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS5zdG9yZSgkc3RhdGVQYXJhbXMuaWQsIHNlbGYuYWRkVGVhbSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLCB7aWQ6ICRzdGF0ZVBhcmFtcy5pZH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVzcG9uc2UucmVkaXJlY3RfdG9fZWRpdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmVkaXQnLCB7aWQ6ICRzdGF0ZVBhcmFtcy5pZCwgdGVhbXNfaWQ6IHJlc3BvbnNlLnJlZGlyZWN0X3RvX2VkaXR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBzZWxmLnVwZGF0ZVRlYW0gPSBmdW5jdGlvbih0ZWFtKXtcbiAgICAgICAgaWYoc2VsZi50ZWFtcy5uYW1lICYmIHNlbGYudGVhbXMud2VhcG9uY2xhc3Nlc19pZCl7XG4gICAgICAgICAgICBUZWFtc0ZhY3RvcnkudXBkYXRlKCRzdGF0ZVBhcmFtcy5pZCwgc2VsZi50ZWFtcy5pZCwgdGVhbSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLCB7aWQ6ICRzdGF0ZVBhcmFtcy5pZH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVzcG9uc2UucmVkaXJlY3RfdG9fZWRpdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmVkaXQnLCB7aWQ6ICRzdGF0ZVBhcmFtcy5pZCwgdGVhbXNfaWQ6IHJlc3BvbnNlLnJlZGlyZWN0X3RvX2VkaXR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuY2FuY2VsVGVhbSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgfTtcblxuICAgIHNlbGYuZGVsZXRlVGVhbSA9IGZ1bmN0aW9uKHRlYW1zX2lkKXtcbiAgICAgICAgaWYodGVhbXNfaWQpe1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LmRlbGV0ZSgkc3RhdGVQYXJhbXMuaWQsIHRlYW1zX2lkKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLCB7aWQ6ICRzdGF0ZVBhcmFtcy5pZH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBsb2FkVGVhbXMoKTtcblxufSlcbi5mYWN0b3J5KCdUZWFtc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAoY29tcGV0aXRpb25zX2lkLCB0ZWFtc19pZCkge1xuICAgICAgICAgICAgaWYoY29tcGV0aXRpb25zX2lkICYmIHRlYW1zX2lkKXtcbiAgICAgICAgICAgICAgICB1cmwgPSBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMvJyt0ZWFtc19pZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHN0b3JlOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHRlYW0pe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh0ZWFtKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHRlYW1zX2lkLCB0ZWFtKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcy8nK3RlYW1zX2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0odGVhbSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZTogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkLCB0ZWFtc19pZCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMvJyt0ZWFtc19pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAudXNlcnMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJVc2Vyc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIFVzZXJzRmFjdG9yeSl7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmZpbHRlciA9IHtcblx0XHRzZWFyY2g6ICcnLFxuXHRcdGFjdGl2ZTogMVxuXHR9O1xuXG5cdGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuXHRcdFVzZXJzRmFjdG9yeS5sb2FkKHBhZ2UpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYudXNlcnMgPSByZXNwb25zZS51c2Vycztcblx0XHRcdH0pO1xuXHR9XG5cdGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuXHR0aGlzLnBhZ2UgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMucGFnZSwgMTApO1xuXHR0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcblx0dGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuXHRzb3J0TGlzdCgpO1xuXHR1cGRhdGVQYWdlKCk7XG5cblxuXHR0aGlzLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0c2VsZi5wYWdlKys7XG5cdFx0dXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuXHRcdCRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuXHR9O1xuXHR0aGlzLnByZXZQYWdlID0gZnVuY3Rpb24oKSB7XG5cdFx0aWYgKHNlbGYucGFnZSA+IDApIHtcblx0XHRcdHNlbGYucGFnZS0tO1xuXHRcdFx0dXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuXHRcdFx0JHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG5cdFx0fVxuXHR9O1xuXHR0aGlzLnNvcnRDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG5cdFx0c29ydExpc3QoKTtcblx0XHQkc3RhdGUuZ28oJy4nLCB7c29ydDogc2VsZi5zb3J0fSwge25vdGlmeTogZmFsc2V9KTtcblx0fTtcblxufSlcblxuLmZhY3RvcnkoJ1VzZXJzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cblx0cmV0dXJuIHtcblx0XHRsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcblx0XHRcdHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsndXNlcnMnO1xuXG5cdFx0XHRpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuXHRcdFx0aWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogdXJsLFxuXHRcdFx0XHRoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKyd1c2Vycy8nK2lkLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH07XG59KTtcbiIsIi8qKlxuICogR2xvYmFsIGVycm9yIGhhbmRsaW5nIGZvciB0b3AgbGV2ZWwgZXJyb3JzLlxuICogQ2F0Y2hlcyBhbnkgZXhjZXB0aW9ucyBhbmQgc2VuZHMgdGhlbSB0byB0aGUgJHJvb3RTY29wZS5yZXBvcnRFcnJvciBmdW5jdGlvbi5cbiAqL1xuYXBwLmNvbmZpZyhmdW5jdGlvbigkcHJvdmlkZSkge1xuICAgICRwcm92aWRlLmRlY29yYXRvcihcIiRleGNlcHRpb25IYW5kbGVyXCIsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSwgJGluamVjdG9yKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGV4Y2VwdGlvbiwgY2F1c2UpIHtcblx0XHRcdCRkZWxlZ2F0ZShleGNlcHRpb24sIGNhdXNlKTtcblx0XHRcdFxuXHRcdFx0dmFyICRyb290U2NvcGUgPSAkaW5qZWN0b3IuZ2V0KFwiJHJvb3RTY29wZVwiKTtcblx0XHRcdCRyb290U2NvcGUucmVwb3J0RXJyb3IoZXhjZXB0aW9uLCBjYXVzZSk7XG5cdFx0fTtcblx0fSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uICgkaHR0cFByb3ZpZGVyKSB7XG4gICAgJGh0dHBQcm92aWRlci5pbnRlcmNlcHRvcnMucHVzaChmdW5jdGlvbiAoJHEsICRpbmplY3RvciwgJHJvb3RTY29wZSkge1xuICAgICAgICByZXR1cm4ge1xuXG4gICAgICAgICAgICByZXF1ZXN0OiBmdW5jdGlvbiAoY29uZmlnKSB7XG4gICAgICAgICAgICAgICAgLy8gTWFrZSBzdXJlIHRoZSB0b2tlbiBpcyBzZXQgZm9yIHRoZSByZXF1ZXN0LlxuICAgICAgICAgICAgICAgIHZhciB0b2tlbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuICAgICAgICAgICAgICAgIGlmKHRva2VuICE9PSBudWxsKXtcbiAgICAgICAgICAgICAgICAgICAgY29uZmlnLmhlYWRlcnMuQXV0aG9yaXphdGlvbiA9ICdCZWFyZXIgJyArIHRva2VuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzWydYLVJlcXVlc3RlZC1XaXRoJ10gPSAnWE1MSHR0cFJlcXVlc3QnO1xuXG4gICAgICAgICAgICAgICAgcmV0dXJuIGNvbmZpZztcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8vIERldGVjdCBpZiB0aGUgdG9rZW4gaGFzIGV4cGlyZWQgb24gYSBodHRwIGNhbGwuIFJlZnJlc2ggdGhlIHRva2VuIGFuZCB0cnkgYWdhaW4uXG4gICAgICAgICAgICByZXNwb25zZUVycm9yOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHZhciBBdXRoRmFjdG9yeSA9ICRpbmplY3Rvci5nZXQoJ0F1dGhGYWN0b3J5Jyk7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXRlID0gJGluamVjdG9yLmdldCgnJHN0YXRlJyk7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZGF0YSAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ3Rva2VuX2V4cGlyZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQXV0aEZhY3RvcnkuYXR0ZW1wdFJlZnJlc2hUb2tlbihyZXNwb25zZS5jb25maWcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ3VzZXJfaW5hY3RpdmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLmRhdGEubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBBdXRoRmFjdG9yeS5sb2dvdXQoKTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ3VzZXJfaXNfbm90X2FkbWluJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5kYXRhLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ2FwaV92ZXJzaW9uX3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UuZGF0YS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmVycm9yICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IgPT0gJ3VzZXJfaW5hY3RpdmUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhGYWN0b3J5LmxvZ291dCgpO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAocmVzcG9uc2UuZXJyb3IgPT0gJ3VzZXJfaXNfbm90X2FkbWluJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAocmVzcG9uc2UuZXJyb3IgPT0gJ2FwaV92ZXJzaW9uX3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcbiAgICB9KTtcblxufSk7IiwiLypcbiogIEFuZ3VsYXJKcyBGdWxsY2FsZW5kYXIgV3JhcHBlciBmb3IgdGhlIEpRdWVyeSBGdWxsQ2FsZW5kYXJcbiogIEFQSSBAIGh0dHA6Ly9hcnNoYXcuY29tL2Z1bGxjYWxlbmRhci9cbipcbiogIEFuZ3VsYXIgQ2FsZW5kYXIgRGlyZWN0aXZlIHRoYXQgdGFrZXMgaW4gdGhlIFtldmVudFNvdXJjZXNdIG5lc3RlZCBhcnJheSBvYmplY3QgYXMgdGhlIG5nLW1vZGVsIGFuZCB3YXRjaGVzIGl0IGRlZXBseSBjaGFuZ2VzLlxuKiAgICAgICBDYW4gYWxzbyB0YWtlIGluIG11bHRpcGxlIGV2ZW50IHVybHMgYXMgYSBzb3VyY2Ugb2JqZWN0KHMpIGFuZCBmZWVkIHRoZSBldmVudHMgcGVyIHZpZXcuXG4qICAgICAgIFRoZSBjYWxlbmRhciB3aWxsIHdhdGNoIGFueSBldmVudFNvdXJjZSBhcnJheSBhbmQgdXBkYXRlIGl0c2VsZiB3aGVuIGEgY2hhbmdlIGlzIG1hZGUuXG4qXG4qL1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuY2FsZW5kYXInLCBbXSlcbiAgLmNvbnN0YW50KCd1aUNhbGVuZGFyQ29uZmlnJywge30pXG4gIC5jb250cm9sbGVyKCd1aUNhbGVuZGFyQ3RybCcsIFsnJHNjb3BlJywgJyR0aW1lb3V0JywgJyRsb2NhbGUnLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0LCAkbG9jYWxlKXtcblxuICAgICAgdmFyIHNvdXJjZVNlcmlhbElkID0gMSxcbiAgICAgICAgICBldmVudFNlcmlhbElkID0gMSxcbiAgICAgICAgICBzb3VyY2VzID0gJHNjb3BlLmV2ZW50U291cmNlcyxcbiAgICAgICAgICBleHRyYUV2ZW50U2lnbmF0dXJlID0gJHNjb3BlLmNhbGVuZGFyV2F0Y2hFdmVudCA/ICRzY29wZS5jYWxlbmRhcldhdGNoRXZlbnQgOiBhbmd1bGFyLm5vb3AsXG5cbiAgICAgICAgICB3cmFwRnVuY3Rpb25XaXRoU2NvcGVBcHBseSA9IGZ1bmN0aW9uKGZ1bmN0aW9uVG9XcmFwKXtcbiAgICAgICAgICAgICAgdmFyIHdyYXBwZXI7XG5cbiAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uVG9XcmFwKXtcbiAgICAgICAgICAgICAgICAgIHdyYXBwZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaGFwcGVucyBvdXRzaWRlIG9mIGFuZ3VsYXIgY29udGV4dCBzbyB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0aW1lb3V0IHdoaWNoIGhhcyBhbiBpbXBsaWVkIGFwcGx5LlxuICAgICAgICAgICAgICAgICAgICAgIC8vIEluIHRoaXMgd2F5IHRoZSBmdW5jdGlvbiB3aWxsIGJlIHNhZmVseSBleGVjdXRlZCBvbiB0aGUgbmV4dCBkaWdlc3QuXG5cbiAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvblRvV3JhcC5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXI7XG4gICAgICAgICAgfTtcblxuICAgICAgdGhpcy5ldmVudHNGaW5nZXJwcmludCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFlLl9pZCkge1xuICAgICAgICAgIGUuX2lkID0gZXZlbnRTZXJpYWxJZCsrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgZXh0cmFjdHMgYWxsIHRoZSBpbmZvcm1hdGlvbiB3ZSBuZWVkIGZyb20gdGhlIGV2ZW50LiBodHRwOi8vanNwZXJmLmNvbS9hbmd1bGFyLWNhbGVuZGFyLWV2ZW50cy1maW5nZXJwcmludC8zXG4gICAgICAgIHJldHVybiBcIlwiICsgZS5faWQgKyAoZS5pZCB8fCAnJykgKyAoZS50aXRsZSB8fCAnJykgKyAoZS51cmwgfHwgJycpICsgKCtlLnN0YXJ0IHx8ICcnKSArICgrZS5lbmQgfHwgJycpICtcbiAgICAgICAgICAoZS5hbGxEYXkgfHwgJycpICsgKGUuY2xhc3NOYW1lIHx8ICcnKSArIGV4dHJhRXZlbnRTaWduYXR1cmUoZSkgfHwgJyc7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLnNvdXJjZXNGaW5nZXJwcmludCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgIHJldHVybiBzb3VyY2UuX19pZCB8fCAoc291cmNlLl9faWQgPSBzb3VyY2VTZXJpYWxJZCsrKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYWxsRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHJldHVybiBzb3VyY2VzLmZsYXR0ZW4oKTsgYnV0IHdlIGRvbid0IGhhdmUgZmxhdHRlblxuICAgICAgICB2YXIgYXJyYXlTb3VyY2VzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBzcmNMZW4gPSBzb3VyY2VzLmxlbmd0aDsgaSA8IHNyY0xlbjsgaSsrKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IHNvdXJjZXNbaV07XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICAgICAgICAvLyBldmVudCBzb3VyY2UgYXMgYXJyYXlcbiAgICAgICAgICAgIGFycmF5U291cmNlcy5wdXNoKHNvdXJjZSk7XG4gICAgICAgICAgfSBlbHNlIGlmKGFuZ3VsYXIuaXNPYmplY3Qoc291cmNlKSAmJiBhbmd1bGFyLmlzQXJyYXkoc291cmNlLmV2ZW50cykpe1xuICAgICAgICAgICAgLy8gZXZlbnQgc291cmNlIGFzIG9iamVjdCwgaWUgZXh0ZW5kZWQgZm9ybVxuICAgICAgICAgICAgdmFyIGV4dEV2ZW50ID0ge307XG4gICAgICAgICAgICBmb3IodmFyIGtleSBpbiBzb3VyY2Upe1xuICAgICAgICAgICAgICBpZihrZXkgIT09ICdfdWlDYWxJZCcgJiYga2V5ICE9PSAnZXZlbnRzJyl7XG4gICAgICAgICAgICAgICAgIGV4dEV2ZW50W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yKHZhciBlSSA9IDA7ZUkgPCBzb3VyY2UuZXZlbnRzLmxlbmd0aDtlSSsrKXtcbiAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoc291cmNlLmV2ZW50c1tlSV0sZXh0RXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXJyYXlTb3VyY2VzLnB1c2goc291cmNlLmV2ZW50cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycmF5U291cmNlcyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBUcmFjayBjaGFuZ2VzIGluIGFycmF5IGJ5IGFzc2lnbmluZyBpZCB0b2tlbnMgdG8gZWFjaCBlbGVtZW50IGFuZCB3YXRjaGluZyB0aGUgc2NvcGUgZm9yIGNoYW5nZXMgaW4gdGhvc2UgdG9rZW5zXG4gICAgICAvLyBhcmd1bWVudHM6XG4gICAgICAvLyAgYXJyYXlTb3VyY2UgYXJyYXkgb2YgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFycmF5IG9mIG9iamVjdHMgdG8gd2F0Y2hcbiAgICAgIC8vICB0b2tlbkZuIGZ1bmN0aW9uKG9iamVjdCkgdGhhdCByZXR1cm5zIHRoZSB0b2tlbiBmb3IgYSBnaXZlbiBvYmplY3RcbiAgICAgIHRoaXMuY2hhbmdlV2F0Y2hlciA9IGZ1bmN0aW9uKGFycmF5U291cmNlLCB0b2tlbkZuKSB7XG4gICAgICAgIHZhciBzZWxmO1xuICAgICAgICB2YXIgZ2V0VG9rZW5zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGFycmF5ID0gYW5ndWxhci5pc0Z1bmN0aW9uKGFycmF5U291cmNlKSA/IGFycmF5U291cmNlKCkgOiBhcnJheVNvdXJjZTtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHRva2VuLCBlbDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFycmF5Lmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgZWwgPSBhcnJheVtpXTtcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5GbihlbCk7XG4gICAgICAgICAgICBtYXBbdG9rZW5dID0gZWw7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIHJldHVybnMgZWxlbWVudHMgaW4gdGhhdCBhcmUgaW4gYSBidXQgbm90IGluIGJcbiAgICAgICAgLy8gc3VidHJhY3RBc1NldHMoWzQsIDUsIDZdLCBbNCwgNSwgN10pID0+IFs2XVxuICAgICAgICB2YXIgc3VidHJhY3RBc1NldHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBpbkIgPSB7fSwgaSwgbjtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYi5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGluQltiW2ldXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgaWYgKCFpbkJbYVtpXV0pIHtcbiAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gTWFwIG9iamVjdHMgdG8gdG9rZW5zIGFuZCB2aWNlLXZlcnNhXG4gICAgICAgIHZhciBtYXAgPSB7fTtcblxuICAgICAgICB2YXIgYXBwbHlDaGFuZ2VzID0gZnVuY3Rpb24obmV3VG9rZW5zLCBvbGRUb2tlbnMpIHtcbiAgICAgICAgICB2YXIgaSwgbiwgZWwsIHRva2VuO1xuICAgICAgICAgIHZhciByZXBsYWNlZFRva2VucyA9IHt9O1xuICAgICAgICAgIHZhciByZW1vdmVkVG9rZW5zID0gc3VidHJhY3RBc1NldHMob2xkVG9rZW5zLCBuZXdUb2tlbnMpO1xuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkVG9rZW5zLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWRUb2tlbiA9IHJlbW92ZWRUb2tlbnNbaV07XG4gICAgICAgICAgICBlbCA9IG1hcFtyZW1vdmVkVG9rZW5dO1xuICAgICAgICAgICAgZGVsZXRlIG1hcFtyZW1vdmVkVG9rZW5dO1xuICAgICAgICAgICAgdmFyIG5ld1Rva2VuID0gdG9rZW5GbihlbCk7XG4gICAgICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCB3YXNuJ3QgcmVtb3ZlZCBidXQgc2ltcGx5IGdvdCBhIG5ldyB0b2tlbiwgaXRzIG9sZCB0b2tlbiB3aWxsIGJlIGRpZmZlcmVudCBmcm9tIHRoZSBjdXJyZW50IG9uZVxuICAgICAgICAgICAgaWYgKG5ld1Rva2VuID09PSByZW1vdmVkVG9rZW4pIHtcbiAgICAgICAgICAgICAgc2VsZi5vblJlbW92ZWQoZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVwbGFjZWRUb2tlbnNbbmV3VG9rZW5dID0gcmVtb3ZlZFRva2VuO1xuICAgICAgICAgICAgICBzZWxmLm9uQ2hhbmdlZChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGFkZGVkVG9rZW5zID0gc3VidHJhY3RBc1NldHMobmV3VG9rZW5zLCBvbGRUb2tlbnMpO1xuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZFRva2Vucy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHRva2VuID0gYWRkZWRUb2tlbnNbaV07XG4gICAgICAgICAgICBlbCA9IG1hcFt0b2tlbl07XG4gICAgICAgICAgICBpZiAoIXJlcGxhY2VkVG9rZW5zW3Rva2VuXSkge1xuICAgICAgICAgICAgICBzZWxmLm9uQWRkZWQoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2VsZiA9IHtcbiAgICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uKHNjb3BlLCBvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaChnZXRUb2tlbnMsIGZ1bmN0aW9uKG5ld1Rva2Vucywgb2xkVG9rZW5zKSB7XG4gICAgICAgICAgICAgIGlmICghb25DaGFuZ2VkIHx8IG9uQ2hhbmdlZChuZXdUb2tlbnMsIG9sZFRva2VucykgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYXBwbHlDaGFuZ2VzKG5ld1Rva2Vucywgb2xkVG9rZW5zKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdHJ1ZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkFkZGVkOiBhbmd1bGFyLm5vb3AsXG4gICAgICAgICAgb25DaGFuZ2VkOiBhbmd1bGFyLm5vb3AsXG4gICAgICAgICAgb25SZW1vdmVkOiBhbmd1bGFyLm5vb3BcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLmdldEZ1bGxDYWxlbmRhckNvbmZpZyA9IGZ1bmN0aW9uKGNhbGVuZGFyU2V0dGluZ3MsIHVpQ2FsZW5kYXJDb25maWcpe1xuICAgICAgICAgIHZhciBjb25maWcgPSB7fTtcblxuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgdWlDYWxlbmRhckNvbmZpZyk7XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCBjYWxlbmRhclNldHRpbmdzKTtcbiAgICAgICAgIFxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb25maWcsIGZ1bmN0aW9uKHZhbHVlLGtleSl7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgICAgY29uZmlnW2tleV0gPSB3cmFwRnVuY3Rpb25XaXRoU2NvcGVBcHBseShjb25maWdba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgfTtcblxuICAgIHRoaXMuZ2V0TG9jYWxlQ29uZmlnID0gZnVuY3Rpb24oZnVsbENhbGVuZGFyQ29uZmlnKSB7XG4gICAgICBpZiAoIWZ1bGxDYWxlbmRhckNvbmZpZy5sYW5nIHx8IGZ1bGxDYWxlbmRhckNvbmZpZy51c2VOZ0xvY2FsZSkge1xuICAgICAgICAvLyBDb25maWd1cmUgdG8gdXNlIGxvY2FsZSBuYW1lcyBieSBkZWZhdWx0XG4gICAgICAgIHZhciB0VmFsdWVzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIC8vIGNvbnZlcnQgezA6IFwiSmFuXCIsIDE6IFwiRmViXCIsIC4uLn0gdG8gW1wiSmFuXCIsIFwiRmViXCIsIC4uLl1cbiAgICAgICAgICB2YXIgciwgaztcbiAgICAgICAgICByID0gW107XG4gICAgICAgICAgZm9yIChrIGluIGRhdGEpIHtcbiAgICAgICAgICAgIHJba10gPSBkYXRhW2tdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGR0ZiA9ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBtb250aE5hbWVzOiB0VmFsdWVzKGR0Zi5NT05USCksXG4gICAgICAgICAgbW9udGhOYW1lc1Nob3J0OiB0VmFsdWVzKGR0Zi5TSE9SVE1PTlRIKSxcbiAgICAgICAgICBkYXlOYW1lczogdFZhbHVlcyhkdGYuREFZKSxcbiAgICAgICAgICBkYXlOYW1lc1Nob3J0OiB0VmFsdWVzKGR0Zi5TSE9SVERBWSlcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9O1xuICB9XSlcbiAgLmRpcmVjdGl2ZSgndWlDYWxlbmRhcicsIFsndWlDYWxlbmRhckNvbmZpZycsIGZ1bmN0aW9uKHVpQ2FsZW5kYXJDb25maWcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7ZXZlbnRTb3VyY2VzOic9bmdNb2RlbCcsY2FsZW5kYXJXYXRjaEV2ZW50OiAnJid9LFxuICAgICAgY29udHJvbGxlcjogJ3VpQ2FsZW5kYXJDdHJsJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbG0sIGF0dHJzLCBjb250cm9sbGVyKSB7XG5cbiAgICAgICAgdmFyIHNvdXJjZXMgPSBzY29wZS5ldmVudFNvdXJjZXMsXG4gICAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IGZhbHNlLFxuICAgICAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlciA9IGNvbnRyb2xsZXIuY2hhbmdlV2F0Y2hlcihzb3VyY2VzLCBjb250cm9sbGVyLnNvdXJjZXNGaW5nZXJwcmludCksXG4gICAgICAgICAgICBldmVudHNXYXRjaGVyID0gY29udHJvbGxlci5jaGFuZ2VXYXRjaGVyKGNvbnRyb2xsZXIuYWxsRXZlbnRzLCBjb250cm9sbGVyLmV2ZW50c0ZpbmdlcnByaW50KSxcbiAgICAgICAgICAgIG9wdGlvbnMgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldE9wdGlvbnMoKXtcbiAgICAgICAgICB2YXIgY2FsZW5kYXJTZXR0aW5ncyA9IGF0dHJzLnVpQ2FsZW5kYXIgPyBzY29wZS4kcGFyZW50LiRldmFsKGF0dHJzLnVpQ2FsZW5kYXIpIDoge30sXG4gICAgICAgICAgICAgIGZ1bGxDYWxlbmRhckNvbmZpZztcblxuICAgICAgICAgIGZ1bGxDYWxlbmRhckNvbmZpZyA9IGNvbnRyb2xsZXIuZ2V0RnVsbENhbGVuZGFyQ29uZmlnKGNhbGVuZGFyU2V0dGluZ3MsIHVpQ2FsZW5kYXJDb25maWcpO1xuXG4gICAgICAgICAgdmFyIGxvY2FsZUZ1bGxDYWxlbmRhckNvbmZpZyA9IGNvbnRyb2xsZXIuZ2V0TG9jYWxlQ29uZmlnKGZ1bGxDYWxlbmRhckNvbmZpZyk7XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQobG9jYWxlRnVsbENhbGVuZGFyQ29uZmlnLCBmdWxsQ2FsZW5kYXJDb25maWcpO1xuXG4gICAgICAgICAgb3B0aW9ucyA9IHsgZXZlbnRTb3VyY2VzOiBzb3VyY2VzIH07XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQob3B0aW9ucywgbG9jYWxlRnVsbENhbGVuZGFyQ29uZmlnKTtcblxuICAgICAgICAgIHZhciBvcHRpb25zMiA9IHt9O1xuICAgICAgICAgIGZvcih2YXIgbyBpbiBvcHRpb25zKXtcbiAgICAgICAgICAgIGlmKG8gIT09ICdldmVudFNvdXJjZXMnKXtcbiAgICAgICAgICAgICAgb3B0aW9uczJbb10gPSBvcHRpb25zW29dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob3B0aW9uczIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaWYoc2NvcGUuY2FsZW5kYXIgJiYgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKXtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcignZGVzdHJveScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZihhdHRycy5jYWxlbmRhcikge1xuICAgICAgICAgICAgc2NvcGUuY2FsZW5kYXIgPSBzY29wZS4kcGFyZW50W2F0dHJzLmNhbGVuZGFyXSA9ICAkKGVsbSkuaHRtbCgnJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyID0gJChlbG0pLmh0bWwoJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzY29wZS5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIob3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlci5vbkFkZGVkID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ2FkZEV2ZW50U291cmNlJywgc291cmNlKTtcbiAgICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudFNvdXJjZXNXYXRjaGVyLm9uUmVtb3ZlZCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVtb3ZlRXZlbnRTb3VyY2UnLCBzb3VyY2UpO1xuICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudHNXYXRjaGVyLm9uQWRkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVuZGVyRXZlbnQnLCBldmVudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRzV2F0Y2hlci5vblJlbW92ZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVtb3ZlRXZlbnRzJywgZnVuY3Rpb24oZSkgeyBcbiAgICAgICAgICAgIHJldHVybiBlLl9pZCA9PT0gZXZlbnQuX2lkO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50c1dhdGNoZXIub25DaGFuZ2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5fc3RhcnQgPSAkLmZ1bGxDYWxlbmRhci5tb21lbnQoZXZlbnQuc3RhcnQpO1xuICAgICAgICAgIGV2ZW50Ll9lbmQgPSAkLmZ1bGxDYWxlbmRhci5tb21lbnQoZXZlbnQuZW5kKTtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ3VwZGF0ZUV2ZW50JywgZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50U291cmNlc1dhdGNoZXIuc3Vic2NyaWJlKHNjb3BlKTtcbiAgICAgICAgZXZlbnRzV2F0Y2hlci5zdWJzY3JpYmUoc2NvcGUsIGZ1bmN0aW9uKG5ld1Rva2Vucywgb2xkVG9rZW5zKSB7XG4gICAgICAgICAgaWYgKHNvdXJjZXNDaGFuZ2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gcHJldmVudCBpbmNyZW1lbnRhbCB1cGRhdGVzIGluIHRoaXMgY2FzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2NvcGUuJHdhdGNoKGdldE9wdGlvbnMsIGZ1bmN0aW9uKG5ld08sb2xkTyl7XG4gICAgICAgICAgICBzY29wZS5kZXN0cm95KCk7XG4gICAgICAgICAgICBzY29wZS5pbml0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG59XSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKFwia2V5ZG93biBrZXlwcmVzc1wiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYoIWV2ZW50LmFsdEtleSAmJiAhZXZlbnQuc2hpZnRLZXkgJiYgIWV2ZW50LmN0cmxLZXkgJiYgZXZlbnQud2hpY2ggPT09IDEzKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHJzLm5nRW50ZXIsIHsnZXZlbnQnOiBldmVudH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25nSW5maW5pdGVTY3JvbGwnLCBmdW5jdGlvbigkd2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZChcInNjcm9sbFwiLCBmdW5jdGlvbigpIHtcblx0XHQgICAgdmFyIHdpbmRvd0hlaWdodCBcdD0gXCJpbm5lckhlaWdodFwiIGluIHdpbmRvdyA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHQ7XG5cdFx0ICAgIHZhciBib2R5IFx0XHRcdD0gZG9jdW1lbnQuYm9keSwgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHQgICAgdmFyIGRvY0hlaWdodCBcdFx0PSBNYXRoLm1heChib2R5LnNjcm9sbEhlaWdodCwgYm9keS5vZmZzZXRIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0LCAgaHRtbC5zY3JvbGxIZWlnaHQsIGh0bWwub2Zmc2V0SGVpZ2h0KTtcblx0XHQgICAgd2luZG93Qm90dG9tIFx0XHQ9IHdpbmRvd0hlaWdodCArIHdpbmRvdy5wYWdlWU9mZnNldDtcblx0XHQgICAgXG5cdFx0ICAgIGlmICh3aW5kb3dCb3R0b20gPj0gZG9jSGVpZ2h0KSB7XG5cdFx0XHQgICAgLy8gSW5zZXJ0IGxvYWRlciBjb2RlIGhlcmUuXG5cdFx0XHQgICAgc2NvcGUub2Zmc2V0ID0gc2NvcGUub2Zmc2V0ICsgc2NvcGUubGltaXQ7XG5cdFx0ICAgICAgICBzY29wZS5sb2FkKCk7XG5cdFx0ICAgIH1cblx0XHR9KTtcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc3RyaW5nVG9OdW1iZXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG4gICAgICBuZ01vZGVsLiRwYXJzZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuICcnICsgdmFsdWU7XG4gICAgICB9KTtcbiAgICAgIG5nTW9kZWwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSwgMTApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSk7IiwiYXBwLmZpbHRlcignY3V0U3RyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIHdvcmR3aXNlLCBtYXgsIHRhaWwpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuICcnO1xuXG4gICAgICAgIG1heCA9IHBhcnNlSW50KG1heCwgMTApO1xuICAgICAgICBpZiAoIW1heCkgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAodmFsdWUubGVuZ3RoIDw9IG1heCkgcmV0dXJuIHZhbHVlO1xuXG4gICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyKDAsIG1heCk7XG4gICAgICAgIGlmICh3b3Jkd2lzZSkge1xuICAgICAgICAgICAgdmFyIGxhc3RzcGFjZSA9IHZhbHVlLmxhc3RJbmRleE9mKCcgJyk7XG4gICAgICAgICAgICBpZiAobGFzdHNwYWNlICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHIoMCwgbGFzdHNwYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZSArICh0YWlsIHx8ICfigKYnKTtcbiAgICB9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdkYXRlVG9JU08nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYoaW5wdXQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICB2YXIgYSA9IGlucHV0LnNwbGl0KC9bXjAtOV0vKTtcbiAgICAgICAgICAgIHZhciBkPW5ldyBEYXRlIChhWzBdLGFbMV0tMSxhWzJdLGFbM10sYVs0XSxhWzVdICk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoZCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhcHAuZmlsdGVyKCdpc0VtcHR5JywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXF1YWxzKHt9LCBvYmplY3QpO1xuICAgIH07XG59XSk7IiwiYXBwLmZpbHRlcignbnVtJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dCwgMTApO1xuICAgIH07XG59KTsiLCJhcHAuZmlsdGVyKCdyYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCwgc3RhcnQsIGVuZCkge1xuICAgICAgICBzdGFydCA9IHBhcnNlSW50KHN0YXJ0KTtcbiAgICAgICAgZW5kID0gcGFyc2VJbnQoZW5kKTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGlmKHN0YXJ0IDwgZW5kKXtcbiAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaTxlbmQ7IGkrKylcbiAgICAgICAgICAgICAgICBpbnB1dC5wdXNoKGkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaT5lbmQ7IGktLSlcbiAgICAgICAgICAgICAgICBpbnB1dC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcigncmVuZGVySFRNTENvcnJlY3RseScsIGZ1bmN0aW9uKCRzY2UpXG57XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZ1RvUGFyc2UpXG4gICAge1xuICAgICAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbChzdHJpbmdUb1BhcnNlKTtcbiAgICB9O1xufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnYWRtaW4nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2VycycsIHtcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi51c2Vycy5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ1VzZXJzQ29udHJvbGxlciBhcyB1c2VycydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzJywge1xuICAgICAgICB1cmw6ICcvY2x1YnMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5DbHVic0NvbnRyb2xsZXIgYXMgY2x1YnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdycsIHtcbiAgICAgICAgdXJsOiAnLzppZCcsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuc2hvdycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluQ2x1YkNvbnRyb2xsZXIgYXMgY2x1YnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy51c2VycycsIHtcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLnVzZXJzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzLnNob3cuYWRtaW5zJywge1xuICAgICAgICB1cmw6ICcvYWRtaW5zJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLmFkbWlucydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93Lm1lcmdlJywge1xuICAgICAgICB1cmw6ICcvbWVyZ2UnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMubWVyZ2UnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbi8vXHQkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cblx0Ly8gQXV0aC5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgnLCB7XG5cdFx0dXJsOiAnL2F1dGgnLFxuXHRcdHBhcmVudDogJ3B1YmxpYycsXG5cdFx0YWJzdHJhY3Q6IHRydWUsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQXV0aENvbnRyb2xsZXInXG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblx0JHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoJywgJy9hdXRoL2xvZ2luJyk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLnJlZ2lzdGVyJywge1xuXHRcdHVybDogJy9yZWdpc3RlcicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcmVnaXN0ZXInXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5pbnZpdGUnLCB7XG5cdFx0dXJsOiAnL3JlZ2lzdGVyLzppbnZpdGVfdG9rZW4nLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL3JlZ2lzdGVyJyxcblx0XHRjb250cm9sbGVyOiAnQXV0aENvbnRyb2xsZXInXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5pbmFjdGl2ZScsIHtcblx0XHR1cmw6ICcvaW5hY3RpdmUnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL2luYWN0aXZlJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGguYWN0aXZhdGUnLCB7XG5cdFx0dXJsOiAnL2FjdGl2YXRlLzp0b2tlbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvYWN0aXZhdGUnLFxuXHRcdGNvbnRyb2xsZXI6ICdBY3RpdmF0aW9uQ29udHJvbGxlcidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmxvZ2luJywge1xuXHRcdHVybDogJy9sb2dpbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvbG9naW4nXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5wYXNzd29yZCcsIHtcblx0XHR1cmw6ICcvcGFzc3dvcmQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL3Bhc3N3b3JkJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgucmVzZXQnLCB7XG5cdFx0dXJsOiAnL3Jlc2V0Lzp0b2tlbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcmVzZXQnLFxuXHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBBdXRoRmFjdG9yeSl7XG5cdFx0XHQkc2NvcGUucmVzZXQgPSB7ZW1haWw6ICcnLCB0b2tlbjogJHN0YXRlUGFyYW1zLnRva2VufTtcblxuXHRcdFx0JHNjb3BlLnJlc2V0UGFzc3dvcmQgPSBmdW5jdGlvbigpXG5cdFx0XHR7XG5cblx0XHRcdFx0QXV0aEZhY3Rvcnlcblx0XHRcdFx0XHQucmVzZXRQYXNzd29yZCgkc2NvcGUucmVzZXQpXG5cdFx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdFx0JHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdCRzY29wZS5yZXNldCA9IHtlbWFpbDogJycsIHRva2VuOiAkc3RhdGVQYXJhbXMudG9rZW59O1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5kYXRhLnN0YXR1cyAhPT0gJ3N1Y2Nlc3MnKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0fTtcblx0XHR9XG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5sb2dvdXQnLCB7XG5cdFx0dXJsOiAnL2xvZ291dCcsXG5cdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oQXV0aEZhY3Rvcnkpe1xuXHRcdFx0QXV0aEZhY3RvcnkubG9nb3V0KCk7XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hhbXBpb25zaGlwcycsIHtcblx0XHR1cmw6ICcvY2hhbXBpb25zaGlwcycsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6e1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jaGFtcGlvbnNoaXBzLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NoYW1waW9uc2hpcHNDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnY2hhbXBpb25zaGlwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjaGFtcGlvbnNoaXAnLCB7XG5cdFx0dXJsOiAnL2NoYW1waW9uc2hpcC86aWQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNoYW1waW9uc2hpcHMuc2hvdycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDaGFtcGlvbnNoaXBDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnY2hhbXBpb25zaGlwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjaGFtcGlvbnNoaXAuc2hvdycsIHtcblx0XHR1cmw6ICcvOnZpZXcnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnbWFpbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XG5cdFx0XHRcdFx0cmV0dXJuICcvdmlld3MvcGFydGlhbHMuY2hhbXBpb25zaGlwcy5zaG93LicrJHN0YXRlUGFyYW1zLnZpZXc7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcyl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5jdXJyZW50VmlldyA9ICRzdGF0ZVBhcmFtcy52aWV3O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWInLCB7XG4gICAgICAgIHVybDogJy9jbHViJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnY2x1YidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW5mb3JtYXRpb24nLCB7XG4gICAgICAgIHVybDogJy9pbmZvcm1hdGlvbicsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6e1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW5mb3JtYXRpb24nLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5hZG1pbnMnLCB7XG4gICAgICAgIHVybDogJy9hZG1pbnMnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLmFkbWlucycsXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuXG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbnMnLCB7XG5cdFx0dXJsOiAnL2NvbXBldGl0aW9ucz9wYWdlJnNvcnQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOntcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NvbXBldGl0aW9uc0NvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdjb21wZXRpdGlvbnMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHBhZ2U6IHtcblx0XHRcdFx0dmFsdWU6ICcwJyxcblx0XHRcdFx0c3F1YXNoOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0c29ydDoge1xuXHRcdFx0XHR2YWx1ZTogJ2RhdGUnLFxuXHRcdFx0XHRzcXVhc2g6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbicsIHtcblx0XHR1cmw6ICcvY29tcGV0aXRpb24vOmlkJyxcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuc2hvdycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDb21wZXRpdGlvbkNvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdjb21wZXRpdGlvbnMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLCB7XG5cdFx0dXJsOiAnL3RlYW1zaWdudXBzJyxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnRlYW1zaWdudXBzLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1RlYW1TaWdudXBDb250cm9sbGVyIGFzIHRlYW1zaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmNyZWF0ZScsIHtcblx0XHR1cmw6ICcvY3JlYXRlJyxcblx0XHR2aWV3czoge1xuXHRcdFx0Jyc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cudGVhbXNpZ251cHMuY3JlYXRlJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmVkaXQnLCB7XG5cdFx0dXJsOiAnLzp0ZWFtc19pZCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCcnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnRlYW1zaWdudXBzLmVkaXQnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnVGVhbVNpZ251cENvbnRyb2xsZXIgYXMgdGVhbXNpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24uc2hvdycsIHtcblx0XHR1cmw6ICcvOnZpZXcnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnbWFpbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XG5cdFx0XHRcdFx0cmV0dXJuICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cuJyskc3RhdGVQYXJhbXMudmlldztcblx0XHRcdFx0fSxcblx0XHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmN1cnJlbnRWaWV3ID0gJHN0YXRlUGFyYW1zLnZpZXc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJlbWl1bScsIHtcbiAgICAgICAgdXJsOiAnL3ByZW1pdW0nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5wcmVtaXVtLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnUHJlbWl1bUNvbnRyb2xsZXIgYXMgcHJlbWl1bSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcmVtaXVtLmJ1eScsIHtcbiAgICAgICAgdXJsOiAnL2J1eScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAncHJlbWl1bSc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5wcmVtaXVtLmJ1eSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2NvbXBldGl0aW9ucycpO1xuXG4gICAgaWYobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSlcbiAgICB7XG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9jb21wZXRpdGlvbnMnKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2F1dGgvcmVnaXN0ZXInKTtcbiAgICB9XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHZpZXdzOntcbiAgICAgICAgICAgICduYXZpZ2F0aW9uQCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5uYXZpZ2F0aW9uJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHVibGljJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdmlld3M6e1xuICAgICAgICAgICAgJ25hdmlnYXRpb25AJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL25hdmlnYXRpb24nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5kYXNoYm9hcmQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncycsIHtcbiAgICAgICAgdXJsOiAnL3NldHRpbmdzJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnU2V0dGluZ3NDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdzZXR0aW5ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLmluZGV4Jywge1xuICAgICAgICB1cmw6Jy8nLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOiB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHN0YXRlKXtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzZXR0aW5ncy51c2VyJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MudXNlcicsIHtcbiAgICAgICAgdXJsOiAnL3VzZXInLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy51c2VyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlVzZXJQcm9maWxlQ29udHJvbGxlciBhcyB1c2VycHJvZmlsZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy51c2VyLmVkaXQnLCB7XG4gICAgICAgIHVybDogJy9lZGl0JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdlZGl0Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLnVzZXJlZGl0J1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MuY2FuY2VsYWNjb3VudCcsIHtcbiAgICAgICAgdXJsOiAnL2NhbmNlbGFjY291bnQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MuY2FuY2VsYWNjb3VudCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MucGFzc3dvcmQnLCB7XG4gICAgICAgIHVybDogJy9wYXNzd29yZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnc2V0dGluZyc6e1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLnBhc3N3b3JkJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlBhc3N3b3JkQ29udHJvbGxlciBhcyBwYXNzd29yZFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcbiAgICBcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MuaW52aXRlJywge1xuICAgICAgICB1cmw6ICcvaW52aXRlJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdzZXR0aW5nJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MuaW52aXRlJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIkludml0ZUNvbnRyb2xsZXIgYXMgaW52aXRlXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwcycsIHtcblx0XHR1cmw6ICcvc2lnbnVwcycsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6e1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zaWdudXBzLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1NpZ251cHNDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cC86aWQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNpZ251cHMuc2hvdycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cC5lZGl0Jywge1xuXHRcdHVybDogJy9lZGl0Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zaWdudXBzLmVkaXQnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnU2lnbnVwQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ3NpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
