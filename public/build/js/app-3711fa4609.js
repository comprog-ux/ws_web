var app = angular.module('app',
	[
		'angular-jwt',
		'angular.filter',
		'ui.router',
		'ui.calendar',
		'ui.bootstrap',
		'ui.bootstrap.datetimepicker',
		'ui.sortable',
		'ngFileSaver',
		'app.auth',
		'app.admin',
		'app.admin.clubs',
		'app.admin.invoices',
		'app.admin.signups',
		'app.admin.users',
		'app.calendar',
		'app.championships',
		'app.clubs',
		'app.clubs.invoices',
		'app.competitions',
		'app.dashboard',
		'app.errorhandler',
		'app.invoices',
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
        $rootScope.loadingState =  true;
        AdminClubsFactory.find($stateParams.id)
            .success(function(response){
                self.club = response.club;
            })
            .error(function(){
                $state.go('admin.clubs', {}, {location:'replace'});
            })
            .finally(function(){
                $rootScope.loadingState = false;
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
angular.module('app.admin.invoices', [])


.controller("AdminInvoicesController", ["$rootScope", "$stateParams", "$state", "AdminInvoicesFactory", "FileSaver", "Blob", function($rootScope, $stateParams, $state, AdminInvoicesFactory, FileSaver, Blob) {
    var self = this;

    function loadInvoices(){
        $rootScope.loadingState = true;
        AdminInvoicesFactory.load()
            .success(function(response){
                self.invoices = response.invoices;
                self.invoices_overview = response.invoices_overview;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.download = function(invoice){
        AdminInvoicesFactory.download(invoice.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
                }
            });
    };

    loadInvoices();
}])
.controller("AdminInvoiceController", ["$rootScope", "$stateParams", "$state", "AdminInvoicesFactory", "FileSaver", "Blob", function($rootScope, $stateParams, $state, AdminInvoicesFactory, FileSaver, Blob) {
    var self = this;
    function loadInvoices(){
        $rootScope.loadingState = true;
        AdminInvoicesFactory.load($stateParams.id)
            .success(function(response){
                if(!response.invoice) $state.go('admin.invoices.index');
                self.invoice = response.invoice;
                self.hideSignups = true;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.download = function(invoice){
        AdminInvoicesFactory.download(invoice.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
                }
            });
    };

    loadInvoices();
}])

.factory('AdminInvoicesFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

    return {
        load: function(id) {
            var url = (id) ? '/'+id : '';
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'admin/invoices'+url,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        download: function(id){
            if(id){
                return $http({
                    method: 'GET',
                    url: ApiEndpointUrl+'admin/invoices/'+id+'/download',
                    responseType: 'arraybuffer',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
                });
            }
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


angular.module('app.admin.signups', [])

.controller("AdminSignupsController", ["$rootScope", "$stateParams", "$state", "AdminSignupsFactory", "$timeout", function($rootScope, $stateParams, $state, AdminSignupsFactory, $timeout){
	var self = this;

	self.load = function() {
		$rootScope.loadingState = true;
		var args = {
			current_page: $stateParams.current_page,
			per_page: $stateParams.per_page,
			competitions_id: $stateParams.competitions_id,
			search: $stateParams.search
		};
		AdminSignupsFactory.load(args)
			.success(function(response){
				self.signups = response.signups;
				self.competitions = response.competitions;
				$rootScope.loadingState = false;
			});
	};

	self.updatePage = function(){
		var args = {
			search: self.signups.search,
			current_page: self.signups.current_page,
			per_page: self.signups.per_page,
			competitions_id: self.signups.competitions_id
		};
		$state.go('admin.signups.index', args, {location:'replace'});
	};

	self.load();

}])

.factory('AdminSignupsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

	return {
		load: function (args) {

			var url = ApiEndpointUrl+'admin/signups';
			current_page = (args.current_page) ? args.current_page : 1;

			url += '?page=' + current_page;
			if (args.search) url += '&search=' + args.search;
			if (args.per_page) url += '&per_page=' + args.per_page;
			if (args.competitions_id) url += '&competitions_id=' + args.competitions_id;
			if (args.specialwishes) url += '&status=' + args.specialwishes;

			return $http({
				method: 'GET',
				url: url,
				headers: {'Content-Type': 'application/x-www-form-urlencoded'}
			});
		}

	};
}]);

angular.module('app.admin.users', [])

.controller("AdminUsersController", ["$rootScope", "$stateParams", "$state", "AdminUsersFactory", "$timeout", function($rootScope, $stateParams, $state, AdminUsersFactory, $timeout){
	var self = this;

	self.load = function() {
		$rootScope.loadingState = true;
		var args = {
			current_page: $stateParams.current_page,
			per_page: $stateParams.per_page,
			search: $stateParams.search,
			status: $stateParams.status
		};
		AdminUsersFactory.load(args)
			.success(function(response){
				self.users = response.users;
				$rootScope.loadingState = false;
			});
	};

	self.updatePage = function(){
		var args = {
			search: self.users.search,
			status: self.users.status,
			current_page: self.users.current_page,
			per_page: self.users.per_page
		};
		$state.go('admin.users.index', args, {location:'replace'});
	};

	self.load();

}])

.controller("AdminUserController", ["$rootScope", "$stateParams", "$state", "AdminUsersFactory", "AdminInvoicesFactory", "FileSaver", "Blob", function($rootScope, $stateParams, $state, AdminUsersFactory, AdminInvoicesFactory, FileSaver, Blob){
	var self = this;
	function loadUser(){
		$rootScope.loadingState = true;
		if($stateParams.user_id){
			AdminUsersFactory.find($stateParams.user_id)
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
		$rootScope.loadingState = true;
		AdminUsersFactory.saveUser(user)
			.success(function(response){
				$rootScope.displayFlashMessages(response);
				$state.go('admin.users.show', {user_id: user.user_id}, {location: 'reload'});
			})
			.error(function(response){
				$rootScope.displayFlashMessages(response, 'error');
			})
			.finally(function(){
				$rootScope.loadingState = false;
			});
	};

	self.createUser = function(user){
		if(self.loadingState) return false;
		self.loadingState = true;
		AdminUsersFactory.createUser(user)
			.success(function(response){
				$rootScope.displayFlashMessages(response);
				$state.go('admin.users.show', {user_id: response.user_id}, {location: 'reload'});
			})
			.error(function(response){
				$rootScope.displayFlashMessages(response, 'error');
			})
			.finally(function(response){
				self.loadingState = false;
			});
	};

	self.downloadInvoice = function(invoice){
		AdminInvoicesFactory.download(invoice.id)
			.success(function(response){
				var file = new Blob([response], {type: 'application/pdf'});
				if(file.size) {
					FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
				}
			});
	};

}])


.factory('AdminUsersFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

	return {
		load: function (args) {

			var url = ApiEndpointUrl+'admin/users';
			current_page = (args.current_page) ? args.current_page : 1;

			url += '?page=' + current_page;
			if (args.search) url += '&search=' + args.search;
			if (args.per_page) url += '&per_page=' + args.per_page;
			if (args.status) url += '&status=' + args.status;

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
		},

		saveUser: function(user){
			var data = angular.copy(user);
			data.birthday = data.birthday+'-01-01';
			return $http({
				method: 'PUT',
				url: ApiEndpointUrl+'admin/users/'+data.user_id,
				headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
				data: $.param(data)
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


        localStorage.removeItem('user');
        localStorage.removeItem('token');
        $rootScope.authenticated = false;
        $rootScope.currentUser = null;

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


angular.module('app.clubs.invoices', [])

.controller("ClubGenerateInvoicesController", ["$rootScope", "$stateParams", "$state", "ClubInvoicesFactory", function($rootScope, $stateParams, $state, ClubInvoicesFactory) {
    var self = this;

    function loadInvoices(){
        $rootScope.loadingState = true;
        ClubInvoicesFactory.loadPendingSignups()
            .success(function(response){
                self.clubs = response.clubs;
                self.hideSignups = true;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.createInvoice = function(){
        $rootScope.loadingState = true;
        ClubInvoicesFactory.createInvoices()
            .success(function(response){
                $rootScope.displayFlashMessages(response.message, 'success');
                $state.go('club.invoices.index');
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    };

    loadInvoices();
}])
.controller("ClubInvoicesController", ["$rootScope", "$stateParams", "$state", "ClubInvoicesFactory", "$uibModal", "FileSaver", "Blob", function($rootScope, $stateParams, $state, ClubInvoicesFactory, $uibModal, FileSaver, Blob) {
    var self = this;

    function loadInvoices(){
        $rootScope.loadingState = true;
        ClubInvoicesFactory.load()
            .success(function(response){
                self.invoices_incoming = response.invoices_incoming;
                self.invoices_outgoing = response.invoices_outgoing;
                self.invoices_generate = response.invoices_generate;
                self.hideSignups = true;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.openPaymentModal = function(invoice){

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'ClubInvoicePaymentModal.html',
            controller: 'ClubInvoicePaymentModalController as modalcontroller',
            size: 'md',
            resolve: {
                invoice: function () {
                    return invoice;
                }
            }
        });

        modalInstance.result.then(function () {
            loadInvoices();
        });
    };

    self.download = function(invoice){
        ClubInvoicesFactory.download(invoice.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
                }
            });
    };
    
    loadInvoices();
}])
.controller("ClubInvoiceController", ["$rootScope", "$stateParams", "$state", "ClubInvoicesFactory", "FileSaver", "Blob", function($rootScope, $stateParams, $state, ClubInvoicesFactory, FileSaver, Blob) {
    var self = this;
    function loadInvoices(){
        $rootScope.loadingState = true;
        ClubInvoicesFactory.load($stateParams.id)
            .success(function(response){
                if(!response.invoice) $state.go('club.invoices.index');
                self.invoice = response.invoice;
                self.hideSignups = true;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.download = function(invoice){
        ClubInvoicesFactory.download(invoice.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
                }
            });
    };

    loadInvoices();
}])
.controller('ClubInvoicePaymentModalController', ["$scope", "$uibModalInstance", "invoice", "ClubInvoicesFactory", function ($scope, $uibModalInstance, invoice, ClubInvoicesFactory) {
    var self = this;
    
    self.options = {
        showWeeks: true,
        startingDay: 1,
        maxDate: new Date(),
        minDate: moment(invoice.invoice_date).startOf('day')
    };
    self.invoice = angular.copy(invoice);

    self.registerPayment = function (invoice) {
        if(invoice.paid_at && !self.loadingState){
            self.loadingState = true;
            ClubInvoicesFactory.registerPayment(invoice.id, invoice.paid_at)
                .success(function(response){
                    $uibModalInstance.close();
                })
                .finally(function(){
                    self.loadingState = false;
                });
        }
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}])
.factory('ClubInvoicesFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

    return {
        load: function(id) {
            var url = (id) ? '/'+id : '';
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'clubinvoices'+url,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        loadPendingSignups: function() {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'clubinvoices/pendingsignups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        createInvoices: function(){
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'clubinvoices',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'clubinvoices/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        registerPayment: function(id, paid_at){

            paid_at = moment(new Date(paid_at)).format('YYYY-MM-DD HH:mm:ss');

            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'clubinvoices/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({paid_at: paid_at})
            });
        },

        download: function(id){
            if(id){
                return $http({
                    method: 'GET',
                    url: ApiEndpointUrl+'clubinvoices/'+id+'/download',
                    responseType: 'arraybuffer',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
                });
            }
        }

    };
}]);

angular.module('app.clubs', [])

.controller("ClubController", ["$rootScope", "$scope", "$state", "ClubsFactory", function($rootScope, $scope, $state, ClubsFactory){
	var self = this;

	self.filter = {
		users: {
			search: ''
		},
		invoices: {
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
        if(self.loadingState) return false;
        self.loadingState = true;
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
            })
            .finally(function(){
                self.loadingState = false;
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

angular.module('app.invoices', [])

.controller("GenerateInvoicesController", ["$rootScope", "$stateParams", "$state", "InvoicesFactory", function($rootScope, $stateParams, $state, InvoicesFactory) {
    var self = this;

    function loadInvoices(){
        $rootScope.loadingState = true;
        InvoicesFactory.loadPendingSignups()
            .success(function(response){
                self.signups = response.signups;
                self.hideSignups = true;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.createInvoice = function(){
        $rootScope.loadingState = true;
        InvoicesFactory.createInvoices()
            .success(function(response){
                $rootScope.displayFlashMessages(response.message, 'success');
                $state.go('invoices.index');
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    };

    loadInvoices();
}])
.controller("InvoicesController", ["$rootScope", "$stateParams", "$state", "InvoicesFactory", "$uibModal", "FileSaver", "Blob", function($rootScope, $stateParams, $state, InvoicesFactory, $uibModal, FileSaver, Blob) {
    var self = this;

    function loadInvoices(){
        $rootScope.loadingState = true;
        InvoicesFactory.load()
            .success(function(response){
                self.invoices_incoming = response.invoices_incoming;
                self.invoices_outgoing = response.invoices_outgoing;
                self.invoices_generate = response.invoices_generate;
                self.hideSignups = true;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.openPaymentModal = function(invoice){

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'InvoicePaymentModal.html',
            controller: 'InvoicePaymentModalController as modalcontroller',
            size: 'md',
            resolve: {
                invoice: function () {
                    return invoice;
                }
            }
        });

        modalInstance.result.then(function () {
            loadInvoices();
        });
    };

    self.download = function(invoice){
        InvoicesFactory.download(invoice.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
                }
            });
    };

    loadInvoices();
}])
.controller("InvoiceController", ["$rootScope", "$stateParams", "$state", "InvoicesFactory", "FileSaver", "Blob", function($rootScope, $stateParams, $state, InvoicesFactory, FileSaver, Blob) {
    var self = this;
    function loadInvoices(){
        $rootScope.loadingState = true;
        InvoicesFactory.load($stateParams.id)
            .success(function(response){
                if(!response.invoice) $state.go('invoices.index');
                self.invoice = response.invoice;
                self.hideSignups = true;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    }

    self.download = function(invoice){
        InvoicesFactory.download(invoice.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
                }
            });
    };

    loadInvoices();
}])
.controller('InvoicePaymentModalController', ["$scope", "$uibModalInstance", "invoice", "InvoicesFactory", function ($scope, $uibModalInstance, invoice, InvoicesFactory) {
    var self = this;
    
    self.options = {
        showWeeks: true,
        startingDay: 1,
        maxDate: new Date(),
        minDate: moment(invoice.invoice_date).startOf('day')
    };
    self.invoice = angular.copy(invoice);

    self.registerPayment = function (invoice) {
        if(invoice.paid_at && !self.loadingState){
            self.loadingState = true;
            InvoicesFactory.registerPayment(invoice.id, invoice.paid_at)
                .success(function(response){
                    $uibModalInstance.close();
                })
                .finally(function(){
                    self.loadingState = false;
                });
        }
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}])
.factory('InvoicesFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

    return {
        load: function(id) {
            var url = (id) ? '/'+id : '';
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'invoices'+url,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        loadPendingSignups: function() {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'invoices/pendingsignups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        createInvoices: function(){
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'invoices',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'invoices/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        registerPayment: function(id, paid_at){

            paid_at = moment(new Date(paid_at)).format('YYYY-MM-DD HH:mm:ss');

            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'invoices/'+id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({paid_at: paid_at})
            });
        },

        download: function(id){
            if(id){
                return $http({
                    method: 'GET',
                    url: ApiEndpointUrl+'invoices/'+id+'/download',
                    responseType: 'arraybuffer',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
                });
            }
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
                self.invoices_generate = response.invoices_generate;
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
        if(self.loadingState) return false;
        self.loadingState = true;
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
            })
            .finally(function(){
                self.loadingState = false;
            });
    };

    self.deleteSignup = function(signup){
        if(self.loadingState) return false;
        self.loadingState = true;
        SignupsFactory.deleteSignup(signup)
            .success(function(response){

                // Remove the shift from the calendar.
                angular.forEach(self.competition.signups, function(signups, index){
                    if(signups.id == signup.id)
                    {
                        self.competition.signups.splice(index, 1);
                    }
                });
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                self.loadingState = false;
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
                    self.signups_ordinary_available = response.signups_ordinary_available;
                    self.signups_reserve_available = response.signups_reserve_available;

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
                        weapongroups_id: '',
                        teams_signups_first: null,
                        teams_signups_second: null,
                        teams_signups_third: null,
                        teams_signups_fourth: null,
                        teams_signups_fifth: null
                    };
                    self.teams = response.teams;
                    self.signups_ordinary_available = response.signups_ordinary_available;
                    self.signups_reserve_available = response.signups_reserve_available;
                    $rootScope.loadingState = false;
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                    $rootScope.loadingState = false;
                });
        }

    }

    self.createTeam = function(){
        if(self.addTeam.name && self.addTeam.weapongroups_id){
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
        if(self.teams.name && self.teams.weapongroups_id){
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
        if(self.loadingState) return false;
        self.loadingState = true;
        UsersFactory.createUser(user)
            .success(function(response){
                $rootScope.displayFlashMessages(response);
                $state.go('club.users.index', {}, {location: 'reload'});
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(response){
                self.loadingState = false;
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
                    } else if (response.data.error == 'user_inactive' || response.data.error == 'user_not_found') {
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
                    } else if (response.error == 'user_inactive' || response.error == 'user_not_found') {
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
        if(input !== undefined && input !== null){
            var a = input.split(/[^0-9]/);
            var d=new Date (a[0],a[1]-1,a[2],a[3],a[4],a[5] );
            return new Date(d).toISOString();
        }
    };
});
app.filter('excludeByIds', function () {
    return function(inputs,filterValues) {
        var output = [];
        angular.forEach(inputs, function (input) {
            if (filterValues.indexOf(input.id) == -1)
                output.push(input);
        });
        return output;
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

app.filter('sumByKey', function() {
    return function(data, key) {
        if (typeof(data) === 'undefined' || typeof(key) === 'undefined') {
            return 0;
        }

        var sum = 0;
        for (var i = data.length - 1; i >= 0; i--) {
            sum += parseInt(data[i][key]);
        }

        return sum;
    };
});
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {
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
    $stateProvider.state('admin.clubs.show.invoices', {
        url: '/invoices',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.clubs.invoices.index'
            }
        }
    });
    $stateProvider.state('admin.clubs.show.signups', {
        url: '/signups',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.clubs.signups'
            }
        }
    });
    $stateProvider.state('admin.clubs.show.teams', {
        url: '/teams',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.clubs.teams'
            }
        }
    });
    $stateProvider.state('admin.clubs.show.invoices.incoming', {
        url: '/incoming',
        restricted: true,
        views: {
            'main@admin.clubs.show': {
                templateUrl: '/views/partials.admin.clubs.invoices.incoming'
            }
        }
    });
    $stateProvider.state('admin.clubs.show.invoices.outgoing', {
        url: '/outgoing',
        restricted: true,
        views: {
            'main@admin.clubs.show': {
                templateUrl: '/views/partials.admin.clubs.invoices.outgoing'
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

    $stateProvider.state('admin.invoices', {
        url: '/invoices',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.invoices.index',
                controller: 'AdminInvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('admin.invoices.show', {
        url: '/:id',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.invoices.show',
                controller: 'AdminInvoiceController as invoices'
            }
        }
    });
}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {

    $stateProvider.state('admin.signups', {
        abstract: true,
        url: '/signups',
        restricted: true
    });
    $stateProvider.state('admin.signups.index', {
        url: '?current_page&per_page&search%competitions_id',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.signups.index',
                controller: 'AdminSignupsController as signups'
            }
        },
        params: {
            current_page: {
                value: '1',
                squash: true
            },
            per_page: {
                value: '10',
                squash: true
            },
            search: {
                value: '',
                squash: true
            },
            competitions_id: {
                value: null,
                squash: true
            }
        }
    });
}]);
app.config(["$stateProvider", "$locationProvider", "$urlRouterProvider", function($stateProvider, $locationProvider, $urlRouterProvider) {

    $stateProvider.state('admin.users', {
        abstract: true,
        url: '/users',
        restricted: true
    });
    $stateProvider.state('admin.users.index', {
        url: '?current_page&per_page&search&status',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.users.index',
                controller: 'AdminUsersController as users'
            }
        },
        params: {
            current_page: {
                value: '1',
                squash: true
            },
            per_page: {
                value: '10',
                squash: true
            },
            search: {
                value: '',
                squash: true
            },
            status: {
                value: 'all',
                squash: true
            }
        }
    });
    $stateProvider.state('admin.users.show.edit', {
        url: '/edit',
        restricted: true,
        views: {
            'main': {   
                templateUrl: '/views/partials.admin.users.edit'
            }
        }
    });
    $stateProvider.state('admin.users.show.signups', {
        url: '/signups',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.users.signups'
            }
        }
    });
    $stateProvider.state('admin.users.show.invoices', {
        url: '/invoices',
        restricted: true,
        views: {
            'main': {
                templateUrl: '/views/partials.admin.users.invoices'
            }
        }
    });
    $stateProvider.state('admin.users.show', {
        url: '/:user_id',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.users.show',
                controller: 'AdminUserController as user'
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

    $stateProvider.state('club.users.show', {
        url: '/:user_id',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.users.show',
                controller: 'UserController as user'
            }
        }
    });


    $stateProvider.state('club.invoices', {
        abstract: true,
        url: '/invoices',
        restricted: true,
    });
    $stateProvider.state('club.invoices.index', {
        url: '',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.invoices.index',
                controller: 'ClubInvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('club.invoices.incoming', {
        url: '/incoming',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.invoices.incoming',
                controller: 'ClubInvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('club.invoices.outgoing', {
        url: '/outgoing',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.invoices.outgoing',
                controller: 'ClubInvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('club.invoices.generate', {
        url: '/generate',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.invoices.generate',
                controller: 'ClubGenerateInvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('club.invoices.show', {
        url: '/:id',
        restricted: true,
        views: {
            'main@club': {
                templateUrl: '/views/partials.club.invoices.show',
                controller: 'ClubInvoiceController as invoices'
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
    $stateProvider.state('invoices', {
        parent: 'root',
        abstract: true,
        url: '/invoices',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.invoices.index'
            }
        }
    });
    $stateProvider.state('invoices.index', {
        url: '',
        restricted: true,
        views: {
            'main@invoices': {
                templateUrl: '/views/partials.invoices.overview',
                controller: 'InvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('invoices.incoming', {
        url: '/incoming',
        restricted: true,
        views: {
            'main@invoices': {
                templateUrl: '/views/partials.invoices.incoming',
                controller: 'InvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('invoices.outgoing', {
        url: '/outgoing',
        restricted: true,
        views: {
            'main@invoices': {
                templateUrl: '/views/partials.invoices.outgoing',
                controller: 'InvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('invoices.generate', {
        url: '/generate',
        restricted: true,
        views: {
            'main@invoices': {
                templateUrl: '/views/partials.invoices.generate',
                controller: 'GenerateInvoicesController as invoices'
            }
        }
    });
    $stateProvider.state('invoices.show', {
        url: '/:id',
        restricted: true,
        views: {
            'main@invoices': {
                templateUrl: '/views/partials.invoices.show',
                controller: 'InvoiceController as invoices'
            }
        }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJtb2R1bGVzL2FkbWluLmNsdWJzLm1vZHVsZS5qcyIsIm1vZHVsZXMvYWRtaW4uaW52b2ljZXMubW9kdWxlLmpzIiwibW9kdWxlcy9hZG1pbi5tb2R1bGUuanMiLCJtb2R1bGVzL2FkbWluLnNpZ251cHMubW9kdWxlLmpzIiwibW9kdWxlcy9hZG1pbi51c2Vycy5tb2R1bGUuanMiLCJtb2R1bGVzL2F1dGgubW9kdWxlLmpzIiwibW9kdWxlcy9jYWxlbmRhci5tb2R1bGUuanMiLCJtb2R1bGVzL2NoYW1waW9uc2hpcHMubW9kdWxlLmpzIiwibW9kdWxlcy9jbHVicy5pbnZvaWNlcy5tb2R1bGUuanMiLCJtb2R1bGVzL2NsdWJzLm1vZHVsZS5qcyIsIm1vZHVsZXMvY29tcGV0aXRpb25zLm1vZHVsZS5qcyIsIm1vZHVsZXMvZGFzaGJvYXJkLm1vZHVsZS5qcyIsIm1vZHVsZXMvZXJyb3JoYW5kbGluZy5tb2R1bGUuanMiLCJtb2R1bGVzL2ludm9pY2VzLm1vZHVsZS5qcyIsIm1vZHVsZXMvcHJlbWl1bS5tb2R1bGUuanMiLCJtb2R1bGVzL3NldHRpbmdzLm1vZHVsZS5qcyIsIm1vZHVsZXMvc2lnbnVwcy5tb2R1bGUuanMiLCJtb2R1bGVzL3RlYW1zLm1vZHVsZS5qcyIsIm1vZHVsZXMvdXNlcnMubW9kdWxlLmpzIiwiY29uZmlnL2Vycm9yaGFuZGxpbmcuY29uZmlnLmpzIiwiY29uZmlnL2ludGVyY2VwdG9ycy5qcyIsImRpcmVjdGl2ZXMvbmctZnVsbGNhbGVuZGFyLmpzIiwiZGlyZWN0aXZlcy9uZ0VudGVyLmpzIiwiZGlyZWN0aXZlcy9uZ0luZmluaXRlU2Nyb2xsLmpzIiwiZGlyZWN0aXZlcy9uZ1N0cmluZ1RvTnVtYmVyLmpzIiwiZmlsdGVycy9jdXRTdHJpbmcuZmlsdGVyLmpzIiwiZmlsdGVycy9kYXRlVG9Jc28uZmlsdGVyLmpzIiwiZmlsdGVycy9leGNsdWRlQnlJZHMuZmlsdGVyLmpzIiwiZmlsdGVycy9pc0VtcHR5LmZpbHRlci5qcyIsImZpbHRlcnMvbnVtLmZpbHRlci5qcyIsImZpbHRlcnMvcmFuZ2UuZmlsdGVyLmpzIiwiZmlsdGVycy9yZW5kZXJIVE1MQ29ycmVjdGx5LmZpbHRlci5qcyIsImZpbHRlcnMvc3VtQnlLZXkuZmlsdGVyLmpzIiwicm91dGluZy9hZG1pbi5jbHVicy5yb3V0aW5nLmpzIiwicm91dGluZy9hZG1pbi5yb3V0aW5nLmpzIiwicm91dGluZy9hZG1pbi5zaWdudXBzLnJvdXRpbmcuanMiLCJyb3V0aW5nL2FkbWluLnVzZXJzLnJvdXRpbmcuanMiLCJyb3V0aW5nL2F1dGgucm91dGluZy5qcyIsInJvdXRpbmcvY2hhbXBpb25zaGlwcy5yb3V0aW5nLmpzIiwicm91dGluZy9jbHVicy5yb3V0aW5nLmpzIiwicm91dGluZy9jb21wZXRpdGlvbnMucm91dGluZy5qcyIsInJvdXRpbmcvaW52b2ljZXMucm91dGluZy5qcyIsInJvdXRpbmcvcHJlbWl1bS5yb3V0aW5nLmpzIiwicm91dGluZy9yb3V0aW5nLmpzIiwicm91dGluZy9zZXR0aW5ncy5yb3V0aW5nLmpzIiwicm91dGluZy9zaWdudXAucm91dGluZy5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxJQUFBLE1BQUEsUUFBQSxPQUFBO0NBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7NkJBQ0EsU0FBQSxxQkFBQTtFQUNBLHFCQUFBLFlBQUE7RUFDQSxxQkFBQSxVQUFBOzs7QUFHQSxJQUFBLG9IQUFBLFNBQUEsWUFBQSxRQUFBLFVBQUEscUJBQUEsV0FBQSxhQUFBLFNBQUEsV0FBQTs7Q0FFQSxRQUFBLEdBQUEsVUFBQSxpQkFBQTs7Q0FFQSxXQUFBLElBQUEscUJBQUEsU0FBQSxHQUFBLElBQUE7RUFDQSxJQUFBLFFBQUEsYUFBQSxRQUFBOztFQUVBLFdBQUEsZUFBQSxHQUFBOztFQUVBLEdBQUEsVUFBQSxLQUFBO0dBQ0EsV0FBQSxnQkFBQTtHQUNBLElBQUEsT0FBQSxLQUFBLE1BQUEsYUFBQSxRQUFBO0dBQ0EsV0FBQSxjQUFBOzs7RUFHQSxHQUFBLENBQUEsR0FBQSxLQUFBLE1BQUEsS0FBQSxHQUFBLE1BQUEsV0FBQSxXQUFBLGNBQUE7R0FDQSxPQUFBLEdBQUEsYUFBQSxJQUFBLENBQUEsU0FBQTs7O0VBR0EsSUFBQSxHQUFBLFlBQUE7OztHQUdBLElBQUEsVUFBQSxNQUFBO0lBQ0EsRUFBQTtJQUNBLE9BQUEsR0FBQSxjQUFBLElBQUEsQ0FBQSxVQUFBOzs7Ozs7Ozs7R0FTQSxXQUFBLG9CQUFBO0lBQ0EsV0FBQTtJQUNBLGFBQUE7O0dBRUEsV0FBQSxvQkFBQTtJQUNBLGNBQUE7SUFDQSxZQUFBOzs7O0VBSUEsV0FBQSxlQUFBOzs7O0NBSUEsV0FBQSxJQUFBLHVCQUFBLFVBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxRQUFBLFlBQUEsVUFBQTs7Ozs7Ozs7Ozs7Q0FXQSxXQUFBLGFBQUEsU0FBQTtDQUNBOztFQUVBLFdBQUEsZ0JBQUE7RUFDQSxXQUFBLGtCQUFBOztFQUVBLEdBQUEsT0FBQSxhQUFBO0VBQ0E7R0FDQSxXQUFBLGNBQUEsS0FBQTs7O0VBR0E7R0FDQSxRQUFBLElBQUE7R0FDQSxHQUFBO0dBQ0E7SUFDQSxRQUFBLFFBQUEsVUFBQSxTQUFBLGFBQUE7S0FDQSxJQUFBLFVBQUEsQ0FBQSxPQUFBLGlCQUFBLFlBQUEsZUFBQSxhQUFBO0tBQ0EsV0FBQSxjQUFBLEtBQUE7OztJQUdBLFFBQUEsSUFBQSxXQUFBOztJQUVBLFNBQUEsVUFBQTtLQUNBLFdBQUEsZ0JBQUE7T0FDQTs7Ozs7O0NBTUEsV0FBQSx1QkFBQSxTQUFBLFVBQUE7Q0FDQTtFQUNBLFNBQUEsT0FBQSxXQUFBO0VBQ0EsV0FBQSxnQkFBQTtFQUNBLFdBQUEsa0JBQUE7O0VBRUEsR0FBQSxRQUFBLFNBQUEsV0FBQSxXQUFBLENBQUE7O0VBRUEsSUFBQSxtQkFBQSxDQUFBO0VBQ0EsSUFBQSxPQUFBLENBQUEsUUFBQSxhQUFBLGlCQUFBOztFQUVBLFFBQUEsUUFBQSxVQUFBLFNBQUEsUUFBQTs7R0FFQSxHQUFBLGlCQUFBLFFBQUEsV0FBQTtHQUNBO0lBQ0EsSUFBQSxPQUFBLENBQUEsT0FBQSxZQUFBLFlBQUEsVUFBQSxRQUFBO0lBQ0EsR0FBQSxRQUFBO0lBQ0E7S0FDQSxXQUFBLGNBQUEsS0FBQTs7O0lBR0E7S0FDQSxXQUFBLGdCQUFBLEtBQUE7Ozs7O0VBS0EsV0FBQSxvQkFBQSxTQUFBLFVBQUE7R0FDQSxXQUFBLGdCQUFBO0dBQ0EsV0FBQSxrQkFBQTtLQUNBOzs7Ozs7OztDQVFBLFdBQUEsY0FBQSxTQUFBLE9BQUE7Q0FDQTtFQUNBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7RUFDQSxHQUFBLE1BQUE7R0FDQTtLQUNBLFlBQUEsT0FBQTs7S0FFQSxLQUFBLFNBQUEsU0FBQTtLQUNBLEdBQUEsU0FBQSxRQUFBO01BQ0EsR0FBQSxTQUFBLFNBQUEsV0FBQSxxQkFBQSxDQUFBLFNBQUEsVUFBQTtZQUNBLEdBQUEsU0FBQSxLQUFBO01BQ0EsR0FBQSxTQUFBLEtBQUEsU0FBQSxXQUFBLHFCQUFBLENBQUEsU0FBQSxLQUFBLFVBQUE7Ozs7OztBQzVLQSxRQUFBLE9BQUEsbUJBQUE7O0tBRUEsV0FBQSxzRkFBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLGtCQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLEtBQUEsU0FBQTtRQUNBLFFBQUE7UUFDQSxvQkFBQTtRQUNBLHFCQUFBOzs7SUFHQSxLQUFBLHdCQUFBLFNBQUEsS0FBQTtRQUNBLEdBQUEsS0FBQSxPQUFBLHNCQUFBLEtBQUEsWUFBQTtZQUNBLE9BQUE7Y0FDQSxHQUFBLENBQUEsS0FBQSxPQUFBLG1CQUFBO1lBQ0EsT0FBQTs7O0lBR0EsS0FBQSx5QkFBQSxTQUFBLEtBQUE7UUFDQSxHQUFBLEtBQUEsT0FBQSx1QkFBQSxLQUFBLGFBQUE7WUFDQSxPQUFBO2NBQ0EsR0FBQSxDQUFBLEtBQUEs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QUFBLEtBQUEsR0FBQSxPQUFBLE1BQUE7WUFDQSxJQUFBLE1BQUEsT0FBQSxXQUFBOztZQUVBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O1FBSUEsTUFBQSxTQUFBLElBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7UUFJQSxZQUFBLFNBQUEsTUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7UUFJQSxZQUFBLFNBQUEsTUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQSxlQUFBLEtBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBOzs7O1FBSUEsWUFBQSxTQUFBLE1BQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUEsZUFBQSxLQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztRQUlBLGNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7UUFJQSxnQkFBQSxTQUFBLFNBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsWUFBQTs7OztRQUlBLFlBQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsQ0FBQSxnQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUEsS0FBQSxVQUFBLFFBQUEsS0FBQTs7OztRQUlBLGdCQUFBLFNBQUEsUUFBQTtZQUNBLE9BQUEsTUFB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S0FBQSxlQUFBLE9BQUEsYUFBQSxLQUFBOztHQUVBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7Ozs7O0FDcERBLFFBQUEsT0FBQSxtQkFBQTs7Q0FFQSxXQUFBLGtHQUFBLFNBQUEsWUFBQSxjQUFBLFFBQUEsbUJBQUEsU0FBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLE9BQUEsV0FBQTtFQUNBLFdBQUEsZUFBQTtFQUNBLElBQUEsT0FBQTtHQUNBLGNBQUEsYUFBQTtHQUNBLFVBQUEsYUFBQTtHQUNBLFFBQUEsYUFBQTtHQUNBLFFBQUEsYUFBQTs7RUFFQSxrQkFBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLFFBQUEsU0FBQTtJQUNBLFdBQUEsZUFBQTs7OztDQUlBLEtBQUEsYUFBQSxVQUFBO0VBQ0EsSUFBQSxPQUFBO0dBQ0EsUUFBQSxLQUFBLE1BQUE7R0FDQSxRQUFBLEtBQUEsTUFBQTtHQUNBLGNBQUEsS0FBQSxNQUFBO0dBQ0EsVUFBQSxLQUFBLE1BQUE7O0VBRUEsT0FBQSxHQUFBLHFCQUFBLE1BQUEsQ0FBQSxTQUFBOzs7Q0FHQSxLQUFBOzs7O0NBSUEsV0FBQSxrSUFBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLG1CQUFBLHNCQUFBLFdBQUEsS0FBQTtDQUNBLElBQUEsT0FBQTtDQUNBLFNBQUEsVUFBQTtFQUNBLFdBQUEsZUFBQTtFQUNBLEdBQUEsYUFBQSxRQUFBO0dBQ0Esa0JBQUEsS0FBQSxhQUFBO0tBQ0EsUUFBQSxTQUFBLFNBQUE7S0FDQSxLQUFBLE9BQUE7S0FDQSxXQUFBLGVBQUE7O0tBRUEsTUFBQSxTQUFBLFNBQUE7S0FDQSxXQUFBLHFCQUFBLFVBQUE7S0FDQSxLQUFBLE9BQUE7S0FDQSxXQUFBLGVBQUE7O09BRUE7R0FDQSxLQUFBLE9BQUE7R0FDQSxXQUFBLGVBQUE7OztDQUdBOztDQUVBLEtBQUEsV0FBQSxTQUFBLEtBQUE7RUFDQSxXQUFBLGVBQUE7RUFDQSxrQkFBQSxTQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBO0lBQ0EsT0FBQSxHQUFBLG9CQUFBLENBQUEsU0FBQSxLQUFBLFVBQUEsQ0FBQSxVQUFBOztJQUVBLE1BQUEsU0FBQSxTQUFBO0lBQ0EsV0FBQSxxQkFBQSxVQUFBOztJQUVBLFFBQUEsVUFBQTtJQUNBLFdBQUEsZUFBQTs7OztDQUlBLEtBQUEsYUFBQSxTQUFBLEtBQUE7RUFDQSxHQUFBLEtBQUEsY0FBQSxPQUFBO0VBQ0EsS0FBQSxlQUFBO0VBQ0Esa0JBQUEsV0FBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsV0FBQSxxQkFBQTtJQUNBLE9BQUEsR0FBQSxvQkFBQSxDQUFBLFNBQUEsU0FBQSxVQUFBLENBQUEsVUFBQTs7SUFFQSxNQUFBLFNBQUEsU0FBQTtJQUNBLFdBQUEscUJBQUEsVUFBQTs7SUFFQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsZUFBQTs7OztDQUlBLEtBQUEsa0JBQUEsU0FBQSxRQUFBO0VBQ0EscUJBQUEsU0FBQSxRQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxJQUFBLE9BQUEsSUFBQSxLQUFBLENBQUEsV0FBQSxDQUFBLE1BQUE7SUFDQSxHQUFBLEtBQUEsTUFBQTtLQUNBLFVBQUEsT0FBQSxNQUFBLGFBQUEsUUFBQSxvQkFBQTs7Ozs7Ozs7Q0FRQSxRQUFBLGlEQUFBLFNBQUEsT0FBQSxlQUFBOztDQUVBLE9BQUE7RUFDQSxNQUFBLFVBQUEsTUFBQTs7R0FFQSxJQUFBLE1BQUEsZUFBQTtHQUNBLGVBQUEsQ0FBQSxLQUFBLGdCQUFBLEtBQUEsZUFBQTs7R0FFQSxPQUFBLFdBQUE7R0FDQSxJQUFBLEtBQUEsUUFBQSxPQUFBLGFBQUEsS0FBQTtHQUNBLElBQUEsS0FBQSxVQUFBLE9BQUEsZUFBQSxLQUFBO0dBQ0EsSUFBQSxLQUFBLFFBQUEsT0FBQSxhQUFBLEtBQUE7O0dBRUEsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7RUFJQSxNQUFBLFNBQUEsSUFBQTtH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QUFBO09BQ0EsTUFBQTtPQUNBLEtBQUE7O0dBRUEsaUJBQUE7R0FDQSxZQUFBO0dBQ0EsWUFBQTtHQUNBLFNBQUE7R0FDQSxTQUFBO0dBQ0EsWUFBQTtHQUNBLGFBQUE7U0FDQSxRQUFBO1NBQ0EsVUFBQTtTQUNBLFlBQUEsU0FBQSxNQUFBLFNBQUE7SUFDQSxJQUFBLFFBQUEsS0FBQSxNQUFBLEtBQUEsTUFBQTtJQUNBLElBQUEsTUFBQSxLQUFBLE1BQUEsS0FBQSxJQUFBO0lBQ0EsT0FBQSxpQkFBQSxDQUFBO2NBQ0EsS0FBQSxlQUFBLGtCQUFBLE1BQUEsUUFBQTs7O0dBR0EsWUFBQSxPQUFBO1NBQ0EsV0FBQSxPQUFBO1NBQ0EsYUFBQSxTQUFBLE1BQUEsU0FBQTtVQUNBLFFBQUEsSUFBQTs7Ozs7S0FLQSxPQUFBLGFBQUEsU0FBQSxLQUFBLFVBQUE7T0FDQSxTQUFBLGFBQUEsYUFBQTs7O0tBR0EsT0FBQSxpQkFBQSxTQUFBLFVBQUE7UUFDQSxTQUFBLFVBQUE7U0FDQSxRQUFBLElBQUE7SUFDQSxHQUFBLFNBQUE7SUFDQSxTQUFBLGFBQUE7O1dBRUE7Ozs7Q0FJQTs7O0FDL0VBLFFBQUEsT0FBQSxxQkFBQTs7Q0FFQSxXQUFBLHNHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxxQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLFdBQUEsTUFBQTtRQUNBLHFCQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGdCQUFBLFNBQUE7OztJQUdBLFNBQUEsV0FBQTs7SUFFQSxLQUFBLE9BQUEsU0FBQSxhQUFBLE1BQUE7SUFDQSxLQUFBLE9BQUEsYUFBQTtJQUNBLEtBQUEsY0FBQSxDQUFBLFdBQUEsUUFBQTtJQUNBO0lBQ0E7Ozs7Q0FJQSxXQUFBLHFHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxzQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLE1BQUE7UUFDQSxxQkFBQSxLQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGdC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RUFDQSxhQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGdCQUFBO0lBQ0EsR0FBQSxDQUFBLFNBQUEsR0FBQTtLQUNBLE9BQUEsR0FBQSxnQkFBQSxJQUFBLENBQUEsU0FBQTs7SUFFQSxLQUFBLE9BQUE7SUFDQSxXQUFBLGVBQUE7Ozs7Q0FJQSxLQUFBLGFBQUEsVUFBQTtFQUNBLGFBQUEsV0FBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxPQUFBLEdBQUEsb0JBQUEsSUFBQSxDQUFBLFNBQUE7O0lBRUEsTUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFVBQUE7Ozs7Q0FJQSxLQUFBLGlCQUFBLFNBQUE7Q0FDQTtFQUNBLEdBQUEsTUFBQTtHQUNBLGFBQUEsZUFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBLEtBQUEsb0JBQUEsU0FBQTtDQUNBO0VBQ0EsR0FBQSxNQUFBO0dBQ0EsYUFBQSxrQkFBQTtLQUNBLFFBQUEsVUFBQTtLQUNBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxTQUFBOzs7OztDQUtBOzs7Q0FHQSxXQUFBLDRFQUFBLFNBQUEsWUFBQSxRQUFBLFFBQUEsY0FBQTtDQUNBLElBQUEsT0FBQTs7Q0FFQSxLQUFBLGNBQUE7Q0FDQSxLQUFBLGVBQUE7Q0FDQSxLQUFBLFdBQUE7Q0FDQSxLQUFBLGVBQUE7Q0FDQSxLQUFBLGFBQUE7O0NBRUEsU0FBQSxlQUFBO0VBQ0EsV0FBQSxlQUFBO0VBQ0EsYUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsS0FBQSxnQkFBQTtJQUNBLEdBQUEsU0FBQSxHQUFBO0tBQ0EsT0FBQSxHQUFBLG9CQUFBLElBQUEsQ0FBQSxTQUFBOztJQUVBLEtBQUEsT0FBQTtJQUNBLFdBQUEsZUFBQTs7Ozs7Q0FLQSxLQUFBLGlCQUFBLFNBQUEsYUFBQTtDQUNBO0VBQ0EsT0FBQTtJQUNBLGVBQUE7SUFDQSxNQUFBLFNBQUEsU0FBQTtJQUNBLFdBQUEscUJBQUEsVUFBQTs7SUFFQSxLQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsY0FBQSxTQUFBLEtBQUEsTUFBQSxTQUFBO0lBQ0EsT0FBQSxTQUFBLEtBQUEsTUFBQSxJQUFBLFNBQUEsS0FBQTtLQUNBLEtBQUEsa0JBQUE7S0FDQSxHQUFBLEtBQUEsTUFBQSxLQUFBLElBQUEsS0FBQSxrQkFBQTtLQUNBLE9BQUE7Ozs7O0NBS0EsS0FBQSxhQUFBLFNBQUE7Q0FDQTtFQUNBLEdBQUEsTUFBQSxvQkFBQSxNQUFBLE9BQUE7RUFDQSxLQUFBLGtCQUFBO0VBQ0EsS0FBQSxXQUFBOzs7Q0FHQSxLQUFBLGVBQUE7Q0FDQTtFQUNBLEtBQUEsa0JBQUE7RUFDQSxLQUFBLFdBQUE7OztDQUdBLEtBQUEsaUJBQUEsU0FBQTtDQUNBO0VBQ0EsYUFBQSxlQUFBLEtBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsV0FBQTtJQUNBLEtBQUEsYUFBQTtJQUNBLEtBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxvQkFBQSxJQUFBLENBQUEsVUFBQTs7OztDQUlBLEtBQUEsYUFBQTtDQUNBO0VBQ0EsR0FBQSxDQUFBLEtBQUEsZUFBQSxDQUFBLEtBQUEsY0FBQSxPQUFBO0VBQ0EsSUFBQSxPQUFBO0dBQ0EsTUFBQSxLQUFBO0dBQ0EsVUFBQSxLQUFBOzs7RUFHQSxhQUFBLFdBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsY0FBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLEtBQUEsV0FBQTtJQUNBLEtBQUEsYUFBQTtJQUNBLEtBQUEsT0FBQTtJQUNBLE9BQUEsR0FBQSxvQkFBQSxJQUFBLENBQUEsVUFBQTs7OztDQUlBOzs7O0NBSUEsUUFBQSw0Q0FBQSxTQUFBLE9BQUEsZUFBQTs7Q0FFQSxPQUFBO0VBQ0EsTUFBQSxVQUFBLE1BQUEsSUFBQTtHQUNBLElBQUEsTUFBQSxlQUFBOztHQUVBLElBQUEsQ0FBQSxRQUFBLFlBQUEsT0FBQSxLQUFBLEdBQUEsT0FBQSxNQUFBO0dBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQTs7R0FFQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztFQUlBLE1BQUEsU0FBQSxJQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQSxTQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O0VBSUEsWUFBQSxTQUFBLE1BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7RUFJQSxZQUFBLFNBQUEsTUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQTs7OztFQUlBLFlBQUEsU0FBQSxNQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQSxTQUFBLEtBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7RUFJQSxjQUFBLFVBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O0VBSUEsZ0JBQUEsU0FBQSxTQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsWUFBQTs7OztFQUlBLFlBQUEsU0FBQSxLQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsWUFBQSxLQUFBLFVBQUEsUUFBQSxLQUFBOzs7O0VBSUEsZ0JBQUEsU0FBQSxRQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsZUFBQTs7OztFQUlBLGdCQUFBLFNBQUEsT0FBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFNBQUE7Ozs7RUFJQSxtQkFBQSxTQUFBLE9BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBOzs7OztBQzlQQSxRQUFBLE9BQUEsb0JBQUE7O0NBRUEsV0FBQSxvR0FBQSxTQUFBLFlBQUEsUUFBQSxjQUFBLFFBQUEsb0JBQUE7SUFDQSxJQUFBLE9BQUE7O0lBRUEsU0FBQSxXQUFBLE1BQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxvQkFBQSxLQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxlQUFBLFNBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7SUFHQSxTQUFBLFdBQUE7O0lBRUEsS0FBQSxPQUFBLFNBQUEsYUFBQSxNQUFBO0lBQ0EsS0FBQSxPQUFBLGFBQUE7SUFDQSxLQUFBLGNBQUEsQ0FBQSxXQUFBLFFBQUE7SUFDQTtJQUNBOzs7SUFHQSxLQUFBLFdBQUEsV0FBQTtRQUNBLEtBQUE7UUFDQSxXQUFBLEtBQUE7UUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7SUFFQSxLQUFBLFdBQUEsV0FBQTtRQUNBLElBQUEsS0FBQSxPQUFBLEdBQUE7WUFDQSxLQUFBO1lBQ0EsV0FBQSxLQUFBO1lBQ0EsT0FBQSxHQUFBLEtBQUEsQ0FBQSxNQUFBLEtBQUEsT0FBQSxDQUFBLFFBQUE7OztJQUdBLEtBQUEsY0FBQSxXQUFBO1FBQ0E7UUFDQSxPQUFBLEdBQUEsS0FBQSxDQUFBLE1BQUEsS0FBQSxPQUFBLENBQUEsUUFBQTs7O0NBR0EsV0FBQSxpSUFBQSxTQUFBLFlBQUEsUUFBQSxjQUFBLFFBQUEsVUFBQSxxQkFBQSxlQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsTUFBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLG9CQUFBLEtBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsZUFBQSxTQUFBO2dCQUNBLEtBQUEsT0FBQSxLQUFBLE1BQUEsYUFBQSxRQUFBO2dCQUNBLFdBQUEsZUFBQTs7YUFFQSxNQUFBLFVBQUE7Z0JBQ0EsT0FBQSxHQUFBLGdCQUFBLElBQUEsQ0FBQSxTQUFBO2dCQUNBLFdBQUEsZUFBQTs7OztJQUlBLEtBQUEsZUFBQSxTQUFBLGlCQUFBO1FBQ0EsR0FBQSxLQUFBLGNBQUEsT0FBQTtRQUNBLEtBQUEsZUFBQTtRQUNBLElBQUEsU0FBQTtZQUNBLG1CQUFBLEtBQUEsYUFBQTtZQUNBLG9CQUFBO1lBQ0EsWUFBQSxLQUFBLEtBQUE7O1FBRUEsZUFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsU0FBQSxtQkFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxhQUFBLFlBQUEsS0FBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7O2FBRUEsUUFBQSxVQUFBO2dCQUNBLEtBQUEsZUFBQTs7OztJQUlBLEtBQUEsZUFBQSxTQUFBLE9BQUE7UUFDQSxlQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTs7O2dCQUdBLFFBQUEsUUFBQSxLQUFBLGFBQUEsYUFBQSxTQUFBLFNBQUEsTUFBQTtvQkFDQSxHQUFBLFFBQUEsTUFBQSxPQUFBO29CQUNBO3dCQUNBLEtBQUEsYUFBQSxZQUFBLE9BQUEsT0FBQTs7Ozs7O0lBTUE7OztDQUdBLFFBQUEsbURBQUEsU0FBQSxPQUFBLGdCQUFBOztJQUVBLE9BQUE7UUFDQSxNQUFBLFVBQUEsTUFBQSxJQUFBO1lBQ0EsSUFBQSxNQUFBLGVBQUE7O1lBRUEsSUFBQSxDQUFBLFFBQUEsWUFBQSxPQUFBLEtBQUEsR0FBQSxPQUFBLE1BQUE7WUFDQSxJQUFBLE1BQUEsT0FBQSxXQUFBOztZQUVBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O1FBSUEsTUFBQSxTQUFBLElBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUEsZ0JBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7Ozs7QUNsSEEsUUFBQSxPQUFBLGlCQUFBOztLQUVBLFdBQUEsNERBQUEsU0FBQSxZQUFBLFFBQUEsU0FBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLE9BQUEsSUFBQSxzQkFBQSxXQUFBO1lBQ0EsU0FBQSxVQUFBO2dCQUNBLENBQUEsU0FBQSxHQUFBLEdBQUEsSUFBQTtvQkFDQSxLQUFBO29CQUNBLElBQUEsSUFBQSxNQUFBLEVBQUEscUJBQUEsR0FBQTs7b0JBRUEsS0FBQSxFQUFBLGNBQUEsSUFBQSxHQUFBLEtBQUE7b0JBQ0EsR0FBQSxNQUFBO29CQUNBLElBQUEsV0FBQSxhQUFBLElBQUE7a0JBQ0EsVUFBQSxVQUFBO2dCQUNBLFdBQUEsZUFBQTtlQUNBOzs7Ozs7QUNmQSxRQUFBLE9BQUEsb0JBQUE7O0VBRUEsV0FBQSwwRUFBQSxTQUFBLFlBQUEsUUFBQSxvQkFBQTs7OztFQUlBLFFBQUEsbURBQUEsU0FBQSxPQUFBLGVBQUE7O0VBRUEsT0FBQTs7R0FFQSxhQUFBLFNBQUEsT0FBQSxPQUFBO0lBQ0EsT0FBQSxNQUFBO0tBQ0EsUUFBQTtLQUNBLEtBQUEsZUFBQTtLQUNBLFNBQUEsRUFBQSxpQkFBQTtLQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsT0FBQSxPQUFBLE9BQUE7Ozs7Ozs7O0FDZkEsUUFBQSxPQUFBLGdCQUFBOztDQUVBLFdBQUEsMEZBQUEsU0FBQSxZQUFBLGNBQUEsUUFBQSxpQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLGNBQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxnQkFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsVUFBQSxTQUFBO2dCQUNBLEtBQUEsY0FBQTtnQkFDQSxXQUFBLGVBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBO2dCQUNBLFdBQUEsZUFBQTs7OztJQUlBLEtBQUEsZ0JBQUEsVUFBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLGdCQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Z0JBQ0EsT0FBQSxHQUFBO2dCQUNBLFdBQUEsZUFBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7O0lBSUE7O0NBRUEsV0FBQSxvSEFBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLGlCQUFBLFdBQUEsV0FBQSxNQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsY0FBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLGdCQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxvQkFBQSxTQUFBO2dCQUNBLEtBQUEsb0JBQUEsU0FBQTtnQkFDQSxLQUFBLG9CQUFBLFNBQUE7Z0JBQ0EsS0FBQSxjQUFBO2dCQUNBLFdBQUEsZUFBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7O0lBSUEsS0FBQSxtQkFBQSxTQUFBLFFBQUE7O1FBRUEsSUFBQSxnQkFBQSxVQUFBLEtBQUE7WUFDQSxXQUFBO1lBQ0EsYUFBQTtZQUNBLFlBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsT0FBQTs7Ozs7UUFLQSxjQUFBLE9BQUEsS0FBQSxZQUFBO1lBQ0E7Ozs7SUFJQSxLQUFBLFdBQUEsU0FBQSxRQUFBO1FBQ0EsZ0JBQUEsU0FBQSxRQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsSUFBQSxPQUFBLElBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBO2dCQUNBLEdBQUEsS0FBQSxNQUFBO29CQUNBLFVBQUEsT0FBQSxNQUFBLGFBQUEsUUFBQSxvQkFBQTs7Ozs7SUFLQTs7Q0FFQSxXQUFBLHNHQUFBLFNBQUEs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LFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsVUFBQSxTQUFBO2dCQUNBLEtBQUEsb0JBQUEsU0FBQTtnQkFDQSxXQUFBLGVBQUE7OztJQUdBLFNBQUEsV0FBQTs7SUFFQSxLQUFBLE9BQUEsU0FBQSxhQUFBLE1BQUE7SUFDQSxLQUFBLE9BQUEsYUFBQTtJQUNBLEtBQUEsY0FBQSxDQUFBLFdBQUEsUUFBQTtJQUNBO0lBQ0E7O0NBRUEsV0FBQSxxR0FBQSxTQUFBLFlBQUEsUUFBQSxjQUFBLFFBQUEsVUFBQSxnQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLE1BQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxlQUFBLEtBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsVUFBQSxTQUFBO2dCQUNBLEtBQUEsT0FBQSxLQUFBLE1BQUEsYUFBQSxRQUFBO2dCQUNBLFdBQUEsZUFBQTs7YUFFQSxNQUFBLFVBQUE7Z0JBQ0EsV0FBQSxlQUFBO2dCQUNBLE9BQUEsR0FBQSxXQUFBLElBQUEsQ0FBQSxTQUFBOzs7O0lBSUEsS0FBQSxlQUFBLFNBQUEsT0FBQTtRQUNBLEtBQUEsUUFBQTtRQUNBLGVBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLFdBQUEscUJBQUEsU0FBQTtnQkFDQSxTQUFBLFFBQUEsaUNBQUEsU0FBQSxTQUFBLFFBQUE7Z0JBQ0EsU0FBQSxRQUFBLG1CQUFBLFNBQUEsU0FBQSxRQUFBO2dCQUNBLEtBQUEsUUFBQSxVQUFBLFNBQUE7Z0JBQ0EsS0FBQSxRQUFBO2dCQUNBLE9BQUEsR0FBQSxXQUFBLENBQUEsSUFBQSxPQUFBOzthQUVBLE1BQUEsU0FBQSxTQUFBO2dCQUNBLFdBQUEscUJBQUEsU0FBQSxTQUFBOzs7O0lBSUEsS0FBQSxlQUFBLFNBQUEsT0FBQTtRQUNBLGVBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLE9BQUEsR0FBQTs7Ozs7O0lBTUE7O0NBRUEsV0FBQSx5R0FBQSxTQUFBLFlBQUEsUUFBQSxjQUFBLFFBQUEsVUFBQSxn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QUEsT0FBQSxFQUFBLFNBQUEsT0FBQSxFQUFBLE9BQUEsT0FBQSxDQUFBLEVBQUEsU0FBQSxPQUFBLENBQUEsRUFBQSxPQUFBO1dBQ0EsRUFBQSxVQUFBLE9BQUEsRUFBQSxhQUFBLE1BQUEsb0JBQUEsTUFBQTs7O01BR0EsS0FBQSxxQkFBQSxTQUFBLFFBQUE7VUFDQSxPQUFBLE9BQUEsU0FBQSxPQUFBLE9BQUE7OztNQUdBLEtBQUEsWUFBQSxXQUFBOztRQUVBLElBQUEsZUFBQTtRQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsU0FBQSxRQUFBLFFBQUEsSUFBQSxRQUFBLEtBQUE7VUFDQSxJQUFBLFNBQUEsUUFBQTtVQUNBLElBQUEsUUFBQSxRQUFBLFNBQUE7O1lBRUEsYUFBQSxLQUFBO2lCQUNBLEdBQUEsUUFBQSxTQUFBLFdBQUEsUUFBQSxRQUFBLE9BQUEsUUFBQTs7WUFFQSxJQUFBLFdBQUE7WUFDQSxJQUFBLElBQUEsT0FBQSxPQUFBO2NBQ0EsR0FBQSxRQUFBLGNBQUEsUUFBQSxTQUFBO2lCQUNBLFNBQUEsT0FBQSxPQUFBOzs7WUFHQSxJQUFBLElBQUEsS0FBQSxFQUFBLEtBQUEsT0FBQSxPQUFBLE9BQUEsS0FBQTtjQUNBLFFBQUEsT0FBQSxPQUFBLE9BQUEsSUFBQTs7WUFFQSxhQUFBLEtBQUEsT0FBQTs7OztRQUlBLE9BQUEsTUFBQSxVQUFBLE9BQUEsTUFBQSxJQUFBOzs7Ozs7O01BT0EsS0FBQSxnQkFBQSxTQUFBLGFBQUEsU0FBQTtRQUNBLElBQUE7UUFDQSxJQUFBLFlBQUEsV0FBQTtVQUNBLElBQUEsUUFBQSxRQUFBLFdBQUEsZUFBQSxnQkFBQTtVQUNBLElBQUEsU0FBQSxJQUFBLE9BQUE7VUFDQSxLQUFBLElBQUEsSUFBQSxHQUFBLElBQUEsTUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO1lBQ0EsS0FBQSxNQUFBO1lBQ0EsUUFBQSxRQUFBO1lBQ0EsSUFBQSxTQUFBO1lBQ0EsT0FBQSxLQUFBOztVQUVBLE9BQUE7Ozs7UUFJQSxJQUFBLGlCQUFBLFNBQUEsR0FBQSxHQUFBO1VB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U0FBQSxPQUFBLFNBQUEsT0FBQTtRQUNBLFFBQUEsS0FBQSxvQkFBQSxTQUFBLE9BQUE7WUFDQSxHQUFBLENBQUEsTUFBQSxVQUFBLENBQUEsTUFBQSxZQUFBLENBQUEsTUFBQSxXQUFBLE1BQUEsVUFBQSxJQUFBO2dCQUNBLE1BQUEsT0FBQSxVQUFBO29CQUNBLE1BQUEsTUFBQSxNQUFBLFNBQUEsQ0FBQSxTQUFBOzs7Z0JBR0EsTUFBQTs7Ozs7QUNSQSxJQUFBLFVBQUEsZ0NBQUEsU0FBQSxTQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsUUFBQSxRQUFBLFNBQUEsS0FBQSxVQUFBLFdBQUE7TUFDQSxJQUFBLGdCQUFBLGlCQUFBLFNBQUEsT0FBQSxjQUFBLFNBQUEsZ0JBQUE7TUFDQSxJQUFBLFVBQUEsU0FBQSxNQUFBLE9BQUEsU0FBQTtNQUNBLElBQUEsY0FBQSxLQUFBLElBQUEsS0FBQSxjQUFBLEtBQUEsY0FBQSxLQUFBLGVBQUEsS0FBQSxjQUFBLEtBQUE7TUFDQSxpQkFBQSxlQUFBLE9BQUE7O01BRUEsSUFBQSxnQkFBQSxXQUFBOztPQUVBLE1BQUEsU0FBQSxNQUFBLFNBQUEsTUFBQTtVQUNBLE1BQUE7Ozs7O0FDWEEsSUFBQSxVQUFBLGtCQUFBLFdBQUE7RUFDQSxPQUFBO0lBQ0EsU0FBQTtJQUNBLE1BQUEsU0FBQSxPQUFBLFNBQUEsT0FBQSxTQUFBO01BQ0EsUUFBQSxTQUFBLEtBQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxLQUFBOztNQUVBLFFBQUEsWUFBQSxLQUFBLFNBQUEsT0FBQTtRQUNBLE9BQUEsV0FBQSxPQUFBOzs7OztBQ1JBLElBQUEsT0FBQSxhQUFBLFlBQUE7SUFDQSxPQUFBLFVBQUEsT0FBQSxVQUFBLEtBQUEsTUFBQTtRQUNBLElBQUEsQ0FBQSxPQUFBLE9BQUE7O1FBRUEsTUFBQSxTQUFBLEtBQUE7UUFDQSxJQUFBLENBQUEsS0FBQSxPQUFBO1FBQ0EsSUFBQSxNQUFBLFVBQUEsS0FBQSxPQUFBOztRQUVBLFFBQUEsTUFBQSxPQUFBLEdBQUE7UUFDQSxJQUFBLFVBQUE7WUFDQSxJQUFBLFlBQUEsTUFBQSxZQUFBO1lBQ0EsSUFBQSxhQUFBLENBQUEsR0FBQTtnQkFDQSxRQUFBLE1BQUEsT0FBQSxHQUFBOzs7O1FBSUEsT0FBQSxTQUFBLFFBQUE7Ozs7QUNoQkEsSUFBQSxPQUFBLGFBQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsR0FBQSxVQUFBLGFBQUEsVUFBQSxLQUFBO1lBQ0EsSUFBQSxJQUFBLE1BQUEsTUFBQTtZQUNBLElBQUEsRUFBQSxJQUFBLE1BQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUE7WUFDQSxPQUFBLElBQUEsS0FBQSxHQUFBOzs7O0FDTEEsSUFBQSxPQUFBLGdCQUFBLFlBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQSxjQUFBO1FBQ0EsSUFBQSxTQUFBO1FBQ0EsUUFBQSxRQUFBLFFBQUEsVUFBQSxPQUFBO1lBQ0EsSUFBQSxhQUFBLFFBQUEsTUFBQSxPQUFBLENBQUE7Z0JBQ0EsT0FBQSxLQUFBOztRQUVBLE9BQUE7OztBQ1BBLElBQUEsT0FBQSxXQUFBLENBQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxRQUFBO1FBQ0EsT0FBQSxRQUFBLE9BQUEsSUFBQTs7O0FDRkEsSUFBQSxPQUFBLE9BQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxTQUFBLE9BQUE7OztBQ0ZBLElBQUEsT0FBQSxTQUFBLFdBQUE7SUFDQSxPQUFBLFNBQUEsT0FBQSxPQUFBLEtBQUE7UUFDQSxRQUFBLFNBQUE7UUFDQSxNQUFBLFNBQUE7UUFDQSxJQUFBO1FBQ0EsR0FBQSxRQUFBLElBQUE7WUFDQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Z0JBQ0EsTUFBQSxLQUFBO2FBQ0E7WUFDQSxLQUFBLEVBQUEsT0FBQSxFQUFBLEtBQUE7Z0JBQ0EsTUFBQSxLQUFBOztRQUVBLE9BQUE7OztBQ1pBLElBQUEsT0FBQSxnQ0FBQSxTQUFBO0FBQ0E7SUFDQSxPQUFBLFNBQUE7SUFDQTtRQUNBLE9BQUEsS0FBQSxZQUFBOzs7O0FDSkEsSUFBQSxPQUFBLFlBQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxNQUFBLEtBQUE7UUFDQSxJQUFBLE9BQUEsVUFBQSxlQUFBLE9BQUEsU0FBQSxhQUFBO1lBQ0EsT0FBQTs7O1FBR0EsSUFBQSxNQUFBO1FBQ0EsS0FBQSxJQUFBLElBQUEsS0FBQSxTQUFBLEdBQUEsS0FBQSxHQUFBLEtBQUE7WUFDQSxPQUFBLFNBQUEsS0FBQSxHQUFBOzs7UUFHQSxPQUFBOzs7QUNYQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7SUFDQSxlQUFBLE1BQUEsZUFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsZUFBQSxNQUFBLG9CQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsMEJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsMkJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsNkJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsNEJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsMEJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsc0NBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSx5QkFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLHNDQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EseUJBQUE7Z0JBQ0EsYUFBQTs7OztJQUlBLGVBQUEsTUFBQSwwQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFFBQUE7Z0JBQ0EsYUFBQTs7Ozs7QUN6RkEsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOztJQUVBLGVBQUEsTUFBQSxTQUFBO1FBQ0EsS0FBQTtRQUNBLFFBQUE7UUFDQSxVQUFBO1FBQ0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLG1CQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7O0lBS0EsZUFBQSxNQUFBLGtCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsdUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7QUNwQ0EsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOztJQUVBLGVBQUEsTUFBQSxpQkFBQTtRQUNBLFVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTs7SUFFQSxlQUFBLE1BQUEsdUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7O1FBR0EsUUFBQTtZQUNBLGNBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBOztZQUVBLFVBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBOztZQUVBLFFBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBOztZQUVBLGlCQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7Ozs7QUMvQkEsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOztJQUVBLGVBQUEsTUFBQSxlQUFBO1FBQ0EsVUFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBOztJQUVBLGVBQUEsTUFBQSxxQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7UUFHQSxRQUFBO1lBQ0EsY0FBQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7O1lBRUEsVUFBQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7O1lBRUEsUUFBQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7O1lBRUEsUUFBQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEseUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsNEJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsNkJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsb0JBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7QUNwRUEsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOzs7O0NBSUEsZUFBQSxNQUFBLFFBQUE7RUFDQSxLQUFBO0VBQ0EsUUFBQTtFQUNBLFVBQUE7RUFDQSxPQUFBO0dBQ0EsWUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBOzs7O0NBSUEsbUJBQUEsS0FBQSxTQUFBO0NBQ0EsZUFBQSxNQUFBLGlCQUFBO0VBQ0EsS0FBQTtFQUNBLGFBQUE7O0NBRUEsZUFBQSxNQUFBLGVBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTtFQUNBLFlBQUE7O0NBRUEsZUFBQSxNQUFBLGlCQUFBO0VBQ0EsS0FBQTtFQUNBLGFBQUE7O0NBRUEsZUFBQSxNQUFBLGlCQUFBO0VBQ0EsS0FBQTtFQUNBLGFBQUE7RUFDQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxjQUFBO0VBQ0EsS0FBQTtFQUNBLGFBQUE7O0NBRUEsZUFBQSxNQUFBLGlCQUFBO0VBQ0EsS0FBQTtFQUNBLGFBQUE7O0NBRUEsZUFBQSxNQUFBLGNBQUE7RUFDQSxLQUFBO0VBQ0EsYUFBQTtFQUNBLG9FQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsWUFBQTtHQUNBLE9BQUEsUUFBQSxDQUFBLE9BQUEsSUFBQSxPQUFBLGFBQUE7O0dBRUEsT0FBQSxnQkFBQTtHQUNBOztJQUVBO01BQ0EsY0FBQSxPQUFBO01BQ0EsUUFBQSxTQUFBLFNBQUE7TUFDQSxPQUFBLG9CQUFBO01BQ0EsT0FBQSxRQUFBLENBQUEsT0FBQSxJQUFBLE9BQUEsYUFBQTs7TUFFQSxNQUFBLFNBQUEsU0FBQTtNQUNBLFdBQUEscUJBQUEsVUFBQTtNQUNBLE9BQUEsb0JBQUE7O01BRUEsS0FBQSxTQUFBLFNBQUE7TUFDQSxHQUFBLFNBQUEsS0FBQSxXQUFBO01BQ0E7T0FDQSxPQUFBLG9CQUFBOzs7Ozs7Q0FNQSxlQUFBLE1BQUEsZUFBQTtFQUNBLEtBQUE7RUFDQSw0QkFBQSxTQUFBLFlBQUE7R0FDQSxZQUFBOztFQUVBLFlBQUE7Ozs7QUMzRUEsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOzs7Q0FHQSxlQUFBLE1BQUEsaUJBQUE7RUFDQSxLQUFBO0VBQ0EsUUFBQTtFQUNBLE1BQUE7R0FDQSxZQUFBO0lBQ0EsYUFBQTtJQUNBLFlBQUE7SUFDQSxjQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxnQkFBQTtFQUNBLEtBQUE7RUFDQSxRQUFBO0VBQ0EsT0FBQTtHQUNBLFlBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7OztFQUdBLFlBQUE7O0NBRUEsZUFBQSxNQUFBLHFCQUFBO0VBQ0EsS0FBQTtFQUNBLE9BQUE7R0FDQSxRQUFBO0lBQ0EsYUFBQSxTQUFBLGFBQUE7S0FDQSxPQUFBLHNDQUFBLGFBQUE7O0lBRUEsMkNBQUEsU0FBQSxZQUFBLGFBQUE7S0FDQSxXQUFBLGNBQUEsYUFBQTs7OztFQUlBLFlBQUE7OztBQ3ZDQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7O0lBRUEsZUFBQSxNQUFBLFFBQUE7UUFDQSxLQUFBO1FBQ0EsUUFBQTtRQUNBLFVBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxnQkFBQTtRQUNBLEtBQUE7UUFDQSxRQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsY0FBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxvQkFBQTtRQUNBLEtBQUE7UUFDQSxPQUFBO1lBQ0EsT0FBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7OztRQUdBLFlBQUE7OztJQUdBLGVBQUEsTUFBQSxhQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7O1FBR0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLGVBQUE7UUFDQSxLQUFBO1FBQ0EsT0FBQTtZQUNBLE9BQUE7Z0JBQ0EsYUFBQTs7O1FBR0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLGdCQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7SUFLQSxlQUFBLE1BQUEsY0FBQTtRQUNBLFVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTs7SUFFQSxlQUFBLE1BQUEsb0JBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxhQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7SUFLQSxlQUFBLE1BQUEsbUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxhQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxxQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGFBQUE7Z0JBQ0EsYUFBQTtn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O0VBQ0EsT0FBQTtHQUNBLFlBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7OztFQUdBLFlBQUE7OztJQUdBIiwiZmlsZSI6ImFwcC5qcyIsInNvdXJjZXNDb250ZW50IjpbInZhciBhcHAgPSBhbmd1bGFyLm1vZHVsZSgnYXBwJyxcblx0W1xuXHRcdCdhbmd1bGFyLWp3dCcsXG5cdFx0J2FuZ3VsYXIuZmlsdGVyJyxcblx0XHQndWkucm91dGVyJyxcblx0XHQndWkuY2FsZW5kYXInLFxuXHRcdCd1aS5ib290c3RyYXAnLFxuXHRcdCd1aS5ib290c3RyYXAuZGF0ZXRpbWVwaWNrZXInLFxuXHRcdCd1aS5zb3J0YWJsZScsXG5cdFx0J25nRmlsZVNhdmVyJyxcblx0XHQnYXBwLmF1dGgnLFxuXHRcdCdhcHAuYWRtaW4nLFxuXHRcdCdhcHAuYWRtaW4uY2x1YnMnLFxuXHRcdCdhcHAuYWRtaW4uaW52b2ljZXMnLFxuXHRcdCdhcHAuYWRtaW4uc2lnbnVwcycsXG5cdFx0J2FwcC5hZG1pbi51c2VycycsXG5cdFx0J2FwcC5jYWxlbmRhcicsXG5cdFx0J2FwcC5jaGFtcGlvbnNoaXBzJyxcblx0XHQnYXBwLmNsdWJzJyxcblx0XHQnYXBwLmNsdWJzLmludm9pY2VzJyxcblx0XHQnYXBwLmNvbXBldGl0aW9ucycsXG5cdFx0J2FwcC5kYXNoYm9hcmQnLFxuXHRcdCdhcHAuZXJyb3JoYW5kbGVyJyxcblx0XHQnYXBwLmludm9pY2VzJyxcblx0XHQnYXBwLnByZW1pdW0nLFxuXHRcdCdhcHAuc2V0dGluZ3MnLFxuXHRcdCdhcHAuc2lnbnVwcycsXG5cdFx0J2FwcC50ZWFtcycsXG5cdFx0J2FwcC51c2Vycydcblx0XSwgZnVuY3Rpb24oJGludGVycG9sYXRlUHJvdmlkZXIpe1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCc8JScpO1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnJT4nKTtcbn0pO1xuXG5hcHAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIEVycm9ySGFuZGxlckZhY3RvcnksIGp3dEhlbHBlciwgQXV0aEZhY3RvcnksICR3aW5kb3csICRsb2NhdGlvbikge1xuXG5cdCR3aW5kb3cuZ2EoJ2NyZWF0ZScsICdVQS03NjIyMTYxOC0xJywgJ2F1dG8nKTtcblx0XG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvKSB7XG5cdFx0dmFyIHRva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJyk7XG5cblx0XHQkcm9vdFNjb3BlLmN1cnJlbnRSb3V0ZSA9IHRvLm5hbWU7XG5cblx0XHRpZih0b2tlbiAhPT0gbnVsbCl7XG5cdFx0XHQkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuXHRcdFx0dmFyIHVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuXHRcdFx0JHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHVzZXI7XG5cdFx0fVxuXG5cdFx0aWYoKHRvLm5hbWUuc3BsaXQoXCIuXCIsIDEpWzBdID09ICdhdXRoJykgJiYgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkKXtcblx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHR9XG5cblx0XHRpZiAodG8ucmVzdHJpY3RlZCkge1xuXG5cdFx0XHQvLyBSZXN0cmljdCBndWFyZGVkIHJvdXRlcy5cblx0XHRcdGlmICh0b2tlbiA9PT0gbnVsbCkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYXV0aC5sb2dpbicsIHt9LCB7bG9jYXRpb246ICdyZXBsYWNlJ30pO1xuXHRcdFx0fVxuXG5cdFx0XHQvKlxuXHRcdFx0aWYgKHRva2VuICE9PSBudWxsICYmIGp3dEhlbHBlci5pc1Rva2VuRXhwaXJlZCh0b2tlbikpIHtcblx0XHRcdFx0QXV0aEZhY3RvcnkuYXR0ZW1wdFJlZnJlc2hUb2tlbigpO1xuXHRcdFx0fVxuXHRcdFx0Ki9cblxuXHRcdFx0JHJvb3RTY29wZS5kYXRlcGlja2VyT3B0aW9ucyA9IHtcblx0XHRcdFx0c2hvd1dlZWtzOiB0cnVlLFxuXHRcdFx0XHRzdGFydGluZ0RheTogMVxuXHRcdFx0fTtcblx0XHRcdCRyb290U2NvcGUudGltZXBpY2tlck9wdGlvbnMgPSB7XG5cdFx0XHRcdHNob3dNZXJpZGlhbjogZmFsc2UsXG5cdFx0XHRcdG1pbnV0ZVN0ZXA6IDE1XG5cdFx0XHR9O1xuXG5cdFx0fVxuXHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gJyc7XG5cblx0fSk7XG5cblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQkd2luZG93LmdhKCdzZW5kJywgJ3BhZ2V2aWV3JywgJGxvY2F0aW9uLnBhdGgoKSk7XG5cdH0pO1xuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgZmxhc2ggbWVzc2FnZXMgYmFzZWQgb24gZ2l2ZW4gYXJyYXkgb3Igc3RyaW5nIG9mIG1lc3NhZ2VzLlxuXHQgKiBIaWRlcyBldmVyeSBtZXNzYWdlIGFmdGVyIDUgc2Vjb25kcy5cblx0ICpcblx0ICogQHBhcmFtICBtaXhlZCAgbWVzc2FnZXNcblx0ICogQHBhcmFtICBzdHJpbmcgdHlwZVxuXHQgKiBAcmV0dXJuIHZvaWRcblx0ICovXG5cdCRyb290U2NvcGUuY2F0Y2hFcnJvciA9IGZ1bmN0aW9uKHJlc3BvbnNlKVxuXHR7XG5cdFx0Ly8gUmVzZXQgYWxsIGVycm9yLSBhbmQgc3VjY2VzcyBtZXNzYWdlcy5cblx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMgPSBbXTtcblx0XHQkcm9vdFNjb3BlLnN1Y2Nlc3NNZXNzYWdlcyA9IFtdO1xuXG5cdFx0aWYodHlwZW9mIHJlc3BvbnNlID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaChyZXNwb25zZSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0XHRpZihyZXNwb25zZSlcblx0XHRcdHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLCBmdW5jdGlvbihlcnJvck1lc3NhZ2Upe1xuXHRcdFx0XHRcdHZhciBtZXNzYWdlID0gKHR5cGVvZiBlcnJvck1lc3NhZ2UgPT09ICdzdHJpbmcnKSA/IGVycm9yTWVzc2FnZSA6IGVycm9yTWVzc2FnZVswXTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaChtZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coJHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzKTtcblxuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdFx0XHR9LCA1MDAwKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblxuXHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzID0gZnVuY3Rpb24obWVzc2FnZXMsIHR5cGUpXG5cdHtcblx0XHQkdGltZW91dC5jYW5jZWwoJHJvb3RTY29wZS5lcnJvck1lc3NhZ2VUaW1lcik7XG5cdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzID0gW107XG5cdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblxuXHRcdGlmKGFuZ3VsYXIuaXNTdHJpbmcobWVzc2FnZXMpKSBtZXNzYWdlcyA9IFttZXNzYWdlc107XG5cblx0XHR2YXIgdW53YW50ZWRNZXNzYWdlcyA9IFsndG9rZW5fbm90X3Byb3ZpZGVkJ107XG5cdFx0dmFyIGljb24gPSAodHlwZSA9PSAnc3VjY2VzcycpID8gJ2NoZWNrLWNpcmNsZScgOiAnaW5mby1jaXJjbGUnO1xuXG5cdFx0YW5ndWxhci5mb3JFYWNoKG1lc3NhZ2VzLCBmdW5jdGlvbihtZXNzYWdlKXtcblxuXHRcdFx0aWYodW53YW50ZWRNZXNzYWdlcy5pbmRleE9mKG1lc3NhZ2UpIDwgMClcblx0XHRcdHtcblx0XHRcdFx0dmFyIHRleHQgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnKSA/IG1lc3NhZ2UgOiBtZXNzYWdlWzBdO1xuXHRcdFx0XHRpZih0eXBlID09ICdlcnJvcicpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaCh0ZXh0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnN1Y2Nlc3NNZXNzYWdlcy5wdXNoKHRleHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZVRpbWVyID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblx0XHR9LCA1MDAwKTtcblx0fTtcblxuXHQvKipcblx0ICogR2xvYmFsIGZ1bmN0aW9uIGZvciByZXBvcnRpbmcgdG9wIGxldmVsIGVycm9ycy4gTWFrZXMgYW4gYWpheCBjYWxsIGZvciBzZW5kaW5nIGEgYnVnIHJlcG9ydC5cblx0ICogQHBhcmFtIHtvYmplY3R9IGVycm9yXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjYXVzZVxuXHQgKi9cblx0JHJvb3RTY29wZS5yZXBvcnRFcnJvciA9IGZ1bmN0aW9uKGVycm9yLCBjYXVzZSlcblx0e1xuXHRcdGlmKCFjYXVzZSkgY2F1c2UgPSAnRnJvbnRlbmQnO1xuXHRcdGlmKGVycm9yKXtcblx0XHRcdEVycm9ySGFuZGxlckZhY3Rvcnlcblx0XHRcdFx0LnJlcG9ydEVycm9yKGVycm9yLCBjYXVzZSlcblxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0aWYocmVzcG9uc2UubWVzc2FnZSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5tZXNzYWdlKSAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKFtyZXNwb25zZS5tZXNzYWdlXSwgJ3dhcm5pbmcnKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYocmVzcG9uc2UuZGF0YSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5kYXRhLm1lc3NhZ2UpICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMoW3Jlc3BvbnNlLmRhdGEubWVzc2FnZV0sICd3YXJuaW5nJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmFkbWluLmNsdWJzJywgW10pXG5cbiAgICAuY29udHJvbGxlcihcIkFkbWluQ2x1YnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBBZG1pbkNsdWJzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi5maWx0ZXIgPSB7XG4gICAgICAgIHNlYXJjaDogJycsXG4gICAgICAgIGhpZGVfd2l0aG91dF91c2VyczogMSxcbiAgICAgICAgaGlkZV93aXRob3V0X2FkbWluczogbnVsbFxuICAgIH07XG5cbiAgICBzZWxmLmhpZGVDbHVic1dpdGhvdXRVc2VycyA9IGZ1bmN0aW9uKGNsdWIpe1xuICAgICAgICBpZihzZWxmLmZpbHRlci5oaWRlX3dpdGhvdXRfdXNlcnMgJiYgY2x1Yi51c2Vyc19jb3VudCl7XG4gICAgICAgICAgICByZXR1cm4gY2x1YjtcbiAgICAgICAgfWVsc2UgaWYoIXNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF91c2Vycyl7XG4gICAgICAgICAgICByZXR1cm4gY2x1YjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2VsZi5oaWRlQ2x1YnNXaXRob3V0QWRtaW5zID0gZnVuY3Rpb24oY2x1Yil7XG4gICAgICAgIGlmKHNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF9hZG1pbnMgJiYgY2x1Yi5hZG1pbnNfY291bnQpe1xuICAgICAgICAgICAgcmV0dXJuIGNsdWI7XG4gICAgICAgIH1lbHNlIGlmKCFzZWxmLmZpbHRlci5oaWRlX3dpdGhvdXRfYWRtaW5zKXtcbiAgICAgICAgICAgIHJldHVybiBjbHViO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzb3J0TGlzdCgpIHt9XG5cbiAgICB0aGlzLnBhZ2UgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMucGFnZSwgMTApO1xuICAgIHRoaXMuc29ydCA9ICRzdGF0ZVBhcmFtcy5zb3J0O1xuICAgIHRoaXMuc29ydE9wdGlvbnMgPSBbJ3Vwdm90ZXMnLCAnZGF0ZScsICdhdXRob3InXTtcbiAgICBzb3J0TGlzdCgpO1xuICAgIHVwZGF0ZVBhZ2UoKTtcblxuXG4gICAgdGhpcy5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLnBhZ2UrKztcbiAgICAgICAgdXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuICAgICAgICAkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcbiAgICB9O1xuICAgIHRoaXMucHJldlBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHNlbGYucGFnZSA+IDApIHtcbiAgICAgICAgICAgIHNlbGYucGFnZS0tO1xuICAgICAgICAgICAgdXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuICAgICAgICAgICAgJHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc29ydENoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ydExpc3QoKTtcbiAgICAgICAgJHN0YXRlLmdvKCcuJywge3NvcnQ6IHNlbGYuc29ydH0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgfTtcblxufSlcbi5jb250cm9sbGVyKFwiQWRtaW5DbHViQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdGltZW91dCwgQWRtaW5DbHVic0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuICAgIHNlbGYuc2VsZWN0ZWRjbHViID0ge307XG5cbiAgICBpZighJHN0YXRlUGFyYW1zLmlkKSAkc3RhdGUuZ28oJ2FkbWluLmNsdWJzJyk7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gIHRydWU7XG4gICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YiA9IHJlc3BvbnNlLmNsdWI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbi5jbHVicycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi51cGRhdGVDbHViID0gZnVuY3Rpb24oY2x1Yil7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAndXBkYXRpbmcnO1xuICAgICAgICBBZG1pbkNsdWJzRmFjdG9yeS51cGRhdGVDbHViKGNsdWIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgc2VsZi5zdGF0ZSA9ICd1cGRhdGVkJztcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NsdWInLCAoe2lkOiBjbHViLmlkfSkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZUNsdWIgPSBmdW5jdGlvbihjbHViKXtcbiAgICAgICAgQWRtaW5DbHVic0ZhY3RvcnkuZGVsZXRlQ2x1YihjbHViKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2x1YnMnKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLnNlYXJjaEZvckNsdWJzID0gZnVuY3Rpb24oc2VhcmNoUXVlcnksIGNsdWIpXG4gICAge1xuICAgICAgICByZXR1cm4gQWRtaW5DbHVic0ZhY3RvcnlcbiAgICAgICAgICAgIC5zZWFyY2hGb3JDbHVicyhzZWFyY2hRdWVyeSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ3dhcm5pbmcnKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5mb3VuZE1hdGNoID0gKHJlc3BvbnNlLmRhdGEuY2x1YnMubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuY2x1YnMubWFwKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmFscmVhZHlTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5zZWxlY3RDbHViID0gZnVuY3Rpb24oJGl0ZW0pXG4gICAge1xuICAgICAgICBzZWxmLnNlbGVjdGVkY2x1YiA9ICRpdGVtO1xuICAgIH07XG5cbiAgICBzZWxmLm1lcmdlQ2x1YnMgPSBmdW5jdGlvbihjbHVic0lkRnJvbSwgY2x1YnNJZFRvKXtcbiAgICAgICAgaWYoY2x1YnNJZEZyb20gJiYgY2x1YnNJZFRvKXtcbiAgICAgICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5Lm1lcmdlQ2x1YnMoY2x1YnNJZEZyb20sIGNsdWJzSWRUbylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYWRtaW4uY2x1YnMuc2hvdycsIHtpZDpjbHVic0lkVG99LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZmluZCgpO1xufSlcbi5mYWN0b3J5KCdBZG1pbkNsdWJzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMnO1xuXG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNsdWIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvJytjbHViLmlkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oY2x1YilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZUNsdWI6IGZ1bmN0aW9uKGNsdWIpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy8nK2NsdWIuaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxvYWRVc2VyQ2x1YjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy9nZXRVc2VyQ2x1YicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZFVzZXJUb0NsdWJzOiBmdW5jdGlvbihjbHVic19pZCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzL2FkZFVzZXJUb0NsdWJzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHsnY2x1YnNfaWQnOiBjbHVic19pZH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGROZXdDbHViOiBmdW5jdGlvbihjbHViKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvYWRkTmV3Q2x1YicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh7J2NsdWJzX25yJzogY2x1Yi5jbHVic19uciwgJ25hbWUnOiBjbHViLm5hbWV9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2VhcmNoRm9yQ2x1YnM6IGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy9zZWFyY2gnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oeydzZWFyY2hRdWVyeSc6IGZpbHRlcn0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRVc2VyQXNBZG1pbjogZnVuY3Rpb24oYWRtaW4pIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvYWRkVXNlckFzQWRtaW4nLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oeydhZG1pbic6IGFkbWlufSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzL2RlbGV0ZVVzZXJBc0FkbWluJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHsnYWRtaW4nOiBhZG1pbn0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBtZXJnZUNsdWJzOiBmdW5jdGlvbihjbHVic0lkRnJvbSwgY2x1YnNJZFRvKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzL21lcmdlJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHsnY2x1YnNJZEZyb20nOiBjbHVic0lkRnJvbSwgJ2NsdWJzSWRUbyc6IGNsdWJzSWRUb30pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmFkbWluLmludm9pY2VzJywgW10pXG5cblxuLmNvbnRyb2xsZXIoXCJBZG1pbkludm9pY2VzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQWRtaW5JbnZvaWNlc0ZhY3RvcnksIEZpbGVTYXZlciwgQmxvYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRJbnZvaWNlcygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEFkbWluSW52b2ljZXNGYWN0b3J5LmxvYWQoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuaW52b2ljZXMgPSByZXNwb25zZS5pbnZvaWNlcztcbiAgICAgICAgICAgICAgICBzZWxmLmludm9pY2VzX292ZXJ2aWV3ID0gcmVzcG9uc2UuaW52b2ljZXNfb3ZlcnZpZXc7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmRvd25sb2FkID0gZnVuY3Rpb24oaW52b2ljZSl7XG4gICAgICAgIEFkbWluSW52b2ljZXNGYWN0b3J5LmRvd25sb2FkKGludm9pY2UuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBuZXcgQmxvYihbcmVzcG9uc2VdLCB7dHlwZTogJ2FwcGxpY2F0aW9uL3BkZid9KTtcbiAgICAgICAgICAgICAgICBpZihmaWxlLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhmaWxlLCAnaW52b2ljZS0nICsgaW52b2ljZS5pbnZvaWNlX3JlZmVyZW5jZSArICcucGRmJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxvYWRJbnZvaWNlcygpO1xufSlcbi5jb250cm9sbGVyKFwiQWRtaW5JbnZvaWNlQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQWRtaW5JbnZvaWNlc0ZhY3RvcnksIEZpbGVTYXZlciwgQmxvYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBsb2FkSW52b2ljZXMoKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBBZG1pbkludm9pY2VzRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2UuaW52b2ljZSkgJHN0YXRlLmdvKCdhZG1pbi5pbnZvaWNlcy5pbmRleCcpO1xuICAgICAgICAgICAgICAgIHNlbGYuaW52b2ljZSA9IHJlc3BvbnNlLmludm9pY2U7XG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlU2lnbnVwcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmRvd25sb2FkID0gZnVuY3Rpb24oaW52b2ljZSl7XG4gICAgICAgIEFkbWluSW52b2ljZXNGYWN0b3J5LmRvd25sb2FkKGludm9pY2UuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBuZXcgQmxvYihbcmVzcG9uc2VdLCB7dHlwZTogJ2FwcGxpY2F0aW9uL3BkZid9KTtcbiAgICAgICAgICAgICAgICBpZihmaWxlLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhmaWxlLCAnaW52b2ljZS0nICsgaW52b2ljZS5pbnZvaWNlX3JlZmVyZW5jZSArICcucGRmJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxvYWRJbnZvaWNlcygpO1xufSlcblxuLmZhY3RvcnkoJ0FkbWluSW52b2ljZXNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gKGlkKSA/ICcvJytpZCA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2ludm9pY2VzJyt1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRvd25sb2FkOiBmdW5jdGlvbihpZCl7XG4gICAgICAgICAgICBpZihpZCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vaW52b2ljZXMvJytpZCsnL2Rvd25sb2FkJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VUeXBlOiAnYXJyYXlidWZmZXInLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cblxuICAgIH07XG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuYWRtaW4nLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJBZG1pbkRhc2hib2FyZENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCwgQWRtaW5GYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gbG9hZERhc2hib2FyZCgpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEFkbWluRmFjdG9yeS5sb2FkRGFzaGJvYXJkKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmRhdGEgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgbG9hZERhc2hib2FyZCgpO1xufSlcbi5mYWN0b3J5KFwiQWRtaW5GYWN0b3J5XCIsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZERhc2hib2FyZDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwgKyAnYWRtaW4vZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5hZG1pbi5zaWdudXBzJywgW10pXG5cbi5jb250cm9sbGVyKFwiQWRtaW5TaWdudXBzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQWRtaW5TaWdudXBzRmFjdG9yeSwgJHRpbWVvdXQpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdHZhciBhcmdzID0ge1xuXHRcdFx0Y3VycmVudF9wYWdlOiAkc3RhdGVQYXJhbXMuY3VycmVudF9wYWdlLFxuXHRcdFx0cGVyX3BhZ2U6ICRzdGF0ZVBhcmFtcy5wZXJfcGFnZSxcblx0XHRcdGNvbXBldGl0aW9uc19pZDogJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZCxcblx0XHRcdHNlYXJjaDogJHN0YXRlUGFyYW1zLnNlYXJjaFxuXHRcdH07XG5cdFx0QWRtaW5TaWdudXBzRmFjdG9yeS5sb2FkKGFyZ3MpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG5cdFx0XHRcdHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuXHRcdFx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuXHRcdFx0fSk7XG5cdH07XG5cblx0c2VsZi51cGRhdGVQYWdlID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgYXJncyA9IHtcblx0XHRcdHNlYXJjaDogc2VsZi5zaWdudXBzLnNlYXJjaCxcblx0XHRcdGN1cnJlbnRfcGFnZTogc2VsZi5zaWdudXBzLmN1cnJlbnRfcGFnZSxcblx0XHRcdHBlcl9wYWdlOiBzZWxmLnNpZ251cHMucGVyX3BhZ2UsXG5cdFx0XHRjb21wZXRpdGlvbnNfaWQ6IHNlbGYuc2lnbnVwcy5jb21wZXRpdGlvbnNfaWRcblx0XHR9O1xuXHRcdCRzdGF0ZS5nbygnYWRtaW4uc2lnbnVwcy5pbmRleCcsIGFyZ3MsIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0fTtcblxuXHRzZWxmLmxvYWQoKTtcblxufSlcblxuLmZhY3RvcnkoJ0FkbWluU2lnbnVwc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuXG5cdHJldHVybiB7XG5cdFx0bG9hZDogZnVuY3Rpb24gKGFyZ3MpIHtcblxuXHRcdFx0dmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydhZG1pbi9zaWdudXBzJztcblx0XHRcdGN1cnJlbnRfcGFnZSA9IChhcmdzLmN1cnJlbnRfcGFnZSkgPyBhcmdzLmN1cnJlbnRfcGFnZSA6IDE7XG5cblx0XHRcdHVybCArPSAnP3BhZ2U9JyArIGN1cnJlbnRfcGFnZTtcblx0XHRcdGlmIChhcmdzLnNlYXJjaCkgdXJsICs9ICcmc2VhcmNoPScgKyBhcmdzLnNlYXJjaDtcblx0XHRcdGlmIChhcmdzLnBlcl9wYWdlKSB1cmwgKz0gJyZwZXJfcGFnZT0nICsgYXJncy5wZXJfcGFnZTtcblx0XHRcdGlmIChhcmdzLmNvbXBldGl0aW9uc19pZCkgdXJsICs9ICcmY29tcGV0aXRpb25zX2lkPScgKyBhcmdzLmNvbXBldGl0aW9uc19pZDtcblx0XHRcdGlmIChhcmdzLnNwZWNpYWx3aXNoZXMpIHVybCArPSAnJnN0YXR1cz0nICsgYXJncy5zcGVjaWFsd2lzaGVzO1xuXG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHR1cmw6IHVybCxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmFkbWluLnVzZXJzJywgW10pXG5cbi5jb250cm9sbGVyKFwiQWRtaW5Vc2Vyc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIEFkbWluVXNlcnNGYWN0b3J5LCAkdGltZW91dCl7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmxvYWQgPSBmdW5jdGlvbigpIHtcblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG5cdFx0dmFyIGFyZ3MgPSB7XG5cdFx0XHRjdXJyZW50X3BhZ2U6ICRzdGF0ZVBhcmFtcy5jdXJyZW50X3BhZ2UsXG5cdFx0XHRwZXJfcGFnZTogJHN0YXRlUGFyYW1zLnBlcl9wYWdlLFxuXHRcdFx0c2VhcmNoOiAkc3RhdGVQYXJhbXMuc2VhcmNoLFxuXHRcdFx0c3RhdHVzOiAkc3RhdGVQYXJhbXMuc3RhdHVzXG5cdFx0fTtcblx0XHRBZG1pblVzZXJzRmFjdG9yeS5sb2FkKGFyZ3MpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYudXNlcnMgPSByZXNwb25zZS51c2Vycztcblx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHNlbGYudXBkYXRlUGFnZSA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGFyZ3MgPSB7XG5cdFx0XHRzZWFyY2g6IHNlbGYudXNlcnMuc2VhcmNoLFxuXHRcdFx0c3RhdHVzOiBzZWxmLnVzZXJzLnN0YXR1cyxcblx0XHRcdGN1cnJlbnRfcGFnZTogc2VsZi51c2Vycy5jdXJyZW50X3BhZ2UsXG5cdFx0XHRwZXJfcGFnZTogc2VsZi51c2Vycy5wZXJfcGFnZVxuXHRcdH07XG5cdFx0JHN0YXRlLmdvKCdhZG1pbi51c2Vycy5pbmRleCcsIGFyZ3MsIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0fTtcblxuXHRzZWxmLmxvYWQoKTtcblxufSlcblxuLmNvbnRyb2xsZXIoXCJBZG1pblVzZXJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBBZG1pblVzZXJzRmFjdG9yeSwgQWRtaW5JbnZvaWNlc0ZhY3RvcnksIEZpbGVTYXZlciwgQmxvYil7XG5cdHZhciBzZWxmID0gdGhpcztcblx0ZnVuY3Rpb24gbG9hZFVzZXIoKXtcblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG5cdFx0aWYoJHN0YXRlUGFyYW1zLnVzZXJfaWQpe1xuXHRcdFx0QWRtaW5Vc2Vyc0ZhY3RvcnkuZmluZCgkc3RhdGVQYXJhbXMudXNlcl9pZClcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdHNlbGYudXNlciA9IHJlc3BvbnNlO1xuXHRcdFx0XHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHRcdFx0c2VsZi51c2VyID0gJyc7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0fWVsc2V7XG5cdFx0XHRzZWxmLnVzZXIgPSB7fTtcblx0XHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cdFx0fVxuXHR9XG5cdGxvYWRVc2VyKCk7XG5cblx0c2VsZi5zYXZlVXNlciA9IGZ1bmN0aW9uKHVzZXIpe1xuXHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcblx0XHRBZG1pblVzZXJzRmFjdG9yeS5zYXZlVXNlcih1c2VyKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcblx0XHRcdFx0JHN0YXRlLmdvKCdhZG1pbi51c2Vycy5zaG93Jywge3VzZXJfaWQ6IHVzZXIudXNlcl9pZH0sIHtsb2NhdGlvbjogJ3JlbG9hZCd9KTtcblx0XHRcdH0pXG5cdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcblx0XHRcdH0pXG5cdFx0XHQuZmluYWxseShmdW5jdGlvbigpe1xuXHRcdFx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuXHRcdFx0fSk7XG5cdH07XG5cblx0c2VsZi5jcmVhdGVVc2VyID0gZnVuY3Rpb24odXNlcil7XG5cdFx0aWYoc2VsZi5sb2FkaW5nU3RhdGUpIHJldHVybiBmYWxzZTtcblx0XHRzZWxmLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG5cdFx0QWRtaW5Vc2Vyc0ZhY3RvcnkuY3JlYXRlVXNlcih1c2VyKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcblx0XHRcdFx0JHN0YXRlLmdvKCdhZG1pbi51c2Vycy5zaG93Jywge3VzZXJfaWQ6IHJlc3BvbnNlLnVzZXJfaWR9LCB7bG9jYXRpb246ICdyZWxvYWQnfSk7XG5cdFx0XHR9KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHR9KVxuXHRcdFx0LmZpbmFsbHkoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuXHRcdFx0fSk7XG5cdH07XG5cblx0c2VsZi5kb3dubG9hZEludm9pY2UgPSBmdW5jdGlvbihpbnZvaWNlKXtcblx0XHRBZG1pbkludm9pY2VzRmFjdG9yeS5kb3dubG9hZChpbnZvaWNlLmlkKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHR2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuXHRcdFx0XHRpZihmaWxlLnNpemUpIHtcblx0XHRcdFx0XHRGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsICdpbnZvaWNlLScgKyBpbnZvaWNlLmludm9pY2VfcmVmZXJlbmNlICsgJy5wZGYnKTtcblx0XHRcdFx0fVxuXHRcdFx0fSk7XG5cdH07XG5cbn0pXG5cblxuLmZhY3RvcnkoJ0FkbWluVXNlcnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuXHRyZXR1cm4ge1xuXHRcdGxvYWQ6IGZ1bmN0aW9uIChhcmdzKSB7XG5cblx0XHRcdHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnYWRtaW4vdXNlcnMnO1xuXHRcdFx0Y3VycmVudF9wYWdlID0gKGFyZ3MuY3VycmVudF9wYWdlKSA/IGFyZ3MuY3VycmVudF9wYWdlIDogMTtcblxuXHRcdFx0dXJsICs9ICc/cGFnZT0nICsgY3VycmVudF9wYWdlO1xuXHRcdFx0aWYgKGFyZ3Muc2VhcmNoKSB1cmwgKz0gJyZzZWFyY2g9JyArIGFyZ3Muc2VhcmNoO1xuXHRcdFx0aWYgKGFyZ3MucGVyX3BhZ2UpIHVybCArPSAnJnBlcl9wYWdlPScgKyBhcmdzLnBlcl9wYWdlO1xuXHRcdFx0aWYgKGFyZ3Muc3RhdHVzKSB1cmwgKz0gJyZzdGF0dXM9JyArIGFyZ3Muc3RhdHVzO1xuXG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHR1cmw6IHVybCxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRmaW5kOiBmdW5jdGlvbihpZCkge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vdXNlcnMvJytpZCxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRzYXZlVXNlcjogZnVuY3Rpb24odXNlcil7XG5cdFx0XHR2YXIgZGF0YSA9IGFuZ3VsYXIuY29weSh1c2VyKTtcblx0XHRcdGRhdGEuYmlydGhkYXkgPSBkYXRhLmJpcnRoZGF5KyctMDEtMDEnO1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUFVUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vdXNlcnMvJytkYXRhLnVzZXJfaWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKGRhdGEpXG5cdFx0XHR9KTtcblx0XHR9XG5cblx0fTtcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5hdXRoJywgWyd2Y1JlY2FwdGNoYSddKVxuICAgIC5jb250cm9sbGVyKCdBdXRoQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCAkc3RhdGVQYXJhbXMsIEF1dGhGYWN0b3J5LCAkdWliTW9kYWwsICR0aW1lb3V0KXtcblxuICAgICAgICAkc2NvcGUuYXV0aCA9XG4gICAgICAgIHtcbiAgICAgICAgICAgIGVtYWlsXHQ6ICcnLFxuICAgICAgICAgICAgbmFtZSAgICA6ICcnLFxuICAgICAgICAgICAgbGFzdG5hbWU6ICcnLFxuICAgICAgICAgICAgcGFzc3dvcmQ6ICcnLFxuICAgICAgICAgICAgaW52aXRlX3Rva2VuOiAkc3RhdGVQYXJhbXMuaW52aXRlX3Rva2VuXG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLmxvZ2luID0gZnVuY3Rpb24oKVxuICAgICAgICB7XG4gICAgICAgICAgICAkc2NvcGUubG9nZ2luZ0luID0gdHJ1ZTtcblxuICAgICAgICAgICAgdmFyIGNyZWRlbnRpYWxzID0ge1xuICAgICAgICAgICAgICAgIGVtYWlsOiAkc2NvcGUuYXV0aC5lbWFpbCxcbiAgICAgICAgICAgICAgICBwYXNzd29yZDogJHNjb3BlLmF1dGgucGFzc3dvcmRcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIEF1dGhGYWN0b3J5LmF1dGhlbnRpY2F0ZShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCByZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIEF1dGhGYWN0b3J5LmdldFVzZXIoKVxuICAgICAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHJlc3BvbnNlLnVzZXI7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnZGFzaGJvYXJkJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCAxMDAwKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvZ2dpbmdJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlID09ICd1c2VyX25vdF9hY3RpdmUnKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGguaW5hY3RpdmUnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmxvZ2dpbmdJbiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5yZWdpc3RlciA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYoJHNjb3BlLmF1dGgucmVjYXB0Y2hhcmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkc2NvcGUucmVnaXN0ZXJTdGF0ZSA9ICdyZWdpc3RyZXJpbmcnO1xuXG4gICAgICAgICAgICAgICAgQXV0aEZhY3RvcnkucmVnaXN0ZXIoJHNjb3BlLmF1dGgpXG4gICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWdpc3RlclN0YXRlID0gJ2RvbmUnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLmF1dGggPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlZ2lzdGVyU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG5cbiAgICAgICAgLyoqXG4gICAgICAgICAqIE1ha2VzIGEgcmVxdWVzdCBmb3Igc2VuZGluZyBhIHBhc3N3b3JkIHJlc2V0IGxpbmsuXG4gICAgICAgICAqXG4gICAgICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAgICAgKi9cbiAgICAgICAgJHNjb3BlLnJlc2V0ID0ge2VtYWlsOiAnJ307XG4gICAgICAgICRzY29wZS5yZXF1ZXN0UGFzc3dvcmRSZXNldCA9IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgQXV0aEZhY3RvcnlcbiAgICAgICAgICAgICAgICAucmVxdWVzdFBhc3N3b3JkUmVzZXQoe2VtYWlsOiAkc2NvcGUucmVzZXQuZW1haWx9KVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnJlc2V0LmVtYWlsID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgJHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnc3VjY2VzcycpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgICAgICAkc2NvcGUudGVybXNNb2RhbE9wZW4gPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBzZWxmLnRlcm1zTW9kYWwgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uOiAkc2NvcGUuYW5pbWF0aW9uc0VuYWJsZWQsXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvdGVybXMnLFxuICAgICAgICAgICAgICAgIHNpemU6ICdtZCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHVpYk1vZGFsSW5zdGFuY2Upe1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNsb3NlID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdtb2RhbCdcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgfSlcblxuICAgIC5jb250cm9sbGVyKCdBY3RpdmF0aW9uQ29udHJvbGxlcicsIGZ1bmN0aW9uKCRzdGF0ZSwgJHJvb3RTY29wZSwgJHNjb3BlLCAkaHR0cCwgJHN0YXRlUGFyYW1zLCBBdXRoRmFjdG9yeSwgJHRpbWVvdXQpe1xuXG5cbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcblxuICAgICAgICAkc2NvcGUuYWN0aXZhdGUgPSB7XG4gICAgICAgICAgICB0b2tlbjogJHN0YXRlUGFyYW1zLnRva2VuXG4gICAgICAgIH07XG4gICAgICAgICRzY29wZS5ub19wYXNzd29yZCA9IGZhbHNlO1xuICAgICAgICAkc2NvcGUudmVyaWZ5VG9rZW4gPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIEF1dGhGYWN0b3J5LmFjdGl2YXRlKCRzY29wZS5hY3RpdmF0ZSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmF0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVzcG9uc2UuZXJyb3IgPT0gJ2ludmFsaWRfY29kZScpe1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYocmVzcG9uc2UuZXJyb3IgPT0gJ25vX3Bhc3N3b3JkJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUubm9fcGFzc3dvcmQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnd2FybmluZycpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5hY3RpdmF0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcbiAgICB9KVxuXG4gICAgLmZhY3RvcnkoJ0F1dGhGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsICRmaWx0ZXIsICR0aW1lb3V0LCAkc3RhdGUsICRyb290U2NvcGUsIEFwaUVuZHBvaW50VXJsKXtcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgKiBTdG9yZXMgdGhlIHVzZXIgZGF0YSBhbmQgdXBkYXRlcyB0aGUgcm9vdHNjb3BlIHZhcmlhYmxlcy4gVGhlbiByZWRpcmVjdHMgdG8gZGFzaGJvYXJkLlxuICAgICAgICAgICAgICpcbiAgICAgICAgICAgICAqIEBwYXJhbSAgb2JqZWN0ICAkdXNlclxuICAgICAgICAgICAgICogQHJldHVybiB2b2lkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGF1dGhlbnRpY2F0ZTogZnVuY3Rpb24oY3JlZGVudGlhbHMpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUnLFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiBjcmVkZW50aWFsc1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZ2V0VXNlcjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXNlcidcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogQ2xlYXJzIGFsbCB1c2VyIGRhdGEgYW5kIHJvb3RzY29wZSB1c2VyIHZhcmlhYmxlcy4gVGhlbiByZWRpcmVjdHMgdG8gbG9naW4gZm9ybS5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgbG9nb3V0OiBmdW5jdGlvbigpXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlcXVlc3RQYXNzd29yZFJlc2V0OiBmdW5jdGlvbihjcmVkZW50aWFscykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydwYXNzd29yZC9lbWFpbCcsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgcmVzZXRQYXNzd29yZDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncGFzc3dvcmQvcmVzZXQnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihjcmVkZW50aWFscykge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydyZWdpc3RlcicsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYWN0aXZhdGU6IGZ1bmN0aW9uKHRva2VuKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FjdGl2YXRlJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0odG9rZW4pXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBhdHRlbXB0UmVmcmVzaFRva2VuOiBmdW5jdGlvbihyZXF1ZXN0VG9kb1doZW5Eb25lKXtcblxuICAgICAgICAgICAgICAgIC8vIFJ1biB0aGUgY2FsbCB0byByZWZyZXNoIHRoZSB0b2tlbi5cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncmVmcmVzaCdcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSlcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgbm8gcmVzcG9uc2UgdG9rZW4gaXMgcmV0cmlldmVkLCBnbyB0byB0aGUgbG9naW4gcGFnZSxcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHByZXZlbnQgdGhlIHJlcXVlc3QgZnJvbSBiZWluZyByZXRyaWVkIGJ5IHNldHRpbmcgcmVxdWVzdFRvZG9XaGVuRG9uZSA9IGZhbHNlIGFuZFxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcmV0dXJuIGZhbHNlIHRvIGFsbG93IGZvciBjdXN0b20gY2FsbGJhY2tzIGJ5IGNoZWNraW5nIGlmKEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4oKSA9PT0gZmFsc2UpLlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLnRva2VuKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RUb2RvV2hlbkRvbmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYXV0aC5sb2dpbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICAgICAgLy8gU2V0IHRoZSByZWZyZXNoZWQgdG9rZW4uXG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndG9rZW4nLCByZXNwb25zZS50b2tlbik7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJZiBhIHJlcXVlc3Qgc2hvdWxkIGJlIHJldHJpZWQgYWZ0ZXIgcmVmcmVzaCwgZm9yIGV4YW1wbGUgb24gcHVsbC10by1yZWZyZXNoLCB0aGUgcmVxdWVzdCBjb25maWdcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGlzIHBhc3NlZCBpbnRvIHRoZSByZXF1ZXN0VG9kb1doZW5Eb25lIHBhcmFtZXRlci4gU2V0IHRoZSBhdXRob3JpemF0aW9uIHRva2VuIHRvIHRoZSBuZXdseSByZXRyaWV2ZWRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHRva2VuIGFuZCBydW4gdGhlIHJlcXVlc3QgYWdhaW4uXG4gICAgICAgICAgICAgICAgICAgICAgICAvKlxuICAgICAgICAgICAgICAgICAgICAgICAgaWYoIWFuZ3VsYXIuaXNVbmRlZmluZWQocmVxdWVzdFRvZG9XaGVuRG9uZSkgJiYgcmVxdWVzdFRvZG9XaGVuRG9uZS5sZW5ndGggIT09IDApXG4gICAgICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmVxdWVzdFRvZG9XaGVuRG9uZS5oZWFkZXJzID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAnQXV0aG9yaXphdGlvbic6ICdCZWFyZXIgJyArIGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd0b2tlbicpXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAocmVxdWVzdFRvZG9XaGVuRG9uZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAqL1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKHRydWUpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RUb2RvV2hlbkRvbmUgPSB1bmRlZmluZWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jYWxlbmRhcicsIFtdKVxuXG4vKipcbiAqIGNhbGVuZGFyRGVtb0FwcCAtIDAuMS4zXG4gKi9cbi5jb250cm9sbGVyKCdDYWxlbmRhckNvbnRyb2xsZXInLCBmdW5jdGlvbigkc2NvcGUsJGh0dHAsJHRpbWVvdXQsIEFwaUVuZHBvaW50VXJsKSB7XG5cdFxuXHRmdW5jdGlvbiBpbml0KCl7XG5cdFx0XG5cdFx0JGFwaVVybCA9IEFwaUVuZHBvaW50VXJsKydjYWxlbmRhcic7XG5cdFxuXHRcdCRzY29wZS5jYWxlbmRhckV2ZW50cyA9IFt7XG4gICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsK1wiY2FsZW5kYXJcIixcbiAgICAgICAgfV07XG5cdFxuXHQgICAgJHNjb3BlLnVpQ29uZmlnID0ge1xuXHQgICAgICBjYWxlbmRhcjp7XG5cdFx0ICAgIGxhbmc6ICdzdicsXG5cdFx0ICAgIGJ1dHRvblRleHQ6IHtcblx0XHRcdCAgICB0b2RheTogICAgJ2lkYWcnLFxuXHRcdFx0ICAgIG1vbnRoOiAgICAnbcOlbmFkJyxcblx0XHRcdCAgICB3ZWVrOiAgICAgJ3ZlY2thJyxcblx0XHRcdCAgICBkYXk6ICAgICAgJ2RhZydcblx0XHRcdH0sXG5cdFx0XHRmaXJzdERheTogJzEnLFxuXHRcdFx0d2Vla051bWJlcnM6IHRydWUsXG5cdFx0XHRoZWFkZXI6IHtcblx0XHRcdFx0bGVmdDogJ3ByZXYsbmV4dCB0b2RheScsXG5cdFx0XHRcdGNlbnRlcjogJ3RpdGxlJyxcblx0XHRcdFx0cmlnaHQ6ICdtb250aCxhZ2VuZGFXZWVrLGFnZW5kYURheSdcblx0XHRcdH0sXG5cdFx0XHRjb2x1bW5Gb3JtYXQ6IHtcblx0XHRcdFx0ZGF5OiAnZGRkIEREL01NJyxcblx0XHRcdFx0d2VlazogJ2RkZCBERC9NTScsXG5cdFx0XHRcdG1vbnRoOiAnZGRkJ1xuXHRcdFx0fSxcblx0XHRcdHRpdGxlRm9ybWF0OiB7XG5cdFx0XHQgICAgbW9udGg6ICdNTU1NIFlZWVknLCAvLyBTZXB0ZW1iZXIgMjAwOVxuXHRcdFx0ICAgIHdlZWs6IFwiTU1NTSBEIFlZWVlcIiwgLy8gU2VwIDEzIDIwMDlcblx0XHRcdCAgICBkYXk6ICdNTU1NIEQgWVlZWScgIC8vIFNlcHRlbWJlciA4IDIwMDlcblx0XHRcdH0sXG5cdFx0XHR3ZWVrTnVtYmVyVGl0bGU6ICcnLFxuXHRcdFx0YXhpc0Zvcm1hdDogJ0g6bW0nLFxuXHRcdFx0dGltZUZvcm1hdDogJ0g6bW0nLFxuXHRcdFx0bWluVGltZTogJzY6MDAnLFxuXHRcdFx0bWF4VGltZTogJzIzOjU5Jyxcblx0XHRcdGFsbERheVNsb3Q6IGZhbHNlLFxuXHRcdFx0ZGVmYXVsdFZpZXc6ICdtb250aCcsXG5cdCAgICAgICAgaGVpZ2h0OiA1MDAsXG5cdCAgICAgICAgZWRpdGFibGU6IGZhbHNlLFxuXHQgICAgICAgIHZpZXdSZW5kZXI6IGZ1bmN0aW9uKHZpZXcsIGVsZW1lbnQpIHtcblx0XHRcdFx0dmFyIHN0YXJ0ID0gRGF0ZS5wYXJzZSh2aWV3LnN0YXJ0Ll9kKTtcblx0XHRcdFx0dmFyIGVuZCA9IERhdGUucGFyc2Uodmlldy5lbmQuX2QpO1xuXHRcdFx0XHQkc2NvcGUuY2FsZW5kYXJFdmVudHMgPSBbe1xuXHRcdCAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrXCJjYWxlbmRhcj9zdGFydD1cIitzdGFydCtcIiZlbmQ9XCIrZW5kXG5cdFx0ICAgICAgICB9XTtcbiAgICAgICAgXHR9LFxuXHRcdFx0ZXZlbnRDbGljazogJHNjb3BlLmFsZXJ0T25FdmVudENsaWNrLFxuXHQgICAgICAgIGV2ZW50RHJvcDogJHNjb3BlLmFsZXJ0T25Ecm9wLFxuXHQgICAgICAgIGV2ZW50UmVzaXplOiBmdW5jdGlvbih2aWV3LCBlbGVtZW50KSB7XG5cdFx0ICAgICAgICBjb25zb2xlLmxvZyh2aWV3KTtcblx0ICAgICAgICB9XG5cdCAgICAgIH1cblx0ICAgIH07XG5cblx0ICAgICRzY29wZS5jaGFuZ2VWaWV3ID0gZnVuY3Rpb24odmlldyxjYWxlbmRhcikge1xuXHQgICAgICBjYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ2NoYW5nZVZpZXcnLHZpZXcpO1xuXHQgICAgfTtcblx0XG5cdCAgICAkc2NvcGUucmVuZGVyQ2FsZW5kZXIgPSBmdW5jdGlvbihjYWxlbmRhcikge1xuXHQgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHQgICAgICAgY29uc29sZS5sb2coMTIzKTsgXG5cdFx0XHRcdGlmKGNhbGVuZGFyKXtcblx0XHRcdFx0Y2FsZW5kYXIuZnVsbENhbGVuZGFyKCdyZW5kZXInKTtcblx0XHRcdFx0fVxuXHQgICAgICAgfSwgMCk7XG5cdCAgICB9O1xuXHR9XG5cdFxuXHRpbml0KCk7XG5cbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2hhbXBpb25zaGlwcycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNoYW1waW9uc2hpcHNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENoYW1waW9uc2hpcHNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcbiAgICAgICAgQ2hhbXBpb25zaGlwc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhbXBpb25zaGlwcyA9IHJlc3BvbnNlLmNoYW1waW9uc2hpcHM7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG5cblxufSlcbi5jb250cm9sbGVyKFwiQ2hhbXBpb25zaGlwQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDaGFtcGlvbnNoaXBzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbmQoKXtcbiAgICAgICAgQ2hhbXBpb25zaGlwc0ZhY3RvcnkuZmluZCgkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGFtcGlvbnNoaXBzID0gcmVzcG9uc2UuY2hhbXBpb25zaGlwcztcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2hhbXBpb25zaGlwcycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbn0pXG5cbi5mYWN0b3J5KCdDaGFtcGlvbnNoaXBzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHBhZ2UsIGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NoYW1waW9uc2hpcHMnO1xuXG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjaGFtcGlvbnNoaXBzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cC8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHNpZ251cClcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jbHVicy5pbnZvaWNlcycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNsdWJHZW5lcmF0ZUludm9pY2VzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ2x1Ykludm9pY2VzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRJbnZvaWNlcygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENsdWJJbnZvaWNlc0ZhY3RvcnkubG9hZFBlbmRpbmdTaWdudXBzKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlU2lnbnVwcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmNyZWF0ZUludm9pY2UgPSBmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENsdWJJbnZvaWNlc0ZhY3RvcnkuY3JlYXRlSW52b2ljZXMoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NsdWIuaW52b2ljZXMuaW5kZXgnKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsb2FkSW52b2ljZXMoKTtcbn0pXG4uY29udHJvbGxlcihcIkNsdWJJbnZvaWNlc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENsdWJJbnZvaWNlc0ZhY3RvcnksICR1aWJNb2RhbCwgRmlsZVNhdmVyLCBCbG9iKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbG9hZEludm9pY2VzKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5sb2FkKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmludm9pY2VzX2luY29taW5nID0gcmVzcG9uc2UuaW52b2ljZXNfaW5jb21pbmc7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlc19vdXRnb2luZyA9IHJlc3BvbnNlLmludm9pY2VzX291dGdvaW5nO1xuICAgICAgICAgICAgICAgIHNlbGYuaW52b2ljZXNfZ2VuZXJhdGUgPSByZXNwb25zZS5pbnZvaWNlc19nZW5lcmF0ZTtcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYub3BlblBheW1lbnRNb2RhbCA9IGZ1bmN0aW9uKGludm9pY2Upe1xuXG4gICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdDbHViSW52b2ljZVBheW1lbnRNb2RhbC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZVBheW1lbnRNb2RhbENvbnRyb2xsZXIgYXMgbW9kYWxjb250cm9sbGVyJyxcbiAgICAgICAgICAgIHNpemU6ICdtZCcsXG4gICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgaW52b2ljZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW52b2ljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZEludm9pY2VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRvd25sb2FkID0gZnVuY3Rpb24oaW52b2ljZSl7XG4gICAgICAgIENsdWJJbnZvaWNlc0ZhY3RvcnkuZG93bmxvYWQoaW52b2ljZS5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuICAgICAgICAgICAgICAgIGlmKGZpbGUuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsICdpbnZvaWNlLScgKyBpbnZvaWNlLmludm9pY2VfcmVmZXJlbmNlICsgJy5wZGYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuICAgIFxuICAgIGxvYWRJbnZvaWNlcygpO1xufSlcbi5jb250cm9sbGVyKFwiQ2x1Ykludm9pY2VDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDbHViSW52b2ljZXNGYWN0b3J5LCBGaWxlU2F2ZXIsIEJsb2IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gbG9hZEludm9pY2VzKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2UuaW52b2ljZSkgJHN0YXRlLmdvKCdjbHViLmludm9pY2VzLmluZGV4Jyk7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlID0gcmVzcG9uc2UuaW52b2ljZTtcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuZG93bmxvYWQgPSBmdW5jdGlvbihpbnZvaWNlKXtcbiAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5kb3dubG9hZChpbnZvaWNlLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gbmV3IEJsb2IoW3Jlc3BvbnNlXSwge3R5cGU6ICdhcHBsaWNhdGlvbi9wZGYnfSk7XG4gICAgICAgICAgICAgICAgaWYoZmlsZS5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIEZpbGVTYXZlci5zYXZlQXMoZmlsZSwgJ2ludm9pY2UtJyArIGludm9pY2UuaW52b2ljZV9yZWZlcmVuY2UgKyAnLnBkZicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsb2FkSW52b2ljZXMoKTtcbn0pXG4uY29udHJvbGxlcignQ2x1Ykludm9pY2VQYXltZW50TW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsIGludm9pY2UsIENsdWJJbnZvaWNlc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXG4gICAgc2VsZi5vcHRpb25zID0ge1xuICAgICAgICBzaG93V2Vla3M6IHRydWUsXG4gICAgICAgIHN0YXJ0aW5nRGF5OiAxLFxuICAgICAgICBtYXhEYXRlOiBuZXcgRGF0ZSgpLFxuICAgICAgICBtaW5EYXRlOiBtb21lbnQoaW52b2ljZS5pbnZvaWNlX2RhdGUpLnN0YXJ0T2YoJ2RheScpXG4gICAgfTtcbiAgICBzZWxmLmludm9pY2UgPSBhbmd1bGFyLmNvcHkoaW52b2ljZSk7XG5cbiAgICBzZWxmLnJlZ2lzdGVyUGF5bWVudCA9IGZ1bmN0aW9uIChpbnZvaWNlKSB7XG4gICAgICAgIGlmKGludm9pY2UucGFpZF9hdCAmJiAhc2VsZi5sb2FkaW5nU3RhdGUpe1xuICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5yZWdpc3RlclBheW1lbnQoaW52b2ljZS5pZCwgaW52b2ljZS5wYWlkX2F0KVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgIH07XG59KVxuLmZhY3RvcnkoJ0NsdWJJbnZvaWNlc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSAoaWQpID8gJy8nK2lkIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY2x1Ymludm9pY2VzJyt1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxvYWRQZW5kaW5nU2lnbnVwczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY2x1Ymludm9pY2VzL3BlbmRpbmdzaWdudXBzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlSW52b2ljZXM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJpbnZvaWNlcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY2x1Ymludm9pY2VzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZ2lzdGVyUGF5bWVudDogZnVuY3Rpb24oaWQsIHBhaWRfYXQpe1xuXG4gICAgICAgICAgICBwYWlkX2F0ID0gbW9tZW50KG5ldyBEYXRlKHBhaWRfYXQpKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6bW06c3MnKTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJpbnZvaWNlcy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oe3BhaWRfYXQ6IHBhaWRfYXR9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZG93bmxvYWQ6IGZ1bmN0aW9uKGlkKXtcbiAgICAgICAgICAgIGlmKGlkKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjbHViaW52b2ljZXMvJytpZCsnL2Rvd25sb2FkJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VUeXBlOiAnYXJyYXlidWZmZXInLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNsdWJzJywgW10pXG5cbi5jb250cm9sbGVyKFwiQ2x1YkNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIENsdWJzRmFjdG9yeSl7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmZpbHRlciA9IHtcblx0XHR1c2Vyczoge1xuXHRcdFx0c2VhcmNoOiAnJ1xuXHRcdH0sXG5cdFx0aW52b2ljZXM6IHtcblx0XHRcdHNlYXJjaDogJydcblx0XHR9XG5cdH07XG5cblx0c2VsZi5hZGRfYWRtaW4gPSBudWxsO1xuXG5cdGZ1bmN0aW9uIGxvYWRVc2VyQ2x1YigpIHtcblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG5cdFx0Q2x1YnNGYWN0b3J5LmxvYWRVc2VyQ2x1YigpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuc2VsZWN0ZWRDbHVicyA9ICcnO1xuXHRcdFx0XHRpZighcmVzcG9uc2UuaWQpe1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5jb25uZWN0Jywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi51cGRhdGVDbHViID0gZnVuY3Rpb24oKXtcblx0XHRDbHVic0ZhY3RvcnkudXBkYXRlQ2x1YihzZWxmLmNsdWIpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5pbmZvcm1hdGlvbicsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0XHR9KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZFVzZXJBc0FkbWluID0gZnVuY3Rpb24oYWRtaW4pXG5cdHtcblx0XHRpZihhZG1pbil7XG5cdFx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlckFzQWRtaW4oYWRtaW4pXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0bG9hZFVzZXJDbHViKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xuXG5cdHNlbGYuZGVsZXRlVXNlckFzQWRtaW4gPSBmdW5jdGlvbihhZG1pbilcblx0e1xuXHRcdGlmKGFkbWluKXtcblx0XHRcdENsdWJzRmFjdG9yeS5kZWxldGVVc2VyQXNBZG1pbihhZG1pbilcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRsb2FkVXNlckNsdWIoKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG5cblx0bG9hZFVzZXJDbHViKCk7XG59KVxuXG4uY29udHJvbGxlcihcIkNsdWJDb25uZWN0Q29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cdHNlbGYuc2VsZWN0ZWRjbHViID0ge307XG5cdHNlbGYubmV3X2NsdWIgPSBudWxsO1xuXHRzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuXHRzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcblxuXHRmdW5jdGlvbiBsb2FkVXNlckNsdWIoKSB7XG5cdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdENsdWJzRmFjdG9yeS5sb2FkVXNlckNsdWIoKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnNlbGVjdGVkQ2x1YnMgPSAnJztcblx0XHRcdFx0aWYocmVzcG9uc2UuaWQpe1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5pbmZvcm1hdGlvbicsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2VsZi5jbHViID0gcmVzcG9uc2U7XG5cdFx0XHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi5zZWFyY2hGb3JDbHVicyA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5LCBjbHViKVxuXHR7XG5cdFx0cmV0dXJuIENsdWJzRmFjdG9yeVxuXHRcdFx0LnNlYXJjaEZvckNsdWJzKHNlYXJjaFF1ZXJ5KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ3dhcm5pbmcnKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuZm91bmRNYXRjaCA9IChyZXNwb25zZS5kYXRhLmNsdWJzLmxlbmd0aCA+IDApO1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YS5jbHVicy5tYXAoZnVuY3Rpb24oaXRlbSl7XG5cdFx0XHRcdFx0aXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXR1cm4gaXRlbTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLnNlbGVjdENsdWIgPSBmdW5jdGlvbigkaXRlbSlcblx0e1xuXHRcdGlmKCRpdGVtLmFscmVhZHlTZWxlY3RlZCA9PT0gdHJ1ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdHNlbGYubm9NYXRjaGluZ0NsdWJzID0gbnVsbDtcblx0XHRzZWxmLm5ld19jbHViID0gJGl0ZW07XG5cdH07XG5cblx0c2VsZi5ub0NsdWJzRm91bmQgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IHRydWU7XG5cdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdH07XG5cblx0c2VsZi5hZGRVc2VyVG9DbHVicyA9IGZ1bmN0aW9uKGNsdWIpXG5cdHtcblx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlclRvQ2x1YnMoY2x1Yi5pZClcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdFx0XHRcdHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdFx0JHN0YXRlLmdvKCdjbHViLmluZm9ybWF0aW9uJywge30sIHtsb2NhdGlvbjogJ3JlcGxhY2UnfSk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZE5ld0NsdWIgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRpZighc2VsZi5zZWFyY2hRdWVyeSB8fCAhc2VsZi5hZGRfY2x1YnNfbnIpIHJldHVybiBmYWxzZTtcblx0XHR2YXIgY2x1YiA9IHtcblx0XHRcdG5hbWU6IHNlbGYuc2VhcmNoUXVlcnksXG5cdFx0XHRjbHVic19ucjogc2VsZi5hZGRfY2x1YnNfbnJcblx0XHR9O1xuXG5cdFx0Q2x1YnNGYWN0b3J5LmFkZE5ld0NsdWIoY2x1Yilcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuXHRcdFx0XHRzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuXHRcdFx0XHRzZWxmLm5ld19jbHViID0gbnVsbDtcblx0XHRcdFx0c2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG5cdFx0XHRcdHNlbGYuY2x1YiA9IHJlc3BvbnNlO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2NsdWIuaW5mb3JtYXRpb24nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdGxvYWRVc2VyQ2x1YigpO1xuXG59KVxuXG4uZmFjdG9yeSgnQ2x1YnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuXHRyZXR1cm4ge1xuXHRcdGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuXHRcdFx0dmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydjbHVicyc7XG5cblx0XHRcdGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG5cdFx0XHRpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzLycraWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oY2x1Yilcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHR1cGRhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicycsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKGNsdWIpXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvJytjbHViLmlkLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGxvYWRVc2VyQ2x1YjogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2dldFVzZXJDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGRVc2VyVG9DbHViczogZnVuY3Rpb24oY2x1YnNfaWQpe1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2FkZFVzZXJUb0NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19pZCc6IGNsdWJzX2lkfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGROZXdDbHViOiBmdW5jdGlvbihjbHViKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy9hZGROZXdDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19ucic6IGNsdWIuY2x1YnNfbnIsICduYW1lJzogY2x1Yi5uYW1lfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRzZWFyY2hGb3JDbHViczogZnVuY3Rpb24oZmlsdGVyKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvc2VhcmNoJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydzZWFyY2hRdWVyeSc6IGZpbHRlcn0pXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0YWRkVXNlckFzQWRtaW46IGZ1bmN0aW9uKGFkbWluKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvYWRkVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGRlbGV0ZVVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvZGVsZXRlVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jb21wZXRpdGlvbnMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJDb21wZXRpdGlvbnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENvbXBldGl0aW9uc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENvbXBldGl0aW9uc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG5cblxuICAgIHRoaXMubmV4dFBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc2VsZi5wYWdlKys7XG4gICAgICAgIHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcbiAgICAgICAgJHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgfTtcbiAgICB0aGlzLnByZXZQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmIChzZWxmLnBhZ2UgPiAwKSB7XG4gICAgICAgICAgICBzZWxmLnBhZ2UtLTtcbiAgICAgICAgICAgIHVwZGF0ZVBhZ2Uoc2VsZi5wYWdlKTtcbiAgICAgICAgICAgICRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICB0aGlzLnNvcnRDaGFuZ2VkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNvcnRMaXN0KCk7XG4gICAgICAgICRzdGF0ZS5nbygnLicsIHtzb3J0OiBzZWxmLnNvcnR9LCB7bm90aWZ5OiBmYWxzZX0pO1xuICAgIH07XG59KVxuLmNvbnRyb2xsZXIoXCJDb21wZXRpdGlvbkNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgJHRpbWVvdXQsIENvbXBldGl0aW9uc0ZhY3RvcnksIFNpZ251cHNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ29tcGV0aXRpb25zRmFjdG9yeS5maW5kKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9ucyA9IHJlc3BvbnNlLmNvbXBldGl0aW9ucztcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbnMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmNyZWF0ZVNpZ251cCA9IGZ1bmN0aW9uKHdlYXBvbmNsYXNzZXNfaWQpe1xuICAgICAgICBpZihzZWxmLmxvYWRpbmdTdGF0ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIHZhciBzaWdudXAgPSB7XG4gICAgICAgICAgICAnY29tcGV0aXRpb25zX2lkJzogc2VsZi5jb21wZXRpdGlvbnMuaWQsXG4gICAgICAgICAgICAnd2VhcG9uY2xhc3Nlc19pZCc6IHdlYXBvbmNsYXNzZXNfaWQsXG4gICAgICAgICAgICAndXNlcnNfaWQnOiBzZWxmLnVzZXIudXNlcl9pZFxuICAgICAgICB9O1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5jcmVhdGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHJlc3BvbnNlLndlYXBvbmNsYXNzZXNfaWQgPSBwYXJzZUludChyZXNwb25zZS53ZWFwb25jbGFzc2VzX2lkKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9ucy51c2Vyc2lnbnVwcy5wdXNoKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmRlbGV0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cbiAgICAgICAgICAgICAgICAvLyBSZW1vdmUgdGhlIHNoaWZ0IGZyb20gdGhlIGNhbGVuZGFyLlxuICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLmNvbXBldGl0aW9ucy51c2Vyc2lnbnVwcywgZnVuY3Rpb24oc2lnbnVwcywgaW5kZXgpe1xuICAgICAgICAgICAgICAgICAgICBpZihzaWdudXBzLmlkID09IHNpZ251cC5pZClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbnMudXNlcnNpZ251cHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGZpbmQoKTtcbn0pXG5cbi5mYWN0b3J5KCdDb21wZXRpdGlvbnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zJztcblxuICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzVW5kZWZpbmVkKGlkKSAmJiBpZCA+IDApIHVybCArPSAnLycgKyBpZDtcbiAgICAgICAgICAgIGlmIChwYWdlKSB1cmwgKz0gJz9wYWdlPScgKyBwYWdlO1xuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5kYXNoYm9hcmQnLCBbXSlcblxuICAgIC5jb250cm9sbGVyKFwiRGFzaGJvYXJkQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICR0aW1lb3V0KXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICAkc2NvcGUuJG9uKCckdmlld0NvbnRlbnRMb2FkZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgKGZ1bmN0aW9uKGQsIHMsIGlkKSB7XG4gICAgICAgICAgICAgICAgICAgIEZCID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGpzLCBmanMgPSBkLmdldEVsZW1lbnRzQnlUYWdOYW1lKHMpWzBdO1xuICAgICAgICAgICAgICAgICAgICAvL2lmIChkLmdldEVsZW1lbnRCeUlkKGlkKSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBqcyA9IGQuY3JlYXRlRWxlbWVudChzKTsganMuaWQgPSBpZDtcbiAgICAgICAgICAgICAgICAgICAganMuc3JjID0gXCIvL2Nvbm5lY3QuZmFjZWJvb2submV0L3N2X1NFL3Nkay5qcyN4ZmJtbD0xJnZlcnNpb249djIuNiZhcHBJZD05NTY4Njc1MjQzOTgyMjJcIjtcbiAgICAgICAgICAgICAgICAgICAgZmpzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGpzLCBmanMpO1xuICAgICAgICAgICAgICAgIH0oZG9jdW1lbnQsICdzY3JpcHQnLCAnZmFjZWJvb2stanNzZGsnKSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0sIDUwMCk7XG4gICAgICAgIH0pO1xuXG4gICAgfSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZXJyb3JoYW5kbGVyJywgW10pXG5cblx0LmNvbnRyb2xsZXIoXCJFcnJvckhhbmRsZXJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgRXJyb3JIYW5kbGVyRmFjdG9yeSl7XG5cblx0fSlcblxuXHQuZmFjdG9yeSgnRXJyb3JIYW5kbGVyRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cblx0XHRyZXR1cm4ge1xuXG5cdFx0XHRyZXBvcnRFcnJvcjogZnVuY3Rpb24oZXJyb3IsIGNhdXNlKSB7XG5cdFx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnZXJyb3IvcmVwb3J0Jyxcblx0XHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0XHRkYXRhOiAkLnBhcmFtKHtlcnJvcjogZXJyb3IsIGNhdXNlOiBjYXVzZX0pXG5cdFx0XHRcdH0pO1xuXHRcdFx0fVxuXG5cdFx0fTtcblxuXHR9KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuaW52b2ljZXMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJHZW5lcmF0ZUludm9pY2VzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgSW52b2ljZXNGYWN0b3J5KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbG9hZEludm9pY2VzKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgSW52b2ljZXNGYWN0b3J5LmxvYWRQZW5kaW5nU2lnbnVwcygpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzID0gcmVzcG9uc2Uuc2lnbnVwcztcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuY3JlYXRlSW52b2ljZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgSW52b2ljZXNGYWN0b3J5LmNyZWF0ZUludm9pY2VzKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdzdWNjZXNzJyk7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdpbnZvaWNlcy5pbmRleCcpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxvYWRJbnZvaWNlcygpO1xufSlcbi5jb250cm9sbGVyKFwiSW52b2ljZXNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBJbnZvaWNlc0ZhY3RvcnksICR1aWJNb2RhbCwgRmlsZVNhdmVyLCBCbG9iKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbG9hZEludm9pY2VzKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgSW52b2ljZXNGYWN0b3J5LmxvYWQoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuaW52b2ljZXNfaW5jb21pbmcgPSByZXNwb25zZS5pbnZvaWNlc19pbmNvbWluZztcbiAgICAgICAgICAgICAgICBzZWxmLmludm9pY2VzX291dGdvaW5nID0gcmVzcG9uc2UuaW52b2ljZXNfb3V0Z29pbmc7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlc19nZW5lcmF0ZSA9IHJlc3BvbnNlLmludm9pY2VzX2dlbmVyYXRlO1xuICAgICAgICAgICAgICAgIHNlbGYuaGlkZVNpZ251cHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi5vcGVuUGF5bWVudE1vZGFsID0gZnVuY3Rpb24oaW52b2ljZSl7XG5cbiAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICBhbmltYXRpb246IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ0ludm9pY2VQYXltZW50TW9kYWwuaHRtbCcsXG4gICAgICAgICAgICBjb250cm9sbGVyOiAnSW52b2ljZVBheW1lbnRNb2RhbENvbnRyb2xsZXIgYXMgbW9kYWxjb250cm9sbGVyJyxcbiAgICAgICAgICAgIHNpemU6ICdtZCcsXG4gICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgaW52b2ljZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW52b2ljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZEludm9pY2VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRvd25sb2FkID0gZnVuY3Rpb24oaW52b2ljZSl7XG4gICAgICAgIEludm9pY2VzRmFjdG9yeS5kb3dubG9hZChpbnZvaWNlLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gbmV3IEJsb2IoW3Jlc3BvbnNlXSwge3R5cGU6ICdhcHBsaWNhdGlvbi9wZGYnfSk7XG4gICAgICAgICAgICAgICAgaWYoZmlsZS5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIEZpbGVTYXZlci5zYXZlQXMoZmlsZSwgJ2ludm9pY2UtJyArIGludm9pY2UuaW52b2ljZV9yZWZlcmVuY2UgKyAnLnBkZicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsb2FkSW52b2ljZXMoKTtcbn0pXG4uY29udHJvbGxlcihcIkludm9pY2VDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBJbnZvaWNlc0ZhY3RvcnksIEZpbGVTYXZlciwgQmxvYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBsb2FkSW52b2ljZXMoKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBJbnZvaWNlc0ZhY3RvcnkubG9hZCgkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgaWYoIXJlc3BvbnNlLmludm9pY2UpICRzdGF0ZS5nbygnaW52b2ljZXMuaW5kZXgnKTtcbiAgICAgICAgICAgICAgICBzZWxmLmludm9pY2UgPSByZXNwb25zZS5pbnZvaWNlO1xuICAgICAgICAgICAgICAgIHNlbGYuaGlkZVNpZ251cHMgPSB0cnVlO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi5kb3dubG9hZCA9IGZ1bmN0aW9uKGludm9pY2Upe1xuICAgICAgICBJbnZvaWNlc0ZhY3RvcnkuZG93bmxvYWQoaW52b2ljZS5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuICAgICAgICAgICAgICAgIGlmKGZpbGUuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsICdpbnZvaWNlLScgKyBpbnZvaWNlLmludm9pY2VfcmVmZXJlbmNlICsgJy5wZGYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgbG9hZEludm9pY2VzKCk7XG59KVxuLmNvbnRyb2xsZXIoJ0ludm9pY2VQYXltZW50TW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsIGludm9pY2UsIEludm9pY2VzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBcbiAgICBzZWxmLm9wdGlvbnMgPSB7XG4gICAgICAgIHNob3dXZWVrczogdHJ1ZSxcbiAgICAgICAgc3RhcnRpbmdEYXk6IDEsXG4gICAgICAgIG1heERhdGU6IG5ldyBEYXRlKCksXG4gICAgICAgIG1pbkRhdGU6IG1vbWVudChpbnZvaWNlLmludm9pY2VfZGF0ZSkuc3RhcnRPZignZGF5JylcbiAgICB9O1xuICAgIHNlbGYuaW52b2ljZSA9IGFuZ3VsYXIuY29weShpbnZvaWNlKTtcblxuICAgIHNlbGYucmVnaXN0ZXJQYXltZW50ID0gZnVuY3Rpb24gKGludm9pY2UpIHtcbiAgICAgICAgaWYoaW52b2ljZS5wYWlkX2F0ICYmICFzZWxmLmxvYWRpbmdTdGF0ZSl7XG4gICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgICAgICBJbnZvaWNlc0ZhY3RvcnkucmVnaXN0ZXJQYXltZW50KGludm9pY2UuaWQsIGludm9pY2UucGFpZF9hdClcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmNsb3NlKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuY2FuY2VsID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5kaXNtaXNzKCdjYW5jZWwnKTtcbiAgICB9O1xufSlcbi5mYWN0b3J5KCdJbnZvaWNlc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSAoaWQpID8gJy8nK2lkIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnaW52b2ljZXMnK3VybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgbG9hZFBlbmRpbmdTaWdudXBzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydpbnZvaWNlcy9wZW5kaW5nc2lnbnVwcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZUludm9pY2VzOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydpbnZvaWNlcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnaW52b2ljZXMvJytpZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgcmVnaXN0ZXJQYXltZW50OiBmdW5jdGlvbihpZCwgcGFpZF9hdCl7XG5cbiAgICAgICAgICAgIHBhaWRfYXQgPSBtb21lbnQobmV3IERhdGUocGFpZF9hdCkpLmZvcm1hdCgnWVlZWS1NTS1ERCBISDptbTpzcycpO1xuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnaW52b2ljZXMvJytpZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHtwYWlkX2F0OiBwYWlkX2F0fSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRvd25sb2FkOiBmdW5jdGlvbihpZCl7XG4gICAgICAgICAgICBpZihpZCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnaW52b2ljZXMvJytpZCsnL2Rvd25sb2FkJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VUeXBlOiAnYXJyYXlidWZmZXInLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5wcmVtaXVtJywgW10pXG4uY29udHJvbGxlcihcIlByZW1pdW1Db250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBQcmVtaXVtRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIFxuICAgIHNlbGYubG9hZFByZW1pdW0gPSBmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFByZW1pdW1GYWN0b3J5LmxvYWRQcmVtaXVtKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWIgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYucmVnaXN0ZXJQcmVtaXVtID0gZnVuY3Rpb24oKXtcbiAgICAgICAgUHJlbWl1bUZhY3RvcnkucmVnaXN0ZXJQcmVtaXVtKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWIgPSByZXNwb25zZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYubG9hZFByZW1pdW0oKTtcbn0pXG4uZmFjdG9yeSgnUHJlbWl1bUZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpIHtcbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkUHJlbWl1bTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwgKyAncHJlbWl1bScsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZ2lzdGVyUHJlbWl1bTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsICsgJ3ByZW1pdW0nLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc2V0dGluZ3MnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJTZXR0aW5nc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIFNldHRpbmdzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYuY2FuY2VsYWNjb3VudCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgU2V0dGluZ3NGYWN0b3J5LmNhbmNlbGFjY291bnQoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9nb3V0Jyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLmVycm9yKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcbn0pXG5cbi5jb250cm9sbGVyKFwiUGFzc3dvcmRDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBTZXR0aW5nc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLnJlc2V0ID0ge1xuICAgICAgICAnY3VycmVudF9wYXNzd29yZCc6JycsXG4gICAgICAgICdwYXNzd29yZCc6ICcnLFxuICAgICAgICAncGFzc3dvcmRfY29uZmlybWF0aW9uJzonJ1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZVBhc3N3b3JkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIFNldHRpbmdzRmFjdG9yeS51cGRhdGVQYXNzd29yZChzZWxmLnJlc2V0KVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYucmVzZXQgPSB7XG4gICAgICAgICAgICAgICAgICAgICdjdXJyZW50X3Bhc3N3b3JkJzonJyxcbiAgICAgICAgICAgICAgICAgICAgJ3Bhc3N3b3JkJzogJycsXG4gICAgICAgICAgICAgICAgICAgICdwYXNzd29yZF9jb25maXJtYXRpb24nOicnXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxufSlcblxuLmNvbnRyb2xsZXIoXCJVc2VyUHJvZmlsZUNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIFNldHRpbmdzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGxvYWRVc2VycHJvZmlsZSgpIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTZXR0aW5nc0ZhY3RvcnkubG9hZFVzZXJwcm9maWxlKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJwcm9maWxlID0gcmVzcG9uc2UudXNlcjtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi5kYXRlUGlja2VyT3B0aW9ucyA9IHtzdGFydGluZ0RheTogMSwgc3RhcnQ6IHtvcGVuZWQ6IGZhbHNlfSwgZW5kOiB7b3BlbmVkOiBmYWxzZX19O1xuXG4gICAgc2VsZi5zYXZlVXNlcnByb2ZpbGUgPSBmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFNldHRpbmdzRmFjdG9yeS5zYXZlVXNlcnByb2ZpbGUoc2VsZi51c2VycHJvZmlsZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2Uuc2V0SXRlbSgndXNlcicsIEpTT04uc3RyaW5naWZ5KHJlc3BvbnNlLnVzZXIpKTtcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXJwcm9maWxlID0gcmVzcG9uc2UudXNlcjtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2V0dGluZ3MudXNlcicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmNhbmNlbFVzZXJwcm9maWxlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgbG9hZFVzZXJwcm9maWxlKCk7XG4gICAgICAgICRzdGF0ZS5nbygnc2V0dGluZ3MudXNlcicpO1xuICAgIH07XG5cbiAgICBsb2FkVXNlcnByb2ZpbGUoKTtcblxufSlcblxuLmNvbnRyb2xsZXIoXCJVc2VyQ2x1YnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBDbHVic0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYuc2VhcmNoUXVlcnkgPSAnJztcbiAgICBzZWxmLm5ld19jbHViID0gbnVsbDtcbiAgICBzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuICAgIHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuXG4gICAgZnVuY3Rpb24gbG9hZFVzZXJDbHVicygpIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDbHVic0ZhY3RvcnkubG9hZFVzZXJDbHVicygpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5zZWxlY3RlZENsdWJzID0gJyc7XG4gICAgICAgICAgICAgICAgc2VsZi5jbHVicyA9IHJlc3BvbnNlLmNsdWJzO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLnNlYXJjaEZvckNsdWJzID0gZnVuY3Rpb24oc2VhcmNoUXVlcnksIGNsdWJzKVxuICAgIHtcbiAgICAgICAgcmV0dXJuIENsdWJzRmFjdG9yeVxuICAgICAgICAgICAgLnNlYXJjaEZvckNsdWJzKHNlYXJjaFF1ZXJ5KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnd2FybmluZycpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmZvdW5kTWF0Y2ggPSAocmVzcG9uc2UuZGF0YS5jbHVicy5sZW5ndGggPiAwKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzcG9uc2UuZGF0YS5jbHVicy5tYXAoZnVuY3Rpb24oaXRlbSl7XG4gICAgICAgICAgICAgICAgICAgIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjbHVicywgZnVuY3Rpb24oY2x1Yil7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5zZWxlY3RDbHViID0gZnVuY3Rpb24oJGl0ZW0pXG4gICAge1xuICAgICAgICBpZigkaXRlbS5hbHJlYWR5U2VsZWN0ZWQgPT09IHRydWUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2VsZi5ub01hdGNoaW5nQ2x1YnMgPSBudWxsO1xuICAgICAgICBzZWxmLm5ld19jbHViID0gJGl0ZW07IFxuICAgIH07XG5cbiAgICBzZWxmLm5vQ2x1YnNGb3VuZCA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgIGNvbnNvbGUubG9nKDEyMzQpO1xuICAgICAgICBzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IHRydWU7XG4gICAgICAgIHNlbGYubmV3X2NsdWIgPSBudWxsO1xuICAgIH07XG5cbiAgICBzZWxmLmFkZFVzZXJUb0NsdWJzID0gZnVuY3Rpb24oY2x1YilcbiAgICB7XG4gICAgICAgIENsdWJzRmFjdG9yeS5hZGRVc2VyVG9DbHVicyhjbHViLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYubmV3X2NsdWIgPSBudWxsO1xuICAgICAgICAgICAgICAgIHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YnMgPSByZXNwb25zZS5jbHVicztcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmFkZE5ld0NsdWIgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICBpZighc2VsZi5zZWFyY2hRdWVyeSB8fCAhc2VsZi5hZGRfY2x1YnNfbnIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdmFyIGNsdWIgPSB7XG4gICAgICAgICAgICBuYW1lOiBzZWxmLnNlYXJjaFF1ZXJ5LFxuICAgICAgICAgICAgY2x1YnNfbnI6IHNlbGYuYWRkX2NsdWJzX25yXG4gICAgICAgIH07XG5cbiAgICAgICAgQ2x1YnNGYWN0b3J5LmFkZE5ld0NsdWIoY2x1YilcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG4gICAgICAgICAgICAgICAgc2VsZi5hZGRfY2x1YnNfbnIgPSAnJztcbiAgICAgICAgICAgICAgICBzZWxmLm5ld19jbHViID0gbnVsbDtcbiAgICAgICAgICAgICAgICBzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgbG9hZFVzZXJDbHVicygpO1xufSlcblxuLmNvbnRyb2xsZXIoXCJJbnZpdGVDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBJbnZpdGVGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmxvYWRJbnZpdGVzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIEludml0ZUZhY3RvcnkubG9hZEludml0ZXMoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuaW52aXRlcyA9IHJlc3BvbnNlLmludml0ZXM7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuICAgIHNlbGYubG9hZEludml0ZXMoKTtcblxuICAgIHNlbGYuaW52aXRlID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBJbnZpdGVGYWN0b3J5XG4gICAgICAgICAgICAuaW52aXRlKHNlbGYudXNlcilcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBsYXN0bmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgIGVtYWlsOiAnJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkSW52aXRlcygpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xufSlcblxuLmZhY3RvcnkoXCJJbnZpdGVGYWN0b3J5XCIsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZEludml0ZXM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsndXNlcnMvaW52aXRlJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW52aXRlOiBmdW5jdGlvbih1c2VyKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzL2ludml0ZScsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh1c2VyKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KVxuXG4uZmFjdG9yeShcIlNldHRpbmdzRmFjdG9yeVwiLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWRVc2VycHJvZmlsZTogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXNlcicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhdmVVc2VycHJvZmlsZTogZnVuY3Rpb24odXNlcil7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGFuZ3VsYXIuY29weSh1c2VyKTtcbiAgICAgICAgICAgIGRhdGEuYmlydGhkYXkgPSBkYXRhLmJpcnRoZGF5KyctMDEtMDEnO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2F1dGhlbnRpY2F0ZS91c2VyJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVQYXNzd29yZDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXBkYXRlUGFzc3dvcmQnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oY3JlZGVudGlhbHMpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjYW5jZWxhY2NvdW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYXV0aGVudGljYXRlL2NhbmNlbEFjY291bnQnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuc2lnbnVwcycsIFtdKVxuXG4uY29udHJvbGxlcihcIlNpZ251cHNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIFNpZ251cHNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5sb2FkKHBhZ2UpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzID0gcmVzcG9uc2Uuc2lnbnVwcztcbiAgICAgICAgICAgICAgICBzZWxmLmludm9pY2VzX2dlbmVyYXRlID0gcmVzcG9uc2UuaW52b2ljZXNfZ2VuZXJhdGU7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzb3J0TGlzdCgpIHt9XG5cbiAgICB0aGlzLnBhZ2UgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMucGFnZSwgMTApO1xuICAgIHRoaXMuc29ydCA9ICRzdGF0ZVBhcmFtcy5zb3J0O1xuICAgIHRoaXMuc29ydE9wdGlvbnMgPSBbJ3Vwdm90ZXMnLCAnZGF0ZScsICdhdXRob3InXTtcbiAgICBzb3J0TGlzdCgpO1xuICAgIHVwZGF0ZVBhZ2UoKTtcbn0pXG4uY29udHJvbGxlcihcIlNpZ251cENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgJHRpbWVvdXQsIFNpZ251cHNGYWN0b3J5KSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZmluZCgpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzaWdudXBzJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYudXBkYXRlU2lnbnVwID0gZnVuY3Rpb24oc2lnbnVwKXtcbiAgICAgICAgc2VsZi5zdGF0ZSA9ICd1cGRhdGluZyc7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LnVwZGF0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICByZXNwb25zZS5zaWdudXBzLnBhcnRpY2lwYXRlX291dF9vZl9jb21wZXRpdGlvbiA9IHBhcnNlSW50KHJlc3BvbnNlLnNpZ251cHMucGFydGljaXBhdGVfb3V0X29mX2NvbXBldGl0aW9uKTtcbiAgICAgICAgICAgICAgICByZXNwb25zZS5zaWdudXBzLndlYXBvbmNsYXNzZXNfaWQgPSBwYXJzZUludChyZXNwb25zZS5zaWdudXBzLndlYXBvbmNsYXNzZXNfaWQpO1xuICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcy5zaWdudXBzID0gcmVzcG9uc2Uuc2lnbnVwcztcbiAgICAgICAgICAgICAgICBzZWxmLnN0YXRlID0gJ3VwZGF0ZWQnO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2lnbnVwJywgKHtpZDogc2lnbnVwLmlkfSkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmRlbGV0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzaWdudXBzJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG5cblxuICAgIGZpbmQoKTtcbn0pXG4uY29udHJvbGxlcihcIkNsdWJTaWdudXBDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR0aW1lb3V0LCBTaWdudXBzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRDbHViU2lnbnVwcygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmxvYWRDbHViU2lnbnVwcygkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbiA9IHJlc3BvbnNlLmNvbXBldGl0aW9uO1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YiA9IHJlc3BvbnNlLmNsdWI7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuXG4gICAgc2VsZi5jcmVhdGVTaWdudXAgPSBmdW5jdGlvbih1c2VyX2lkLCB3ZWFwb25jbGFzc2VzX2lkKXtcbiAgICAgICAgaWYoc2VsZi5sb2FkaW5nU3RhdGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICB2YXIgc2lnbnVwID0ge1xuICAgICAgICAgICAgJ2NvbXBldGl0aW9uc19pZCc6ICRzdGF0ZVBhcmFtcy5pZCxcbiAgICAgICAgICAgICd3ZWFwb25jbGFzc2VzX2lkJzogd2VhcG9uY2xhc3Nlc19pZCxcbiAgICAgICAgICAgICd1c2Vyc19pZCc6IHVzZXJfaWRcbiAgICAgICAgfTtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkuY3JlYXRlU2lnbnVwKHNpZ251cClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXNwb25zZS53ZWFwb25jbGFzc2VzX2lkID0gcGFyc2VJbnQocmVzcG9uc2Uud2VhcG9uY2xhc3Nlc19pZCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbi5zaWdudXBzLnB1c2gocmVzcG9uc2UpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuZGVsZXRlU2lnbnVwID0gZnVuY3Rpb24oc2lnbnVwKXtcbiAgICAgICAgaWYoc2VsZi5sb2FkaW5nU3RhdGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5kZWxldGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzaGlmdCBmcm9tIHRoZSBjYWxlbmRhci5cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5jb21wZXRpdGlvbi5zaWdudXBzLCBmdW5jdGlvbihzaWdudXBzLCBpbmRleCl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cHMuaWQgPT0gc2lnbnVwLmlkKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9uLnNpZ251cHMuc3BsaWNlKGluZGV4LCAxKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgICBsb2FkQ2x1YlNpZ251cHMoKTtcbn0pXG4uZmFjdG9yeSgnU2lnbnVwc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpIHtcblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgbG9hZDogZnVuY3Rpb24gKHBhZ2UsIGlkKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydzaWdudXAnO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFhbmd1bGFyLmlzVW5kZWZpbmVkKGlkKSAmJiBpZCA+IDApIHVybCArPSAnLycgKyBpZDtcbiAgICAgICAgICAgICAgICBpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydzaWdudXAvJytpZCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGNyZWF0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cCcsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHNpZ251cClcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHVwZGF0ZVNpZ251cDogZnVuY3Rpb24oc2lnbnVwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwLycrc2lnbnVwLmlkLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBkZWxldGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cC8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGxvYWRDbHViU2lnbnVwczogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCArICdjb21wZXRpdGlvbnMvJyArIGNvbXBldGl0aW9uc19pZCArICcvY2x1YnNpZ251cHMnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pO1xuXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnRlYW1zJywgW10pXG4uY29udHJvbGxlcignVGVhbVNpZ251cENvbnRyb2xsZXInLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDb21wZXRpdGlvbnNGYWN0b3J5LCBUZWFtc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRUZWFtcygpIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBpZigkc3RhdGVQYXJhbXMudGVhbXNfaWQpe1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LmxvYWQoJHN0YXRlUGFyYW1zLmlkLCAkc3RhdGVQYXJhbXMudGVhbXNfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRlYW1zID0gcmVzcG9uc2UudGVhbXM7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwc19vcmRpbmFyeV9hdmFpbGFibGUgPSByZXNwb25zZS5zaWdudXBzX29yZGluYXJ5X2F2YWlsYWJsZTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzX3Jlc2VydmVfYXZhaWxhYmxlID0gcmVzcG9uc2Uuc2lnbnVwc19yZXNlcnZlX2F2YWlsYWJsZTtcblxuICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi50ZWFtcy5zaWdudXBzLCBmdW5jdGlvbihzaWdudXAsIGtleSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gMSkgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX2ZpcnN0ICA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSAyKSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfc2Vjb25kID0gc2lnbnVwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDMpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc190aGlyZCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSA0KSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfZm91cnRoID0gc2lnbnVwLmlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDUpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc19maWZ0aCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICAgICAgc2VsZi50ZWFtcy5zaWdudXBzID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblxuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LmxvYWQoJHN0YXRlUGFyYW1zLmlkLCAkc3RhdGVQYXJhbXMudGVhbXNfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmFkZFRlYW0gPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHdlYXBvbmdyb3Vwc19pZDogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX2ZpcnN0OiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19zZWNvbmQ6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX3RoaXJkOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19mb3VydGg6IG51bGwsXG4gICAgICAgICAgICAgICAgICAgICAgICB0ZWFtc19zaWdudXBzX2ZpZnRoOiBudWxsXG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGVhbXMgPSByZXNwb25zZS50ZWFtcztcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzX29yZGluYXJ5X2F2YWlsYWJsZSA9IHJlc3BvbnNlLnNpZ251cHNfb3JkaW5hcnlfYXZhaWxhYmxlO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHNfcmVzZXJ2ZV9hdmFpbGFibGUgPSByZXNwb25zZS5zaWdudXBzX3Jlc2VydmVfYXZhaWxhYmxlO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH1cblxuICAgIHNlbGYuY3JlYXRlVGVhbSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGlmKHNlbGYuYWRkVGVhbS5uYW1lICYmIHNlbGYuYWRkVGVhbS53ZWFwb25ncm91cHNfaWQpe1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LnN0b3JlKCRzdGF0ZVBhcmFtcy5pZCwgc2VsZi5hZGRUZWFtKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5yZWRpcmVjdF90b19lZGl0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMuZWRpdCcsIHtpZDogJHN0YXRlUGFyYW1zLmlkLCB0ZWFtc19pZDogcmVzcG9uc2UucmVkaXJlY3RfdG9fZWRpdH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIFxuICAgIHNlbGYudXBkYXRlVGVhbSA9IGZ1bmN0aW9uKHRlYW0pe1xuICAgICAgICBpZihzZWxmLnRlYW1zLm5hbWUgJiYgc2VsZi50ZWFtcy53ZWFwb25ncm91cHNfaWQpe1xuICAgICAgICAgICAgVGVhbXNGYWN0b3J5LnVwZGF0ZSgkc3RhdGVQYXJhbXMuaWQsIHNlbGYudGVhbXMuaWQsIHRlYW0pXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzJywge2lkOiAkc3RhdGVQYXJhbXMuaWR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLnJlZGlyZWN0X3RvX2VkaXQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcy5lZGl0Jywge2lkOiAkc3RhdGVQYXJhbXMuaWQsIHRlYW1zX2lkOiByZXNwb25zZS5yZWRpcmVjdF90b19lZGl0fSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmNhbmNlbFRlYW0gPSBmdW5jdGlvbigpe1xuICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzJyx7aWQ6ICRzdGF0ZVBhcmFtcy5pZH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZVRlYW0gPSBmdW5jdGlvbih0ZWFtc19pZCl7XG4gICAgICAgIGlmKHRlYW1zX2lkKXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS5kZWxldGUoJHN0YXRlUGFyYW1zLmlkLCB0ZWFtc19pZClcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzJywge2lkOiAkc3RhdGVQYXJhbXMuaWR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgbG9hZFRlYW1zKCk7XG5cbn0pXG4uZmFjdG9yeSgnVGVhbXNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKGNvbXBldGl0aW9uc19pZCwgdGVhbXNfaWQpIHtcbiAgICAgICAgICAgIGlmKGNvbXBldGl0aW9uc19pZCAmJiB0ZWFtc19pZCl7XG4gICAgICAgICAgICAgICAgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzLycrdGVhbXNfaWQ7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHVybCA9IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzdG9yZTogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkLCB0ZWFtKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0odGVhbSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkLCB0ZWFtc19pZCwgdGVhbSl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMvJyt0ZWFtc19pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHRlYW0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZWxldGU6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgdGVhbXNfaWQpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzLycrdGVhbXNfaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnVzZXJzJywgW10pXG5cbi5jb250cm9sbGVyKFwiVXNlckNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIFVzZXJzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGxvYWRVc2VyKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgaWYoJHN0YXRlUGFyYW1zLnVzZXJfaWQpe1xuICAgICAgICAgICAgVXNlcnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLnVzZXJfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSByZXNwb25zZTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnVzZXIgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBzZWxmLnVzZXIgPSB7fTtcbiAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbG9hZFVzZXIoKTtcblxuICAgIHNlbGYuc2F2ZVVzZXIgPSBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgVXNlcnNGYWN0b3J5LnNhdmVVc2VyKHVzZXIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjbHViLnVzZXJzLmluZGV4Jywge30sIHtsb2NhdGlvbjogJ3JlbG9hZCd9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuY3JlYXRlVXNlciA9IGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICBpZihzZWxmLmxvYWRpbmdTdGF0ZSkgcmV0dXJuIGZhbHNlO1xuICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFVzZXJzRmFjdG9yeS5jcmVhdGVVc2VyKHVzZXIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjbHViLnVzZXJzLmluZGV4Jywge30sIHtsb2NhdGlvbjogJ3JlbG9hZCd9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxufSlcblxuLmZhY3RvcnkoJ1VzZXJzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNyZWF0ZVVzZXI6IGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBhbmd1bGFyLmNvcHkodXNlcik7XG4gICAgICAgICAgICBkYXRhLmJpcnRoZGF5ID0gZGF0YS5iaXJ0aGRheSsnLTAxLTAxJztcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsndXNlcnMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oZGF0YSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHNhdmVVc2VyOiBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgICAgIHZhciBkYXRhID0gYW5ndWxhci5jb3B5KHVzZXIpO1xuICAgICAgICAgICAgZGF0YS5iaXJ0aGRheSA9IGRhdGEuYmlydGhkYXkrJy0wMS0wMSc7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsndXNlcnMvJytkYXRhLnVzZXJfaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShkYXRhKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KTtcbiIsIi8qKlxuICogR2xvYmFsIGVycm9yIGhhbmRsaW5nIGZvciB0b3AgbGV2ZWwgZXJyb3JzLlxuICogQ2F0Y2hlcyBhbnkgZXhjZXB0aW9ucyBhbmQgc2VuZHMgdGhlbSB0byB0aGUgJHJvb3RTY29wZS5yZXBvcnRFcnJvciBmdW5jdGlvbi5cbiAqL1xuYXBwLmNvbmZpZyhmdW5jdGlvbigkcHJvdmlkZSkge1xuICAgICRwcm92aWRlLmRlY29yYXRvcihcIiRleGNlcHRpb25IYW5kbGVyXCIsIGZ1bmN0aW9uKCRkZWxlZ2F0ZSwgJGluamVjdG9yKSB7XG5cdFx0cmV0dXJuIGZ1bmN0aW9uKGV4Y2VwdGlvbiwgY2F1c2UpIHtcblx0XHRcdCRkZWxlZ2F0ZShleGNlcHRpb24sIGNhdXNlKTtcblx0XHRcdFxuXHRcdFx0dmFyICRyb290U2NvcGUgPSAkaW5qZWN0b3IuZ2V0KFwiJHJvb3RTY29wZVwiKTtcblx0XHRcdHJldHVybiAkcm9vdFNjb3BlLnJlcG9ydEVycm9yKGV4Y2VwdGlvbiwgY2F1c2UpO1xuXHRcdH07XG5cdH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbiAoJGh0dHBQcm92aWRlcikge1xuICAgICRodHRwUHJvdmlkZXIuaW50ZXJjZXB0b3JzLnB1c2goZnVuY3Rpb24gKCRxLCAkaW5qZWN0b3IsICRyb290U2NvcGUpIHtcbiAgICAgICAgcmV0dXJuIHtcblxuICAgICAgICAgICAgcmVxdWVzdDogZnVuY3Rpb24gKGNvbmZpZykge1xuICAgICAgICAgICAgICAgIC8vIE1ha2Ugc3VyZSB0aGUgdG9rZW4gaXMgc2V0IGZvciB0aGUgcmVxdWVzdC5cbiAgICAgICAgICAgICAgICB2YXIgdG9rZW4gPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICBpZih0b2tlbiAhPT0gbnVsbCl7XG4gICAgICAgICAgICAgICAgICAgIGNvbmZpZy5oZWFkZXJzLkF1dGhvcml6YXRpb24gPSAnQmVhcmVyICcgKyB0b2tlbjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBjb25maWcuaGVhZGVyc1snWC1SZXF1ZXN0ZWQtV2l0aCddID0gJ1hNTEh0dHBSZXF1ZXN0JztcblxuICAgICAgICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvLyBEZXRlY3QgaWYgdGhlIHRva2VuIGhhcyBleHBpcmVkIG9uIGEgaHR0cCBjYWxsLiBSZWZyZXNoIHRoZSB0b2tlbiBhbmQgdHJ5IGFnYWluLlxuICAgICAgICAgICAgcmVzcG9uc2VFcnJvcjogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgQXV0aEZhY3RvcnkgPSAkaW5qZWN0b3IuZ2V0KCdBdXRoRmFjdG9yeScpO1xuICAgICAgICAgICAgICAgIHZhciBzdGF0ZSA9ICRpbmplY3Rvci5nZXQoJyRzdGF0ZScpO1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmRhdGEgIT09IHVuZGVmaW5lZCl7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5kYXRhLmVycm9yID09ICd0b2tlbl9leHBpcmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4ocmVzcG9uc2UuY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5kYXRhLmVycm9yID09ICd1c2VyX2luYWN0aXZlJyB8fCByZXNwb25zZS5kYXRhLmVycm9yID09ICd1c2VyX25vdF9mb3VuZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UuZGF0YS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5nbygnYXV0aC5sb2dpbicsIHt9LCB7bG9jYXRpb246ICdyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAocmVzcG9uc2UuZGF0YS5lcnJvciA9PSAndXNlcl9pc19ub3RfYWRtaW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLmRhdGEubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RhdGUuZ28oJ2Rhc2hib2FyZCcpO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAocmVzcG9uc2UuZGF0YS5lcnJvciA9PSAnYXBpX3ZlcnNpb25fdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5kYXRhLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmVycm9yICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZXJyb3IgPT0gJ3Rva2VuX2V4cGlyZWQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gQXV0aEZhY3RvcnkuYXR0ZW1wdFJlZnJlc2hUb2tlbihyZXNwb25zZS5jb25maWcpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKHJlc3BvbnNlLmVycm9yID09ICd1c2VyX2luYWN0aXZlJyB8fCByZXNwb25zZS5lcnJvciA9PSAndXNlcl9ub3RfZm91bmQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5kYXRhLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0YXRlLmdvKCdhdXRoLmxvZ2luJywge30sIHtsb2NhdGlvbjogJ3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmIChyZXNwb25zZS5lcnJvciA9PSAndXNlcl9pc19ub3RfYWRtaW4nKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmVycm9yID09ICdhcGlfdmVyc2lvbl91cGRhdGUnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gJHEucmVqZWN0KHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICB9O1xuICAgIH0pO1xuXG59KTsiLCIvKlxuKiAgQW5ndWxhckpzIEZ1bGxjYWxlbmRhciBXcmFwcGVyIGZvciB0aGUgSlF1ZXJ5IEZ1bGxDYWxlbmRhclxuKiAgQVBJIEAgaHR0cDovL2Fyc2hhdy5jb20vZnVsbGNhbGVuZGFyL1xuKlxuKiAgQW5ndWxhciBDYWxlbmRhciBEaXJlY3RpdmUgdGhhdCB0YWtlcyBpbiB0aGUgW2V2ZW50U291cmNlc10gbmVzdGVkIGFycmF5IG9iamVjdCBhcyB0aGUgbmctbW9kZWwgYW5kIHdhdGNoZXMgaXQgZGVlcGx5IGNoYW5nZXMuXG4qICAgICAgIENhbiBhbHNvIHRha2UgaW4gbXVsdGlwbGUgZXZlbnQgdXJscyBhcyBhIHNvdXJjZSBvYmplY3QocykgYW5kIGZlZWQgdGhlIGV2ZW50cyBwZXIgdmlldy5cbiogICAgICAgVGhlIGNhbGVuZGFyIHdpbGwgd2F0Y2ggYW55IGV2ZW50U291cmNlIGFycmF5IGFuZCB1cGRhdGUgaXRzZWxmIHdoZW4gYSBjaGFuZ2UgaXMgbWFkZS5cbipcbiovXG5cbmFuZ3VsYXIubW9kdWxlKCd1aS5jYWxlbmRhcicsIFtdKVxuICAuY29uc3RhbnQoJ3VpQ2FsZW5kYXJDb25maWcnLCB7fSlcbiAgLmNvbnRyb2xsZXIoJ3VpQ2FsZW5kYXJDdHJsJywgWyckc2NvcGUnLCAnJHRpbWVvdXQnLCAnJGxvY2FsZScsIGZ1bmN0aW9uKCRzY29wZSwgJHRpbWVvdXQsICRsb2NhbGUpe1xuXG4gICAgICB2YXIgc291cmNlU2VyaWFsSWQgPSAxLFxuICAgICAgICAgIGV2ZW50U2VyaWFsSWQgPSAxLFxuICAgICAgICAgIHNvdXJjZXMgPSAkc2NvcGUuZXZlbnRTb3VyY2VzLFxuICAgICAgICAgIGV4dHJhRXZlbnRTaWduYXR1cmUgPSAkc2NvcGUuY2FsZW5kYXJXYXRjaEV2ZW50ID8gJHNjb3BlLmNhbGVuZGFyV2F0Y2hFdmVudCA6IGFuZ3VsYXIubm9vcCxcblxuICAgICAgICAgIHdyYXBGdW5jdGlvbldpdGhTY29wZUFwcGx5ID0gZnVuY3Rpb24oZnVuY3Rpb25Ub1dyYXApe1xuICAgICAgICAgICAgICB2YXIgd3JhcHBlcjtcblxuICAgICAgICAgICAgICBpZiAoZnVuY3Rpb25Ub1dyYXApe1xuICAgICAgICAgICAgICAgICAgd3JhcHBlciA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgLy8gVGhpcyBoYXBwZW5zIG91dHNpZGUgb2YgYW5ndWxhciBjb250ZXh0IHNvIHdlIG5lZWQgdG8gd3JhcCBpdCBpbiBhIHRpbWVvdXQgd2hpY2ggaGFzIGFuIGltcGxpZWQgYXBwbHkuXG4gICAgICAgICAgICAgICAgICAgICAgLy8gSW4gdGhpcyB3YXkgdGhlIGZ1bmN0aW9uIHdpbGwgYmUgc2FmZWx5IGV4ZWN1dGVkIG9uIHRoZSBuZXh0IGRpZ2VzdC5cblxuICAgICAgICAgICAgICAgICAgICAgIHZhciBhcmdzID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgICAgICAgIHZhciBfdGhpcyA9IHRoaXM7XG4gICAgICAgICAgICAgICAgICAgICAgJHRpbWVvdXQoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZ1bmN0aW9uVG9XcmFwLmFwcGx5KF90aGlzLCBhcmdzKTtcbiAgICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICByZXR1cm4gd3JhcHBlcjtcbiAgICAgICAgICB9O1xuXG4gICAgICB0aGlzLmV2ZW50c0ZpbmdlcnByaW50ID0gZnVuY3Rpb24oZSkge1xuICAgICAgICBpZiAoIWUuX2lkKSB7XG4gICAgICAgICAgZS5faWQgPSBldmVudFNlcmlhbElkKys7XG4gICAgICAgIH1cbiAgICAgICAgLy8gVGhpcyBleHRyYWN0cyBhbGwgdGhlIGluZm9ybWF0aW9uIHdlIG5lZWQgZnJvbSB0aGUgZXZlbnQuIGh0dHA6Ly9qc3BlcmYuY29tL2FuZ3VsYXItY2FsZW5kYXItZXZlbnRzLWZpbmdlcnByaW50LzNcbiAgICAgICAgcmV0dXJuIFwiXCIgKyBlLl9pZCArIChlLmlkIHx8ICcnKSArIChlLnRpdGxlIHx8ICcnKSArIChlLnVybCB8fCAnJykgKyAoK2Uuc3RhcnQgfHwgJycpICsgKCtlLmVuZCB8fCAnJykgK1xuICAgICAgICAgIChlLmFsbERheSB8fCAnJykgKyAoZS5jbGFzc05hbWUgfHwgJycpICsgZXh0cmFFdmVudFNpZ25hdHVyZShlKSB8fCAnJztcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuc291cmNlc0ZpbmdlcnByaW50ID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgcmV0dXJuIHNvdXJjZS5fX2lkIHx8IChzb3VyY2UuX19pZCA9IHNvdXJjZVNlcmlhbElkKyspO1xuICAgICAgfTtcblxuICAgICAgdGhpcy5hbGxFdmVudHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gcmV0dXJuIHNvdXJjZXMuZmxhdHRlbigpOyBidXQgd2UgZG9uJ3QgaGF2ZSBmbGF0dGVuXG4gICAgICAgIHZhciBhcnJheVNvdXJjZXMgPSBbXTtcbiAgICAgICAgZm9yICh2YXIgaSA9IDAsIHNyY0xlbiA9IHNvdXJjZXMubGVuZ3RoOyBpIDwgc3JjTGVuOyBpKyspIHtcbiAgICAgICAgICB2YXIgc291cmNlID0gc291cmNlc1tpXTtcbiAgICAgICAgICBpZiAoYW5ndWxhci5pc0FycmF5KHNvdXJjZSkpIHtcbiAgICAgICAgICAgIC8vIGV2ZW50IHNvdXJjZSBhcyBhcnJheVxuICAgICAgICAgICAgYXJyYXlTb3VyY2VzLnB1c2goc291cmNlKTtcbiAgICAgICAgICB9IGVsc2UgaWYoYW5ndWxhci5pc09iamVjdChzb3VyY2UpICYmIGFuZ3VsYXIuaXNBcnJheShzb3VyY2UuZXZlbnRzKSl7XG4gICAgICAgICAgICAvLyBldmVudCBzb3VyY2UgYXMgb2JqZWN0LCBpZSBleHRlbmRlZCBmb3JtXG4gICAgICAgICAgICB2YXIgZXh0RXZlbnQgPSB7fTtcbiAgICAgICAgICAgIGZvcih2YXIga2V5IGluIHNvdXJjZSl7XG4gICAgICAgICAgICAgIGlmKGtleSAhPT0gJ191aUNhbElkJyAmJiBrZXkgIT09ICdldmVudHMnKXtcbiAgICAgICAgICAgICAgICAgZXh0RXZlbnRba2V5XSA9IHNvdXJjZVtrZXldO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBmb3IodmFyIGVJID0gMDtlSSA8IHNvdXJjZS5ldmVudHMubGVuZ3RoO2VJKyspe1xuICAgICAgICAgICAgICBhbmd1bGFyLmV4dGVuZChzb3VyY2UuZXZlbnRzW2VJXSxleHRFdmVudCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBhcnJheVNvdXJjZXMucHVzaChzb3VyY2UuZXZlbnRzKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gQXJyYXkucHJvdG90eXBlLmNvbmNhdC5hcHBseShbXSwgYXJyYXlTb3VyY2VzKTtcbiAgICAgIH07XG5cbiAgICAgIC8vIFRyYWNrIGNoYW5nZXMgaW4gYXJyYXkgYnkgYXNzaWduaW5nIGlkIHRva2VucyB0byBlYWNoIGVsZW1lbnQgYW5kIHdhdGNoaW5nIHRoZSBzY29wZSBmb3IgY2hhbmdlcyBpbiB0aG9zZSB0b2tlbnNcbiAgICAgIC8vIGFyZ3VtZW50czpcbiAgICAgIC8vICBhcnJheVNvdXJjZSBhcnJheSBvZiBmdW5jdGlvbiB0aGF0IHJldHVybnMgYXJyYXkgb2Ygb2JqZWN0cyB0byB3YXRjaFxuICAgICAgLy8gIHRva2VuRm4gZnVuY3Rpb24ob2JqZWN0KSB0aGF0IHJldHVybnMgdGhlIHRva2VuIGZvciBhIGdpdmVuIG9iamVjdFxuICAgICAgdGhpcy5jaGFuZ2VXYXRjaGVyID0gZnVuY3Rpb24oYXJyYXlTb3VyY2UsIHRva2VuRm4pIHtcbiAgICAgICAgdmFyIHNlbGY7XG4gICAgICAgIHZhciBnZXRUb2tlbnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICB2YXIgYXJyYXkgPSBhbmd1bGFyLmlzRnVuY3Rpb24oYXJyYXlTb3VyY2UpID8gYXJyYXlTb3VyY2UoKSA6IGFycmF5U291cmNlO1xuICAgICAgICAgIHZhciByZXN1bHQgPSBbXSwgdG9rZW4sIGVsO1xuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gYXJyYXkubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBlbCA9IGFycmF5W2ldO1xuICAgICAgICAgICAgdG9rZW4gPSB0b2tlbkZuKGVsKTtcbiAgICAgICAgICAgIG1hcFt0b2tlbl0gPSBlbDtcbiAgICAgICAgICAgIHJlc3VsdC5wdXNoKHRva2VuKTtcbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcbiAgICAgICAgLy8gcmV0dXJucyBlbGVtZW50cyBpbiB0aGF0IGFyZSBpbiBhIGJ1dCBub3QgaW4gYlxuICAgICAgICAvLyBzdWJ0cmFjdEFzU2V0cyhbNCwgNSwgNl0sIFs0LCA1LCA3XSkgPT4gWzZdXG4gICAgICAgIHZhciBzdWJ0cmFjdEFzU2V0cyA9IGZ1bmN0aW9uKGEsIGIpIHtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIGluQiA9IHt9LCBpLCBuO1xuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBiLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgaW5CW2JbaV1dID0gdHJ1ZTtcbiAgICAgICAgICB9XG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IGEubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoIWluQlthW2ldXSkge1xuICAgICAgICAgICAgICByZXN1bHQucHVzaChhW2ldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyBNYXAgb2JqZWN0cyB0byB0b2tlbnMgYW5kIHZpY2UtdmVyc2FcbiAgICAgICAgdmFyIG1hcCA9IHt9O1xuXG4gICAgICAgIHZhciBhcHBseUNoYW5nZXMgPSBmdW5jdGlvbihuZXdUb2tlbnMsIG9sZFRva2Vucykge1xuICAgICAgICAgIHZhciBpLCBuLCBlbCwgdG9rZW47XG4gICAgICAgICAgdmFyIHJlcGxhY2VkVG9rZW5zID0ge307XG4gICAgICAgICAgdmFyIHJlbW92ZWRUb2tlbnMgPSBzdWJ0cmFjdEFzU2V0cyhvbGRUb2tlbnMsIG5ld1Rva2Vucyk7XG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IHJlbW92ZWRUb2tlbnMubGVuZ3RoOyBpIDwgbjsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgcmVtb3ZlZFRva2VuID0gcmVtb3ZlZFRva2Vuc1tpXTtcbiAgICAgICAgICAgIGVsID0gbWFwW3JlbW92ZWRUb2tlbl07XG4gICAgICAgICAgICBkZWxldGUgbWFwW3JlbW92ZWRUb2tlbl07XG4gICAgICAgICAgICB2YXIgbmV3VG9rZW4gPSB0b2tlbkZuKGVsKTtcbiAgICAgICAgICAgIC8vIGlmIHRoZSBlbGVtZW50IHdhc24ndCByZW1vdmVkIGJ1dCBzaW1wbHkgZ290IGEgbmV3IHRva2VuLCBpdHMgb2xkIHRva2VuIHdpbGwgYmUgZGlmZmVyZW50IGZyb20gdGhlIGN1cnJlbnQgb25lXG4gICAgICAgICAgICBpZiAobmV3VG9rZW4gPT09IHJlbW92ZWRUb2tlbikge1xuICAgICAgICAgICAgICBzZWxmLm9uUmVtb3ZlZChlbCk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICByZXBsYWNlZFRva2Vuc1tuZXdUb2tlbl0gPSByZW1vdmVkVG9rZW47XG4gICAgICAgICAgICAgIHNlbGYub25DaGFuZ2VkKGVsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG5cbiAgICAgICAgICB2YXIgYWRkZWRUb2tlbnMgPSBzdWJ0cmFjdEFzU2V0cyhuZXdUb2tlbnMsIG9sZFRva2Vucyk7XG4gICAgICAgICAgZm9yIChpID0gMCwgbiA9IGFkZGVkVG9rZW5zLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdG9rZW4gPSBhZGRlZFRva2Vuc1tpXTtcbiAgICAgICAgICAgIGVsID0gbWFwW3Rva2VuXTtcbiAgICAgICAgICAgIGlmICghcmVwbGFjZWRUb2tlbnNbdG9rZW5dKSB7XG4gICAgICAgICAgICAgIHNlbGYub25BZGRlZChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICBzZWxmID0ge1xuICAgICAgICAgIHN1YnNjcmliZTogZnVuY3Rpb24oc2NvcGUsIG9uQ2hhbmdlZCkge1xuICAgICAgICAgICAgc2NvcGUuJHdhdGNoKGdldFRva2VucywgZnVuY3Rpb24obmV3VG9rZW5zLCBvbGRUb2tlbnMpIHtcbiAgICAgICAgICAgICAgaWYgKCFvbkNoYW5nZWQgfHwgb25DaGFuZ2VkKG5ld1Rva2Vucywgb2xkVG9rZW5zKSAhPT0gZmFsc2UpIHtcbiAgICAgICAgICAgICAgICBhcHBseUNoYW5nZXMobmV3VG9rZW5zLCBvbGRUb2tlbnMpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCB0cnVlKTtcbiAgICAgICAgICB9LFxuICAgICAgICAgIG9uQWRkZWQ6IGFuZ3VsYXIubm9vcCxcbiAgICAgICAgICBvbkNoYW5nZWQ6IGFuZ3VsYXIubm9vcCxcbiAgICAgICAgICBvblJlbW92ZWQ6IGFuZ3VsYXIubm9vcFxuICAgICAgICB9O1xuICAgICAgICByZXR1cm4gc2VsZjtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuZ2V0RnVsbENhbGVuZGFyQ29uZmlnID0gZnVuY3Rpb24oY2FsZW5kYXJTZXR0aW5ncywgdWlDYWxlbmRhckNvbmZpZyl7XG4gICAgICAgICAgdmFyIGNvbmZpZyA9IHt9O1xuXG4gICAgICAgICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCB1aUNhbGVuZGFyQ29uZmlnKTtcbiAgICAgICAgICBhbmd1bGFyLmV4dGVuZChjb25maWcsIGNhbGVuZGFyU2V0dGluZ3MpO1xuICAgICAgICAgXG4gICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGNvbmZpZywgZnVuY3Rpb24odmFsdWUsa2V5KXtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09ICdmdW5jdGlvbicpe1xuICAgICAgICAgICAgICBjb25maWdba2V5XSA9IHdyYXBGdW5jdGlvbldpdGhTY29wZUFwcGx5KGNvbmZpZ1trZXldKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHJldHVybiBjb25maWc7XG4gICAgICB9O1xuXG4gICAgdGhpcy5nZXRMb2NhbGVDb25maWcgPSBmdW5jdGlvbihmdWxsQ2FsZW5kYXJDb25maWcpIHtcbiAgICAgIGlmICghZnVsbENhbGVuZGFyQ29uZmlnLmxhbmcgfHwgZnVsbENhbGVuZGFyQ29uZmlnLnVzZU5nTG9jYWxlKSB7XG4gICAgICAgIC8vIENvbmZpZ3VyZSB0byB1c2UgbG9jYWxlIG5hbWVzIGJ5IGRlZmF1bHRcbiAgICAgICAgdmFyIHRWYWx1ZXMgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgLy8gY29udmVydCB7MDogXCJKYW5cIiwgMTogXCJGZWJcIiwgLi4ufSB0byBbXCJKYW5cIiwgXCJGZWJcIiwgLi4uXVxuICAgICAgICAgIHZhciByLCBrO1xuICAgICAgICAgIHIgPSBbXTtcbiAgICAgICAgICBmb3IgKGsgaW4gZGF0YSkge1xuICAgICAgICAgICAgcltrXSA9IGRhdGFba107XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByO1xuICAgICAgICB9O1xuICAgICAgICB2YXIgZHRmID0gJGxvY2FsZS5EQVRFVElNRV9GT1JNQVRTO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIG1vbnRoTmFtZXM6IHRWYWx1ZXMoZHRmLk1PTlRIKSxcbiAgICAgICAgICBtb250aE5hbWVzU2hvcnQ6IHRWYWx1ZXMoZHRmLlNIT1JUTU9OVEgpLFxuICAgICAgICAgIGRheU5hbWVzOiB0VmFsdWVzKGR0Zi5EQVkpLFxuICAgICAgICAgIGRheU5hbWVzU2hvcnQ6IHRWYWx1ZXMoZHRmLlNIT1JUREFZKVxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgcmV0dXJuIHt9O1xuICAgIH07XG4gIH1dKVxuICAuZGlyZWN0aXZlKCd1aUNhbGVuZGFyJywgWyd1aUNhbGVuZGFyQ29uZmlnJywgZnVuY3Rpb24odWlDYWxlbmRhckNvbmZpZykge1xuICAgIHJldHVybiB7XG4gICAgICByZXN0cmljdDogJ0EnLFxuICAgICAgc2NvcGU6IHtldmVudFNvdXJjZXM6Jz1uZ01vZGVsJyxjYWxlbmRhcldhdGNoRXZlbnQ6ICcmJ30sXG4gICAgICBjb250cm9sbGVyOiAndWlDYWxlbmRhckN0cmwnLFxuICAgICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsbSwgYXR0cnMsIGNvbnRyb2xsZXIpIHtcblxuICAgICAgICB2YXIgc291cmNlcyA9IHNjb3BlLmV2ZW50U291cmNlcyxcbiAgICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gZmFsc2UsXG4gICAgICAgICAgICBldmVudFNvdXJjZXNXYXRjaGVyID0gY29udHJvbGxlci5jaGFuZ2VXYXRjaGVyKHNvdXJjZXMsIGNvbnRyb2xsZXIuc291cmNlc0ZpbmdlcnByaW50KSxcbiAgICAgICAgICAgIGV2ZW50c1dhdGNoZXIgPSBjb250cm9sbGVyLmNoYW5nZVdhdGNoZXIoY29udHJvbGxlci5hbGxFdmVudHMsIGNvbnRyb2xsZXIuZXZlbnRzRmluZ2VycHJpbnQpLFxuICAgICAgICAgICAgb3B0aW9ucyA9IG51bGw7XG5cbiAgICAgICAgZnVuY3Rpb24gZ2V0T3B0aW9ucygpe1xuICAgICAgICAgIHZhciBjYWxlbmRhclNldHRpbmdzID0gYXR0cnMudWlDYWxlbmRhciA/IHNjb3BlLiRwYXJlbnQuJGV2YWwoYXR0cnMudWlDYWxlbmRhcikgOiB7fSxcbiAgICAgICAgICAgICAgZnVsbENhbGVuZGFyQ29uZmlnO1xuXG4gICAgICAgICAgZnVsbENhbGVuZGFyQ29uZmlnID0gY29udHJvbGxlci5nZXRGdWxsQ2FsZW5kYXJDb25maWcoY2FsZW5kYXJTZXR0aW5ncywgdWlDYWxlbmRhckNvbmZpZyk7XG5cbiAgICAgICAgICB2YXIgbG9jYWxlRnVsbENhbGVuZGFyQ29uZmlnID0gY29udHJvbGxlci5nZXRMb2NhbGVDb25maWcoZnVsbENhbGVuZGFyQ29uZmlnKTtcbiAgICAgICAgICBhbmd1bGFyLmV4dGVuZChsb2NhbGVGdWxsQ2FsZW5kYXJDb25maWcsIGZ1bGxDYWxlbmRhckNvbmZpZyk7XG5cbiAgICAgICAgICBvcHRpb25zID0geyBldmVudFNvdXJjZXM6IHNvdXJjZXMgfTtcbiAgICAgICAgICBhbmd1bGFyLmV4dGVuZChvcHRpb25zLCBsb2NhbGVGdWxsQ2FsZW5kYXJDb25maWcpO1xuXG4gICAgICAgICAgdmFyIG9wdGlvbnMyID0ge307XG4gICAgICAgICAgZm9yKHZhciBvIGluIG9wdGlvbnMpe1xuICAgICAgICAgICAgaWYobyAhPT0gJ2V2ZW50U291cmNlcycpe1xuICAgICAgICAgICAgICBvcHRpb25zMltvXSA9IG9wdGlvbnNbb107XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiBKU09OLnN0cmluZ2lmeShvcHRpb25zMik7XG4gICAgICAgIH1cblxuICAgICAgICBzY29wZS5kZXN0cm95ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICBpZihzY29wZS5jYWxlbmRhciAmJiBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIpe1xuICAgICAgICAgICAgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKCdkZXN0cm95Jyk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmKGF0dHJzLmNhbGVuZGFyKSB7XG4gICAgICAgICAgICBzY29wZS5jYWxlbmRhciA9IHNjb3BlLiRwYXJlbnRbYXR0cnMuY2FsZW5kYXJdID0gICQoZWxtKS5odG1sKCcnKTtcbiAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2NvcGUuY2FsZW5kYXIgPSAkKGVsbSkuaHRtbCgnJyk7XG4gICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIHNjb3BlLmluaXQgPSBmdW5jdGlvbigpe1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcihvcHRpb25zKTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudFNvdXJjZXNXYXRjaGVyLm9uQWRkZWQgPSBmdW5jdGlvbihzb3VyY2UpIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcignYWRkRXZlbnRTb3VyY2UnLCBzb3VyY2UpO1xuICAgICAgICAgICAgc291cmNlc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50U291cmNlc1dhdGNoZXIub25SZW1vdmVkID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKCdyZW1vdmVFdmVudFNvdXJjZScsIHNvdXJjZSk7XG4gICAgICAgICAgc291cmNlc0NoYW5nZWQgPSB0cnVlO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50c1dhdGNoZXIub25BZGRlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKCdyZW5kZXJFdmVudCcsIGV2ZW50KTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudHNXYXRjaGVyLm9uUmVtb3ZlZCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKCdyZW1vdmVFdmVudHMnLCBmdW5jdGlvbihlKSB7IFxuICAgICAgICAgICAgcmV0dXJuIGUuX2lkID09PSBldmVudC5faWQ7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRzV2F0Y2hlci5vbkNoYW5nZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIGV2ZW50Ll9zdGFydCA9ICQuZnVsbENhbGVuZGFyLm1vbWVudChldmVudC5zdGFydCk7XG4gICAgICAgICAgZXZlbnQuX2VuZCA9ICQuZnVsbENhbGVuZGFyLm1vbWVudChldmVudC5lbmQpO1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigndXBkYXRlRXZlbnQnLCBldmVudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlci5zdWJzY3JpYmUoc2NvcGUpO1xuICAgICAgICBldmVudHNXYXRjaGVyLnN1YnNjcmliZShzY29wZSwgZnVuY3Rpb24obmV3VG9rZW5zLCBvbGRUb2tlbnMpIHtcbiAgICAgICAgICBpZiAoc291cmNlc0NoYW5nZWQgPT09IHRydWUpIHtcbiAgICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gZmFsc2U7XG4gICAgICAgICAgICAvLyBwcmV2ZW50IGluY3JlbWVudGFsIHVwZGF0ZXMgaW4gdGhpcyBjYXNlXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBzY29wZS4kd2F0Y2goZ2V0T3B0aW9ucywgZnVuY3Rpb24obmV3TyxvbGRPKXtcbiAgICAgICAgICAgIHNjb3BlLmRlc3Ryb3koKTtcbiAgICAgICAgICAgIHNjb3BlLmluaXQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcbn1dKTsiLCJhcHAuZGlyZWN0aXZlKCduZ0VudGVyJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBlbGVtZW50LmJpbmQoXCJrZXlkb3duIGtleXByZXNzXCIsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBpZighZXZlbnQuYWx0S2V5ICYmICFldmVudC5zaGlmdEtleSAmJiAhZXZlbnQuY3RybEtleSAmJiBldmVudC53aGljaCA9PT0gMTMpIHtcbiAgICAgICAgICAgICAgICBzY29wZS4kYXBwbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgc2NvcGUuJGV2YWwoYXR0cnMubmdFbnRlciwgeydldmVudCc6IGV2ZW50fSk7XG4gICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmdJbmZpbml0ZVNjcm9sbCcsIGZ1bmN0aW9uKCR3aW5kb3cpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzKSB7XG4gICAgICAgIGFuZ3VsYXIuZWxlbWVudCgkd2luZG93KS5iaW5kKFwic2Nyb2xsXCIsIGZ1bmN0aW9uKCkge1xuXHRcdCAgICB2YXIgd2luZG93SGVpZ2h0IFx0PSBcImlubmVySGVpZ2h0XCIgaW4gd2luZG93ID8gd2luZG93LmlubmVySGVpZ2h0IDogZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50Lm9mZnNldEhlaWdodDtcblx0XHQgICAgdmFyIGJvZHkgXHRcdFx0PSBkb2N1bWVudC5ib2R5LCBodG1sID0gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50O1xuXHRcdCAgICB2YXIgZG9jSGVpZ2h0IFx0XHQ9IE1hdGgubWF4KGJvZHkuc2Nyb2xsSGVpZ2h0LCBib2R5Lm9mZnNldEhlaWdodCwgaHRtbC5jbGllbnRIZWlnaHQsICBodG1sLnNjcm9sbEhlaWdodCwgaHRtbC5vZmZzZXRIZWlnaHQpO1xuXHRcdCAgICB3aW5kb3dCb3R0b20gXHRcdD0gd2luZG93SGVpZ2h0ICsgd2luZG93LnBhZ2VZT2Zmc2V0O1xuXHRcdCAgICBcblx0XHQgICAgaWYgKHdpbmRvd0JvdHRvbSA+PSBkb2NIZWlnaHQpIHtcblx0XHRcdCAgICAvLyBJbnNlcnQgbG9hZGVyIGNvZGUgaGVyZS5cblx0XHRcdCAgICBzY29wZS5vZmZzZXQgPSBzY29wZS5vZmZzZXQgKyBzY29wZS5saW1pdDtcblx0XHQgICAgICAgIHNjb3BlLmxvYWQoKTtcblx0XHQgICAgfVxuXHRcdH0pO1xuICAgIH07XG59KTsiLCJhcHAuZGlyZWN0aXZlKCdzdHJpbmdUb051bWJlcicsIGZ1bmN0aW9uKCkge1xuICByZXR1cm4ge1xuICAgIHJlcXVpcmU6ICduZ01vZGVsJyxcbiAgICBsaW5rOiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMsIG5nTW9kZWwpIHtcbiAgICAgIG5nTW9kZWwuJHBhcnNlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gJycgKyB2YWx1ZTtcbiAgICAgIH0pO1xuICAgICAgbmdNb2RlbC4kZm9ybWF0dGVycy5wdXNoKGZ1bmN0aW9uKHZhbHVlKSB7XG4gICAgICAgIHJldHVybiBwYXJzZUZsb2F0KHZhbHVlLCAxMCk7XG4gICAgICB9KTtcbiAgICB9XG4gIH07XG59KTsiLCJhcHAuZmlsdGVyKCdjdXRTdHJpbmcnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2YWx1ZSwgd29yZHdpc2UsIG1heCwgdGFpbCkge1xuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm4gJyc7XG5cbiAgICAgICAgbWF4ID0gcGFyc2VJbnQobWF4LCAxMCk7XG4gICAgICAgIGlmICghbWF4KSByZXR1cm4gdmFsdWU7XG4gICAgICAgIGlmICh2YWx1ZS5sZW5ndGggPD0gbWF4KSByZXR1cm4gdmFsdWU7XG5cbiAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHIoMCwgbWF4KTtcbiAgICAgICAgaWYgKHdvcmR3aXNlKSB7XG4gICAgICAgICAgICB2YXIgbGFzdHNwYWNlID0gdmFsdWUubGFzdEluZGV4T2YoJyAnKTtcbiAgICAgICAgICAgIGlmIChsYXN0c3BhY2UgIT0gLTEpIHtcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlLnN1YnN0cigwLCBsYXN0c3BhY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHZhbHVlICsgKHRhaWwgfHwgJ+KApicpO1xuICAgIH07XG59KTtcbiIsImFwcC5maWx0ZXIoJ2RhdGVUb0lTTycsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICBpZihpbnB1dCAhPT0gdW5kZWZpbmVkICYmIGlucHV0ICE9PSBudWxsKXtcbiAgICAgICAgICAgIHZhciBhID0gaW5wdXQuc3BsaXQoL1teMC05XS8pO1xuICAgICAgICAgICAgdmFyIGQ9bmV3IERhdGUgKGFbMF0sYVsxXS0xLGFbMl0sYVszXSxhWzRdLGFbNV0gKTtcbiAgICAgICAgICAgIHJldHVybiBuZXcgRGF0ZShkKS50b0lTT1N0cmluZygpO1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFwcC5maWx0ZXIoJ2V4Y2x1ZGVCeUlkcycsIGZ1bmN0aW9uICgpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXRzLGZpbHRlclZhbHVlcykge1xuICAgICAgICB2YXIgb3V0cHV0ID0gW107XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChpbnB1dHMsIGZ1bmN0aW9uIChpbnB1dCkge1xuICAgICAgICAgICAgaWYgKGZpbHRlclZhbHVlcy5pbmRleE9mKGlucHV0LmlkKSA9PSAtMSlcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChpbnB1dCk7XG4gICAgICAgIH0pO1xuICAgICAgICByZXR1cm4gb3V0cHV0O1xuICAgIH07XG59KTsiLCJhcHAuZmlsdGVyKCdpc0VtcHR5JywgW2Z1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihvYmplY3QpIHtcbiAgICAgICAgcmV0dXJuIGFuZ3VsYXIuZXF1YWxzKHt9LCBvYmplY3QpO1xuICAgIH07XG59XSk7IiwiYXBwLmZpbHRlcignbnVtJywgZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgIHJldHVybiBwYXJzZUludChpbnB1dCwgMTApO1xuICAgIH07XG59KTsiLCJhcHAuZmlsdGVyKCdyYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCwgc3RhcnQsIGVuZCkge1xuICAgICAgICBzdGFydCA9IHBhcnNlSW50KHN0YXJ0KTtcbiAgICAgICAgZW5kID0gcGFyc2VJbnQoZW5kKTtcbiAgICAgICAgdmFyIGk7XG4gICAgICAgIGlmKHN0YXJ0IDwgZW5kKXtcbiAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaTxlbmQ7IGkrKylcbiAgICAgICAgICAgICAgICBpbnB1dC5wdXNoKGkpO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIGZvciAoaT1zdGFydDsgaT5lbmQ7IGktLSlcbiAgICAgICAgICAgICAgICBpbnB1dC5wdXNoKGkpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBpbnB1dDtcbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcigncmVuZGVySFRNTENvcnJlY3RseScsIGZ1bmN0aW9uKCRzY2UpXG57XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHN0cmluZ1RvUGFyc2UpXG4gICAge1xuICAgICAgICByZXR1cm4gJHNjZS50cnVzdEFzSHRtbChzdHJpbmdUb1BhcnNlKTtcbiAgICB9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdzdW1CeUtleScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihkYXRhLCBrZXkpIHtcbiAgICAgICAgaWYgKHR5cGVvZihkYXRhKSA9PT0gJ3VuZGVmaW5lZCcgfHwgdHlwZW9mKGtleSkgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBzdW0gPSAwO1xuICAgICAgICBmb3IgKHZhciBpID0gZGF0YS5sZW5ndGggLSAxOyBpID49IDA7IGktLSkge1xuICAgICAgICAgICAgc3VtICs9IHBhcnNlSW50KGRhdGFbaV1ba2V5XSk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH07XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzJywge1xuICAgICAgICB1cmw6ICcvY2x1YnMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5DbHVic0NvbnRyb2xsZXIgYXMgY2x1YnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdycsIHtcbiAgICAgICAgdXJsOiAnLzppZCcsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuc2hvdycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluQ2x1YkNvbnRyb2xsZXIgYXMgY2x1YnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy51c2VycycsIHtcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLnVzZXJzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzLnNob3cuYWRtaW5zJywge1xuICAgICAgICB1cmw6ICcvYWRtaW5zJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLmFkbWlucydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93Lmludm9pY2VzJywge1xuICAgICAgICB1cmw6ICcvaW52b2ljZXMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuaW52b2ljZXMuaW5kZXgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy5zaWdudXBzJywge1xuICAgICAgICB1cmw6ICcvc2lnbnVwcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5zaWdudXBzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzLnNob3cudGVhbXMnLCB7XG4gICAgICAgIHVybDogJy90ZWFtcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy50ZWFtcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93Lmludm9pY2VzLmluY29taW5nJywge1xuICAgICAgICB1cmw6ICcvaW5jb21pbmcnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW5AYWRtaW4uY2x1YnMuc2hvdyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5pbnZvaWNlcy5pbmNvbWluZydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93Lmludm9pY2VzLm91dGdvaW5nJywge1xuICAgICAgICB1cmw6ICcvb3V0Z29pbmcnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW5AYWRtaW4uY2x1YnMuc2hvdyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5pbnZvaWNlcy5vdXRnb2luZydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93Lm1lcmdlJywge1xuICAgICAgICB1cmw6ICcvbWVyZ2UnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMubWVyZ2UnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbicsIHtcbiAgICAgICAgdXJsOiAnL2FkbWluJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uZGFzaGJvYXJkJywge1xuICAgICAgICB1cmw6ICcvZGFzaGJvYXJkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5kYXNoYm9hcmQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pbkRhc2hib2FyZENvbnRyb2xsZXIgYXMgZGFzaGJvYXJkJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uaW52b2ljZXMnLCB7XG4gICAgICAgIHVybDogJy9pbnZvaWNlcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uaW52b2ljZXMuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pbkludm9pY2VzQ29udHJvbGxlciBhcyBpbnZvaWNlcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5pbnZvaWNlcy5zaG93Jywge1xuICAgICAgICB1cmw6ICcvOmlkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5pbnZvaWNlcy5zaG93JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5JbnZvaWNlQ29udHJvbGxlciBhcyBpbnZvaWNlcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLnNpZ251cHMnLCB7XG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB1cmw6ICcvc2lnbnVwcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uc2lnbnVwcy5pbmRleCcsIHtcbiAgICAgICAgdXJsOiAnP2N1cnJlbnRfcGFnZSZwZXJfcGFnZSZzZWFyY2glY29tcGV0aXRpb25zX2lkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5zaWdudXBzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5TaWdudXBzQ29udHJvbGxlciBhcyBzaWdudXBzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIGN1cnJlbnRfcGFnZToge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnMScsXG4gICAgICAgICAgICAgICAgc3F1YXNoOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGVyX3BhZ2U6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzEwJyxcbiAgICAgICAgICAgICAgICBzcXVhc2g6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgc3F1YXNoOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY29tcGV0aXRpb25zX2lkOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6IG51bGwsXG4gICAgICAgICAgICAgICAgc3F1YXNoOiB0cnVlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2VycycsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHVybDogJy91c2VycycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4udXNlcnMuaW5kZXgnLCB7XG4gICAgICAgIHVybDogJz9jdXJyZW50X3BhZ2UmcGVyX3BhZ2Umc2VhcmNoJnN0YXR1cycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4udXNlcnMuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pblVzZXJzQ29udHJvbGxlciBhcyB1c2VycydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBjdXJyZW50X3BhZ2U6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICAgICAgICAgIHNxdWFzaDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBlcl9wYWdlOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICcxMCcsXG4gICAgICAgICAgICAgICAgc3F1YXNoOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgIHNxdWFzaDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHN0YXR1czoge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnYWxsJyxcbiAgICAgICAgICAgICAgICBzcXVhc2g6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2Vycy5zaG93LmVkaXQnLCB7XG4gICAgICAgIHVybDogJy9lZGl0JyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzogeyAgIFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLnVzZXJzLmVkaXQnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4udXNlcnMuc2hvdy5zaWdudXBzJywge1xuICAgICAgICB1cmw6ICcvc2lnbnVwcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi51c2Vycy5zaWdudXBzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLnVzZXJzLnNob3cuaW52b2ljZXMnLCB7XG4gICAgICAgIHVybDogJy9pbnZvaWNlcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi51c2Vycy5pbnZvaWNlcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2Vycy5zaG93Jywge1xuICAgICAgICB1cmw6ICcvOnVzZXJfaWQnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLnVzZXJzLnNob3cnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pblVzZXJDb250cm9sbGVyIGFzIHVzZXInXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbi8vXHQkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cblx0Ly8gQXV0aC5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgnLCB7XG5cdFx0dXJsOiAnL2F1dGgnLFxuXHRcdHBhcmVudDogJ3B1YmxpYycsXG5cdFx0YWJzdHJhY3Q6IHRydWUsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQXV0aENvbnRyb2xsZXInXG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblx0JHVybFJvdXRlclByb3ZpZGVyLndoZW4oJy9hdXRoJywgJy9hdXRoL2xvZ2luJyk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLnJlZ2lzdGVyJywge1xuXHRcdHVybDogJy9yZWdpc3RlcicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcmVnaXN0ZXInXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5pbnZpdGUnLCB7XG5cdFx0dXJsOiAnL3JlZ2lzdGVyLzppbnZpdGVfdG9rZW4nLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL3JlZ2lzdGVyJyxcblx0XHRjb250cm9sbGVyOiAnQXV0aENvbnRyb2xsZXInXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5pbmFjdGl2ZScsIHtcblx0XHR1cmw6ICcvaW5hY3RpdmUnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL2luYWN0aXZlJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGguYWN0aXZhdGUnLCB7XG5cdFx0dXJsOiAnL2FjdGl2YXRlLzp0b2tlbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvYWN0aXZhdGUnLFxuXHRcdGNvbnRyb2xsZXI6ICdBY3RpdmF0aW9uQ29udHJvbGxlcidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmxvZ2luJywge1xuXHRcdHVybDogJy9sb2dpbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvbG9naW4nXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5wYXNzd29yZCcsIHtcblx0XHR1cmw6ICcvcGFzc3dvcmQnLFxuXHRcdHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL3Bhc3N3b3JkJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgucmVzZXQnLCB7XG5cdFx0dXJsOiAnL3Jlc2V0Lzp0b2tlbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcmVzZXQnLFxuXHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCBBdXRoRmFjdG9yeSl7XG5cdFx0XHQkc2NvcGUucmVzZXQgPSB7ZW1haWw6ICcnLCB0b2tlbjogJHN0YXRlUGFyYW1zLnRva2VufTtcblxuXHRcdFx0JHNjb3BlLnJlc2V0UGFzc3dvcmQgPSBmdW5jdGlvbigpXG5cdFx0XHR7XG5cblx0XHRcdFx0QXV0aEZhY3Rvcnlcblx0XHRcdFx0XHQucmVzZXRQYXNzd29yZCgkc2NvcGUucmVzZXQpXG5cdFx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdFx0JHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRcdCRzY29wZS5yZXNldCA9IHtlbWFpbDogJycsIHRva2VuOiAkc3RhdGVQYXJhbXMudG9rZW59O1xuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnBhc3N3b3JkUmVxdWVzdGVkID0gZmFsc2U7XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5kYXRhLnN0YXR1cyAhPT0gJ3N1Y2Nlc3MnKVxuXHRcdFx0XHRcdFx0e1xuXHRcdFx0XHRcdFx0XHQkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0pO1xuXHRcdFx0fTtcblx0XHR9XG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5sb2dvdXQnLCB7XG5cdFx0dXJsOiAnL2xvZ291dCcsXG5cdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oQXV0aEZhY3Rvcnkpe1xuXHRcdFx0QXV0aEZhY3RvcnkubG9nb3V0KCk7XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hhbXBpb25zaGlwcycsIHtcblx0XHR1cmw6ICcvY2hhbXBpb25zaGlwcycsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6e1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jaGFtcGlvbnNoaXBzLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NoYW1waW9uc2hpcHNDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnY2hhbXBpb25zaGlwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjaGFtcGlvbnNoaXAnLCB7XG5cdFx0dXJsOiAnL2NoYW1waW9uc2hpcC86aWQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNoYW1waW9uc2hpcHMuc2hvdycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDaGFtcGlvbnNoaXBDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnY2hhbXBpb25zaGlwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjaGFtcGlvbnNoaXAuc2hvdycsIHtcblx0XHR1cmw6ICcvOnZpZXcnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnbWFpbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XG5cdFx0XHRcdFx0cmV0dXJuICcvdmlld3MvcGFydGlhbHMuY2hhbXBpb25zaGlwcy5zaG93LicrJHN0YXRlUGFyYW1zLnZpZXc7XG5cdFx0XHRcdH0sXG5cdFx0XHRcdGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcyl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5jdXJyZW50VmlldyA9ICRzdGF0ZVBhcmFtcy52aWV3O1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWInLCB7XG4gICAgICAgIHVybDogJy9jbHViJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViQ29udHJvbGxlciBhcyBjbHViJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5jb25uZWN0Jywge1xuICAgICAgICB1cmw6ICcvY2x1Yi9jb25uZWN0JyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmwgOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuY29ubmVjdCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NsdWJDb25uZWN0Q29udHJvbGxlciBhcyBjbHViJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5pbmZvcm1hdGlvbicsIHtcbiAgICAgICAgdXJsOiAnL2luZm9ybWF0aW9uJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5pbmZvcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NsdWJDb250cm9sbGVyIGFzIGNsdWInXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLmVkaXQnLCB7XG4gICAgICAgIHVybDogJy9lZGl0JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5lZGl0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1YkNvbnRyb2xsZXIgYXMgY2x1YidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuYWRtaW5zJywge1xuICAgICAgICB1cmw6ICcvYWRtaW5zJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5hZG1pbnMnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5wcmVtaXVtJywge1xuICAgICAgICB1cmw6ICcvcHJlbWl1bScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLnByZW1pdW0nLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQcmVtaXVtQ29udHJvbGxlciBhcyBwcmVtaXVtJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi51c2VycycsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHVybDogJy91c2VycycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi51c2Vycy5pbmRleCcsIHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi51c2Vycy5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NsdWJDb250cm9sbGVyIGFzIGNsdWInXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnVzZXJzLmVkaXQnLCB7XG4gICAgICAgIHVybDogJy86dXNlcl9pZC9lZGl0JyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi51c2Vycy5lZGl0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXIgYXMgdXNlcidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnVzZXJzLmNyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIudXNlcnMuY3JlYXRlJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXIgYXMgdXNlcidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIudXNlcnMuc2hvdycsIHtcbiAgICAgICAgdXJsOiAnLzp1c2VyX2lkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi51c2Vycy5zaG93JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXIgYXMgdXNlcidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5pbnZvaWNlcycsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHVybDogJy9pbnZvaWNlcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMuaW5kZXgnLCB7XG4gICAgICAgIHVybDogJycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMuaW5jb21pbmcnLCB7XG4gICAgICAgIHVybDogJy9pbmNvbWluZycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMuaW5jb21pbmcnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMub3V0Z29pbmcnLCB7XG4gICAgICAgIHVybDogJy9vdXRnb2luZycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMub3V0Z29pbmcnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMuZ2VuZXJhdGUnLCB7XG4gICAgICAgIHVybDogJy9nZW5lcmF0ZScsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMuZ2VuZXJhdGUnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViR2VuZXJhdGVJbnZvaWNlc0NvbnRyb2xsZXIgYXMgaW52b2ljZXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5pbnZvaWNlcy5zaG93Jywge1xuICAgICAgICB1cmw6ICcvOmlkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5pbnZvaWNlcy5zaG93JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1Ykludm9pY2VDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9ucycsIHtcblx0XHR1cmw6ICcvY29tcGV0aXRpb25zP3BhZ2Umc29ydCcsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6e1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25zQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ2NvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHBhcmFtczoge1xuXHRcdFx0cGFnZToge1xuXHRcdFx0XHR2YWx1ZTogJzAnLFxuXHRcdFx0XHRzcXVhc2g6IHRydWVcblx0XHRcdH0sXG5cdFx0XHRzb3J0OiB7XG5cdFx0XHRcdHZhbHVlOiAnZGF0ZScsXG5cdFx0XHRcdHNxdWFzaDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uJywge1xuXHRcdHVybDogJy9jb21wZXRpdGlvbi86aWQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NvbXBldGl0aW9uQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ2NvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbi5jbHVic2lnbnVwcycsIHtcblx0XHR1cmw6ICcvY2x1YnNpZ251cHMnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnbWFpbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cuY2x1YnNpZ251cHMnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ2x1YlNpZ251cENvbnRyb2xsZXIgYXMgY2x1YnNpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLCB7XG5cdFx0dXJsOiAnL3RlYW1zaWdudXBzJyxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnRlYW1zaWdudXBzLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1RlYW1TaWdudXBDb250cm9sbGVyIGFzIHRlYW1zaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmNyZWF0ZScsIHtcblx0XHR1cmw6ICcvY3JlYXRlJyxcblx0XHR2aWV3czoge1xuXHRcdFx0Jyc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cudGVhbXNpZ251cHMuY3JlYXRlJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmVkaXQnLCB7XG5cdFx0dXJsOiAnLzp0ZWFtc19pZCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCcnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnRlYW1zaWdudXBzLmVkaXQnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnVGVhbVNpZ251cENvbnRyb2xsZXIgYXMgdGVhbXNpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24uc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAnLFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWUsXG5cdFx0dmlld3M6e1xuXHRcdFx0J21haW4nOntcblx0XHRcdFx0dGVtcGxhdGVVcmw6Jy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuc2hvdy5zaWdudXAnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25Db250cm9sbGVyIGFzIGNvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24uc2lnbnVwcycsIHtcblx0XHR1cmw6ICcvc2lnbnVwcycsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czp7XG5cdFx0XHQnbWFpbic6e1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDonL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnNpZ251cHMnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25Db250cm9sbGVyIGFzIGNvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLnNob3cnLCB7XG5cdFx0dXJsOiAnLzp2aWV3Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiBmdW5jdGlvbigkc3RhdGVQYXJhbXMpe1xuXHRcdFx0XHRcdHJldHVybiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LicrJHN0YXRlUGFyYW1zLnZpZXc7XG5cblx0XHRcdFx0fSxcblx0XHRcdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmN1cnJlbnRWaWV3ID0gJHN0YXRlUGFyYW1zLnZpZXc7XG5cdFx0XHRcdH1cblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2ludm9pY2VzJywge1xuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHVybDogJy9pbnZvaWNlcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuaW52b2ljZXMuaW5kZXgnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaW52b2ljZXMuaW5kZXgnLCB7XG4gICAgICAgIHVybDogJycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBpbnZvaWNlcyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5pbnZvaWNlcy5vdmVydmlldycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0ludm9pY2VzQ29udHJvbGxlciBhcyBpbnZvaWNlcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdpbnZvaWNlcy5pbmNvbWluZycsIHtcbiAgICAgICAgdXJsOiAnL2luY29taW5nJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGludm9pY2VzJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmludm9pY2VzLmluY29taW5nJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2ludm9pY2VzLm91dGdvaW5nJywge1xuICAgICAgICB1cmw6ICcvb3V0Z29pbmcnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW5AaW52b2ljZXMnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuaW52b2ljZXMub3V0Z29pbmcnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdJbnZvaWNlc0NvbnRyb2xsZXIgYXMgaW52b2ljZXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaW52b2ljZXMuZ2VuZXJhdGUnLCB7XG4gICAgICAgIHVybDogJy9nZW5lcmF0ZScsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBpbnZvaWNlcyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5pbnZvaWNlcy5nZW5lcmF0ZScsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0dlbmVyYXRlSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2ludm9pY2VzLnNob3cnLCB7XG4gICAgICAgIHVybDogJy86aWQnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW5AaW52b2ljZXMnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuaW52b2ljZXMuc2hvdycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0ludm9pY2VDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHJlbWl1bScsIHtcbiAgICAgICAgdXJsOiAnL3ByZW1pdW0nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5wcmVtaXVtLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnUHJlbWl1bUNvbnRyb2xsZXIgYXMgcHJlbWl1bSdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJGxvY2F0aW9uUHJvdmlkZXIuaHRtbDVNb2RlKHRydWUpO1xuXG4gICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2NvbXBldGl0aW9ucycpO1xuXG4gICAgaWYobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSlcbiAgICB7XG4gICAgICAgICR1cmxSb3V0ZXJQcm92aWRlci5vdGhlcndpc2UoJy9jb21wZXRpdGlvbnMnKTtcbiAgICB9XG4gICAgZWxzZVxuICAgIHtcbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2F1dGgvcmVnaXN0ZXInKTtcbiAgICB9XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncm9vdCcsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHZpZXdzOntcbiAgICAgICAgICAgICduYXZpZ2F0aW9uQCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5uYXZpZ2F0aW9uJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgncHVibGljJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdmlld3M6e1xuICAgICAgICAgICAgJ25hdmlnYXRpb25AJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL25hdmlnYXRpb24nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdkYXNoYm9hcmQnLCB7XG4gICAgICAgIHVybDogJy8nLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5kYXNoYm9hcmQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdEYXNoYm9hcmRDb250cm9sbGVyJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncycsIHtcbiAgICAgICAgdXJsOiAnL3NldHRpbmdzJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLmluZGV4JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnU2V0dGluZ3NDb250cm9sbGVyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyQXM6ICdzZXR0aW5ncydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLmluZGV4Jywge1xuICAgICAgICB1cmw6Jy8nLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOiB7XG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogZnVuY3Rpb24oJHN0YXRlKXtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdzZXR0aW5ncy51c2VyJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MudXNlcicsIHtcbiAgICAgICAgdXJsOiAnL3VzZXInLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy51c2VyJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlVzZXJQcm9maWxlQ29udHJvbGxlciBhcyB1c2VycHJvZmlsZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5lZGl0cHJvZmlsZScsIHtcbiAgICAgICAgdXJsOiAnL2VkaXRwcm9maWxlJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdzZXR0aW5nJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLnVzZXJlZGl0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBcIlVzZXJQcm9maWxlQ29udHJvbGxlciBhcyB1c2VycHJvZmlsZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5jYW5jZWxhY2NvdW50Jywge1xuICAgICAgICB1cmw6ICcvY2FuY2VsYWNjb3VudCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnc2V0dGluZyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy5jYW5jZWxhY2NvdW50J1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5wYXNzd29yZCcsIHtcbiAgICAgICAgdXJsOiAnL3Bhc3N3b3JkJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdzZXR0aW5nJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MucGFzc3dvcmQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiUGFzc3dvcmRDb250cm9sbGVyIGFzIHBhc3N3b3JkXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuICAgIFxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy5pbnZpdGUnLCB7XG4gICAgICAgIHVybDogJy9pbnZpdGUnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy5pbnZpdGUnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiSW52aXRlQ29udHJvbGxlciBhcyBpbnZpdGVcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXBzJywge1xuXHRcdHVybDogJy9zaWdudXBzJyxcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHR2aWV3czp7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNpZ251cHMuaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnU2lnbnVwc0NvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdzaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cCcsIHtcblx0XHR1cmw6ICcvc2lnbnVwLzppZCcsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2lnbnVwcy5zaG93Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1NpZ251cENvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdzaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwLmVkaXQnLCB7XG5cdFx0dXJsOiAnL2VkaXQnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNpZ251cHMuZWRpdCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdTaWdudXBDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cbn0pOyJdLCJzb3VyY2VSb290IjoiL3NvdXJjZS8ifQ==
