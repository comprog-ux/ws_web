var app = angular.module('app',
	[
		'angular-jwt',
		'angular.filter',
		'ngAnimate',
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
		'app.championships.signups',
		'app.clubs',
		'app.clubs.invoices',
		'app.competitions',
		'app.competitions.admin',
		'app.competitions.admin.export',
		'app.competitions.admin.patrols',
		'app.competitions.admin.stations',
		'app.competitions.admin.signups',
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

    self.load = function(){
        $rootScope.loadingState = true;
        var args = {
            current_page: $stateParams.current_page,
            per_page: $stateParams.per_page,
            search: $stateParams.search,
            payment_status: $stateParams.payment_status
        };
        AdminInvoicesFactory.load(args)
            .success(function(response){
                self.invoices = response.invoices;
                self.invoices_overview = response.invoices_overview;
                $rootScope.loadingState = false;
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
                $rootScope.loadingState = false;
            });
    };

    self.updatePage = function(){
        var args = {
            search: self.invoices.search,
            payment_status: self.invoices.payment_status,
            current_page: self.invoices.current_page,
            per_page: self.invoices.per_page
        };
        $state.go('admin.invoices.index', args, {location:'replace'});
    };

    self.load();

    self.download = function(invoice){
        AdminInvoicesFactory.download(invoice.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, 'invoice-' + invoice.invoice_reference + '.pdf');
                }
            });
    };

}])
.controller("AdminInvoiceController", ["$rootScope", "$stateParams", "$state", "AdminInvoicesFactory", "FileSaver", "Blob", function($rootScope, $stateParams, $state, AdminInvoicesFactory, FileSaver, Blob) {
    var self = this;
    function loadInvoices(){
        $rootScope.loadingState = true;
        AdminInvoicesFactory.find($stateParams.id)
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
        load: function(args) {
            var url = ApiEndpointUrl+'admin/invoices';
            current_page = (args.current_page) ? args.current_page : 1;

            url += '?page=' + current_page;
            if (args.search) url += '&search=' + args.search;
            if (args.per_page) url += '&per_page=' + args.per_page;
            if (args.payment_status) url += '&payment_status=' + args.payment_status;

            return $http({
                method: 'GET',
                url: url,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },

        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'admin/invoices/'+id,
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
angular.module('app.championships.signups', [])

.controller("ChampionshipSignupsController", ["$rootScope", "$stateParams", "$state", "ChampionshipSignupsFactory", "$timeout", function($rootScope, $stateParams, $state, ChampionshipSignupsFactory, $timeout){
	var self = this;

	self.load = function() {
		$rootScope.loadingState = true;
		var args = {
			championships_id: $stateParams.championships_id,
			current_page: $stateParams.current_page,
			per_page: $stateParams.per_page,
			competitions_id: $stateParams.competitions_id,
			search: $stateParams.search
		};
		ChampionshipSignupsFactory.load(args)
			.success(function(response){
				self.signups = response.signups;
				self.competitions = response.competitions;
				$rootScope.loadingState = false;
			});
	};

	self.updatePage = function(){
		var args = {
			championships_id: $stateParams.championships_id,
			search: self.signups.search,
			current_page: self.signups.current_page,
			per_page: self.signups.per_page,
			competitions_id: self.signups.competitions_id
		};
		$state.go('championships.show.signups', args, {location:'replace'});
	};

	self.load();
}])

.factory('ChampionshipSignupsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl){

	return {
		load: function (args) {

			var url = ApiEndpointUrl+'championships/'+args.championships_id+'/signups';
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
        ChampionshipsFactory.find($stateParams.championships_id)
            .success(function(response){
                self.championship = response.championship;
            })
            .error(function(){
                $state.go('championships.index', {}, {location:'replace'});
            });
    }

    find();

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
angular.module('app.competitions.admin.export', [])

.controller("CompetitionsAdminExportController", ["$rootScope", "$scope", "$stateParams", "$state", "CompetitionsAdminPatrolsFactory", "FileSaver", "Blob", function($rootScope, $scope, $stateParams, $state, CompetitionsAdminPatrolsFactory, FileSaver, Blob) {
    var self = this;

    self.filter = {
        patrols_output: {
            pagebreak: '',
            orderby: 'patrols'
        }
    };

    self.downloadPatrolsList = function(competition){
        $rootScope.loadingState = true;
        console.log(competition);
        CompetitionsAdminPatrolsFactory.downloadPatrolsList(competition.id, self.filter.patrols_output)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, competition.date+' '+competition.name + ' ' + competition.translations.patrols_list_singular + '.pdf');
                }
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                $rootScope.loadingState = false;
            });
    };

}]);
angular.module('app.competitions.admin', [])

.controller("CompetitionsAdminController", ["$rootScope", "$scope", "$stateParams", "$state", "CompetitionsPatrolsFactory", function($rootScope, $scope, $stateParams, $state, CompetitionsPatrolsFactory) {
    var self = this;

    self.find = function(){
        $rootScope.loadingState = true;
        CompetitionsPatrolsFactory.find($stateParams.competitions_id)
            .success(function(response){
                self.competition = response.competition;
                self.competition_types = response.competition_types;
                self.competition.start_time = moment(self.competition.start_time, 'HH:mm:ss');
                self.competition.final_time = moment(self.competition.final_time, 'HH:mm:ss');
                $rootScope.loadingState = false;
            })
            .error(function(){
                $state.go('competitions', {}, {location:'replace'});
                $rootScope.loadingState = false;
            });
    };

    self.find();

    self.update = function(){
        $rootScope.loadingState = true;
        CompetitionsPatrolsFactory.save(self.competition)
            .success(function(response){
                self.competition = response.competition;
                self.competition.start_time = moment(self.competition.start_time, 'HH:mm:ss');
                self.competition.final_time = moment(self.competition.final_time, 'HH:mm:ss');
                $rootScope.loadingState = false;
            })
            .error(function(){
                $state.go('competitions', {}, {location:'replace'});
                $rootScope.loadingState = false;
            });

    };
}])

.factory('CompetitionsPatrolsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {

    return {
        find: function(id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'competitions/'+id+'/admin',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        save: function(competition){
            data = angular.copy(competition);
            if(competition.start_time){
                data.start_time = moment(competition.start_time).format('HH:mm:ss');
            }
            if(competition.final_time){
                data.final_time = moment(competition.final_time).format('HH:mm:ss');
            }
            if(competition.date){
                data.date = moment(competition.date).format('YYYY-MM-DD');
            }
            if(competition.signups_closing_date) {
                data.signups_closing_date = moment(competition.signups_closing_date).format('YYYY-MM-DD');
            }
            return $http({
                method: 'PUT',
                url: ApiEndpointUrl+'competitions/'+competition.id+'/admin',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });

        }
    };
}]);
angular.module('app.competitions.admin.patrols', [])

.controller("CompetitionsAdminPatrolsController", ["$rootScope", "$scope", "$stateParams", "$state", "$uibModal", "CompetitionsAdminPatrolsFactory", "FileSaver", "Blob", function($rootScope, $scope, $stateParams, $state, $uibModal, CompetitionsAdminPatrolsFactory, FileSaver, Blob) {
    var self = this;
    self.active_patrol_id = 0;

    self.filter = {
        show: false,
        shooting_card_number: '',
        share_patrol_with: '',
        first_last_patrol: '',
        start_before: '',
        start_after: '',
        possible_collision: '',
        weapongroups_id: '',
        orderby: 'clubs_id',
        current_page: 1,
        per_page:30
    };

    self.getPatrols = function()
    {
        $rootScope.loadingState = true;
        CompetitionsAdminPatrolsFactory.getPatrols($stateParams.competitions_id)
            .success(function(response){
                self.patrols = response.patrols;
                self.signups = response.signups;
                self.setAvailableLanes();
            })
            .error(function(){
                $state.go('competitions.admin', {competitions_id: $stateParams.competitions_id}, {location:'replace'});
            })
            .finally(function(){
                $rootScope.loadingState = false;
            });
    };

    self.setActivePatrol = function(patrol_id) {
        self.active_patrol_id = (self.active_patrol_id != patrol_id) ? patrol_id : 0;
    };

    self.openPatrolEditModal = function(patrol, competition){

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'PatrolEditModal.html',
            controller: 'PatrolEditModalController as modalcontroller',
            size: 'lg',
            resolve: {
                patrol: function () {
                    return patrol;
                },
                competition: function() {
                    return competition;
                }
            }
        });

        modalInstance.result.then(function (response) {
            patrol.patrol_size = response.patrol.patrol_size;
            patrol.start_time = response.patrol.start_time;
            patrol.end_time = response.patrol.end_time;
            patrol.start_time_human = response.patrol.start_time_human;
            patrol.end_time_human = response.patrol.end_time_human;
            angular.forEach(response.patrol.signups, function(signup, key){
                self.updateCollidingSignups(signup);
            });
        });
    };
    
    self.generatePatrols = function(){
        $rootScope.loadingState = true;
        CompetitionsAdminPatrolsFactory.generatePatrols($stateParams.competitions_id)
            .success(function(response){
                if(response.patrols.length){
                    angular.forEach(response.patrols, function(patrol, key){
                        self.patrols.push(patrol);
                    });
                }
                self.signups = response.signups;
                self.setAvailableLanes();
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                $rootScope.loadingState = false;
            });

    };

    self.createPatrol = function(){
        self.loadingState = true;
        CompetitionsAdminPatrolsFactory.createPatrol($stateParams.competitions_id)
            .success(function(response){
                self.patrols.push(response.patrol);
                self.setAvailableLanes();
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                self.loadingState = false;
            });
    };
    
    self.deletePatrol = function(patrol){
        self.loadingState = true;
        CompetitionsAdminPatrolsFactory.deletePatrol($stateParams.competitions_id, patrol.id)
            .success(function(response){
                self.patrols.splice(self.patrols.indexOf(patrol), 1);
                if(response.signups){
                    angular.forEach(response.signups, function(signup, key){
                        self.signups.push(signup);
                    });
                }
                self.active_patrol_id = 0;
                self.setAvailableLanes();
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                self.loadingState = false;
            });
    };

    self.deleteAllPatrols = function(){
        $rootScope.loadingState = true;
        CompetitionsAdminPatrolsFactory.deleteAllPatrols($stateParams.competitions_id)
            .success(function(response){
                self.patrols = [];
                self.signups = response.signups;
                self.active_patrol_id = 0;
                self.setAvailableLanes();
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                $rootScope.loadingState = false;
            });
    };

    self.emptyPatrol = function(patrol){
        self.loadingState = true;
        CompetitionsAdminPatrolsFactory.emptyPatrol($stateParams.competitions_id, patrol.id)
            .success(function(response){
                if(response.signups){
                    angular.forEach(response.signups, function(signup, key){
                        signup.lane = 0;
                        signup.patrols_id = 0;
                        self.signups.push(signup);
                    });
                }
                patrol.signups = [];
                self.setAvailableLanes();
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                self.loadingState = false;
            });
    };

    self.updateSignupLane = function(signup){
        if(signup.new_lane){
            CompetitionsAdminPatrolsFactory.updateSignupLane($stateParams.competitions_id, signup)
                .success(function(response){
                    signup.lane = response.signup.lane;
                    self.setAvailableLanes();
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                })
                .finally(function(){
                    self.loadingState = false;
                });
        }
    };
    
    self.associateSignupWithPatrol = function(patrols_id, signup){
        if(patrols_id > 0 && signup && !self.loadingState){
            self.loadingState = true;
            CompetitionsAdminPatrolsFactory.associateSignupWithPatrol($stateParams.competitions_id, patrols_id, signup.id, signup.lane)
                .success(function(response){
                    /**
                     * Push the associated signup to the patrol
                     */
                    angular.forEach(self.patrols, function(patrol, key){
                        if(patrol.id == patrols_id){
                            signup.patrols_id = patrols_id;
                            signup.lane = response.signup.lane;
                            patrol.signups.push(signup);
                        }
                    });
                    var signupIndex = self.signups.indexOf(signup);
                    self.signups.splice(signupIndex,1);
                    self.updateCollidingSignups(response.signup);
                    self.setAvailableLanes();

                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                })
                .finally(function(){
                    self.loadingState = false;
                });
        }
    };
    self.dissociateSignupWithPatrol = function(patrol, signup){
        if(patrol && signup && !self.loadingState){
            self.loadingState = true;
            CompetitionsAdminPatrolsFactory.dissociateSignupWithPatrol($stateParams.competitions_id, patrol.id, signup.id)
                .success(function(response){
                    signup.patrols_id = 0;
                    signup.lane = 0;
                    self.signups.push(signup);
                    var signupIndex = patrol.signups.indexOf(signup);
                    patrol.signups.splice(signupIndex,1);
                    self.updateCollidingSignups(response.signup);
                    self.setAvailableLanes();
                })
                .error(function(response){
                    $rootScope.displayFlashMessages(response, 'error');
                })
                .finally(function(){
                    self.loadingState = false;
                });
        }
    };

    self.sharePatrolWith = function(patrols_id, shooting_card_number){
        angular.forEach(self.signups, function(signup, key){
            if(signup.user.shooting_card_number == shooting_card_number){
                self.associateSignupWithPatrol(patrols_id, signup);
            }
        });
    };

    self.updateCollidingSignups = function(signup){
        angular.forEach(self.signups, function(available_signup, key){
            if(available_signup.colliding_signups.length){
                angular.forEach(available_signup.colliding_signups, function(colliding_signup, key){
                    if(colliding_signup.id == signup.id){
                        colliding_signup.start_time = signup.start_time;
                        colliding_signup.end_time = signup.end_time;
                        colliding_signup.start_time_human = signup.start_time_human;
                        colliding_signup.end_time_human = signup.end_time_human;
                        colliding_signup.patrols_id = signup.patrols_id;
                    }
                });
            }
        });

        angular.forEach(self.patrols, function(patrol, key){
            angular.forEach(patrol.signups, function(patrol_signup, key){
                angular.forEach(patrol_signup.colliding_signups, function(colliding_signup, key){
                    if(colliding_signup.id == signup.id){
                        colliding_signup.start_time = signup.start_time;
                        colliding_signup.end_time = signup.end_time;
                        colliding_signup.start_time_human = signup.start_time_human;
                        colliding_signup.end_time_human = signup.end_time_human;
                        colliding_signup.patrols_id = signup.patrols_id;
                    }
                });
            });
        });
    };

    self.setAvailableLanes = function(){
        angular.forEach(self.patrols, function(patrol, key){
            patrol.available_lanes = [];
            for(var i=1;i<patrol.patrol_size+1;i++) {
                patrol.available_lanes.push(i);
            }
            angular.forEach(patrol.signups, function(signup, index){
                var lane = patrol.available_lanes.indexOf(signup.lane);
                if(lane != -1){
                    patrol.available_lanes.splice(lane, 1);
                }
            });
        });
    };
    self.filterStartAfter = function(input, filter){
        if(!filter) return true;
        return (input >= filter);
    };
    self.filterStartBefore = function(input, filter){
        if(!filter) return true;
        return (input <= filter);
    };
    self.filterPossibleCollision = function(signup){
        if(self.filter.possible_collision == 'yes'){
            return (signup.colliding_signups.length || signup.possible_finals.length) ? true : false;
        }else if (self.filter.possible_collision == 'no'){
            return (!signup.colliding_signups.length && !signup.possible_finals.length) ? true : false;
        }else{
            return true;
        }
    };

    self.downloadPatrolsList = function(competition){
        $rootScope.loadingState = true;
        console.log(competition);
        CompetitionsAdminPatrolsFactory.downloadPatrolsList(competition.id)
            .success(function(response){
                var file = new Blob([response], {type: 'application/pdf'});
                if(file.size) {
                    FileSaver.saveAs(file, competition.date+' '+competition.name + ' ' + competition.translations.patrols_list_singular + '.pdf');
                }
            })
            .error(function(response){
                $rootScope.displayFlashMessages(response, 'error');
            })
            .finally(function(){
                $rootScope.loadingState = false;
            });
    };

    self.getPatrols();
}])

.controller('PatrolEditModalController', ["$scope", "$stateParams", "$uibModalInstance", "patrol", "competition", "CompetitionsAdminPatrolsFactory", function ($scope, $stateParams, $uibModalInstance, patrol, competition, CompetitionsAdminPatrolsFactory) {
    var self = this;

    self.competition = competition;

    self.options = {
        showWeeks: true,
        startingDay: 1,
        maxDate: new Date()
    };

    var start_time = moment(patrol.start_time);
    var end_time = moment(patrol.end_time);
    var length_time = end_time.diff(start_time, 'hours');

    self.patrol = {
        start_time: start_time,
        end_time: end_time,
        length_time: length_time,
        id: patrol.id,
        patrol_size: patrol.patrol_size,
        competitions_id: patrol.competitions_id,
    };

    self.updatePatrol = function (patrol) {
        if(!self.loadingState){
            self.loadingState = true;
            CompetitionsAdminPatrolsFactory.savePatrol($stateParams.competitions_id, patrol)
                .success(function(response){
                    $uibModalInstance.close(response);
                })
                .finally(function(){
                    self.loadingState = false;
                });
        }
    };

    self.changeTime = function(date) {

        if(self.patrol.end_time < self.patrol.start_time){
            self.patrol.end_time = moment(self.patrol.start_time).add(1, 'day').format('YYYY-MM-DD HH:mm');
        }
        if (date == 'start') {
            self.patrol.end_time = moment(self.patrol.start_time).add(self.patrol.length_time, 'hours').format('YYYY-MM-DD HH:mm');
        } else if (date == 'end') {
            var start = moment(self.patrol.start_time);
            var end = moment(self.patrol.end_time);
            var diff = end.diff(start, 'hours', true);
            self.patrol.length_time = diff;
        } else if (date == 'length') {
            self.patrol.end_time = moment(self.patrol.start_time).add(self.patrol.length_time, 'hours').format('YYYY-MM-DD HH:mm');
        }

    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}])
.factory('CompetitionsAdminPatrolsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {

    return {
        getPatrols: function(competitions_id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        savePatrol: function(competitions_id, patrol) {
            var data = angular.copy(patrol);
            data.start_time = moment(patrol.start_time).format('YYYY-MM-DD HH:mm:00');
            data.end_time = moment(patrol.end_time).format('YYYY-MM-DD HH:mm:00');
            data.length_time = 0;
            return $http({
                method:'PUT',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/'+patrol.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        },
        generatePatrols: function(competitions_id) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/generate',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        createPatrol: function(competitions_id) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        deletePatrol: function(competitions_id, patrols_id) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/'+patrols_id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        deleteAllPatrols: function(competitions_id) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/all',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        emptyPatrol: function(competitions_id, patrols_id) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/'+patrols_id+'/empty',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        updateSignupLane: function(competitions_id, signup){
            data = {
                lane: signup.new_lane
            };
            return $http({
                method:'PUT',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/signups/'+signup.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        },
        associateSignupWithPatrol: function(competitions_id, patrols_id, signups_id, lane) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/signups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({patrols_id: patrols_id, signups_id: signups_id, lane:lane})
            });
        },
        dissociateSignupWithPatrol: function(competitions_id, patrols_id, signups_id) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/signups',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param({patrols_id: patrols_id, signups_id: signups_id})
            });
        },
        downloadPatrolsList: function(competitions_id, patrols_output){
            var data = (patrols_output) ? patrols_output : {};
            if(competitions_id){
                return $http({
                    method: 'POST',
                    url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/patrols/export',
                    responseType: 'arraybuffer',
                    headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                    data: $.param(data)
                });
            }
        }
    };
}]);
angular.module('app.competitions.admin.signups', [])

.controller("CompetitionsAdminSignupsController", ["$rootScope", "$scope", "$stateParams", "$state", "$uibModal", "CompetitionsAdminSignupsFactory", function($rootScope, $scope, $stateParams, $state, $uibModal, CompetitionsAdminSignupsFactory) {
    var self = this;

    self.load = function() {
        $rootScope.loadingState = true;
        var args = {
            current_page: $stateParams.current_page,
            per_page: $stateParams.per_page,
            search: $stateParams.search
        };
        CompetitionsAdminSignupsFactory.load($stateParams.competitions_id, args)
            .success(function(response){
                self.signups = response.signups;
                $rootScope.loadingState = false;
            });
    };

    self.updatePage = function(){
        var args = {
            competitions_id: $stateParams.competitions_id,
            search: self.signups.search,
            current_page: self.signups.current_page,
            per_page: self.signups.per_page,
        };
        $state.go('competitions.admin.signups', args, {location:'replace'});
    };

    self.load();
}])
.factory('CompetitionsAdminSignupsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {

    return {
        load: function (competitions_id, args) {

            var url = ApiEndpointUrl+'competitions/'+competitions_id+'/admin/signups';
            current_page = (args.current_page) ? args.current_page : 1;

            url += '?page=' + current_page;
            if (args.search) url += '&search=' + args.search;
            if (args.per_page) url += '&per_page=' + args.per_page;
            if (args.specialwishes) url += '&status=' + args.specialwishes;

            return $http({
                method: 'GET',
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            });
        }    };
}]);
angular.module('app.competitions.admin.stations', [])

.controller("CompetitionsAdminStationsController", ["$rootScope", "$scope", "$stateParams", "$state", "$uibModal", "CompetitionsAdminStationsFactory", function($rootScope, $scope, $stateParams, $state, $uibModal, CompetitionsAdminStationsFactory) {
    var self = this;

    self.getStations = function()
    {
        $rootScope.loadingState = true;
        CompetitionsAdminStationsFactory.getStations($stateParams.competitions_id)
            .success(function(response){
                self.stations = response.stations;
            })
            .error(function(){
                $state.go('competitions.admin', {competitions_id: $stateParams.competitions_id}, {location:'replace'});
            })
            .finally(function(){
                $rootScope.loadingState = false;
            });
    };
    
    self.getStations();

    self.openStationEditModal = function(station, competition){

        var modalInstance = $uibModal.open({
            animation: true,
            templateUrl: 'StationEditModal.html',
            controller: 'StationEditModalController as modalcontroller',
            size: 'lg',
            resolve: {
                station: function () {
                    return station;
                },
                competition: function() {
                    return competition;
                }
            }
        });

        modalInstance.result.then(function (response) {
            self.stations = response.stations;
        });

        modalInstance.dismiss(function(){
            console.log('stäng');
            self.getStations();
        });
    };

    self.createStation = function(){
        self.loadingState = true;
        CompetitionsAdminStationsFactory.createStation($stateParams.competitions_id)
            .success(function(response){
                self.stations = response.stations;
            })
            .error(function(){
                $state.go('competitions.admin.stations', {competitions_id: $stateParams.competitions_id}, {location:'replace'});
            })
            .finally(function(){
                self.loadingState = false;
            });
    };

    self.deleteStation = function(station){
        self.loadingState = true;
        CompetitionsAdminStationsFactory.deleteStation($stateParams.competitions_id, station.id)
            .success(function(response){
                self.stations = response.stations;
            })
            .error(function(){
                $state.go('competitions.admin.stations', {competitions_id: $stateParams.competitions_id}, {location:'replace'});
            })
            .finally(function(){
                self.loadingState = false;
            });
    };

}])
.controller('StationEditModalController', ["$scope", "$stateParams", "$uibModalInstance", "station", "competition", "CompetitionsAdminStationsFactory", function ($scope, $stateParams, $uibModalInstance, station, competition, CompetitionsAdminStationsFactory) {
    var self = this;

    self.competition = competition;

    self.station = angular.copy(station);

    self.updateStation = function (station) {
        if(!self.loadingState){
            self.loadingState = true;
            CompetitionsAdminStationsFactory.saveStation($stateParams.competitions_id, station)
                .success(function (response) {
                    $uibModalInstance.close(response);
                })
                .finally(function () {
                    self.loadingState = false;
                });
        }
    };

    self.cancel = function () {
        $uibModalInstance.dismiss('cancel');
    };
}])
    
.factory('CompetitionsAdminStationsFactory', ["$http", "ApiEndpointUrl", function($http, ApiEndpointUrl) {

    return {
        getStations: function(competitions_id) {
            return $http({
                method: 'GET',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/stations',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        saveStation: function(competitions_id, station) {
            data = angular.copy(station);
            return $http({
                method:'PUT',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/stations/'+station.id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' },
                data: $.param(data)
            });
        },
        createStation: function(competitions_id) {
            return $http({
                method: 'POST',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/stations',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        deleteStation: function(competitions_id, stations_id) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/stations/'+stations_id,
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
            });
        },
        deleteAllStations: function(competitions_id) {
            return $http({
                method: 'DELETE',
                url: ApiEndpointUrl+'competitions/'+competitions_id+'/admin/stations/all',
                headers: { 'Content-Type' : 'application/x-www-form-urlencoded' }
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

    $stateProvider.state('admin.invoices', {
        abstract: true,
        url: '/invoices',
        restricted: true
    });
    $stateProvider.state('admin.invoices.index', {
        url: '?current_page&per_page&search&payment_status',
        restricted: true,
        views: {
            'content@': {
                templateUrl: '/views/partials.admin.invoices.index',
                controller: 'AdminInvoicesController as invoices'
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
            payment_status: {
                value: 'all',
                squash: true
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
		parent: 'root',
		abstract: true,
		url: '/championships',
		restricted: true,
		views: {
			'content@': {
				templateUrl: '/views/partials.championships.index'
			}
		}
	});

	$stateProvider.state('championships.index', {
		url: '',
		parent: 'championships',
		views:{
			'content@': {
				templateUrl: '/views/partials.championships.index',
				controller: 'ChampionshipsController',
				controllerAs: 'championships'
			}
		},
		restricted: true
	});

	$stateProvider.state('championships.show', {
		url: '/:championships_id',
		restricted: true,
		views: {
			'content@': {
				templateUrl: '/views/partials.championships.show',
				controller: 'ChampionshipController as championships'
			}
		}
	});

	$stateProvider.state('championships.show.competitions', {
		url: '/competitions',
		restricted: true,
		views: {
			'main@championships.show':{
				templateUrl: '/views/partials.championships.show.competitions'
			}
		}
	});

	$stateProvider.state('championships.show.signups', {
		url: '/signups?current_page&per_page&search%competitions_id',
		restricted: true,
		views: {
			'main@championships.show':{
				templateUrl: '/views/partials.championships.show.signups',
				controller: 'ChampionshipSignupsController as signups'
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

	$stateProvider.state('competitions.admin', {
		abstract: true,
		parent: 'root',
		url: '/competitions/:competitions_id/admin',
		restricted: true,
		views:{
			'content@': {
				templateUrl: '/views/partials.competitions.admin',
				controller: 'CompetitionsAdminController',
				controllerAs: 'competitions'
			}
		}
	});

	$stateProvider.state('competitions.admin.index', {
		url: '',
		restricted: true,
		views:{
			'main@competitions.admin': {
				templateUrl: '/views/partials.competitions.admin.index'
			}
		}
	});
	$stateProvider.state('competitions.admin.edit', {
		url: '/edit',
		restricted: true,
		views:{
			'main@competitions.admin': {
				templateUrl: '/views/partials.competitions.admin.edit'
			}
		}
	});

	$stateProvider.state('competitions.admin.signups', {
		url: '/signups?current_page&per_page&search',
		restricted: true,
		views: {
			'main@competitions.admin': {
				templateUrl: '/views/partials.competitions.admin.signups',
				controller: 'CompetitionsAdminSignupsController as signups'
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
			}
		}
	});

	$stateProvider.state('competitions.admin.patrols', {
		url: '/patrols',
		restricted: true,
		views:{
			'main@competitions.admin': {
				templateUrl: '/views/partials.competitions.admin.patrols',
				controller: 'CompetitionsAdminPatrolsController',
				controllerAs: 'patrols'
			}
		}
	});

	$stateProvider.state('competitions.admin.stations', {
		url: '/stations',
		restricted: true,
		views:{
			'main@competitions.admin': {
				templateUrl: '/views/partials.competitions.admin.stations',
				controller: 'CompetitionsAdminStationsController',
				controllerAs: 'stations'
			}
		}
	});

	$stateProvider.state('competitions.admin.export', {
		url: '/export',
		restricted: true,
		views:{
			'main@competitions.admin': {
				templateUrl: '/views/partials.competitions.admin.export',
				controller: 'CompetitionsAdminExportController',
				controllerAs: 'export'
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
		url: '/competitions/:id',
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
app.filter('sumTotalLength', function() {
    return function(data, key) {
        if (typeof(data) === 'undefined' || typeof(key) === 'undefined') {
            return 0;
        }
        var sum = 0;
        angular.forEach(data, function(item, index){
            if(item[key].length) {
                sum += parseInt(item[key].length);
            }
        });

        return sum;
    };
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImFwcC5tb2R1bGUuanMiLCJtb2R1bGVzL2FkbWluLmNsdWJzLm1vZHVsZS5qcyIsIm1vZHVsZXMvYWRtaW4uaW52b2ljZXMubW9kdWxlLmpzIiwibW9kdWxlcy9hZG1pbi5tb2R1bGUuanMiLCJtb2R1bGVzL2FkbWluLnNpZ251cHMubW9kdWxlLmpzIiwibW9kdWxlcy9hZG1pbi51c2Vycy5tb2R1bGUuanMiLCJtb2R1bGVzL2F1dGgubW9kdWxlLmpzIiwibW9kdWxlcy9jYWxlbmRhci5tb2R1bGUuanMiLCJtb2R1bGVzL2NoYW1waW9uc2hpcC5zaWdudXBzLm1vZHVsZS5qcyIsIm1vZHVsZXMvY2hhbXBpb25zaGlwcy5tb2R1bGUuanMiLCJtb2R1bGVzL2NsdWJzLmludm9pY2VzLm1vZHVsZS5qcyIsIm1vZHVsZXMvY2x1YnMubW9kdWxlLmpzIiwibW9kdWxlcy9jb21wZXRpdGlvbnMuYWRtaW4uZXhwb3J0Lm1vZHVsZS5qcyIsIm1vZHVsZXMvY29tcGV0aXRpb25zLmFkbWluLm1vZHVsZS5qcyIsIm1vZHVsZXMvY29tcGV0aXRpb25zLmFkbWluLnBhdHJvbHMubW9kdWxlLmpzIiwibW9kdWxlcy9jb21wZXRpdGlvbnMuYWRtaW4uc2lnbnVwcy5tb2R1bGUuanMiLCJtb2R1bGVzL2NvbXBldGl0aW9ucy5hZG1pbi5zdGF0aW9ucy5tb2R1bGUuanMiLCJtb2R1bGVzL2NvbXBldGl0aW9ucy5tb2R1bGUuanMiLCJtb2R1bGVzL2Rhc2hib2FyZC5tb2R1bGUuanMiLCJtb2R1bGVzL2Vycm9yaGFuZGxpbmcubW9kdWxlLmpzIiwibW9kdWxlcy9pbnZvaWNlcy5tb2R1bGUuanMiLCJtb2R1bGVzL3ByZW1pdW0ubW9kdWxlLmpzIiwibW9kdWxlcy9zZXR0aW5ncy5tb2R1bGUuanMiLCJtb2R1bGVzL3NpZ251cHMubW9kdWxlLmpzIiwibW9kdWxlcy90ZWFtcy5tb2R1bGUuanMiLCJtb2R1bGVzL3VzZXJzLm1vZHVsZS5qcyIsImNvbmZpZy9lcnJvcmhhbmRsaW5nLmNvbmZpZy5qcyIsImNvbmZpZy9pbnRlcmNlcHRvcnMuanMiLCJkaXJlY3RpdmVzL25nLWZ1bGxjYWxlbmRhci5qcyIsImRpcmVjdGl2ZXMvbmdFbnRlci5qcyIsImRpcmVjdGl2ZXMvbmdJbmZpbml0ZVNjcm9sbC5qcyIsImRpcmVjdGl2ZXMvbmdTdHJpbmdUb051bWJlci5qcyIsInJvdXRpbmcvYWRtaW4uY2x1YnMucm91dGluZy5qcyIsInJvdXRpbmcvYWRtaW4uaW52b2ljZXMucm91dGluZy5qcyIsInJvdXRpbmcvYWRtaW4ucm91dGluZy5qcyIsInJvdXRpbmcvYWRtaW4uc2lnbnVwcy5yb3V0aW5nLmpzIiwicm91dGluZy9hZG1pbi51c2Vycy5yb3V0aW5nLmpzIiwicm91dGluZy9hdXRoLnJvdXRpbmcuanMiLCJyb3V0aW5nL2NoYW1waW9uc2hpcHMucm91dGluZy5qcyIsInJvdXRpbmcvY2x1YnMucm91dGluZy5qcyIsInJvdXRpbmcvY29tcGV0aXRpb25zLmFkbWluLnJvdXRpbmcuanMiLCJyb3V0aW5nL2NvbXBldGl0aW9ucy5yb3V0aW5nLmpzIiwicm91dGluZy9pbnZvaWNlcy5yb3V0aW5nLmpzIiwicm91dGluZy9wcmVtaXVtLnJvdXRpbmcuanMiLCJyb3V0aW5nL3JvdXRpbmcuanMiLCJyb3V0aW5nL3NldHRpbmdzLnJvdXRpbmcuanMiLCJyb3V0aW5nL3NpZ251cC5yb3V0aW5nLmpzIiwiZmlsdGVycy9jdXRTdHJpbmcuZmlsdGVyLmpzIiwiZmlsdGVycy9kYXRlVG9Jc28uZmlsdGVyLmpzIiwiZmlsdGVycy9leGNsdWRlQnlJZHMuZmlsdGVyLmpzIiwiZmlsdGVycy9pc0VtcHR5LmZpbHRlci5qcyIsImZpbHRlcnMvbnVtLmZpbHRlci5qcyIsImZpbHRlcnMvcmFuZ2UuZmlsdGVyLmpzIiwiZmlsdGVycy9yZW5kZXJIVE1MQ29ycmVjdGx5LmZpbHRlci5qcyIsImZpbHRlcnMvc3VtQnlLZXkuZmlsdGVyLmpzIiwiZmlsdGVycy9zdW1Ub3RhbExlbmd0aC5maWx0ZXIuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsSUFBQSxNQUFBLFFBQUEsT0FBQTtDQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7RUFDQTtFQUNBO0VBQ0E7NkJBQ0EsU0FBQSxxQkFBQTtFQUNBLHFCQUFBLFlBQUE7RUFDQSxxQkFBQSxVQUFBOzs7QUFHQSxJQUFBLG9IQUFBLFNBQUEsWUFBQSxRQUFBLFVBQUEscUJBQUEsV0FBQSxhQUFBLFNBQUEsV0FBQTs7Q0FFQSxRQUFBLEdBQUEsVUFBQSxpQkFBQTs7Q0FFQSxXQUFBLElBQUEscUJBQUEsU0FBQSxHQUFBLElBQUE7RUFDQSxJQUFBLFFBQUEsYUFBQSxRQUFBOztFQUVBLFdBQUEsZUFBQSxHQUFBOztFQUVBLEdBQUEsVUFBQSxLQUFBO0dBQ0EsV0FBQSxnQkFBQTtHQUNBLElBQUEsT0FBQSxLQUFBLE1BQUEsYUFBQSxRQUFBO0dBQ0EsV0FBQSxjQUFBOzs7RUFHQSxHQUFBLENBQUEsR0FBQSxLQUFBLE1BQUEsS0FBQSxHQUFBLE1BQUEsV0FBQSxXQUFBLGNBQUE7R0FDQSxPQUFBLEdBQUEsYUFBQSxJQUFBLENBQUEsU0FBQTs7O0VBR0EsSUFBQSxHQUFBLFlBQUE7OztHQUdBLElBQUEsVUFBQSxNQUFBO0lBQ0EsRUFBQTtJQUNBLE9BQUEsR0FBQSxjQUFBLElBQUEsQ0FBQSxVQUFBOzs7Ozs7Ozs7R0FTQSxXQUFBLG9CQUFBO0lBQ0EsV0FBQTtJQUNBLGFBQUE7O0dBRUEsV0FBQSxvQkFBQTtJQUNBLGNBQUE7SUFDQSxZQUFBOzs7O0VBSUEsV0FBQSxlQUFBOzs7O0NBSUEsV0FBQSxJQUFBLHVCQUFBLFVBQUEsT0FBQTtFQUNBLFFBQUEsR0FBQSxRQUFBLFlBQUEsVUFBQTs7Ozs7Ozs7Ozs7Q0FXQSxXQUFBLGFBQUEsU0FBQTtDQUNBOztFQUVBLFdBQUEsZ0JBQUE7RUFDQSxXQUFBLGtCQUFBOztFQUVBLEdBQUEsT0FBQSxhQUFBO0VBQ0E7R0FDQSxXQUFBLGNBQUEsS0FBQTs7O0VBR0E7R0FDQSxRQUFBLElBQUE7R0FDQSxHQUFBO0dBQ0E7SUFDQSxRQUFBLFFBQUEsVUFBQSxTQUFBLGFBQUE7S0FDQSxJQUFBLFVBQUEsQ0FBQSxPQUFBLGlCQUFBLFlBQUEsZUFBQSxhQUFBO0tBQ0EsV0FBQSxjQUFBLEtBQUE7OztJQUdBLFFBQUEsSUFBQSxXQUFBOztJQUVBLFNBQUEsVUFBQTtLQUNBLFdBQUEsZ0JBQUE7T0FDQTs7Ozs7O0NBTUEsV0FBQSx1QkFBQSxTQUFBLFVBQUE7Q0FDQTtFQUNBLFNBQUEsT0FBQSxXQUFBO0VBQ0EsV0FBQSxnQkFBQTtFQUNBLFdBQUEsa0JBQUE7O0VBRUEsR0FBQSxRQUFBLFNBQUEsV0FBQSxXQUFBLENBQUE7O0VBRUEsSUFBQSxtQkFBQSxDQUFBO0VBQ0EsSUFBQSxPQUFBLENBQUEsUUFBQSxhQUFBLGlCQUFBOztFQUVBLFFBQUEsUUFBQSxVQUFBLFNBQUEsUUFBQTs7R0FFQSxHQUFBLGlCQUFBLFFBQUEsV0FBQTtHQUNBO0lBQ0EsSUFBQSxPQUFBLENBQUEsT0FBQSxZQUFBLFlBQUEsVUFBQSxRQUFBO0lBQ0EsR0FBQSxRQUFBO0lBQ0E7S0FDQSxXQUFBLGNBQUEsS0FBQTs7O0lBR0E7S0FDQSxXQUFBLGdCQUFBLEtBQUE7Ozs7O0VBS0EsV0FBQSxvQkFBQSxTQUFBLFVBQUE7R0FDQSxXQUFBLGdCQUFBO0dBQ0EsV0FBQSxrQkFBQTtLQUNBOzs7Ozs7OztDQVFBLFdBQUEsY0FBQSxTQUFBLE9BQUE7Q0FDQTtFQUNBLEdBQUEsQ0FBQSxPQUFBLFFBQUE7RUFDQSxHQUFBLE1BQUE7R0FDQTtLQUNBLFlBQUEsT0FBQTs7S0FFQSxLQUFBLFNBQUEsU0FBQTtLQUNBLEdBQUEsU0FBQSxRQUFBO01BQ0EsR0FBQSxTQUFBLFNBQUEsV0FBQSxxQkFBQSxDQUFBLFNBQUEsVUFBQTtZQUNB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LGVBQUEsZUFBQSxLQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztRQUlBLGNBQUEsVUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7UUFJQSxnQkFBQSxTQUFBLFNBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsWUFBQTs7OztRQUlBLFlBQUEsU0FBQSxLQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsQ0FBQSxnQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUEsS0FBQSxVQUFBLFFBQUEsS0FBQTs7OztRQUlBLGdCQUFBLFNBQUEsUUFBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Z0JBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxlQUFBOzs7O1FBSUEsZ0JBQUEsU0FBQSxPQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFNBQUE7Ozs7UUFJQSxtQkFBQSxTQUFBLE9BQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsU0FBQTs7OztRQUlBLFlBQUEsU0FBQSxhQUFBLFdBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsZUFBQSxhQUFBLGFBQUE7Ozs7O0FDeFBBLFFBQUEsT0FBQSxzQkFBQTs7O0NBR0EsV0FBQSxpSEFBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLHNCQUFBLFdBQUEsTUFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxLQUFBLE9BQUEsVUFBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLElBQUEsT0FBQTtZQUNBLGNBQUEsYUFBQTtZQUNBLFVBQUEsYUFBQTtZQUNBLFFBQUEsYUFBQTtZQUNBLGdCQUFBLGFBQUE7O1FBRUEscUJBQUEsS0FBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsV0FBQSxTQUFBO2dCQUNBLEtBQUEsb0JBQUEsU0FBQTtnQkFDQSxXQUFBLGVBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBO2dCQUNBLFdBQUEsZUFBQTs7OztJQUlBLEtBQUEsYUFBQSxVQUFBO1FBQ0EsSUFBQSxPQUFBO1lBQ0EsUUFBQSxLQUFBLFNBQUE7WUFDQSxnQkFBQSxLQUFBLFNBQUE7WUFDQSxjQUFBLEtBQUEsU0FBQTtZQUNBLFVBQUEsS0FBQSxTQUFBOztRQUVBLE9BQUEsR0FBQSx3QkFBQSxNQUFBLENBQUEsU0FBQTs7O0lBR0EsS0FBQTs7SUFFQSxLQUFBLFdBQUEsU0FBQSxRQUFBO1FBQ0EscUJBQUEsU0FBQSxRQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsSUFBQSxPQUFBLElBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBO2dCQUNBLEdBQUEsS0FBQSxNQUFBO29CQUNBLFVBQUEsT0FBQSxNQUFBLGFBQUEsUUFBQSxvQkFBQTs7Ozs7O0NBTUEsV0FBQSxnSEFBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLHNCQUFBLFdBQUEsTUFBQTtJQUNBLElBQUEsT0FBQTtJQUNBLFNBQUEsY0FBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLHFCQUFBLEtBQUEsYUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEdBQUEsQ0FBQSxTQUFBLFNBQUEsT0FBQSxHQUFBO2dCQUNBLEtBQUEsVUFBQSxTQUFBO2dCQUNBLEtBQUEsY0FBQTtnQkFDQSxXQUFBLGVBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBO2dCQUNBLFdBQUEsZUFBQTs7OztJQUlBLEtBQUEsV0FBQSxTQUFBLFFBQUE7UUFDQSxxQkFBQSxTQUFBLFFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxJQUFBLE9BQUEsSUFBQSxLQUFBLENBQUEsV0FBQSxDQUFBLE1BQUE7Z0JBQ0EsR0FBQSxLQUFBLE1BQUE7b0JBQ0EsVUFBQSxPQUFBLE1BQUEsYUFBQSxRQUFBLG9CQUFBOzs7OztJQUtBOzs7Q0FHQSxRQUFBLG9EQUFBLFNBQUEsT0FBQSxlQUFBOztJQUVBLE9BQUE7UUFDQSxNQUFBLFNBQUEsTUFBQTtZQUNBLElBQUEsTUFBQSxlQUFBO1lBQ0EsZUFBQSxDQUFBLEtBQUEsZ0JBQUEsS0FBQSxlQUFBOztZQUVBLE9BQUEsV0FBQTtZQUNBLElBQUEsS0FBQSxRQUFBLE9BQUEsYUFBQSxLQUFBO1lBQ0EsSUFBQSxLQUFBLFVBQUEsT0FBQSxlQUFBLEtBQUE7WUFDQSxJQUFBLEtBQUEsZ0JBQUEsT0FBQSxxQkFBQSxLQUFBOztZQUVBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O1FBSUEsTUFBQSxTQUFBLElBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUEsa0JBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O1FBSUEsVUFBQSxTQUFBLEdBQUE7WUFDQSxHQUFBLEdBQUE7Z0JBQ0EsT0FBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsS0FBQSxlQUFBLGtCQUFBLEdBQUE7b0JBQ0EsY0FBQTtvQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7Ozs7OztBQ2hIQSxRQUFBLE9BQUEsYUFBQTs7Q0FFQSxXQUFBLGlGQUFBLFNBQUEsWUFBQSxRQUFBLFVBQUEsYUFBQTtJQUNBLElBQUEsT0FBQTtJQUNBLFNBQUEsZUFBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLE9BQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7O0lBSUE7O0NBRUEsUUFBQSw0Q0FBQSxTQUFBLE9BQUEsZUFBQTtJQUNBLE9BQUE7UUFDQSxlQUFBLFlBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGlCQUFBO2dCQUNBLFNBQUEsQ0FBQSxnQkFBQTs7Ozs7Ozs7QUNyQkEsUUFBQSxPQUFBLHFCQUFBOztDQUVBLFdBQUEsc0dBQUEsU0FBQSxZQUFBLGNBQUEsUUFBQSxxQkFBQSxTQUFBO0NBQ0EsSUFBQSxPQUFBOztDQUVBLEtBQUEsT0FBQSxXQUFBO0VBQ0EsV0FBQSxlQUFBO0VBQ0EsSUFBQSxPQUFBO0dBQ0EsY0FBQSxhQUFBO0dBQ0EsVUFBQSxhQUFBO0dBQ0EsaUJBQUEsYUFBQTtHQUNBLFFBQUEsYUFBQTs7RUFFQSxvQkFBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLFVBQUEsU0FBQTtJQUNBLEtBQUEsZUFBQSxTQUFBO0lBQ0EsV0FBQSxlQUFBOzs7O0NBSUEsS0FBQSxhQUFBLFVBQUE7RUFDQSxJQUFBLE9BQUE7R0FDQSxRQUFBLEtBQUEsUUFBQTtHQUNBLGNBQUEsS0FBQSxRQUFBO0dBQ0EsVUFBQSxLQUFBLFFBQUE7R0FDQSxpQkFBQSxLQUFBLFFBQUE7O0VBRUEsT0FBQSxHQUFBLHVCQUFBLE1BQUEsQ0FBQSxTQUFBOzs7Q0FHQSxLQUFBOzs7O0NBSUEsUUFBQSxtREFBQSxTQUFBLE9BQUEsZUFBQTs7Q0FFQSxPQUFBO0VBQ0EsTUFBQSxVQUFBLE1BQUE7O0dBRUEsSUFBQSxNQUFBLGVBQUE7R0FDQSxlQUFBLENBQUEsS0FBQSxnQkFBQSxLQUFBLGVBQUE7O0dBRUEsT0FBQSxXQUFBO0dBQ0EsSUFBQSxLQUFBLFFBQUEsT0FBQSxhQUFBLEtBQUE7R0FDQSxJQUFBLEtBQUEsVUFBQSxPQUFBLGVBQUEsS0FBQTtHQUNBLElBQUEsS0FBQSxpQkFBQSxPQUFBLHNCQUFBLEtBQUE7R0FDQSxJQUFBLEtBQUEsZUFBQSxPQUFBLGFBQUEsS0FBQTs7R0FFQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTs7Ozs7OztBQ3BEQSxRQUFBLE9BQUEsbUJBQUE7O0NBRUEsV0FBQSxrR0FBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLG1CQUFBLFNBQUE7Q0FDQSxJQUFBLE9BQUE7O0NBRUEsS0FBQSxPQUFBLFdBQUE7RUFDQSxXQUFBLGVBQUE7RUFDQSxJQUFBLE9BQUE7R0FDQSxjQUFBLGFBQUE7R0FDQSxVQUFBLGFBQUE7R0FDQSxRQUFBLGFBQUE7R0FDQSxRQUFBLGFBQUE7O0VBRUEsa0JBQUEsS0FBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsS0FBQSxRQUFBLFNBQUE7SUFDQSxXQUFBLGVBQUE7Ozs7Q0FJQSxLQUFBLGFBQUEsVUFBQTtFQUNBLElBQUEsT0FBQTtHQUNBLFFBQUEsS0FBQSxNQUFBO0dBQ0EsUUFBQSxLQUFBLE1BQUE7R0FDQSxjQUFBLEtBQUEsTUFBQTtHQUNBLFVBQUEsS0FBQSxNQUFBOztFQUVBLE9BQUEsR0FBQSxxQkFBQSxNQUFBLENBQUEsU0FBQTs7O0NBR0EsS0FBQTs7OztDQUlBLFdBQUEsa0lBQUEsU0FBQSxZQUFBLGNBQUEsUUFBQSxtQkFBQSxzQkFBQSxXQUFBLEtBQUE7Q0FDQSxJQUFBLE9BQUE7Q0FDQSxTQUFBLFVBQUE7RUFDQSxXQUFBLGVBQUE7RUFDQSxHQUFBLGFBQUEsUUFBQTtHQUNBLGtCQUFBLEtBQUEsYUFBQTtLQUNBLFFBQUEsU0FBQSxTQUFBO0tBQ0EsS0FBQSxPQUFBO0tBQ0EsV0FBQSxlQUFBOztLQUVBLE1BQUEsU0FBQSxTQUFBO0tBQ0EsV0FBQSxxQkFBQSxVQUFBO0tBQ0EsS0FBQSxPQUFBO0tBQ0EsV0FBQSxlQUFBOztPQUVBO0dBQ0EsS0FBQSxPQUFBO0dBQ0EsV0FBQSxlQUFBOzs7Q0FHQTs7Q0FFQSxLQUFBLFdBQUEsU0FBQSxLQUFBO0VBQ0EsV0FBQSxlQUFBO0VBQ0Esa0JBQUEsU0FBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsV0FBQSxxQkFBQTtJQUNBLE9BQUEsR0FBQSxvQkFBQSxDQUFBLFNBQUEsS0FBQSxVQUFBLENBQUEsVUFBQTs7SUFFQSxNQUFBLFNBQUEsU0FBQTtJQUNBLFdBQUEscUJBQUEsVUFBQTs7SUFFQSxRQUFBLFVBQUE7SUFDQSxXQUFBLGVBQUE7Ozs7Q0FJQSxLQUFBLGFBQUEsU0FBQSxLQUFBO0VBQ0EsR0FBQSxLQUFBLGNBQUEsT0FBQTtFQUNBLEtBQUEsZUFBQTtFQUNBLGtCQUFBLFdBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLFdBQUEscUJBQUE7SUFDQSxPQUFBLEdBQUEsb0JBQUEsQ0FBQSxTQUFBLFNBQUEsVUFBQSxDQUFBLFVBQUE7O0lBRUEsTUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFVBQUE7O0lBRUEsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGVBQUE7Ozs7Q0FJQSxLQUFBLGtCQUFBLFNBQUEsUUFBQTtFQUNBLHFCQUFBLFNBQUEsUUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsSUFBQSxPQUFBLElBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBO0lBQ0EsR0FBQSxLQUFBLE1BQUE7S0FDQSxVQUFBLE9BQUEsTUFBQSxhQUFBLFFBQUEsb0JBQUE7Ozs7Ozs7O0NBUUEsUUFBQSxpREFBQSxTQUFBLE9BQUEsZUFBQTs7Q0FFQSxPQUFBO0VBQ0EsTUFBQSxVQUFBLE1BQUE7O0dBRUEsSUFBQSxNQUFBLGVBQUE7R0FDQSxlQUFBLENBQUEsS0FBQSxnQkFBQSxLQUFBLGVBQUE7O0dBRUEsT0FBQSxXQUFBO0dBQ0EsSUFBQSxLQUFBLFFBQUEsT0FBQSxhQUFBLEtBQUE7R0FDQSxJQUFBLEtBQUEsVUFBQSxPQUFBLGVBQUEsS0FBQTtHQUNBLElBQUEsS0FBQSxRQUFBLE9BQUEsYUFBQSxLQUFBOztHQUVBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O0VBSUEsTUFBQSxTQUFBLElBQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBLGVBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7RUFJQSxVQUFBLFNBQUEsS0FBQTtHQUNBLElBQUEsT0FBQSxRQUFBLEtBQUE7R0FDQSxLQUFBLFdBQUEsS0FBQSxTQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQSxlQUFBLEtBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQTs7Ozs7OztBQ3ZJQSxRQUFBLE9BQUEsWUFBQSxDQUFBO0tBQ0EsV0FBQSw2R0FBQSxTQUFBLFlBQUEsUUFBQSxRQUFBLGNBQUEsYUFBQSxXQUFBLFNBQUE7O1FBRUEsT0FBQTtRQUNBO1lBQ0EsUUFBQTtZQUNBLFVBQUE7WUFDQSxVQUFBO1lBQ0EsVUFBQTtZQUNBLGNBQUEsYUFBQTs7O1FBR0EsT0FBQSxRQUFBO1FBQ0E7WUFDQSxPQUFBLFlBQUE7O1lBRUEsSUFBQSxjQUFBO2dCQUNBLE9BQUEsT0FBQSxLQUFBO2dCQUNBLFVBQUEsT0FBQSxLQUFBOzs7WUFHQSxZQUFBLGFBQUE7aUJBQ0EsUUFBQSxTQUFBLFVBQUE7b0JBQ0EsYUFBQSxRQUFBLFNBQUEsU0FBQTtvQkFDQSxZQUFBO3lCQUNBLFFBQUEsU0FBQSxTQUFBOzRCQUNBLFNBQUEsV0FBQTtnQ0FDQSxhQUFBLFFBQUEsUUFBQSxLQUFBLFVBQUEsU0FBQTtnQ0FDQSxXQUFBLGNBQUEsU0FBQTtnQ0FDQSxXQUFBLGdCQUFBO2dDQUNBLE9BQUEsR0FBQSxhQUFBLElBQUEsQ0FBQSxTQUFBOytCQUNBOzt5QkFFQSxNQUFBLFNBQUEsU0FBQTs0QkFDQSxhQUFBLFdBQUE7NEJBQ0EsYUFBQSxXQUFBOzRCQUNBLFdBQUEsZ0JBQUE7NEJBQ0EsV0FBQSxjQUFBOzRCQUNBLE9BQUEsWUFBQTs0QkFDQSxHQUFBLFlBQUEsa0JBQUE7Z0NBQ0EsU0FBQSxXQUFBO29DQUNBLE9BQUEsR0FBQSxpQkFBQSxJQUFBLENBQUEsU0FBQTttQ0FDQTs7OztpQkFJQSxNQUFBLFNBQUEsVUFBQTtvQkFDQSxXQUFBLHFCQUFBLFNBQUEsU0FBQTtvQkFDQSxPQUFBLFlBQUE7b0JBQ0EsV0FBQSxlQUFBO29CQUNBLFdBQUEsY0FBQTtvQkFDQSxXQUFBLGdCQUFBOzs7O1FBSUEsT0FBQSxXQUFBLFdBQUE7WUFDQSxHQUFBLE9BQUEsS0FBQSxtQkFBQTtnQkFDQSxPQUFBLGdCQUFBOztnQkFFQSxZQUFBLFNBQUEsT0FBQTtxQkFDQSxRQUFBLFlBQUE7d0JBQ0EsT0FBQSxnQkFBQTt3QkFDQSxPQUFBLE9BQUE7O3FCQUVBLE1BQUEsVUFBQSxVQUFBO3dCQUNBLFdBQUEscUJBQUEsVUFBQTt3QkFDQSxXQUFBLGVBQUE7d0JBQ0EsT0FBQSxnQkFBQTs7Ozs7Ozs7OztRQVVBLE9BQUEsUUFBQSxDQUFBLE9BQUE7UUFDQSxPQUFBLHVCQUFBO1FBQ0E7WUFDQTtpQkFDQSxxQkFBQSxDQUFBLE9BQUEsT0FBQSxNQUFBO2lCQUNBLFFBQUEsU0FBQSxTQUFBO29CQUNBLE9BQUEsTUFBQSxRQUFBO29CQUNBLE9BQUEsb0JBQUE7O2lCQUVBLE1BQUEsU0FBQSxTQUFBO29CQUNBLFdBQUEscUJBQUEsVUFBQTtvQkFDQSxPQUFBLG9CQUFBOztpQkFFQSxLQUFBLFNBQUEsU0FBQTtvQkFDQSxHQUFBLFNBQUEsS0FBQSxXQUFBO29CQUNBO3dCQUNBLE9BQUEsb0JBQUE7Ozs7O1FBS0EsT0FBQSxpQkFBQSxZQUFBO1lBQ0EsS0FBQSxhQUFBLFVBQUEsS0FBQTtnQkFDQSxXQUFBLE9BQUE7Z0JBQ0EsYUFBQTtnQkFDQSxNQUFBO2dCQUNBLGtDQUFBLFNBQUEsa0JBQUE7b0JBQ0EsS0FBQSxRQUFBLFlBQUE7d0JBQ0Esa0JBQUEsUUFBQTs7O2dCQUdBLGNBQUE7Ozs7OztLQU1BLFdBQUEsK0dBQUEsU0FBQSxRQUFBLFlBQUEsUUFBQSxPQUFBLGNBQUEsYUFBQSxTQUFBOzs7UUFHQSxhQUFBLFdBQUE7UUFDQSxhQUFBLFdBQUE7UUFDQSxXQUFBLGdCQUFBO1FBQ0EsV0FBQSxjQUFBOztRQUVBLE9BQUEsV0FBQTtZQUNBLE9BQUEsYUFBQTs7UUFFQSxPQUFBLGNBQUE7UUFDQSxPQUFBLGNBQUEsV0FBQTtZQUNBLFlBQUEsU0FBQSxPQUFBO2lCQUNBLFFBQUEsU0FBQSxTQUFBO29CQUNBLE9BQUEsWUFBQTs7aUJBRUEsTUFBQSxTQUFBLFNBQUE7b0JBQ0EsR0FBQSxTQUFBLFNBQUEsZUFBQTt3QkFDQSxXQUFBLHFCQUFBLFNBQUEsU0FBQTswQkFDQSxHQUFBLFNBQUEsU0FBQSxjQUFBO3dCQUNBLE9BQUEsY0FBQTt3QkFDQSxXQUFBLHFCQUFBLFNBQUEsU0FBQTs7b0JBRUEsT0FBQSxZQUFBOzs7OztLQUtBLFFBQUEsMEZBQUEsU0FBQSxPQUFBLFNBQUEsVUFBQSxRQUFBLFlBQUEsZUFBQTtRQUNBLE9BQUE7Ozs7Ozs7O1lBUUEsY0FBQSxTQUFBLFlBQUE7Z0JBQ0EsT0FBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsS0FBQSxlQUFBO29CQUNBLE1BQUE7Ozs7WUFJQSxTQUFBLFVBQUE7Z0JBQ0EsT0FBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsS0FBQSxlQUFBOzs7Ozs7Ozs7WUFTQSxRQUFBO1lBQ0E7Z0JBQ0EsYUFBQSxXQUFBO2dCQUNBLGFBQUEsV0FBQTtnQkFDQSxXQUFBLGdCQUFBO2dCQUNBLFdBQUEsY0FBQTtnQkFDQSxPQUFBLEdBQUEsY0FBQSxJQUFBLENBQUEsVUFBQTs7O1lBR0Esc0JBQUEsU0FBQSxhQUFBO2dCQUNBLE9BQUEsTUFBQTtvQkFDQSxRQUFBO29CQUNBLEtBQUEsZUFBQTtvQkFDQSxTQUFBLEVBQUEsaUJBQUE7b0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7WUFJQSxlQUFBLFNBQUEsYUFBQTtnQkFDQSxPQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxLQUFBLGVBQUE7b0JBQ0EsU0FBQSxFQUFBLGlCQUFBO29CQUNBLE1BQUEsRUFBQSxNQUFBOzs7O1lBSUEsVUFBQSxTQUFBLGFBQUE7Z0JBQ0EsT0FBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsS0FBQSxlQUFBO29CQUNBLFNBQUEsRUFBQSxpQkFBQTtvQkFDQSxNQUFBLEVBQUEsTUFBQTs7OztZQUlBLFVBQUEsU0FBQSxPQUFBO2dCQUNBLE9BQUEsTUFBQTtvQkFDQSxRQUFBO29CQUNBLEtBQUEsZUFBQTtvQkFDQSxTQUFBLEVBQUEsaUJBQUE7b0JBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7WUFJQSxxQkFBQSxTQUFBLG9CQUFBOzs7Z0JBR0EsT0FBQSxNQUFBO29CQUNBLFFBQUE7b0JBQ0EsS0FBQSxlQUFBOztxQkFFQSxRQUFBLFNBQUE7b0JBQ0E7Ozs7d0JBSUEsR0FBQSxDQUFBLFNBQUE7d0JBQ0E7NEJBQ0Esc0JBQUE7NEJBQ0EsYUFBQSxXQUFBOzRCQUNBLGFBQUEsV0FBQTs0QkFDQSxXQUFBLGdCQUFBOzRCQUNBLFdBQUEsY0FBQTs7NEJBRUEsT0FBQSxHQUFBOzRCQUNBLE9BQUE7Ozs7d0JBSUEsYUFBQSxRQUFBLFNBQUEsU0FBQTs7Ozs7Ozs7Ozs7Ozt3QkFhQSxTQUFBLE9BQUE7O3FCQUVBLE1BQUEsVUFBQTt3QkFDQSxzQkFBQTt3QkFDQSxhQUFBLFdBQUE7d0JBQ0EsYUFBQSxXQUFBO3dCQUNBLFdBQUEsZ0JBQUE7d0JBQ0EsV0FBQSxjQUFBOzt3QkFFQSxPQUFBLEdBQUE7d0JBQ0EsT0FBQTs7Ozs7QUN6UUEsUUFBQSxPQUFBLGdCQUFBOzs7OztDQUtBLFdBQUEsd0VBQUEsU0FBQSxPQUFBLE1BQUEsVUFBQSxnQkFBQTs7Q0FFQSxTQUFBLE1BQUE7O0VBRUEsVUFBQSxlQUFBOztFQUVBLE9BQUEsaUJBQUEsQ0FBQTtZQUNBLEtBQUEsZUFBQTs7O0tBR0EsT0FBQSxXQUFBO09BQ0EsU0FBQTtNQUNBLE1BQUE7TUFDQSxZQUFBO09BQ0EsVUFBQTtPQUNBLFVBQUE7T0FDQSxVQUFBO09BQ0EsVUFBQTs7R0FFQSxVQUFBO0dBQ0EsYUFBQTtHQUNBLFFBQUE7SUFDQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLE9BQUE7O0dBRUEsY0FBQTtJQUNBLEtBQUE7SUFDQSxNQUFBO0lBQ0EsT0FBQTs7R0FFQSxhQUFBO09BQ0EsT0FBQTtPQUNBLE1BQUE7T0FDQSxLQUFBOztHQUVBLGlCQUFBO0dBQ0EsWUFBQTtHQUNBLFlBQUE7R0FDQSxTQUFBO0dBQ0EsU0FBQTtHQUNBLFlBQUE7R0FDQSxhQUFBO1NBQ0EsUUFBQTtTQUNBLFVBQUE7U0FDQSxZQUFBLFNBQUEsTUFBQSxTQUFBO0lBQ0EsSUFBQSxRQUFBLEtBQUEsTUFBQSxLQUFBLE1BQUE7SUFDQSxJQUFBLE1BQUEsS0FBQSxNQUFBLEtBQUEsSUFBQTtJQUNBLE9BQUEsaUJBQUEsQ0FBQTtjQUNBLEtBQUEsZUFBQSxrQkFBQSxNQUFBLFFBQUE7OztHQUdBLFlBQUEsT0FBQTtTQUNBLFdBQUEsT0FBQTtTQUNBLGFBQUEsU0FBQSxNQUFBLFNBQUE7VUFDQSxRQUFBLElBQUE7Ozs7O0tBS0EsT0FBQSxhQUFBLFNBQUEsS0FBQSxVQUFBO09BQ0EsU0FBQSxhQUFBLGFBQUE7OztLQUdBLE9BQUEsaUJBQUEsU0FBQSxVQUFBO1FBQ0EsU0FBQSxVQUFBO1NBQ0EsUUFBQSxJQUFBO0lBQ0EsR0FBQSxTQUFBO0lBQ0EsU0FBQSxhQUFBOztXQUVBOzs7O0NBSUE7OztBQy9FQSxRQUFBLE9BQUEsNkJBQUE7O0NBRUEsV0FBQSxvSEFBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLDRCQUFBLFNBQUE7Q0FDQSxJQUFBLE9BQUE7O0NBRUEsS0FBQSxPQUFBLFdBQUE7RUFDQSxXQUFBLGVBQUE7RUFDQSxJQUFBLE9BQUE7R0FDQSxrQkFBQSxhQUFBO0dBQ0EsY0FBQSxhQUFBO0dBQ0EsVUFBQSxhQUFBO0dBQ0EsaUJBQUEsYUFBQTtHQUNBLFFBQUEsYUFBQTs7RUFFQSwyQkFBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLFVBQUEsU0FBQTtJQUNBLEtBQUEsZUFBQSxTQUFBO0lBQ0EsV0FBQSxlQUFBOzs7O0NBSUEsS0FBQSxhQUFBLFVBQUE7RUFDQSxJQUFBLE9BQUE7R0FDQSxrQkFBQSxhQUFBO0dBQ0EsUUFBQSxLQUFBLFFBQUE7R0FDQSxjQUFBLEtBQUEsUUFBQTtHQUNBLFVBQUEsS0FBQSxRQUFBO0dBQ0EsaUJBQUEsS0FBQSxRQUFBOztFQUVBLE9BQUEsR0FBQSw4QkFBQSxNQUFBLENBQUEsU0FBQTs7O0NBR0EsS0FBQTs7O0NBR0EsUUFBQSwwREFBQSxTQUFBLE9BQUEsZUFBQTs7Q0FFQSxPQUFBO0VBQ0EsTUFBQSxVQUFBLE1BQUE7O0dBRUEsSUFBQSxNQUFBLGVBQUEsaUJBQUEsS0FBQSxpQkFBQTtHQUNBLGVBQUEsQ0FBQSxLQUFBLGdCQUFBLEtBQUEsZUFBQTs7R0FFQSxPQUFBLFdBQUE7R0FDQSxJQUFBLEtBQUEsUUFBQSxPQUFBLGFBQUEsS0FBQTtHQUNBLElBQUEsS0FBQSxVQUFBLE9BQUEsZUFBQSxLQUFBO0dBQ0EsSUFBQSxLQUFBLGlCQUFBLE9BQUEsc0JBQUEsS0FBQTtHQUNBLElBQUEsS0FBQSxlQUFBLE9BQUEsYUFBQSxLQUFBOztHQUVBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBO0lBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7Ozs7O0FDckRBLFFBQUEsT0FBQSxxQkFBQTs7Q0FFQSxXQUFBLHNHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxxQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLFdBQUEsTUFBQTtRQUNBLHFCQUFBLEtBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGdCQUFBLFNBQUE7OztJQUdBLFNBQUEsV0FBQTs7SUFFQSxLQUFBLE9BQUEsU0FBQSxhQUFBLE1BQUE7SUFDQSxLQUFBLE9BQUEsYUFBQTtJQUNBLEtBQUEsY0FBQSxDQUFBLFdBQUEsUUFBQTtJQUNBO0lBQ0E7Ozs7Q0FJQSxXQUFBLHFHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxzQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLE1BQUE7UUFDQSxxQkFBQSxLQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGVBQUEsU0FBQTs7YUFFQSxNQUFBLFVBQUE7Z0JBQ0EsT0FBQSxHQUFBLHVCQUFBLElBQUEsQ0FBQSxTQUFBOzs7O0lBSUE7Ozs7Q0FJQSxRQUFBLG9EQUFBLFNBQUEsT0FBQSxnQkFBQTs7SUFFQSxPQUFBO1FBQ0EsTUFBQSxVQUFBLE1BQUEsSUFBQTtZQUNBLElBQUEsTUFBQSxlQUFBOztZQUVBLElBQUEsQ0FBQSxRQUFBLFlBQUEsT0FBQSxLQUFBLEdBQUEsT0FBQSxNQUFBO1lBQ0EsSUFBQSxNQUFBLE9BQUEsV0FBQTs7WUFFQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBO2dCQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztRQUlBLE1BQUEsU0FBQSxJQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBLGlCQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7Ozs7Ozs7QUMxREEsUUFBQSxPQUFBLHNCQUFBOztDQUVBLFdBQUEsa0dBQUEsU0FBQSxZQUFBLGNBQUEsUUFBQSxxQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxTQUFBLGNBQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxvQkFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEtBQUEsUUFBQSxTQUFBO2dCQUNBLEtBQUEsY0FBQTtnQkFDQSxXQUFBLGVBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBO2dCQUNBLFdBQUEsZUFBQTs7OztJQUlBLEtBQUEsZ0JBQUEsVUFBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLG9CQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Z0JBQ0EsT0FBQSxHQUFBO2dCQUNBLFdBQUEsZUFBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7O0lBSUE7O0NBRUEsV0FBQSw0SEFBQSxTQUFBLFlBQUEsY0FBQSxRQUFBLHFCQUFBLFdBQUEsV0FBQSxNQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsY0FBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLG9CQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxvQkFBQSxTQUFBO2dCQUNBLEtBQUEsb0JBQUEsU0FBQTtnQkFDQSxLQUFBLG9CQUFBLFNBQUE7Z0JBQ0EsS0FBQSxjQUFBO2dCQUNBLFdBQUEsZUFBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7O0lBSUEsS0FBQSxtQkFBQSxTQUFBLFFBQUE7O1FBRUEsSUFBQSxnQkFBQSxVQUFBLEtBQUE7WUFDQSxXQUFBO1lBQ0EsYUFBQTtZQUNBLFlBQUE7WUFDQSxNQUFBO1lBQ0EsU0FBQTtnQkFDQSxTQUFBLFlBQUE7b0JBQ0EsT0FBQTs7Ozs7UUFLQSxjQUFBLE9BQUEsS0FBQSxZQUFBO1lBQ0E7Ozs7SUFJQSxLQUFBLFdBQUEsU0FBQSxRQUFBO1FBQ0Esb0JBQUEsU0FBQSxRQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsSUFBQSxPQUFBLElBQUEsS0FBQSxDQUFBLFdBQUEsQ0FBQSxNQUFBO2dCQUNBLEdBQUEsS0FBQSxNQUFBO29CQUNBLFVBQUEsT0FBQSxNQUFBLGFBQUEsUUFBQSxvQkFBQTs7Ozs7SUFLQTs7Q0FFQSxXQUFBLDhHQUFBLFNBQUEsWUFBQSxjQUFBLFFBQUEscUJBQUEsV0FBQSxNQUFBO0lBQ0EsSUFBQSxPQUFBO0lBQ0EsU0FBQSxjQUFBO1FBQ0EsV0FBQSxlQUFBO1FBQ0Esb0JBQUEsS0FBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsR0FBQSxDQUFBLFNBQUEsU0FBQSxPQUFBLEdBQUE7Z0JBQ0EsS0FBQSxVQUFBLFNBQUE7Z0JBQ0EsS0FBQSxjQUFBO2dCQUNBLFdBQUEsZUFBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7O0lBSUEsS0FBQSxXQUFBLFNBQUEsUUFBQTtRQUNBLG9CQUFBLFNBQUEsUUFBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLElBQUEsT0FBQSxJQUFBLEtBQUEsQ0FBQSxXQUFBLENBQUEsTUFBQTtnQkFDQSxHQUFBLEtBQUEsTUFBQTtvQkFDQSxVQUFBLE9BQUEsTUFBQSxhQUFBLFFBQUEsb0JBQUE7Ozs7O0lBS0E7O0NBRUEsV0FBQSx1R0FBQSxVQUFBLFFBQUEsbUJBQUEsU0FBQSxxQkFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxLQUFBLFVBQUE7UUFDQSxXQUFBO1FBQ0EsYUFBQTtRQUNBLFNBQUEsSUFBQTtRQUNBLFNBQUEsT0FBQSxRQUFBLGNBQUEsUUFBQTs7SUFFQSxLQUFBLFVBQUEsUUFBQSxLQUFBOztJQUVBLEtBQUEsa0JBQUEsVUFBQSxTQUFBO1FBQ0EsR0FBQSxRQUFBLFdBQUEsQ0FBQSxLQUFBLGFBQUE7WUFDQSxLQUFBLGVBQUE7WUFDQSxvQkFBQSxnQkFBQSxRQUFBLElBQUEsUUFBQTtpQkFDQSxRQUFBLFNBQUEsU0FBQTtvQkFDQSxrQkFBQTs7aUJBRUEsUUFBQSxVQUFBO29CQUNBLEtBQUEsZUFBQTs7Ozs7SUFLQSxLQUFBLFNBQUEsWUFBQTtRQUNBLGtCQUFBLFFBQUE7OztDQUdBLFFBQUEsbURBQUEsU0FBQSxPQUFBLGVBQUE7O0lBRUEsT0FBQTtRQUNBLE1BQUEsU0FBQSxJQUFBO1lBQ0EsSUFBQSxNQUFBLENBQUEsTUFBQSxJQUFBLEtBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7UUFJQSxvQkFBQSxXQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztRQUlBLGdCQUFBLFVBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O1FBSUEsTUFBQSxTQUFBLElBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUEsZ0JBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O1FBSUEsaUJBQUEsU0FBQSxJQUFBLFFBQUE7O1lBRUEsVUFBQSxPQUFBLElBQUEsS0FBQSxVQUFBLE9BQUE7O1lBRUEsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBLGdCQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFNBQUE7Ozs7UUFJQSxVQUFBLFNBQUEsR0FBQTtZQUNBLEdBQUEsR0FBQTtnQkFDQSxPQUFBLE1BQUE7b0JBQ0EsUUFBQTtvQkFDQSxLQUFBLGVBQUEsZ0JBQUEsR0FBQTtvQkFDQSxjQUFBO29CQUNBLFNBQUEsRUFBQSxpQkFBQTs7Ozs7Ozs7QUNwTUEsUUFBQSxPQUFBLGFBQUE7O0NBRUEsV0FBQSxxRUFBQSxTQUFBLFlBQUEsUUFBQSxRQUFBLGFBQUE7Q0FDQSxJQUFBLE9BQUE7O0NBRUEsS0FBQSxTQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7O0VBRUEsVUFBQTtHQUNBLFFBQUE7Ozs7Q0FJQSxLQUFBLFlBQUE7O0NBRUEsU0FBQSxlQUFBO0VBQ0EsV0FBQSxlQUFBO0VBQ0EsYUFBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsS0FBQSxnQkFBQTtJQUNBLEdBQUEsQ0FBQSxTQUFBLEdBQUE7S0FDQSxPQUFBLEdBQUEsZ0JBQUEsSUFBQSxDQUFBLFNBQUE7O0lBRUEsS0FBQSxPQUFBO0lBQ0EsV0FBQSxlQUFBOzs7O0NBSUEsS0FBQSxhQUFBLFVBQUE7RUFDQSxhQUFBLFdBQUEsS0FBQTtJQUNBLFFBQUEsU0FBQSxTQUFBO0lBQ0EsT0FBQSxHQUFBLG9CQUFBLElBQUEsQ0FBQSxTQUFBOztJQUVBLE1BQUEsU0FBQSxTQUFBO0lBQ0EsV0FBQSxxQkFBQSxVQUFBOzs7O0NBSUEsS0FBQSxpQkFBQSxTQUFBO0NBQ0E7RUFDQSxHQUFBLE1BQUE7R0FDQSxhQUFBLGVBQUE7S0FDQSxRQUFBLFVBQUE7S0FDQTs7S0FFQSxNQUFBLFNBQUEsU0FBQTtLQUNBLFdBQUEscUJBQUEsU0FBQTs7Ozs7Q0FLQSxLQUFBLG9CQUFBLFNBQUE7Q0FDQTtFQUNBLEdBQUEsTUFBQTtHQUNBLGFBQUEsa0JBQUE7S0FDQSxRQUFBLFVBQUE7S0FDQTs7S0FFQSxNQUFBLFNBQUEsU0FBQTtLQUNBLFdBQUEscUJBQUEsU0FBQTs7Ozs7Q0FLQTs7O0NBR0EsV0FBQSw0RUFBQSxTQUFBLFlBQUEsUUFBQSxRQUFBLGNBQUE7Q0FDQSxJQUFBLE9BQUE7O0NBRUEsS0FBQSxjQUFBO0NBQ0EsS0FBQSxlQUFBO0NBQ0EsS0FBQSxXQUFBO0NBQ0EsS0FBQSxlQUFBO0NBQ0EsS0FBQSxhQUFBOztDQUVBLFNBQUEsZUFBQTtFQUNBLFdBQUEsZUFBQTtFQUNBLGFBQUE7SUFDQSxRQUFBLFNBQUEsU0FBQTtJQUNBLEtBQUEsZ0JBQUE7SUFDQSxHQUFBLFNBQUEsR0FBQTtLQUNBLE9BQUEsR0FBQSxvQkFBQSxJQUFBLENBQUEsU0FBQTs7SUFFQSxLQUFBLE9BQUE7SUFDQSxXQUFBLGVBQUE7Ozs7O0NBS0EsS0FBQSxpQkFBQSxTQUFBLGFBQUE7Q0FDQTtFQUNBLE9BQUE7SUFDQSxlQUFBO0lBQ0EsTUFBQSxTQUFBLFNBQUE7SUFDQSxXQUFBLHFCQUFBLFVBQUE7O0lBRUEsS0FBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGNBQUEsU0FBQSxLQUFBLE1BQUEsU0FBQTtJQUNBLE9BQUEsU0FBQSxLQUFBLE1BQUEsSUFBQSxTQUFBLEtBQUE7S0FDQSxLQUFBLGtCQUFBO0tBQ0EsR0FBQSxLQUFBLE1BQUEsS0FBQSxJQUFBLEtBQUEsa0JBQUE7S0FDQSxPQUFBOzs7OztDQUtBLEtBQUEsYUFBQSxTQUFBO0NBQ0E7RUFDQSxHQUFBLE1BQUEsb0JBQUEsTUFBQSxPQUFBO0VBQ0EsS0FBQSxrQkFBQTtFQUNBLEtBQUEsV0FBQTs7O0NBR0EsS0FBQSxlQUFBO0NBQ0E7RUFDQSxLQUFBLGtCQUFBO0VBQ0EsS0FBQSxXQUFBOzs7Q0FHQSxLQUFBLGlCQUFBLFNBQUE7Q0FDQTtFQUNBLGFBQUEsZUFBQSxLQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLFdBQUE7SUFDQSxLQUFBLGFBQUE7SUFDQSxLQUFBLE9BQUE7SUFDQSxPQUFBLEdBQUEsb0JBQUEsSUFBQSxDQUFBLFVBQUE7Ozs7Q0FJQSxLQUFBLGFBQUE7Q0FDQTtFQUNBLEdBQUEsQ0FBQSxLQUFBLGVBQUEsQ0FBQSxLQUFBLGNBQUEsT0FBQTtFQUNBLElBQUEsT0FBQTtHQUNBLE1BQUEsS0FBQTtHQUNBLFVBQUEsS0FBQTs7O0VBR0EsYUFBQSxXQUFBO0lBQ0EsUUFBQSxTQUFBLFNBQUE7SUFDQSxLQUFBLGNBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxLQUFBLFdBQUE7SUFDQSxLQUFBLGFBQUE7SUFDQSxLQUFBLE9BQUE7SUFDQSxPQUFBLEdBQUEsb0JBQUEsSUFBQSxDQUFBLFVBQUE7Ozs7Q0FJQTs7OztDQUlBLFFBQUEsNENBQUEsU0FBQSxPQUFBLGVBQUE7O0NBRUEsT0FBQTtFQUNBLE1BQUEsVUFBQSxNQUFBLElBQUE7R0FDQSxJQUFBLE1BQUEsZUFBQTs7R0FFQSxJQUFBLENBQUEsUUFBQSxZQUFBLE9BQUEsS0FBQSxHQUFBLE9BQUEsTUFBQTtHQUNBLElBQUEsTUFBQSxPQUFBLFdBQUE7O0dBRUEsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7Ozs7RUFJQSxNQUFBLFNBQUEsSUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUEsU0FBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTs7OztFQUlBLFlBQUEsU0FBQSxNQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBOzs7O0VBSUEsWUFBQSxTQUFBLE1BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUE7Ozs7RUFJQSxZQUFBLFNBQUEsTUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUEsU0FBQSxLQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBOzs7O0VBSUEsY0FBQSxVQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsQ0FBQSxnQkFBQTs7OztFQUlBLGdCQUFBLFNBQUEsU0FBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUE7Ozs7RUFJQSxZQUFBLFNBQUEsS0FBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLENBQUEsZ0JBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLFlBQUEsS0FBQSxVQUFBLFFBQUEsS0FBQTs7OztFQUlBLGdCQUFBLFNBQUEsUUFBQTtHQUNBLE9BQUEsTUFBQTtJQUNBLFFBQUE7SUFDQSxLQUFBLGVBQUE7SUFDQSxTQUFBLEVBQUEsaUJBQUE7SUFDQSxNQUFBLEVBQUEsTUFBQSxDQUFBLGVBQUE7Ozs7RUFJQSxnQkFBQSxTQUFBLE9BQUE7R0FDQSxPQUFBLE1BQUE7SUFDQSxRQUFBO0lBQ0EsS0FBQSxlQUFBO0lBQ0EsU0FBQSxFQUFBLGlCQUFBO0lBQ0EsTUFBQSxFQUFBLE1BQUEsQ0FBQSxTQUFBOzs7O0VBSUEsbUJBQUEsU0FBQSxPQUFBO0dBQ0EsT0FBQSxNQUFBO0lBQ0EsUUFBQTtJQUNBLEtBQUEsZUFBQTtJQUNBLFNBQUEsRUFBQSxpQkFBQTtJQUNBLE1BQUEsRUFBQSxNQUFBLENBQUEsU0FBQTs7Ozs7QUM5UEEsUUFBQSxPQUFBLGlDQUFBOztDQUVBLFdBQUEsZ0pBQUEsU0FBQSxZQUFBLFFBQUEsY0FBQSxRQUFBLGlDQUFBLFdBQUEsTUFBQTtJQUNBLElBQUEsT0FBQTs7SUFFQSxLQUFBLFNBQUE7UUFDQSxnQkFBQTtZQUNBLFdBQUE7WUFDQSxTQUFBOzs7O0lBSUEsS0FBQSxzQkFBQSxTQUFBLFlBQUE7UUFD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QSxlQUFBLFVBQUE7UUFDQSxLQUFBLGVBQUE7UUFDQSxnQ0FBQSxhQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLFFBQUEsS0FBQSxTQUFBO2dCQUNBLEtBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBOzthQUVBLFFBQUEsVUFBQTtnQkFDQSxLQUFBLGVBQUE7Ozs7SUFJQSxLQUFBLGVBQUEsU0FBQSxPQUFBO1FBQ0EsS0FBQSxlQUFBO1FBQ0EsZ0NBQUEsYUFBQSxhQUFBLGlCQUFBLE9BQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLFFBQUEsT0FBQSxLQUFBLFFBQUEsUUFBQSxTQUFBO2dCQUNBLEdBQUEsU0FBQSxRQUFBO29CQUNBLFFBQUEsUUFBQSxTQUFBLFNBQUEsU0FBQSxRQUFBLElBQUE7d0JBQ0EsS0FBQSxRQUFBLEtBQUE7OztnQkFHQSxLQUFBLG1CQUFBO2dCQUNBLEtBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxVQUFBOzthQUVBLFFBQUEsVUFBQTtnQkFDQSxLQUFBLGVBQUE7Ozs7SUFJQSxLQUFBLG1CQUFBLFVBQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxnQ0FBQSxpQkFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxVQUFBO2dCQUNBLEtBQUEsVUFBQSxTQUFBO2dCQUNBLEtBQUEsbUJBQUE7Z0JBQ0EsS0FBQTs7YUFFQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7O2FBRUEsUUFBQSxVQUFBO2dCQUNBLFdBQUEsZUFBQTs7OztJQUlBLEtBQUEsY0FBQSxTQUFBLE9BQUE7UUFDQSxLQUFBLGVBQUE7UUFDQSxnQ0FBQSxZQUFBLGFBQUEsaUJBQUEsT0FBQTthQUNBLFFBQUEsU0FBQSxTQUFBO2dCQUNBLEdBQUEsU0FBQSxRQUFBO29CQUNBLFFBQUEsUUFBQSxTQUFBLFNBQUEsU0FBQSxRQUFBLElBQUE7d0JBQ0EsT0FBQSxPQUFBO3dC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QUFBLE1BQUEsWUFBQSxLQUFBLElBQUEsWUFBQSxPQUFBLE1BQUEsWUFBQSxhQUFBLHdCQUFBOzs7YUFHQSxNQUFBLFNBQUEsU0FBQTtnQkFDQSxXQUFBLHFCQUFBLFVBQUE7O2FBRUEsUUFBQSxVQUFBO2dCQUNBLFdBQUEsZUFBQTs7OztJQUlBLEtBQUE7OztDQUdBLFdBQUEseUlBQUEsVUFBQSxRQUFBLGNBQUEsbUJBQUEsUUFBQSxhQUFBLGlDQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLEtBQUEsY0FBQTs7SUFFQSxLQUFBLFVBQUE7UUFDQSxXQUFBO1FBQ0EsYUFBQTtRQUNBLFNBQUEsSUFBQTs7O0lBR0EsSUFBQSxhQUFBLE9BQUEsT0FBQTtJQUNBLElBQUEsV0FBQSxPQUFBLE9BQUE7SUFDQSxJQUFBLGNBQUEsU0FBQSxLQUFBLFlBQUE7O0lBRUEsS0FBQSxTQUFBO1FBQ0EsWUFBQTtRQUNBLFVBQUE7UUFDQSxhQUFBO1FBQ0EsSUFBQSxPQUFBO1FBQ0EsYUFBQSxPQUFBO1FBQ0EsaUJBQUEsT0FBQTs7O0lBR0EsS0FBQSxlQUFBLFVBQUEsUUFBQTtRQUNBLEdBQUEsQ0FBQSxLQUFBLGFBQUE7WUFDQSxLQUFBLGVBQUE7WUFDQSxnQ0FBQSxXQUFBLGFBQUEsaUJBQUE7aUJBQ0EsUUFBQSxTQUFBLFNBQUE7b0JBQ0Esa0JBQUEsTUFBQTs7aUJBRUEsUUFBQSxVQUFBO29CQUNBLEtBQUEsZUFBQTs7Ozs7SUFLQSxLQUFBLGFBQUEsU0FBQSxNQUFBOztRQUVBLEdBQUEsS0FBQSxPQUFBLFdBQUEsS0FBQSxPQUFBLFdBQUE7WUFDQSxLQUFBLE9BQUEsV0FBQSxPQUFBLEtBQUEsT0FBQSxZQUFBLElBQUEsR0FBQSxPQUFBLE9BQUE7O1FBRUEsSUFBQSxRQUFBLFNBQUE7WUFDQSxLQUFBLE9BQUEsV0FBQSxPQUFBLEtBQUEsT0FBQSxZQUFBLElBQUEsS0FBQSxPQUFBLGFBQUEsU0FBQSxPQUFBO2VBQ0EsSUFBQSxRQUFBLE9BQUE7WUFDQSxJQUFBLFFBQUEsT0FBQSxLQUFBLE9BQUE7WUFDQSxJQUFB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LE1BQUE7Ozs7Ozs7Q0FPQSxRQUFBLCtDQUFBLFNBQUEsT0FBQSxlQUFBO0lBQ0EsT0FBQTtRQUNBLGlCQUFBLFVBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxDQUFBLGdCQUFBOzs7O1FBSUEsaUJBQUEsU0FBQSxLQUFBO1lBQ0EsSUFBQSxPQUFBLFFBQUEsS0FBQTtZQUNBLEtBQUEsV0FBQSxLQUFBLFNBQUE7WUFDQSxPQUFBLE1BQUE7Z0JBQ0EsUUFBQTtnQkFDQSxLQUFBLGVBQUE7Z0JBQ0EsU0FBQSxFQUFBLGlCQUFBO2dCQUNBLE1BQUEsRUFBQSxNQUFBOzs7O1FBSUEsZ0JBQUEsU0FBQSxhQUFBO1lBQ0EsT0FBQSxNQUFBO2dCQUNBLFFBQUE7Z0JBQ0EsS0FBQSxlQUFBO2dCQUNBLFNBQUEsRUFBQSxpQkFBQTtnQkFDQSxNQUFBLEVBQUEsTUFBQTs7OztRQUlBLGVBQUEsV0FBQTtZQUNBLE9BQUEsTUFBQTtnQkFDQSxRQUFBO2dCQUNBLEtBQUEsZUFBQTtnQkFDQSxTQUFBLEVBQUEsaUJBQUE7Ozs7OztBQzlQQSxRQUFBLE9BQUEsZUFBQTs7Q0FFQSxXQUFBLDBGQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxlQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsV0FBQSxNQUFBO1FBQ0EsV0FBQSxlQUFBO1FBQ0EsZUFBQSxLQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxVQUFBLFNBQUE7Z0JBQ0EsS0FBQSxvQkFBQSxTQUFBO2dCQUNBLFdBQUEsZUFBQTs7O0lBR0EsU0FBQSxXQUFBOztJQUVBLEtBQUEsT0FBQSxTQUFBLGFBQUEsTUFBQTtJQUNBLEtBQUEsT0FBQSxhQUFBO0lBQ0EsS0FBQSxjQUFBLENBQUEsV0FBQSxRQUFBO0lBQ0E7SUFDQTs7Q0FFQSxXQUFBLHFHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxVQUFBLGdCQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsTUFBQTtRQUNBLFdBQUEsZUFBQTtRQUNBLGVBQUEsS0FBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsS0FBQSxVQUFBLFNBQUE7Z0JBQ0EsS0FBQSxPQUFBLEtBQUEsTUFBQSxhQUFBLFFBQUE7Z0JBQ0EsV0FBQSxlQUFBOzthQUVBLE1BQUEsVUFBQTtnQkFDQSxXQUFBLGVBQUE7Z0JBQ0EsT0FBQSxHQUFBLFdBQUEsSUFBQSxDQUFBLFNBQUE7Ozs7SUFJQSxLQUFBLGVBQUEsU0FBQSxPQUFBO1FBQ0EsS0FBQSxRQUFBO1FBQ0EsZUFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBO2dCQUNBLFNBQUEsUUFBQSxpQ0FBQSxTQUFBLFNBQUEsUUFBQTtnQkFDQSxTQUFBLFFBQUEsbUJBQUEsU0FBQSxTQUFBLFFBQUE7Z0JBQ0EsS0FBQSxRQUFBLFVBQUEsU0FBQTtnQkFDQSxLQUFBLFFBQUE7Z0JBQ0EsT0FBQSxHQUFBLFdBQUEsQ0FBQSxJQUFBLE9BQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Ozs7SUFJQSxLQUFBLGVBQUEsU0FBQSxPQUFBO1FBQ0EsZUFBQSxhQUFBO2FBQ0EsUUFBQSxTQUFBLFNBQUE7Z0JBQ0EsT0FBQSxHQUFBOzs7Ozs7SUFNQTs7Q0FFQSxXQUFBLHlHQUFBLFNBQUEsWUFBQSxRQUFBLGNBQUEsUUFBQSxVQUFBLGdCQUFBO0lBQ0EsSUFBQSxPQUFBOztJQUVBLFNBQUEsaUJBQUE7UUFDQSxXQUFBLGVBQUE7UUFDQSxlQUFBLGdCQUFBLGFBQUE7YUFDQSxRQUFBLFNBQUEsU0FBQTtnQkFDQSxLQUFBLGNBQUEsU0FBQTtnQkFDQSxLQUFBLE9BQUEsU0FBQTtnQkFDQSxXQUFBLGVBQUE7O2FBRUEsTUFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxxQkFBQSxTQUFBLFNBQUE7Z0JBQ0EsV0FBQSxlQUFBOzs7OztJQUtBLEtBQUEsZUFBQSxTQUFBLFNBQUEsaUJBQUE7UUFDQSxHQUFBLEtBQUEsY0FBQSxPQUFB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LElBQUEsU0FBQSxRQUFBO1VBQ0EsSUFBQSxRQUFBLFFBQUEsU0FBQTs7WUFFQSxhQUFBLEtBQUE7aUJBQ0EsR0FBQSxRQUFBLFNBQUEsV0FBQSxRQUFBLFFBQUEsT0FBQSxRQUFBOztZQUVBLElBQUEsV0FBQTtZQUNBLElBQUEsSUFBQSxPQUFBLE9BQUE7Y0FDQSxHQUFBLFFBQUEsY0FBQSxRQUFBLFNBQUE7aUJBQ0EsU0FBQSxPQUFBLE9BQUE7OztZQUdBLElBQUEsSUFBQSxLQUFBLEVBQUEsS0FBQSxPQUFBLE9BQUEsT0FBQSxLQUFBO2NBQ0EsUUFBQSxPQUFBLE9BQUEsT0FBQSxJQUFBOztZQUVBLGFBQUEsS0FBQSxPQUFBOzs7O1FBSUEsT0FBQSxNQUFBLFVBQUEsT0FBQSxNQUFBLElBQUE7Ozs7Ozs7TUFPQSxLQUFBLGdCQUFBLFNBQUEsYUFBQSxTQUFBO1FBQ0EsSUFBQTtRQUNBLElBQUEsWUFBQSxXQUFBO1VBQ0EsSUFBQSxRQUFBLFFBQUEsV0FBQSxlQUFBLGdCQUFBO1VBQ0EsSUFBQSxTQUFBLElBQUEsT0FBQTtVQUNBLEtBQUEsSUFBQSxJQUFBLEdBQUEsSUFBQSxNQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7WUFDQSxLQUFBLE1BQUE7WUFDQSxRQUFBLFFBQUE7WUFDQSxJQUFBLFNBQUE7WUFDQSxPQUFBLEtBQUE7O1VBRUEsT0FBQTs7OztRQUlBLElBQUEsaUJBQUEsU0FBQSxHQUFBLEdBQUE7VUFDQSxJQUFBLFNBQUEsSUFBQSxNQUFBLElBQUEsR0FBQTtVQUNBLEtBQUEsSUFBQSxHQUFBLElBQUEsRUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO1lBQ0EsSUFBQSxFQUFBLE1BQUE7O1VBRUEsS0FBQSxJQUFBLEdBQUEsSUFBQSxFQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7WUFDQSxJQUFBLENBQUEsSUFBQSxFQUFBLEtBQUE7Y0FDQSxPQUFBLEtBQUEsRUFBQTs7O1VBR0EsT0FBQTs7OztRQUlBLElBQUEsTUFBQTs7UUFFQSxJQUFBLGVBQUEsU0FBQSxXQUFBLFdBQUE7VUFDQSxJQUFBLEdBQUEsR0FBQSxJQUFBO1VBQ0EsSUFBQSxpQkFBQTtVQUNBLElBQUEsZ0JBQUEsZUFBQSxXQUFBO1VBQ0EsS0FBQSxJQUFBLEdBQUEsSUFBQSxjQUFBLFFBQUEsSUFBQSxHQUFBLEtBQUE7WUFDQSxJQUFBLGVBQUEsY0FBQTtZQUNBLEtBQUEsSUFBQTtZQUNBLE9BQUEsSUFBQTtZQUNBLElBQUEsV0FBQSxRQUFBOztZQUVBLElBQUEsYUFBQSxjQUFBO2NBQ0EsS0FBQSxVQUFBO21CQUNBO2NBQ0EsZUFBQSxZQUFBO2NBQ0EsS0FBQSxVQUFBOzs7O1VBSUEsSUFBQSxjQUFBLGVBQUEsV0FBQTtVQUNBLEtBQUEsSUFBQSxHQUFBLElBQUEsWUFBQSxRQUFBLElBQUEsR0FBQSxLQUFBO1lBQ0EsUUFBQSxZQUFBO1lBQ0EsS0FBQSxJQUFBO1lBQ0EsSUFBQSxDQUFBLGVBQUEsUUFBQTtjQUNBLEtBQUEsUUFBQTs7OztRQUlBLE9BQUE7VUFDQSxXQUFBLFNBQUEsT0FBQSxXQUFBO1lBQ0EsTUFBQSxPQUFBLFdBQUEsU0FBQSxXQUFBLFdBQUE7Y0FDQSxJQUFBLENBQUEsYUFBQSxVQUFBLFdBQUEsZUFBQSxPQUFBO2dCQUNBLGFBQUEsV0FBQTs7ZUFFQTs7VUFFQSxTQUFBLFFBQUE7VUFDQSxXQUFBLFFBQUE7VUFDQSxXQUFBLFFBQUE7O1FBRUEsT0FBQTs7O01BR0EsS0FBQSx3QkFBQSxTQUFBLGtCQUFBLGlCQUFBO1VBQ0EsSUFBQSxTQUFBOztVQUVBLFFBQUEsT0FBQSxRQUFBO1VBQ0EsUUFBQSxPQUFBLFFBQUE7O1VBRUEsUUFBQSxRQUFBLFFBQUEsU0FBQSxNQUFBLElBQUE7WUFDQSxJQUFBLE9BQUEsVUFBQSxXQUFBO2NBQ0EsT0FBQSxPQUFBLDJCQUFBLE9BQUE7Ozs7VUFJQSxPQUFBOzs7SUFHQSxLQUFBLGtCQUFBLFNBQUEsb0JBQUE7TUFDQSxJQUFBLENBQUEsbUJBQUEsUUFBQSxtQkFBQSxhQUFBOztRQUVBLElBQUEsVUFBQSxTQUFBLE1BQUE7O1VBRUEsSUFBQSxHQUFBO1VBQ0EsSUFBQTtV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QSxLQUFBLFVBQUEsV0FBQTtNQUNBLElBQUEsZ0JBQUEsaUJBQUEsU0FBQSxPQUFBLGNBQUEsU0FBQSxnQkFBQTtNQUNBLElBQUEsVUFBQSxTQUFBLE1BQUEsT0FBQSxTQUFBO01BQ0EsSUFBQSxjQUFBLEtBQUEsSUFBQSxLQUFBLGNBQUEsS0FBQSxjQUFBLEtBQUEsZUFBQSxLQUFBLGNBQUEsS0FBQTtNQUNBLGlCQUFBLGVBQUEsT0FBQTs7TUFFQSxJQUFBLGdCQUFBLFdBQUE7O09BRUEsTUFBQSxTQUFBLE1BQUEsU0FBQSxNQUFBO1VBQ0EsTUFBQTs7Ozs7QUNYQSxJQUFBLFVBQUEsa0JBQUEsV0FBQTtFQUNBLE9BQUE7SUFDQSxTQUFBO0lBQ0EsTUFBQSxTQUFBLE9BQUEsU0FBQSxPQUFBLFNBQUE7TUFDQSxRQUFBLFNBQUEsS0FBQSxTQUFBLE9BQUE7UUFDQSxPQUFBLEtBQUE7O01BRUEsUUFBQSxZQUFBLEtBQUEsU0FBQSxPQUFBO1FBQ0EsT0FBQSxXQUFBLE9BQUE7Ozs7O0FDUkEsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBO0lBQ0EsZUFBQSxNQUFBLGVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxvQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDBCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDJCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDZCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDRCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDBCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLHNDQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EseUJBQUE7Z0JBQ0EsYUFBQTs7OztJQUlBLGVBQUEsTUFBQSxzQ0FBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLHlCQUFBO2dCQUNBLGFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsMEJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Ozs7O0FDekZBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7SUFFQSxlQUFBLE1BQUEsa0JBQUE7UUFDQSxVQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7O0lBRUEsZUFBQSxNQUFBLHdCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7OztRQUdBLFFBQUE7WUFDQSxjQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxVQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxRQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxnQkFBQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsdUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7QUN6Q0EsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBOztJQUVBLGVBQUEsTUFBQSxTQUFBO1FBQ0EsS0FBQTtRQUNBLFFBQUE7UUFDQSxVQUFBO1FBQ0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLG1CQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7OztBQ2ZBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7SUFFQSxlQUFBLE1BQUEsaUJBQUE7UUFDQSxVQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7O0lBRUEsZUFBQSxNQUFBLHVCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsWUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7OztRQUdBLFFBQUE7WUFDQSxjQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxVQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxRQUFBO2dCQUNBLE9BQUE7Z0JBQ0EsUUFBQTs7WUFFQSxpQkFBQTtnQkFDQSxPQUFBO2dCQUNBLFFBQUE7Ozs7O0FDL0JBLElBQUEscUVBQUEsU0FBQSxnQkFBQSxtQkFBQSxvQkFBQTs7SUFFQSxlQUFBLE1BQUEsZUFBQTtRQUNBLFVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTs7SUFFQSxlQUFBLE1BQUEscUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxZQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7O1FBR0EsUUFBQTtZQUNBLGNBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBOztZQUVBLFVBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBOztZQUVBLFFBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBOztZQUVBLFFBQUE7Z0JBQ0EsT0FBQTtnQkFDQSxRQUFBOzs7O0lBSUEsZUFBQSxNQUFBLHlCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDRCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsUUFBQTtnQkFDQSxhQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDZCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lB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QUNBLFlBQUE7Z0JBQ0EsY0FBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxvQkFBQTtRQUNBLEtBQUE7UUFDQSxPQUFBO1lBQ0EsT0FBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7OztRQUdBLFlBQUE7OztJQUdBLGVBQUEsTUFBQSxhQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxPQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7O1FBR0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLGVBQUE7UUFDQSxLQUFBO1FBQ0EsT0FBQTtZQUNBLE9BQUE7Z0JBQ0EsYUFBQTs7O1FBR0EsWUFBQTs7O0lBR0EsZUFBQSxNQUFBLGdCQUFBO1FBQ0EsS0FBQTtRQUNBLE9BQUE7WUFDQSxRQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7SUFLQSxlQUFBLE1BQUEsY0FBQTtRQUNBLFVBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTs7SUFFQSxlQUFBLE1BQUEsb0JBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxhQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7SUFLQSxlQUFBLE1BQUEsbUJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxhQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxxQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGFBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7OztJQUtBLGVBQUEsTUFBQSxtQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGFBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7Ozs7SUFNQSxlQUFBLE1BQUEsaUJBQUE7UUFDQSxVQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7O0lBRUEsZUFBQSxNQUFBLHVCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsYUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsMEJBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxhQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSwwQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGFBQUE7Z0JBQ0EsYUFBQTtnQkFDQSxZQUFBOzs7O0lBSUEsZUFBQSxNQUFBLDBCQUFBO1FBQ0EsS0FBQTtRQUNBLFlBQUE7UUFDQSxPQUFBO1lBQ0EsYUFBQTtnQkFDQSxhQUFBO2dCQUNBLFlBQUE7Ozs7SUFJQSxlQUFBLE1BQUEsc0JBQUE7UUFDQSxLQUFBO1FBQ0EsWUFBQTtRQUNBLE9BQUE7WUFDQSxhQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7OztBQ3hLQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7O0NBRUEsZUFBQSxNQUFBLHNCQUFBO0VBQ0EsVUFBQTtFQUNBLFFBQUE7RUFDQSxLQUFBO0VBQ0EsWUFBQTtFQUNBLE1BQUE7R0FDQSxZQUFBO0lBQ0EsYUFBQTtJQUNBLFlBQUE7SUFDQSxjQUFBOzs7OztDQUtBLGVBQUEsTUFBQSw0QkFBQTtFQUNBLEtBQUE7RUFDQSxZQUFBO0VBQ0EsTUFBQTtHQUNBLDJCQUFBO0lBQ0EsYUFBQTs7OztDQUlBLGVBQUEsTUFBQSwyQkFBQTtFQUNBLEtBQUE7RUFDQSxZQUFBO0VBQ0EsTUFBQTtHQUNBLDJCQUFBO0lBQ0EsYUFBQTs7Ozs7Q0FLQSxlQUFBLE1BQUEsOEJBQUE7RUFDQSxLQUFBO0VBQ0EsWUFBQTtFQUNBLE9BQUE7R0FDQSwyQkFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBOzs7RUFHQSxRQUFBO0dBQ0EsY0FBQTtJQUNBLE9BQUE7SUFDQSxRQUFBOztHQUVBLFVBQUE7SUFDQSxPQUFBO0lBQ0EsUUFBQTs7R0FFQSxRQUFBO0lBQ0EsT0FBQTtJQUNBLFFBQUE7Ozs7O0NBS0EsZUFBQSxNQUFBLDhCQUFBO0VBQ0EsS0FBQTtFQUNBLFlBQUE7RUFDQSxNQUFBO0dBQ0EsMkJBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7Ozs7O0NBS0EsZUFBQSxNQUFBLCtCQUFBO0VBQ0EsS0FBQTtFQUNBLFlBQUE7RUFDQSxNQUFBO0dBQ0EsMkJBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7Ozs7O0NBS0EsZUFBQSxNQUFBLDZCQUFBO0VBQ0EsS0FBQTtFQUNBLFlBQUE7RUFDQSxNQUFBO0dBQ0EsMkJBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7Ozs7OztBQzNGQSxJQUFBLHFFQUFBLFNBQUEsZ0JBQUEsbUJBQUEsb0JBQUE7OztDQUdBLGVBQUEsTUFBQSxnQkFBQTtFQUNBLEtBQUE7RUFDQSxRQUFBO0VBQ0EsTUFBQTtHQUNBLFlBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTtJQUNBLGNBQUE7OztFQUdBLFFBQUE7R0FDQSxNQUFBO0lBQ0EsT0FBQTtJQUNBLFFBQUE7O0dBRUEsTUFBQTtJQUNBLE9BQUE7SUFDQSxRQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxlQUFBO0VBQ0EsS0FBQTtFQUNBLFFBQUE7RUFDQSxPQUFBO0dBQ0EsWUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBO0lBQ0EsY0FBQTs7O0VBR0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsMkJBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTs7O0VBR0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsMkJBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLFFBQUE7SUFDQSxhQUFBO0lBQ0EsWUFBQTs7O0VBR0EsWUFBQTs7Q0FFQSxlQUFBLE1BQUEsa0NBQUE7RUFDQSxLQUFBO0VBQ0EsT0FBQTtHQUNBLElBQUE7SUFDQSxhQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxnQ0FBQTtFQUNBLEtBQUE7RUFDQSxPQUFBO0dBQ0EsSUFBQTtJQUNBLGFBQUE7SUFDQSxZQUFBOzs7RUFHQSxZQUFBOztDQUVBLGVBQUEsTUFBQSxzQkFBQTtFQUNBLEtBQUE7RUFDQSxZQUFBO0VBQ0EsTUFBQTtHQUNBLE9BQUE7SUFDQSxZQUFBO0lBQ0EsWUFBQTs7OztDQUlBLGVBQUEsTUFBQSx1QkFBQTtFQUNBLEtBQUE7RUFDQSxZQUFBO0VBQ0EsTUFBQTtHQUNBLE9BQUE7SUFDQSxZQUFBO0lBQ0EsWUFBQTs7Ozs7O0NBTUEsZUFBQSxNQUFBLG9CQUFBO0VBQ0EsS0FBQTtFQUNBLE9BQUE7R0FDQSxRQUFBO0lBQ0EsYUFBQSxTQUFBLGFBQUE7S0FDQSxPQUFBLHFDQUFBLGFBQUE7OztJQUdBLDJDQUFBLFNBQUEsWUFBQSxhQUFBO0tBQ0EsV0FBQSxjQUFBLGFBQUE7Ozs7RUFJQSxZQUFBOzs7QUMvR0EsSUFBQSxxRUFBQSxTQUFBLGdCQUFBLG1CQUFBLG9CQUFBO0lBQ0EsZUFBQSxNQUFBLFlBQUE7UUFDQSxRQUFBO1FBQ0EsVUFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLFlBQUE7Z0JBQ0EsYUFBQTs7OztJQUlBLGVBQUEsTUFBQSxrQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGlCQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxxQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGlCQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxxQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGlCQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxxQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGlCQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7OztJQUlBLGVBQUEsTUFBQSxpQkFBQTtRQUNBLEtBQUE7UUFDQSxZQUFBO1FBQ0EsT0FBQTtZQUNBLGlCQUFBO2dCQUNBLGFBQUE7Z0JBQ0EsWUFBQTs7Ozs7QUMxREEsSUFBQSxxRUFBQSxTQUFBLGdCQUFB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LFNBQUEsUUFBQTs7OztBQ2hCQSxJQUFBLE9BQUEsYUFBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUE7UUFDQSxHQUFBLFVBQUEsYUFBQSxVQUFBLEtBQUE7WUFDQSxJQUFBLElBQUEsTUFBQSxNQUFBO1lBQ0EsSUFBQSxFQUFBLElBQUEsTUFBQSxFQUFBLEdBQUEsRUFBQSxHQUFBLEVBQUEsRUFBQSxHQUFBLEVBQUEsR0FBQSxFQUFBLEdBQUEsRUFBQTtZQUNBLE9BQUEsSUFBQSxLQUFBLEdBQUE7Ozs7QUNMQSxJQUFBLE9BQUEsZ0JBQUEsWUFBQTtJQUNBLE9BQUEsU0FBQSxPQUFBLGNBQUE7UUFDQSxJQUFBLFNBQUE7UUFDQSxRQUFBLFFBQUEsUUFBQSxVQUFBLE9BQUE7WUFDQSxJQUFBLGFBQUEsUUFBQSxNQUFBLE9BQUEsQ0FBQTtnQkFDQSxPQUFBLEtBQUE7O1FBRUEsT0FBQTs7O0FDUEEsSUFBQSxPQUFBLFdBQUEsQ0FBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLFFBQUE7UUFDQSxPQUFBLFFBQUEsT0FBQSxJQUFBOzs7QUNGQSxJQUFBLE9BQUEsT0FBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE9BQUE7UUFDQSxPQUFBLFNBQUEsT0FBQTs7O0FDRkEsSUFBQSxPQUFBLFNBQUEsV0FBQTtJQUNBLE9BQUEsU0FBQSxPQUFBLE9BQUEsS0FBQTtRQUNBLFFBQUEsU0FBQTtRQUNBLE1BQUEsU0FBQTtRQUNBLElBQUE7UUFDQSxHQUFBLFFBQUEsSUFBQTtZQUNBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTtnQkFDQSxNQUFBLEtBQUE7YUFDQTtZQUNBLEtBQUEsRUFBQSxPQUFBLEVBQUEsS0FBQTtnQkFDQSxNQUFBLEtBQUE7O1FBRUEsT0FBQTs7O0FDWkEsSUFBQSxPQUFBLGdDQUFBLFNBQUE7QUFDQTtJQUNBLE9BQUEsU0FBQTtJQUNBO1FBQ0EsT0FBQSxLQUFBLFlBQUE7Ozs7QUNKQSxJQUFBLE9BQUEsWUFBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE1BQUEsS0FBQTtRQUNBLElBQUEsT0FBQSxVQUFBLGVBQUEsT0FBQSxTQUFBLGFBQUE7WUFDQSxPQUFBOzs7UUFHQSxJQUFBLE1BQUE7UUFDQSxLQUFBLElBQUEsSUFBQSxLQUFBLFNBQUEsR0FBQSxLQUFBLEdBQUEsS0FBQTtZQUNBLE9BQUEsU0FBQSxLQUFBLEdBQUE7OztRQUdBLE9BQUE7OztBQ1hBLElBQUEsT0FBQSxrQkFBQSxXQUFBO0lBQ0EsT0FBQSxTQUFBLE1BQUEsS0FBQTtRQUNBLElBQUEsT0FBQSxVQUFBLGVBQUEsT0FBQSxTQUFBLGFBQUE7WUFDQSxPQUFBOztRQUVBLElBQUEsTUFBQTtRQUNBLFFBQUEsUUFBQSxNQUFBLFNBQUEsTUFBQSxNQUFBO1lBQ0EsR0FBQSxLQUFBLEtBQUEsUUFBQTtnQkFDQSxPQUFBLFNBQUEsS0FBQSxLQUFBOzs7O1FBSUEsT0FBQTs7R0FFQSIsImZpbGUiOiJhcHAuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgYXBwID0gYW5ndWxhci5tb2R1bGUoJ2FwcCcsXG5cdFtcblx0XHQnYW5ndWxhci1qd3QnLFxuXHRcdCdhbmd1bGFyLmZpbHRlcicsXG5cdFx0J25nQW5pbWF0ZScsXG5cdFx0J3VpLnJvdXRlcicsXG5cdFx0J3VpLmNhbGVuZGFyJyxcblx0XHQndWkuYm9vdHN0cmFwJyxcblx0XHQndWkuYm9vdHN0cmFwLmRhdGV0aW1lcGlja2VyJyxcblx0XHQndWkuc29ydGFibGUnLFxuXHRcdCduZ0ZpbGVTYXZlcicsXG5cdFx0J2FwcC5hdXRoJyxcblx0XHQnYXBwLmFkbWluJyxcblx0XHQnYXBwLmFkbWluLmNsdWJzJyxcblx0XHQnYXBwLmFkbWluLmludm9pY2VzJyxcblx0XHQnYXBwLmFkbWluLnNpZ251cHMnLFxuXHRcdCdhcHAuYWRtaW4udXNlcnMnLFxuXHRcdCdhcHAuY2FsZW5kYXInLFxuXHRcdCdhcHAuY2hhbXBpb25zaGlwcycsXG5cdFx0J2FwcC5jaGFtcGlvbnNoaXBzLnNpZ251cHMnLFxuXHRcdCdhcHAuY2x1YnMnLFxuXHRcdCdhcHAuY2x1YnMuaW52b2ljZXMnLFxuXHRcdCdhcHAuY29tcGV0aXRpb25zJyxcblx0XHQnYXBwLmNvbXBldGl0aW9ucy5hZG1pbicsXG5cdFx0J2FwcC5jb21wZXRpdGlvbnMuYWRtaW4uZXhwb3J0Jyxcblx0XHQnYXBwLmNvbXBldGl0aW9ucy5hZG1pbi5wYXRyb2xzJyxcblx0XHQnYXBwLmNvbXBldGl0aW9ucy5hZG1pbi5zdGF0aW9ucycsXG5cdFx0J2FwcC5jb21wZXRpdGlvbnMuYWRtaW4uc2lnbnVwcycsXG5cdFx0J2FwcC5kYXNoYm9hcmQnLFxuXHRcdCdhcHAuZXJyb3JoYW5kbGVyJyxcblx0XHQnYXBwLmludm9pY2VzJyxcblx0XHQnYXBwLnByZW1pdW0nLFxuXHRcdCdhcHAuc2V0dGluZ3MnLFxuXHRcdCdhcHAuc2lnbnVwcycsXG5cdFx0J2FwcC50ZWFtcycsXG5cdFx0J2FwcC51c2Vycydcblx0XSwgZnVuY3Rpb24oJGludGVycG9sYXRlUHJvdmlkZXIpe1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLnN0YXJ0U3ltYm9sKCc8JScpO1xuXHRcdCRpbnRlcnBvbGF0ZVByb3ZpZGVyLmVuZFN5bWJvbCgnJT4nKTtcbn0pO1xuXG5hcHAucnVuKGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZSwgJHRpbWVvdXQsIEVycm9ySGFuZGxlckZhY3RvcnksIGp3dEhlbHBlciwgQXV0aEZhY3RvcnksICR3aW5kb3csICRsb2NhdGlvbikge1xuXG5cdCR3aW5kb3cuZ2EoJ2NyZWF0ZScsICdVQS03NjIyMTYxOC0xJywgJ2F1dG8nKTtcblx0XG5cdCRyb290U2NvcGUuJG9uKCckc3RhdGVDaGFuZ2VTdGFydCcsIGZ1bmN0aW9uKGUsIHRvKSB7XG5cdFx0dmFyIHRva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJyk7XG5cblx0XHQkcm9vdFNjb3BlLmN1cnJlbnRSb3V0ZSA9IHRvLm5hbWU7XG5cblx0XHRpZih0b2tlbiAhPT0gbnVsbCl7XG5cdFx0XHQkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuXHRcdFx0dmFyIHVzZXIgPSBKU09OLnBhcnNlKGxvY2FsU3RvcmFnZS5nZXRJdGVtKCd1c2VyJykpO1xuXHRcdFx0JHJvb3RTY29wZS5jdXJyZW50VXNlciA9IHVzZXI7XG5cdFx0fVxuXG5cdFx0aWYoKHRvLm5hbWUuc3BsaXQoXCIuXCIsIDEpWzBdID09ICdhdXRoJykgJiYgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkKXtcblx0XHRcdCRzdGF0ZS5nbygnZGFzaGJvYXJkJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHR9XG5cblx0XHRpZiAodG8ucmVzdHJpY3RlZCkge1xuXG5cdFx0XHQvLyBSZXN0cmljdCBndWFyZGVkIHJvdXRlcy5cblx0XHRcdGlmICh0b2tlbiA9PT0gbnVsbCkge1xuXHRcdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYXV0aC5sb2dpbicsIHt9LCB7bG9jYXRpb246ICdyZXBsYWNlJ30pO1xuXHRcdFx0fVxuXG5cdFx0XHQvKlxuXHRcdFx0aWYgKHRva2VuICE9PSBudWxsICYmIGp3dEhlbHBlci5pc1Rva2VuRXhwaXJlZCh0b2tlbikpIHtcblx0XHRcdFx0QXV0aEZhY3RvcnkuYXR0ZW1wdFJlZnJlc2hUb2tlbigpO1xuXHRcdFx0fVxuXHRcdFx0Ki9cblxuXHRcdFx0JHJvb3RTY29wZS5kYXRlcGlja2VyT3B0aW9ucyA9IHtcblx0XHRcdFx0c2hvd1dlZWtzOiB0cnVlLFxuXHRcdFx0XHRzdGFydGluZ0RheTogMVxuXHRcdFx0fTtcblx0XHRcdCRyb290U2NvcGUudGltZXBpY2tlck9wdGlvbnMgPSB7XG5cdFx0XHRcdHNob3dNZXJpZGlhbjogZmFsc2UsXG5cdFx0XHRcdG1pbnV0ZVN0ZXA6IDE1XG5cdFx0XHR9O1xuXG5cdFx0fVxuXHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gJyc7XG5cblx0fSk7XG5cblx0JHJvb3RTY29wZS4kb24oJyRzdGF0ZUNoYW5nZVN1Y2Nlc3MnLCBmdW5jdGlvbiAoZXZlbnQpIHtcblx0XHQkd2luZG93LmdhKCdzZW5kJywgJ3BhZ2V2aWV3JywgJGxvY2F0aW9uLnBhdGgoKSk7XG5cdH0pO1xuXG5cdC8qKlxuXHQgKiBHZW5lcmF0ZXMgZmxhc2ggbWVzc2FnZXMgYmFzZWQgb24gZ2l2ZW4gYXJyYXkgb3Igc3RyaW5nIG9mIG1lc3NhZ2VzLlxuXHQgKiBIaWRlcyBldmVyeSBtZXNzYWdlIGFmdGVyIDUgc2Vjb25kcy5cblx0ICpcblx0ICogQHBhcmFtICBtaXhlZCAgbWVzc2FnZXNcblx0ICogQHBhcmFtICBzdHJpbmcgdHlwZVxuXHQgKiBAcmV0dXJuIHZvaWRcblx0ICovXG5cdCRyb290U2NvcGUuY2F0Y2hFcnJvciA9IGZ1bmN0aW9uKHJlc3BvbnNlKVxuXHR7XG5cdFx0Ly8gUmVzZXQgYWxsIGVycm9yLSBhbmQgc3VjY2VzcyBtZXNzYWdlcy5cblx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMgPSBbXTtcblx0XHQkcm9vdFNjb3BlLnN1Y2Nlc3NNZXNzYWdlcyA9IFtdO1xuXG5cdFx0aWYodHlwZW9mIHJlc3BvbnNlID09PSAnc3RyaW5nJylcblx0XHR7XG5cdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaChyZXNwb25zZSk7XG5cdFx0fVxuXHRcdGVsc2Vcblx0XHR7XG5cdFx0XHRjb25zb2xlLmxvZyhyZXNwb25zZSk7XG5cdFx0XHRpZihyZXNwb25zZSlcblx0XHRcdHtcblx0XHRcdFx0YW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLCBmdW5jdGlvbihlcnJvck1lc3NhZ2Upe1xuXHRcdFx0XHRcdHZhciBtZXNzYWdlID0gKHR5cGVvZiBlcnJvck1lc3NhZ2UgPT09ICdzdHJpbmcnKSA/IGVycm9yTWVzc2FnZSA6IGVycm9yTWVzc2FnZVswXTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaChtZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cblx0XHRcdFx0Y29uc29sZS5sb2coJHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzKTtcblxuXHRcdFx0XHQkdGltZW91dChmdW5jdGlvbigpe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdFx0XHR9LCA1MDAwKTtcblx0XHRcdH1cblx0XHR9XG5cdH07XG5cblxuXHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzID0gZnVuY3Rpb24obWVzc2FnZXMsIHR5cGUpXG5cdHtcblx0XHQkdGltZW91dC5jYW5jZWwoJHJvb3RTY29wZS5lcnJvck1lc3NhZ2VUaW1lcik7XG5cdFx0JHJvb3RTY29wZS5lcnJvck1lc3NhZ2VzID0gW107XG5cdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblxuXHRcdGlmKGFuZ3VsYXIuaXNTdHJpbmcobWVzc2FnZXMpKSBtZXNzYWdlcyA9IFttZXNzYWdlc107XG5cblx0XHR2YXIgdW53YW50ZWRNZXNzYWdlcyA9IFsndG9rZW5fbm90X3Byb3ZpZGVkJ107XG5cdFx0dmFyIGljb24gPSAodHlwZSA9PSAnc3VjY2VzcycpID8gJ2NoZWNrLWNpcmNsZScgOiAnaW5mby1jaXJjbGUnO1xuXG5cdFx0YW5ndWxhci5mb3JFYWNoKG1lc3NhZ2VzLCBmdW5jdGlvbihtZXNzYWdlKXtcblxuXHRcdFx0aWYodW53YW50ZWRNZXNzYWdlcy5pbmRleE9mKG1lc3NhZ2UpIDwgMClcblx0XHRcdHtcblx0XHRcdFx0dmFyIHRleHQgPSAodHlwZW9mIG1lc3NhZ2UgPT09ICdzdHJpbmcnKSA/IG1lc3NhZ2UgOiBtZXNzYWdlWzBdO1xuXHRcdFx0XHRpZih0eXBlID09ICdlcnJvcicpXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZXMucHVzaCh0ZXh0KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRlbHNlXG5cdFx0XHRcdHtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLnN1Y2Nlc3NNZXNzYWdlcy5wdXNoKHRleHQpO1xuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdFx0fSk7XG5cblx0XHQkcm9vdFNjb3BlLmVycm9yTWVzc2FnZVRpbWVyID0gJHRpbWVvdXQoZnVuY3Rpb24oKXtcblx0XHRcdCRyb290U2NvcGUuZXJyb3JNZXNzYWdlcyA9IFtdO1xuXHRcdFx0JHJvb3RTY29wZS5zdWNjZXNzTWVzc2FnZXMgPSBbXTtcblx0XHR9LCA1MDAwKTtcblx0fTtcblxuXHQvKipcblx0ICogR2xvYmFsIGZ1bmN0aW9uIGZvciByZXBvcnRpbmcgdG9wIGxldmVsIGVycm9ycy4gTWFrZXMgYW4gYWpheCBjYWxsIGZvciBzZW5kaW5nIGEgYnVnIHJlcG9ydC5cblx0ICogQHBhcmFtIHtvYmplY3R9IGVycm9yXG5cdCAqIEBwYXJhbSB7c3RyaW5nfSBjYXVzZVxuXHQgKi9cblx0JHJvb3RTY29wZS5yZXBvcnRFcnJvciA9IGZ1bmN0aW9uKGVycm9yLCBjYXVzZSlcblx0e1xuXHRcdGlmKCFjYXVzZSkgY2F1c2UgPSAnRnJvbnRlbmQnO1xuXHRcdGlmKGVycm9yKXtcblx0XHRcdEVycm9ySGFuZGxlckZhY3Rvcnlcblx0XHRcdFx0LnJlcG9ydEVycm9yKGVycm9yLCBjYXVzZSlcblxuXHRcdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0aWYocmVzcG9uc2UubWVzc2FnZSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5tZXNzYWdlKSAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKFtyZXNwb25zZS5tZXNzYWdlXSwgJ3dhcm5pbmcnKTtcblx0XHRcdFx0XHR9IGVsc2UgaWYocmVzcG9uc2UuZGF0YSl7XG5cdFx0XHRcdFx0XHRpZihyZXNwb25zZS5kYXRhLm1lc3NhZ2UpICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMoW3Jlc3BvbnNlLmRhdGEubWVzc2FnZV0sICd3YXJuaW5nJyk7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmFkbWluLmNsdWJzJywgW10pXG5cbiAgICAuY29udHJvbGxlcihcIkFkbWluQ2x1YnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBBZG1pbkNsdWJzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi5maWx0ZXIgPSB7XG4gICAgICAgIHNlYXJjaDogJycsXG4gICAgICAgIGhpZGVfd2l0aG91dF91c2VyczogMSxcbiAgICAgICAgaGlkZV93aXRob3V0X2FkbWluczogbnVsbFxuICAgIH07XG5cbiAgICBzZWxmLmhpZGVDbHVic1dpdGhvdXRVc2VycyA9IGZ1bmN0aW9uKGNsdWIpe1xuICAgICAgICBpZihzZWxmLmZpbHRlci5oaWRlX3dpdGhvdXRfdXNlcnMgJiYgY2x1Yi51c2Vyc19jb3VudCl7XG4gICAgICAgICAgICByZXR1cm4gY2x1YjtcbiAgICAgICAgfWVsc2UgaWYoIXNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF91c2Vycyl7XG4gICAgICAgICAgICByZXR1cm4gY2x1YjtcbiAgICAgICAgfVxuICAgIH07XG4gICAgc2VsZi5oaWRlQ2x1YnNXaXRob3V0QWRtaW5zID0gZnVuY3Rpb24oY2x1Yil7XG4gICAgICAgIGlmKHNlbGYuZmlsdGVyLmhpZGVfd2l0aG91dF9hZG1pbnMgJiYgY2x1Yi5hZG1pbnNfY291bnQpe1xuICAgICAgICAgICAgcmV0dXJuIGNsdWI7XG4gICAgICAgIH1lbHNlIGlmKCFzZWxmLmZpbHRlci5oaWRlX3dpdGhvdXRfYWRtaW5zKXtcbiAgICAgICAgICAgIHJldHVybiBjbHViO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHVwZGF0ZVBhZ2UocGFnZSkge1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cbiAgICBmdW5jdGlvbiBzb3J0TGlzdCgpIHt9XG5cbiAgICB0aGlzLnBhZ2UgPSBwYXJzZUludCgkc3RhdGVQYXJhbXMucGFnZSwgMTApO1xuICAgIHRoaXMuc29ydCA9ICRzdGF0ZVBhcmFtcy5zb3J0O1xuICAgIHRoaXMuc29ydE9wdGlvbnMgPSBbJ3Vwdm90ZXMnLCAnZGF0ZScsICdhdXRob3InXTtcbiAgICBzb3J0TGlzdCgpO1xuICAgIHVwZGF0ZVBhZ2UoKTtcblxuXG4gICAgdGhpcy5uZXh0UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzZWxmLnBhZ2UrKztcbiAgICAgICAgdXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuICAgICAgICAkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcbiAgICB9O1xuICAgIHRoaXMucHJldlBhZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHNlbGYucGFnZSA+IDApIHtcbiAgICAgICAgICAgIHNlbGYucGFnZS0tO1xuICAgICAgICAgICAgdXBkYXRlUGFnZShzZWxmLnBhZ2UpO1xuICAgICAgICAgICAgJHN0YXRlLmdvKCcuJywge3BhZ2U6IHNlbGYucGFnZX0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHRoaXMuc29ydENoYW5nZWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgc29ydExpc3QoKTtcbiAgICAgICAgJHN0YXRlLmdvKCcuJywge3NvcnQ6IHNlbGYuc29ydH0sIHtub3RpZnk6IGZhbHNlfSk7XG4gICAgfTtcblxufSlcbi5jb250cm9sbGVyKFwiQWRtaW5DbHViQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdGltZW91dCwgQWRtaW5DbHVic0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuICAgIHNlbGYuc2VsZWN0ZWRjbHViID0ge307XG5cbiAgICBpZighJHN0YXRlUGFyYW1zLmlkKSAkc3RhdGUuZ28oJ2FkbWluLmNsdWJzJyk7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gIHRydWU7XG4gICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YiA9IHJlc3BvbnNlLmNsdWI7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhZG1pbi5jbHVicycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi51cGRhdGVDbHViID0gZnVuY3Rpb24oY2x1Yil7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAndXBkYXRpbmcnO1xuICAgICAgICBBZG1pbkNsdWJzRmFjdG9yeS51cGRhdGVDbHViKGNsdWIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgc2VsZi5zdGF0ZSA9ICd1cGRhdGVkJztcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NsdWInLCAoe2lkOiBjbHViLmlkfSkpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZUNsdWIgPSBmdW5jdGlvbihjbHViKXtcbiAgICAgICAgQWRtaW5DbHVic0ZhY3RvcnkuZGVsZXRlQ2x1YihjbHViKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2x1YnMnKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLnNlYXJjaEZvckNsdWJzID0gZnVuY3Rpb24oc2VhcmNoUXVlcnksIGNsdWIpXG4gICAge1xuICAgICAgICByZXR1cm4gQWRtaW5DbHVic0ZhY3RvcnlcbiAgICAgICAgICAgIC5zZWFyY2hGb3JDbHVicyhzZWFyY2hRdWVyeSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ3dhcm5pbmcnKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5mb3VuZE1hdGNoID0gKHJlc3BvbnNlLmRhdGEuY2x1YnMubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuY2x1YnMubWFwKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmFscmVhZHlTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGl0ZW07XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5zZWxlY3RDbHViID0gZnVuY3Rpb24oJGl0ZW0pXG4gICAge1xuICAgICAgICBzZWxmLnNlbGVjdGVkY2x1YiA9ICRpdGVtO1xuICAgIH07XG5cbiAgICBzZWxmLm1lcmdlQ2x1YnMgPSBmdW5jdGlvbihjbHVic0lkRnJvbSwgY2x1YnNJZFRvKXtcbiAgICAgICAgaWYoY2x1YnNJZEZyb20gJiYgY2x1YnNJZFRvKXtcbiAgICAgICAgICAgIEFkbWluQ2x1YnNGYWN0b3J5Lm1lcmdlQ2x1YnMoY2x1YnNJZEZyb20sIGNsdWJzSWRUbylcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnYWRtaW4uY2x1YnMuc2hvdycsIHtpZDpjbHVic0lkVG99LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgZmluZCgpO1xufSlcbi5mYWN0b3J5KCdBZG1pbkNsdWJzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMnO1xuXG4gICAgICAgICAgICBpZiAoIWFuZ3VsYXIuaXNVbmRlZmluZWQoaWQpICYmIGlkID4gMCkgdXJsICs9ICcvJyArIGlkO1xuICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNsdWIpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvJytjbHViLmlkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oY2x1YilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZUNsdWI6IGZ1bmN0aW9uKGNsdWIpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy8nK2NsdWIuaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxvYWRVc2VyQ2x1YjogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9jbHVicy9nZXRVc2VyQ2x1YicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZFVzZXJUb0NsdWJzOiBmdW5jdGlvbihjbHVic19pZCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzL2FkZFVzZXJUb0NsdWJzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHsnY2x1YnNfaWQnOiBjbHVic19pZH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGROZXdDbHViOiBmdW5jdGlvbihjbHViKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvYWRkTmV3Q2x1YicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh7J2NsdWJzX25yJzogY2x1Yi5jbHVic19uciwgJ25hbWUnOiBjbHViLm5hbWV9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc2VhcmNoRm9yQ2x1YnM6IGZ1bmN0aW9uKGZpbHRlcikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy9zZWFyY2gnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oeydzZWFyY2hRdWVyeSc6IGZpbHRlcn0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRVc2VyQXNBZG1pbjogZnVuY3Rpb24oYWRtaW4pIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYWRtaW4vY2x1YnMvYWRkVXNlckFzQWRtaW4nLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oeydhZG1pbic6IGFkbWlufSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRlbGV0ZVVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzL2RlbGV0ZVVzZXJBc0FkbWluJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHsnYWRtaW4nOiBhZG1pbn0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBtZXJnZUNsdWJzOiBmdW5jdGlvbihjbHVic0lkRnJvbSwgY2x1YnNJZFRvKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2NsdWJzL21lcmdlJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHsnY2x1YnNJZEZyb20nOiBjbHVic0lkRnJvbSwgJ2NsdWJzSWRUbyc6IGNsdWJzSWRUb30pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmFkbWluLmludm9pY2VzJywgW10pXG5cblxuLmNvbnRyb2xsZXIoXCJBZG1pbkludm9pY2VzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQWRtaW5JbnZvaWNlc0ZhY3RvcnksIEZpbGVTYXZlciwgQmxvYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYubG9hZCA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgdmFyIGFyZ3MgPSB7XG4gICAgICAgICAgICBjdXJyZW50X3BhZ2U6ICRzdGF0ZVBhcmFtcy5jdXJyZW50X3BhZ2UsXG4gICAgICAgICAgICBwZXJfcGFnZTogJHN0YXRlUGFyYW1zLnBlcl9wYWdlLFxuICAgICAgICAgICAgc2VhcmNoOiAkc3RhdGVQYXJhbXMuc2VhcmNoLFxuICAgICAgICAgICAgcGF5bWVudF9zdGF0dXM6ICRzdGF0ZVBhcmFtcy5wYXltZW50X3N0YXR1c1xuICAgICAgICB9O1xuICAgICAgICBBZG1pbkludm9pY2VzRmFjdG9yeS5sb2FkKGFyZ3MpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlcyA9IHJlc3BvbnNlLmludm9pY2VzO1xuICAgICAgICAgICAgICAgIHNlbGYuaW52b2ljZXNfb3ZlcnZpZXcgPSByZXNwb25zZS5pbnZvaWNlc19vdmVydmlldztcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLnVwZGF0ZVBhZ2UgPSBmdW5jdGlvbigpe1xuICAgICAgICB2YXIgYXJncyA9IHtcbiAgICAgICAgICAgIHNlYXJjaDogc2VsZi5pbnZvaWNlcy5zZWFyY2gsXG4gICAgICAgICAgICBwYXltZW50X3N0YXR1czogc2VsZi5pbnZvaWNlcy5wYXltZW50X3N0YXR1cyxcbiAgICAgICAgICAgIGN1cnJlbnRfcGFnZTogc2VsZi5pbnZvaWNlcy5jdXJyZW50X3BhZ2UsXG4gICAgICAgICAgICBwZXJfcGFnZTogc2VsZi5pbnZvaWNlcy5wZXJfcGFnZVxuICAgICAgICB9O1xuICAgICAgICAkc3RhdGUuZ28oJ2FkbWluLmludm9pY2VzLmluZGV4JywgYXJncywge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgIH07XG5cbiAgICBzZWxmLmxvYWQoKTtcblxuICAgIHNlbGYuZG93bmxvYWQgPSBmdW5jdGlvbihpbnZvaWNlKXtcbiAgICAgICAgQWRtaW5JbnZvaWNlc0ZhY3RvcnkuZG93bmxvYWQoaW52b2ljZS5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuICAgICAgICAgICAgICAgIGlmKGZpbGUuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsICdpbnZvaWNlLScgKyBpbnZvaWNlLmludm9pY2VfcmVmZXJlbmNlICsgJy5wZGYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG59KVxuLmNvbnRyb2xsZXIoXCJBZG1pbkludm9pY2VDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBBZG1pbkludm9pY2VzRmFjdG9yeSwgRmlsZVNhdmVyLCBCbG9iKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGxvYWRJbnZvaWNlcygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEFkbWluSW52b2ljZXNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5pbnZvaWNlKSAkc3RhdGUuZ28oJ2FkbWluLmludm9pY2VzLmluZGV4Jyk7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlID0gcmVzcG9uc2UuaW52b2ljZTtcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuZG93bmxvYWQgPSBmdW5jdGlvbihpbnZvaWNlKXtcbiAgICAgICAgQWRtaW5JbnZvaWNlc0ZhY3RvcnkuZG93bmxvYWQoaW52b2ljZS5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuICAgICAgICAgICAgICAgIGlmKGZpbGUuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsICdpbnZvaWNlLScgKyBpbnZvaWNlLmludm9pY2VfcmVmZXJlbmNlICsgJy5wZGYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgbG9hZEludm9pY2VzKCk7XG59KVxuXG4uZmFjdG9yeSgnQWRtaW5JbnZvaWNlc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24oYXJncykge1xuICAgICAgICAgICAgdmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydhZG1pbi9pbnZvaWNlcyc7XG4gICAgICAgICAgICBjdXJyZW50X3BhZ2UgPSAoYXJncy5jdXJyZW50X3BhZ2UpID8gYXJncy5jdXJyZW50X3BhZ2UgOiAxO1xuXG4gICAgICAgICAgICB1cmwgKz0gJz9wYWdlPScgKyBjdXJyZW50X3BhZ2U7XG4gICAgICAgICAgICBpZiAoYXJncy5zZWFyY2gpIHVybCArPSAnJnNlYXJjaD0nICsgYXJncy5zZWFyY2g7XG4gICAgICAgICAgICBpZiAoYXJncy5wZXJfcGFnZSkgdXJsICs9ICcmcGVyX3BhZ2U9JyArIGFyZ3MucGVyX3BhZ2U7XG4gICAgICAgICAgICBpZiAoYXJncy5wYXltZW50X3N0YXR1cykgdXJsICs9ICcmcGF5bWVudF9zdGF0dXM9JyArIGFyZ3MucGF5bWVudF9zdGF0dXM7XG5cbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhZG1pbi9pbnZvaWNlcy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBkb3dubG9hZDogZnVuY3Rpb24oaWQpe1xuICAgICAgICAgICAgaWYoaWQpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL2ludm9pY2VzLycraWQrJy9kb3dubG9hZCcsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ2FycmF5YnVmZmVyJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG5cbiAgICB9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmFkbWluJywgW10pXG5cbi5jb250cm9sbGVyKFwiQWRtaW5EYXNoYm9hcmRDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHRpbWVvdXQsIEFkbWluRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIGZ1bmN0aW9uIGxvYWREYXNoYm9hcmQoKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBBZG1pbkZhY3RvcnkubG9hZERhc2hib2FyZCgpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5kYXRhID0gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGxvYWREYXNoYm9hcmQoKTtcbn0pXG4uZmFjdG9yeShcIkFkbWluRmFjdG9yeVwiLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWREYXNoYm9hcmQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsICsgJ2FkbWluL2Rhc2hib2FyZCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG5cbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuYWRtaW4uc2lnbnVwcycsIFtdKVxuXG4uY29udHJvbGxlcihcIkFkbWluU2lnbnVwc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIEFkbWluU2lnbnVwc0ZhY3RvcnksICR0aW1lb3V0KXtcblx0dmFyIHNlbGYgPSB0aGlzO1xuXG5cdHNlbGYubG9hZCA9IGZ1bmN0aW9uKCkge1xuXHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcblx0XHR2YXIgYXJncyA9IHtcblx0XHRcdGN1cnJlbnRfcGFnZTogJHN0YXRlUGFyYW1zLmN1cnJlbnRfcGFnZSxcblx0XHRcdHBlcl9wYWdlOiAkc3RhdGVQYXJhbXMucGVyX3BhZ2UsXG5cdFx0XHRjb21wZXRpdGlvbnNfaWQ6ICRzdGF0ZVBhcmFtcy5jb21wZXRpdGlvbnNfaWQsXG5cdFx0XHRzZWFyY2g6ICRzdGF0ZVBhcmFtcy5zZWFyY2hcblx0XHR9O1xuXHRcdEFkbWluU2lnbnVwc0ZhY3RvcnkubG9hZChhcmdzKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuXHRcdFx0XHRzZWxmLmNvbXBldGl0aW9ucyA9IHJlc3BvbnNlLmNvbXBldGl0aW9ucztcblx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHNlbGYudXBkYXRlUGFnZSA9IGZ1bmN0aW9uKCl7XG5cdFx0dmFyIGFyZ3MgPSB7XG5cdFx0XHRzZWFyY2g6IHNlbGYuc2lnbnVwcy5zZWFyY2gsXG5cdFx0XHRjdXJyZW50X3BhZ2U6IHNlbGYuc2lnbnVwcy5jdXJyZW50X3BhZ2UsXG5cdFx0XHRwZXJfcGFnZTogc2VsZi5zaWdudXBzLnBlcl9wYWdlLFxuXHRcdFx0Y29tcGV0aXRpb25zX2lkOiBzZWxmLnNpZ251cHMuY29tcGV0aXRpb25zX2lkXG5cdFx0fTtcblx0XHQkc3RhdGUuZ28oJ2FkbWluLnNpZ251cHMuaW5kZXgnLCBhcmdzLCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdH07XG5cblx0c2VsZi5sb2FkKCk7XG5cbn0pXG5cbi5mYWN0b3J5KCdBZG1pblNpZ251cHNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuXHRyZXR1cm4ge1xuXHRcdGxvYWQ6IGZ1bmN0aW9uIChhcmdzKSB7XG5cblx0XHRcdHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnYWRtaW4vc2lnbnVwcyc7XG5cdFx0XHRjdXJyZW50X3BhZ2UgPSAoYXJncy5jdXJyZW50X3BhZ2UpID8gYXJncy5jdXJyZW50X3BhZ2UgOiAxO1xuXG5cdFx0XHR1cmwgKz0gJz9wYWdlPScgKyBjdXJyZW50X3BhZ2U7XG5cdFx0XHRpZiAoYXJncy5zZWFyY2gpIHVybCArPSAnJnNlYXJjaD0nICsgYXJncy5zZWFyY2g7XG5cdFx0XHRpZiAoYXJncy5wZXJfcGFnZSkgdXJsICs9ICcmcGVyX3BhZ2U9JyArIGFyZ3MucGVyX3BhZ2U7XG5cdFx0XHRpZiAoYXJncy5jb21wZXRpdGlvbnNfaWQpIHVybCArPSAnJmNvbXBldGl0aW9uc19pZD0nICsgYXJncy5jb21wZXRpdGlvbnNfaWQ7XG5cdFx0XHRpZiAoYXJncy5zcGVjaWFsd2lzaGVzKSB1cmwgKz0gJyZzdGF0dXM9JyArIGFyZ3Muc3BlY2lhbHdpc2hlcztcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9XG5cblx0fTtcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5hZG1pbi51c2VycycsIFtdKVxuXG4uY29udHJvbGxlcihcIkFkbWluVXNlcnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBBZG1pblVzZXJzRmFjdG9yeSwgJHRpbWVvdXQpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdHZhciBhcmdzID0ge1xuXHRcdFx0Y3VycmVudF9wYWdlOiAkc3RhdGVQYXJhbXMuY3VycmVudF9wYWdlLFxuXHRcdFx0cGVyX3BhZ2U6ICRzdGF0ZVBhcmFtcy5wZXJfcGFnZSxcblx0XHRcdHNlYXJjaDogJHN0YXRlUGFyYW1zLnNlYXJjaCxcblx0XHRcdHN0YXR1czogJHN0YXRlUGFyYW1zLnN0YXR1c1xuXHRcdH07XG5cdFx0QWRtaW5Vc2Vyc0ZhY3RvcnkubG9hZChhcmdzKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnVzZXJzID0gcmVzcG9uc2UudXNlcnM7XG5cdFx0XHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLnVwZGF0ZVBhZ2UgPSBmdW5jdGlvbigpe1xuXHRcdHZhciBhcmdzID0ge1xuXHRcdFx0c2VhcmNoOiBzZWxmLnVzZXJzLnNlYXJjaCxcblx0XHRcdHN0YXR1czogc2VsZi51c2Vycy5zdGF0dXMsXG5cdFx0XHRjdXJyZW50X3BhZ2U6IHNlbGYudXNlcnMuY3VycmVudF9wYWdlLFxuXHRcdFx0cGVyX3BhZ2U6IHNlbGYudXNlcnMucGVyX3BhZ2Vcblx0XHR9O1xuXHRcdCRzdGF0ZS5nbygnYWRtaW4udXNlcnMuaW5kZXgnLCBhcmdzLCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdH07XG5cblx0c2VsZi5sb2FkKCk7XG5cbn0pXG5cbi5jb250cm9sbGVyKFwiQWRtaW5Vc2VyQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQWRtaW5Vc2Vyc0ZhY3RvcnksIEFkbWluSW52b2ljZXNGYWN0b3J5LCBGaWxlU2F2ZXIsIEJsb2Ipe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cdGZ1bmN0aW9uIGxvYWRVc2VyKCl7XG5cdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdGlmKCRzdGF0ZVBhcmFtcy51c2VyX2lkKXtcblx0XHRcdEFkbWluVXNlcnNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLnVzZXJfaWQpXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHRzZWxmLnVzZXIgPSByZXNwb25zZTtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuXHRcdFx0XHR9KVxuXHRcdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuXHRcdFx0XHRcdHNlbGYudXNlciA9ICcnO1xuXHRcdFx0XHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cdFx0XHRcdH0pO1xuXHRcdH1lbHNle1xuXHRcdFx0c2VsZi51c2VyID0ge307XG5cdFx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuXHRcdH1cblx0fVxuXHRsb2FkVXNlcigpO1xuXG5cdHNlbGYuc2F2ZVVzZXIgPSBmdW5jdGlvbih1c2VyKXtcblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG5cdFx0QWRtaW5Vc2Vyc0ZhY3Rvcnkuc2F2ZVVzZXIodXNlcilcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYWRtaW4udXNlcnMuc2hvdycsIHt1c2VyX2lkOiB1c2VyLnVzZXJfaWR9LCB7bG9jYXRpb246ICdyZWxvYWQnfSk7XG5cdFx0XHR9KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHR9KVxuXHRcdFx0LmZpbmFsbHkoZnVuY3Rpb24oKXtcblx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHNlbGYuY3JlYXRlVXNlciA9IGZ1bmN0aW9uKHVzZXIpe1xuXHRcdGlmKHNlbGYubG9hZGluZ1N0YXRlKSByZXR1cm4gZmFsc2U7XG5cdFx0c2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdEFkbWluVXNlcnNGYWN0b3J5LmNyZWF0ZVVzZXIodXNlcilcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSk7XG5cdFx0XHRcdCRzdGF0ZS5nbygnYWRtaW4udXNlcnMuc2hvdycsIHt1c2VyX2lkOiByZXNwb25zZS51c2VyX2lkfSwge2xvY2F0aW9uOiAncmVsb2FkJ30pO1xuXHRcdFx0fSlcblx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdCRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuXHRcdFx0fSlcblx0XHRcdC5maW5hbGx5KGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdHNlbGYuZG93bmxvYWRJbnZvaWNlID0gZnVuY3Rpb24oaW52b2ljZSl7XG5cdFx0QWRtaW5JbnZvaWNlc0ZhY3RvcnkuZG93bmxvYWQoaW52b2ljZS5pZClcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0dmFyIGZpbGUgPSBuZXcgQmxvYihbcmVzcG9uc2VdLCB7dHlwZTogJ2FwcGxpY2F0aW9uL3BkZid9KTtcblx0XHRcdFx0aWYoZmlsZS5zaXplKSB7XG5cdFx0XHRcdFx0RmlsZVNhdmVyLnNhdmVBcyhmaWxlLCAnaW52b2ljZS0nICsgaW52b2ljZS5pbnZvaWNlX3JlZmVyZW5jZSArICcucGRmJyk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHR9O1xuXG59KVxuXG5cbi5mYWN0b3J5KCdBZG1pblVzZXJzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cblx0cmV0dXJuIHtcblx0XHRsb2FkOiBmdW5jdGlvbiAoYXJncykge1xuXG5cdFx0XHR2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2FkbWluL3VzZXJzJztcblx0XHRcdGN1cnJlbnRfcGFnZSA9IChhcmdzLmN1cnJlbnRfcGFnZSkgPyBhcmdzLmN1cnJlbnRfcGFnZSA6IDE7XG5cblx0XHRcdHVybCArPSAnP3BhZ2U9JyArIGN1cnJlbnRfcGFnZTtcblx0XHRcdGlmIChhcmdzLnNlYXJjaCkgdXJsICs9ICcmc2VhcmNoPScgKyBhcmdzLnNlYXJjaDtcblx0XHRcdGlmIChhcmdzLnBlcl9wYWdlKSB1cmwgKz0gJyZwZXJfcGFnZT0nICsgYXJncy5wZXJfcGFnZTtcblx0XHRcdGlmIChhcmdzLnN0YXR1cykgdXJsICs9ICcmc3RhdHVzPScgKyBhcmdzLnN0YXR1cztcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL3VzZXJzLycraWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0c2F2ZVVzZXI6IGZ1bmN0aW9uKHVzZXIpe1xuXHRcdFx0dmFyIGRhdGEgPSBhbmd1bGFyLmNvcHkodXNlcik7XG5cdFx0XHRkYXRhLmJpcnRoZGF5ID0gZGF0YS5iaXJ0aGRheSsnLTAxLTAxJztcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BVVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2FkbWluL3VzZXJzLycrZGF0YS51c2VyX2lkLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbShkYXRhKVxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cdH07XG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAuYXV0aCcsIFsndmNSZWNhcHRjaGEnXSlcbiAgICAuY29udHJvbGxlcignQXV0aENvbnRyb2xsZXInLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgJHN0YXRlUGFyYW1zLCBBdXRoRmFjdG9yeSwgJHVpYk1vZGFsLCAkdGltZW91dCl7XG5cbiAgICAgICAgJHNjb3BlLmF1dGggPVxuICAgICAgICB7XG4gICAgICAgICAgICBlbWFpbFx0OiAnJyxcbiAgICAgICAgICAgIG5hbWUgICAgOiAnJyxcbiAgICAgICAgICAgIGxhc3RuYW1lOiAnJyxcbiAgICAgICAgICAgIHBhc3N3b3JkOiAnJyxcbiAgICAgICAgICAgIGludml0ZV90b2tlbjogJHN0YXRlUGFyYW1zLmludml0ZV90b2tlblxuICAgICAgICB9O1xuXG4gICAgICAgICRzY29wZS5sb2dpbiA9IGZ1bmN0aW9uKClcbiAgICAgICAge1xuICAgICAgICAgICAgJHNjb3BlLmxvZ2dpbmdJbiA9IHRydWU7XG5cbiAgICAgICAgICAgIHZhciBjcmVkZW50aWFscyA9IHtcbiAgICAgICAgICAgICAgICBlbWFpbDogJHNjb3BlLmF1dGguZW1haWwsXG4gICAgICAgICAgICAgICAgcGFzc3dvcmQ6ICRzY29wZS5hdXRoLnBhc3N3b3JkXG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBBdXRoRmFjdG9yeS5hdXRoZW50aWNhdGUoY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Rva2VuJywgcmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICBBdXRoRmFjdG9yeS5nZXRVc2VyKClcbiAgICAgICAgICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCBKU09OLnN0cmluZ2lmeShyZXNwb25zZS51c2VyKSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSByZXNwb25zZS51c2VyO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2Rhc2hib2FyZCcsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgMTAwMCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2dnaW5nSW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZSA9PSAndXNlcl9ub3RfYWN0aXZlJyl7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoLmluYWN0aXZlJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSwgNTApO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5sb2dnaW5nSW4gPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUucmVnaXN0ZXIgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmKCRzY29wZS5hdXRoLnJlY2FwdGNoYXJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJHNjb3BlLnJlZ2lzdGVyU3RhdGUgPSAncmVnaXN0cmVyaW5nJztcblxuICAgICAgICAgICAgICAgIEF1dGhGYWN0b3J5LnJlZ2lzdGVyKCRzY29wZS5hdXRoKVxuICAgICAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucmVnaXN0ZXJTdGF0ZSA9ICdkb25lJztcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5hdXRoID0ge307XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSAnJztcbiAgICAgICAgICAgICAgICAgICAgICAgICRzY29wZS5yZWdpc3RlclN0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuXG4gICAgICAgIC8qKlxuICAgICAgICAgKiBNYWtlcyBhIHJlcXVlc3QgZm9yIHNlbmRpbmcgYSBwYXNzd29yZCByZXNldCBsaW5rLlxuICAgICAgICAgKlxuICAgICAgICAgKiBAcmV0dXJuIHZvaWRcbiAgICAgICAgICovXG4gICAgICAgICRzY29wZS5yZXNldCA9IHtlbWFpbDogJyd9O1xuICAgICAgICAkc2NvcGUucmVxdWVzdFBhc3N3b3JkUmVzZXQgPSBmdW5jdGlvbigpXG4gICAgICAgIHtcbiAgICAgICAgICAgIEF1dGhGYWN0b3J5XG4gICAgICAgICAgICAgICAgLnJlcXVlc3RQYXNzd29yZFJlc2V0KHtlbWFpbDogJHNjb3BlLnJlc2V0LmVtYWlsfSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5yZXNldC5lbWFpbCA9ICcnO1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLnRoZW4oZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhLnN0YXR1cyAhPT0gJ3N1Y2Nlc3MnKVxuICAgICAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG5cbiAgICAgICAgJHNjb3BlLnRlcm1zTW9kYWxPcGVuID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgc2VsZi50ZXJtc01vZGFsID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgICAgIGFuaW1hdGlvbjogJHNjb3BlLmFuaW1hdGlvbnNFbmFibGVkLFxuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3B1YmxpY3ZpZXdzL3Rlcm1zJyxcbiAgICAgICAgICAgICAgICBzaXplOiAnbWQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IGZ1bmN0aW9uKCR1aWJNb2RhbEluc3RhbmNlKXtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5jbG9zZSA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29udHJvbGxlckFzOiAnbW9kYWwnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfTtcblxuICAgIH0pXG5cbiAgICAuY29udHJvbGxlcignQWN0aXZhdGlvbkNvbnRyb2xsZXInLCBmdW5jdGlvbigkc3RhdGUsICRyb290U2NvcGUsICRzY29wZSwgJGh0dHAsICRzdGF0ZVBhcmFtcywgQXV0aEZhY3RvcnksICR0aW1lb3V0KXtcblxuXG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG5cbiAgICAgICAgJHNjb3BlLmFjdGl2YXRlID0ge1xuICAgICAgICAgICAgdG9rZW46ICRzdGF0ZVBhcmFtcy50b2tlblxuICAgICAgICB9O1xuICAgICAgICAkc2NvcGUubm9fcGFzc3dvcmQgPSBmYWxzZTtcbiAgICAgICAgJHNjb3BlLnZlcmlmeVRva2VuID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBBdXRoRmFjdG9yeS5hY3RpdmF0ZSgkc2NvcGUuYWN0aXZhdGUpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZhdGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLmVycm9yID09ICdpbnZhbGlkX2NvZGUnKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmKHJlc3BvbnNlLmVycm9yID09ICdub19wYXNzd29yZCcpe1xuICAgICAgICAgICAgICAgICAgICAgICAgJHNjb3BlLm5vX3Bhc3N3b3JkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ3dhcm5pbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAkc2NvcGUuYWN0aXZhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH07XG4gICAgfSlcblxuICAgIC5mYWN0b3J5KCdBdXRoRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCAkZmlsdGVyLCAkdGltZW91dCwgJHN0YXRlLCAkcm9vdFNjb3BlLCBBcGlFbmRwb2ludFVybCl7XG4gICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgIC8qKlxuICAgICAgICAgICAgICogU3RvcmVzIHRoZSB1c2VyIGRhdGEgYW5kIHVwZGF0ZXMgdGhlIHJvb3RzY29wZSB2YXJpYWJsZXMuIFRoZW4gcmVkaXJlY3RzIHRvIGRhc2hib2FyZC5cbiAgICAgICAgICAgICAqXG4gICAgICAgICAgICAgKiBAcGFyYW0gIG9iamVjdCAgJHVzZXJcbiAgICAgICAgICAgICAqIEByZXR1cm4gdm9pZFxuICAgICAgICAgICAgICovXG4gICAgICAgICAgICBhdXRoZW50aWNhdGU6IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYXV0aGVudGljYXRlJyxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogY3JlZGVudGlhbHNcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGdldFVzZXI6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYXV0aGVudGljYXRlL3VzZXInXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICAvKipcbiAgICAgICAgICAgICAqIENsZWFycyBhbGwgdXNlciBkYXRhIGFuZCByb290c2NvcGUgdXNlciB2YXJpYWJsZXMuIFRoZW4gcmVkaXJlY3RzIHRvIGxvZ2luIGZvcm0uXG4gICAgICAgICAgICAgKlxuICAgICAgICAgICAgICogQHJldHVybiB2b2lkXG4gICAgICAgICAgICAgKi9cbiAgICAgICAgICAgIGxvZ291dDogZnVuY3Rpb24oKVxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoLmxvZ2luJywge30sIHtsb2NhdGlvbjogJ3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZXF1ZXN0UGFzc3dvcmRSZXNldDogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncGFzc3dvcmQvZW1haWwnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIHJlc2V0UGFzc3dvcmQ6IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3Bhc3N3b3JkL3Jlc2V0JyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oY3JlZGVudGlhbHMpXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICByZWdpc3RlcjogZnVuY3Rpb24oY3JlZGVudGlhbHMpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsncmVnaXN0ZXInLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShjcmVkZW50aWFscylcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGFjdGl2YXRlOiBmdW5jdGlvbih0b2tlbikge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhY3RpdmF0ZScsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHRva2VuKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgYXR0ZW1wdFJlZnJlc2hUb2tlbjogZnVuY3Rpb24ocmVxdWVzdFRvZG9XaGVuRG9uZSl7XG5cbiAgICAgICAgICAgICAgICAvLyBSdW4gdGhlIGNhbGwgdG8gcmVmcmVzaCB0aGUgdG9rZW4uXG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3JlZnJlc2gnXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2UpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIElmIG5vIHJlc3BvbnNlIHRva2VuIGlzIHJldHJpZXZlZCwgZ28gdG8gdGhlIGxvZ2luIHBhZ2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBwcmV2ZW50IHRoZSByZXF1ZXN0IGZyb20gYmVpbmcgcmV0cmllZCBieSBzZXR0aW5nIHJlcXVlc3RUb2RvV2hlbkRvbmUgPSBmYWxzZSBhbmRcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIHJldHVybiBmYWxzZSB0byBhbGxvdyBmb3IgY3VzdG9tIGNhbGxiYWNrcyBieSBjaGVja2luZyBpZihBdXRoRmFjdG9yeS5hdHRlbXB0UmVmcmVzaFRva2VuKCkgPT09IGZhbHNlKS5cbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS50b2tlbilcbiAgICAgICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0VG9kb1doZW5Eb25lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2F1dGgubG9naW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIFNldCB0aGUgcmVmcmVzaGVkIHRva2VuLlxuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3Rva2VuJywgcmVzcG9uc2UudG9rZW4pO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSWYgYSByZXF1ZXN0IHNob3VsZCBiZSByZXRyaWVkIGFmdGVyIHJlZnJlc2gsIGZvciBleGFtcGxlIG9uIHB1bGwtdG8tcmVmcmVzaCwgdGhlIHJlcXVlc3QgY29uZmlnXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBpcyBwYXNzZWQgaW50byB0aGUgcmVxdWVzdFRvZG9XaGVuRG9uZSBwYXJhbWV0ZXIuIFNldCB0aGUgYXV0aG9yaXphdGlvbiB0b2tlbiB0byB0aGUgbmV3bHkgcmV0cmlldmVkXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyB0b2tlbiBhbmQgcnVuIHRoZSByZXF1ZXN0IGFnYWluLlxuICAgICAgICAgICAgICAgICAgICAgICAgLypcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKCFhbmd1bGFyLmlzVW5kZWZpbmVkKHJlcXVlc3RUb2RvV2hlbkRvbmUpICYmIHJlcXVlc3RUb2RvV2hlbkRvbmUubGVuZ3RoICE9PSAwKVxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlcXVlc3RUb2RvV2hlbkRvbmUuaGVhZGVycyA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgJ0F1dGhvcml6YXRpb24nOiAnQmVhcmVyICcgKyBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndG9rZW4nKVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHJlcXVlc3RUb2RvV2hlbkRvbmUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgKi9cbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCh0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXF1ZXN0VG9kb1doZW5Eb25lID0gdW5kZWZpbmVkO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3VzZXInKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd0b2tlbicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5hdXRoZW50aWNhdGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmN1cnJlbnRVc2VyID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoLmxvZ2luJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY2FsZW5kYXInLCBbXSlcblxuLyoqXG4gKiBjYWxlbmRhckRlbW9BcHAgLSAwLjEuM1xuICovXG4uY29udHJvbGxlcignQ2FsZW5kYXJDb250cm9sbGVyJywgZnVuY3Rpb24oJHNjb3BlLCRodHRwLCR0aW1lb3V0LCBBcGlFbmRwb2ludFVybCkge1xuXHRcblx0ZnVuY3Rpb24gaW5pdCgpe1xuXHRcdFxuXHRcdCRhcGlVcmwgPSBBcGlFbmRwb2ludFVybCsnY2FsZW5kYXInO1xuXHRcblx0XHQkc2NvcGUuY2FsZW5kYXJFdmVudHMgPSBbe1xuICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCtcImNhbGVuZGFyXCIsXG4gICAgICAgIH1dO1xuXHRcblx0ICAgICRzY29wZS51aUNvbmZpZyA9IHtcblx0ICAgICAgY2FsZW5kYXI6e1xuXHRcdCAgICBsYW5nOiAnc3YnLFxuXHRcdCAgICBidXR0b25UZXh0OiB7XG5cdFx0XHQgICAgdG9kYXk6ICAgICdpZGFnJyxcblx0XHRcdCAgICBtb250aDogICAgJ23DpW5hZCcsXG5cdFx0XHQgICAgd2VlazogICAgICd2ZWNrYScsXG5cdFx0XHQgICAgZGF5OiAgICAgICdkYWcnXG5cdFx0XHR9LFxuXHRcdFx0Zmlyc3REYXk6ICcxJyxcblx0XHRcdHdlZWtOdW1iZXJzOiB0cnVlLFxuXHRcdFx0aGVhZGVyOiB7XG5cdFx0XHRcdGxlZnQ6ICdwcmV2LG5leHQgdG9kYXknLFxuXHRcdFx0XHRjZW50ZXI6ICd0aXRsZScsXG5cdFx0XHRcdHJpZ2h0OiAnbW9udGgsYWdlbmRhV2VlayxhZ2VuZGFEYXknXG5cdFx0XHR9LFxuXHRcdFx0Y29sdW1uRm9ybWF0OiB7XG5cdFx0XHRcdGRheTogJ2RkZCBERC9NTScsXG5cdFx0XHRcdHdlZWs6ICdkZGQgREQvTU0nLFxuXHRcdFx0XHRtb250aDogJ2RkZCdcblx0XHRcdH0sXG5cdFx0XHR0aXRsZUZvcm1hdDoge1xuXHRcdFx0ICAgIG1vbnRoOiAnTU1NTSBZWVlZJywgLy8gU2VwdGVtYmVyIDIwMDlcblx0XHRcdCAgICB3ZWVrOiBcIk1NTU0gRCBZWVlZXCIsIC8vIFNlcCAxMyAyMDA5XG5cdFx0XHQgICAgZGF5OiAnTU1NTSBEIFlZWVknICAvLyBTZXB0ZW1iZXIgOCAyMDA5XG5cdFx0XHR9LFxuXHRcdFx0d2Vla051bWJlclRpdGxlOiAnJyxcblx0XHRcdGF4aXNGb3JtYXQ6ICdIOm1tJyxcblx0XHRcdHRpbWVGb3JtYXQ6ICdIOm1tJyxcblx0XHRcdG1pblRpbWU6ICc2OjAwJyxcblx0XHRcdG1heFRpbWU6ICcyMzo1OScsXG5cdFx0XHRhbGxEYXlTbG90OiBmYWxzZSxcblx0XHRcdGRlZmF1bHRWaWV3OiAnbW9udGgnLFxuXHQgICAgICAgIGhlaWdodDogNTAwLFxuXHQgICAgICAgIGVkaXRhYmxlOiBmYWxzZSxcblx0ICAgICAgICB2aWV3UmVuZGVyOiBmdW5jdGlvbih2aWV3LCBlbGVtZW50KSB7XG5cdFx0XHRcdHZhciBzdGFydCA9IERhdGUucGFyc2Uodmlldy5zdGFydC5fZCk7XG5cdFx0XHRcdHZhciBlbmQgPSBEYXRlLnBhcnNlKHZpZXcuZW5kLl9kKTtcblx0XHRcdFx0JHNjb3BlLmNhbGVuZGFyRXZlbnRzID0gW3tcblx0XHQgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsK1wiY2FsZW5kYXI/c3RhcnQ9XCIrc3RhcnQrXCImZW5kPVwiK2VuZFxuXHRcdCAgICAgICAgfV07XG4gICAgICAgIFx0fSxcblx0XHRcdGV2ZW50Q2xpY2s6ICRzY29wZS5hbGVydE9uRXZlbnRDbGljayxcblx0ICAgICAgICBldmVudERyb3A6ICRzY29wZS5hbGVydE9uRHJvcCxcblx0ICAgICAgICBldmVudFJlc2l6ZTogZnVuY3Rpb24odmlldywgZWxlbWVudCkge1xuXHRcdCAgICAgICAgY29uc29sZS5sb2codmlldyk7XG5cdCAgICAgICAgfVxuXHQgICAgICB9XG5cdCAgICB9O1xuXG5cdCAgICAkc2NvcGUuY2hhbmdlVmlldyA9IGZ1bmN0aW9uKHZpZXcsY2FsZW5kYXIpIHtcblx0ICAgICAgY2FsZW5kYXIuZnVsbENhbGVuZGFyKCdjaGFuZ2VWaWV3Jyx2aWV3KTtcblx0ICAgIH07XG5cdFxuXHQgICAgJHNjb3BlLnJlbmRlckNhbGVuZGVyID0gZnVuY3Rpb24oY2FsZW5kYXIpIHtcblx0ICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG5cdFx0ICAgICAgIGNvbnNvbGUubG9nKDEyMyk7IFxuXHRcdFx0XHRpZihjYWxlbmRhcil7XG5cdFx0XHRcdGNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVuZGVyJyk7XG5cdFx0XHRcdH1cblx0ICAgICAgIH0sIDApO1xuXHQgICAgfTtcblx0fVxuXHRcblx0aW5pdCgpO1xuXG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNoYW1waW9uc2hpcHMuc2lnbnVwcycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNoYW1waW9uc2hpcFNpZ251cHNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDaGFtcGlvbnNoaXBTaWdudXBzRmFjdG9yeSwgJHRpbWVvdXQpe1xuXHR2YXIgc2VsZiA9IHRoaXM7XG5cblx0c2VsZi5sb2FkID0gZnVuY3Rpb24oKSB7XG5cdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdHZhciBhcmdzID0ge1xuXHRcdFx0Y2hhbXBpb25zaGlwc19pZDogJHN0YXRlUGFyYW1zLmNoYW1waW9uc2hpcHNfaWQsXG5cdFx0XHRjdXJyZW50X3BhZ2U6ICRzdGF0ZVBhcmFtcy5jdXJyZW50X3BhZ2UsXG5cdFx0XHRwZXJfcGFnZTogJHN0YXRlUGFyYW1zLnBlcl9wYWdlLFxuXHRcdFx0Y29tcGV0aXRpb25zX2lkOiAkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkLFxuXHRcdFx0c2VhcmNoOiAkc3RhdGVQYXJhbXMuc2VhcmNoXG5cdFx0fTtcblx0XHRDaGFtcGlvbnNoaXBTaWdudXBzRmFjdG9yeS5sb2FkKGFyZ3MpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG5cdFx0XHRcdHNlbGYuY29tcGV0aXRpb25zID0gcmVzcG9uc2UuY29tcGV0aXRpb25zO1xuXHRcdFx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuXHRcdFx0fSk7XG5cdH07XG5cblx0c2VsZi51cGRhdGVQYWdlID0gZnVuY3Rpb24oKXtcblx0XHR2YXIgYXJncyA9IHtcblx0XHRcdGNoYW1waW9uc2hpcHNfaWQ6ICRzdGF0ZVBhcmFtcy5jaGFtcGlvbnNoaXBzX2lkLFxuXHRcdFx0c2VhcmNoOiBzZWxmLnNpZ251cHMuc2VhcmNoLFxuXHRcdFx0Y3VycmVudF9wYWdlOiBzZWxmLnNpZ251cHMuY3VycmVudF9wYWdlLFxuXHRcdFx0cGVyX3BhZ2U6IHNlbGYuc2lnbnVwcy5wZXJfcGFnZSxcblx0XHRcdGNvbXBldGl0aW9uc19pZDogc2VsZi5zaWdudXBzLmNvbXBldGl0aW9uc19pZFxuXHRcdH07XG5cdFx0JHN0YXRlLmdvKCdjaGFtcGlvbnNoaXBzLnNob3cuc2lnbnVwcycsIGFyZ3MsIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0fTtcblxuXHRzZWxmLmxvYWQoKTtcbn0pXG5cbi5mYWN0b3J5KCdDaGFtcGlvbnNoaXBTaWdudXBzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCl7XG5cblx0cmV0dXJuIHtcblx0XHRsb2FkOiBmdW5jdGlvbiAoYXJncykge1xuXG5cdFx0XHR2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NoYW1waW9uc2hpcHMvJythcmdzLmNoYW1waW9uc2hpcHNfaWQrJy9zaWdudXBzJztcblx0XHRcdGN1cnJlbnRfcGFnZSA9IChhcmdzLmN1cnJlbnRfcGFnZSkgPyBhcmdzLmN1cnJlbnRfcGFnZSA6IDE7XG5cblx0XHRcdHVybCArPSAnP3BhZ2U9JyArIGN1cnJlbnRfcGFnZTtcblx0XHRcdGlmIChhcmdzLnNlYXJjaCkgdXJsICs9ICcmc2VhcmNoPScgKyBhcmdzLnNlYXJjaDtcblx0XHRcdGlmIChhcmdzLnBlcl9wYWdlKSB1cmwgKz0gJyZwZXJfcGFnZT0nICsgYXJncy5wZXJfcGFnZTtcblx0XHRcdGlmIChhcmdzLmNvbXBldGl0aW9uc19pZCkgdXJsICs9ICcmY29tcGV0aXRpb25zX2lkPScgKyBhcmdzLmNvbXBldGl0aW9uc19pZDtcblx0XHRcdGlmIChhcmdzLnNwZWNpYWx3aXNoZXMpIHVybCArPSAnJnN0YXR1cz0nICsgYXJncy5zcGVjaWFsd2lzaGVzO1xuXG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdHRVQnLFxuXHRcdFx0XHR1cmw6IHVybCxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cblx0XHRcdH0pO1xuXHRcdH1cblxuXHR9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNoYW1waW9uc2hpcHMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJDaGFtcGlvbnNoaXBzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDaGFtcGlvbnNoaXBzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlUGFnZShwYWdlKSB7XG4gICAgICAgIENoYW1waW9uc2hpcHNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNoYW1waW9uc2hpcHMgPSByZXNwb25zZS5jaGFtcGlvbnNoaXBzO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuICAgIHRoaXMucGFnZSA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5wYWdlLCAxMCk7XG4gICAgdGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG4gICAgdGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuICAgIHNvcnRMaXN0KCk7XG4gICAgdXBkYXRlUGFnZSgpO1xuXG5cbn0pXG4uY29udHJvbGxlcihcIkNoYW1waW9uc2hpcENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ2hhbXBpb25zaGlwc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBmaW5kKCl7XG4gICAgICAgIENoYW1waW9uc2hpcHNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmNoYW1waW9uc2hpcHNfaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGFtcGlvbnNoaXAgPSByZXNwb25zZS5jaGFtcGlvbnNoaXA7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjaGFtcGlvbnNoaXBzLmluZGV4Jywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZpbmQoKTtcblxufSlcblxuLmZhY3RvcnkoJ0NoYW1waW9uc2hpcHNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkOiBmdW5jdGlvbiAocGFnZSwgaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnY2hhbXBpb25zaGlwcyc7XG5cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG4gICAgICAgICAgICBpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NoYW1waW9uc2hpcHMvJytpZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jbHVicy5pbnZvaWNlcycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNsdWJHZW5lcmF0ZUludm9pY2VzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ2x1Ykludm9pY2VzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRJbnZvaWNlcygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENsdWJJbnZvaWNlc0ZhY3RvcnkubG9hZFBlbmRpbmdTaWdudXBzKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlU2lnbnVwcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmNyZWF0ZUludm9pY2UgPSBmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENsdWJJbnZvaWNlc0ZhY3RvcnkuY3JlYXRlSW52b2ljZXMoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ3N1Y2Nlc3MnKTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NsdWIuaW52b2ljZXMuaW5kZXgnKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsb2FkSW52b2ljZXMoKTtcbn0pXG4uY29udHJvbGxlcihcIkNsdWJJbnZvaWNlc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENsdWJJbnZvaWNlc0ZhY3RvcnksICR1aWJNb2RhbCwgRmlsZVNhdmVyLCBCbG9iKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gbG9hZEludm9pY2VzKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5sb2FkKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmludm9pY2VzX2luY29taW5nID0gcmVzcG9uc2UuaW52b2ljZXNfaW5jb21pbmc7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlc19vdXRnb2luZyA9IHJlc3BvbnNlLmludm9pY2VzX291dGdvaW5nO1xuICAgICAgICAgICAgICAgIHNlbGYuaW52b2ljZXNfZ2VuZXJhdGUgPSByZXNwb25zZS5pbnZvaWNlc19nZW5lcmF0ZTtcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYub3BlblBheW1lbnRNb2RhbCA9IGZ1bmN0aW9uKGludm9pY2Upe1xuXG4gICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdDbHViSW52b2ljZVBheW1lbnRNb2RhbC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZVBheW1lbnRNb2RhbENvbnRyb2xsZXIgYXMgbW9kYWxjb250cm9sbGVyJyxcbiAgICAgICAgICAgIHNpemU6ICdtZCcsXG4gICAgICAgICAgICByZXNvbHZlOiB7XG4gICAgICAgICAgICAgICAgaW52b2ljZTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gaW52b2ljZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbG9hZEludm9pY2VzKCk7XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRvd25sb2FkID0gZnVuY3Rpb24oaW52b2ljZSl7XG4gICAgICAgIENsdWJJbnZvaWNlc0ZhY3RvcnkuZG93bmxvYWQoaW52b2ljZS5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuICAgICAgICAgICAgICAgIGlmKGZpbGUuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsICdpbnZvaWNlLScgKyBpbnZvaWNlLmludm9pY2VfcmVmZXJlbmNlICsgJy5wZGYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuICAgIFxuICAgIGxvYWRJbnZvaWNlcygpO1xufSlcbi5jb250cm9sbGVyKFwiQ2x1Ykludm9pY2VDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDbHViSW52b2ljZXNGYWN0b3J5LCBGaWxlU2F2ZXIsIEJsb2IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gbG9hZEludm9pY2VzKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBpZighcmVzcG9uc2UuaW52b2ljZSkgJHN0YXRlLmdvKCdjbHViLmludm9pY2VzLmluZGV4Jyk7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlID0gcmVzcG9uc2UuaW52b2ljZTtcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuZG93bmxvYWQgPSBmdW5jdGlvbihpbnZvaWNlKXtcbiAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5kb3dubG9hZChpbnZvaWNlLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gbmV3IEJsb2IoW3Jlc3BvbnNlXSwge3R5cGU6ICdhcHBsaWNhdGlvbi9wZGYnfSk7XG4gICAgICAgICAgICAgICAgaWYoZmlsZS5zaXplKSB7XG4gICAgICAgICAgICAgICAgICAgIEZpbGVTYXZlci5zYXZlQXMoZmlsZSwgJ2ludm9pY2UtJyArIGludm9pY2UuaW52b2ljZV9yZWZlcmVuY2UgKyAnLnBkZicpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsb2FkSW52b2ljZXMoKTtcbn0pXG4uY29udHJvbGxlcignQ2x1Ykludm9pY2VQYXltZW50TW9kYWxDb250cm9sbGVyJywgZnVuY3Rpb24gKCRzY29wZSwgJHVpYk1vZGFsSW5zdGFuY2UsIGludm9pY2UsIENsdWJJbnZvaWNlc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXG4gICAgc2VsZi5vcHRpb25zID0ge1xuICAgICAgICBzaG93V2Vla3M6IHRydWUsXG4gICAgICAgIHN0YXJ0aW5nRGF5OiAxLFxuICAgICAgICBtYXhEYXRlOiBuZXcgRGF0ZSgpLFxuICAgICAgICBtaW5EYXRlOiBtb21lbnQoaW52b2ljZS5pbnZvaWNlX2RhdGUpLnN0YXJ0T2YoJ2RheScpXG4gICAgfTtcbiAgICBzZWxmLmludm9pY2UgPSBhbmd1bGFyLmNvcHkoaW52b2ljZSk7XG5cbiAgICBzZWxmLnJlZ2lzdGVyUGF5bWVudCA9IGZ1bmN0aW9uIChpbnZvaWNlKSB7XG4gICAgICAgIGlmKGludm9pY2UucGFpZF9hdCAmJiAhc2VsZi5sb2FkaW5nU3RhdGUpe1xuICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICAgICAgQ2x1Ykludm9pY2VzRmFjdG9yeS5yZWdpc3RlclBheW1lbnQoaW52b2ljZS5pZCwgaW52b2ljZS5wYWlkX2F0KVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UoKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgIH07XG59KVxuLmZhY3RvcnkoJ0NsdWJJbnZvaWNlc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHZhciB1cmwgPSAoaWQpID8gJy8nK2lkIDogJyc7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY2x1Ymludm9pY2VzJyt1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxvYWRQZW5kaW5nU2lnbnVwczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY2x1Ymludm9pY2VzL3BlbmRpbmdzaWdudXBzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY3JlYXRlSW52b2ljZXM6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJpbnZvaWNlcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY2x1Ymludm9pY2VzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZ2lzdGVyUGF5bWVudDogZnVuY3Rpb24oaWQsIHBhaWRfYXQpe1xuXG4gICAgICAgICAgICBwYWlkX2F0ID0gbW9tZW50KG5ldyBEYXRlKHBhaWRfYXQpKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6bW06c3MnKTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJpbnZvaWNlcy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oe3BhaWRfYXQ6IHBhaWRfYXR9KVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZG93bmxvYWQ6IGZ1bmN0aW9uKGlkKXtcbiAgICAgICAgICAgIGlmKGlkKXtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjbHViaW52b2ljZXMvJytpZCsnL2Rvd25sb2FkJyxcbiAgICAgICAgICAgICAgICAgICAgcmVzcG9uc2VUeXBlOiAnYXJyYXlidWZmZXInLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNsdWJzJywgW10pXG5cbi5jb250cm9sbGVyKFwiQ2x1YkNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGUsIENsdWJzRmFjdG9yeSl7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLmZpbHRlciA9IHtcblx0XHR1c2Vyczoge1xuXHRcdFx0c2VhcmNoOiAnJ1xuXHRcdH0sXG5cdFx0aW52b2ljZXM6IHtcblx0XHRcdHNlYXJjaDogJydcblx0XHR9XG5cdH07XG5cblx0c2VsZi5hZGRfYWRtaW4gPSBudWxsO1xuXG5cdGZ1bmN0aW9uIGxvYWRVc2VyQ2x1YigpIHtcblx0XHQkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG5cdFx0Q2x1YnNGYWN0b3J5LmxvYWRVc2VyQ2x1YigpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuc2VsZWN0ZWRDbHVicyA9ICcnO1xuXHRcdFx0XHRpZighcmVzcG9uc2UuaWQpe1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5jb25uZWN0Jywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcblx0XHRcdFx0fVxuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi51cGRhdGVDbHViID0gZnVuY3Rpb24oKXtcblx0XHRDbHVic0ZhY3RvcnkudXBkYXRlQ2x1YihzZWxmLmNsdWIpXG5cdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5pbmZvcm1hdGlvbicsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0XHR9KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZFVzZXJBc0FkbWluID0gZnVuY3Rpb24oYWRtaW4pXG5cdHtcblx0XHRpZihhZG1pbil7XG5cdFx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlckFzQWRtaW4oYWRtaW4pXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKCl7XG5cdFx0XHRcdFx0bG9hZFVzZXJDbHViKCk7XG5cdFx0XHRcdH0pXG5cdFx0XHRcdC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xuXG5cdHNlbGYuZGVsZXRlVXNlckFzQWRtaW4gPSBmdW5jdGlvbihhZG1pbilcblx0e1xuXHRcdGlmKGFkbWluKXtcblx0XHRcdENsdWJzRmFjdG9yeS5kZWxldGVVc2VyQXNBZG1pbihhZG1pbilcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oKXtcblx0XHRcdFx0XHRsb2FkVXNlckNsdWIoKTtcblx0XHRcdFx0fSlcblx0XHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHQkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cdH07XG5cblx0bG9hZFVzZXJDbHViKCk7XG59KVxuXG4uY29udHJvbGxlcihcIkNsdWJDb25uZWN0Q29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KSB7XG5cdHZhciBzZWxmID0gdGhpcztcblxuXHRzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG5cdHNlbGYuc2VsZWN0ZWRjbHViID0ge307XG5cdHNlbGYubmV3X2NsdWIgPSBudWxsO1xuXHRzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuXHRzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcblxuXHRmdW5jdGlvbiBsb2FkVXNlckNsdWIoKSB7XG5cdFx0JHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuXHRcdENsdWJzRmFjdG9yeS5sb2FkVXNlckNsdWIoKVxuXHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRzZWxmLnNlbGVjdGVkQ2x1YnMgPSAnJztcblx0XHRcdFx0aWYocmVzcG9uc2UuaWQpe1xuXHRcdFx0XHRcdCRzdGF0ZS5nbygnY2x1Yi5pbmZvcm1hdGlvbicsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG5cdFx0XHRcdH1cblx0XHRcdFx0c2VsZi5jbHViID0gcmVzcG9uc2U7XG5cdFx0XHRcdCRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cblx0XHRcdH0pO1xuXHR9XG5cblx0c2VsZi5zZWFyY2hGb3JDbHVicyA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5LCBjbHViKVxuXHR7XG5cdFx0cmV0dXJuIENsdWJzRmFjdG9yeVxuXHRcdFx0LnNlYXJjaEZvckNsdWJzKHNlYXJjaFF1ZXJ5KVxuXHRcdFx0LmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ3dhcm5pbmcnKTtcblx0XHRcdH0pXG5cdFx0XHQudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdHNlbGYuZm91bmRNYXRjaCA9IChyZXNwb25zZS5kYXRhLmNsdWJzLmxlbmd0aCA+IDApO1xuXHRcdFx0XHRyZXR1cm4gcmVzcG9uc2UuZGF0YS5jbHVicy5tYXAoZnVuY3Rpb24oaXRlbSl7XG5cdFx0XHRcdFx0aXRlbS5hbHJlYWR5U2VsZWN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHRpZihjbHViLmlkID09IGl0ZW0uaWQpIGl0ZW0uYWxyZWFkeVNlbGVjdGVkID0gdHJ1ZTtcblx0XHRcdFx0XHRyZXR1cm4gaXRlbTtcblx0XHRcdFx0fSk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLnNlbGVjdENsdWIgPSBmdW5jdGlvbigkaXRlbSlcblx0e1xuXHRcdGlmKCRpdGVtLmFscmVhZHlTZWxlY3RlZCA9PT0gdHJ1ZSkgcmV0dXJuIGZhbHNlO1xuXHRcdHNlbGYubm9NYXRjaGluZ0NsdWJzID0gbnVsbDtcblx0XHRzZWxmLm5ld19jbHViID0gJGl0ZW07XG5cdH07XG5cblx0c2VsZi5ub0NsdWJzRm91bmQgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRzZWxmLm5vTWF0Y2hpbmdDbHVicyA9IHRydWU7XG5cdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdH07XG5cblx0c2VsZi5hZGRVc2VyVG9DbHVicyA9IGZ1bmN0aW9uKGNsdWIpXG5cdHtcblx0XHRDbHVic0ZhY3RvcnkuYWRkVXNlclRvQ2x1YnMoY2x1Yi5pZClcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5uZXdfY2x1YiA9IG51bGw7XG5cdFx0XHRcdHNlbGYuY2hhbmdlQ2x1YiA9IGZhbHNlO1xuXHRcdFx0XHRzZWxmLmNsdWIgPSByZXNwb25zZTtcblx0XHRcdFx0JHN0YXRlLmdvKCdjbHViLmluZm9ybWF0aW9uJywge30sIHtsb2NhdGlvbjogJ3JlcGxhY2UnfSk7XG5cdFx0XHR9KTtcblx0fTtcblxuXHRzZWxmLmFkZE5ld0NsdWIgPSBmdW5jdGlvbigpXG5cdHtcblx0XHRpZighc2VsZi5zZWFyY2hRdWVyeSB8fCAhc2VsZi5hZGRfY2x1YnNfbnIpIHJldHVybiBmYWxzZTtcblx0XHR2YXIgY2x1YiA9IHtcblx0XHRcdG5hbWU6IHNlbGYuc2VhcmNoUXVlcnksXG5cdFx0XHRjbHVic19ucjogc2VsZi5hZGRfY2x1YnNfbnJcblx0XHR9O1xuXG5cdFx0Q2x1YnNGYWN0b3J5LmFkZE5ld0NsdWIoY2x1Yilcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0c2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuXHRcdFx0XHRzZWxmLmFkZF9jbHVic19uciA9ICcnO1xuXHRcdFx0XHRzZWxmLm5ld19jbHViID0gbnVsbDtcblx0XHRcdFx0c2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG5cdFx0XHRcdHNlbGYuY2x1YiA9IHJlc3BvbnNlO1xuXHRcdFx0XHQkc3RhdGUuZ28oJ2NsdWIuaW5mb3JtYXRpb24nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcblx0XHRcdH0pO1xuXHR9O1xuXG5cdGxvYWRVc2VyQ2x1YigpO1xuXG59KVxuXG4uZmFjdG9yeSgnQ2x1YnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuXHRyZXR1cm4ge1xuXHRcdGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuXHRcdFx0dmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydjbHVicyc7XG5cblx0XHRcdGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG5cdFx0XHRpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnR0VUJyxcblx0XHRcdFx0dXJsOiB1cmwsXG5cdFx0XHRcdGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZmluZDogZnVuY3Rpb24oaWQpIHtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzLycraWQsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0Y3JlYXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oY2x1Yilcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHR1cGRhdGVDbHViOiBmdW5jdGlvbihjbHViKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQVVQnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicycsXG5cdFx0XHRcdGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuXHRcdFx0XHRkYXRhOiAkLnBhcmFtKGNsdWIpXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0ZGVsZXRlQ2x1YjogZnVuY3Rpb24oY2x1Yikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvJytjbHViLmlkLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGxvYWRVc2VyQ2x1YjogZnVuY3Rpb24oKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ0dFVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2dldFVzZXJDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGRVc2VyVG9DbHViczogZnVuY3Rpb24oY2x1YnNfaWQpe1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2NsdWJzL2FkZFVzZXJUb0NsdWJzJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19pZCc6IGNsdWJzX2lkfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRhZGROZXdDbHViOiBmdW5jdGlvbihjbHViKXtcblx0XHRcdHJldHVybiAkaHR0cCh7XG5cdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHR1cmw6IEFwaUVuZHBvaW50VXJsKydjbHVicy9hZGROZXdDbHViJyxcblx0XHRcdFx0aGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ30sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydjbHVic19ucic6IGNsdWIuY2x1YnNfbnIsICduYW1lJzogY2x1Yi5uYW1lfSlcblx0XHRcdH0pO1xuXHRcdH0sXG5cblx0XHRzZWFyY2hGb3JDbHViczogZnVuY3Rpb24oZmlsdGVyKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvc2VhcmNoJyxcblx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdGRhdGE6ICQucGFyYW0oeydzZWFyY2hRdWVyeSc6IGZpbHRlcn0pXG5cdFx0XHR9KTtcblx0XHR9LFxuXG5cdFx0YWRkVXNlckFzQWRtaW46IGZ1bmN0aW9uKGFkbWluKSB7XG5cdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvYWRkVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fSxcblxuXHRcdGRlbGV0ZVVzZXJBc0FkbWluOiBmdW5jdGlvbihhZG1pbikge1xuXHRcdFx0cmV0dXJuICRodHRwKHtcblx0XHRcdFx0bWV0aG9kOiAnREVMRVRFJyxcblx0XHRcdFx0dXJsOiBBcGlFbmRwb2ludFVybCsnY2x1YnMvZGVsZXRlVXNlckFzQWRtaW4nLFxuXHRcdFx0XHRoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcblx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7J2FkbWluJzogYWRtaW59KVxuXHRcdFx0fSk7XG5cdFx0fVxuXHR9O1xufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jb21wZXRpdGlvbnMuYWRtaW4uZXhwb3J0JywgW10pXG5cbi5jb250cm9sbGVyKFwiQ29tcGV0aXRpb25zQWRtaW5FeHBvcnRDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnksIEZpbGVTYXZlciwgQmxvYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYuZmlsdGVyID0ge1xuICAgICAgICBwYXRyb2xzX291dHB1dDoge1xuICAgICAgICAgICAgcGFnZWJyZWFrOiAnJyxcbiAgICAgICAgICAgIG9yZGVyYnk6ICdwYXRyb2xzJ1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuZG93bmxvYWRQYXRyb2xzTGlzdCA9IGZ1bmN0aW9uKGNvbXBldGl0aW9uKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmxvZyhjb21wZXRpdGlvbik7XG4gICAgICAgIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnkuZG93bmxvYWRQYXRyb2xzTGlzdChjb21wZXRpdGlvbi5pZCwgc2VsZi5maWx0ZXIucGF0cm9sc19vdXRwdXQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBuZXcgQmxvYihbcmVzcG9uc2VdLCB7dHlwZTogJ2FwcGxpY2F0aW9uL3BkZid9KTtcbiAgICAgICAgICAgICAgICBpZihmaWxlLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhmaWxlLCBjb21wZXRpdGlvbi5kYXRlKycgJytjb21wZXRpdGlvbi5uYW1lICsgJyAnICsgY29tcGV0aXRpb24udHJhbnNsYXRpb25zLnBhdHJvbHNfbGlzdF9zaW5ndWxhciArICcucGRmJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxufSk7IiwiYW5ndWxhci5tb2R1bGUoJ2FwcC5jb21wZXRpdGlvbnMuYWRtaW4nLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJDb21wZXRpdGlvbnNBZG1pbkNvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ29tcGV0aXRpb25zUGF0cm9sc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmZpbmQgPSBmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENvbXBldGl0aW9uc1BhdHJvbHNGYWN0b3J5LmZpbmQoJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9uID0gcmVzcG9uc2UuY29tcGV0aXRpb247XG4gICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbl90eXBlcyA9IHJlc3BvbnNlLmNvbXBldGl0aW9uX3R5cGVzO1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb24uc3RhcnRfdGltZSA9IG1vbWVudChzZWxmLmNvbXBldGl0aW9uLnN0YXJ0X3RpbWUsICdISDptbTpzcycpO1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb24uZmluYWxfdGltZSA9IG1vbWVudChzZWxmLmNvbXBldGl0aW9uLmZpbmFsX3RpbWUsICdISDptbTpzcycpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbnMnLCB7fSwge2xvY2F0aW9uOidyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5maW5kKCk7XG5cbiAgICBzZWxmLnVwZGF0ZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ29tcGV0aXRpb25zUGF0cm9sc0ZhY3Rvcnkuc2F2ZShzZWxmLmNvbXBldGl0aW9uKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb24gPSByZXNwb25zZS5jb21wZXRpdGlvbjtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9uLnN0YXJ0X3RpbWUgPSBtb21lbnQoc2VsZi5jb21wZXRpdGlvbi5zdGFydF90aW1lLCAnSEg6bW06c3MnKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9uLmZpbmFsX3RpbWUgPSBtb21lbnQoc2VsZi5jb21wZXRpdGlvbi5maW5hbF90aW1lLCAnSEg6bW06c3MnKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb25zJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG5cbiAgICB9O1xufSlcblxuLmZhY3RvcnkoJ0NvbXBldGl0aW9uc1BhdHJvbHNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2lkKycvYWRtaW4nLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2F2ZTogZnVuY3Rpb24oY29tcGV0aXRpb24pe1xuICAgICAgICAgICAgZGF0YSA9IGFuZ3VsYXIuY29weShjb21wZXRpdGlvbik7XG4gICAgICAgICAgICBpZihjb21wZXRpdGlvbi5zdGFydF90aW1lKXtcbiAgICAgICAgICAgICAgICBkYXRhLnN0YXJ0X3RpbWUgPSBtb21lbnQoY29tcGV0aXRpb24uc3RhcnRfdGltZSkuZm9ybWF0KCdISDptbTpzcycpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYoY29tcGV0aXRpb24uZmluYWxfdGltZSl7XG4gICAgICAgICAgICAgICAgZGF0YS5maW5hbF90aW1lID0gbW9tZW50KGNvbXBldGl0aW9uLmZpbmFsX3RpbWUpLmZvcm1hdCgnSEg6bW06c3MnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbXBldGl0aW9uLmRhdGUpe1xuICAgICAgICAgICAgICAgIGRhdGEuZGF0ZSA9IG1vbWVudChjb21wZXRpdGlvbi5kYXRlKS5mb3JtYXQoJ1lZWVktTU0tREQnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmKGNvbXBldGl0aW9uLnNpZ251cHNfY2xvc2luZ19kYXRlKSB7XG4gICAgICAgICAgICAgICAgZGF0YS5zaWdudXBzX2Nsb3NpbmdfZGF0ZSA9IG1vbWVudChjb21wZXRpdGlvbi5zaWdudXBzX2Nsb3NpbmdfZGF0ZSkuZm9ybWF0KCdZWVlZLU1NLUREJyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb24uaWQrJy9hZG1pbicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShkYXRhKVxuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbXBldGl0aW9ucy5hZG1pbi5wYXRyb2xzJywgW10pXG5cbi5jb250cm9sbGVyKFwiQ29tcGV0aXRpb25zQWRtaW5QYXRyb2xzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdWliTW9kYWwsIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnksIEZpbGVTYXZlciwgQmxvYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBzZWxmLmFjdGl2ZV9wYXRyb2xfaWQgPSAwO1xuXG4gICAgc2VsZi5maWx0ZXIgPSB7XG4gICAgICAgIHNob3c6IGZhbHNlLFxuICAgICAgICBzaG9vdGluZ19jYXJkX251bWJlcjogJycsXG4gICAgICAgIHNoYXJlX3BhdHJvbF93aXRoOiAnJyxcbiAgICAgICAgZmlyc3RfbGFzdF9wYXRyb2w6ICcnLFxuICAgICAgICBzdGFydF9iZWZvcmU6ICcnLFxuICAgICAgICBzdGFydF9hZnRlcjogJycsXG4gICAgICAgIHBvc3NpYmxlX2NvbGxpc2lvbjogJycsXG4gICAgICAgIHdlYXBvbmdyb3Vwc19pZDogJycsXG4gICAgICAgIG9yZGVyYnk6ICdjbHVic19pZCcsXG4gICAgICAgIGN1cnJlbnRfcGFnZTogMSxcbiAgICAgICAgcGVyX3BhZ2U6MzBcbiAgICB9O1xuXG4gICAgc2VsZi5nZXRQYXRyb2xzID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDb21wZXRpdGlvbnNBZG1pblBhdHJvbHNGYWN0b3J5LmdldFBhdHJvbHMoJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnBhdHJvbHMgPSByZXNwb25zZS5wYXRyb2xzO1xuICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdmFpbGFibGVMYW5lcygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb25zLmFkbWluJywge2NvbXBldGl0aW9uc19pZDogJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZH0sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5zZXRBY3RpdmVQYXRyb2wgPSBmdW5jdGlvbihwYXRyb2xfaWQpIHtcbiAgICAgICAgc2VsZi5hY3RpdmVfcGF0cm9sX2lkID0gKHNlbGYuYWN0aXZlX3BhdHJvbF9pZCAhPSBwYXRyb2xfaWQpID8gcGF0cm9sX2lkIDogMDtcbiAgICB9O1xuXG4gICAgc2VsZi5vcGVuUGF0cm9sRWRpdE1vZGFsID0gZnVuY3Rpb24ocGF0cm9sLCBjb21wZXRpdGlvbil7XG5cbiAgICAgICAgdmFyIG1vZGFsSW5zdGFuY2UgPSAkdWliTW9kYWwub3Blbih7XG4gICAgICAgICAgICBhbmltYXRpb246IHRydWUsXG4gICAgICAgICAgICB0ZW1wbGF0ZVVybDogJ1BhdHJvbEVkaXRNb2RhbC5odG1sJyxcbiAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQYXRyb2xFZGl0TW9kYWxDb250cm9sbGVyIGFzIG1vZGFsY29udHJvbGxlcicsXG4gICAgICAgICAgICBzaXplOiAnbGcnLFxuICAgICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgICAgIHBhdHJvbDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gcGF0cm9sO1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgY29tcGV0aXRpb246IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gY29tcGV0aXRpb247XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgcGF0cm9sLnBhdHJvbF9zaXplID0gcmVzcG9uc2UucGF0cm9sLnBhdHJvbF9zaXplO1xuICAgICAgICAgICAgcGF0cm9sLnN0YXJ0X3RpbWUgPSByZXNwb25zZS5wYXRyb2wuc3RhcnRfdGltZTtcbiAgICAgICAgICAgIHBhdHJvbC5lbmRfdGltZSA9IHJlc3BvbnNlLnBhdHJvbC5lbmRfdGltZTtcbiAgICAgICAgICAgIHBhdHJvbC5zdGFydF90aW1lX2h1bWFuID0gcmVzcG9uc2UucGF0cm9sLnN0YXJ0X3RpbWVfaHVtYW47XG4gICAgICAgICAgICBwYXRyb2wuZW5kX3RpbWVfaHVtYW4gPSByZXNwb25zZS5wYXRyb2wuZW5kX3RpbWVfaHVtYW47XG4gICAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocmVzcG9uc2UucGF0cm9sLnNpZ251cHMsIGZ1bmN0aW9uKHNpZ251cCwga2V5KXtcbiAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZUNvbGxpZGluZ1NpZ251cHMoc2lnbnVwKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIFxuICAgIHNlbGYuZ2VuZXJhdGVQYXRyb2xzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDb21wZXRpdGlvbnNBZG1pblBhdHJvbHNGYWN0b3J5LmdlbmVyYXRlUGF0cm9scygkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLnBhdHJvbHMubGVuZ3RoKXtcbiAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHJlc3BvbnNlLnBhdHJvbHMsIGZ1bmN0aW9uKHBhdHJvbCwga2V5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYucGF0cm9scy5wdXNoKHBhdHJvbCk7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgICAgIHNlbGYuc2V0QXZhaWxhYmxlTGFuZXMoKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgfTtcblxuICAgIHNlbGYuY3JlYXRlUGF0cm9sID0gZnVuY3Rpb24oKXtcbiAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDb21wZXRpdGlvbnNBZG1pblBhdHJvbHNGYWN0b3J5LmNyZWF0ZVBhdHJvbCgkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYucGF0cm9scy5wdXNoKHJlc3BvbnNlLnBhdHJvbCk7XG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdmFpbGFibGVMYW5lcygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcbiAgICBcbiAgICBzZWxmLmRlbGV0ZVBhdHJvbCA9IGZ1bmN0aW9uKHBhdHJvbCl7XG4gICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ29tcGV0aXRpb25zQWRtaW5QYXRyb2xzRmFjdG9yeS5kZWxldGVQYXRyb2woJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZCwgcGF0cm9sLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYucGF0cm9scy5zcGxpY2Uoc2VsZi5wYXRyb2xzLmluZGV4T2YocGF0cm9sKSwgMSk7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2Uuc2lnbnVwcyl7XG4gICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChyZXNwb25zZS5zaWdudXBzLCBmdW5jdGlvbihzaWdudXAsIGtleSl7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMucHVzaChzaWdudXApO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5hY3RpdmVfcGF0cm9sX2lkID0gMDtcbiAgICAgICAgICAgICAgICBzZWxmLnNldEF2YWlsYWJsZUxhbmVzKCk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVBbGxQYXRyb2xzID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDb21wZXRpdGlvbnNBZG1pblBhdHJvbHNGYWN0b3J5LmRlbGV0ZUFsbFBhdHJvbHMoJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnBhdHJvbHMgPSBbXTtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgICAgIHNlbGYuYWN0aXZlX3BhdHJvbF9pZCA9IDA7XG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdmFpbGFibGVMYW5lcygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuZW1wdHlQYXRyb2wgPSBmdW5jdGlvbihwYXRyb2wpe1xuICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnkuZW1wdHlQYXRyb2woJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZCwgcGF0cm9sLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLnNpZ251cHMpe1xuICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocmVzcG9uc2Uuc2lnbnVwcywgZnVuY3Rpb24oc2lnbnVwLCBrZXkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbnVwLmxhbmUgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2lnbnVwLnBhdHJvbHNfaWQgPSAwO1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzLnB1c2goc2lnbnVwKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHBhdHJvbC5zaWdudXBzID0gW107XG4gICAgICAgICAgICAgICAgc2VsZi5zZXRBdmFpbGFibGVMYW5lcygpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlU2lnbnVwTGFuZSA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIGlmKHNpZ251cC5uZXdfbGFuZSl7XG4gICAgICAgICAgICBDb21wZXRpdGlvbnNBZG1pblBhdHJvbHNGYWN0b3J5LnVwZGF0ZVNpZ251cExhbmUoJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZCwgc2lnbnVwKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgc2lnbnVwLmxhbmUgPSByZXNwb25zZS5zaWdudXAubGFuZTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRBdmFpbGFibGVMYW5lcygpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBzZWxmLmFzc29jaWF0ZVNpZ251cFdpdGhQYXRyb2wgPSBmdW5jdGlvbihwYXRyb2xzX2lkLCBzaWdudXApe1xuICAgICAgICBpZihwYXRyb2xzX2lkID4gMCAmJiBzaWdudXAgJiYgIXNlbGYubG9hZGluZ1N0YXRlKXtcbiAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnkuYXNzb2NpYXRlU2lnbnVwV2l0aFBhdHJvbCgkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkLCBwYXRyb2xzX2lkLCBzaWdudXAuaWQsIHNpZ251cC5sYW5lKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgLyoqXG4gICAgICAgICAgICAgICAgICAgICAqIFB1c2ggdGhlIGFzc29jaWF0ZWQgc2lnbnVwIHRvIHRoZSBwYXRyb2xcbiAgICAgICAgICAgICAgICAgICAgICovXG4gICAgICAgICAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLnBhdHJvbHMsIGZ1bmN0aW9uKHBhdHJvbCwga2V5KXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHBhdHJvbC5pZCA9PSBwYXRyb2xzX2lkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzaWdudXAucGF0cm9sc19pZCA9IHBhdHJvbHNfaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2lnbnVwLmxhbmUgPSByZXNwb25zZS5zaWdudXAubGFuZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBwYXRyb2wuc2lnbnVwcy5wdXNoKHNpZ251cCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICB2YXIgc2lnbnVwSW5kZXggPSBzZWxmLnNpZ251cHMuaW5kZXhPZihzaWdudXApO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMuc3BsaWNlKHNpZ251cEluZGV4LDEpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnVwZGF0ZUNvbGxpZGluZ1NpZ251cHMocmVzcG9uc2Uuc2lnbnVwKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zZXRBdmFpbGFibGVMYW5lcygpO1xuXG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuICAgIHNlbGYuZGlzc29jaWF0ZVNpZ251cFdpdGhQYXRyb2wgPSBmdW5jdGlvbihwYXRyb2wsIHNpZ251cCl7XG4gICAgICAgIGlmKHBhdHJvbCAmJiBzaWdudXAgJiYgIXNlbGYubG9hZGluZ1N0YXRlKXtcbiAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgICAgIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnkuZGlzc29jaWF0ZVNpZ251cFdpdGhQYXRyb2woJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZCwgcGF0cm9sLmlkLCBzaWdudXAuaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICBzaWdudXAucGF0cm9sc19pZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgIHNpZ251cC5sYW5lID0gMDtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzLnB1c2goc2lnbnVwKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHNpZ251cEluZGV4ID0gcGF0cm9sLnNpZ251cHMuaW5kZXhPZihzaWdudXApO1xuICAgICAgICAgICAgICAgICAgICBwYXRyb2wuc2lnbnVwcy5zcGxpY2Uoc2lnbnVwSW5kZXgsMSk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYudXBkYXRlQ29sbGlkaW5nU2lnbnVwcyhyZXNwb25zZS5zaWdudXApO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNldEF2YWlsYWJsZUxhbmVzKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5zaGFyZVBhdHJvbFdpdGggPSBmdW5jdGlvbihwYXRyb2xzX2lkLCBzaG9vdGluZ19jYXJkX251bWJlcil7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLnNpZ251cHMsIGZ1bmN0aW9uKHNpZ251cCwga2V5KXtcbiAgICAgICAgICAgIGlmKHNpZ251cC51c2VyLnNob290aW5nX2NhcmRfbnVtYmVyID09IHNob290aW5nX2NhcmRfbnVtYmVyKXtcbiAgICAgICAgICAgICAgICBzZWxmLmFzc29jaWF0ZVNpZ251cFdpdGhQYXRyb2wocGF0cm9sc19pZCwgc2lnbnVwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlQ29sbGlkaW5nU2lnbnVwcyA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLnNpZ251cHMsIGZ1bmN0aW9uKGF2YWlsYWJsZV9zaWdudXAsIGtleSl7XG4gICAgICAgICAgICBpZihhdmFpbGFibGVfc2lnbnVwLmNvbGxpZGluZ19zaWdudXBzLmxlbmd0aCl7XG4gICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKGF2YWlsYWJsZV9zaWdudXAuY29sbGlkaW5nX3NpZ251cHMsIGZ1bmN0aW9uKGNvbGxpZGluZ19zaWdudXAsIGtleSl7XG4gICAgICAgICAgICAgICAgICAgIGlmKGNvbGxpZGluZ19zaWdudXAuaWQgPT0gc2lnbnVwLmlkKXtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxpZGluZ19zaWdudXAuc3RhcnRfdGltZSA9IHNpZ251cC5zdGFydF90aW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGlkaW5nX3NpZ251cC5lbmRfdGltZSA9IHNpZ251cC5lbmRfdGltZTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxpZGluZ19zaWdudXAuc3RhcnRfdGltZV9odW1hbiA9IHNpZ251cC5zdGFydF90aW1lX2h1bWFuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGlkaW5nX3NpZ251cC5lbmRfdGltZV9odW1hbiA9IHNpZ251cC5lbmRfdGltZV9odW1hbjtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbGxpZGluZ19zaWdudXAucGF0cm9sc19pZCA9IHNpZ251cC5wYXRyb2xzX2lkO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLnBhdHJvbHMsIGZ1bmN0aW9uKHBhdHJvbCwga2V5KXtcbiAgICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChwYXRyb2wuc2lnbnVwcywgZnVuY3Rpb24ocGF0cm9sX3NpZ251cCwga2V5KXtcbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2gocGF0cm9sX3NpZ251cC5jb2xsaWRpbmdfc2lnbnVwcywgZnVuY3Rpb24oY29sbGlkaW5nX3NpZ251cCwga2V5KXtcbiAgICAgICAgICAgICAgICAgICAgaWYoY29sbGlkaW5nX3NpZ251cC5pZCA9PSBzaWdudXAuaWQpe1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGlkaW5nX3NpZ251cC5zdGFydF90aW1lID0gc2lnbnVwLnN0YXJ0X3RpbWU7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsaWRpbmdfc2lnbnVwLmVuZF90aW1lID0gc2lnbnVwLmVuZF90aW1lO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGlkaW5nX3NpZ251cC5zdGFydF90aW1lX2h1bWFuID0gc2lnbnVwLnN0YXJ0X3RpbWVfaHVtYW47XG4gICAgICAgICAgICAgICAgICAgICAgICBjb2xsaWRpbmdfc2lnbnVwLmVuZF90aW1lX2h1bWFuID0gc2lnbnVwLmVuZF90aW1lX2h1bWFuO1xuICAgICAgICAgICAgICAgICAgICAgICAgY29sbGlkaW5nX3NpZ251cC5wYXRyb2xzX2lkID0gc2lnbnVwLnBhdHJvbHNfaWQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5zZXRBdmFpbGFibGVMYW5lcyA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChzZWxmLnBhdHJvbHMsIGZ1bmN0aW9uKHBhdHJvbCwga2V5KXtcbiAgICAgICAgICAgIHBhdHJvbC5hdmFpbGFibGVfbGFuZXMgPSBbXTtcbiAgICAgICAgICAgIGZvcih2YXIgaT0xO2k8cGF0cm9sLnBhdHJvbF9zaXplKzE7aSsrKSB7XG4gICAgICAgICAgICAgICAgcGF0cm9sLmF2YWlsYWJsZV9sYW5lcy5wdXNoKGkpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHBhdHJvbC5zaWdudXBzLCBmdW5jdGlvbihzaWdudXAsIGluZGV4KXtcbiAgICAgICAgICAgICAgICB2YXIgbGFuZSA9IHBhdHJvbC5hdmFpbGFibGVfbGFuZXMuaW5kZXhPZihzaWdudXAubGFuZSk7XG4gICAgICAgICAgICAgICAgaWYobGFuZSAhPSAtMSl7XG4gICAgICAgICAgICAgICAgICAgIHBhdHJvbC5hdmFpbGFibGVfbGFuZXMuc3BsaWNlKGxhbmUsIDEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KTtcbiAgICB9O1xuICAgIHNlbGYuZmlsdGVyU3RhcnRBZnRlciA9IGZ1bmN0aW9uKGlucHV0LCBmaWx0ZXIpe1xuICAgICAgICBpZighZmlsdGVyKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIChpbnB1dCA+PSBmaWx0ZXIpO1xuICAgIH07XG4gICAgc2VsZi5maWx0ZXJTdGFydEJlZm9yZSA9IGZ1bmN0aW9uKGlucHV0LCBmaWx0ZXIpe1xuICAgICAgICBpZighZmlsdGVyKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgcmV0dXJuIChpbnB1dCA8PSBmaWx0ZXIpO1xuICAgIH07XG4gICAgc2VsZi5maWx0ZXJQb3NzaWJsZUNvbGxpc2lvbiA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIGlmKHNlbGYuZmlsdGVyLnBvc3NpYmxlX2NvbGxpc2lvbiA9PSAneWVzJyl7XG4gICAgICAgICAgICByZXR1cm4gKHNpZ251cC5jb2xsaWRpbmdfc2lnbnVwcy5sZW5ndGggfHwgc2lnbnVwLnBvc3NpYmxlX2ZpbmFscy5sZW5ndGgpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICB9ZWxzZSBpZiAoc2VsZi5maWx0ZXIucG9zc2libGVfY29sbGlzaW9uID09ICdubycpe1xuICAgICAgICAgICAgcmV0dXJuICghc2lnbnVwLmNvbGxpZGluZ19zaWdudXBzLmxlbmd0aCAmJiAhc2lnbnVwLnBvc3NpYmxlX2ZpbmFscy5sZW5ndGgpID8gdHJ1ZSA6IGZhbHNlO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIHNlbGYuZG93bmxvYWRQYXRyb2xzTGlzdCA9IGZ1bmN0aW9uKGNvbXBldGl0aW9uKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBjb25zb2xlLmxvZyhjb21wZXRpdGlvbik7XG4gICAgICAgIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnkuZG93bmxvYWRQYXRyb2xzTGlzdChjb21wZXRpdGlvbi5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuICAgICAgICAgICAgICAgIGlmKGZpbGUuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsIGNvbXBldGl0aW9uLmRhdGUrJyAnK2NvbXBldGl0aW9uLm5hbWUgKyAnICcgKyBjb21wZXRpdGlvbi50cmFuc2xhdGlvbnMucGF0cm9sc19saXN0X3Npbmd1bGFyICsgJy5wZGYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5nZXRQYXRyb2xzKCk7XG59KVxuXG4uY29udHJvbGxlcignUGF0cm9sRWRpdE1vZGFsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHVpYk1vZGFsSW5zdGFuY2UsIHBhdHJvbCwgY29tcGV0aXRpb24sIENvbXBldGl0aW9uc0FkbWluUGF0cm9sc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmNvbXBldGl0aW9uID0gY29tcGV0aXRpb247XG5cbiAgICBzZWxmLm9wdGlvbnMgPSB7XG4gICAgICAgIHNob3dXZWVrczogdHJ1ZSxcbiAgICAgICAgc3RhcnRpbmdEYXk6IDEsXG4gICAgICAgIG1heERhdGU6IG5ldyBEYXRlKClcbiAgICB9O1xuXG4gICAgdmFyIHN0YXJ0X3RpbWUgPSBtb21lbnQocGF0cm9sLnN0YXJ0X3RpbWUpO1xuICAgIHZhciBlbmRfdGltZSA9IG1vbWVudChwYXRyb2wuZW5kX3RpbWUpO1xuICAgIHZhciBsZW5ndGhfdGltZSA9IGVuZF90aW1lLmRpZmYoc3RhcnRfdGltZSwgJ2hvdXJzJyk7XG5cbiAgICBzZWxmLnBhdHJvbCA9IHtcbiAgICAgICAgc3RhcnRfdGltZTogc3RhcnRfdGltZSxcbiAgICAgICAgZW5kX3RpbWU6IGVuZF90aW1lLFxuICAgICAgICBsZW5ndGhfdGltZTogbGVuZ3RoX3RpbWUsXG4gICAgICAgIGlkOiBwYXRyb2wuaWQsXG4gICAgICAgIHBhdHJvbF9zaXplOiBwYXRyb2wucGF0cm9sX3NpemUsXG4gICAgICAgIGNvbXBldGl0aW9uc19pZDogcGF0cm9sLmNvbXBldGl0aW9uc19pZCxcbiAgICB9O1xuXG4gICAgc2VsZi51cGRhdGVQYXRyb2wgPSBmdW5jdGlvbiAocGF0cm9sKSB7XG4gICAgICAgIGlmKCFzZWxmLmxvYWRpbmdTdGF0ZSl7XG4gICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgICAgICBDb21wZXRpdGlvbnNBZG1pblBhdHJvbHNGYWN0b3J5LnNhdmVQYXRyb2woJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZCwgcGF0cm9sKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuY2xvc2UocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmNoYW5nZVRpbWUgPSBmdW5jdGlvbihkYXRlKSB7XG5cbiAgICAgICAgaWYoc2VsZi5wYXRyb2wuZW5kX3RpbWUgPCBzZWxmLnBhdHJvbC5zdGFydF90aW1lKXtcbiAgICAgICAgICAgIHNlbGYucGF0cm9sLmVuZF90aW1lID0gbW9tZW50KHNlbGYucGF0cm9sLnN0YXJ0X3RpbWUpLmFkZCgxLCAnZGF5JykuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tJyk7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGRhdGUgPT0gJ3N0YXJ0Jykge1xuICAgICAgICAgICAgc2VsZi5wYXRyb2wuZW5kX3RpbWUgPSBtb21lbnQoc2VsZi5wYXRyb2wuc3RhcnRfdGltZSkuYWRkKHNlbGYucGF0cm9sLmxlbmd0aF90aW1lLCAnaG91cnMnKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6bW0nKTtcbiAgICAgICAgfSBlbHNlIGlmIChkYXRlID09ICdlbmQnKSB7XG4gICAgICAgICAgICB2YXIgc3RhcnQgPSBtb21lbnQoc2VsZi5wYXRyb2wuc3RhcnRfdGltZSk7XG4gICAgICAgICAgICB2YXIgZW5kID0gbW9tZW50KHNlbGYucGF0cm9sLmVuZF90aW1lKTtcbiAgICAgICAgICAgIHZhciBkaWZmID0gZW5kLmRpZmYoc3RhcnQsICdob3VycycsIHRydWUpO1xuICAgICAgICAgICAgc2VsZi5wYXRyb2wubGVuZ3RoX3RpbWUgPSBkaWZmO1xuICAgICAgICB9IGVsc2UgaWYgKGRhdGUgPT0gJ2xlbmd0aCcpIHtcbiAgICAgICAgICAgIHNlbGYucGF0cm9sLmVuZF90aW1lID0gbW9tZW50KHNlbGYucGF0cm9sLnN0YXJ0X3RpbWUpLmFkZChzZWxmLnBhdHJvbC5sZW5ndGhfdGltZSwgJ2hvdXJzJykuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tJyk7XG4gICAgICAgIH1cblxuICAgIH07XG5cbiAgICBzZWxmLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgfTtcbn0pXG4uZmFjdG9yeSgnQ29tcGV0aXRpb25zQWRtaW5QYXRyb2xzRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZ2V0UGF0cm9sczogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvYWRtaW4vcGF0cm9scycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBzYXZlUGF0cm9sOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHBhdHJvbCkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBhbmd1bGFyLmNvcHkocGF0cm9sKTtcbiAgICAgICAgICAgIGRhdGEuc3RhcnRfdGltZSA9IG1vbWVudChwYXRyb2wuc3RhcnRfdGltZSkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tOjAwJyk7XG4gICAgICAgICAgICBkYXRhLmVuZF90aW1lID0gbW9tZW50KHBhdHJvbC5lbmRfdGltZSkuZm9ybWF0KCdZWVlZLU1NLUREIEhIOm1tOjAwJyk7XG4gICAgICAgICAgICBkYXRhLmxlbmd0aF90aW1lID0gMDtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOidQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL2FkbWluL3BhdHJvbHMvJytwYXRyb2wuaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShkYXRhKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdlbmVyYXRlUGF0cm9sczogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL2FkbWluL3BhdHJvbHMvZ2VuZXJhdGUnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlUGF0cm9sOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvYWRtaW4vcGF0cm9scycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBkZWxldGVQYXRyb2w6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgcGF0cm9sc19pZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL2FkbWluL3BhdHJvbHMvJytwYXRyb2xzX2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlQWxsUGF0cm9sczogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvYWRtaW4vcGF0cm9scy9hbGwnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZW1wdHlQYXRyb2w6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgcGF0cm9sc19pZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy9hZG1pbi9wYXRyb2xzLycrcGF0cm9sc19pZCsnL2VtcHR5JyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIHVwZGF0ZVNpZ251cExhbmU6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgc2lnbnVwKXtcbiAgICAgICAgICAgIGRhdGEgPSB7XG4gICAgICAgICAgICAgICAgbGFuZTogc2lnbnVwLm5ld19sYW5lXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6J1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvYWRtaW4vc2lnbnVwcy8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYXNzb2NpYXRlU2lnbnVwV2l0aFBhdHJvbDogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkLCBwYXRyb2xzX2lkLCBzaWdudXBzX2lkLCBsYW5lKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL2FkbWluL3BhdHJvbHMvc2lnbnVwcycsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh7cGF0cm9sc19pZDogcGF0cm9sc19pZCwgc2lnbnVwc19pZDogc2lnbnVwc19pZCwgbGFuZTpsYW5lfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBkaXNzb2NpYXRlU2lnbnVwV2l0aFBhdHJvbDogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkLCBwYXRyb2xzX2lkLCBzaWdudXBzX2lkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0RFTEVURScsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvYWRtaW4vcGF0cm9scy9zaWdudXBzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHtwYXRyb2xzX2lkOiBwYXRyb2xzX2lkLCBzaWdudXBzX2lkOiBzaWdudXBzX2lkfSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBkb3dubG9hZFBhdHJvbHNMaXN0OiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHBhdHJvbHNfb3V0cHV0KXtcbiAgICAgICAgICAgIHZhciBkYXRhID0gKHBhdHJvbHNfb3V0cHV0KSA/IHBhdHJvbHNfb3V0cHV0IDoge307XG4gICAgICAgICAgICBpZihjb21wZXRpdGlvbnNfaWQpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy9hZG1pbi9wYXRyb2xzL2V4cG9ydCcsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ2FycmF5YnVmZmVyJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oZGF0YSlcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbXBldGl0aW9ucy5hZG1pbi5zaWdudXBzJywgW10pXG5cbi5jb250cm9sbGVyKFwiQ29tcGV0aXRpb25zQWRtaW5TaWdudXBzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdWliTW9kYWwsIENvbXBldGl0aW9uc0FkbWluU2lnbnVwc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICB2YXIgYXJncyA9IHtcbiAgICAgICAgICAgIGN1cnJlbnRfcGFnZTogJHN0YXRlUGFyYW1zLmN1cnJlbnRfcGFnZSxcbiAgICAgICAgICAgIHBlcl9wYWdlOiAkc3RhdGVQYXJhbXMucGVyX3BhZ2UsXG4gICAgICAgICAgICBzZWFyY2g6ICRzdGF0ZVBhcmFtcy5zZWFyY2hcbiAgICAgICAgfTtcbiAgICAgICAgQ29tcGV0aXRpb25zQWRtaW5TaWdudXBzRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5jb21wZXRpdGlvbnNfaWQsIGFyZ3MpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzID0gcmVzcG9uc2Uuc2lnbnVwcztcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYudXBkYXRlUGFnZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIHZhciBhcmdzID0ge1xuICAgICAgICAgICAgY29tcGV0aXRpb25zX2lkOiAkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkLFxuICAgICAgICAgICAgc2VhcmNoOiBzZWxmLnNpZ251cHMuc2VhcmNoLFxuICAgICAgICAgICAgY3VycmVudF9wYWdlOiBzZWxmLnNpZ251cHMuY3VycmVudF9wYWdlLFxuICAgICAgICAgICAgcGVyX3BhZ2U6IHNlbGYuc2lnbnVwcy5wZXJfcGFnZSxcbiAgICAgICAgfTtcbiAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbnMuYWRtaW4uc2lnbnVwcycsIGFyZ3MsIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5sb2FkKCk7XG59KVxuLmZhY3RvcnkoJ0NvbXBldGl0aW9uc0FkbWluU2lnbnVwc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpIHtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChjb21wZXRpdGlvbnNfaWQsIGFyZ3MpIHtcblxuICAgICAgICAgICAgdmFyIHVybCA9IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy9hZG1pbi9zaWdudXBzJztcbiAgICAgICAgICAgIGN1cnJlbnRfcGFnZSA9IChhcmdzLmN1cnJlbnRfcGFnZSkgPyBhcmdzLmN1cnJlbnRfcGFnZSA6IDE7XG5cbiAgICAgICAgICAgIHVybCArPSAnP3BhZ2U9JyArIGN1cnJlbnRfcGFnZTtcbiAgICAgICAgICAgIGlmIChhcmdzLnNlYXJjaCkgdXJsICs9ICcmc2VhcmNoPScgKyBhcmdzLnNlYXJjaDtcbiAgICAgICAgICAgIGlmIChhcmdzLnBlcl9wYWdlKSB1cmwgKz0gJyZwZXJfcGFnZT0nICsgYXJncy5wZXJfcGFnZTtcbiAgICAgICAgICAgIGlmIChhcmdzLnNwZWNpYWx3aXNoZXMpIHVybCArPSAnJnN0YXR1cz0nICsgYXJncy5zcGVjaWFsd2lzaGVzO1xuXG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiB1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9ICAgIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmNvbXBldGl0aW9ucy5hZG1pbi5zdGF0aW9ucycsIFtdKVxuXG4uY29udHJvbGxlcihcIkNvbXBldGl0aW9uc0FkbWluU3RhdGlvbnNDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR1aWJNb2RhbCwgQ29tcGV0aXRpb25zQWRtaW5TdGF0aW9uc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmdldFN0YXRpb25zID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDb21wZXRpdGlvbnNBZG1pblN0YXRpb25zRmFjdG9yeS5nZXRTdGF0aW9ucygkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc3RhdGlvbnMgPSByZXNwb25zZS5zdGF0aW9ucztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9ucy5hZG1pbicsIHtjb21wZXRpdGlvbnNfaWQ6ICRzdGF0ZVBhcmFtcy5jb21wZXRpdGlvbnNfaWR9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcbiAgICBcbiAgICBzZWxmLmdldFN0YXRpb25zKCk7XG5cbiAgICBzZWxmLm9wZW5TdGF0aW9uRWRpdE1vZGFsID0gZnVuY3Rpb24oc3RhdGlvbiwgY29tcGV0aXRpb24pe1xuXG4gICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdTdGF0aW9uRWRpdE1vZGFsLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ1N0YXRpb25FZGl0TW9kYWxDb250cm9sbGVyIGFzIG1vZGFsY29udHJvbGxlcicsXG4gICAgICAgICAgICBzaXplOiAnbGcnLFxuICAgICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgICAgIHN0YXRpb246IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRpb247XG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBjb21wZXRpdGlvbjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wZXRpdGlvbjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZGFsSW5zdGFuY2UucmVzdWx0LnRoZW4oZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICBzZWxmLnN0YXRpb25zID0gcmVzcG9uc2Uuc3RhdGlvbnM7XG4gICAgICAgIH0pO1xuXG4gICAgICAgIG1vZGFsSW5zdGFuY2UuZGlzbWlzcyhmdW5jdGlvbigpe1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ3N0w6RuZycpO1xuICAgICAgICAgICAgc2VsZi5nZXRTdGF0aW9ucygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5jcmVhdGVTdGF0aW9uID0gZnVuY3Rpb24oKXtcbiAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDb21wZXRpdGlvbnNBZG1pblN0YXRpb25zRmFjdG9yeS5jcmVhdGVTdGF0aW9uKCRzdGF0ZVBhcmFtcy5jb21wZXRpdGlvbnNfaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5zdGF0aW9ucyA9IHJlc3BvbnNlLnN0YXRpb25zO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb25zLmFkbWluLnN0YXRpb25zJywge2NvbXBldGl0aW9uc19pZDogJHN0YXRlUGFyYW1zLmNvbXBldGl0aW9uc19pZH0sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVTdGF0aW9uID0gZnVuY3Rpb24oc3RhdGlvbil7XG4gICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ29tcGV0aXRpb25zQWRtaW5TdGF0aW9uc0ZhY3RvcnkuZGVsZXRlU3RhdGlvbigkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkLCBzdGF0aW9uLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc3RhdGlvbnMgPSByZXNwb25zZS5zdGF0aW9ucztcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9ucy5hZG1pbi5zdGF0aW9ucycsIHtjb21wZXRpdGlvbnNfaWQ6ICRzdGF0ZVBhcmFtcy5jb21wZXRpdGlvbnNfaWR9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxufSlcbi5jb250cm9sbGVyKCdTdGF0aW9uRWRpdE1vZGFsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHVpYk1vZGFsSW5zdGFuY2UsIHN0YXRpb24sIGNvbXBldGl0aW9uLCBDb21wZXRpdGlvbnNBZG1pblN0YXRpb25zRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHNlbGYuY29tcGV0aXRpb24gPSBjb21wZXRpdGlvbjtcblxuICAgIHNlbGYuc3RhdGlvbiA9IGFuZ3VsYXIuY29weShzdGF0aW9uKTtcblxuICAgIHNlbGYudXBkYXRlU3RhdGlvbiA9IGZ1bmN0aW9uIChzdGF0aW9uKSB7XG4gICAgICAgIGlmKCFzZWxmLmxvYWRpbmdTdGF0ZSl7XG4gICAgICAgICAgICBzZWxmLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgICAgICBDb21wZXRpdGlvbnNBZG1pblN0YXRpb25zRmFjdG9yeS5zYXZlU3RhdGlvbigkc3RhdGVQYXJhbXMuY29tcGV0aXRpb25zX2lkLCBzdGF0aW9uKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZShyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWwgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICR1aWJNb2RhbEluc3RhbmNlLmRpc21pc3MoJ2NhbmNlbCcpO1xuICAgIH07XG59KVxuICAgIFxuLmZhY3RvcnkoJ0NvbXBldGl0aW9uc0FkbWluU3RhdGlvbnNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG5cbiAgICByZXR1cm4ge1xuICAgICAgICBnZXRTdGF0aW9uczogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvYWRtaW4vc3RhdGlvbnMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgc2F2ZVN0YXRpb246IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgc3RhdGlvbikge1xuICAgICAgICAgICAgZGF0YSA9IGFuZ3VsYXIuY29weShzdGF0aW9uKTtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOidQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL2FkbWluL3N0YXRpb25zLycrc3RhdGlvbi5pZCxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgY3JlYXRlU3RhdGlvbjogZnVuY3Rpb24oY29tcGV0aXRpb25zX2lkKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL2FkbWluL3N0YXRpb25zJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGRlbGV0ZVN0YXRpb246IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgc3RhdGlvbnNfaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy9hZG1pbi9zdGF0aW9ucy8nK3N0YXRpb25zX2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZGVsZXRlQWxsU3RhdGlvbnM6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL2FkbWluL3N0YXRpb25zL2FsbCcsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuY29tcGV0aXRpb25zJywgW10pXG5cbi5jb250cm9sbGVyKFwiQ29tcGV0aXRpb25zQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBDb21wZXRpdGlvbnNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiB1cGRhdGVQYWdlKHBhZ2UpIHtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBDb21wZXRpdGlvbnNGYWN0b3J5LmxvYWQocGFnZSlcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmNvbXBldGl0aW9ucyA9IHJlc3BvbnNlLmNvbXBldGl0aW9ucztcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuICAgIGZ1bmN0aW9uIHNvcnRMaXN0KCkge31cblxuICAgIHRoaXMucGFnZSA9IHBhcnNlSW50KCRzdGF0ZVBhcmFtcy5wYWdlLCAxMCk7XG4gICAgdGhpcy5zb3J0ID0gJHN0YXRlUGFyYW1zLnNvcnQ7XG4gICAgdGhpcy5zb3J0T3B0aW9ucyA9IFsndXB2b3RlcycsICdkYXRlJywgJ2F1dGhvciddO1xuICAgIHNvcnRMaXN0KCk7XG4gICAgdXBkYXRlUGFnZSgpO1xuXG5cbiAgICB0aGlzLm5leHRQYWdlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHNlbGYucGFnZSsrO1xuICAgICAgICB1cGRhdGVQYWdlKHNlbGYucGFnZSk7XG4gICAgICAgICRzdGF0ZS5nbygnLicsIHtwYWdlOiBzZWxmLnBhZ2V9LCB7bm90aWZ5OiBmYWxzZX0pO1xuICAgIH07XG4gICAgdGhpcy5wcmV2UGFnZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoc2VsZi5wYWdlID4gMCkge1xuICAgICAgICAgICAgc2VsZi5wYWdlLS07XG4gICAgICAgICAgICB1cGRhdGVQYWdlKHNlbGYucGFnZSk7XG4gICAgICAgICAgICAkc3RhdGUuZ28oJy4nLCB7cGFnZTogc2VsZi5wYWdlfSwge25vdGlmeTogZmFsc2V9KTtcbiAgICAgICAgfVxuICAgIH07XG4gICAgdGhpcy5zb3J0Q2hhbmdlZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBzb3J0TGlzdCgpO1xuICAgICAgICAkc3RhdGUuZ28oJy4nLCB7c29ydDogc2VsZi5zb3J0fSwge25vdGlmeTogZmFsc2V9KTtcbiAgICB9O1xufSlcbi5jb250cm9sbGVyKFwiQ29tcGV0aXRpb25Db250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR0aW1lb3V0LCBDb21wZXRpdGlvbnNGYWN0b3J5LCBTaWdudXBzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gZmluZCgpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIENvbXBldGl0aW9uc0ZhY3RvcnkuZmluZCgkc3RhdGVQYXJhbXMuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbnMgPSByZXNwb25zZS5jb21wZXRpdGlvbnM7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VyID0gSlNPTi5wYXJzZShsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb25zJywge30sIHtsb2NhdGlvbjoncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi5jcmVhdGVTaWdudXAgPSBmdW5jdGlvbih3ZWFwb25jbGFzc2VzX2lkKXtcbiAgICAgICAgaWYoc2VsZi5sb2FkaW5nU3RhdGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICB2YXIgc2lnbnVwID0ge1xuICAgICAgICAgICAgJ2NvbXBldGl0aW9uc19pZCc6IHNlbGYuY29tcGV0aXRpb25zLmlkLFxuICAgICAgICAgICAgJ3dlYXBvbmNsYXNzZXNfaWQnOiB3ZWFwb25jbGFzc2VzX2lkLFxuICAgICAgICAgICAgJ3VzZXJzX2lkJzogc2VsZi51c2VyLnVzZXJfaWRcbiAgICAgICAgfTtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkuY3JlYXRlU2lnbnVwKHNpZ251cClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICByZXNwb25zZS53ZWFwb25jbGFzc2VzX2lkID0gcGFyc2VJbnQocmVzcG9uc2Uud2VhcG9uY2xhc3Nlc19pZCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbnMudXNlcnNpZ251cHMucHVzaChyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVTaWdudXAgPSBmdW5jdGlvbihzaWdudXApe1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5kZWxldGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXG4gICAgICAgICAgICAgICAgLy8gUmVtb3ZlIHRoZSBzaGlmdCBmcm9tIHRoZSBjYWxlbmRhci5cbiAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goc2VsZi5jb21wZXRpdGlvbnMudXNlcnNpZ251cHMsIGZ1bmN0aW9uKHNpZ251cHMsIGluZGV4KXtcbiAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwcy5pZCA9PSBzaWdudXAuaWQpXG4gICAgICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb25zLnVzZXJzaWdudXBzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBmaW5kKCk7XG59KVxuXG4uZmFjdG9yeSgnQ29tcGV0aXRpb25zRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZDogZnVuY3Rpb24gKHBhZ2UsIGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucyc7XG5cbiAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG4gICAgICAgICAgICBpZiAocGFnZSkgdXJsICs9ICc/cGFnZT0nICsgcGFnZTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pOyIsImFuZ3VsYXIubW9kdWxlKCdhcHAuZGFzaGJvYXJkJywgW10pXG5cbiAgICAuY29udHJvbGxlcihcIkRhc2hib2FyZENvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkdGltZW91dCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgJHNjb3BlLiRvbignJHZpZXdDb250ZW50TG9hZGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkdGltZW91dChmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgIChmdW5jdGlvbihkLCBzLCBpZCkge1xuICAgICAgICAgICAgICAgICAgICBGQiA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIHZhciBqcywgZmpzID0gZC5nZXRFbGVtZW50c0J5VGFnTmFtZShzKVswXTtcbiAgICAgICAgICAgICAgICAgICAgLy9pZiAoZC5nZXRFbGVtZW50QnlJZChpZCkpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAganMgPSBkLmNyZWF0ZUVsZW1lbnQocyk7IGpzLmlkID0gaWQ7XG4gICAgICAgICAgICAgICAgICAgIGpzLnNyYyA9IFwiLy9jb25uZWN0LmZhY2Vib29rLm5ldC9zdl9TRS9zZGsuanMjeGZibWw9MSZ2ZXJzaW9uPXYyLjYmYXBwSWQ9OTU2ODY3NTI0Mzk4MjIyXCI7XG4gICAgICAgICAgICAgICAgICAgIGZqcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShqcywgZmpzKTtcbiAgICAgICAgICAgICAgICB9KGRvY3VtZW50LCAnc2NyaXB0JywgJ2ZhY2Vib29rLWpzc2RrJykpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9LCA1MDApO1xuICAgICAgICB9KTtcblxuICAgIH0pO1xuXG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmVycm9yaGFuZGxlcicsIFtdKVxuXG5cdC5jb250cm9sbGVyKFwiRXJyb3JIYW5kbGVyQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsIEVycm9ySGFuZGxlckZhY3Rvcnkpe1xuXG5cdH0pXG5cblx0LmZhY3RvcnkoJ0Vycm9ySGFuZGxlckZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuXG5cdFx0cmV0dXJuIHtcblxuXHRcdFx0cmVwb3J0RXJyb3I6IGZ1bmN0aW9uKGVycm9yLCBjYXVzZSkge1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAoe1xuXHRcdFx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0XHRcdHVybDogQXBpRW5kcG9pbnRVcmwrJ2Vycm9yL3JlcG9ydCcsXG5cdFx0XHRcdFx0aGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG5cdFx0XHRcdFx0ZGF0YTogJC5wYXJhbSh7ZXJyb3I6IGVycm9yLCBjYXVzZTogY2F1c2V9KVxuXHRcdFx0XHR9KTtcblx0XHRcdH1cblxuXHRcdH07XG5cblx0fSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLmludm9pY2VzJywgW10pXG5cbi5jb250cm9sbGVyKFwiR2VuZXJhdGVJbnZvaWNlc0NvbnRyb2xsZXJcIiwgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsIEludm9pY2VzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRJbnZvaWNlcygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEludm9pY2VzRmFjdG9yeS5sb2FkUGVuZGluZ1NpZ251cHMoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi5oaWRlU2lnbnVwcyA9IHRydWU7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLmNyZWF0ZUludm9pY2UgPSBmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEludm9pY2VzRmFjdG9yeS5jcmVhdGVJbnZvaWNlcygpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnc3VjY2VzcycpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnaW52b2ljZXMuaW5kZXgnKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBsb2FkSW52b2ljZXMoKTtcbn0pXG4uY29udHJvbGxlcihcIkludm9pY2VzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgSW52b2ljZXNGYWN0b3J5LCAkdWliTW9kYWwsIEZpbGVTYXZlciwgQmxvYikge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGxvYWRJbnZvaWNlcygpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIEludm9pY2VzRmFjdG9yeS5sb2FkKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmludm9pY2VzX2luY29taW5nID0gcmVzcG9uc2UuaW52b2ljZXNfaW5jb21pbmc7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlc19vdXRnb2luZyA9IHJlc3BvbnNlLmludm9pY2VzX291dGdvaW5nO1xuICAgICAgICAgICAgICAgIHNlbGYuaW52b2ljZXNfZ2VuZXJhdGUgPSByZXNwb25zZS5pbnZvaWNlc19nZW5lcmF0ZTtcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYub3BlblBheW1lbnRNb2RhbCA9IGZ1bmN0aW9uKGludm9pY2Upe1xuXG4gICAgICAgIHZhciBtb2RhbEluc3RhbmNlID0gJHVpYk1vZGFsLm9wZW4oe1xuICAgICAgICAgICAgYW5pbWF0aW9uOiB0cnVlLFxuICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICdJbnZvaWNlUGF5bWVudE1vZGFsLmh0bWwnLFxuICAgICAgICAgICAgY29udHJvbGxlcjogJ0ludm9pY2VQYXltZW50TW9kYWxDb250cm9sbGVyIGFzIG1vZGFsY29udHJvbGxlcicsXG4gICAgICAgICAgICBzaXplOiAnbWQnLFxuICAgICAgICAgICAgcmVzb2x2ZToge1xuICAgICAgICAgICAgICAgIGludm9pY2U6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGludm9pY2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICBtb2RhbEluc3RhbmNlLnJlc3VsdC50aGVuKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxvYWRJbnZvaWNlcygpO1xuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kb3dubG9hZCA9IGZ1bmN0aW9uKGludm9pY2Upe1xuICAgICAgICBJbnZvaWNlc0ZhY3RvcnkuZG93bmxvYWQoaW52b2ljZS5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IG5ldyBCbG9iKFtyZXNwb25zZV0sIHt0eXBlOiAnYXBwbGljYXRpb24vcGRmJ30pO1xuICAgICAgICAgICAgICAgIGlmKGZpbGUuc2l6ZSkge1xuICAgICAgICAgICAgICAgICAgICBGaWxlU2F2ZXIuc2F2ZUFzKGZpbGUsICdpbnZvaWNlLScgKyBpbnZvaWNlLmludm9pY2VfcmVmZXJlbmNlICsgJy5wZGYnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgbG9hZEludm9pY2VzKCk7XG59KVxuLmNvbnRyb2xsZXIoXCJJbnZvaWNlQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgSW52b2ljZXNGYWN0b3J5LCBGaWxlU2F2ZXIsIEJsb2IpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgZnVuY3Rpb24gbG9hZEludm9pY2VzKCl7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgSW52b2ljZXNGYWN0b3J5LmxvYWQoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIGlmKCFyZXNwb25zZS5pbnZvaWNlKSAkc3RhdGUuZ28oJ2ludm9pY2VzLmluZGV4Jyk7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlID0gcmVzcG9uc2UuaW52b2ljZTtcbiAgICAgICAgICAgICAgICBzZWxmLmhpZGVTaWdudXBzID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuZG93bmxvYWQgPSBmdW5jdGlvbihpbnZvaWNlKXtcbiAgICAgICAgSW52b2ljZXNGYWN0b3J5LmRvd25sb2FkKGludm9pY2UuaWQpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBuZXcgQmxvYihbcmVzcG9uc2VdLCB7dHlwZTogJ2FwcGxpY2F0aW9uL3BkZid9KTtcbiAgICAgICAgICAgICAgICBpZihmaWxlLnNpemUpIHtcbiAgICAgICAgICAgICAgICAgICAgRmlsZVNhdmVyLnNhdmVBcyhmaWxlLCAnaW52b2ljZS0nICsgaW52b2ljZS5pbnZvaWNlX3JlZmVyZW5jZSArICcucGRmJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxvYWRJbnZvaWNlcygpO1xufSlcbi5jb250cm9sbGVyKCdJbnZvaWNlUGF5bWVudE1vZGFsQ29udHJvbGxlcicsIGZ1bmN0aW9uICgkc2NvcGUsICR1aWJNb2RhbEluc3RhbmNlLCBpbnZvaWNlLCBJbnZvaWNlc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgXG4gICAgc2VsZi5vcHRpb25zID0ge1xuICAgICAgICBzaG93V2Vla3M6IHRydWUsXG4gICAgICAgIHN0YXJ0aW5nRGF5OiAxLFxuICAgICAgICBtYXhEYXRlOiBuZXcgRGF0ZSgpLFxuICAgICAgICBtaW5EYXRlOiBtb21lbnQoaW52b2ljZS5pbnZvaWNlX2RhdGUpLnN0YXJ0T2YoJ2RheScpXG4gICAgfTtcbiAgICBzZWxmLmludm9pY2UgPSBhbmd1bGFyLmNvcHkoaW52b2ljZSk7XG5cbiAgICBzZWxmLnJlZ2lzdGVyUGF5bWVudCA9IGZ1bmN0aW9uIChpbnZvaWNlKSB7XG4gICAgICAgIGlmKGludm9pY2UucGFpZF9hdCAmJiAhc2VsZi5sb2FkaW5nU3RhdGUpe1xuICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICAgICAgSW52b2ljZXNGYWN0b3J5LnJlZ2lzdGVyUGF5bWVudChpbnZvaWNlLmlkLCBpbnZvaWNlLnBhaWRfYXQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkdWliTW9kYWxJbnN0YW5jZS5jbG9zZSgpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmZpbmFsbHkoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBzZWxmLmNhbmNlbCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJHVpYk1vZGFsSW5zdGFuY2UuZGlzbWlzcygnY2FuY2VsJyk7XG4gICAgfTtcbn0pXG4uZmFjdG9yeSgnSW52b2ljZXNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcblxuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICB2YXIgdXJsID0gKGlkKSA/ICcvJytpZCA6ICcnO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2ludm9pY2VzJyt1cmwsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGxvYWRQZW5kaW5nU2lnbnVwczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnaW52b2ljZXMvcGVuZGluZ3NpZ251cHMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVJbnZvaWNlczogZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnaW52b2ljZXMnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2ludm9pY2VzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIHJlZ2lzdGVyUGF5bWVudDogZnVuY3Rpb24oaWQsIHBhaWRfYXQpe1xuXG4gICAgICAgICAgICBwYWlkX2F0ID0gbW9tZW50KG5ldyBEYXRlKHBhaWRfYXQpKS5mb3JtYXQoJ1lZWVktTU0tREQgSEg6bW06c3MnKTtcblxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2ludm9pY2VzLycraWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh7cGFpZF9hdDogcGFpZF9hdH0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBkb3dubG9hZDogZnVuY3Rpb24oaWQpe1xuICAgICAgICAgICAgaWYoaWQpe1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2ludm9pY2VzLycraWQrJy9kb3dubG9hZCcsXG4gICAgICAgICAgICAgICAgICAgIHJlc3BvbnNlVHlwZTogJ2FycmF5YnVmZmVyJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG59KTtcbiIsImFuZ3VsYXIubW9kdWxlKCdhcHAucHJlbWl1bScsIFtdKVxuLmNvbnRyb2xsZXIoXCJQcmVtaXVtQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgUHJlbWl1bUZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBcbiAgICBzZWxmLmxvYWRQcmVtaXVtID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBQcmVtaXVtRmFjdG9yeS5sb2FkUHJlbWl1bSgpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jbHViID0gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLnJlZ2lzdGVyUHJlbWl1bSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIFByZW1pdW1GYWN0b3J5LnJlZ2lzdGVyUHJlbWl1bSgpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5jbHViID0gcmVzcG9uc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmxvYWRQcmVtaXVtKCk7XG59KVxuLmZhY3RvcnkoJ1ByZW1pdW1GYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbG9hZFByZW1pdW06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsICsgJ3ByZW1pdW0nLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICByZWdpc3RlclByZW1pdW06IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCArICdwcmVtaXVtJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7J0NvbnRlbnQtVHlwZSc6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xufSk7XG4iLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnNldHRpbmdzJywgW10pXG5cbi5jb250cm9sbGVyKFwiU2V0dGluZ3NDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBTZXR0aW5nc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLmNhbmNlbGFjY291bnQgPSBmdW5jdGlvbigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIFNldHRpbmdzRmFjdG9yeS5jYW5jZWxhY2NvdW50KClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdhdXRoLmxvZ291dCcpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5lcnJvcik7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG59KVxuXG4uY29udHJvbGxlcihcIlBhc3N3b3JkQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgU2V0dGluZ3NGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgc2VsZi5yZXNldCA9IHtcbiAgICAgICAgJ2N1cnJlbnRfcGFzc3dvcmQnOicnLFxuICAgICAgICAncGFzc3dvcmQnOiAnJyxcbiAgICAgICAgJ3Bhc3N3b3JkX2NvbmZpcm1hdGlvbic6JydcbiAgICB9O1xuXG4gICAgc2VsZi51cGRhdGVQYXNzd29yZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBTZXR0aW5nc0ZhY3RvcnkudXBkYXRlUGFzc3dvcmQoc2VsZi5yZXNldClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnJlc2V0ID0ge1xuICAgICAgICAgICAgICAgICAgICAnY3VycmVudF9wYXNzd29yZCc6JycsXG4gICAgICAgICAgICAgICAgICAgICdwYXNzd29yZCc6ICcnLFxuICAgICAgICAgICAgICAgICAgICAncGFzc3dvcmRfY29uZmlybWF0aW9uJzonJ1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbn0pXG5cbi5jb250cm9sbGVyKFwiVXNlclByb2ZpbGVDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlLCBTZXR0aW5nc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBsb2FkVXNlcnByb2ZpbGUoKSB7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgU2V0dGluZ3NGYWN0b3J5LmxvYWRVc2VycHJvZmlsZSgpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VycHJvZmlsZSA9IHJlc3BvbnNlLnVzZXI7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH1cblxuICAgIHNlbGYuZGF0ZVBpY2tlck9wdGlvbnMgPSB7c3RhcnRpbmdEYXk6IDEsIHN0YXJ0OiB7b3BlbmVkOiBmYWxzZX0sIGVuZDoge29wZW5lZDogZmFsc2V9fTtcblxuICAgIHNlbGYuc2F2ZVVzZXJwcm9maWxlID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTZXR0aW5nc0ZhY3Rvcnkuc2F2ZVVzZXJwcm9maWxlKHNlbGYudXNlcnByb2ZpbGUpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnNldEl0ZW0oJ3VzZXInLCBKU09OLnN0cmluZ2lmeShyZXNwb25zZS51c2VyKSk7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VycHJvZmlsZSA9IHJlc3BvbnNlLnVzZXI7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NldHRpbmdzLnVzZXInKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWxVc2VycHJvZmlsZSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgIGxvYWRVc2VycHJvZmlsZSgpO1xuICAgICAgICAkc3RhdGUuZ28oJ3NldHRpbmdzLnVzZXInKTtcbiAgICB9O1xuXG4gICAgbG9hZFVzZXJwcm9maWxlKCk7XG5cbn0pXG5cbi5jb250cm9sbGVyKFwiVXNlckNsdWJzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgQ2x1YnNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBzZWxmLnNlYXJjaFF1ZXJ5ID0gJyc7XG4gICAgc2VsZi5uZXdfY2x1YiA9IG51bGw7XG4gICAgc2VsZi5hZGRfY2x1YnNfbnIgPSAnJztcbiAgICBzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcblxuICAgIGZ1bmN0aW9uIGxvYWRVc2VyQ2x1YnMoKSB7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgQ2x1YnNGYWN0b3J5LmxvYWRVc2VyQ2x1YnMoKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc2VsZWN0ZWRDbHVicyA9ICcnO1xuICAgICAgICAgICAgICAgIHNlbGYuY2x1YnMgPSByZXNwb25zZS5jbHVicztcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgc2VsZi5zZWFyY2hGb3JDbHVicyA9IGZ1bmN0aW9uKHNlYXJjaFF1ZXJ5LCBjbHVicylcbiAgICB7XG4gICAgICAgIHJldHVybiBDbHVic0ZhY3RvcnlcbiAgICAgICAgICAgIC5zZWFyY2hGb3JDbHVicyhzZWFyY2hRdWVyeSlcbiAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ3dhcm5pbmcnKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAudGhlbihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5mb3VuZE1hdGNoID0gKHJlc3BvbnNlLmRhdGEuY2x1YnMubGVuZ3RoID4gMCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHJlc3BvbnNlLmRhdGEuY2x1YnMubWFwKGZ1bmN0aW9uKGl0ZW0pe1xuICAgICAgICAgICAgICAgICAgICBpdGVtLmFscmVhZHlTZWxlY3RlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBhbmd1bGFyLmZvckVhY2goY2x1YnMsIGZ1bmN0aW9uKGNsdWIpe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoY2x1Yi5pZCA9PSBpdGVtLmlkKSBpdGVtLmFscmVhZHlTZWxlY3RlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBpdGVtO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHNlbGYuc2VsZWN0Q2x1YiA9IGZ1bmN0aW9uKCRpdGVtKVxuICAgIHtcbiAgICAgICAgaWYoJGl0ZW0uYWxyZWFkeVNlbGVjdGVkID09PSB0cnVlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNlbGYubm9NYXRjaGluZ0NsdWJzID0gbnVsbDtcbiAgICAgICAgc2VsZi5uZXdfY2x1YiA9ICRpdGVtOyBcbiAgICB9O1xuXG4gICAgc2VsZi5ub0NsdWJzRm91bmQgPSBmdW5jdGlvbigpXG4gICAge1xuICAgICAgICBjb25zb2xlLmxvZygxMjM0KTtcbiAgICAgICAgc2VsZi5ub01hdGNoaW5nQ2x1YnMgPSB0cnVlO1xuICAgICAgICBzZWxmLm5ld19jbHViID0gbnVsbDtcbiAgICB9O1xuXG4gICAgc2VsZi5hZGRVc2VyVG9DbHVicyA9IGZ1bmN0aW9uKGNsdWIpXG4gICAge1xuICAgICAgICBDbHVic0ZhY3RvcnkuYWRkVXNlclRvQ2x1YnMoY2x1Yi5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLm5ld19jbHViID0gbnVsbDtcbiAgICAgICAgICAgICAgICBzZWxmLmNoYW5nZUNsdWIgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWJzID0gcmVzcG9uc2UuY2x1YnM7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5hZGROZXdDbHViID0gZnVuY3Rpb24oKVxuICAgIHtcbiAgICAgICAgaWYoIXNlbGYuc2VhcmNoUXVlcnkgfHwgIXNlbGYuYWRkX2NsdWJzX25yKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHZhciBjbHViID0ge1xuICAgICAgICAgICAgbmFtZTogc2VsZi5zZWFyY2hRdWVyeSxcbiAgICAgICAgICAgIGNsdWJzX25yOiBzZWxmLmFkZF9jbHVic19uclxuICAgICAgICB9O1xuXG4gICAgICAgIENsdWJzRmFjdG9yeS5hZGROZXdDbHViKGNsdWIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5zZWFyY2hRdWVyeSA9ICcnO1xuICAgICAgICAgICAgICAgIHNlbGYuYWRkX2NsdWJzX25yID0gJyc7XG4gICAgICAgICAgICAgICAgc2VsZi5uZXdfY2x1YiA9IG51bGw7XG4gICAgICAgICAgICAgICAgc2VsZi5jaGFuZ2VDbHViID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgc2VsZi5jbHVicyA9IHJlc3BvbnNlLmNsdWJzO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIGxvYWRVc2VyQ2x1YnMoKTtcbn0pXG5cbi5jb250cm9sbGVyKFwiSW52aXRlQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZSwgSW52aXRlRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgc2VsZi5sb2FkSW52aXRlcyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBJbnZpdGVGYWN0b3J5LmxvYWRJbnZpdGVzKClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLmludml0ZXMgPSByZXNwb25zZS5pbnZpdGVzO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcbiAgICBzZWxmLmxvYWRJbnZpdGVzKCk7XG5cbiAgICBzZWxmLmludml0ZSA9IGZ1bmN0aW9uKClcbiAgICB7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgSW52aXRlRmFjdG9yeVxuICAgICAgICAgICAgLmludml0ZShzZWxmLnVzZXIpXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi51c2VyID0ge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiAnJyxcbiAgICAgICAgICAgICAgICAgICAgbGFzdG5hbWU6ICcnLFxuICAgICAgICAgICAgICAgICAgICBlbWFpbDogJydcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHNlbGYubG9hZEludml0ZXMoKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcbn0pXG5cbi5mYWN0b3J5KFwiSW52aXRlRmFjdG9yeVwiLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWRJbnZpdGVzOiBmdW5jdGlvbigpe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzL2ludml0ZScsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGludml0ZTogZnVuY3Rpb24odXNlcikge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKyd1c2Vycy9pbnZpdGUnLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0odXNlcilcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSlcblxuLmZhY3RvcnkoXCJTZXR0aW5nc0ZhY3RvcnlcIiwgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKXtcbiAgICByZXR1cm4ge1xuICAgICAgICBsb2FkVXNlcnByb2ZpbGU6IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYXV0aGVudGljYXRlL3VzZXInLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlVXNlcnByb2ZpbGU6IGZ1bmN0aW9uKHVzZXIpe1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBhbmd1bGFyLmNvcHkodXNlcik7XG4gICAgICAgICAgICBkYXRhLmJpcnRoZGF5ID0gZGF0YS5iaXJ0aGRheSsnLTAxLTAxJztcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnUFVUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydhdXRoZW50aWNhdGUvdXNlcicsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShkYXRhKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlUGFzc3dvcmQ6IGZ1bmN0aW9uKGNyZWRlbnRpYWxzKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnYXV0aGVudGljYXRlL3VwZGF0ZVBhc3N3b3JkJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGNyZWRlbnRpYWxzKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2FuY2VsYWNjb3VudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2F1dGhlbnRpY2F0ZS9jYW5jZWxBY2NvdW50JyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cblxuICAgIH07XG59KTsiLCJhbmd1bGFyLm1vZHVsZSgnYXBwLnNpZ251cHMnLCBbXSlcblxuLmNvbnRyb2xsZXIoXCJTaWdudXBzQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBTaWdudXBzRmFjdG9yeSl7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgZnVuY3Rpb24gdXBkYXRlUGFnZShwYWdlKSB7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkubG9hZChwYWdlKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi5pbnZvaWNlc19nZW5lcmF0ZSA9IHJlc3BvbnNlLmludm9pY2VzX2dlbmVyYXRlO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG4gICAgZnVuY3Rpb24gc29ydExpc3QoKSB7fVxuXG4gICAgdGhpcy5wYWdlID0gcGFyc2VJbnQoJHN0YXRlUGFyYW1zLnBhZ2UsIDEwKTtcbiAgICB0aGlzLnNvcnQgPSAkc3RhdGVQYXJhbXMuc29ydDtcbiAgICB0aGlzLnNvcnRPcHRpb25zID0gWyd1cHZvdGVzJywgJ2RhdGUnLCAnYXV0aG9yJ107XG4gICAgc29ydExpc3QoKTtcbiAgICB1cGRhdGVQYWdlKCk7XG59KVxuLmNvbnRyb2xsZXIoXCJTaWdudXBDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzY29wZSwgJHN0YXRlUGFyYW1zLCAkc3RhdGUsICR0aW1lb3V0LCBTaWdudXBzRmFjdG9yeSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIGZ1bmN0aW9uIGZpbmQoKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5maW5kKCRzdGF0ZVBhcmFtcy5pZClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMgPSByZXNwb25zZS5zaWdudXBzO1xuICAgICAgICAgICAgICAgIHNlbGYudXNlciA9IEpTT04ucGFyc2UobG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3VzZXInKSk7XG4gICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24oKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2lnbnVwcycsIHt9LCB7bG9jYXRpb246J3JlcGxhY2UnfSk7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBzZWxmLnVwZGF0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIHNlbGYuc3RhdGUgPSAndXBkYXRpbmcnO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS51cGRhdGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc2lnbnVwcy5wYXJ0aWNpcGF0ZV9vdXRfb2ZfY29tcGV0aXRpb24gPSBwYXJzZUludChyZXNwb25zZS5zaWdudXBzLnBhcnRpY2lwYXRlX291dF9vZl9jb21wZXRpdGlvbik7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uuc2lnbnVwcy53ZWFwb25jbGFzc2VzX2lkID0gcGFyc2VJbnQocmVzcG9uc2Uuc2lnbnVwcy53ZWFwb25jbGFzc2VzX2lkKTtcbiAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHMuc2lnbnVwcyA9IHJlc3BvbnNlLnNpZ251cHM7XG4gICAgICAgICAgICAgICAgc2VsZi5zdGF0ZSA9ICd1cGRhdGVkJztcbiAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NpZ251cCcsICh7aWQ6IHNpZ251cC5pZH0pKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVTaWdudXAgPSBmdW5jdGlvbihzaWdudXApe1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5kZWxldGVTaWdudXAoc2lnbnVwKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnc2lnbnVwcycpO1xuICAgICAgICAgICAgfSk7XG4gICAgfTtcblxuXG5cbiAgICBmaW5kKCk7XG59KVxuLmNvbnRyb2xsZXIoXCJDbHViU2lnbnVwQ29udHJvbGxlclwiLCBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCAkdGltZW91dCwgU2lnbnVwc0ZhY3RvcnkpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBsb2FkQ2x1YlNpZ251cHMoKXtcbiAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBTaWdudXBzRmFjdG9yeS5sb2FkQ2x1YlNpZ251cHMoJHN0YXRlUGFyYW1zLmlkKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb24gPSByZXNwb25zZS5jb21wZXRpdGlvbjtcbiAgICAgICAgICAgICAgICBzZWxmLmNsdWIgPSByZXNwb25zZS5jbHViO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICB9KTtcbiAgICB9XG5cblxuICAgIHNlbGYuY3JlYXRlU2lnbnVwID0gZnVuY3Rpb24odXNlcl9pZCwgd2VhcG9uY2xhc3Nlc19pZCl7XG4gICAgICAgIGlmKHNlbGYubG9hZGluZ1N0YXRlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgdmFyIHNpZ251cCA9IHtcbiAgICAgICAgICAgICdjb21wZXRpdGlvbnNfaWQnOiAkc3RhdGVQYXJhbXMuaWQsXG4gICAgICAgICAgICAnd2VhcG9uY2xhc3Nlc19pZCc6IHdlYXBvbmNsYXNzZXNfaWQsXG4gICAgICAgICAgICAndXNlcnNfaWQnOiB1c2VyX2lkXG4gICAgICAgIH07XG4gICAgICAgIFNpZ251cHNGYWN0b3J5LmNyZWF0ZVNpZ251cChzaWdudXApXG4gICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgcmVzcG9uc2Uud2VhcG9uY2xhc3Nlc19pZCA9IHBhcnNlSW50KHJlc3BvbnNlLndlYXBvbmNsYXNzZXNfaWQpO1xuICAgICAgICAgICAgICAgIHNlbGYuY29tcGV0aXRpb24uc2lnbnVwcy5wdXNoKHJlc3BvbnNlKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmRlbGV0ZVNpZ251cCA9IGZ1bmN0aW9uKHNpZ251cCl7XG4gICAgICAgIGlmKHNlbGYubG9hZGluZ1N0YXRlKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHNlbGYubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgU2lnbnVwc0ZhY3RvcnkuZGVsZXRlU2lnbnVwKHNpZ251cClcbiAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblxuICAgICAgICAgICAgICAgIC8vIFJlbW92ZSB0aGUgc2hpZnQgZnJvbSB0aGUgY2FsZW5kYXIuXG4gICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGYuY29tcGV0aXRpb24uc2lnbnVwcywgZnVuY3Rpb24oc2lnbnVwcywgaW5kZXgpe1xuICAgICAgICAgICAgICAgICAgICBpZihzaWdudXBzLmlkID09IHNpZ251cC5pZClcbiAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5jb21wZXRpdGlvbi5zaWdudXBzLnNwbGljZShpbmRleCwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgIC5maW5hbGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cblxuXG4gICAgbG9hZENsdWJTaWdudXBzKCk7XG59KVxuLmZhY3RvcnkoJ1NpZ251cHNGYWN0b3J5JywgZnVuY3Rpb24oJGh0dHAsIEFwaUVuZHBvaW50VXJsKSB7XG5cbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChwYWdlLCBpZCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBBcGlFbmRwb2ludFVybCsnc2lnbnVwJztcblxuICAgICAgICAgICAgICAgIGlmICghYW5ndWxhci5pc1VuZGVmaW5lZChpZCkgJiYgaWQgPiAwKSB1cmwgKz0gJy8nICsgaWQ7XG4gICAgICAgICAgICAgICAgaWYgKHBhZ2UpIHVybCArPSAnP3BhZ2U9JyArIHBhZ2U7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IHVybCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH0sXG5cbiAgICAgICAgICAgIGZpbmQ6IGZ1bmN0aW9uKGlkKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBBcGlFbmRwb2ludFVybCsnc2lnbnVwLycraWQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBjcmVhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydzaWdudXAnLFxuICAgICAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbShzaWdudXApXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICB1cGRhdGVTaWdudXA6IGZ1bmN0aW9uKHNpZ251cCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BVVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3NpZ251cC8nK3NpZ251cC5pZCxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oc2lnbnVwKVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgZGVsZXRlU2lnbnVwOiBmdW5jdGlvbihzaWdudXApIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgICAgICBtZXRob2Q6ICdERUxFVEUnLFxuICAgICAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydzaWdudXAvJytzaWdudXAuaWQsXG4gICAgICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9LFxuXG4gICAgICAgICAgICBsb2FkQ2x1YlNpZ251cHM6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwgKyAnY29tcGV0aXRpb25zLycgKyBjb21wZXRpdGlvbnNfaWQgKyAnL2NsdWJzaWdudXBzJyxcbiAgICAgICAgICAgICAgICAgICAgaGVhZGVyczogeydDb250ZW50LVR5cGUnOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJ31cbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC50ZWFtcycsIFtdKVxuLmNvbnRyb2xsZXIoJ1RlYW1TaWdudXBDb250cm9sbGVyJywgZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsICRzdGF0ZSwgQ29tcGV0aXRpb25zRmFjdG9yeSwgVGVhbXNGYWN0b3J5KXtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICBmdW5jdGlvbiBsb2FkVGVhbXMoKSB7XG4gICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gdHJ1ZTtcbiAgICAgICAgaWYoJHN0YXRlUGFyYW1zLnRlYW1zX2lkKXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5pZCwgJHN0YXRlUGFyYW1zLnRlYW1zX2lkKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi50ZWFtcyA9IHJlc3BvbnNlLnRlYW1zO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnNpZ251cHNfb3JkaW5hcnlfYXZhaWxhYmxlID0gcmVzcG9uc2Uuc2lnbnVwc19vcmRpbmFyeV9hdmFpbGFibGU7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwc19yZXNlcnZlX2F2YWlsYWJsZSA9IHJlc3BvbnNlLnNpZ251cHNfcmVzZXJ2ZV9hdmFpbGFibGU7XG5cbiAgICAgICAgICAgICAgICAgICAgYW5ndWxhci5mb3JFYWNoKHNlbGYudGVhbXMuc2lnbnVwcywgZnVuY3Rpb24oc2lnbnVwLCBrZXkpe1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYoc2lnbnVwLnBpdm90LnBvc2l0aW9uID09IDEpIHNlbGYudGVhbXMudGVhbXNfc2lnbnVwc19maXJzdCAgPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gMikgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX3NlY29uZCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSAzKSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfdGhpcmQgPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZihzaWdudXAucGl2b3QucG9zaXRpb24gPT0gNCkgc2VsZi50ZWFtcy50ZWFtc19zaWdudXBzX2ZvdXJ0aCA9IHNpZ251cC5pZDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmKHNpZ251cC5waXZvdC5wb3NpdGlvbiA9PSA1KSBzZWxmLnRlYW1zLnRlYW1zX3NpZ251cHNfZmlmdGggPSBzaWdudXAuaWQ7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgICAgIHNlbGYudGVhbXMuc2lnbnVwcyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG5cbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9ZWxzZXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS5sb2FkKCRzdGF0ZVBhcmFtcy5pZCwgJHN0YXRlUGFyYW1zLnRlYW1zX2lkKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5hZGRUZWFtID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZTogJycsXG4gICAgICAgICAgICAgICAgICAgICAgICB3ZWFwb25ncm91cHNfaWQ6ICcnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19maXJzdDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYW1zX3NpZ251cHNfc2Vjb25kOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc190aGlyZDogbnVsbCxcbiAgICAgICAgICAgICAgICAgICAgICAgIHRlYW1zX3NpZ251cHNfZm91cnRoOiBudWxsLFxuICAgICAgICAgICAgICAgICAgICAgICAgdGVhbXNfc2lnbnVwc19maWZ0aDogbnVsbFxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgICAgICBzZWxmLnRlYW1zID0gcmVzcG9uc2UudGVhbXM7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuc2lnbnVwc19vcmRpbmFyeV9hdmFpbGFibGUgPSByZXNwb25zZS5zaWdudXBzX29yZGluYXJ5X2F2YWlsYWJsZTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5zaWdudXBzX3Jlc2VydmVfYXZhaWxhYmxlID0gcmVzcG9uc2Uuc2lnbnVwc19yZXNlcnZlX2F2YWlsYWJsZTtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5lcnJvcihmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9XG5cbiAgICBzZWxmLmNyZWF0ZVRlYW0gPSBmdW5jdGlvbigpe1xuICAgICAgICBpZihzZWxmLmFkZFRlYW0ubmFtZSAmJiBzZWxmLmFkZFRlYW0ud2VhcG9uZ3JvdXBzX2lkKXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS5zdG9yZSgkc3RhdGVQYXJhbXMuaWQsIHNlbGYuYWRkVGVhbSlcbiAgICAgICAgICAgICAgICAuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UubWVzc2FnZSk7XG4gICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMnLCB7aWQ6ICRzdGF0ZVBhcmFtcy5pZH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgaWYocmVzcG9uc2UucmVkaXJlY3RfdG9fZWRpdCl7XG4gICAgICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ2NvbXBldGl0aW9uLnRlYW1zaWdudXBzLmVkaXQnLCB7aWQ6ICRzdGF0ZVBhcmFtcy5pZCwgdGVhbXNfaWQ6IHJlc3BvbnNlLnJlZGlyZWN0X3RvX2VkaXR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcbiAgICBcbiAgICBzZWxmLnVwZGF0ZVRlYW0gPSBmdW5jdGlvbih0ZWFtKXtcbiAgICAgICAgaWYoc2VsZi50ZWFtcy5uYW1lICYmIHNlbGYudGVhbXMud2VhcG9uZ3JvdXBzX2lkKXtcbiAgICAgICAgICAgIFRlYW1zRmFjdG9yeS51cGRhdGUoJHN0YXRlUGFyYW1zLmlkLCBzZWxmLnRlYW1zLmlkLCB0ZWFtKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5yZWRpcmVjdF90b19lZGl0KXtcbiAgICAgICAgICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY29tcGV0aXRpb24udGVhbXNpZ251cHMuZWRpdCcsIHtpZDogJHN0YXRlUGFyYW1zLmlkLCB0ZWFtc19pZDogcmVzcG9uc2UucmVkaXJlY3RfdG9fZWRpdH0sIHtyZWxvYWQ6dHJ1ZX0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9O1xuXG4gICAgc2VsZi5jYW5jZWxUZWFtID0gZnVuY3Rpb24oKXtcbiAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycse2lkOiAkc3RhdGVQYXJhbXMuaWR9LCB7cmVsb2FkOnRydWV9KTtcbiAgICB9O1xuXG4gICAgc2VsZi5kZWxldGVUZWFtID0gZnVuY3Rpb24odGVhbXNfaWQpe1xuICAgICAgICBpZih0ZWFtc19pZCl7XG4gICAgICAgICAgICBUZWFtc0ZhY3RvcnkuZGVsZXRlKCRzdGF0ZVBhcmFtcy5pZCwgdGVhbXNfaWQpXG4gICAgICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICAgICAgJHN0YXRlLmdvKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtpZDogJHN0YXRlUGFyYW1zLmlkfSwge3JlbG9hZDp0cnVlfSk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGxvYWRUZWFtcygpO1xuXG59KVxuLmZhY3RvcnkoJ1RlYW1zRmFjdG9yeScsIGZ1bmN0aW9uKCRodHRwLCBBcGlFbmRwb2ludFVybCkge1xuICAgIHJldHVybiB7XG4gICAgICAgIGxvYWQ6IGZ1bmN0aW9uIChjb21wZXRpdGlvbnNfaWQsIHRlYW1zX2lkKSB7XG4gICAgICAgICAgICBpZihjb21wZXRpdGlvbnNfaWQgJiYgdGVhbXNfaWQpe1xuICAgICAgICAgICAgICAgIHVybCA9IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcy8nK3RlYW1zX2lkO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB1cmwgPSBBcGlFbmRwb2ludFVybCsnY29tcGV0aXRpb25zLycrY29tcGV0aXRpb25zX2lkKycvdGVhbXNpZ251cHMnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogdXJsLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsnQ29udGVudC1UeXBlJzogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCd9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBmaW5kOiBmdW5jdGlvbihpZCkge1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgc3RvcmU6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgdGVhbSl7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKHRlYW0pXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKGNvbXBldGl0aW9uc19pZCwgdGVhbXNfaWQsIHRlYW0pe1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ2NvbXBldGl0aW9ucy8nK2NvbXBldGl0aW9uc19pZCsnL3RlYW1zaWdudXBzLycrdGVhbXNfaWQsXG4gICAgICAgICAgICAgICAgaGVhZGVyczogeyAnQ29udGVudC1UeXBlJyA6ICdhcHBsaWNhdGlvbi94LXd3dy1mb3JtLXVybGVuY29kZWQnIH0sXG4gICAgICAgICAgICAgICAgZGF0YTogJC5wYXJhbSh0ZWFtKVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGVsZXRlOiBmdW5jdGlvbihjb21wZXRpdGlvbnNfaWQsIHRlYW1zX2lkKXtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnREVMRVRFJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKydjb21wZXRpdGlvbnMvJytjb21wZXRpdGlvbnNfaWQrJy90ZWFtc2lnbnVwcy8nK3RlYW1zX2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuXG4gICAgfTtcbn0pO1xuIiwiYW5ndWxhci5tb2R1bGUoJ2FwcC51c2VycycsIFtdKVxuXG4uY29udHJvbGxlcihcIlVzZXJDb250cm9sbGVyXCIsIGZ1bmN0aW9uKCRyb290U2NvcGUsICRzdGF0ZVBhcmFtcywgJHN0YXRlLCBVc2Vyc0ZhY3Rvcnkpe1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICBmdW5jdGlvbiBsb2FkVXNlcigpe1xuICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IHRydWU7XG4gICAgICAgIGlmKCRzdGF0ZVBhcmFtcy51c2VyX2lkKXtcbiAgICAgICAgICAgIFVzZXJzRmFjdG9yeS5maW5kKCRzdGF0ZVBhcmFtcy51c2VyX2lkKVxuICAgICAgICAgICAgICAgIC5zdWNjZXNzKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51c2VyID0gcmVzcG9uc2U7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi51c2VyID0gJyc7XG4gICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUubG9hZGluZ1N0YXRlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH1lbHNle1xuICAgICAgICAgICAgc2VsZi51c2VyID0ge307XG4gICAgICAgICAgICAkcm9vdFNjb3BlLmxvYWRpbmdTdGF0ZSA9IGZhbHNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxvYWRVc2VyKCk7XG5cbiAgICBzZWxmLnNhdmVVc2VyID0gZnVuY3Rpb24odXNlcil7XG4gICAgICAgIFVzZXJzRmFjdG9yeS5zYXZlVXNlcih1c2VyKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2x1Yi51c2Vycy5pbmRleCcsIHt9LCB7bG9jYXRpb246ICdyZWxvYWQnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbiAgICBzZWxmLmNyZWF0ZVVzZXIgPSBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgaWYoc2VsZi5sb2FkaW5nU3RhdGUpIHJldHVybiBmYWxzZTtcbiAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSB0cnVlO1xuICAgICAgICBVc2Vyc0ZhY3RvcnkuY3JlYXRlVXNlcih1c2VyKVxuICAgICAgICAgICAgLnN1Y2Nlc3MoZnVuY3Rpb24ocmVzcG9uc2Upe1xuICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgICRzdGF0ZS5nbygnY2x1Yi51c2Vycy5pbmRleCcsIHt9LCB7bG9jYXRpb246ICdyZWxvYWQnfSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgLmVycm9yKGZ1bmN0aW9uKHJlc3BvbnNlKXtcbiAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLCAnZXJyb3InKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAuZmluYWxseShmdW5jdGlvbihyZXNwb25zZSl7XG4gICAgICAgICAgICAgICAgc2VsZi5sb2FkaW5nU3RhdGUgPSBmYWxzZTtcbiAgICAgICAgICAgIH0pO1xuICAgIH07XG5cbn0pXG5cbi5mYWN0b3J5KCdVc2Vyc0ZhY3RvcnknLCBmdW5jdGlvbigkaHR0cCwgQXBpRW5kcG9pbnRVcmwpe1xuXG4gICAgcmV0dXJuIHtcbiAgICAgICAgZmluZDogZnVuY3Rpb24oaWQpIHtcbiAgICAgICAgICAgIHJldHVybiAkaHR0cCh7XG4gICAgICAgICAgICAgICAgbWV0aG9kOiAnR0VUJyxcbiAgICAgICAgICAgICAgICB1cmw6IEFwaUVuZHBvaW50VXJsKyd1c2Vycy8nK2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBjcmVhdGVVc2VyOiBmdW5jdGlvbih1c2VyKXtcbiAgICAgICAgICAgIHZhciBkYXRhID0gYW5ndWxhci5jb3B5KHVzZXIpO1xuICAgICAgICAgICAgZGF0YS5iaXJ0aGRheSA9IGRhdGEuYmlydGhkYXkrJy0wMS0wMSc7XG4gICAgICAgICAgICByZXR1cm4gJGh0dHAoe1xuICAgICAgICAgICAgICAgIG1ldGhvZDogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzJyxcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7ICdDb250ZW50LVR5cGUnIDogJ2FwcGxpY2F0aW9uL3gtd3d3LWZvcm0tdXJsZW5jb2RlZCcgfSxcbiAgICAgICAgICAgICAgICBkYXRhOiAkLnBhcmFtKGRhdGEpXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcblxuICAgICAgICBzYXZlVXNlcjogZnVuY3Rpb24odXNlcil7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IGFuZ3VsYXIuY29weSh1c2VyKTtcbiAgICAgICAgICAgIGRhdGEuYmlydGhkYXkgPSBkYXRhLmJpcnRoZGF5KyctMDEtMDEnO1xuICAgICAgICAgICAgcmV0dXJuICRodHRwKHtcbiAgICAgICAgICAgICAgICBtZXRob2Q6ICdQVVQnLFxuICAgICAgICAgICAgICAgIHVybDogQXBpRW5kcG9pbnRVcmwrJ3VzZXJzLycrZGF0YS51c2VyX2lkLFxuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHsgJ0NvbnRlbnQtVHlwZScgOiAnYXBwbGljYXRpb24veC13d3ctZm9ybS11cmxlbmNvZGVkJyB9LFxuICAgICAgICAgICAgICAgIGRhdGE6ICQucGFyYW0oZGF0YSlcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG5cbiAgICB9O1xufSk7XG4iLCIvKipcbiAqIEdsb2JhbCBlcnJvciBoYW5kbGluZyBmb3IgdG9wIGxldmVsIGVycm9ycy5cbiAqIENhdGNoZXMgYW55IGV4Y2VwdGlvbnMgYW5kIHNlbmRzIHRoZW0gdG8gdGhlICRyb290U2NvcGUucmVwb3J0RXJyb3IgZnVuY3Rpb24uXG4gKi9cbmFwcC5jb25maWcoZnVuY3Rpb24oJHByb3ZpZGUpIHtcbiAgICAkcHJvdmlkZS5kZWNvcmF0b3IoXCIkZXhjZXB0aW9uSGFuZGxlclwiLCBmdW5jdGlvbigkZGVsZWdhdGUsICRpbmplY3Rvcikge1xuXHRcdHJldHVybiBmdW5jdGlvbihleGNlcHRpb24sIGNhdXNlKSB7XG5cdFx0XHQkZGVsZWdhdGUoZXhjZXB0aW9uLCBjYXVzZSk7XG5cdFx0XHRcblx0XHRcdHZhciAkcm9vdFNjb3BlID0gJGluamVjdG9yLmdldChcIiRyb290U2NvcGVcIik7XG5cdFx0XHRyZXR1cm4gJHJvb3RTY29wZS5yZXBvcnRFcnJvcihleGNlcHRpb24sIGNhdXNlKTtcblx0XHR9O1xuXHR9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24gKCRodHRwUHJvdmlkZXIpIHtcbiAgICAkaHR0cFByb3ZpZGVyLmludGVyY2VwdG9ycy5wdXNoKGZ1bmN0aW9uICgkcSwgJGluamVjdG9yLCAkcm9vdFNjb3BlKSB7XG4gICAgICAgIHJldHVybiB7XG5cbiAgICAgICAgICAgIHJlcXVlc3Q6IGZ1bmN0aW9uIChjb25maWcpIHtcbiAgICAgICAgICAgICAgICAvLyBNYWtlIHN1cmUgdGhlIHRva2VuIGlzIHNldCBmb3IgdGhlIHJlcXVlc3QuXG4gICAgICAgICAgICAgICAgdmFyIHRva2VuID0gbG9jYWxTdG9yYWdlLmdldEl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgaWYodG9rZW4gIT09IG51bGwpe1xuICAgICAgICAgICAgICAgICAgICBjb25maWcuaGVhZGVycy5BdXRob3JpemF0aW9uID0gJ0JlYXJlciAnICsgdG9rZW47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgY29uZmlnLmhlYWRlcnNbJ1gtUmVxdWVzdGVkLVdpdGgnXSA9ICdYTUxIdHRwUmVxdWVzdCc7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgICAgICAgfSxcblxuICAgICAgICAgICAgLy8gRGV0ZWN0IGlmIHRoZSB0b2tlbiBoYXMgZXhwaXJlZCBvbiBhIGh0dHAgY2FsbC4gUmVmcmVzaCB0aGUgdG9rZW4gYW5kIHRyeSBhZ2Fpbi5cbiAgICAgICAgICAgIHJlc3BvbnNlRXJyb3I6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgdmFyIEF1dGhGYWN0b3J5ID0gJGluamVjdG9yLmdldCgnQXV0aEZhY3RvcnknKTtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdGUgPSAkaW5qZWN0b3IuZ2V0KCckc3RhdGUnKTtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5kYXRhICE9PSB1bmRlZmluZWQpe1xuICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UuZGF0YS5lcnJvciA9PSAndG9rZW5fZXhwaXJlZCcpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBBdXRoRmFjdG9yeS5hdHRlbXB0UmVmcmVzaFRva2VuKHJlc3BvbnNlLmNvbmZpZyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAocmVzcG9uc2UuZGF0YS5lcnJvciA9PSAndXNlcl9pbmFjdGl2ZScgfHwgcmVzcG9uc2UuZGF0YS5lcnJvciA9PSAndXNlcl9ub3RfZm91bmQnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmRpc3BsYXlGbGFzaE1lc3NhZ2VzKHJlc3BvbnNlLmRhdGEubWVzc2FnZSwgJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndXNlcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYWxTdG9yYWdlLnJlbW92ZUl0ZW0oJ3Rva2VuJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkcm9vdFNjb3BlLmF1dGhlbnRpY2F0ZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuY3VycmVudFVzZXIgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICAgICAgc3RhdGUuZ28oJ2F1dGgubG9naW4nLCB7fSwge2xvY2F0aW9uOiAncmVwbGFjZSd9KTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ3VzZXJfaXNfbm90X2FkbWluJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5kYXRhLm1lc3NhZ2UsICdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHN0YXRlLmdvKCdkYXNoYm9hcmQnKTtcbiAgICAgICAgICAgICAgICAgICAgfWVsc2UgaWYgKHJlc3BvbnNlLmRhdGEuZXJyb3IgPT0gJ2FwaV92ZXJzaW9uX3VwZGF0ZScpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UuZGF0YS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS5lcnJvciAhPT0gdW5kZWZpbmVkKXtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLmVycm9yID09ICd0b2tlbl9leHBpcmVkJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIEF1dGhGYWN0b3J5LmF0dGVtcHRSZWZyZXNoVG9rZW4ocmVzcG9uc2UuY29uZmlnKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChyZXNwb25zZS5lcnJvciA9PSAndXNlcl9pbmFjdGl2ZScgfHwgcmVzcG9uc2UuZXJyb3IgPT0gJ3VzZXJfbm90X2ZvdW5kJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuZGlzcGxheUZsYXNoTWVzc2FnZXMocmVzcG9uc2UuZGF0YS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2FsU3RvcmFnZS5yZW1vdmVJdGVtKCd1c2VyJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhbFN0b3JhZ2UucmVtb3ZlSXRlbSgndG9rZW4nKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRyb290U2NvcGUuYXV0aGVudGljYXRlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5jdXJyZW50VXNlciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICBzdGF0ZS5nbygnYXV0aC5sb2dpbicsIHt9LCB7bG9jYXRpb246ICdyZXBsYWNlJ30pO1xuICAgICAgICAgICAgICAgICAgICB9ZWxzZSBpZiAocmVzcG9uc2UuZXJyb3IgPT0gJ3VzZXJfaXNfbm90X2FkbWluJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBzdGF0ZS5nbygnZGFzaGJvYXJkJyk7XG4gICAgICAgICAgICAgICAgICAgIH1lbHNlIGlmIChyZXNwb25zZS5lcnJvciA9PSAnYXBpX3ZlcnNpb25fdXBkYXRlJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgJHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZS5tZXNzYWdlLCAnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBsb2NhdGlvbi5yZWxvYWQodHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgcmV0dXJuICRxLnJlamVjdChyZXNwb25zZSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgfTtcbiAgICB9KTtcblxufSk7IiwiLypcbiogIEFuZ3VsYXJKcyBGdWxsY2FsZW5kYXIgV3JhcHBlciBmb3IgdGhlIEpRdWVyeSBGdWxsQ2FsZW5kYXJcbiogIEFQSSBAIGh0dHA6Ly9hcnNoYXcuY29tL2Z1bGxjYWxlbmRhci9cbipcbiogIEFuZ3VsYXIgQ2FsZW5kYXIgRGlyZWN0aXZlIHRoYXQgdGFrZXMgaW4gdGhlIFtldmVudFNvdXJjZXNdIG5lc3RlZCBhcnJheSBvYmplY3QgYXMgdGhlIG5nLW1vZGVsIGFuZCB3YXRjaGVzIGl0IGRlZXBseSBjaGFuZ2VzLlxuKiAgICAgICBDYW4gYWxzbyB0YWtlIGluIG11bHRpcGxlIGV2ZW50IHVybHMgYXMgYSBzb3VyY2Ugb2JqZWN0KHMpIGFuZCBmZWVkIHRoZSBldmVudHMgcGVyIHZpZXcuXG4qICAgICAgIFRoZSBjYWxlbmRhciB3aWxsIHdhdGNoIGFueSBldmVudFNvdXJjZSBhcnJheSBhbmQgdXBkYXRlIGl0c2VsZiB3aGVuIGEgY2hhbmdlIGlzIG1hZGUuXG4qXG4qL1xuXG5hbmd1bGFyLm1vZHVsZSgndWkuY2FsZW5kYXInLCBbXSlcbiAgLmNvbnN0YW50KCd1aUNhbGVuZGFyQ29uZmlnJywge30pXG4gIC5jb250cm9sbGVyKCd1aUNhbGVuZGFyQ3RybCcsIFsnJHNjb3BlJywgJyR0aW1lb3V0JywgJyRsb2NhbGUnLCBmdW5jdGlvbigkc2NvcGUsICR0aW1lb3V0LCAkbG9jYWxlKXtcblxuICAgICAgdmFyIHNvdXJjZVNlcmlhbElkID0gMSxcbiAgICAgICAgICBldmVudFNlcmlhbElkID0gMSxcbiAgICAgICAgICBzb3VyY2VzID0gJHNjb3BlLmV2ZW50U291cmNlcyxcbiAgICAgICAgICBleHRyYUV2ZW50U2lnbmF0dXJlID0gJHNjb3BlLmNhbGVuZGFyV2F0Y2hFdmVudCA/ICRzY29wZS5jYWxlbmRhcldhdGNoRXZlbnQgOiBhbmd1bGFyLm5vb3AsXG5cbiAgICAgICAgICB3cmFwRnVuY3Rpb25XaXRoU2NvcGVBcHBseSA9IGZ1bmN0aW9uKGZ1bmN0aW9uVG9XcmFwKXtcbiAgICAgICAgICAgICAgdmFyIHdyYXBwZXI7XG5cbiAgICAgICAgICAgICAgaWYgKGZ1bmN0aW9uVG9XcmFwKXtcbiAgICAgICAgICAgICAgICAgIHdyYXBwZXIgPSBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICAgICAgICAgIC8vIFRoaXMgaGFwcGVucyBvdXRzaWRlIG9mIGFuZ3VsYXIgY29udGV4dCBzbyB3ZSBuZWVkIHRvIHdyYXAgaXQgaW4gYSB0aW1lb3V0IHdoaWNoIGhhcyBhbiBpbXBsaWVkIGFwcGx5LlxuICAgICAgICAgICAgICAgICAgICAgIC8vIEluIHRoaXMgd2F5IHRoZSBmdW5jdGlvbiB3aWxsIGJlIHNhZmVseSBleGVjdXRlZCBvbiB0aGUgbmV4dCBkaWdlc3QuXG5cbiAgICAgICAgICAgICAgICAgICAgICB2YXIgYXJncyA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICAgICAgICAgICAgICAgICR0aW1lb3V0KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgICAgICBmdW5jdGlvblRvV3JhcC5hcHBseShfdGhpcywgYXJncyk7XG4gICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgcmV0dXJuIHdyYXBwZXI7XG4gICAgICAgICAgfTtcblxuICAgICAgdGhpcy5ldmVudHNGaW5nZXJwcmludCA9IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCFlLl9pZCkge1xuICAgICAgICAgIGUuX2lkID0gZXZlbnRTZXJpYWxJZCsrO1xuICAgICAgICB9XG4gICAgICAgIC8vIFRoaXMgZXh0cmFjdHMgYWxsIHRoZSBpbmZvcm1hdGlvbiB3ZSBuZWVkIGZyb20gdGhlIGV2ZW50LiBodHRwOi8vanNwZXJmLmNvbS9hbmd1bGFyLWNhbGVuZGFyLWV2ZW50cy1maW5nZXJwcmludC8zXG4gICAgICAgIHJldHVybiBcIlwiICsgZS5faWQgKyAoZS5pZCB8fCAnJykgKyAoZS50aXRsZSB8fCAnJykgKyAoZS51cmwgfHwgJycpICsgKCtlLnN0YXJ0IHx8ICcnKSArICgrZS5lbmQgfHwgJycpICtcbiAgICAgICAgICAoZS5hbGxEYXkgfHwgJycpICsgKGUuY2xhc3NOYW1lIHx8ICcnKSArIGV4dHJhRXZlbnRTaWduYXR1cmUoZSkgfHwgJyc7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLnNvdXJjZXNGaW5nZXJwcmludCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgIHJldHVybiBzb3VyY2UuX19pZCB8fCAoc291cmNlLl9faWQgPSBzb3VyY2VTZXJpYWxJZCsrKTtcbiAgICAgIH07XG5cbiAgICAgIHRoaXMuYWxsRXZlbnRzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHJldHVybiBzb3VyY2VzLmZsYXR0ZW4oKTsgYnV0IHdlIGRvbid0IGhhdmUgZmxhdHRlblxuICAgICAgICB2YXIgYXJyYXlTb3VyY2VzID0gW107XG4gICAgICAgIGZvciAodmFyIGkgPSAwLCBzcmNMZW4gPSBzb3VyY2VzLmxlbmd0aDsgaSA8IHNyY0xlbjsgaSsrKSB7XG4gICAgICAgICAgdmFyIHNvdXJjZSA9IHNvdXJjZXNbaV07XG4gICAgICAgICAgaWYgKGFuZ3VsYXIuaXNBcnJheShzb3VyY2UpKSB7XG4gICAgICAgICAgICAvLyBldmVudCBzb3VyY2UgYXMgYXJyYXlcbiAgICAgICAgICAgIGFycmF5U291cmNlcy5wdXNoKHNvdXJjZSk7XG4gICAgICAgICAgfSBlbHNlIGlmKGFuZ3VsYXIuaXNPYmplY3Qoc291cmNlKSAmJiBhbmd1bGFyLmlzQXJyYXkoc291cmNlLmV2ZW50cykpe1xuICAgICAgICAgICAgLy8gZXZlbnQgc291cmNlIGFzIG9iamVjdCwgaWUgZXh0ZW5kZWQgZm9ybVxuICAgICAgICAgICAgdmFyIGV4dEV2ZW50ID0ge307XG4gICAgICAgICAgICBmb3IodmFyIGtleSBpbiBzb3VyY2Upe1xuICAgICAgICAgICAgICBpZihrZXkgIT09ICdfdWlDYWxJZCcgJiYga2V5ICE9PSAnZXZlbnRzJyl7XG4gICAgICAgICAgICAgICAgIGV4dEV2ZW50W2tleV0gPSBzb3VyY2Vba2V5XTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZm9yKHZhciBlSSA9IDA7ZUkgPCBzb3VyY2UuZXZlbnRzLmxlbmd0aDtlSSsrKXtcbiAgICAgICAgICAgICAgYW5ndWxhci5leHRlbmQoc291cmNlLmV2ZW50c1tlSV0sZXh0RXZlbnQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYXJyYXlTb3VyY2VzLnB1c2goc291cmNlLmV2ZW50cyk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIEFycmF5LnByb3RvdHlwZS5jb25jYXQuYXBwbHkoW10sIGFycmF5U291cmNlcyk7XG4gICAgICB9O1xuXG4gICAgICAvLyBUcmFjayBjaGFuZ2VzIGluIGFycmF5IGJ5IGFzc2lnbmluZyBpZCB0b2tlbnMgdG8gZWFjaCBlbGVtZW50IGFuZCB3YXRjaGluZyB0aGUgc2NvcGUgZm9yIGNoYW5nZXMgaW4gdGhvc2UgdG9rZW5zXG4gICAgICAvLyBhcmd1bWVudHM6XG4gICAgICAvLyAgYXJyYXlTb3VyY2UgYXJyYXkgb2YgZnVuY3Rpb24gdGhhdCByZXR1cm5zIGFycmF5IG9mIG9iamVjdHMgdG8gd2F0Y2hcbiAgICAgIC8vICB0b2tlbkZuIGZ1bmN0aW9uKG9iamVjdCkgdGhhdCByZXR1cm5zIHRoZSB0b2tlbiBmb3IgYSBnaXZlbiBvYmplY3RcbiAgICAgIHRoaXMuY2hhbmdlV2F0Y2hlciA9IGZ1bmN0aW9uKGFycmF5U291cmNlLCB0b2tlbkZuKSB7XG4gICAgICAgIHZhciBzZWxmO1xuICAgICAgICB2YXIgZ2V0VG9rZW5zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGFycmF5ID0gYW5ndWxhci5pc0Z1bmN0aW9uKGFycmF5U291cmNlKSA/IGFycmF5U291cmNlKCkgOiBhcnJheVNvdXJjZTtcbiAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sIHRva2VuLCBlbDtcbiAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IGFycmF5Lmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgZWwgPSBhcnJheVtpXTtcbiAgICAgICAgICAgIHRva2VuID0gdG9rZW5GbihlbCk7XG4gICAgICAgICAgICBtYXBbdG9rZW5dID0gZWw7XG4gICAgICAgICAgICByZXN1bHQucHVzaCh0b2tlbik7XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG4gICAgICAgIC8vIHJldHVybnMgZWxlbWVudHMgaW4gdGhhdCBhcmUgaW4gYSBidXQgbm90IGluIGJcbiAgICAgICAgLy8gc3VidHJhY3RBc1NldHMoWzQsIDUsIDZdLCBbNCwgNSwgN10pID0+IFs2XVxuICAgICAgICB2YXIgc3VidHJhY3RBc1NldHMgPSBmdW5jdGlvbihhLCBiKSB7XG4gICAgICAgICAgdmFyIHJlc3VsdCA9IFtdLCBpbkIgPSB7fSwgaSwgbjtcbiAgICAgICAgICBmb3IgKGkgPSAwLCBuID0gYi5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIGluQltiW2ldXSA9IHRydWU7XG4gICAgICAgICAgfVxuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgaWYgKCFpbkJbYVtpXV0pIHtcbiAgICAgICAgICAgICAgcmVzdWx0LnB1c2goYVtpXSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH07XG5cbiAgICAgICAgLy8gTWFwIG9iamVjdHMgdG8gdG9rZW5zIGFuZCB2aWNlLXZlcnNhXG4gICAgICAgIHZhciBtYXAgPSB7fTtcblxuICAgICAgICB2YXIgYXBwbHlDaGFuZ2VzID0gZnVuY3Rpb24obmV3VG9rZW5zLCBvbGRUb2tlbnMpIHtcbiAgICAgICAgICB2YXIgaSwgbiwgZWwsIHRva2VuO1xuICAgICAgICAgIHZhciByZXBsYWNlZFRva2VucyA9IHt9O1xuICAgICAgICAgIHZhciByZW1vdmVkVG9rZW5zID0gc3VidHJhY3RBc1NldHMob2xkVG9rZW5zLCBuZXdUb2tlbnMpO1xuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSByZW1vdmVkVG9rZW5zLmxlbmd0aDsgaSA8IG47IGkrKykge1xuICAgICAgICAgICAgdmFyIHJlbW92ZWRUb2tlbiA9IHJlbW92ZWRUb2tlbnNbaV07XG4gICAgICAgICAgICBlbCA9IG1hcFtyZW1vdmVkVG9rZW5dO1xuICAgICAgICAgICAgZGVsZXRlIG1hcFtyZW1vdmVkVG9rZW5dO1xuICAgICAgICAgICAgdmFyIG5ld1Rva2VuID0gdG9rZW5GbihlbCk7XG4gICAgICAgICAgICAvLyBpZiB0aGUgZWxlbWVudCB3YXNuJ3QgcmVtb3ZlZCBidXQgc2ltcGx5IGdvdCBhIG5ldyB0b2tlbiwgaXRzIG9sZCB0b2tlbiB3aWxsIGJlIGRpZmZlcmVudCBmcm9tIHRoZSBjdXJyZW50IG9uZVxuICAgICAgICAgICAgaWYgKG5ld1Rva2VuID09PSByZW1vdmVkVG9rZW4pIHtcbiAgICAgICAgICAgICAgc2VsZi5vblJlbW92ZWQoZWwpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgcmVwbGFjZWRUb2tlbnNbbmV3VG9rZW5dID0gcmVtb3ZlZFRva2VuO1xuICAgICAgICAgICAgICBzZWxmLm9uQ2hhbmdlZChlbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgdmFyIGFkZGVkVG9rZW5zID0gc3VidHJhY3RBc1NldHMobmV3VG9rZW5zLCBvbGRUb2tlbnMpO1xuICAgICAgICAgIGZvciAoaSA9IDAsIG4gPSBhZGRlZFRva2Vucy5sZW5ndGg7IGkgPCBuOyBpKyspIHtcbiAgICAgICAgICAgIHRva2VuID0gYWRkZWRUb2tlbnNbaV07XG4gICAgICAgICAgICBlbCA9IG1hcFt0b2tlbl07XG4gICAgICAgICAgICBpZiAoIXJlcGxhY2VkVG9rZW5zW3Rva2VuXSkge1xuICAgICAgICAgICAgICBzZWxmLm9uQWRkZWQoZWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgc2VsZiA9IHtcbiAgICAgICAgICBzdWJzY3JpYmU6IGZ1bmN0aW9uKHNjb3BlLCBvbkNoYW5nZWQpIHtcbiAgICAgICAgICAgIHNjb3BlLiR3YXRjaChnZXRUb2tlbnMsIGZ1bmN0aW9uKG5ld1Rva2Vucywgb2xkVG9rZW5zKSB7XG4gICAgICAgICAgICAgIGlmICghb25DaGFuZ2VkIHx8IG9uQ2hhbmdlZChuZXdUb2tlbnMsIG9sZFRva2VucykgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgYXBwbHlDaGFuZ2VzKG5ld1Rva2Vucywgb2xkVG9rZW5zKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgdHJ1ZSk7XG4gICAgICAgICAgfSxcbiAgICAgICAgICBvbkFkZGVkOiBhbmd1bGFyLm5vb3AsXG4gICAgICAgICAgb25DaGFuZ2VkOiBhbmd1bGFyLm5vb3AsXG4gICAgICAgICAgb25SZW1vdmVkOiBhbmd1bGFyLm5vb3BcbiAgICAgICAgfTtcbiAgICAgICAgcmV0dXJuIHNlbGY7XG4gICAgICB9O1xuXG4gICAgICB0aGlzLmdldEZ1bGxDYWxlbmRhckNvbmZpZyA9IGZ1bmN0aW9uKGNhbGVuZGFyU2V0dGluZ3MsIHVpQ2FsZW5kYXJDb25maWcpe1xuICAgICAgICAgIHZhciBjb25maWcgPSB7fTtcblxuICAgICAgICAgIGFuZ3VsYXIuZXh0ZW5kKGNvbmZpZywgdWlDYWxlbmRhckNvbmZpZyk7XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQoY29uZmlnLCBjYWxlbmRhclNldHRpbmdzKTtcbiAgICAgICAgIFxuICAgICAgICAgIGFuZ3VsYXIuZm9yRWFjaChjb25maWcsIGZ1bmN0aW9uKHZhbHVlLGtleSl7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHZhbHVlID09PSAnZnVuY3Rpb24nKXtcbiAgICAgICAgICAgICAgY29uZmlnW2tleV0gPSB3cmFwRnVuY3Rpb25XaXRoU2NvcGVBcHBseShjb25maWdba2V5XSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICByZXR1cm4gY29uZmlnO1xuICAgICAgfTtcblxuICAgIHRoaXMuZ2V0TG9jYWxlQ29uZmlnID0gZnVuY3Rpb24oZnVsbENhbGVuZGFyQ29uZmlnKSB7XG4gICAgICBpZiAoIWZ1bGxDYWxlbmRhckNvbmZpZy5sYW5nIHx8IGZ1bGxDYWxlbmRhckNvbmZpZy51c2VOZ0xvY2FsZSkge1xuICAgICAgICAvLyBDb25maWd1cmUgdG8gdXNlIGxvY2FsZSBuYW1lcyBieSBkZWZhdWx0XG4gICAgICAgIHZhciB0VmFsdWVzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgIC8vIGNvbnZlcnQgezA6IFwiSmFuXCIsIDE6IFwiRmViXCIsIC4uLn0gdG8gW1wiSmFuXCIsIFwiRmViXCIsIC4uLl1cbiAgICAgICAgICB2YXIgciwgaztcbiAgICAgICAgICByID0gW107XG4gICAgICAgICAgZm9yIChrIGluIGRhdGEpIHtcbiAgICAgICAgICAgIHJba10gPSBkYXRhW2tdO1xuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gcjtcbiAgICAgICAgfTtcbiAgICAgICAgdmFyIGR0ZiA9ICRsb2NhbGUuREFURVRJTUVfRk9STUFUUztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICBtb250aE5hbWVzOiB0VmFsdWVzKGR0Zi5NT05USCksXG4gICAgICAgICAgbW9udGhOYW1lc1Nob3J0OiB0VmFsdWVzKGR0Zi5TSE9SVE1PTlRIKSxcbiAgICAgICAgICBkYXlOYW1lczogdFZhbHVlcyhkdGYuREFZKSxcbiAgICAgICAgICBkYXlOYW1lc1Nob3J0OiB0VmFsdWVzKGR0Zi5TSE9SVERBWSlcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB7fTtcbiAgICB9O1xuICB9XSlcbiAgLmRpcmVjdGl2ZSgndWlDYWxlbmRhcicsIFsndWlDYWxlbmRhckNvbmZpZycsIGZ1bmN0aW9uKHVpQ2FsZW5kYXJDb25maWcpIHtcbiAgICByZXR1cm4ge1xuICAgICAgcmVzdHJpY3Q6ICdBJyxcbiAgICAgIHNjb3BlOiB7ZXZlbnRTb3VyY2VzOic9bmdNb2RlbCcsY2FsZW5kYXJXYXRjaEV2ZW50OiAnJid9LFxuICAgICAgY29udHJvbGxlcjogJ3VpQ2FsZW5kYXJDdHJsJyxcbiAgICAgIGxpbms6IGZ1bmN0aW9uKHNjb3BlLCBlbG0sIGF0dHJzLCBjb250cm9sbGVyKSB7XG5cbiAgICAgICAgdmFyIHNvdXJjZXMgPSBzY29wZS5ldmVudFNvdXJjZXMsXG4gICAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IGZhbHNlLFxuICAgICAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlciA9IGNvbnRyb2xsZXIuY2hhbmdlV2F0Y2hlcihzb3VyY2VzLCBjb250cm9sbGVyLnNvdXJjZXNGaW5nZXJwcmludCksXG4gICAgICAgICAgICBldmVudHNXYXRjaGVyID0gY29udHJvbGxlci5jaGFuZ2VXYXRjaGVyKGNvbnRyb2xsZXIuYWxsRXZlbnRzLCBjb250cm9sbGVyLmV2ZW50c0ZpbmdlcnByaW50KSxcbiAgICAgICAgICAgIG9wdGlvbnMgPSBudWxsO1xuXG4gICAgICAgIGZ1bmN0aW9uIGdldE9wdGlvbnMoKXtcbiAgICAgICAgICB2YXIgY2FsZW5kYXJTZXR0aW5ncyA9IGF0dHJzLnVpQ2FsZW5kYXIgPyBzY29wZS4kcGFyZW50LiRldmFsKGF0dHJzLnVpQ2FsZW5kYXIpIDoge30sXG4gICAgICAgICAgICAgIGZ1bGxDYWxlbmRhckNvbmZpZztcblxuICAgICAgICAgIGZ1bGxDYWxlbmRhckNvbmZpZyA9IGNvbnRyb2xsZXIuZ2V0RnVsbENhbGVuZGFyQ29uZmlnKGNhbGVuZGFyU2V0dGluZ3MsIHVpQ2FsZW5kYXJDb25maWcpO1xuXG4gICAgICAgICAgdmFyIGxvY2FsZUZ1bGxDYWxlbmRhckNvbmZpZyA9IGNvbnRyb2xsZXIuZ2V0TG9jYWxlQ29uZmlnKGZ1bGxDYWxlbmRhckNvbmZpZyk7XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQobG9jYWxlRnVsbENhbGVuZGFyQ29uZmlnLCBmdWxsQ2FsZW5kYXJDb25maWcpO1xuXG4gICAgICAgICAgb3B0aW9ucyA9IHsgZXZlbnRTb3VyY2VzOiBzb3VyY2VzIH07XG4gICAgICAgICAgYW5ndWxhci5leHRlbmQob3B0aW9ucywgbG9jYWxlRnVsbENhbGVuZGFyQ29uZmlnKTtcblxuICAgICAgICAgIHZhciBvcHRpb25zMiA9IHt9O1xuICAgICAgICAgIGZvcih2YXIgbyBpbiBvcHRpb25zKXtcbiAgICAgICAgICAgIGlmKG8gIT09ICdldmVudFNvdXJjZXMnKXtcbiAgICAgICAgICAgICAgb3B0aW9uczJbb10gPSBvcHRpb25zW29dO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgICByZXR1cm4gSlNPTi5zdHJpbmdpZnkob3B0aW9uczIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2NvcGUuZGVzdHJveSA9IGZ1bmN0aW9uKCl7XG4gICAgICAgICAgaWYoc2NvcGUuY2FsZW5kYXIgJiYgc2NvcGUuY2FsZW5kYXIuZnVsbENhbGVuZGFyKXtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcignZGVzdHJveScpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZihhdHRycy5jYWxlbmRhcikge1xuICAgICAgICAgICAgc2NvcGUuY2FsZW5kYXIgPSBzY29wZS4kcGFyZW50W2F0dHJzLmNhbGVuZGFyXSA9ICAkKGVsbSkuaHRtbCgnJyk7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNjb3BlLmNhbGVuZGFyID0gJChlbG0pLmh0bWwoJycpO1xuICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBzY29wZS5pbml0ID0gZnVuY3Rpb24oKXtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIob3B0aW9ucyk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRTb3VyY2VzV2F0Y2hlci5vbkFkZGVkID0gZnVuY3Rpb24oc291cmNlKSB7XG4gICAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ2FkZEV2ZW50U291cmNlJywgc291cmNlKTtcbiAgICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudFNvdXJjZXNXYXRjaGVyLm9uUmVtb3ZlZCA9IGZ1bmN0aW9uKHNvdXJjZSkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVtb3ZlRXZlbnRTb3VyY2UnLCBzb3VyY2UpO1xuICAgICAgICAgIHNvdXJjZXNDaGFuZ2VkID0gdHJ1ZTtcbiAgICAgICAgfTtcblxuICAgICAgICBldmVudHNXYXRjaGVyLm9uQWRkZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVuZGVyRXZlbnQnLCBldmVudCk7XG4gICAgICAgIH07XG5cbiAgICAgICAgZXZlbnRzV2F0Y2hlci5vblJlbW92ZWQgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgIHNjb3BlLmNhbGVuZGFyLmZ1bGxDYWxlbmRhcigncmVtb3ZlRXZlbnRzJywgZnVuY3Rpb24oZSkgeyBcbiAgICAgICAgICAgIHJldHVybiBlLl9pZCA9PT0gZXZlbnQuX2lkO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50c1dhdGNoZXIub25DaGFuZ2VkID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICBldmVudC5fc3RhcnQgPSAkLmZ1bGxDYWxlbmRhci5tb21lbnQoZXZlbnQuc3RhcnQpO1xuICAgICAgICAgIGV2ZW50Ll9lbmQgPSAkLmZ1bGxDYWxlbmRhci5tb21lbnQoZXZlbnQuZW5kKTtcbiAgICAgICAgICBzY29wZS5jYWxlbmRhci5mdWxsQ2FsZW5kYXIoJ3VwZGF0ZUV2ZW50JywgZXZlbnQpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGV2ZW50U291cmNlc1dhdGNoZXIuc3Vic2NyaWJlKHNjb3BlKTtcbiAgICAgICAgZXZlbnRzV2F0Y2hlci5zdWJzY3JpYmUoc2NvcGUsIGZ1bmN0aW9uKG5ld1Rva2Vucywgb2xkVG9rZW5zKSB7XG4gICAgICAgICAgaWYgKHNvdXJjZXNDaGFuZ2VkID09PSB0cnVlKSB7XG4gICAgICAgICAgICBzb3VyY2VzQ2hhbmdlZCA9IGZhbHNlO1xuICAgICAgICAgICAgLy8gcHJldmVudCBpbmNyZW1lbnRhbCB1cGRhdGVzIGluIHRoaXMgY2FzZVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSk7XG5cbiAgICAgICAgc2NvcGUuJHdhdGNoKGdldE9wdGlvbnMsIGZ1bmN0aW9uKG5ld08sb2xkTyl7XG4gICAgICAgICAgICBzY29wZS5kZXN0cm95KCk7XG4gICAgICAgICAgICBzY29wZS5pbml0KCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG59XSk7IiwiYXBwLmRpcmVjdGl2ZSgnbmdFbnRlcicsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihzY29wZSwgZWxlbWVudCwgYXR0cnMpIHtcbiAgICAgICAgZWxlbWVudC5iaW5kKFwia2V5ZG93biBrZXlwcmVzc1wiLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgaWYoIWV2ZW50LmFsdEtleSAmJiAhZXZlbnQuc2hpZnRLZXkgJiYgIWV2ZW50LmN0cmxLZXkgJiYgZXZlbnQud2hpY2ggPT09IDEzKSB7XG4gICAgICAgICAgICAgICAgc2NvcGUuJGFwcGx5KGZ1bmN0aW9uKCl7XG4gICAgICAgICAgICAgICAgICAgIHNjb3BlLiRldmFsKGF0dHJzLm5nRW50ZXIsIHsnZXZlbnQnOiBldmVudH0pO1xuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcbn0pOyIsImFwcC5kaXJlY3RpdmUoJ25nSW5maW5pdGVTY3JvbGwnLCBmdW5jdGlvbigkd2luZG93KSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKHNjb3BlLCBlbGVtZW50LCBhdHRycykge1xuICAgICAgICBhbmd1bGFyLmVsZW1lbnQoJHdpbmRvdykuYmluZChcInNjcm9sbFwiLCBmdW5jdGlvbigpIHtcblx0XHQgICAgdmFyIHdpbmRvd0hlaWdodCBcdD0gXCJpbm5lckhlaWdodFwiIGluIHdpbmRvdyA/IHdpbmRvdy5pbm5lckhlaWdodCA6IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5vZmZzZXRIZWlnaHQ7XG5cdFx0ICAgIHZhciBib2R5IFx0XHRcdD0gZG9jdW1lbnQuYm9keSwgaHRtbCA9IGRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblx0XHQgICAgdmFyIGRvY0hlaWdodCBcdFx0PSBNYXRoLm1heChib2R5LnNjcm9sbEhlaWdodCwgYm9keS5vZmZzZXRIZWlnaHQsIGh0bWwuY2xpZW50SGVpZ2h0LCAgaHRtbC5zY3JvbGxIZWlnaHQsIGh0bWwub2Zmc2V0SGVpZ2h0KTtcblx0XHQgICAgd2luZG93Qm90dG9tIFx0XHQ9IHdpbmRvd0hlaWdodCArIHdpbmRvdy5wYWdlWU9mZnNldDtcblx0XHQgICAgXG5cdFx0ICAgIGlmICh3aW5kb3dCb3R0b20gPj0gZG9jSGVpZ2h0KSB7XG5cdFx0XHQgICAgLy8gSW5zZXJ0IGxvYWRlciBjb2RlIGhlcmUuXG5cdFx0XHQgICAgc2NvcGUub2Zmc2V0ID0gc2NvcGUub2Zmc2V0ICsgc2NvcGUubGltaXQ7XG5cdFx0ICAgICAgICBzY29wZS5sb2FkKCk7XG5cdFx0ICAgIH1cblx0XHR9KTtcbiAgICB9O1xufSk7IiwiYXBwLmRpcmVjdGl2ZSgnc3RyaW5nVG9OdW1iZXInLCBmdW5jdGlvbigpIHtcbiAgcmV0dXJuIHtcbiAgICByZXF1aXJlOiAnbmdNb2RlbCcsXG4gICAgbGluazogZnVuY3Rpb24oc2NvcGUsIGVsZW1lbnQsIGF0dHJzLCBuZ01vZGVsKSB7XG4gICAgICBuZ01vZGVsLiRwYXJzZXJzLnB1c2goZnVuY3Rpb24odmFsdWUpIHtcbiAgICAgICAgcmV0dXJuICcnICsgdmFsdWU7XG4gICAgICB9KTtcbiAgICAgIG5nTW9kZWwuJGZvcm1hdHRlcnMucHVzaChmdW5jdGlvbih2YWx1ZSkge1xuICAgICAgICByZXR1cm4gcGFyc2VGbG9hdCh2YWx1ZSwgMTApO1xuICAgICAgfSk7XG4gICAgfVxuICB9O1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicycsIHtcbiAgICAgICAgdXJsOiAnL2NsdWJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluQ2x1YnNDb250cm9sbGVyIGFzIGNsdWJzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzLnNob3cnLCB7XG4gICAgICAgIHVybDogJy86aWQnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLnNob3cnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pbkNsdWJDb250cm9sbGVyIGFzIGNsdWJzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzLnNob3cudXNlcnMnLCB7XG4gICAgICAgIHVybDogJy91c2VycycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy51c2VycydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93LmFkbWlucycsIHtcbiAgICAgICAgdXJsOiAnL2FkbWlucycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi5jbHVicy5hZG1pbnMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy5pbnZvaWNlcycsIHtcbiAgICAgICAgdXJsOiAnL2ludm9pY2VzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLmludm9pY2VzLmluZGV4J1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmNsdWJzLnNob3cuc2lnbnVwcycsIHtcbiAgICAgICAgdXJsOiAnL3NpZ251cHMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuc2lnbnVwcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5jbHVicy5zaG93LnRlYW1zJywge1xuICAgICAgICB1cmw6ICcvdGVhbXMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMudGVhbXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy5pbnZvaWNlcy5pbmNvbWluZycsIHtcbiAgICAgICAgdXJsOiAnL2luY29taW5nJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGFkbWluLmNsdWJzLnNob3cnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuaW52b2ljZXMuaW5jb21pbmcnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy5pbnZvaWNlcy5vdXRnb2luZycsIHtcbiAgICAgICAgdXJsOiAnL291dGdvaW5nJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGFkbWluLmNsdWJzLnNob3cnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uY2x1YnMuaW52b2ljZXMub3V0Z29pbmcnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uY2x1YnMuc2hvdy5tZXJnZScsIHtcbiAgICAgICAgdXJsOiAnL21lcmdlJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmNsdWJzLm1lcmdlJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uaW52b2ljZXMnLCB7XG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB1cmw6ICcvaW52b2ljZXMnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmludm9pY2VzLmluZGV4Jywge1xuICAgICAgICB1cmw6ICc/Y3VycmVudF9wYWdlJnBlcl9wYWdlJnNlYXJjaCZwYXltZW50X3N0YXR1cycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uaW52b2ljZXMuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pbkludm9pY2VzQ29udHJvbGxlciBhcyBpbnZvaWNlcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcGFyYW1zOiB7XG4gICAgICAgICAgICBjdXJyZW50X3BhZ2U6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzEnLFxuICAgICAgICAgICAgICAgIHNxdWFzaDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBlcl9wYWdlOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICcxMCcsXG4gICAgICAgICAgICAgICAgc3F1YXNoOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc2VhcmNoOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICcnLFxuICAgICAgICAgICAgICAgIHNxdWFzaDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBheW1lbnRfc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICdhbGwnLFxuICAgICAgICAgICAgICAgIHNxdWFzaDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmludm9pY2VzLnNob3cnLCB7XG4gICAgICAgIHVybDogJy86aWQnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLmludm9pY2VzLnNob3cnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pbkludm9pY2VDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4nLCB7XG4gICAgICAgIHVybDogJy9hZG1pbicsXG4gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLmRhc2hib2FyZCcsIHtcbiAgICAgICAgdXJsOiAnL2Rhc2hib2FyZCcsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4uZGFzaGJvYXJkJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQWRtaW5EYXNoYm9hcmRDb250cm9sbGVyIGFzIGRhc2hib2FyZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4uc2lnbnVwcycsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHVybDogJy9zaWdudXBzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi5zaWdudXBzLmluZGV4Jywge1xuICAgICAgICB1cmw6ICc/Y3VycmVudF9wYWdlJnBlcl9wYWdlJnNlYXJjaCVjb21wZXRpdGlvbnNfaWQnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLnNpZ251cHMuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdBZG1pblNpZ251cHNDb250cm9sbGVyIGFzIHNpZ251cHMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHBhcmFtczoge1xuICAgICAgICAgICAgY3VycmVudF9wYWdlOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICcxJyxcbiAgICAgICAgICAgICAgICBzcXVhc2g6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwZXJfcGFnZToge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnMTAnLFxuICAgICAgICAgICAgICAgIHNxdWFzaDogdHJ1ZVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHNlYXJjaDoge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnJyxcbiAgICAgICAgICAgICAgICBzcXVhc2g6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjb21wZXRpdGlvbnNfaWQ6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogbnVsbCxcbiAgICAgICAgICAgICAgICBzcXVhc2g6IHRydWVcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLnVzZXJzJywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdXJsOiAnL3VzZXJzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2Vycy5pbmRleCcsIHtcbiAgICAgICAgdXJsOiAnP2N1cnJlbnRfcGFnZSZwZXJfcGFnZSZzZWFyY2gmc3RhdHVzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5hZG1pbi51c2Vycy5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluVXNlcnNDb250cm9sbGVyIGFzIHVzZXJzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBwYXJhbXM6IHtcbiAgICAgICAgICAgIGN1cnJlbnRfcGFnZToge1xuICAgICAgICAgICAgICAgIHZhbHVlOiAnMScsXG4gICAgICAgICAgICAgICAgc3F1YXNoOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcGVyX3BhZ2U6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJzEwJyxcbiAgICAgICAgICAgICAgICBzcXVhc2g6IHRydWVcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBzZWFyY2g6IHtcbiAgICAgICAgICAgICAgICB2YWx1ZTogJycsXG4gICAgICAgICAgICAgICAgc3F1YXNoOiB0cnVlXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgc3RhdHVzOiB7XG4gICAgICAgICAgICAgICAgdmFsdWU6ICdhbGwnLFxuICAgICAgICAgICAgICAgIHNxdWFzaDogdHJ1ZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLnVzZXJzLnNob3cuZWRpdCcsIHtcbiAgICAgICAgdXJsOiAnL2VkaXQnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW4nOiB7ICAgXG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4udXNlcnMuZWRpdCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhZG1pbi51c2Vycy5zaG93LnNpZ251cHMnLCB7XG4gICAgICAgIHVybDogJy9zaWdudXBzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLnVzZXJzLnNpZ251cHMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnYWRtaW4udXNlcnMuc2hvdy5pbnZvaWNlcycsIHtcbiAgICAgICAgdXJsOiAnL2ludm9pY2VzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmFkbWluLnVzZXJzLmludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2FkbWluLnVzZXJzLnNob3cnLCB7XG4gICAgICAgIHVybDogJy86dXNlcl9pZCcsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuYWRtaW4udXNlcnMuc2hvdycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0FkbWluVXNlckNvbnRyb2xsZXIgYXMgdXNlcidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuLy9cdCRsb2NhdGlvblByb3ZpZGVyLmh0bWw1TW9kZSh0cnVlKTtcblxuXHQvLyBBdXRoLlxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aCcsIHtcblx0XHR1cmw6ICcvYXV0aCcsXG5cdFx0cGFyZW50OiAncHVibGljJyxcblx0XHRhYnN0cmFjdDogdHJ1ZSxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9pbmRleCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdBdXRoQ29udHJvbGxlcidcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXHQkdXJsUm91dGVyUHJvdmlkZXIud2hlbignL2F1dGgnLCAnL2F1dGgvbG9naW4nKTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgucmVnaXN0ZXInLCB7XG5cdFx0dXJsOiAnL3JlZ2lzdGVyJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9yZWdpc3Rlcidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmludml0ZScsIHtcblx0XHR1cmw6ICcvcmVnaXN0ZXIvOmludml0ZV90b2tlbicsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcmVnaXN0ZXInLFxuXHRcdGNvbnRyb2xsZXI6ICdBdXRoQ29udHJvbGxlcidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmluYWN0aXZlJywge1xuXHRcdHVybDogJy9pbmFjdGl2ZScsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvaW5hY3RpdmUnXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5hY3RpdmF0ZScsIHtcblx0XHR1cmw6ICcvYWN0aXZhdGUvOnRva2VuJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9hY3RpdmF0ZScsXG5cdFx0Y29udHJvbGxlcjogJ0FjdGl2YXRpb25Db250cm9sbGVyJ1xuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2F1dGgubG9naW4nLCB7XG5cdFx0dXJsOiAnL2xvZ2luJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9sb2dpbidcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLnBhc3N3b3JkJywge1xuXHRcdHVybDogJy9wYXNzd29yZCcsXG5cdFx0dGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvcGFzc3dvcmQnXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnYXV0aC5yZXNldCcsIHtcblx0XHR1cmw6ICcvcmVzZXQvOnRva2VuJyxcblx0XHR0ZW1wbGF0ZVVybDogJy9wdWJsaWN2aWV3cy9yZXNldCcsXG5cdFx0Y29udHJvbGxlcjogZnVuY3Rpb24oJHJvb3RTY29wZSwgJHNjb3BlLCAkc3RhdGVQYXJhbXMsIEF1dGhGYWN0b3J5KXtcblx0XHRcdCRzY29wZS5yZXNldCA9IHtlbWFpbDogJycsIHRva2VuOiAkc3RhdGVQYXJhbXMudG9rZW59O1xuXG5cdFx0XHQkc2NvcGUucmVzZXRQYXNzd29yZCA9IGZ1bmN0aW9uKClcblx0XHRcdHtcblxuXHRcdFx0XHRBdXRoRmFjdG9yeVxuXHRcdFx0XHRcdC5yZXNldFBhc3N3b3JkKCRzY29wZS5yZXNldClcblx0XHRcdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihyZXNwb25zZSl7XG5cdFx0XHRcdFx0XHQkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSB0cnVlO1xuXHRcdFx0XHRcdFx0JHNjb3BlLnJlc2V0ID0ge2VtYWlsOiAnJywgdG9rZW46ICRzdGF0ZVBhcmFtcy50b2tlbn07XG5cdFx0XHRcdFx0fSlcblx0XHRcdFx0XHQuZXJyb3IoZnVuY3Rpb24ocmVzcG9uc2Upe1xuXHRcdFx0XHRcdFx0JHJvb3RTY29wZS5kaXNwbGF5Rmxhc2hNZXNzYWdlcyhyZXNwb25zZSwgJ2Vycm9yJyk7XG5cdFx0XHRcdFx0XHQkc2NvcGUucGFzc3dvcmRSZXF1ZXN0ZWQgPSBmYWxzZTtcblx0XHRcdFx0XHR9KVxuXHRcdFx0XHRcdC50aGVuKGZ1bmN0aW9uKHJlc3BvbnNlKXtcblx0XHRcdFx0XHRcdGlmKHJlc3BvbnNlLmRhdGEuc3RhdHVzICE9PSAnc3VjY2VzcycpXG5cdFx0XHRcdFx0XHR7XG5cdFx0XHRcdFx0XHRcdCRzY29wZS5wYXNzd29yZFJlcXVlc3RlZCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSk7XG5cdFx0XHR9O1xuXHRcdH1cblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdhdXRoLmxvZ291dCcsIHtcblx0XHR1cmw6ICcvbG9nb3V0Jyxcblx0XHRjb250cm9sbGVyOiBmdW5jdGlvbihBdXRoRmFjdG9yeSl7XG5cdFx0XHRBdXRoRmFjdG9yeS5sb2dvdXQoKTtcblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hhbXBpb25zaGlwcycsIHtcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHRhYnN0cmFjdDogdHJ1ZSxcblx0XHR1cmw6ICcvY2hhbXBpb25zaGlwcycsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jaGFtcGlvbnNoaXBzLmluZGV4J1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoYW1waW9uc2hpcHMuaW5kZXgnLCB7XG5cdFx0dXJsOiAnJyxcblx0XHRwYXJlbnQ6ICdjaGFtcGlvbnNoaXBzJyxcblx0XHR2aWV3czp7XG5cdFx0XHQnY29udGVudEAnOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNoYW1waW9uc2hpcHMuaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ2hhbXBpb25zaGlwc0NvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdjaGFtcGlvbnNoaXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hhbXBpb25zaGlwcy5zaG93Jywge1xuXHRcdHVybDogJy86Y2hhbXBpb25zaGlwc19pZCcsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jaGFtcGlvbnNoaXBzLnNob3cnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ2hhbXBpb25zaGlwQ29udHJvbGxlciBhcyBjaGFtcGlvbnNoaXBzJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NoYW1waW9uc2hpcHMuc2hvdy5jb21wZXRpdGlvbnMnLCB7XG5cdFx0dXJsOiAnL2NvbXBldGl0aW9ucycsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czoge1xuXHRcdFx0J21haW5AY2hhbXBpb25zaGlwcy5zaG93Jzp7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNoYW1waW9uc2hpcHMuc2hvdy5jb21wZXRpdGlvbnMnXG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2hhbXBpb25zaGlwcy5zaG93LnNpZ251cHMnLCB7XG5cdFx0dXJsOiAnL3NpZ251cHM/Y3VycmVudF9wYWdlJnBlcl9wYWdlJnNlYXJjaCVjb21wZXRpdGlvbnNfaWQnLFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWUsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdtYWluQGNoYW1waW9uc2hpcHMuc2hvdyc6e1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jaGFtcGlvbnNoaXBzLnNob3cuc2lnbnVwcycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDaGFtcGlvbnNoaXBTaWdudXBzQ29udHJvbGxlciBhcyBzaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRjdXJyZW50X3BhZ2U6IHtcblx0XHRcdFx0dmFsdWU6ICcxJyxcblx0XHRcdFx0c3F1YXNoOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGVyX3BhZ2U6IHtcblx0XHRcdFx0dmFsdWU6ICcxMCcsXG5cdFx0XHRcdHNxdWFzaDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHNlYXJjaDoge1xuXHRcdFx0XHR2YWx1ZTogJycsXG5cdFx0XHRcdHNxdWFzaDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdGNvbXBldGl0aW9uc19pZDoge1xuXHRcdFx0XHR2YWx1ZTogbnVsbCxcblx0XHRcdFx0c3F1YXNoOiB0cnVlXG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWInLCB7XG4gICAgICAgIHVybDogJy9jbHViJyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViQ29udHJvbGxlciBhcyBjbHViJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5jb25uZWN0Jywge1xuICAgICAgICB1cmw6ICcvY2x1Yi9jb25uZWN0JyxcbiAgICAgICAgcGFyZW50OiAncm9vdCcsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmwgOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuY29ubmVjdCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NsdWJDb25uZWN0Q29udHJvbGxlciBhcyBjbHViJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5pbmZvcm1hdGlvbicsIHtcbiAgICAgICAgdXJsOiAnL2luZm9ybWF0aW9uJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5pbmZvcm1hdGlvbicsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NsdWJDb250cm9sbGVyIGFzIGNsdWInXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLmVkaXQnLCB7XG4gICAgICAgIHVybDogJy9lZGl0JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5lZGl0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1YkNvbnRyb2xsZXIgYXMgY2x1YidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuYWRtaW5zJywge1xuICAgICAgICB1cmw6ICcvYWRtaW5zJyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluJzp7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5hZG1pbnMnLFxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5wcmVtaXVtJywge1xuICAgICAgICB1cmw6ICcvcHJlbWl1bScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbic6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jbHViLnByZW1pdW0nLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQcmVtaXVtQ29udHJvbGxlciBhcyBwcmVtaXVtJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi51c2VycycsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHVybDogJy91c2VycycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi51c2Vycy5pbmRleCcsIHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi51c2Vycy5pbmRleCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0NsdWJDb250cm9sbGVyIGFzIGNsdWInXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnVzZXJzLmVkaXQnLCB7XG4gICAgICAgIHVybDogJy86dXNlcl9pZC9lZGl0JyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi51c2Vycy5lZGl0JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXIgYXMgdXNlcidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjbHViLnVzZXJzLmNyZWF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2NyZWF0ZScsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIudXNlcnMuY3JlYXRlJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXIgYXMgdXNlcidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIudXNlcnMuc2hvdycsIHtcbiAgICAgICAgdXJsOiAnLzp1c2VyX2lkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi51c2Vycy5zaG93JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnVXNlckNvbnRyb2xsZXIgYXMgdXNlcidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5pbnZvaWNlcycsIHtcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHVybDogJy9pbnZvaWNlcycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMuaW5kZXgnLCB7XG4gICAgICAgIHVybDogJycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMuaW5jb21pbmcnLCB7XG4gICAgICAgIHVybDogJy9pbmNvbWluZycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMuaW5jb21pbmcnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMub3V0Z29pbmcnLCB7XG4gICAgICAgIHVybDogJy9vdXRnb2luZycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMub3V0Z29pbmcnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NsdWIuaW52b2ljZXMuZ2VuZXJhdGUnLCB7XG4gICAgICAgIHVybDogJy9nZW5lcmF0ZScsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBjbHViJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNsdWIuaW52b2ljZXMuZ2VuZXJhdGUnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdDbHViR2VuZXJhdGVJbnZvaWNlc0NvbnRyb2xsZXIgYXMgaW52b2ljZXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnY2x1Yi5pbnZvaWNlcy5zaG93Jywge1xuICAgICAgICB1cmw6ICcvOmlkJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGNsdWInOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY2x1Yi5pbnZvaWNlcy5zaG93JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnQ2x1Ykludm9pY2VDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbnMuYWRtaW4nLCB7XG5cdFx0YWJzdHJhY3Q6IHRydWUsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dXJsOiAnL2NvbXBldGl0aW9ucy86Y29tcGV0aXRpb25zX2lkL2FkbWluJyxcblx0XHRyZXN0cmljdGVkOiB0cnVlLFxuXHRcdHZpZXdzOntcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLmFkbWluJyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NvbXBldGl0aW9uc0FkbWluQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ2NvbXBldGl0aW9ucydcblx0XHRcdH1cblx0XHR9XG5cdH0pO1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbnMuYWRtaW4uaW5kZXgnLCB7XG5cdFx0dXJsOiAnJyxcblx0XHRyZXN0cmljdGVkOiB0cnVlLFxuXHRcdHZpZXdzOntcblx0XHRcdCdtYWluQGNvbXBldGl0aW9ucy5hZG1pbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLmFkbWluLmluZGV4J1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbnMuYWRtaW4uZWRpdCcsIHtcblx0XHR1cmw6ICcvZWRpdCcsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czp7XG5cdFx0XHQnbWFpbkBjb21wZXRpdGlvbnMuYWRtaW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5hZG1pbi5lZGl0J1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9ucy5hZG1pbi5zaWdudXBzJywge1xuXHRcdHVybDogJy9zaWdudXBzP2N1cnJlbnRfcGFnZSZwZXJfcGFnZSZzZWFyY2gnLFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWUsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdtYWluQGNvbXBldGl0aW9ucy5hZG1pbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLmFkbWluLnNpZ251cHMnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25zQWRtaW5TaWdudXBzQ29udHJvbGxlciBhcyBzaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cGFyYW1zOiB7XG5cdFx0XHRjdXJyZW50X3BhZ2U6IHtcblx0XHRcdFx0dmFsdWU6ICcxJyxcblx0XHRcdFx0c3F1YXNoOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0cGVyX3BhZ2U6IHtcblx0XHRcdFx0dmFsdWU6ICcxMCcsXG5cdFx0XHRcdHNxdWFzaDogdHJ1ZVxuXHRcdFx0fSxcblx0XHRcdHNlYXJjaDoge1xuXHRcdFx0XHR2YWx1ZTogJycsXG5cdFx0XHRcdHNxdWFzaDogdHJ1ZVxuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9ucy5hZG1pbi5wYXRyb2xzJywge1xuXHRcdHVybDogJy9wYXRyb2xzJyxcblx0XHRyZXN0cmljdGVkOiB0cnVlLFxuXHRcdHZpZXdzOntcblx0XHRcdCdtYWluQGNvbXBldGl0aW9ucy5hZG1pbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLmFkbWluLnBhdHJvbHMnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25zQWRtaW5QYXRyb2xzQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ3BhdHJvbHMnXG5cdFx0XHR9XG5cdFx0fVxuXHR9KTtcblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb25zLmFkbWluLnN0YXRpb25zJywge1xuXHRcdHVybDogJy9zdGF0aW9ucycsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czp7XG5cdFx0XHQnbWFpbkBjb21wZXRpdGlvbnMuYWRtaW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5hZG1pbi5zdGF0aW9ucycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDb21wZXRpdGlvbnNBZG1pblN0YXRpb25zQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ3N0YXRpb25zJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9ucy5hZG1pbi5leHBvcnQnLCB7XG5cdFx0dXJsOiAnL2V4cG9ydCcsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czp7XG5cdFx0XHQnbWFpbkBjb21wZXRpdGlvbnMuYWRtaW4nOiB7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5hZG1pbi5leHBvcnQnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25zQWRtaW5FeHBvcnRDb250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnZXhwb3J0J1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbnMnLCB7XG5cdFx0dXJsOiAnL2NvbXBldGl0aW9ucz9wYWdlJnNvcnQnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOntcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLmluZGV4Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ0NvbXBldGl0aW9uc0NvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdjb21wZXRpdGlvbnMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRwYXJhbXM6IHtcblx0XHRcdHBhZ2U6IHtcblx0XHRcdFx0dmFsdWU6ICcwJyxcblx0XHRcdFx0c3F1YXNoOiB0cnVlXG5cdFx0XHR9LFxuXHRcdFx0c29ydDoge1xuXHRcdFx0XHR2YWx1ZTogJ2RhdGUnLFxuXHRcdFx0XHRzcXVhc2g6IHRydWVcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbicsIHtcblx0XHR1cmw6ICcvY29tcGV0aXRpb25zLzppZCcsXG5cdFx0cGFyZW50OiAncm9vdCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnQ29tcGV0aXRpb25Db250cm9sbGVyJyxcblx0XHRcdFx0Y29udHJvbGxlckFzOiAnY29tcGV0aXRpb25zJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2NvbXBldGl0aW9uLmNsdWJzaWdudXBzJywge1xuXHRcdHVybDogJy9jbHVic2lnbnVwcycsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdtYWluJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuc2hvdy5jbHVic2lnbnVwcycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDbHViU2lnbnVwQ29udHJvbGxlciBhcyBjbHVic2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbi50ZWFtc2lnbnVwcycsIHtcblx0XHR1cmw6ICcvdGVhbXNpZ251cHMnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnbWFpbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cudGVhbXNpZ251cHMuaW5kZXgnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnVGVhbVNpZ251cENvbnRyb2xsZXIgYXMgdGVhbXNpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24udGVhbXNpZ251cHMuY3JlYXRlJywge1xuXHRcdHVybDogJy9jcmVhdGUnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5jb21wZXRpdGlvbnMuc2hvdy50ZWFtc2lnbnVwcy5jcmVhdGUnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24udGVhbXNpZ251cHMuZWRpdCcsIHtcblx0XHR1cmw6ICcvOnRlYW1zX2lkJyxcblx0XHR2aWV3czoge1xuXHRcdFx0Jyc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cudGVhbXNpZ251cHMuZWRpdCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdUZWFtU2lnbnVwQ29udHJvbGxlciBhcyB0ZWFtc2lnbnVwcydcblx0XHRcdH1cblx0XHR9LFxuXHRcdHJlc3RyaWN0ZWQ6IHRydWVcblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbi5zaWdudXAnLCB7XG5cdFx0dXJsOiAnL3NpZ251cCcsXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZSxcblx0XHR2aWV3czp7XG5cdFx0XHQnbWFpbic6e1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDonL3ZpZXdzL3BhcnRpYWxzLmNvbXBldGl0aW9ucy5zaG93LnNpZ251cCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDb21wZXRpdGlvbkNvbnRyb2xsZXIgYXMgY29tcGV0aXRpb25zJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdjb21wZXRpdGlvbi5zaWdudXBzJywge1xuXHRcdHVybDogJy9zaWdudXBzJyxcblx0XHRyZXN0cmljdGVkOiB0cnVlLFxuXHRcdHZpZXdzOntcblx0XHRcdCdtYWluJzp7XG5cdFx0XHRcdHRlbXBsYXRlVXJsOicvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cuc2lnbnVwcycsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdDb21wZXRpdGlvbkNvbnRyb2xsZXIgYXMgY29tcGV0aXRpb25zJ1xuXHRcdFx0fVxuXHRcdH1cblx0fSk7XG5cblxuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnY29tcGV0aXRpb24uc2hvdycsIHtcblx0XHR1cmw6ICcvOnZpZXcnLFxuXHRcdHZpZXdzOiB7XG5cdFx0XHQnbWFpbic6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6IGZ1bmN0aW9uKCRzdGF0ZVBhcmFtcyl7XG5cdFx0XHRcdFx0cmV0dXJuICcvdmlld3MvcGFydGlhbHMuY29tcGV0aXRpb25zLnNob3cuJyskc3RhdGVQYXJhbXMudmlldztcblxuXHRcdFx0XHR9LFxuXHRcdFx0XHRjb250cm9sbGVyOiBmdW5jdGlvbigkcm9vdFNjb3BlLCAkc3RhdGVQYXJhbXMpe1xuXHRcdFx0XHRcdCRyb290U2NvcGUuY3VycmVudFZpZXcgPSAkc3RhdGVQYXJhbXMudmlldztcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaW52b2ljZXMnLCB7XG4gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdXJsOiAnL2ludm9pY2VzJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdjb250ZW50QCc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5pbnZvaWNlcy5pbmRleCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdpbnZvaWNlcy5pbmRleCcsIHtcbiAgICAgICAgdXJsOiAnJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGludm9pY2VzJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmludm9pY2VzLm92ZXJ2aWV3JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnSW52b2ljZXNDb250cm9sbGVyIGFzIGludm9pY2VzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2ludm9pY2VzLmluY29taW5nJywge1xuICAgICAgICB1cmw6ICcvaW5jb21pbmcnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ21haW5AaW52b2ljZXMnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuaW52b2ljZXMuaW5jb21pbmcnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdJbnZvaWNlc0NvbnRyb2xsZXIgYXMgaW52b2ljZXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaW52b2ljZXMub3V0Z29pbmcnLCB7XG4gICAgICAgIHVybDogJy9vdXRnb2luZycsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBpbnZvaWNlcyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5pbnZvaWNlcy5vdXRnb2luZycsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0ludm9pY2VzQ29udHJvbGxlciBhcyBpbnZvaWNlcydcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdpbnZvaWNlcy5nZW5lcmF0ZScsIHtcbiAgICAgICAgdXJsOiAnL2dlbmVyYXRlJyxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZSxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdtYWluQGludm9pY2VzJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmludm9pY2VzLmdlbmVyYXRlJyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnR2VuZXJhdGVJbnZvaWNlc0NvbnRyb2xsZXIgYXMgaW52b2ljZXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnaW52b2ljZXMuc2hvdycsIHtcbiAgICAgICAgdXJsOiAnLzppZCcsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnbWFpbkBpbnZvaWNlcyc6IHtcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5pbnZvaWNlcy5zaG93JyxcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiAnSW52b2ljZUNvbnRyb2xsZXIgYXMgaW52b2ljZXMnXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0pOyIsImFwcC5jb25maWcoZnVuY3Rpb24oJHN0YXRlUHJvdmlkZXIsICRsb2NhdGlvblByb3ZpZGVyLCAkdXJsUm91dGVyUHJvdmlkZXIpIHtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwcmVtaXVtJywge1xuICAgICAgICB1cmw6ICcvcHJlbWl1bScsXG4gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnByZW1pdW0uaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdQcmVtaXVtQ29udHJvbGxlciBhcyBwcmVtaXVtJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG59KTsiLCJhcHAuY29uZmlnKGZ1bmN0aW9uKCRzdGF0ZVByb3ZpZGVyLCAkbG9jYXRpb25Qcm92aWRlciwgJHVybFJvdXRlclByb3ZpZGVyKSB7XG5cbiAgICAkbG9jYXRpb25Qcm92aWRlci5odG1sNU1vZGUodHJ1ZSk7XG5cbiAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvY29tcGV0aXRpb25zJyk7XG5cbiAgICBpZihsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgndXNlcicpKVxuICAgIHtcbiAgICAgICAgJHVybFJvdXRlclByb3ZpZGVyLm90aGVyd2lzZSgnL2NvbXBldGl0aW9ucycpO1xuICAgIH1cbiAgICBlbHNlXG4gICAge1xuICAgICAgICAkdXJsUm91dGVyUHJvdmlkZXIub3RoZXJ3aXNlKCcvYXV0aC9yZWdpc3RlcicpO1xuICAgIH1cblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdyb290Jywge1xuICAgICAgICBhYnN0cmFjdDogdHJ1ZSxcbiAgICAgICAgdmlld3M6e1xuICAgICAgICAgICAgJ25hdmlnYXRpb25AJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLm5hdmlnYXRpb24nXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdwdWJsaWMnLCB7XG4gICAgICAgIGFic3RyYWN0OiB0cnVlLFxuICAgICAgICB2aWV3czp7XG4gICAgICAgICAgICAnbmF2aWdhdGlvbkAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvcHVibGljdmlld3MvbmF2aWdhdGlvbidcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ2Rhc2hib2FyZCcsIHtcbiAgICAgICAgdXJsOiAnLycsXG4gICAgICAgIHBhcmVudDogJ3Jvb3QnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ2NvbnRlbnRAJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLmRhc2hib2FyZCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogJ0Rhc2hib2FyZENvbnRyb2xsZXInXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzJywge1xuICAgICAgICB1cmw6ICcvc2V0dGluZ3MnLFxuICAgICAgICBwYXJlbnQ6ICdyb290JyxcbiAgICAgICAgYWJzdHJhY3Q6IHRydWUsXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWUsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnY29udGVudEAnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MuaW5kZXgnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6ICdTZXR0aW5nc0NvbnRyb2xsZXInLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXJBczogJ3NldHRpbmdzJ1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2V0dGluZ3MuaW5kZXgnLCB7XG4gICAgICAgIHVybDonLycsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnc2V0dGluZyc6IHtcbiAgICAgICAgICAgICAgICBjb250cm9sbGVyOiBmdW5jdGlvbigkc3RhdGUpe1xuICAgICAgICAgICAgICAgICAgICAkc3RhdGUuZ28oJ3NldHRpbmdzLnVzZXInKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuICAgICRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzZXR0aW5ncy51c2VyJywge1xuICAgICAgICB1cmw6ICcvdXNlcicsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnc2V0dGluZyc6e1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLnVzZXInLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiVXNlclByb2ZpbGVDb250cm9sbGVyIGFzIHVzZXJwcm9maWxlXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLmVkaXRwcm9maWxlJywge1xuICAgICAgICB1cmw6ICcvZWRpdHByb2ZpbGUnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOiB7XG4gICAgICAgICAgICAgICAgdGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2V0dGluZ3MudXNlcmVkaXQnLFxuICAgICAgICAgICAgICAgIGNvbnRyb2xsZXI6IFwiVXNlclByb2ZpbGVDb250cm9sbGVyIGFzIHVzZXJwcm9maWxlXCJcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgcmVzdHJpY3RlZDogdHJ1ZVxuICAgIH0pO1xuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLmNhbmNlbGFjY291bnQnLCB7XG4gICAgICAgIHVybDogJy9jYW5jZWxhY2NvdW50JyxcbiAgICAgICAgdmlld3M6IHtcbiAgICAgICAgICAgICdzZXR0aW5nJzoge1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLmNhbmNlbGFjY291bnQnXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxuXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLnBhc3N3b3JkJywge1xuICAgICAgICB1cmw6ICcvcGFzc3dvcmQnLFxuICAgICAgICB2aWV3czoge1xuICAgICAgICAgICAgJ3NldHRpbmcnOntcbiAgICAgICAgICAgICAgICB0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zZXR0aW5ncy5wYXNzd29yZCcsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogXCJQYXNzd29yZENvbnRyb2xsZXIgYXMgcGFzc3dvcmRcIlxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICByZXN0cmljdGVkOiB0cnVlXG4gICAgfSk7XG4gICAgXG4gICAgJHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NldHRpbmdzLmludml0ZScsIHtcbiAgICAgICAgdXJsOiAnL2ludml0ZScsXG4gICAgICAgIHZpZXdzOiB7XG4gICAgICAgICAgICAnc2V0dGluZyc6e1xuICAgICAgICAgICAgICAgIHRlbXBsYXRlVXJsOiAnL3ZpZXdzL3BhcnRpYWxzLnNldHRpbmdzLmludml0ZScsXG4gICAgICAgICAgICAgICAgY29udHJvbGxlcjogXCJJbnZpdGVDb250cm9sbGVyIGFzIGludml0ZVwiXG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlc3RyaWN0ZWQ6IHRydWVcbiAgICB9KTtcblxufSk7IiwiYXBwLmNvbmZpZyhmdW5jdGlvbigkc3RhdGVQcm92aWRlciwgJGxvY2F0aW9uUHJvdmlkZXIsICR1cmxSb3V0ZXJQcm92aWRlcikge1xuXG5cblx0JHN0YXRlUHJvdmlkZXIuc3RhdGUoJ3NpZ251cHMnLCB7XG5cdFx0dXJsOiAnL3NpZ251cHMnLFxuXHRcdHBhcmVudDogJ3Jvb3QnLFxuXHRcdHZpZXdzOntcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2lnbnVwcy5pbmRleCcsXG5cdFx0XHRcdGNvbnRyb2xsZXI6ICdTaWdudXBzQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ3NpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXHQkc3RhdGVQcm92aWRlci5zdGF0ZSgnc2lnbnVwJywge1xuXHRcdHVybDogJy9zaWdudXAvOmlkJyxcblx0XHRwYXJlbnQ6ICdyb290Jyxcblx0XHR2aWV3czoge1xuXHRcdFx0J2NvbnRlbnRAJzoge1xuXHRcdFx0XHR0ZW1wbGF0ZVVybDogJy92aWV3cy9wYXJ0aWFscy5zaWdudXBzLnNob3cnLFxuXHRcdFx0XHRjb250cm9sbGVyOiAnU2lnbnVwQ29udHJvbGxlcicsXG5cdFx0XHRcdGNvbnRyb2xsZXJBczogJ3NpZ251cHMnXG5cdFx0XHR9XG5cdFx0fSxcblx0XHRyZXN0cmljdGVkOiB0cnVlXG5cdH0pO1xuXG5cdCRzdGF0ZVByb3ZpZGVyLnN0YXRlKCdzaWdudXAuZWRpdCcsIHtcblx0XHR1cmw6ICcvZWRpdCcsXG5cdFx0dmlld3M6IHtcblx0XHRcdCdjb250ZW50QCc6IHtcblx0XHRcdFx0dGVtcGxhdGVVcmw6ICcvdmlld3MvcGFydGlhbHMuc2lnbnVwcy5lZGl0Jyxcblx0XHRcdFx0Y29udHJvbGxlcjogJ1NpZ251cENvbnRyb2xsZXInLFxuXHRcdFx0XHRjb250cm9sbGVyQXM6ICdzaWdudXBzJ1xuXHRcdFx0fVxuXHRcdH0sXG5cdFx0cmVzdHJpY3RlZDogdHJ1ZVxuXHR9KTtcblxufSk7IiwiYXBwLmZpbHRlcignY3V0U3RyaW5nJywgZnVuY3Rpb24gKCkge1xuICAgIHJldHVybiBmdW5jdGlvbiAodmFsdWUsIHdvcmR3aXNlLCBtYXgsIHRhaWwpIHtcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuICcnO1xuXG4gICAgICAgIG1heCA9IHBhcnNlSW50KG1heCwgMTApO1xuICAgICAgICBpZiAoIW1heCkgcmV0dXJuIHZhbHVlO1xuICAgICAgICBpZiAodmFsdWUubGVuZ3RoIDw9IG1heCkgcmV0dXJuIHZhbHVlO1xuXG4gICAgICAgIHZhbHVlID0gdmFsdWUuc3Vic3RyKDAsIG1heCk7XG4gICAgICAgIGlmICh3b3Jkd2lzZSkge1xuICAgICAgICAgICAgdmFyIGxhc3RzcGFjZSA9IHZhbHVlLmxhc3RJbmRleE9mKCcgJyk7XG4gICAgICAgICAgICBpZiAobGFzdHNwYWNlICE9IC0xKSB7XG4gICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZS5zdWJzdHIoMCwgbGFzdHNwYWNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZSArICh0YWlsIHx8ICfigKYnKTtcbiAgICB9O1xufSk7XG4iLCJhcHAuZmlsdGVyKCdkYXRlVG9JU08nLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgaWYoaW5wdXQgIT09IHVuZGVmaW5lZCAmJiBpbnB1dCAhPT0gbnVsbCl7XG4gICAgICAgICAgICB2YXIgYSA9IGlucHV0LnNwbGl0KC9bXjAtOV0vKTtcbiAgICAgICAgICAgIHZhciBkPW5ldyBEYXRlIChhWzBdLGFbMV0tMSxhWzJdLGFbM10sYVs0XSxhWzVdICk7XG4gICAgICAgICAgICByZXR1cm4gbmV3IERhdGUoZCkudG9JU09TdHJpbmcoKTtcbiAgICAgICAgfVxuICAgIH07XG59KTsiLCJhcHAuZmlsdGVyKCdleGNsdWRlQnlJZHMnLCBmdW5jdGlvbiAoKSB7XG4gICAgcmV0dXJuIGZ1bmN0aW9uKGlucHV0cyxmaWx0ZXJWYWx1ZXMpIHtcbiAgICAgICAgdmFyIG91dHB1dCA9IFtdO1xuICAgICAgICBhbmd1bGFyLmZvckVhY2goaW5wdXRzLCBmdW5jdGlvbiAoaW5wdXQpIHtcbiAgICAgICAgICAgIGlmIChmaWx0ZXJWYWx1ZXMuaW5kZXhPZihpbnB1dC5pZCkgPT0gLTEpXG4gICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goaW5wdXQpO1xuICAgICAgICB9KTtcbiAgICAgICAgcmV0dXJuIG91dHB1dDtcbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcignaXNFbXB0eScsIFtmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24ob2JqZWN0KSB7XG4gICAgICAgIHJldHVybiBhbmd1bGFyLmVxdWFscyh7fSwgb2JqZWN0KTtcbiAgICB9O1xufV0pOyIsImFwcC5maWx0ZXIoJ251bScsIGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICByZXR1cm4gcGFyc2VJbnQoaW5wdXQsIDEwKTtcbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcigncmFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oaW5wdXQsIHN0YXJ0LCBlbmQpIHtcbiAgICAgICAgc3RhcnQgPSBwYXJzZUludChzdGFydCk7XG4gICAgICAgIGVuZCA9IHBhcnNlSW50KGVuZCk7XG4gICAgICAgIHZhciBpO1xuICAgICAgICBpZihzdGFydCA8IGVuZCl7XG4gICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk8ZW5kOyBpKyspXG4gICAgICAgICAgICAgICAgaW5wdXQucHVzaChpKTtcbiAgICAgICAgfWVsc2V7XG4gICAgICAgICAgICBmb3IgKGk9c3RhcnQ7IGk+ZW5kOyBpLS0pXG4gICAgICAgICAgICAgICAgaW5wdXQucHVzaChpKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gaW5wdXQ7XG4gICAgfTtcbn0pOyIsImFwcC5maWx0ZXIoJ3JlbmRlckhUTUxDb3JyZWN0bHknLCBmdW5jdGlvbigkc2NlKVxue1xuICAgIHJldHVybiBmdW5jdGlvbihzdHJpbmdUb1BhcnNlKVxuICAgIHtcbiAgICAgICAgcmV0dXJuICRzY2UudHJ1c3RBc0h0bWwoc3RyaW5nVG9QYXJzZSk7XG4gICAgfTtcbn0pO1xuIiwiYXBwLmZpbHRlcignc3VtQnlLZXknLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSwga2V5KSB7XG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZihrZXkpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgc3VtID0gMDtcbiAgICAgICAgZm9yICh2YXIgaSA9IGRhdGEubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgICAgIHN1bSArPSBwYXJzZUludChkYXRhW2ldW2tleV0pO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN1bTtcbiAgICB9O1xufSk7IiwiYXBwLmZpbHRlcignc3VtVG90YWxMZW5ndGgnLCBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gZnVuY3Rpb24oZGF0YSwga2V5KSB7XG4gICAgICAgIGlmICh0eXBlb2YoZGF0YSkgPT09ICd1bmRlZmluZWQnIHx8IHR5cGVvZihrZXkpID09PSAndW5kZWZpbmVkJykge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN1bSA9IDA7XG4gICAgICAgIGFuZ3VsYXIuZm9yRWFjaChkYXRhLCBmdW5jdGlvbihpdGVtLCBpbmRleCl7XG4gICAgICAgICAgICBpZihpdGVtW2tleV0ubGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgc3VtICs9IHBhcnNlSW50KGl0ZW1ba2V5XS5sZW5ndGgpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gc3VtO1xuICAgIH07XG59KTsiXSwic291cmNlUm9vdCI6Ii9zb3VyY2UvIn0=
