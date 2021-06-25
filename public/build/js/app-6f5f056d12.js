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
		'app.settings',
		'app.dashboard',
		'app.competitions',
		'app.championships',
		'app.signups',
		'app.users',
		'app.clubs',
		'app.calendar',
		'app.teams'
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

		ErrorHandlerFactory
			.reportError(error, cause)

			.then(function(response){
				if(response.message){
					if(response.message) $rootScope.displayFlashMessages([response.data.message], 'warning');
				} else if(response.data){
					if(response.data.message) $rootScope.displayFlashMessages([response.data.message], 'warning');
				}
			});
	};
}]);
angular.module('app.auth', [])
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
            $scope.registerState = 'registrering';

            AuthFactory.register($scope.auth)
                .success(function() {
                    $scope.registerState = 'done';
                    $timeout(function(){
                        $scope.registerState = false;
                        $scope.auth = {};
                    }, 3000);
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                    $rootScope.loadingState = '';
                    $scope.registerState = false;
                });
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

    .factory('AuthFactory', ["$http", "$filter", "$timeout", "$state", "$rootScope", function($http, $filter, $timeout, $state, $rootScope){
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
                    url: '/api/authenticate',
                    data: credentials
                });
            },

            getUser: function(){
                return $http({
                    method: 'GET',
                    url: '/api/authenticate/user'
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
                    url: '/api/password/email',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(credentials)
                });
            },

            resetPassword: function(credentials) {
                return $http({
                    method: 'POST',
                    url: '/api/password/reset',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(credentials)
                });
            },

            register: function(credentials) {
                return $http({
                    method: 'POST',
                    url: '/api/register',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(credentials)
                });
            },

            activate: function(token) {
                return $http({
                    method: 'POST',
                    url: '/api/activate',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(token)
                });
            },

            attemptRefreshToken: function(requestTodoWhenDone){

                // Run the call to refresh the token.
                return $http({
                    method: 'POST',
                    url: '/api/refresh'
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
.controller('CalendarController', ["$scope", "$http", "$timeout", function($scope,$http,$timeout) {
	
	function init(){
		
		$apiUrl = '/api/calendar';
	
		$scope.calendarEvents = [{
            url: "/api/calendar",
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
		            url: "/api/calendar?start="+start+"&end="+end
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

.factory('ChampionshipsFactory', ["$http", function($http) {

    return {
        load: function (page, id) {
            var url = '/api/championships';

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
                url: '/api/championships/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        createSignup: function(signup) {
            return $http({
                method: 'POST',
                url: '/api/signup',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(signup)
            });
        },

        updateSignup: function(signup) {
            return $http({
                method: 'PUT',
                url: '/api/signup/'+signup.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(signup)
            });
        },

        deleteSignup: function(signup) {
            return $http({
                method: 'DELETE',
                url: '/api/signup/'+signup.id,
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
		hide_without_users: 1
	};

	self.hideClubsWithoutUsers = function(club){
		if(self.filter.hide_without_users && club.users_count){
			return club;
		}else if(!self.filter.hide_without_users){
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

	find();
}])

.factory('ClubsFactory', ["$http", function($http){

	return {
		load: function (page, id) {
			var url = '/api/clubs';

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
				url: '/api/clubs/'+id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
			});
		},

		createClub: function(club) {
			return $http({
				method: 'POST',
				url: '/api/clubs',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param(club)
			});
		},

		updateClub: function(club) {
			return $http({
				method: 'PUT',
				url: '/api/clubs/'+club.id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param(club)
			});
		},

		deleteClub: function(club) {
			return $http({
				method: 'DELETE',
				url: '/api/clubs/'+club.id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
			});
		},

		loadUserClub: function(){
			return $http({
				method: 'GET',
				url: '/api/clubs/getUserClub',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			});
		},

		addUserToClubs: function(clubs_id){
			return $http({
				method: 'POST',
				url: '/api/clubs/addUserToClubs',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: $.param({'clubs_id': clubs_id})
			});
		},

		addNewClub: function(club){
			return $http({
				method: 'POST',
				url: '/api/clubs/addNewClub',
				headers: {'Content-Type': 'application/x-www-form-urlencoded'},
				data: $.param({'clubs_nr': club.clubs_nr, 'name': club.name})
			});
		},

		searchForClubs: function(filter) {
			return $http({
				method: 'POST',
				url: '/api/clubs/search',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param({'searchQuery': filter})
			});
		},

		addUserAsAdmin: function(admin) {
			return $http({
				method: 'POST',
				url: '/api/clubs/addUserAsAdmin',
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param({'admin': admin})
			});
		},

		deleteUserAsAdmin: function(admin) {
			return $http({
				method: 'DELETE',
				url: '/api/clubs/deleteUserAsAdmin',
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

.factory('CompetitionsFactory', ["$http", function($http) {

    return {
        load: function (page, id) {
            var url = '/api/competitions';

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
                url: '/api/competitions/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        }

    };
}]);
angular.module('app.dashboard', [])

    .controller("DashboardController", ["$rootScope", "$scope", function($rootScope, $scope){


    }]);


angular.module('app.errorhandler', [])

	.controller("ErrorHandlerController", ["$rootScope", "$scope", "ErrorHandlerFactory", function($rootScope, $scope, ErrorHandlerFactory){

	}])

	.factory('ErrorHandlerFactory', ["$http", function($http){

		return {

			reportError: function(error, cause) {
				return $http({
					method: 'POST',
					url: '/api/error/report',
					headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
					data: $.param({error: error, cause: cause})
				});
			}

		};

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

.factory("InviteFactory", ["$http", function($http){
    return {
        loadInvites: function(){
            return $http({
                method: 'GET',
                url: '/api/users/invite',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        invite: function(user) {
            return $http({
                method: 'POST',
                url: '/api/users/invite',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(user)
            });
        }

    };
}])

.factory("SettingsFactory", ["$http", function($http){
    return {
        loadUserprofile: function(){
            return $http({
                method: 'GET',
                url: '/api/authenticate/user',
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        },

        saveUserprofile: function(user){
            var data = angular.copy(user);
            data.birthday = data.birthday+'-01-01';
            return $http({
                method: 'PUT',
                url: '/api/authenticate/user',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        },

        updatePassword: function(credentials) {
            return $http({
                method: 'PUT',
                url: '/api/authenticate/updatePassword',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(credentials)
            });
        },

        cancelaccount: function() {
            return $http({
                method: 'POST',
                url: '/api/authenticate/cancelAccount',
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
.factory('SignupsFactory', ["$http", function($http) {

        return {
            load: function (page, id) {
                var url = '/api/signup';

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
                    url: '/api/signup/'+id,
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
                });
            },

            createSignup: function(signup) {
                return $http({
                    method: 'POST',
                    url: '/api/signup',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(signup)
                });
            },

            updateSignup: function(signup) {
                return $http({
                    method: 'PUT',
                    url: '/api/signup/'+signup.id,
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(signup)
                });
            },

            deleteSignup: function(signup) {
                return $http({
                    method: 'DELETE',
                    url: '/api/signup/'+signup.id,
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
                });
            loadTeams();
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
.factory('TeamsFactory', ["$http", function($http) {
    return {
        load: function (competitions_id, teams_id) {
            if(competitions_id && teams_id){
                url = '/api/competitions/'+competitions_id+'/teamsignups/'+teams_id;
            } else {
                url = '/api/competitions/'+competitions_id+'/teamsignups';
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
                url: '/api/competitions/'+competitions_id+'/teamsignups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        store: function(competitions_id, team){
            return $http({
                method: 'POST',
                url: '/api/competitions/'+competitions_id+'/teamsignups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(team)
            });
        },

        update: function(competitions_id, teams_id, team){
            return $http({
                method: 'PUT',
                url: '/api/competitions/'+competitions_id+'/teamsignups/'+teams_id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(team)
            });
        },

        delete: function(competitions_id, teams_id){
            return $http({
                method: 'DELETE',
                url: '/api/competitions/'+competitions_id+'/teamsignups/'+teams_id,
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

.factory('UsersFactory', ["$http", function($http){

	return {
		load: function (page, id) {
			var url = '/api/users';

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
				url: '/api/users/'+id,
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
                        $rootScope.displayFlashMessages(response.message, 'error');
                        return state.go('dashboard');
                    }
                }

                if(response.error !== undefined){
                    if (response.error == 'user_inactive') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        return AuthFactory.logout();
                    }else if (response.error == 'user_is_not_admin') {
                        $rootScope.displayFlashMessages(response.message, 'error');
                        return $state.go('dashboard');
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
                templateUrl: '/views/partials.admin.clubs.users',
            }
        }
    });
    $stateProvider.state('admin.clubs.show.admins', {
        url: '/admins',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.clubs.admins',
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJtb2R1bGVzL2F1dGgubW9kdWxlLmpzIiwibW9kdWxlcy9jYWxlbmRhci5tb2R1bGUuanMiLCJtb2R1bGVzL2NoYW1waW9uc2hpcHMubW9kdWxlLmpzIiwibW9kdWxlcy9jbHVicy5tb2R1bGUuanMiLCJtb2R1bGVzL2NvbXBldGl0aW9ucy5tb2R1bGUuanMiLCJtb2R1bGVzL2Rhc2hib2FyZC5tb2R1bGUuanMiLCJtb2R1bGVzL2Vycm9yaGFuZGxpbmcubW9kdWxlLmpzIiwibW9kdWxlcy9zZXR0aW5ncy5tb2R1bGUuanMiLCJtb2R1bGVzL3NpZ251cHMubW9kdWxlLmpzIiwibW9kdWxlcy90ZWFtcy5tb2R1bGUuanMiLCJtb2R1bGVzL3VzZXJzLm1vZHVsZS5qcyIsImNvbmZpZy9lcnJvcmhhbmRsaW5nLmNvbmZpZy5qcyIsImNvbmZpZy9pbnRlcmNlcHRvcnMuanMiLCJkaXJlY3RpdmVzL25nLWZ1bGxjYWxlbmRhci5qcyIsImRpcmVjdGl2ZXMvbmdFbnRlci5qcyIsImRpcmVjdGl2ZXMvbmdJbmZpbml0ZVNjcm9sbC5qcyIsImRpcmVjdGl2ZXMvbmdTdHJpbmdUb051bWJlci5qcyIsImZpbHRlcnMvY3V0U3RyaW5nLmZpbHRlci5qcyIsImZpbHRlcnMvZGF0ZVRvSXNvLmZpbHRlci5qcyIsImZpbHRlcnMvaXNFbXB0eS5maWx0ZXIuanMiLCJmaWx0ZXJzL251bS5maWx0ZXIuanMiLCJmaWx0ZXJzL3JhbmdlLmZpbHRlci5qcyIsImZpbHRlcnMvcmVuZGVySFRNTENvcnJlY3RseS5maWx0ZXIuanMiLCJyb3V0aW5nL2FkbWluLnJvdXRpbmcuanMiLCJyb3V0aW5nL2F1dGgucm91dGluZy5qcyIsInJvdXRpbmcvY2hhbXBpb25zaGlwcy5yb3V0aW5nLmpzIiwicm91dGluZy9jbHVicy5yb3V0aW5nLmpzIiwicm91dGluZy9jb21wZXRpdGlvbnMucm91dGluZy5qcyIsInJvdXRpbmcvcm91dGluZy5qcyIsInJvdXRpbmcvc2V0dGluZ3Mucm91dGluZy5qcyIsInJvdXRpbmcvc2lnbnVwLnJvdXRpbmcuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQTtDQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTs2QkFDQSxTQUFBLHFCQUFBO0VBQ0EscUJBQUEsWUFBQTtFQUNBLHFCQUFBLFVBQUE7OztBQUdBLElBQUEsb0hBQUEsU0FBQSxZQUFBLFFBQUEsVUFBQSxxQkFBQSxXQUFBLGFBQUEsU0FBQSxXQUFBOztDQUVBLFFBQUEsR0FBQSxVQUFBLGlCQUFBOztDQUVBLFdBQUEsSUFBQSxxQkFBQSxTQUFBLEdBQUEsSUFBQTtFQUNBLElBQUEsUUFBQSxhQUFBLFFBQUE7O0VBRUEsV0FBQSxlQUFBLEdBQUE7O0VBRUEsR0FBQSxVQUFBLEtBQUE7R0FDQSxXQUFBLGdCQUFBO0dBQ0EsSUFBQSxPQUFBLEtBQUEsTUFBQSxhQUFBLFFBQUE7R0FDQSxXQUFBLGNBQUE7OztFQUdBLEdBQUEsQ0FBQSxHQUFBLEtBQUEsTUFBQSxLQUFBLEdBQUEsTUFBQSxXQUFBLFdBQUEsY0FBQTtHQUNBLE9BQUEsR0FBQSxhQUFBLElBQUEsQ0FBQSxTQUFBOzs7RUFHQSxJQUFBLEdBQUEsWUFBQTs7O0dBR0EsSUFBQSxVQUFBLE1BQUE7SUFDQSxFQUFBO0lBQ0EsT0FBQSxHQUFBLGNBQUEsSUFBQSxDQUFBLFVBQUE7Ozs7Ozs7OztHQVNBLFdBQUEsb0JBQUE7SUFDQSxXQUFBO0lBQ0EsYUFBQTs7R0FFQSxXQUFBLG9CQUFBO0lBQ0EsY0FBQTtJQUNBLFlBQUE7Ozs7RUFJQSxXQUFBLGVBQUE7Ozs7Q0FJQSxXQUFBLElBQUEsdUJBQUEsVUFBQSxPQUFBO0VBQ0EsUUFBQSxHQUFBLFFBQUEsWUFBQSxVQUFBOzs7Ozs7Ozs7OztDQVdBLFdBQUEsYUFBQSxTQUFBO0NBQ0E7O0VBRUEsV0FBQSxnQkFBQTtFQUNBLFdBQUEsa0JBQUE7O0VBRUEsR0FBQSxPQUFBLGFBQUE7RUFDQTtHQUNBLFdBQUEsY0FBQSxLQUFBOzs7RUFHQTtHQUNBLFFBQUEsSUFBQTtHQUNBLEdBQUE7R0FDQTtJQUNBLFFBQUEsUUFBQSxVQUFBLFNBQUEsYUFBQTtLQUNBLElBQUEsVUFBQSxDQUFBLE9BQUEsaUJBQUEsWUFBQSxlQUFBLGFBQUE7S0FDQSxXQUFBLGNBQUEsS0FBQTs7O0lBR0EsUUFBQSxJQUFBLFdBQUE7O0lBRUEsU0FBQSxVQUFBO0tBQ0EsV0FBQSxnQkFBQTtPQUNBOzs7Ozs7Q0FNQSxXQUFBLHVCQUFBLFNBQUEsVUFBQTtDQUNBO0VBQ0EsU0FBQSxPQUFBLFdBQUE7RUFDQSxXQUFBLGdCQUFBO0VBQ0EsV0FBQSxrQkFBQTs7RUFFQSxHQUFBLFFBQUEsU0FBQSxXQUFBLFdBQUEsQ0FBQTs7RUFFQSxJQUFBLG1CQUFBLENBQUE7RUFDQSxJQUFBLE9BQUEsQ0FBQSxRQUFBLGFBQUEsaUJBQUE7O0VBRUEsUUFBQSxRQUFBLFVBQUEsU0FBQSxRQUFBOztHQUVBLEdBQUEsaUJBQUEsUUFBQSxXQUFBO0dBQ0E7SUFDQSxJQUFBLE9BQUEsQ0FBQSxPQUFBLFlBQUEsWUFBQSxVQUFBLFFBQUE7SUFDQSxHQUFBLFFBQUE7SUFDQTtLQUNBLFdBQUEsY0FBQSxLQUFBOzs7SUFHQTtLQUNBLFdBQUEsZ0JBQUEsS0FBQTs7Ozs7RUFLQSxXQUFBLG9CQUFBLFNBQUEsVUFBQTtHQUNBLFdBQUEsZ0JBQUE7R0FDQSxXQUFBLGtCQUFBO0tBQ0E7Ozs7Ozs7O0NBUUEsV0FBQSxjQUFBLFNBQUEsT0FBQTtDQUNBO0VBQ0EsR0FBQSxDQUFBLE9BQUEsUUFBQTs7RUFFQTtJQUNBLFlBQUEsT0FBQTs7SUFFQSxLQUFBLFNBQUEsU0FBQTtJQUNBLEdBQUEsU0FBQSxRQUFBO0tBQ0EsR0FBQSxTQUFBLFNBQUEsV0FBQSxxQkFBQSxDQUFBLFNBQUEsS0FBQSxVQUFBO1dBQ0EsR0FBQSxTQUFBLEtBQUE7S0FDQSxHQUFBLFNBQUEsS0FBQSxTQUFBLFdBQUEs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QTtVQUNBLFFBQUEsSUFBQTs7Ozs7S0FLQSxPQUFBLGFBQUEsU0FBQSxLQUFBLFVBQUE7T0FDQSxTQUFBLGFBQUEsYUFBQTs7O0tBR0EsT0FBQSxpQkFBQSxTQUFBLFVBQUE7UUFDQSxTQUFBLFVBQUE7U0FDQSxRQUFBLElBQUE7SUFDQSxHQUFBLFNBQUE7SUFDQSxTQUFBLGFBQUE7O1dBRUE7Ozs7Q0FJQTs7O0FDL0VBLFFBQUEsT0FBQSxxQkFBQTs7Q0FFQSxXQUFBLHNHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxxQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLFdBQUEsTUFBQTtRQUNBLHFCQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGdCQUFBLFNBQUE7OztJQUdBLFNBQUEsV0FBQTs7SUFFQSxLQUFBLE9BQUEsU0FBQSxhQUFBLE1BQUE7SUFDQSxLQUFBLE9BQUEsYUFBQTtJQUNBLEtBQUEsY0FBQSxDQUFBLFdBQUEsUUFBQTtJQUNBO0lBQ0E7Ozs7Q0FJQSxXQUFBLHFHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxzQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLE1BQUE7UUFDQSxxQkFBQSxLQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGdCQUFBLFNBQUE7Z0JBQ0EsS0FBQSxPQUFBLEtBQUEsTUFBQSxhQUFBLFFBQUE7O2FBRUEsTUFBQSxVQUFBO2dCQUNBLE9BQUEsR0FBQSxpQkFBQSxJQUFBLENBQUEsU0FBQTs7Ozs7O0NBTUEsUUFBQSxrQ0FBQSxTQUFBLE9BQUE7O0lBRUEsT0FBQTtRQUNBLE1BQUEsVUFBQSxNQUFBLElBQUE7WUFDQSxJQUFBLE1BQUE7O1lBRUEsSUFBQSxDQUFBLFFBQUEsWUFBQSxPQUFBLEtBQUEsR0FBQSxPQUFBLE1BQUE7WUFDQSxJQUFBLE1BQUEsT0FBQSxXQUFBOztZQUVBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O1FBSUEsTUFBQSxTQUFBLElBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLHNCQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztRQUlBLGNBQUEsU0FBQSxRQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7UUFJQSxjQUFBLFNBQUEsUUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxPQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQTs7OztRQUlBLGNBQUEsU0FBQSxRQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBLE9BQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7Ozs7O0FDbkZBLFFBQUEsT0FBQSxhQUFBOztDQUVBLFdBQUEscUVBQUEsU0FBQSxZQUFBLFFBQUEsUUFBQSxhQUFBO0NBQ0EsSUFBQSxPQUFBOztDQUVBLEtBQUEsY0FBQTtDQUNBLEtBQUEsZUFBQTtDQUNBLEtBQUEsV0FBQTtDQUNBLEtBQUEsZUFBQTtDQUNBLEtBQUEsYUFBQTtDQUNBLEtBQUEsWUFBQTs7Q0FFQSxTQUFBLGVBQUE7RUFDQSxhQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGdCQUFBO0lBQ0EsS0FBQSxPQUFBOzs7O0NBSUEsS0FBQSxpQkFBQSxTQUFBLGFBQUE7Q0FDQTtFQUNBLE9BQUE7SUFDQSxlQUFBO0lBQ0EsTUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFVBQUE7O0lBRUEsS0FBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGNBQUEsU0FBQSxLQUFBLE1BQUEsU0FBQTtJQUNBLE9BQUEsU0FBQSxLQUFBLE1BQUEsSUFBQSxTQUFBLEtBQUE7S0FDQSxLQUFBLGtCQUFBO0tBQ0EsR0FBQSxLQUFBLE1BQUEsS0FBQSxJQUFBLEtBQUEsa0JBQUE7S0FDQSxPQUFBOzs7OztDQUtBLEtBQUEsYUFBQSxTQUFBO0NBQ0E7RUFDQSxHQUFBLE1BQUEsb0JBQUEsTUFBQSxPQUFBO0VBQ0EsS0FBQSxrQkFBQTtFQUNBLEtBQUEsV0FBQTs7O0NBR0EsS0FBQSxlQUFBO0NBQ0E7RUFDQSxLQUFBLGtCQUFBO0VBQ0EsS0FBQSxXQUFBOzs7Q0FHQSxLQUFBLGlCQUFBLFNBQUE7Q0FDQTtFQUNBLGFBQUEsZUFBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLFdBQUE7SUFDQSxLQUFBLGFBQUE7SUFDQSxLQUFBLE9BQUE7Ozs7Q0FJQSxLQUFBLGFBQUE7Q0FDQTtFQUNBLEdBQUEsQ0FBQSxLQUFBLGVBQUEsQ0FBQSxLQUFBLGNBQUEsT0FBQTtFQUNBLElBQUEsT0FBQTtHQUNBLE1BQUEsS0FBQTtHQUNBLFVBQUEsS0FBQTs7O0VBR0EsYUFBQSxXQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGNBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxLQUFBLFdBQUE7SUFDQSxLQUFBLGFBQUE7SUFDQSxLQUFBLE9BQUE7Ozs7Q0FJQSxLQUFBLGlCQUFBLFNBQUE7Q0FDQTtFQUNBLEdBQUEsTUFBQTtHQUNBLGFBQUEsZUFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBLEtBQUEsb0JBQUEsU0FBQTtDQUNBO0VBQ0EsR0FBQSxNQUFBO0dBQ0EsYUFBQSxrQkFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBOzs7Q0FHQSxXQUFBLGlGQUFBLFNBQUEsWUFBQSxjQUFBLFFBQUEsYUFBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLFNBQUE7RUFDQSxRQUFBO0VBQ0Esb0JBQUE7OztDQUdBLEtBQUEsd0JBQUEsU0FBQSxLQUFBO0VBQ0EsR0FBQSxLQUFBLE9BQUEsc0JBQUEsS0FBQSxZQUFBO0dBQ0EsT0FBQTtRQUNBLEdBQUEsQ0FBQSxLQUFBLE9BQUEsbUJBQUE7R0FDQSxPQUFBOzs7O0NBSUEsU0FBQSxXQUFBLE1BQUE7RUFDQSxhQUFBLEtBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsUUFBQSxTQUFBOzs7Q0FHQSxTQUFBLFdBQUE7O0NBRUEsS0FBQSxPQUFBLFNBQUEsYUFBQSxNQUFBO0NBQ0EsS0FBQSxPQUFBLGFBQUE7Q0FDQSxLQUFBLGNBQUEsQ0FBQSxXQUFBLFFBQUE7Q0FDQTtDQUNBOzs7Q0FHQSxLQUFBLFdBQUEsV0FBQTtFQUNBLEtBQUE7RUFDQSxXQUFBLEtBQUE7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7Q0FFQSxLQUFBLFdBQUEsV0FBQTtFQUNBLElBQUEsS0FBQSxPQUFBLEdBQUE7R0FDQSxLQUFBO0dBQ0EsV0FBQSxLQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7OztDQUdBLEtBQUEsY0FBQSxXQUFBO0VBQ0E7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7OztDQUlBLFdBQUEsc0dBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxRQUFBLFVBQUEsY0FBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxHQUFBLENBQUEsYUFBQSxJQUFBLE9BQUEsR0FBQTs7Q0FFQSxTQUFBLE1BQUE7RUFDQSxhQUFBLEtBQUEsYUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsS0FBQSxPQUFBLFNBQUE7O0lBRUEsTUFBQSxVQUFBO0lBQ0EsT0FBQSxHQUFBLGVBQUEsSUFBQSxDQUFBLFNBQUE7Ozs7Q0FJQSxLQUFBLGFBQUEsU0FBQSxLQUFBO0VBQ0EsS0FBQSxRQUFBO0VBQ0EsYUFBQSxXQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFNBQUE7SUFDQSxLQUFBLE1BQUEsUUFBQSxTQUFBO0lBQ0EsS0FBQSxRQUFBO0lBQ0EsT0FBQSxHQUFBLFNBQUEsQ0FBQSxJQUFBLEtBQUE7O0lBRUEsTUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFNBQUEsU0FBQTs7OztDQUlBLEtBQUEsYUFBQSxTQUFBLEtBQUE7RUFDQSxhQUFBLFdBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLE9BQUEsR0FBQTs7OztDQUlBOzs7Q0FHQSxRQUFBLDBCQUFBLFNBQUEsTUFBQTs7Q0FFQSxPQUFBO0VBQ0EsTUFBQSxVQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsTUFBQTs7R0FFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsTUFBQSxPQUFBLFdBQUE7O0dBRUEsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7RUFJQSxNQUFBLFNBQUEsSUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGNBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7RUFJQSxZQUFBLFNBQUEsTUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7RUFJQSxZQUFBLFNBQUEsTUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGNBQUEsS0FBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBOzs7O0VBSUEsWUFBQSxTQUFBLE1BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxjQUFBLEtBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7RUFJQSxjQUFBLFVBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztFQUlBLGdCQUFBLFNBQUEsU0FBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBO0lBQ0Es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LFNBQUEsTUFBQTtJQUNBLE9BQUE7UUFDQSxhQUFBLFVBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBO2dCQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztRQUlBLFFBQUEsU0FBQSxNQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7Ozs7Q0FPQSxRQUFBLDZCQUFBLFNBQUEsTUFBQTtJQUNBLE9BQUE7UUFDQSxpQkFBQSxVQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7UUFJQSxpQkFBQSxTQUFBLEtBQUE7WUFDQSxJQUFBLE9BQUEsUUFBQSxLQUFBO1lBQ0EsS0FBQSxXQUFBLEtBQUEsU0FBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBOzs7O1FBSUEsZ0JBQUEsU0FBQSxhQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7UUFJQSxlQUFBLFdBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7Ozs7O0FDaktBLFFBQUEsT0FBQSxlQUFBOztDQUVBLFdBQUEsMEZBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxRQUFBLGVBQUE7SUFDQSxJQUFBLE9BQUE7O0lBRUEsU0FBQSxXQUFBLE1BQUE7UUFDQSxlQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLFVBQUEsU0FBQTs7O0lBR0EsU0FBQSxXQUFBOztJQUVBLEtBQUEsT0FBQSxTQUFBLGFBQUEsTUFBQTtJQUNBLEtBQUEsT0FBQSxhQUFBO0lBQ0EsS0FBQSxjQUFBLENB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QSxjQUFBLFFBQUEsYUFBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLFNBQUE7RUFDQSxRQUFBO0VBQ0EsUUFBQTs7O0NBR0EsU0FBQSxXQUFBLE1BQUE7RUFDQSxhQUFBLEtBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsUUFBQSxTQUFBOzs7Q0FHQSxTQUFBLFdBQUE7O0NBRUEsS0FBQSxPQUFBLFNBQUEsYUFBQSxNQUFBO0NBQ0EsS0FBQSxPQUFBLGFBQUE7Q0FDQSxLQUFBLGNBQUEsQ0FBQSxXQUFBLFFBQUE7Q0FDQTtDQUNBOzs7Q0FHQSxLQUFBLFdBQUEsV0FBQTtFQUNBLEtBQUE7RUFDQSxXQUFBLEtBQUE7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7Q0FFQSxLQUFBLFdBQUEsV0FBQTtFQUNBLElBQUEsS0FBQSxPQUFBLEdBQUE7R0FDQSxLQUFBO0dBQ0EsV0FBQSxLQUFBO0dBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7OztDQUdBLEtBQUEsY0FBQSxXQUFBO0VBQ0E7RUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7Ozs7Q0FLQSxRQUFBLDBCQUFBLFNBQUEsTUFBQTs7Q0FFQSxPQUFBO0VBQ0EsTUFBQSxVQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsTUFBQTs7R0FFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsTUFBQSxPQUFBLFdBQUE7O0dBRUEsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7RUFJQSxNQUFBLFNBQUEsSUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGNBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0FD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QUFBLEVBQUEsS0FBQSxPQUFBLE9BQUEsT0FBQSxLQUFBO2NBQ0EsUUFBQSxPQUFBLE9BQUEsT0FBQSxJQUFBOztZQUVBLGFBQUEsS0FBQSxPQUFBOzs7O1FBSUEsT0FBQSxNQUFBLFVBQUEsT0FBQSxNQUFBLElBQUE7Ozs7Ozs7TUFPQSxLQUFBLGdCQUFBLFNBQUEsYUFBQSxTQUFBO1FBQ0EsSUFBQTtRQUNBLElBQUEsWUFBQSxXQUFBO1VBQ0EsSUFBQSxRQUFBLFFBQUEsV0FBQSxlQUFBLGdCQUFBO1VBQ0EsSUFBQSxTQUFBLElBQUEsT0FBQTtVQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxNQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7WUFDQSxLQUFBLE1BQUE7WUFDQSxRQUFBLFFBQUE7WUFDQSxJQUFBLFNBQUE7WUFDQSxPQUFBLEtBQUE7O1VBRUEsT0FBQTs7OztRQUlBLElBQUEsaUJBQUEsU0FBQSxHQUFBLEdBQUE7VUFDQSxJQUFBLFNBQUEsSUFBQSxNQUFBLElBQUEsR0FBQTtVQUNBLEtBQUEsSUFBQSxHQUFBLElBQUEsRUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO1lBQ0EsSUFBQSxFQUFBLE1BQUE7O1VBRUEsS0FBQSxJQUFBLEdBQUEsSUFBQSxFQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsSUFBQSxFQUFBLEtBQUE7Y0FDQSxPQUFBLEtBQUEsRUFBQTs7O1VBR0EsT0FBQTs7OztRQUlBLElBQUEsTUFBQTs7UUFFQSxJQUFBLGVBQUEsU0FBQSxXQUFBLFdBQUE7VUFDQSxJQUFBLEdBQUEsR0FBQSxJQUFBO1VBQ0EsSUFBQSxpQkFBQTtVQUNBLElBQUEsZ0JBQUEsZUFBQSxXQUFBO1VBQ0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxjQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7WUFDQSxJQUFBLGVBQUEsY0FBQTtZQUNBLEtBQUEsSUFBQTtZQUNBLE9BQUEsSUFBQTtZQUNBLElBQUEsV0FBQSxRQUFBOztZQUVBLElBQUEsYUFBQSxjQUFBO2NBQ0EsS0FBQSxVQUFBO21CQUNBO2NBQ0EsZUFBQSxZQUFBO2NBQ0EsS0FBQSxVQUFBOzs7O1VBSUEsSUFBQSxjQUFBLGVBQUEsV0FBQTtVQUNBLEtBQUEsSUFBQSxHQUFBLElBQUEsWUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO1lBQ0EsUUFBQSxZQUFBO1lBQ0EsS0FBQSxJQUFBO1lBQ0EsSUFBQSxDQUFBLGVBQUEsUUFBQTtjQUNBLEtBQUEsUUFBQTs7OztRQUlBLE9BQUE7VUFDQSxXQUFBLFNBQUEsT0FBQSxXQUFBO1lBQ0EsTUFBQSxPQUFBLFdBQUEsU0FBQSxXQUFBLFdBQUE7Y0FDQSxJQUFBLENBQUEsYUFBQSxVQUFBLFdBQUEsZUFBQSxPQUFBO2dCQUNBLGFBQUEsV0FBQTs7ZUFFQTs7VUFFQSxTQUFBLFFBQUE7VUFDQSxXQUFBLFFBQUE7VUFDQSxXQUFBLFFBQUE7O1FBRUEsT0FBQTs7O01BR0EsS0FBQSx3QkFBQSxTQUFBLGtCQUFBLGlCQUFBO1VBQ0EsSUFBQSxTQUFBOztVQUVBLFFBQUEsT0FBQSxRQUFBO1VBQ0EsUUFBQSxPQUFBLFFBQUE7O1VBRUEsUUFBQSxRQUFBLFFBQUEsU0FBQSxNQUFBLElBQUE7WUFDQSxJQUFBLE9BQUEsVUFBQSxXQUFBO2NBQ0EsT0FBQSxPQUFBLDJCQUFBLE9BQUE7Ozs7VUFJQSxPQUFBOzs7SUFHQSxLQUFBLGtCQUFBLFNBQUEsb0JBQUE7TUFDQSxJQUFBLENBQUEsbUJBQUEsUUFBQSxtQkFBQSxhQUFBOztRQUVBLElBQUEsVUFBQSxTQUFBLE1BQUE7O1VBRUEsSUFBQSxHQUFBO1VBQ0EsSUFBQTtVQUNBLEtBQUEsS0FBQSxNQUFBO1lBQ0EsRUFBQSxLQUFBLEtBQUE7O1VBRUEsT0FBQTs7UUFFQSxJQUFBLE1BQUEsUUFBQTtRQUNBLE9BQUE7VUFDQSxZQUFBLFFBQUEsSUFBQTtVQUNBLGlCQUFBLFFBQUEsSUFBQTtVQUNBLFVBQUEsUUFBQSxJQUFBO1VBQ0EsZUFBQSxRQUFBLElBQUE7OztNQUdBLE9BQUE7OztHQUdBLFVBQUEsY0FBQSxDQUFBLG9CQUFBLFNBQUEsa0JBQUE7SUFDQSxPQUFBO01BQ0EsVUFBQTtNQUNBLE9BQUEsQ0FBQSxhQUFBLFdBQUEsb0JBQUE7TUFDQSxZQUFBO01BQ0EsTUFBQSxTQUFBLE9BQUEsS0FBQSxPQUFBLFlBQUE7O1FBRUEsSUFBQSxVQUFBLE1BQUE7WUFDQSxpQkFBQTtZQUNBLHNCQUFBLFdBQUEsY0FBQSxTQUFBLFdBQUE7WUFDQSxnQkFBQSxXQUFBLGNBQUEsV0FBQSxXQUFBLFdBQUE7WUFDQSxVQUFBOztRQUVBLFNBQUEsWUFBQTtVQUNBLElBQUEsbUJBQUEsTUFBQSxhQUFBLE1BQUEsUUFBQSxNQUFBLE1BQUEsY0FBQTtjQUNBOztVQUVBLHFCQUFBLFdBQUEsc0JBQUEsa0JBQUE7O1VBRUEsSUFBQSwyQkFBQSxXQUFBLGdCQUFBO1VBQ0EsUUFBQSxPQUFBLDBCQUFBOztVQUVBLFVBQUEsRUFBQSxjQUFBO1VBQ0EsUUFBQSxPQUFBLFNBQUE7O1VBRUEsSUFBQSxXQUFBO1VBQ0EsSUFBQSxJQUFBLEtBQUEsUUFBQTtZQUNBLEdBQUEsTUFBQSxlQUFBO2NBQ0EsU0FBQSxLQUFBLFFBQUE7OztVQUdBLE9BQUEsS0FBQSxVQUFBOzs7UUFHQSxNQUFBLFVBQUEsVUFBQTtVQUNBLEdBQUEsTUFBQSxZQUFBLE1BQUEsU0FBQSxhQUFBO1lBQ0EsTUFBQSxTQUFBLGFBQUE7O1VBRUEsR0FBQSxNQUFBLFVBQUE7WUFDQSxNQUFBLFdBQUEsTUFBQSxRQUFBLE1BQUEsYUFBQSxFQUFBLEtBQUEsS0FBQTtpQkFDQTtZQUNBLE1BQUEsV0FBQSxFQUFBLEtBQUEsS0FBQTs7OztRQUlBLE1BQUEsT0FBQSxVQUFBO1VBQ0EsTUFBQSxTQUFBLGFBQUE7OztRQUdBLG9CQUFBLFVBQUEsU0FBQSxRQUFBO1lBQ0EsTUFBQSxTQUFBLGFBQUEsa0JBQUE7WUFDQSxpQkFBQTs7O1FBR0Esb0JBQUEsWUFBQSxTQUFBLFFBQUE7VUFDQSxNQUFBLFNBQUEsYUFBQSxxQkFBQTtVQUNBLGlCQUFBOzs7UUFHQSxjQUFBLFVBQUEsU0FBQSxPQUFBO1VBQ0EsTUFBQSxTQUFBLGFBQUEsZUFBQTs7O1FBR0EsY0FBQSxZQUFBLFNBQUEsT0FBQTtVQUNBLE1BQUEsU0FBQSxhQUFBLGdCQUFBLFNBQUEsR0FBQTtZQUNBLE9BQUEsRUFBQSxRQUFBLE1BQUE7Ozs7UUFJQSxjQUFBLFlBQUEsU0FBQSxPQUFBO1VBQ0EsTUFBQSxTQUFBLEVBQUEsYUFBQSxPQUFBLE1BQUE7VUFDQSxNQUFBLE9BQUEsRUFBQSxhQUFBLE9BQUEsTUFBQTtVQUNBLE1BQUEsU0FBQSxhQUFBLGVBQUE7OztRQUdBLG9CQUFBLFVBQUE7UUFDQSxjQUFBLFVBQUEsT0FBQSxTQUFBLFdBQUEsV0FBQTtVQUNBLElBQUEsbUJBQUEsTUFBQTtZQUNBLGlCQUFBOztZQUVBLE9BQUE7Ozs7UUFJQSxNQUFBLE9BQUEsWUFBQSxTQUFBLEtBQUEsS0FBQTtZQUNBLE1BQUE7WUFDQSxNQUFBOzs7OztBQ3RSQSxJQUFBLFVBQUEsV0FBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsUUFBQSxLQUFBLG9CQUFBLFNBQUEsT0FBQTtZQUNBLEdBQUEsQ0FBQSxNQUFBLFVBQUEsQ0FBQSxNQUFBLFlBQUEsQ0FBQSxNQUFBLFdBQUEsTUFBQSxVQUFBLElBQUE7Z0JBQ0EsTUFBQSxPQUFBLFVBQUE7b0JBQ0EsTUFBQSxNQUFBLE1BQUEsU0FBQSxDQUFBLFNBQUE7OztnQkFHQSxNQUFBOzs7OztBQ1JBLElBQUEsVUFBQSxnQ0FBQSxTQUFBLFNBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQSxTQUFBLE9BQUE7UUFDQSxRQUFBLFFBQUEsU0FBQSxLQUFBLFVBQUEsV0FBQTtNQUNBLElBQUEsZ0JBQUEsaUJBQUEsU0FBQSxPQUFBLGNBQUEsU0FBQSxnQkFBQTtNQUNBLElBQUEsVUFBQSxTQUFBLE1BQUEsT0FBQSxTQUFBO01BQ0EsSUFBQSxjQUFBLEtBQUEsSUFBQSxLQUFBLGNBQUEsS0FBQSxjQUFBLEtBQUEsZUFBQSxLQUFBLGNBQUEsS0FBQTtNQUNBLGlCQUFBLGVBQUEsT0FBQTs7TUFFQSxJQUFBLGdCQUFBLFdBQUE7O09BRUEsTUFBQSxTQUFBLE1BQUEsU0FBQSxNQUFBO1VBQ0EsTUFBQTs7Ozs7QUNYQSxJQUFBLFVBQUEsa0JBQUEsV0FBQTtFQUNBLE9BQUE7SUFDQSxTQUFBO0lBQ0EsTUFBQSxTQUFBLE9BQUEsU0FBQSxPQUFBLFNBQUE7TUFDQSxRQUFBLFNBQUEsS0FBQSxTQUFBLE9BQUE7UUFDQSxPQUFBLEtBQUE7O01BRUEsUUFBQSxZQUFBLEtBQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxXQUFBLE9BQUE7Ozs7O0FDUkEsSUFBQSxPQUFBLGFBQUEsWUFBQTtJQUNBLE9BQUEsVUFBQSxPQUFBLFVBQUEsS0FBQSxNQUFBO1FBQ0EsSUFBQSxDQUFBLE9BQUEsT0FBQTs7UUFFQSxNQUFBLFNBQUEsS0FBQTtRQUNBLElBQUEsQ0FBQSxLQUFBLE9BQUE7UUFDQSxJQUFBLE1BQUEsVUFBQSxLQUFBLE9BQUE7O1FBRUEsUUFBQSxNQUFBLE9BQUEsR0FBQTtRQUNBLElBQUEsVUFBQTtZQUNBLElBQUEsWUFBQSxNQUFBLFlBQUE7WUFDQSxJQUFBLGFBQUEsQ0FBQSxHQUFBO2dCQUNBLFFBQUEsTUFBQSxPQUFBLEdBQUE7Ozs7UUFJQSxPQUFBLFNBQUEsUUFBQTs7OztBQ2hCQSxJQUFBLE9BQUEsYUFBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUE7UUFDQSxHQUFBLFVBQUEsVUFBQTtZQUNBLElBQUEsSUFBQSxNQUFBLE1BQUE7WUFDQSxJQUFBLEVBQUEsSUFBQSxNQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBO1lBQ0EsT0FBQSxJQUFBLEtBQUEsR0FBQTs7OztBQ0xBLElBQUEsT0FBQSxXQUFBLENBQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxRQUFBO1FBQ0EsT0FBQSxRQUFBLE9BQUEsSUFBQTs7O0FDRkEsSUFBQSxPQUFBLE9BQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxTQUFBLE9BQUE7OztBQ0ZBLElBQUEsT0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBLEtBQUE7UUFDQSxRQUFBLFNBQUE7UUFDQSxNQUFBLFNBQUE7UUFDQSxJQUFBO1FBQ0EsR0FBQSxRQUFBLElBQUE7WUFDQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Z0JBQ0EsTUFBQSxLQUFBO2FBQ0E7WUFDQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Z0JBQ0EsTUFBQSxLQUFBOztRQUVBLE9BQUE7OztBQ1pBLElBQUEsT0FBQSxnQ0FBQSxTQUFBO0FBQ0E7SUFDQSxPQUFBLFNBQUE7SUFDQTtRQUNBLE9BQUEsS0FBQSxZQUFBOzs7O0FDSkEsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOztJQUVBLGVBQUEsTUFBQSxTQUFBO1FBQ0EsS0FBQTtRQUNBLFFBQUE7UUFDQSxVQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTtnQkFDQSxjQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxlQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7O0lBS0EsZUFBQSxNQUFBLGVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxvQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDBCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDJCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7OztBQzdEQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7Ozs7Q0FJQSxlQUFBLE1BQUEsUUFBQTtFQUNBLEtBQUE7RUFDQSxRQUFBO0VBQ0EsVUFBQTtFQUNBLE9BQUE7R0FDQSxZQUFBO0lBQ0EsYUFBQTtJQUNBLFlBQUE7Ozs7Q0FJQSxtQkFBQSxLQUFBLFNBQUE7Q0FDQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsZUFBQTtFQUNBLEtBQUE7RUFDQSxhQUFBO0VBQ0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTtFQUNBLFlBQUE7O0NBRUEsZUFBQSxNQUFBLGNBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTs7Q0FFQSxlQUFBLE1BQUEsY0FBQTtFQUNBLEtBQUE7RUFDQSxhQUFBO0VBQ0Esb0VBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxZQUFBO0dBQ0EsT0FBQSxRQUFBLENBQUEsT0FBQSxJQUFBLE9BQUEsYUFBQTs7R0FFQSxPQUFBLGdCQUFBO0dBQ0E7O0lBRUE7TUFDQSxjQUFBLE9BQUE7TUFDQSxRQUFBLFNBQUEsU0FBQTtNQUNBLE9BQUEsb0JBQUE7TUFDQSxPQUFBLFFBQUEsQ0FBQSxPQUFBLElBQUEsT0FBQSxhQUFBOztNQUVBLE1BQUEsU0FBQSxTQUFBO01BQ0EsV0FBQSxxQkFBQSxVQUFBO01BQ0EsT0FBQSxvQkFBQTs7TUFFQSxLQUFBLFNBQUEsU0FBQTtNQUNBLEdBQUEsU0FBQSxLQUFBLFdBQUE7TUFDQTtPQUNBLE9BQUEsb0JBQUE7Ozs7OztDQU1BLGVBQUEsTUFBQSxlQUFBO0VBQ0EsS0FBQTtFQUNBLDRCQUFBLFNBQUEsWUFBQTtHQUNBLFlBQUE7O0VBRUEsWUFBQTs7OztBQzNFQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7OztDQUdBLGVBQUEsTUFBQSxpQkFBQTtFQUNBLEtBQUE7RUFDQSxRQUFBO0VBQ0EsTUFB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QSxZQUFBO0lBQ0EsY0FBQTs7O0VBR0EsWUFBQTs7O0lBR0EiLCJmaWxlIjoiYXBwLmpzIiwic291cmNlc0NvbnRlbnQiOlsidmFyIGFwcCA9IGFuZ3VsYXIubW9kdWxlKCdhcHAnLFxuXHRbXG5cdFx0J2FuZ3VsYXItand0Jyxcblx0XHQndWkucm91dGVyJyxcblx0XHQnYXBwLmF1dGgnLFxuXHRcdCdhcHAuZXJyb3JoYW5kbGVyJyxcblx0XHQndWkuY2FsZW5kYXInLFxuXHRcdCd1aS5ib290c3RyYXAnLFxuXHRcdCd1aS5ib290c3RyYXAuZGF0ZXRpbWVwaWNrZXInLFxuXHRcdCd1aS5zb3J0YWJsZScsXG5cdFx0J2FwcC5zZXR0aW5ncycsXG5cdFx0J2FwcC5kYXNoYm9hcmQnLFxuXHRcdCdhcHAuY29tcGV0aXRpb25zJyxcblx0XHQnYXBwLmNoYW1waW9uc2hpcHMnLFxuXHRcdCdhcHAuc2lnbnVwcycsXG5cdFx0J2FwcC51c2VycycsXG5cdFx0J2FwcC5jbHVicycsXG5cdFx0J2FwcC5jYWxlbmRhcicsXG5cdFx0J2FwcC50ZWFtcydcblx0XSwgZnVuY3Rpb24oJGludGVycG9sYXRlUHJvdmlkZXIpe1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCc8JScpO1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnJT4nKTtcbn0pO1xuXG5hcHAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIEVycm9ySGFuZGxlckZhY3RvcnksIGp3dEhlbHBlciwgQXV0aEZhY3RvcnksICR3aW5kb3csICRsb2NhdGlvbikge1xuXG5cdCR3aW5kb3cuZ2EoJ2NyZWF0ZScsICdVQS03NjIyMTYxOC0xJywgJ2F1dG8nKTtcblxuXHQkcm9vdFNjb3BlLiRvbignJHN0YXRlQ2hhbmdlU3RhcnQnLCBmdW5jdGlvbihlLCB0bykge1xuXHRcdHZhciB0b2tlbiA9IGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpO1xuXG5cdFx0JHJvb3RTY29wZS5jdXJyZW50Um91dGUgPSB0by5uYW1lO1xuXG5cdFx0aWYodG9rZW4gIT09IG51bGwpe1xuXHRcdFx0JHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gdHJ1ZTtcblx0XHRcdHZhciB1c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcblx0XHRcdCRyb290U2NvcGUuY3VycmVudFVzZXIgPSB1c2VyO1xuXHRcdH1cblxuXHRcdGlmKCh0by5uYW1lLnNwbGl0KFwiLlwiLCAxKVswXSA9PSAnYXV0aCcpICYmICRyb290U2NvcGUuYXV0aGVudGljYXRlZCl7XG5cdFx0XHQkc3RhdGUuZ28oJ2Rhc2hib2FyZCcsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0fVxuXG5cdFx0aWYgKHRvLnJlc3RyaWN0ZWQpIHtcblxuXHRcdFx0Ly8gUmVzdHJpY3QgZ3VhcmRlZCByb3V0ZXMuXG5cdFx0XHRpZiAodG9rZW4gPT09IG51bGwpIHtcblx0XHRcdFx0ZS5wcmV2ZW50RGVmYXVsdCgpO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcblx0XHRcdH1cblxuXHRcdFx0Lypcblx0XHRcdGlmICh0b2tlbiAhPT0gbnVsbCAmJiBqd3RIZWxwZXIuaXNUb2tlbkV4cGlyZWQodG9rZW4pKSB7XG5cdFx0XHRcdEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4oKTtcblx0XHRcdH1cblx0XHRcdCovXG5cblx0XHRcdCRyb290U2NvcGUuZGF0ZXBpY2tlck9wdGlvbnMgPSB7XG5cdFx0XHRcdHNob3dXZWVrczogdHJ1ZSxcblx0XHRcdFx0c3RhcnRpbmdEYXk6IDFcblx0XHRcdH07XG5cdFx0XHQkcm9vdFNjb3BlLnRpbWVwaWNrZXJPcHRpb25zID0ge1xuXHRcdFx0XHRzaG93TWVyaWRpYW46IGZhbHNlLFxuXHRcdFx0XHRtaW51dGVTdGVwOiAxNVxuXHRcdFx0fTtcblxuXHRcdH1cblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9ICcnO1xuXG5cdH0pO1xuXG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdWNjZXNzJywgZnVuY3Rpb24gKGV2ZW50KSB7XG5cdFx0JHdpbmRvdy5nYSgnc2VuZCcsICdwYWdldmlldycsICRsb2NhdGlvbi5wYXRoKCkpO1xuXHR9KTtcblxuXHQvKipcblx0ICogR2VuZXJhdGVzIGZsYXNoIG1lc3NhZ2VzIGJhc2VkIG9uIGdpdmVuIGFycmF5IG9yIHN0cmluZyBvZiBtZXNzYWdlcy5cblx0ICogSGlkZXMgZXZlcnkgbWVzc2FnZSBhZnRlciA1IHNlY29uZHMuXG5cdCAqXG5cdCAqIEBwYXJhbSAgbWl4ZWQgIG1lc3NhZ2VzXG5cdCAqIEBwYXJhbSAgc3RyaW5nIHR5cGVcblx0ICogQHJldHVybiB2b2lkXG5cdCAqL1xuXHQkcm9vdFNjb3BlLmNhdGNoRXJyb3IgPSBmdW5jdGlvbihyZXNwb25zZSlcblx0e1xuXHRcdC8vIFJlc2V0IGFsbCBlcnJvci0gYW5kIHN1Y2Nlc3MgbWVzc2FnZXMuXG5cdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzID0gW107XG5cdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblxuXHRcdGlmKHR5cGVvZiByZXNwb25zZSA9PT0gJ3N0cmluZycpXG5cdFx0e1xuXHRcdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzLnB1c2gocmVzcG9uc2UpO1xuXHRcdH1cblx0XHRlbHNlXG5cdFx0e1xuXHRcdFx0Y29uc29sZS5sb2cocmVzcG9uc2UpO1xuXHRcdFx0aWYocmVzcG9uc2UpXG5cdFx0XHR7XG5cdFx0XHRcdGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZSwgZnVuY3Rpb24oZXJyb3JNZXNzYWdlKXtcblx0XHRcdFx0XHR2YXIgbWVzc2FnZSA9ICh0eXBlb2YgZXJyb3JNZXNzYWdlID09PSAnc3RyaW5nJykgPyBlcnJvck1lc3NhZ2UgOiBlcnJvck1lc3NhZ2VbMF07XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzLnB1c2gobWVzc2FnZSk7XG5cdFx0XHRcdH0pO1xuXG5cdFx0XHRcdGNvbnNvbGUubG9nKCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyk7XG5cblx0XHRcdFx0JHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMgPSBbXTtcblx0XHRcdFx0fSwgNTAwMCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9O1xuXG5cblx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyA9IGZ1bmN0aW9uKG1lc3NhZ2VzLCB0eXBlKVxuXHR7XG5cdFx0JHRpbWVvdXQuY2FuY2VsKCRyb290U2NvcGUuZXJyb3JNZXNzYWdlVGltZXIpO1xuXHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdCRyb290U2NvcGUuc3VjY2Vzc01lc3NhZ2VzID0gW107XG5cblx0XHRpZihhbmd1bGFyLmlzU3RyaW5nKG1lc3NhZ2VzKSkgbWVzc2FnZXMgPSBbbWVzc2FnZXNdO1xuXG5cdFx0dmFyIHVud2FudGVkTWVzc2FnZXMgPSBbJ3Rva2VuX25vdF9wcm92aWRlZCddO1xuXHRcdHZhciBpY29uID0gKHR5cGUgPT0gJ3N1Y2Nlc3MnKSA/ICdjaGVjay1jaXJjbGUnIDogJ2luZm8tY2lyY2xlJztcblxuXHRcdGFuZ3VsYXIuZm9yRWFjaChtZXNzYWdlcywgZnVuY3Rpb24obWVzc2FnZSl7XG5cblx0XHRcdGlmKHVud2FudGVkTWVzc2FnZXMuaW5kZXhPZihtZXNzYWdlKSA8IDApXG5cdFx0XHR7XG5cdFx0XHRcdHZhciB0ZXh0ID0gKHR5cGVvZiBtZXNzYWdlID09PSAnc3RyaW5nJykgPyBtZXNzYWdlIDogbWVzc2FnZVswXTtcblx0XHRcdFx0aWYodHlwZSA9PSAnZXJyb3InKVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzLnB1c2godGV4dCk7XG5cdFx0XHRcdH1cblx0XHRcdFx0ZWxzZVxuXHRcdFx0XHR7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMucHVzaCh0ZXh0KTtcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0pO1xuXG5cdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VUaW1lciA9ICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMgPSBbXTtcblx0XHRcdCRyb290U2NvcGUuc3VjY2Vzc01lc3NhZ2VzID0gW107XG5cdFx0fSwgNTAwMCk7XG5cdH07XG5cblx0LyoqXG5cdCAqIEdsb2JhbCBmdW5jdGlvbiBmb3IgcmVwb3J0aW5nIHRvcCBsZXZlbCBlcnJvcnMuIE1ha2VzIGFuIGFqYXggY2FsbCBmb3Igc2VuZGluZyBhIGJ1ZyByZXBvcnQuXG5cdCAqIEBwYXJhbSB7b2JqZWN0fSBlcnJvclxuXHQgKiBAcGFyYW0ge3N0cmluZ30gY2F1c2Vcblx0ICovXG5cdCRyb290U2NvcGUucmVwb3J0RXJyb3IgPSBmdW5jdGlvbihlcnJvciwgY2F1c2UpXG5cdHtcblx0XHRpZighY2F1c2UpIGNhdXNlID0gJ0Zyb250ZW5kJztcblxuXHRcdEVycm9ySGFuZGxlckZhY3Rvcnlcblx0XHRcdC5yZXBvcnRFcnJvcihlcnJvciwgY2F1c2UpXG5cblx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0aWYocmVzcG9uc2UubWVzc2FnZSl7XG5cdFx0XHRcdFx0aWYocmVzcG9uc2UubWVzc2FnZSkgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhbcmVzcG9uc2UuZGF0YS5tZXNzYWdlXSwgJ3dhcm5pbmcnKTtcblx0XHRcdFx0fSBlbHNlIGlmKHJlc3BvbnNlLmRhdGEpe1xuXHRcdFx0XHRcdGlmKHJlc3BvbnNlLmRhdGEubWVzc2FnZSkgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhbcmVzcG9uc2UuZGF0YS5tZXNzYWdlXSwgJ3dhcm5pbmcnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmF1dGgnLCBbXSlcbiAgICAuY29udHJvbGxlcignQXV0aENvbnRyb2xsZXInLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCBBdXRoRmFjdG9yeSwgJHVpYk1vZGFsLCAkdGltZW91dCl7XG5cbiAgICAgICAgJHNjb3BlLmF1dGggPVxuICAgICAgICB7XG4gICAgICAgICAgICBlbWFpbFx0OiAnJyxcbiAgICAgICAgICAgIG5hbWUgICAgOiAnJyxcbiAgICAgICAgICAgIGxhc3RuYW1lOiAnJyxcbiAgICAgICAgICAgIHBhc3N3b3JkOiAnJyxcbiAgICAgICAgICAgIGludml0ZV90b2tlbjogJHN0YXRlUGFyYW1zLmludml0ZV90b2tlblxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgJHNjb3BlLmxvZ2dpbmdJbiA9IHRydWU7XG5cbiAgICAgICAgICAgIHZhciBjcmVkZW50aWFscyA9IHtcbiAgICAgICAgICAgICAgICBlbWFpbDogJHNjb3BlLmF1dGguZW1haWwsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICRzY29wZS5hdXRoLnBhc3N3b3JkXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBBdXRoRmFjdG9yeS5hdXRoZW50aWNhdGUoY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Rva2VuJywgcmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICBBdXRoRmFjdG9yeS5nZXRVc2VyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCBKU09OLnN0cmluZ2lmeShyZXNwb25zZS51c2VyKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2dnaW5nSW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZSA9PSAndXNlcl9ub3RfYWN0aXZlJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoLmluYWN0aXZlJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2dnaW5nSW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5yZWdpc3RlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJHNjb3BlLnJlZ2lzdGVyU3RhdGUgPSAncmVnaXN0cmVyaW5nJztcblxuICAgICAgICAgICAgQXV0aEZhY3RvcnkucmVnaXN0ZXIoJHNjb3BlLmF1dGgpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWdpc3RlclN0YXRlID0gJ2RvbmUnO1xuICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlZ2lzdGVyU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hdXRoID0ge307XG4gICAgICAgICAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWdpc3RlclN0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ha2VzIGEgcmVxdWVzdCBmb3Igc2VuZGluZyBhIHBhc3N3b3JkIHJlc2V0IGxpbmsuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAgICAgKi9cbiAgICAgICAgJHNjb3BlLnJlc2V0ID0ge2VtYWlsOiAnJ307XG4gICAgICAgICRzY29wZS5yZXF1ZXN0UGFzc3dvcmRSZXNldCA9IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgQXV0aEZhY3RvcnlcbiAgICAgICAgICAgICAgICAucmVxdWVzdFBhc3N3b3JkUmVzZXQoe2VtYWlsOiAkc2NvcGUucmVzZXQuZW1haWx9KVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0LmVtYWlsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnc3VjY2VzcycpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudGVybXNNb2RhbE9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnRlcm1zTW9kYWwgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiAkc2NvcGUuYW5pbWF0aW9uc0VuYWJsZWQsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvdGVybXMnLFxuICAgICAgICAgICAgICAgIHNpemU6ICdtZCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHVpYk1vZGFsSW5zdGFuY2Upe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdtb2RhbCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSlcblxuICAgIC5jb250cm9sbGVyKCdBY3RpdmF0aW9uQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzdGF0ZSwgJHJvb3RTY29wZSwgJHNjb3BlLCAkaHR0cCwgJHN0YXRlUGFyYW1zLCBBdXRoRmFjdG9yeSwgJHRpbWVvdXQpe1xuICAgICAgICAkc2NvcGUuYWN0aXZhdGUgPSB7XG4gICAgICAgICAgICB0b2tlbjogJHN0YXRlUGFyYW1zLnRva2VuXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS52ZXJpZnlUb2tlbiA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgQXV0aEZhY3RvcnkuYWN0aXZhdGUoJHNjb3BlLmFjdGl2YXRlKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmFjdGl2YXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcsIHt9LCB7bG9jYXRpb246ICdyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9LCAzMDAwKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfSlcblxuICAgIC5mYWN0b3J5KCdBdXRoRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkZmlsdGVyLCAkdGltZW91dCwgJHN0YXRlLCAkcm9vdFNjb3BlKXtcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTdG9yZXMgdGhlIHVzZXIgZGF0YSBhbmQgdXBkYXRlcyB0aGUgcm9vdHNjb3BlIHZhcmlhYmxlcy4gVGhlbiByZWRpcmVjdHMgdG8gZGFzaGJvYXJkLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSAgb2JqZWN0ICAkdXNlclxuICAgICAgICAgICAgICogQHJldHVybiB2b2lkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogZnVuY3Rpb24oY3JlZGVudGlhbHMpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2F1dGhlbnRpY2F0ZScsXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6IGNyZWRlbnRpYWxzXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBnZXRVc2VyOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvYXV0aGVudGljYXRlL3VzZXInXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENsZWFycyBhbGwgdXNlciBkYXRhIGFuZCByb290c2NvcGUgdXNlciB2YXJpYWJsZXMuIFRoZW4gcmVkaXJlY3RzIHRvIGxvZ2luIGZvcm0uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB2b2lkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ291dDogZnVuY3Rpb24oKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoLmxvZ2luJywge30sIHtsb2NhdGlvbjogJ3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXF1ZXN0UGFzc3dvcmRSZXNldDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wYXNzd29yZC9lbWFpbCcsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzZXRQYXNzd29yZDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9wYXNzd29yZC9yZXNldCcsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVnaXN0ZXI6IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvcmVnaXN0ZXInLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFjdGl2YXRlOiBmdW5jdGlvbih0b2tlbikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2FjdGl2YXRlJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0odG9rZW4pXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhdHRlbXB0UmVmcmVzaFRva2VuOiBmdW5jdGlvbihyZXF1ZXN0VG9kb1doZW5Eb25lKXtcblxuICAgICAgICAgICAgICAgIC8vIFJ1biB0aGUgY2FsbCB0byByZWZyZXNoIHRoZSB0b2tlbi5cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9yZWZyZXNoJ1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBubyByZXNwb25zZSB0b2tlbiBpcyByZXRyaWV2ZWQsIGdvIHRvIHRoZSBsb2dpbiBwYWdlLFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJldmVudCB0aGUgcmVxdWVzdCBmcm9tIGJlaW5nIHJldHJpZWQgYnkgc2V0dGluZyByZXF1ZXN0VG9kb1doZW5Eb25lID0gZmFsc2UgYW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyByZXR1cm4gZmFsc2UgdG8gYWxsb3cgZm9yIGN1c3RvbSBjYWxsYmFja3MgYnkgY2hlY2tpbmcgaWYoQXV0aEZhY3RvcnkuYXR0ZW1wdFJlZnJlc2hUb2tlbigpID09PSBmYWxzZSkuXG4gICAgICAgICAgICAgICAgICAgICAgICBpZighcmVzcG9uc2UudG9rZW4pXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdFRvZG9XaGVuRG9uZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoLmxvZ2luJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBTZXQgdGhlIHJlZnJlc2hlZCB0b2tlbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5zZXRJdGVtKCd0b2tlbicsIHJlc3BvbnNlLnRva2VuKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIGEgcmVxdWVzdCBzaG91bGQgYmUgcmV0cmllZCBhZnRlciByZWZyZXNoLCBmb3IgZXhhbXBsZSBvbiBwdWxsLXRvLXJlZnJlc2gsIHRoZSByZXF1ZXN0IGNvbmZpZ1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gaXMgcGFzc2VkIGludG8gdGhlIHJlcXVlc3RUb2RvV2hlbkRvbmUgcGFyYW1ldGVyLiBTZXQgdGhlIGF1dGhvcml6YXRpb24gdG9rZW4gdG8gdGhlIG5ld2x5IHJldHJpZXZlZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gdG9rZW4gYW5kIHJ1biB0aGUgcmVxdWVzdCBhZ2Fpbi5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8qXG4gICAgICAgICAgICAgICAgICAgICAgICBpZighYW5ndWxhci5pc1VuZGVmaW5lZChyZXF1ZXN0VG9kb1doZW5Eb25lKSAmJiByZXF1ZXN0VG9kb1doZW5Eb25lLmxlbmd0aCAhPT0gMClcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0VG9kb1doZW5Eb25lLmhlYWRlcnMgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICdBdXRob3JpemF0aW9uJzogJ0JlYXJlciAnICsgbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJylcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cChyZXF1ZXN0VG9kb1doZW5Eb25lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdFRvZG9XaGVuRG9uZSA9IHVuZGVmaW5lZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5sb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNhbGVuZGFyJywgW10pXG5cbi8qKlxuICogY2FsZW5kYXJEZW1vQXBwIC0gMC4xLjNcbiAqL1xuLmNvbnRyb2xsZXIoJ0NhbGVuZGFyQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzY29wZSwkaHR0cCwkdGltZW91dCkge1xuXHRcblx0ZnVuY3Rpb24gaW5pdCgpe1xuXHRcdFxuXHRcdCRhcGlVcmwgPSAnL2FwaS9jYWxlbmRhcic7XG5cdFxuXHRcdCRzY29wZS5jYWxlbmRhckV2ZW50cyA9IFt7XG4gICAgICAgICAgICB1cmw6IFwiL2FwaS9jYWxlbmRhclwiLFxuICAgICAgICB9XTtcblx0XG5cdCAgICAkc2NvcGUudWlDb25maWcgPSB7XG5cdCAgICAgIGNhbGVuZGFyOntcblx0XHQgICAgbGFuZzogJ3N2Jyxcblx0XHQgICAgYnV0dG9uVGV4dDoge1xuXHRcdFx0ICAgIHRvZGF5OiAgICAnaWRhZycsXG5cdFx0XHQgICAgbW9udGg6ICAgICdtw6VuYWQnLFxuXHRcdFx0ICAgIHdlZWs6ICAgICAndmVja2EnLFxuXHRcdFx0ICAgIGRheTogICAgICAnZGFnJ1xuXHRcdFx0fSxcblx0XHRcdGZpcnN0RGF5OiAnMScsXG5cdFx0XHR3ZWVrTnVtYmVyczogdHJ1ZSxcblx0XHRcdGhlYWRlcjoge1xuXHRcdFx0XHRsZWZ0OiAncHJldixuZXh0IHRvZGF5Jyxcblx0XHRcdFx0Y2VudGVyOiAndGl0bGUnLFxuXHRcdFx0XHRyaWdodDogJ21vbnRoLGFnZW5kYVdlZWssYWdlbmRhRGF5J1xuXHRcdFx0fSxcblx0XHRcdGNvbHVtbkZvcm1hdDoge1xuXHRcdFx0XHRkYXk6ICdkZGQgREQvTU0nLFxuXHRcdFx0XHR3ZWVrOiAnZGRkIEREL01NJyxcblx0XHRcdFx0bW9udGg6ICdkZGQnXG5cdFx0XHR9LFxuXHRcdFx0dGl0bGVGb3JtYXQ6IHtcblx0XHRcdCAgICBtb250aDogJ01NTU0gWVlZWScsIC8vIFNlcHRlbWJlciAyMDA5XG5cdFx0XHQgICAgd2VlazogXCJNTU1NIEQgWVlZWVwiLCAvLyBTZXAgMTMgMjAwOVxuXHRcdFx0ICAgIGRheTogJ01NTU0gRCBZWVlZJyAgLy8gU2VwdGVtYmVyIDggMjAwOVxuXHRcdFx0fSxcblx0XHRcdHdlZWtOdW1iZXJUaXRsZTogJycsXG5cdFx0XHRheGlzRm9ybWF0OiAnSDptbScsXG5cdFx0XHR0aW1lRm9ybWF0OiAnSDptbScsXG5cdFx0XHRtaW5UaW1lOiAnNjowMCcsXG5cdFx0XHRtYXhUaW1lOiAnMjM6NTknLFxuXHRcdFx0YWxsRGF5U2xvdDogZmFsc2UsXG5cdFx0XHRkZWZhdWx0VmlldzogJ21vbnRoJyxcblx0ICAgICAgICBoZWlnaHQ6IDUwMCxcblx0ICAgICAgICBlZGl0YWJsZTogZmFsc2UsXG5cdCAgICAgICAgdmlld1JlbmRlcjogZnVuY3Rpb24odmlldywgZWxlbWVudCkge1xuXHRcdFx0XHR2YXIgc3RhcnQgPSBEYXRlLnBhcnNlKHZpZXcuc3RhcnQuX2QpO1xuXHRcdFx0XHR2YXIgZW5kID0gRGF0ZS5wYXJzZSh2aWV3LmVuZC5fZCk7XG5cdFx0XHRcdCRzY29wZS5jYWxlbmRhckV2ZW50cyA9IFt7XG5cdFx0ICAgICAgICAgICAgdXJsOiBcIi9hcGkvY2FsZW5kYXI/c3RhcnQ9XCIrc3RhcnQrXCImZW5kPVwiK2VuZFxuXHRcdCAgICAgICAgfV07XG4gICAgICAgIFx0fSxcblx0XHRcdGV2ZW50Q2xpY2s6ICRzY29wZS5hbGVydE9uRXZlbnRDbGljayxcblx0ICAgICAgICBldmVudERyb3A6ICRzY29wZS5hbGVydE9uRHJvcCxcblx0ICAgICAgICBldmVudFJlc2l6ZTogZnVuY3Rpb24odmlldywgZWxlbWVudCkge1xuXHRcdCAgICAgICAgY29uc29sZS5sb2codmlldyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuY2hhbmdlVmlldyA9IGZ1bmN0aW9uKHZpZXcsY2FsZW5kYXIpIHtcblx0ICAgICAgY2FsZW5kYXIuZnVsbENhbGVuZGFyKCdjaGFuZ2VWaWV3Jyx2aWV3KTtcblx0ICAgIH07XG5cdFxuXHQgICAgJHNjb3BlLnJlbmRlckNhbGVuZGVyID0gZnVuY3Rpb24oY2FsZW5kYXIpIHtcblx0ICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0ICAgICAgIGNvbnNvbGUubG9nKDEyMyk7IFxuXHRcdFx0XHRpZihjYWxlbmRhcil7XG5cdFx0XHRcdGNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVuZGVyJyk7XG5cdFx0XHRcdH1cblx0ICAgICAgIH0sIDApO1xuXHQgICAgfTtcblx0fVxuXHRcblx0aW5pdCgpO1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNoYW1waW9uc2hpcHMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJDaGFtcGlvbnNoaXBzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDaGFtcGlvbnNoaXBzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlUGFnZShwYWdlKSB7XG4gICAgICAgIENoYW1waW9uc2hpcHNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNoYW1waW9uc2hpcHMgPSByZXNwb25zZS5jaGFtcGlvbnNoaXBzO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuICAgIHRoaXMucGFnZSA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5wYWdlLCAxMCk7XG4gICAgdGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG4gICAgdGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuICAgIHNvcnRMaXN0KCk7XG4gICAgdXBkYXRlUGFnZSgpO1xuXG5cbn0pXG4uY29udHJvbGxlcihcIkNoYW1waW9uc2hpcENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ2hhbXBpb25zaGlwc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgIENoYW1waW9uc2hpcHNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhbXBpb25zaGlwcyA9IHJlc3BvbnNlLmNoYW1waW9uc2hpcHM7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NoYW1waW9uc2hpcHMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG59KVxuXG4uZmFjdG9yeSgnQ2hhbXBpb25zaGlwc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHBhZ2UsIGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gJy9hcGkvY2hhbXBpb25zaGlwcyc7XG5cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG4gICAgICAgICAgICBpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogJy9hcGkvY2hhbXBpb25zaGlwcy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3NpZ251cCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogJy9hcGkvc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oc2lnbnVwKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVsZXRlU2lnbnVwOiBmdW5jdGlvbihzaWdudXApIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3NpZ251cC8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2x1YnMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJDbHViQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYuc2VhcmNoUXVlcnkgPSAnJztcblx0c2VsZi5zZWxlY3RlZGNsdWIgPSB7fTtcblx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdHNlbGYuYWRkX2NsdWJzX25yID0gJyc7XG5cdHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuXHRzZWxmLmFkZF9hZG1pbiA9IG51bGw7XG5cblx0ZnVuY3Rpb24gbG9hZFVzZXJDbHViKCkge1xuXHRcdENsdWJzRmFjdG9yeS5sb2FkVXNlckNsdWIoKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnNlbGVjdGVkQ2x1YnMgPSAnJztcblx0XHRcdFx0c2VsZi5jbHViID0gcmVzcG9uc2U7XG5cdFx0XHR9KTtcblx0fVxuXG5cdHNlbGYuc2VhcmNoRm9yQ2x1YnMgPSBmdW5jdGlvbihzZWFyY2hRdWVyeSwgY2x1Yilcblx0e1xuXHRcdHJldHVybiBDbHVic0ZhY3Rvcnlcblx0XHRcdC5zZWFyY2hGb3JDbHVicyhzZWFyY2hRdWVyeSlcblx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICd3YXJuaW5nJyk7XG5cdFx0XHR9KVxuXHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLmZvdW5kTWF0Y2ggPSAocmVzcG9uc2UuZGF0YS5jbHVicy5sZW5ndGggPiAwKTtcblx0XHRcdFx0cmV0dXJuIHJlc3BvbnNlLmRhdGEuY2x1YnMubWFwKGZ1bmN0aW9uKGl0ZW0pe1xuXHRcdFx0XHRcdGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0aWYoY2x1Yi5pZCA9PSBpdGVtLmlkKSBpdGVtLmFscmVhZHlTZWxlY3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0cmV0dXJuIGl0ZW07XG5cdFx0XHRcdH0pO1xuXHRcdFx0fSk7XG5cdH07XG5cblx0c2VsZi5zZWxlY3RDbHViID0gZnVuY3Rpb24oJGl0ZW0pXG5cdHtcblx0XHRpZigkaXRlbS5hbHJlYWR5U2VsZWN0ZWQgPT09IHRydWUpIHJldHVybiBmYWxzZTtcblx0XHRzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IG51bGw7XG5cdFx0c2VsZi5uZXdfY2x1YiA9ICRpdGVtO1xuXHR9O1xuXG5cdHNlbGYubm9DbHVic0ZvdW5kID0gZnVuY3Rpb24oKVxuXHR7XG5cdFx0c2VsZi5ub01hdGNoaW5nQ2x1YnMgPSB0cnVlO1xuXHRcdHNlbGYubmV3X2NsdWIgPSBudWxsO1xuXHR9O1xuXG5cdHNlbGYuYWRkVXNlclRvQ2x1YnMgPSBmdW5jdGlvbihjbHViKVxuXHR7XG5cdFx0Q2x1YnNGYWN0b3J5LmFkZFVzZXJUb0NsdWJzKGNsdWIuaWQpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYubmV3X2NsdWIgPSBudWxsO1xuXHRcdFx0XHRzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcblx0XHRcdFx0c2VsZi5jbHViID0gcmVzcG9uc2U7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZE5ld0NsdWIgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRpZighc2VsZi5zZWFyY2hRdWVyeSB8fCAhc2VsZi5hZGRfY2x1YnNfbnIpIHJldHVybiBmYWxzZTtcblx0XHR2YXIgY2x1YiA9IHtcblx0XHRcdG5hbWU6IHNlbGYuc2VhcmNoUXVlcnksXG5cdFx0XHRjbHVic19ucjogc2VsZi5hZGRfY2x1YnNfbnJcblx0XHR9O1xuXG5cdFx0Q2x1YnNGYWN0b3J5LmFkZE5ld0NsdWIoY2x1Yilcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuXHRcdFx0XHRzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuXHRcdFx0XHRzZWxmLm5ld19jbHViID0gbnVsbDtcblx0XHRcdFx0c2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG5cdFx0XHRcdHNlbGYuY2x1YiA9IHJlc3BvbnNlO1xuXHRcdFx0fSk7XG5cdH07XG5cblx0c2VsZi5hZGRVc2VyQXNBZG1pbiA9IGZ1bmN0aW9uKGFkbWluKVxuXHR7XG5cdFx0aWYoYWRtaW4pe1xuXHRcdFx0Q2x1YnNGYWN0b3J5LmFkZFVzZXJBc0FkbWluKGFkbWluKVxuXHRcdFx0XHQuc3VjY2VzcyhmdW5jdGlvbigpe1xuXHRcdFx0XHRcdGxvYWRVc2VyQ2x1YigpO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG5cdFx0XHRcdH0pO1xuXHRcdH1cblx0fTtcblxuXHRzZWxmLmRlbGV0ZVVzZXJBc0FkbWluID0gZnVuY3Rpb24oYWRtaW4pXG5cdHtcblx0XHRpZihhZG1pbil7XG5cdFx0XHRDbHVic0ZhY3RvcnkuZGVsZXRlVXNlckFzQWRtaW4oYWRtaW4pXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0bG9hZFVzZXJDbHViKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xuXG5cdGxvYWRVc2VyQ2x1YigpO1xufSlcblxuLmNvbnRyb2xsZXIoXCJBZG1pbkNsdWJzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYuZmlsdGVyID0ge1xuXHRcdHNlYXJjaDogJycsXG5cdFx0aGlkZV93aXRob3V0X3VzZXJzOiAxXG5cdH07XG5cblx0c2VsZi5oaWRlQ2x1YnNXaXRob3V0VXNlcnMgPSBmdW5jdGlvbihjbHViKXtcblx0XHRpZihzZWxmLmZpbHRlci5oaWRlX3dpdGhvdXRfdXNlcnMgJiYgY2x1Yi51c2Vyc19jb3VudCl7XG5cdFx0XHRyZXR1cm4gY2x1Yjtcblx0XHR9ZWxzZSBpZighc2VsZi5maWx0ZXIuaGlkZV93aXRob3V0X3VzZXJzKXtcblx0XHRcdHJldHVybiBjbHViO1xuXHRcdH1cblx0fTtcblxuXHRmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcblx0XHRDbHVic0ZhY3RvcnkubG9hZChwYWdlKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG5cdFx0XHR9KTtcblx0fVxuXHRmdW5jdGlvbiBzb3J0TGlzdCgpIHt9XG5cblx0dGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcblx0dGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG5cdHRoaXMuc29ydE9wdGlvbnMgPSBbJ3Vwdm90ZXMnLCAnZGF0ZScsICdhdXRob3InXTtcblx0c29ydExpc3QoKTtcblx0dXBkYXRlUGFnZSgpO1xuXG5cblx0dGhpcy5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlbGYucGFnZSsrO1xuXHRcdHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcblx0XHQkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcblx0fTtcblx0dGhpcy5wcmV2UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChzZWxmLnBhZ2UgPiAwKSB7XG5cdFx0XHRzZWxmLnBhZ2UtLTtcblx0XHRcdHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcblx0XHRcdCRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuXHRcdH1cblx0fTtcblx0dGhpcy5zb3J0Q2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHNvcnRMaXN0KCk7XG5cdFx0JHN0YXRlLmdvKCcuJywge3NvcnQ6IHNlbGYuc29ydH0sIHtub3RpZnk6IGZhbHNlfSk7XG5cdH07XG5cbn0pXG4uY29udHJvbGxlcihcIkFkbWluQ2x1YkNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgJHRpbWVvdXQsIENsdWJzRmFjdG9yeSkge1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0aWYoISRzdGF0ZVBhcmFtcy5pZCkgJHN0YXRlLmdvKCdhZG1pbi5jbHVicycpO1xuXG5cdGZ1bmN0aW9uIGZpbmQoKXtcblx0XHRDbHVic0ZhY3RvcnkuZmluZCgkc3RhdGVQYXJhbXMuaWQpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuY2x1YiA9IHJlc3BvbnNlLmNsdWI7XG5cdFx0XHR9KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYWRtaW4uY2x1YnMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuXHRcdFx0fSk7XG5cdH1cblxuXHRzZWxmLnVwZGF0ZUNsdWIgPSBmdW5jdGlvbihjbHViKXtcblx0XHRzZWxmLnN0YXRlID0gJ3VwZGF0aW5nJztcblx0XHRDbHVic0ZhY3RvcnkudXBkYXRlQ2x1YihjbHViKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHRzZWxmLmNsdWJzLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG5cdFx0XHRcdHNlbGYuc3RhdGUgPSAndXBkYXRlZCc7XG5cdFx0XHRcdCRzdGF0ZS5nbygnY2x1YicsICh7aWQ6IGNsdWIuaWR9KSk7XG5cdFx0XHR9KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHNlbGYuZGVsZXRlQ2x1YiA9IGZ1bmN0aW9uKGNsdWIpe1xuXHRcdENsdWJzRmFjdG9yeS5kZWxldGVDbHViKGNsdWIpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdCRzdGF0ZS5nbygnY2x1YnMnKTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdGZpbmQoKTtcbn0pXG5cbi5mYWN0b3J5KCdDbHVic0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XG5cblx0cmV0dXJuIHtcblx0XHRsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcblx0XHRcdHZhciB1cmwgPSAnL2FwaS9jbHVicyc7XG5cblx0XHRcdGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG5cdFx0XHRpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogJy9hcGkvY2x1YnMvJytpZCxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRjcmVhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiAnL2FwaS9jbHVicycsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKGNsdWIpXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0dXBkYXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcblx0XHRcdFx0dXJsOiAnL2FwaS9jbHVicy8nK2NsdWIuaWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKGNsdWIpXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiAnL2FwaS9jbHVicy8nK2NsdWIuaWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0bG9hZFVzZXJDbHViOiBmdW5jdGlvbigpe1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiAnL2FwaS9jbHVicy9nZXRVc2VyQ2x1YicsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0YWRkVXNlclRvQ2x1YnM6IGZ1bmN0aW9uKGNsdWJzX2lkKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6ICcvYXBpL2NsdWJzL2FkZFVzZXJUb0NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19pZCc6IGNsdWJzX2lkfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGROZXdDbHViOiBmdW5jdGlvbihjbHViKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6ICcvYXBpL2NsdWJzL2FkZE5ld0NsdWInLFxuXHRcdFx0XHRoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2NsdWJzX25yJzogY2x1Yi5jbHVic19uciwgJ25hbWUnOiBjbHViLm5hbWV9KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdHNlYXJjaEZvckNsdWJzOiBmdW5jdGlvbihmaWx0ZXIpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6ICcvYXBpL2NsdWJzL3NlYXJjaCcsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKHsnc2VhcmNoUXVlcnknOiBmaWx0ZXJ9KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGFkZFVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogJy9hcGkvY2x1YnMvYWRkVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGRlbGV0ZVVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiAnL2FwaS9jbHVicy9kZWxldGVVc2VyQXNBZG1pbicsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKHsnYWRtaW4nOiBhZG1pbn0pXG5cdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbXBldGl0aW9ucycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNvbXBldGl0aW9uc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ29tcGV0aXRpb25zRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlUGFnZShwYWdlKSB7XG4gICAgICAgIENvbXBldGl0aW9uc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuICAgIHRoaXMucGFnZSA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5wYWdlLCAxMCk7XG4gICAgdGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG4gICAgdGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuICAgIHNvcnRMaXN0KCk7XG4gICAgdXBkYXRlUGFnZSgpO1xuXG5cbiAgICB0aGlzLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYucGFnZSsrO1xuICAgICAgICB1cGRhdGVQYWdlKHNlbGYucGFnZSk7XG4gICAgICAgICRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuICAgIH07XG4gICAgdGhpcy5wcmV2UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2VsZi5wYWdlID4gMCkge1xuICAgICAgICAgICAgc2VsZi5wYWdlLS07XG4gICAgICAgICAgICB1cGRhdGVQYWdlKHNlbGYucGFnZSk7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zb3J0Q2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzb3J0TGlzdCgpO1xuICAgICAgICAkc3RhdGUuZ28oJy4nLCB7c29ydDogc2VsZi5zb3J0fSwge25vdGlmeTogZmFsc2V9KTtcbiAgICB9O1xufSlcbi5jb250cm9sbGVyKFwiQ29tcGV0aXRpb25Db250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR0aW1lb3V0LCBDb21wZXRpdGlvbnNGYWN0b3J5LCBTaWdudXBzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZmluZCgpe1xuICAgICAgICBDb21wZXRpdGlvbnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuICAgICAgICAgICAgICAgIHNlbGYudXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbnMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi5jcmVhdGVTaWdudXAgPSBmdW5jdGlvbih3ZWFwb25jbGFzc2VzX2lkKXtcbiAgICAgICAgdmFyIHNpZ251cCA9IHtcbiAgICAgICAgICAgICdjb21wZXRpdGlvbnNfaWQnOiBzZWxmLmNvbXBldGl0aW9ucy5pZCxcbiAgICAgICAgICAgICd3ZWFwb25jbGFzc2VzX2lkJzogd2VhcG9uY2xhc3Nlc19pZCxcbiAgICAgICAgICAgICd1c2Vyc19pZCc6IHNlbGYudXNlci51c2VyX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmNyZWF0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uud2VhcG9uY2xhc3Nlc19pZCA9IHBhcnNlSW50KHJlc3BvbnNlLndlYXBvbmNsYXNzZXNfaWQpO1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zLnVzZXJzaWdudXBzLnB1c2gocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVTaWdudXAgPSBmdW5jdGlvbihzaWdudXApe1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5kZWxldGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzaGlmdCBmcm9tIHRoZSBjYWxlbmRhci5cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5jb21wZXRpdGlvbnMudXNlcnNpZ251cHMsIGZ1bmN0aW9uKHNpZ251cHMsIGluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwcy5pZCA9PSBzaWdudXAuaWQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zLnVzZXJzaWdudXBzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmaW5kKCk7XG59KVxuXG4uZmFjdG9yeSgnQ29tcGV0aXRpb25zRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSAnL2FwaS9jb21wZXRpdGlvbnMnO1xuXG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2NvbXBldGl0aW9ucy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgW10pXG5cbiAgICAuY29udHJvbGxlcihcIkRhc2hib2FyZENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlKXtcblxuXG4gICAgfSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZXJyb3JoYW5kbGVyJywgW10pXG5cblx0LmNvbnRyb2xsZXIoXCJFcnJvckhhbmRsZXJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgRXJyb3JIYW5kbGVyRmFjdG9yeSl7XG5cblx0fSlcblxuXHQuZmFjdG9yeSgnRXJyb3JIYW5kbGVyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKXtcblxuXHRcdHJldHVybiB7XG5cblx0XHRcdHJlcG9ydEVycm9yOiBmdW5jdGlvbihlcnJvciwgY2F1c2UpIHtcblx0XHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0XHR1cmw6ICcvYXBpL2Vycm9yL3JlcG9ydCcsXG5cdFx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7ZXJyb3I6IGVycm9yLCBjYXVzZTogY2F1c2V9KVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdH07XG5cblx0fSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnNldHRpbmdzJywgW10pXG5cbi5jb250cm9sbGVyKFwiU2V0dGluZ3NDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBTZXR0aW5nc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmNhbmNlbGFjY291bnQgPSBmdW5jdGlvbigpe1xuICAgICAgICBTZXR0aW5nc0ZhY3RvcnkuY2FuY2VsYWNjb3VudCgpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9nb3V0Jyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLmVycm9yKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG59KVxuXG4uY29udHJvbGxlcihcIlBhc3N3b3JkQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgU2V0dGluZ3NGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5yZXNldCA9IHtcbiAgICAgICAgJ2N1cnJlbnRfcGFzc3dvcmQnOicnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJyxcbiAgICAgICAgJ3Bhc3N3b3JkX2NvbmZpcm1hdGlvbic6JydcbiAgICB9O1xuXG4gICAgc2VsZi51cGRhdGVQYXNzd29yZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBTZXR0aW5nc0ZhY3RvcnkudXBkYXRlUGFzc3dvcmQoc2VsZi5yZXNldClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICAnY3VycmVudF9wYXNzd29yZCc6JycsXG4gICAgICAgICAgICAgICAgICAgICdwYXNzd29yZCc6ICcnLFxuICAgICAgICAgICAgICAgICAgICAncGFzc3dvcmRfY29uZmlybWF0aW9uJzonJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbn0pXG5cbi5jb250cm9sbGVyKFwiVXNlclByb2ZpbGVDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBTZXR0aW5nc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRVc2VycHJvZmlsZSgpIHtcbiAgICAgICAgU2V0dGluZ3NGYWN0b3J5LmxvYWRVc2VycHJvZmlsZSgpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VycHJvZmlsZSA9IHJlc3BvbnNlLnVzZXI7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmRhdGVQaWNrZXJPcHRpb25zID0ge3N0YXJ0aW5nRGF5OiAxLCBzdGFydDoge29wZW5lZDogZmFsc2V9LCBlbmQ6IHtvcGVuZWQ6IGZhbHNlfX07XG5cbiAgICBzZWxmLnNhdmVVc2VycHJvZmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIFNldHRpbmdzRmFjdG9yeS5zYXZlVXNlcnByb2ZpbGUoc2VsZi51c2VycHJvZmlsZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpKTtcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJwcm9maWxlID0gcmVzcG9uc2UudXNlcjtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NldHRpbmdzLnVzZXInKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuY2FuY2VsVXNlcnByb2ZpbGUgPSBmdW5jdGlvbigpe1xuICAgICAgICBsb2FkVXNlcnByb2ZpbGUoKTtcbiAgICAgICAgJHN0YXRlLmdvKCdzZXR0aW5ncy51c2VyJyk7XG4gICAgfTtcblxuICAgIGxvYWRVc2VycHJvZmlsZSgpO1xuXG59KVxuICAgIFxuLmNvbnRyb2xsZXIoXCJJbnZpdGVDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBJbnZpdGVGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmxvYWRJbnZpdGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEludml0ZUZhY3RvcnkubG9hZEludml0ZXMoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuaW52aXRlcyA9IHJlc3BvbnNlLmludml0ZXM7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuICAgIHNlbGYubG9hZEludml0ZXMoKTtcblxuICAgIHNlbGYuaW52aXRlID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgSW52aXRlRmFjdG9yeVxuICAgICAgICAgICAgLmludml0ZShzZWxmLnVzZXIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VyID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgbGFzdG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogJydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNlbGYubG9hZEludml0ZXMoKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xufSlcblxuLmZhY3RvcnkoXCJJbnZpdGVGYWN0b3J5XCIsIGZ1bmN0aW9uKCRodHRwKXtcbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkSW52aXRlczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3VzZXJzL2ludml0ZScsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGludml0ZTogZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3VzZXJzL2ludml0ZScsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh1c2VyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KVxuXG4uZmFjdG9yeShcIlNldHRpbmdzRmFjdG9yeVwiLCBmdW5jdGlvbigkaHR0cCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZFVzZXJwcm9maWxlOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogJy9hcGkvYXV0aGVudGljYXRlL3VzZXInLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlVXNlcnByb2ZpbGU6IGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBhbmd1bGFyLmNvcHkodXNlcik7XG4gICAgICAgICAgICBkYXRhLmJpcnRoZGF5ID0gZGF0YS5iaXJ0aGRheSsnLTAxLTAxJztcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2F1dGhlbnRpY2F0ZS91c2VyJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVQYXNzd29yZDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2F1dGhlbnRpY2F0ZS91cGRhdGVQYXNzd29yZCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNhbmNlbGFjY291bnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2F1dGhlbnRpY2F0ZS9jYW5jZWxBY2NvdW50JyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnNpZ251cHMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJTaWdudXBzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBTaWdudXBzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlUGFnZShwYWdlKSB7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuICAgIHRoaXMucGFnZSA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5wYWdlLCAxMCk7XG4gICAgdGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG4gICAgdGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuICAgIHNvcnRMaXN0KCk7XG4gICAgdXBkYXRlUGFnZSgpO1xufSlcbi5jb250cm9sbGVyKFwiU2lnbnVwQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdGltZW91dCwgU2lnbnVwc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NpZ251cHMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi51cGRhdGVTaWdudXAgPSBmdW5jdGlvbihzaWdudXApe1xuICAgICAgICBzZWxmLnN0YXRlID0gJ3VwZGF0aW5nJztcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkudXBkYXRlU2lnbnVwKHNpZ251cClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnNpZ251cHMucGFydGljaXBhdGVfb3V0X29mX2NvbXBldGl0aW9uID0gcGFyc2VJbnQocmVzcG9uc2Uuc2lnbnVwcy5wYXJ0aWNpcGF0ZV9vdXRfb2ZfY29tcGV0aXRpb24pO1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlLnNpZ251cHMud2VhcG9uY2xhc3Nlc19pZCA9IHBhcnNlSW50KHJlc3BvbnNlLnNpZ251cHMud2VhcG9uY2xhc3Nlc19pZCk7XG4gICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgICAgIHNlbGYuc3RhdGUgPSAndXBkYXRlZCc7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzaWdudXAnLCAoe2lkOiBzaWdudXAuaWR9KSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuZGVsZXRlU2lnbnVwID0gZnVuY3Rpb24oc2lnbnVwKXtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkuZGVsZXRlU2lnbnVwKHNpZ251cClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NpZ251cHMnKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gICAgZmluZCgpO1xufSlcbi5mYWN0b3J5KCdTaWdudXBzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSAnL2FwaS9zaWdudXAnO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzVW5kZWZpbmVkKGlkKSAmJiBpZCA+IDApIHVybCArPSAnLycgKyBpZDtcbiAgICAgICAgICAgICAgICBpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL3NpZ251cC8nK2lkLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgY3JlYXRlU2lnbnVwOiBmdW5jdGlvbihzaWdudXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9zaWdudXAnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB1cGRhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBkZWxldGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgICAgIHVybDogJy9hcGkvc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRlYW1zJywgW10pXG4uY29udHJvbGxlcignVGVhbVNpZ251cENvbnRyb2xsZXInLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDb21wZXRpdGlvbnNGYWN0b3J5LCBUZWFtc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRUZWFtcygpIHtcbiAgICAgICAgaWYoJHN0YXRlUGFyYW1zLnRlYW1zX2lkKXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5pZCwgJHN0YXRlUGFyYW1zLnRlYW1zX2lkKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50ZWFtcyA9IHJlc3BvbnNlLnRlYW1zO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuXG4gICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLnRlYW1zLnNpZ251cHMsIGZ1bmN0aW9uKHNpZ251cCwga2V5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSAxKSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfZmlyc3QgID0gc2lnbnVwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDIpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc19zZWNvbmQgPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gMykgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX3RoaXJkID0gc2lnbnVwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDQpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc19mb3VydGggPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gNSkgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX2ZpZnRoID0gc2lnbnVwLmlkO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBzZWxmLnRlYW1zLnNpZ251cHMgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBUZWFtc0ZhY3RvcnkubG9hZCgkc3RhdGVQYXJhbXMuaWQsICRzdGF0ZVBhcmFtcy50ZWFtc19pZClcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuYWRkVGVhbSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgd2VhcG9uY2xhc3Nlc19pZDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX2ZpcnN0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19zZWNvbmQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX3RoaXJkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19mb3VydGg6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX2ZpZnRoOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGVhbXMgPSByZXNwb25zZS50ZWFtcztcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzID0gcmVzcG9uc2Uuc2lnbnVwcztcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzZWxmLmNyZWF0ZVRlYW0gPSBmdW5jdGlvbigpe1xuICAgICAgICBpZihzZWxmLmFkZFRlYW0ubmFtZSAmJiBzZWxmLmFkZFRlYW0ud2VhcG9uY2xhc3Nlc19pZCl7XG4gICAgICAgICAgICBUZWFtc0ZhY3Rvcnkuc3RvcmUoJHN0YXRlUGFyYW1zLmlkLCBzZWxmLmFkZFRlYW0pXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzJywge2lkOiAkc3RhdGVQYXJhbXMuaWR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBsb2FkVGVhbXMoKTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgXG4gICAgc2VsZi51cGRhdGVUZWFtID0gZnVuY3Rpb24odGVhbSl7XG4gICAgICAgIGlmKHNlbGYudGVhbXMubmFtZSAmJiBzZWxmLnRlYW1zLndlYXBvbmNsYXNzZXNfaWQpe1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LnVwZGF0ZSgkc3RhdGVQYXJhbXMuaWQsIHNlbGYudGVhbXMuaWQsIHRlYW0pXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzJywge2lkOiAkc3RhdGVQYXJhbXMuaWR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWxUZWFtID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycse2lkOiAkc3RhdGVQYXJhbXMuaWR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVUZWFtID0gZnVuY3Rpb24odGVhbXNfaWQpe1xuICAgICAgICBpZih0ZWFtc19pZCl7XG4gICAgICAgICAgICBUZWFtc0ZhY3RvcnkuZGVsZXRlKCRzdGF0ZVBhcmFtcy5pZCwgdGVhbXNfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxvYWRUZWFtcygpO1xuXG59KVxuLmZhY3RvcnkoJ1RlYW1zRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKGNvbXBldGl0aW9uc19pZCwgdGVhbXNfaWQpIHtcbiAgICAgICAgICAgIGlmKGNvbXBldGl0aW9uc19pZCAmJiB0ZWFtc19pZCl7XG4gICAgICAgICAgICAgICAgdXJsID0gJy9hcGkvY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMvJyt0ZWFtc19pZDtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdXJsID0gJy9hcGkvY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogJy9hcGkvY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdG9yZTogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkLCB0ZWFtKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnL2FwaS9jb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh0ZWFtKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHRlYW1zX2lkLCB0ZWFtKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzLycrdGVhbXNfaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh0ZWFtKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHRlYW1zX2lkKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICB1cmw6ICcvYXBpL2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzLycrdGVhbXNfaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnVzZXJzJywgW10pXG5cbi5jb250cm9sbGVyKFwiVXNlcnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBVc2Vyc0ZhY3Rvcnkpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5maWx0ZXIgPSB7XG5cdFx0c2VhcmNoOiAnJyxcblx0XHRhY3RpdmU6IDFcblx0fTtcblxuXHRmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcblx0XHRVc2Vyc0ZhY3RvcnkubG9hZChwYWdlKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnVzZXJzID0gcmVzcG9uc2UudXNlcnM7XG5cdFx0XHR9KTtcblx0fVxuXHRmdW5jdGlvbiBzb3J0TGlzdCgpIHt9XG5cblx0dGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcblx0dGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG5cdHRoaXMuc29ydE9wdGlvbnMgPSBbJ3Vwdm90ZXMnLCAnZGF0ZScsICdhdXRob3InXTtcblx0c29ydExpc3QoKTtcblx0dXBkYXRlUGFnZSgpO1xuXG5cblx0dGhpcy5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdHNlbGYucGFnZSsrO1xuXHRcdHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcblx0XHQkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcblx0fTtcblx0dGhpcy5wcmV2UGFnZSA9IGZ1bmN0aW9uKCkge1xuXHRcdGlmIChzZWxmLnBhZ2UgPiAwKSB7XG5cdFx0XHRzZWxmLnBhZ2UtLTtcblx0XHRcdHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcblx0XHRcdCRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuXHRcdH1cblx0fTtcblx0dGhpcy5zb3J0Q2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuXHRcdHNvcnRMaXN0KCk7XG5cdFx0JHN0YXRlLmdvKCcuJywge3NvcnQ6IHNlbGYuc29ydH0sIHtub3RpZnk6IGZhbHNlfSk7XG5cdH07XG5cbn0pXG5cbi5mYWN0b3J5KCdVc2Vyc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCl7XG5cblx0cmV0dXJuIHtcblx0XHRsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcblx0XHRcdHZhciB1cmwgPSAnL2FwaS91c2Vycyc7XG5cblx0XHRcdGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG5cdFx0XHRpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogJy9hcGkvdXNlcnMvJytpZCxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9O1xufSk7XG4iLCIvKipcbiAqIEdsb2JhbCBlcnJvciBoYW5kbGluZyBmb3IgdG9wIGxldmVsIGVycm9ycy5cbiAqIENhdGNoZXMgYW55IGV4Y2VwdGlvbnMgYW5kIHNlbmRzIHRoZW0gdG8gdGhlICRyb290U2NvcGUucmVwb3J0RXJyb3IgZnVuY3Rpb24uXG4gKi9cbmFwcC5jb25maWcoZnVuY3Rpb24oJHByb3ZpZGUpIHtcbiAgICAkcHJvdmlkZS5kZWNvcmF0b3IoXCIkZXhjZXB0aW9uSGFuZGxlclwiLCBmdW5jdGlvbigkZGVsZWdhdGUsICRpbmplY3Rvcikge1xuXHRcdHJldHVybiBmdW5jdGlvbihleGNlcHRpb24sIGNhdXNlKSB7XG5cdFx0XHQkZGVsZWdhdGUoZXhjZXB0aW9uLCBjYXVzZSk7XG5cdFx0XHRcblx0XHRcdHZhciAkcm9vdFNjb3BlID0gJGluamVjdG9yLmdldChcIiRyb290U2NvcGVcIik7XG5cdFx0XHQkcm9vdFNjb3BlLnJlcG9ydEVycm9yKGV4Y2VwdGlvbiwgY2F1c2UpO1xuXHRcdH07XG5cdH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goZnVuY3Rpb24gKCRxLCAkaW5qZWN0b3IsICRyb290U2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgdG9rZW4gaXMgc2V0IGZvciB0aGUgcmVxdWVzdC5cbiAgICAgICAgICAgICAgICB2YXIgdG9rZW4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICBpZih0b2tlbiAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmVhcmVyICcgKyB0b2tlbjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25maWcuaGVhZGVyc1snWC1SZXF1ZXN0ZWQtV2l0aCddID0gJ1hNTEh0dHBSZXF1ZXN0JztcblxuICAgICAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIHRva2VuIGhhcyBleHBpcmVkIG9uIGEgaHR0cCBjYWxsLiBSZWZyZXNoIHRoZSB0b2tlbiBhbmQgdHJ5IGFnYWluLlxuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgQXV0aEZhY3RvcnkgPSAkaW5qZWN0b3IuZ2V0KCdBdXRoRmFjdG9yeScpO1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9ICRpbmplY3Rvci5nZXQoJyRzdGF0ZScpO1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmVycm9yID09ICd0b2tlbl9leHBpcmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4ocmVzcG9uc2UuY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5kYXRhLmVycm9yID09ICd1c2VyX2luYWN0aXZlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5kYXRhLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgQXV0aEZhY3RvcnkubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmIChyZXNwb25zZS5kYXRhLmVycm9yID09ICd1c2VyX2lzX25vdF9hZG1pbicpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZXJyb3IgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5lcnJvciA9PSAndXNlcl9pbmFjdGl2ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQXV0aEZhY3RvcnkubG9nb3V0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmIChyZXNwb25zZS5lcnJvciA9PSAndXNlcl9pc19ub3RfYWRtaW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcbiAgICB9KTtcblxufSk7IiwiLypcbiogIEFuZ3VsYXJKcyBGdWxsY2FsZW5kYXIgV3JhcHBlciBmb3IgdGhlIEpRdWVyeSBGdWxsQ2FsZW5kYXJcbiogIEFQSSBAIGh0dHA6Ly9hcnNoYXcuY29tL2Z1bGxjYWxlbmRhci9cbipcbiogIEFuZ3VsYXIgQ2FsZW5kYXIgRGlyZWN0aXZlIHRoYXQgdGFrZXMgaW4gdGhlIFtldmVudFNvdXJjZXNdIG5lc3RlZCBhcnJheSBvYmplY3QgYXMgdGhlIG5nLW1vZGVsIGFuZCB3YXRjaGVzIGl0IGRlZXBseSBjaGFuZ2VzLlxuKiAgICAgICBDYW4gYWxzbyB0YWtlIGluIG11bHRpcGxlIGV2ZW50IHVybHMgYXMgYSBzb3VyY2Ugb2JqZWN0KHMpIGFuZCBmZWVkIHRoZSBldmVudHMgcGVyIHZpZXcuXG4qICAgICAgIFRoZSBjYWxlbmRhciB3aWxsIHdhdGNoIGFueSBldmVudFNvdXJjZSBhcnJheSBhbmQgdXBkYXRlIGl0c2VsZiB3aGVuIGEgY2hhbmdlIGlzIG1hZGUuXG4qXG4qL1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuY2FsZW5kYXInLCBbXSlcbiAgLmNvbnN0YW50KCd1aUNhbGVuZGFyQ29uZmlnJywge30pXG4gIC5jb250cm9sbGVyKCd1aUNhbGVuZGFyQ3RybCcsIFsnJHNjb3BlJywgJyR0aW1lb3V0JywgJyRsb2NhbGUnLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0LCAkbG9jYWxlKXtcblxuICAgICAgdmFyIHNvdXJjZVNlcmlhbElkID0gMSxcbiAgICAgICAgICBldmVudFNlcmlhbElkID0gMSxcbiAgICAgICAgICBzb3VyY2VzID0gJHNjb3BlLmV2ZW50U291cmNlcyxcbiAgICAgICAgICBleHRyYUV2ZW50U2lnbmF0dXJlID0gJHNjb3BlLmNhbGVuZGFyV2F0Y2hFdmVudCA/ICRzY29wZS5jYWxlbmRhcldhdGNoRXZlbnQgOiBhbmd1bGFyLm5vb3AsXG5cbiAgICAgICAgICB3cmFwRnVuY3Rpb25XaXRoU2NvcGVBcHBseSA9IGZ1bmN0aW9uKGZ1bmN0aW9uVG9XcmFwKXtcbiAgICAgICAgICAgICAgdmFyIHdyYXBwZXI7XG5cbiAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uVG9XcmFwKXtcbiAgICAgICAgICAgICAgICAgIHdyYXBwZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaGFwcGVucyBvdXRzaWRlIG9mIGFuZ3VsYXIgY29udGV4dCBzbyB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0aW1lb3V0IHdoaWNoIGhhcyBhbiBpbXBsaWVkIGFwcGx5LlxuICAgICAgICAgICAgICAgICAgICAgIC8vIEluIHRoaXMgd2F5IHRoZSBmdW5jdGlvbiB3aWxsIGJlIHNhZmVseSBleGVjdXRlZCBvbiB0aGUgbmV4dCBkaWdlc3QuXG5cbiAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvblRvV3JhcC5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXI7XG4gICAgICAgICAgfTtcblxuICAgICAgdGhpcy5ldmVudHNGaW5nZXJwcmludCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFlLl9pZCkge1xuICAgICAgICAgIGUuX2lkID0gZXZlbnRTZXJpYWxJZCsrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgZXh0cmFjdHMgYWxsIHRoZSBpbmZvcm1hdGlvbiB3ZSBuZWVkIGZyb20gdGhlIGV2ZW50LiBodHRwOi8vanNwZXJmLmNvbS9hbmd1bGFyLWNhbGVuZGFyLWV2ZW50cy1maW5nZXJwcmludC8zXG4gICAgICAgIHJldHVybiBcIlwiICsgZS5faWQgKyAoZS5pZCB8fCAnJykgKyAoZS50aXRsZSB8fCAnJykgKyAoZS51cmwgfHwgJycpICsgKCtlLnN0YXJ0IHx8ICcnKSArICgrZS5lbmQgfHwgJycpICtcbiAgICAgICAgICAoZS5hbGxEYXkgfHwgJycpICsgKGUuY2xhc3NOYW1lIHx8ICcnKSArIGV4dHJhRXZlbnRTaWduYXR1cmUoZSkgfHwgJyc7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLnNvdXJjZXNGaW5nZXJwcmludCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgIHJldHVybiBzb3VyY2UuX19pZCB8fCAoc291cmNlLl9faWQgPSBzb3VyY2VTZXJpYWxJZCsrKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYWxsRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHJldHVybiBzb3VyY2VzLmZsYXR0ZW4oKTsgYnV0IHdlIGRvbid0IGhhdmUgZmxhdHRlblxuICAgICAgICB2YXIgYXJyYXlTb3VyY2VzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBzcmNMZW4gPSBzb3VyY2VzLmxlbmd0aDsgaSA8IHNyY0xlbjsgaSsrKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IHNvdXJjZXNbaV07XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICAgICAgICAvLyBldmVudCBzb3VyY2UgYXMgYXJyYXlcbiAgICAgICAgICAgIGFycmF5U291cmNlcy5wdXNoKHNvdXJjZSk7XG4gICAgICAgICAgfSBlbHNlIGlmKGFuZ3VsYXIuaXNPYmplY3Qoc291cmNlKSAmJiBhbmd1bGFyLmlzQXJyYXkoc291cmNlLmV2ZW50cykpe1xuICAgICAgICAgICAgLy8gZXZlbnQgc291cmNlIGFzIG9iamVjdCwgaWUgZXh0ZW5kZWQgZm9ybVxuICAgICAgICAgICAgdmFyIGV4dEV2ZW50ID0ge307XG4gICAgICAgICAgICBmb3IodmFyIGtleSBpbiBzb3VyY2Upe1xuICAgICAgICAgICAgICBpZihrZXkgIT09ICdfdWlDYWxJZCcgJiYga2V5ICE9PSAnZXZlbnRzJyl7XG4gICAgICAgICAgICAgICAgIGV4dEV2ZW50W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yKHZhciBlSSA9IDA7ZUkgPCBzb3VyY2UuZXZlbnRzLmxlbmd0aDtlSSsrKXtcbiAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoc291cmNlLmV2ZW50c1tlSV0sZXh0RXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXJyYXlTb3VyY2VzLnB1c2goc291cmNlLmV2ZW50cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycmF5U291cmNlcyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBUcmFjayBjaGFuZ2VzIGluIGFycmF5IGJ5IGFzc2lnbmluZyBpZCB0b2tlbnMgdG8gZWFjaCBlbGVtZW50IGFuZCB3YXRjaGluZyB0aGUgc2NvcGUgZm9yIGNoYW5nZXMgaW4gdGhvc2UgdG9rZW5zXG4gICAgICAvLyBhcmd1bWVudHM6XG4gICAgICAvLyAgYXJyYXlTb3VyY2UgYXJyYXkgb2YgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFycmF5IG9mIG9iamVjdHMgdG8gd2F0Y2hcbiAgICAgIC8vICB0b2tlbkZuIGZ1bmN0aW9uKG9iamVjdCkgdGhhdCByZXR1cm5zIHRoZSB0b2tlbiBmb3IgYSBnaXZlbiBvYmplY3RcbiAgICAgIHRoaXMuY2hhbmdlV2F0Y2hlciA9IGZ1bmN0aW9uKGFycmF5U291cmNlLCB0b2tlbkZuKSB7XG4gICAgICAgIHZhciBzZWxmO1xuICAgICAgICB2YXIgZ2V0VG9rZW5zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGFycmF5ID0gYW5ndWxhci5pc0Z1bmN0aW9uKGFycmF5U291cmNlKSA/IGFycmF5U291cmNlKCkgOiBhcnJheVNvdXJjZTtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHRva2VuLCBlbDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFycmF5Lmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgZWwgPSBhcnJheVtpXTtcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5GbihlbCk7XG4gICAgICAgICAgICBtYXBbdG9rZW5dID0gZWw7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIHJldHVybnMgZWxlbWVudHMgaW4gdGhhdCBhcmUgaW4gYSBidXQgbm90IGluIGJcbiAgICAgICAgLy8gc3VidHJhY3RBc1NldHMoWzQsIDUsIDZdLCBbNCwgNSwgN10pID0+IFs2XVxuICAgICAgICB2YXIgc3VidHJhY3RBc1NldHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBpbkIgPSB7fSwgaSwgbjtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYi5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGluQltiW2ldXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgaWYgKCFpbkJbYVtpXV0pIHtcbiAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gTWFwIG9iamVjdHMgdG8gdG9rZW5zIGFuZCB2aWNlLXZlcnNhXG4gICAgICAgIHZhciBtYXAgPSB7fTtcblxuICAgICAgICB2YXIgYXBwbHlDaGFuZ2VzID0gZnVuY3Rpb24obmV3VG9rZW5zLCBvbGRUb2tlbnMpIHtcbiAgICAgICAgICB2YXIgaSwgbiwgZWwsIHRva2VuO1xuICAgICAgICAgIHZhciByZXBsYWNlZFRva2VucyA9IHt9O1xuICAgICAgICAgIHZhciByZW1vdmVkVG9rZW5zID0gc3VidHJhY3RBc1NldHMob2xkVG9rZW5zLCBuZXdUb2tlbnMpO1xuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkVG9rZW5zLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWRUb2tlbiA9IHJlbW92ZWRUb2tlbnNbaV07XG4gICAgICAgICAgICBlbCA9IG1hcFtyZW1vdmVkVG9rZW5dO1xuICAgICAgICAgICAgZGVsZXRlIG1hcFtyZW1vdmVkVG9rZW5dO1xuICAgICAgICAgICAgdmFyIG5ld1Rva2VuID0gdG9rZW5GbihlbCk7XG4gICAgICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCB3YXNuJ3QgcmVtb3ZlZCBidXQgc2ltcGx5IGdvdCBhIG5ldyB0b2tlbiwgaXRzIG9sZCB0b2tlbiB3aWxsIGJlIGRpZmZlcmVudCBmcm9tIHRoZSBjdXJyZW50IG9uZVxuICAgICAgICAgICAgaWYgKG5ld1Rva2VuID09PSByZW1vdmVkVG9rZW4pIHtcbiAgICAgICAgICAgICAgc2VsZi5vblJlbW92ZWQoZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVwbGFjZWRUb2tlbnNbbmV3VG9rZW5dID0gcmVtb3ZlZFRva2VuO1xuICAgICAgICAgICAgICBzZWxmLm9uQ2hhbmdlZChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGFkZGVkVG9rZW5zID0gc3VidHJhY3RBc1NldHMobmV3VG9rZW5zLCBvbGRUb2tlbnMpO1xuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZFRva2Vucy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHRva2VuID0gYWRkZWRUb2tlbnNbaV07XG4gICAgICAgICAgICBlbCA9IG1hcFt0b2tlbl07XG4gICAgICAgICAgICBpZiAoIXJlcGxhY2VkVG9rZW5zW3Rva2VuXSkge1xuICAgICAgICAgICAgICBzZWxmLm9uQWRkZWQoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2VsZiA9IHtcbiAgICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uKHNjb3BlLCBvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaChnZXRUb2tlbnMsIGZ1bmN0aW9uKG5ld1Rva2Vucywgb2xkVG9rZW5zKSB7XG4gICAgICAgICAgICAgIGlmICghb25DaGFuZ2VkIHx8IG9uQ2hhbmdlZChuZXdUb2tlbnMsIG9sZFRva2VucykgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYXBwbHlDaGFuZ2VzKG5ld1Rva2Vucywgb2xkVG9rZW5zKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdHJ1ZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkFkZGVkOiBhbmd1bGFyLm5vb3AsXG4gICAgICAgICAgb25DaGFuZ2VkOiBhbmd1bGFyLm5vb3AsXG4gICAgICAgICAgb25SZW1vdmVkOiBhbmd1bGFyLm5vb3BcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLmdldEZ1bGxDYWxlbmRhckNvbmZpZyA9IGZ1bmN0aW9uKGNhbGVuZGFyU2V0dGluZ3MsIHVpQ2FsZW5kYXJDb25maWcpe1xuICAgICAgICAgIHZhciBjb25maWcgPSB7fTtcblxuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgdWlDYWxlbmRhckNvbmZpZyk7XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCBjYWxlbmRhclNldHRpbmdzKTtcbiAgICAgICAgIFxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb25maWcsIGZ1bmN0aW9uKHZhbHVlLGtleSl7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgICAgY29uZmlnW2tleV0gPSB3cmFwRnVuY3Rpb25XaXRoU2NvcGVBcHBseShjb25maWdba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgfTtcblxuICAgIHRoaXMuZ2V0TG9jYWxlQ29uZmlnID0gZnVuY3Rpb24oZnVsbENhbGVuZGFyQ29uZmlnKSB7XG4gICAgICBpZiAoIWZ1bGxDYWxlbmRhckNvbmZpZy5sYW5nIHx8IGZ1bGxDYWxlbmRhckNvbmZpZy51c2VOZ0xvY2FsZSkge1xuICAgICAgICAvLyBDb25maWd1cmUgdG8gdXNlIGxvY2FsZSBuYW1lcyBieSBkZWZhdWx0XG4gICAgICAgIHZhciB0VmFsdWVzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIC8vIGNvbnZlcnQgezA6IFwiSmFuXCIsIDE6IFwiRmViXCIsIC4uLn0gdG8gW1wiSmFuXCIsIFwiRmViXCIsIC4uLl1cbiAgICAgICAgICB2YXIgciwgaztcbiAgICAgICAgICByID0gW107XG4gICAgICAgICAgZm9yIChrIGluIGRhdGEpIHtcbiAgICAgICAgICAgIHJba10gPSBkYXRhW2tdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGR0ZiA9ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBtb250aE5hbWVzOiB0VmFsdWVzKGR0Zi5NT05USCksXG4gICAgICAgICAgbW9udGhOYW1lc1Nob3J0OiB0VmFsdWVzKGR0Zi5TSE9SVE1PTlRIKSxcbiAgICAgICAgICBkYXlOYW1lczogdFZhbHVlcyhkdGYuREFZKSxcbiAgICAgICAgICBkYXlOYW1lc1Nob3J0OiB0VmFsdWVzKGR0Zi5TSE9SVERBWSlcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9O1xuICB9XSlcbiAgLmRpcmVjdGl2ZSgndWlDYWxlbmRhcicsIFsndWlDYWxlbmRhckNvbmZpZycsIGZ1bmN0aW9uKHVpQ2FsZW5kYXJDb25maWcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7ZXZlbnRTb3VyY2VzOic9bmdNb2RlbCcsY2FsZW5kYXJXYXRjaEV2ZW50OiAnJid9LFxuICAgICAgY29udHJvbGxlcjogJ3VpQ2FsZW5kYXJDdHJsJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbG0sIGF0dHJzLCBjb250cm9sbGVyKSB7XG5cbiAgICAgICAgdmFyIHNvdXJjZXMgPSBzY29wZS5ldmVudFNvdXJjZXMsXG4gICAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IGZhbHNlLFxuICAgICAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlciA9IGNvbnRyb2xsZXIuY2hhbmdlV2F0Y2hlcihzb3VyY2VzLCBjb250cm9sbGVyLnNvdXJjZXNGaW5nZXJwcmludCksXG4gICAgICAgICAgICBldmVudHNXYXRjaGVyID0gY29udHJvbGxlci5jaGFuZ2VXYXRjaGVyKGNvbnRyb2xsZXIuYWxsRXZlbnRzLCBjb250cm9sbGVyLmV2ZW50c0ZpbmdlcnByaW50KSxcbiAgICAgICAgICAgIG9wdGlvbnMgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldE9wdGlvbnMoKXtcbiAgICAgICAgICB2YXIgY2FsZW5kYXJTZXR0aW5ncyA9IGF0dHJzLnVpQ2FsZW5kYXIgPyBzY29wZS4kcGFyZW50LiRldmFsKGF0dHJzLnVpQ2FsZW5kYXIpIDoge30sXG4gICAgICAgICAgICAgIGZ1bGxDYWxlbmRhckNvbmZpZztcblxuICAgICAgICAgIGZ1bGxDYWxlbmRhckNvbmZpZyA9IGNvbnRyb2xsZXIuZ2V0RnVsbENhbGVuZGFyQ29uZmlnKGNhbGVuZGFyU2V0dGluZ3MsIHVpQ2FsZW5kYXJDb25maWcpO1xuXG4gICAgICAgICAgdmFyIGxvY2FsZUZ1bGxDYWxlbmRhckNvbmZpZyA9IGNvbnRyb2xsZXIuZ2V0TG9jYWxlQ29uZmlnKGZ1bGxDYWxlbmRhckNvbmZpZyk7XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQobG9jYWxlRnVsbENhbGVuZGFyQ29uZmlnLCBmdWxsQ2FsZW5kYXJDb25maWcpO1xuXG4gICAgICAgICAgb3B0aW9ucyA9IHsgZXZlbnRTb3VyY2VzOiBzb3VyY2VzIH07XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQob3B0aW9ucywgbG9jYWxlRnVsbENhbGVuZGFyQ29uZmlnKTtcblxuICAgICAgICAgIHZhciBvcHRpb25zMiA9IHt9O1xuICAgICAgICAgIGZvcih2YXIgbyBpbiBvcHRpb25zKXtcbiAgICAgICAgICAgIGlmKG8gIT09ICdldmVudFNvdXJjZXMnKXtcbiAgICAgICAgICAgICAgb3B0aW9uczJbb10gPSBvcHRpb25zW29dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob3B0aW9uczIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaWYoc2NvcGUuY2FsZW5kYXIgJiYgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKXtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcignZGVzdHJveScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZihhdHRycy5jYWxlbmRhcikge1xuICAgICAgICAgICAgc2NvcGUuY2FsZW5kYXIgPSBzY29wZS4kcGFyZW50W2F0dHJzLmNhbGVuZGFyXSA9ICAkKGVsbSkuaHRtbCgnJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyID0gJChlbG0pLmh0bWwoJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzY29wZS5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIob3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlci5vbkFkZGVkID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ2FkZEV2ZW50U291cmNlJywgc291cmNlKTtcbiAgICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudFNvdXJjZXNXYXRjaGVyLm9uUmVtb3ZlZCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVtb3ZlRXZlbnRTb3VyY2UnLCBzb3VyY2UpO1xuICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudHNXYXRjaGVyLm9uQWRkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVuZGVyRXZlbnQnLCBldmVudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRzV2F0Y2hlci5vblJlbW92ZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVtb3ZlRXZlbnRzJywgZnVuY3Rpb24oZSkgeyBcbiAgICAgICAgICAgIHJldHVybiBlLl9pZCA9PT0gZXZlbnQuX2lkO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50c1dhdGNoZXIub25DaGFuZ2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5fc3RhcnQgPSAkLmZ1bGxDYWxlbmRhci5tb21lbnQoZXZlbnQuc3RhcnQpO1xuICAgICAgICAgIGV2ZW50Ll9lbmQgPSAkLmZ1bGxDYWxlbmRhci5tb21lbnQoZXZlbnQuZW5kKTtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ3VwZGF0ZUV2ZW50JywgZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50U291cmNlc1dhdGNoZXIuc3Vic2NyaWJlKHNjb3BlKTtcbiAgICAgICAgZXZlbnRzV2F0Y2hlci5zdWJzY3JpYmUoc2NvcGUsIGZ1bmN0aW9uKG5ld1Rva2Vucywgb2xkVG9rZW5zKSB7XG4gICAgICAgICAgaWYgKHNvdXJjZXNDaGFuZ2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gcHJldmVudCBpbmNyZW1lbnRhbCB1cGRhdGVzIGluIHRoaXMgY2FzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2NvcGUuJHdhdGNoKGdldE9wdGlvbnMsIGZ1bmN0aW9uKG5ld08sb2xkTyl7XG4gICAgICAgICAgICBzY29wZS5kZXN0cm95KCk7XG4gICAgICAgICAgICBzY29wZS5pbml0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG59XSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKFwia2V5ZG93biBrZXlwcmVzc1wiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYoIWV2ZW50LmFsdEtleSAmJiAhZXZlbnQuc2hpZnRLZXkgJiYgIWV2ZW50LmN0cmxLZXkgJiYgZXZlbnQud2hpY2ggPT09IDEzKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHJzLm5nRW50ZXIsIHsnZXZlbnQnOiBldmVudH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25nSW5maW5pdGVTY3JvbGwnLCBmdW5jdGlvbigkd2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZChcInNjcm9sbFwiLCBmdW5jdGlvbigpIHtcblx0XHQgICAgdmFyIHdpbmRvd0hlaWdodCBcdD0gXCJpbm5lckhlaWdodFwiIGluIHdpbmRvdyA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHQ7XG5cdFx0ICAgIHZhciBib2R5IFx0XHRcdD0gZG9jdW1lbnQuYm9keSwgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHQgICAgdmFyIGRvY0hlaWdodCBcdFx0PSBNYXRoLm1heChib2R5LnNjcm9sbEhlaWdodCwgYm9keS5vZmZzZXRIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0LCAgaHRtbC5zY3JvbGxIZWlnaHQsIGh0bWwub2Zmc2V0SGVpZ2h0KTtcblx0XHQgICAgd2luZG93Qm90dG9tIFx0XHQ9IHdpbmRvd0hlaWdodCArIHdpbmRvdy5wYWdlWU9mZnNldDtcblx0XHQgICAgXG5cdFx0ICAgIGlmICh3aW5kb3dCb3R0b20gPj0gZG9jSGVpZ2h0KSB7XG5cdFx0XHQgICAgLy8gSW5zZXJ0IGxvYWRlciBjb2RlIGhlcmUuXG5cdFx0XHQgICAgc2NvcGUub2Zmc2V0ID0gc2NvcGUub2Zmc2V0ICsgc2NvcGUubGltaXQ7XG5cdFx0ICAgICAgICBzY29wZS5sb2FkKCk7XG5cdFx0ICAgIH1cblx0XHR9KTtcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc3RyaW5nVG9OdW1iZXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG4gICAgICBuZ01vZGVsLiRwYXJzZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuICcnICsgdmFsdWU7XG4gICAgICB9KTtcbiAgICAgIG5nTW9kZWwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSwgMTApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSk7IiwiYXBwLmZpbHRlcignY3V0U3RyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIHdvcmR3aXNlLCBtYXgsIHRhaWwpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuICcnO1xuXG4gICAgICAgIG1heCA9IHBhcnNlSW50KG1heCwgMTApO1xuICAgICAgICBpZiAoIW1heCkgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAodmFsdWUubGVuZ3RoIDw9IG1heCkgcmV0dXJuIHZhbHVlO1xuXG4gICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyKDAsIG1heCk7XG4gICAgICAgIGlmICh3b3Jkd2lzZSkge1xuICAgICAgICAgICAgdmFyIGxhc3RzcGFjZSA9IHZhbHVlLmxhc3RJbmRleE9mKCcgJyk7XG4gICAgICAgICAgICBpZiAobGFzdHNwYWNlICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHIoMCwgbGFzdHNwYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZSArICh0YWlsIHx8ICfigKYnKTtcbiAgICB9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdkYXRlVG9JU08nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYoaW5wdXQgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICB2YXIgYSA9IGlucHV0LnNwbGl0KC9bXjAtOV0vKTtcbiAgICAgICAgICAgIHZhciBkPW5ldyBEYXRlIChhWzBdLGFbMV0tMSxhWzJdLGFbM10sYVs0XSxhWzVdICk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoZCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhcHAuZmlsdGVyKCdpc0VtcHR5JywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXF1YWxzKHt9LCBvYmplY3QpO1xuICAgIH07XG59XSk7IiwiYXBwLmZpbHRlcignbnVtJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dCwgMTApO1xuICAgIH07XG59KTsiLCJhcHAuZmlsdGVyKCdyYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCwgc3RhcnQsIGVuZCkge1xuICAgICAgICBzdGFydCA9IHBhcnNlSW50KHN0YXJ0KTtcbiAgICAgICAgZW5kID0gcGFyc2VJbnQoZW5kKTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGlmKHN0YXJ0IDwgZW5kKXtcbiAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaTxlbmQ7IGkrKylcbiAgICAgICAgICAgICAgICBpbnB1dC5wdXNoKGkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaT5lbmQ7IGktLSlcbiAgICAgICAgICAgICAgICBpbnB1dC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcigncmVuZGVySFRNTENvcnJlY3RseScsIGZ1bmN0aW9uKCRzY2UpXG57XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZ1RvUGFyc2UpXG4gICAge1xuICAgICAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbChzdHJpbmdUb1BhcnNlKTtcbiAgICB9O1xufSk7XG4iLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluQ29udHJvbGxlcicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnYWRtaW4nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2VycycsIHtcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi51c2Vycy5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ1VzZXJzQ29udHJvbGxlciBhcyB1c2VycydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzJywge1xuICAgICAgICB1cmw6ICcvY2x1YnMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5DbHVic0NvbnRyb2xsZXIgYXMgY2x1YnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdycsIHtcbiAgICAgICAgdXJsOiAnLzppZCcsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuc2hvdycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluQ2x1YkNvbnRyb2xsZXIgYXMgY2x1YnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy51c2VycycsIHtcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLnVzZXJzJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93LmFkbWlucycsIHtcbiAgICAgICAgdXJsOiAnL2FkbWlucycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5hZG1pbnMnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4vL1x0JGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG5cdC8vIEF1dGguXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoJywge1xuXHRcdHVybDogJy9hdXRoJyxcblx0XHRwYXJlbnQ6ICdwdWJsaWMnLFxuXHRcdGFic3RyYWN0OiB0cnVlLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL2luZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0F1dGhDb250cm9sbGVyJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cdCR1cmxSb3V0ZXJQcm92aWRlci53aGVuKCcvYXV0aCcsICcvYXV0aC9sb2dpbicpO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5yZWdpc3RlcicsIHtcblx0XHR1cmw6ICcvcmVnaXN0ZXInLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL3JlZ2lzdGVyJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGguaW52aXRlJywge1xuXHRcdHVybDogJy9yZWdpc3Rlci86aW52aXRlX3Rva2VuJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9yZWdpc3RlcicsXG5cdFx0Y29udHJvbGxlcjogJ0F1dGhDb250cm9sbGVyJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGguaW5hY3RpdmUnLCB7XG5cdFx0dXJsOiAnL2luYWN0aXZlJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9pbmFjdGl2ZSdcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmFjdGl2YXRlJywge1xuXHRcdHVybDogJy9hY3RpdmF0ZS86dG9rZW4nLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL2FjdGl2YXRlJyxcblx0XHRjb250cm9sbGVyOiAnQWN0aXZhdGlvbkNvbnRyb2xsZXInXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5sb2dpbicsIHtcblx0XHR1cmw6ICcvbG9naW4nLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL2xvZ2luJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgucGFzc3dvcmQnLCB7XG5cdFx0dXJsOiAnL3Bhc3N3b3JkJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9wYXNzd29yZCdcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLnJlc2V0Jywge1xuXHRcdHVybDogJy9yZXNldC86dG9rZW4nLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL3Jlc2V0Jyxcblx0XHRjb250cm9sbGVyOiBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgQXV0aEZhY3Rvcnkpe1xuXHRcdFx0JHNjb3BlLnJlc2V0ID0ge2VtYWlsOiAnJywgdG9rZW46ICRzdGF0ZVBhcmFtcy50b2tlbn07XG5cblx0XHRcdCRzY29wZS5yZXNldFBhc3N3b3JkID0gZnVuY3Rpb24oKVxuXHRcdFx0e1xuXG5cdFx0XHRcdEF1dGhGYWN0b3J5XG5cdFx0XHRcdFx0LnJlc2V0UGFzc3dvcmQoJHNjb3BlLnJlc2V0KVxuXHRcdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHRcdCRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHQkc2NvcGUucmVzZXQgPSB7ZW1haWw6ICcnLCB0b2tlbjogJHN0YXRlUGFyYW1zLnRva2VufTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcblx0XHRcdFx0XHRcdCRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IGZhbHNlO1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdFx0aWYocmVzcG9uc2UuZGF0YS5zdGF0dXMgIT09ICdzdWNjZXNzJylcblx0XHRcdFx0XHRcdHtcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9KTtcblx0XHRcdH07XG5cdFx0fVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgubG9nb3V0Jywge1xuXHRcdHVybDogJy9sb2dvdXQnLFxuXHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKEF1dGhGYWN0b3J5KXtcblx0XHRcdEF1dGhGYWN0b3J5LmxvZ291dCgpO1xuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoYW1waW9uc2hpcHMnLCB7XG5cdFx0dXJsOiAnL2NoYW1waW9uc2hpcHMnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOntcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2hhbXBpb25zaGlwcy5pbmRleCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDaGFtcGlvbnNoaXBzQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ2NoYW1waW9uc2hpcHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hhbXBpb25zaGlwJywge1xuXHRcdHVybDogJy9jaGFtcGlvbnNoaXAvOmlkJyxcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jaGFtcGlvbnNoaXBzLnNob3cnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ2hhbXBpb25zaGlwQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ2NoYW1waW9uc2hpcHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hhbXBpb25zaGlwLnNob3cnLCB7XG5cdFx0dXJsOiAnLzp2aWV3Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiBmdW5jdGlvbigkc3RhdGVQYXJhbXMpe1xuXHRcdFx0XHRcdHJldHVybiAnL3ZpZXdzL3BhcnRpYWxzLmNoYW1waW9uc2hpcHMuc2hvdy4nKyRzdGF0ZVBhcmFtcy52aWV3O1xuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMpe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuY3VycmVudFZpZXcgPSAkc3RhdGVQYXJhbXMudmlldztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViJywge1xuICAgICAgICB1cmw6ICcvY2x1YicsXG4gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1YkNvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ2NsdWInXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLmluZm9ybWF0aW9uJywge1xuICAgICAgICB1cmw6ICcvaW5mb3JtYXRpb24nLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLmluZm9ybWF0aW9uJyxcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuYWRtaW5zJywge1xuICAgICAgICB1cmw6ICcvYWRtaW5zJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5hZG1pbnMnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cblxuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb25zJywge1xuXHRcdHVybDogJy9jb21wZXRpdGlvbnM/cGFnZSZzb3J0Jyxcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHR2aWV3czp7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5pbmRleCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDb21wZXRpdGlvbnNDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnY29tcGV0aXRpb25zJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRwYWdlOiB7XG5cdFx0XHRcdHZhbHVlOiAnMCcsXG5cdFx0XHRcdHNxdWFzaDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHNvcnQ6IHtcblx0XHRcdFx0dmFsdWU6ICdkYXRlJyxcblx0XHRcdFx0c3F1YXNoOiB0cnVlXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24nLCB7XG5cdFx0dXJsOiAnL2NvbXBldGl0aW9uLzppZCcsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25Db250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnY29tcGV0aXRpb25zJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzJywge1xuXHRcdHVybDogJy90ZWFtc2lnbnVwcycsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdtYWluJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuc2hvdy50ZWFtc2lnbnVwcy5pbmRleCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdUZWFtU2lnbnVwQ29udHJvbGxlciBhcyB0ZWFtc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcy5jcmVhdGUnLCB7XG5cdFx0dXJsOiAnL2NyZWF0ZScsXG5cdFx0dmlld3M6IHtcblx0XHRcdCcnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnRlYW1zaWdudXBzLmNyZWF0ZSdcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcy5lZGl0Jywge1xuXHRcdHVybDogJy86dGVhbXNfaWQnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuc2hvdy50ZWFtc2lnbnVwcy5lZGl0Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1RlYW1TaWdudXBDb250cm9sbGVyIGFzIHRlYW1zaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnNob3cnLCB7XG5cdFx0dXJsOiAnLzp2aWV3Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiBmdW5jdGlvbigkc3RhdGVQYXJhbXMpe1xuXHRcdFx0XHRcdHJldHVybiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LicrJHN0YXRlUGFyYW1zLnZpZXc7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcyl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5jdXJyZW50VmlldyA9ICRzdGF0ZVBhcmFtcy52aWV3O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2NvbXBldGl0aW9ucycpO1xuXG4gICAgaWYobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSlcbiAgICB7XG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9jb21wZXRpdGlvbnMnKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2F1dGgvcmVnaXN0ZXInKTtcbiAgICB9XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHZpZXdzOntcbiAgICAgICAgICAgICduYXZpZ2F0aW9uQCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5uYXZpZ2F0aW9uJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHVibGljJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdmlld3M6e1xuICAgICAgICAgICAgJ25hdmlnYXRpb25AJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL25hdmlnYXRpb24nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5kYXNoYm9hcmQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncycsIHtcbiAgICAgICAgdXJsOiAnL3NldHRpbmdzJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnU2V0dGluZ3NDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdzZXR0aW5ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLmluZGV4Jywge1xuICAgICAgICB1cmw6Jy8nLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOiB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHN0YXRlKXtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzZXR0aW5ncy51c2VyJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MudXNlcicsIHtcbiAgICAgICAgdXJsOiAnL3VzZXInLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy51c2VyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlVzZXJQcm9maWxlQ29udHJvbGxlciBhcyB1c2VycHJvZmlsZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy51c2VyLmVkaXQnLCB7XG4gICAgICAgIHVybDogJy9lZGl0JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdlZGl0Jzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLnVzZXJlZGl0J1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MuY2FuY2VsYWNjb3VudCcsIHtcbiAgICAgICAgdXJsOiAnL2NhbmNlbGFjY291bnQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MuY2FuY2VsYWNjb3VudCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MucGFzc3dvcmQnLCB7XG4gICAgICAgIHVybDogJy9wYXNzd29yZCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnc2V0dGluZyc6e1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLnBhc3N3b3JkJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlBhc3N3b3JkQ29udHJvbGxlciBhcyBwYXNzd29yZFwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcbiAgICBcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MuaW52aXRlJywge1xuICAgICAgICB1cmw6ICcvaW52aXRlJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdzZXR0aW5nJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MuaW52aXRlJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIkludml0ZUNvbnRyb2xsZXIgYXMgaW52aXRlXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwcycsIHtcblx0XHR1cmw6ICcvc2lnbnVwcycsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6e1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zaWdudXBzLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1NpZ251cHNDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cC86aWQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNpZ251cHMuc2hvdycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cC5lZGl0Jywge1xuXHRcdHVybDogJy9lZGl0Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zaWdudXBzLmVkaXQnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnU2lnbnVwQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ3NpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
