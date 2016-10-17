var slbApp = angular.module('slbApp', ['ui.router']);
slbApp.constant("AUTH_EVENTS", {
	notAuthenticated: 'auth-not-authenticated'
})
slbApp.constant('API_ENDPOINT', {
  url: 'https://slbtimesheet.appspot.com/_ah/api/timesheet/v2'
});
slbApp.service('AuthService', function($q, $http, API_ENDPOINT) {
  var LOCAL_TOKEN_KEY = 'yourTokenKey';
  var LOCAL_USER_ROLE = 'userRole';
  var isAuthenticated = false;
  var authToken;
  function loadUserCredentials() {
    var token = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (token) {
      useCredentials(token);
    }
  }
  function storeUserCredentials(token, role) {
    window.localStorage.setItem(LOCAL_TOKEN_KEY, token);
	window.localStorage.setItem(LOCAL_USER_ROLE, role);
    useCredentials(token);
  }
  function useCredentials(token) {
    isAuthenticated = true;
    authToken = token;
    // Set the token as header for your requests!
    $http.defaults.headers.common.Authorization = authToken;
  }
  function destroyUserCredentials() {
    authToken = undefined;
    isAuthenticated = false;
    $http.defaults.headers.common.Authorization = undefined;
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
	window.localStorage.removeItem(LOCAL_USER_ROLE);
  }
  
  
  var signup = function(user) {
	  
	  return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/signup', user).then(function(result) {
		 
        if (result.data.success) {
          resolve(result.data.msg);
        } else {
          reject(result.data.msg);
        }
      });
    });
	  
  }

 var approveOrReject = function(timeSheet) {
	  
	   return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/approveorreject', timeSheet).then(function(result) {
        if (result.data.success) {
          resolve(result.data);
        } else {
          reject(result.data.msg);
        }
      });
    });
  }
  
  
  
  var saveTimeSheet = function(timeSheet) {
	  
	   return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/savetimesheet', timeSheet).then(function(result) {
        if (result.data.success) {
          resolve(result.data);
        } else {
          reject(result.data.msg);
        }
      });
    });
  }
  
  
  var getTimeSheet = function(query) {
	  return $q(function(resolve, reject) {
      $http.get(API_ENDPOINT.url + '/getTimeSheet?'+query).then(function(result) {
        if (result.data.success) {
          resolve(result.data.timesheet);
        } else {
          reject(result.data.msg);
        }
      });
    });
  }

  var getPendingTS = function(){
	return $q(function(resolve, reject) {
      $http.get(API_ENDPOINT.url + '/getPendingTS').then(function(result) {
	
        if (result.data.success) {
          resolve(result.data);
        } else {
          reject(result.data.msg);
        }
      });
    });

  }
  
  var login = function(user) {
	  
    return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/authenticate', user).then(function(result) {
		  console.log(result);
        if (result.data.success) {
          storeUserCredentials(result.data.token, result.data.role);
          resolve(result.data.msg);
        } else {
          reject(result.data.msg);
        }
      });
    });
  };
  
  var isManager = function() {
		var role = window.localStorage.getItem(LOCAL_USER_ROLE);
		return (role=="manager") ? true: false;
	}
  
  var logout = function() {
    destroyUserCredentials();
  };
  loadUserCredentials();
  return {
	approveOrReject: approveOrReject,
    getPendingTS : getPendingTS,
	getTimeSheet : getTimeSheet,
	saveTimeSheet : saveTimeSheet,
	signup: signup,
    login: login,
    logout: logout,
    isAuthenticated: function() {return isAuthenticated;},
	isManager: isManager,
  };
})
slbApp.factory('AuthInterceptor', function ($rootScope, $q, AUTH_EVENTS) {
  return {
    responseError: function (response) {
      $rootScope.$broadcast({
        401: AUTH_EVENTS.notAuthenticated,
      }[response.status], response);
      return $q.reject(response);
    }
  };
})
slbApp.config(function ($httpProvider) {
  $httpProvider.interceptors.push('AuthInterceptor');
});
slbApp.config(function($stateProvider){
	$stateProvider.state('login', {
		url:'/',
		templateUrl:'../views/login.html',
		controller:'loginController'
	})
	
	$stateProvider.state('adduser', {
		url:'/adduser',
		templateUrl:'../views/adduser.html'
		
	})

	$stateProvider.state('approve', {
		url:'/toapprove',
		templateUrl:'../views/toapprove.html'
	})
	
	$stateProvider.state('dashboard', {
		url:'/dashboard',
		templateUrl:'../views/dashboard.html',
	})
})
// Initial App Controller
slbApp.controller('appController', function($scope, AuthService, $state){
	if(AuthService.isAuthenticated()) {
		$state.go('dashboard');
	}
	else {
		$state.go('login');
	}
});
// Login Controller
slbApp.controller('loginController', function($scope, AuthService, $state) {

 // If user is already authenticated go to his dashboard
if(AuthService.isAuthenticated()) {
   $state.go('dashboard');
}

  $scope.user = {
    username: '',
    password: ''
  };
  console.log("scope", $scope);
  $scope.login = function() {
    AuthService.login($scope.user).then(function(msg) {
	  console.log("Logged In.. " ,  msg);
	   window.localStorage.setItem("loggedusername", $scope.user.username);
	  $state.go('dashboard');
    }, function(errMsg) {
		console.log("Login Failed ");
    });
  };
});
// Logout Controller
slbApp.controller('logoutController', function($scope, AuthService, $state) {
	$scope.logout = function() {
		AuthService.logout();
		$state.go('login');
	};
})



// * Add User Controller */

slbApp.controller('adduserController', function($scope, AuthService, $state, $http) {
	$scope.signup = function() {
	AuthService.signup($scope.user).then(function(){
		console.log("Successfull Signed Up")
	});	
	};
})


slbApp.controller('tsApprovalController', function($scope, $sce, $http, API_ENDPOINT, AuthService, $state, $compile) {

 // Get Pending Timesheets 

 if(AuthService.isAuthenticated() && AuthService.isManager()) {



	$scope.approve = function() {

		approveOrRejectTimeSheet('approved')

	}

	$scope.reject = function() {

		approveOrRejectTimeSheet('rejected')

	}


	$scope.showTimeSheet = function($e) {
		
		console.log('sss');
		$scope.weekNo = ($e.target.attributes['data-week'].value);
		$scope.month = ($e.target.attributes['data-month'].value);
		
		
		
		updateScreenWithTimeSheet(2016, $scope.month, $scope.weekNo);

	}
	
	// Get Pending TimeSheets for Manager
	AuthService.getPendingTS().then(function(data){
		$scope.pendingTimeSheets = data.timesheets;
		

		$scope.timeSheetUser = "";
		$scope.pendingTSUsersHTML = "<ul class='list'>";
        $scope.pendingTimeSheetUsers = [];
		$scope.pendingWeeklyTimeSheets = []; // Map user to weekly timesheet
		
		// Fill the User's Column
		for(var i=0,len=$scope.pendingTimeSheets.length; i<len; i++){
			var ts = $scope.pendingTimeSheets[i];
			
			if($scope.pendingTimeSheetUsers.indexOf(ts.username) <= -1){
				$scope.pendingTimeSheetUsers.push(ts.username);	
				$scope.pendingTSUsersHTML = $scope.pendingTSUsersHTML +"<li>" + ts.username+ "</li>";
			}

		}
		var element = angular.element(document.querySelector('.usernames-holder'));
		$scope.pendingTSUsersHTML = $sce.trustAsHtml($scope.pendingTSUsersHTML +"</ul>");
		var generated = element.html($scope.pendingTSUsersHTML);
		$compile(generated.contents())($scope);


		// Fill the Weekly Column
        // Take the first user to get his weekly timesheets
		$scope.pendingTSWeeksHTML =  "<ul class='list'>";
		$scope.timeSheetUser = $scope.pendingTimeSheetUsers[0];
		for(var i=0,len=$scope.pendingTimeSheets.length; i<len; i++){
			var ts = $scope.pendingTimeSheets[i];
			
			if(ts.username==$scope.timeSheetUser){
				var stDate = getStartDate(2016, ts.month, ts.weekno -1);
				var enDate = getEndDate(2016, ts.month, ts.weekno -1 );

				
				$scope.pendingTSWeeksHTML = $scope.pendingTSWeeksHTML + "<button ng-click='showTimeSheet($event)' class='list-group-item ' data-week='"+ts.weekno+"' data-month='"+ts.month+"'>" + addZero(stDate.getDate()) + " " + (month[stDate.getMonth()]) + " - "+ addZero(enDate.getDate())+" "+ (month[enDate.getMonth()])+"</button>";

			}

		}
		var element = angular.element(document.querySelector('.weekly-ts-holder'));
		$scope.pendingTSWeeksHTML = $sce.trustAsHtml($scope.pendingTSWeeksHTML +"</ul>");
		var generated = element.html($scope.pendingTSWeeksHTML);
		$compile(generated.contents())($scope);

		// Fill the timesheet content
		for(var i=0,len=$scope.pendingTimeSheets.length; i<len; i++){
			var ts = $scope.pendingTimeSheets[i];
			
			if(ts.username==$scope.timeSheetUser ){
				$scope.timesheet = ts;
			}

		}
		


	})
		
	}
	else {
		$state.go('login');
	}
	

/* Helper function to load the window time sheet */
	function updateScreenWithTimeSheet( year, month, week) {		
		for(var i=0,len=$scope.pendingTimeSheets.length; i<len; i++){
			var ts = $scope.pendingTimeSheets[i];

			if(ts.username==$scope.timeSheetUser && year == ts.year && month == ts.month && week == ts.weekno){
				
				$scope.timesheet = ts;
			}

		}
	}

function approveOrRejectTimeSheet(stat) {
		
		if(stat == null || typeof stat == "undefined") {
			// Do nothing if there is no status.
			return;
		}
		
		// TODO: Validate all the inputs of hours
		var timeSheet = {};
		timeSheet.username = $scope.timesheet.username
        timeSheet.weekno = $scope.timesheet.weekno;
		timeSheet.month = $scope.timesheet.month;	
        timeSheet.year = $scope.timesheet.year;  
		timeSheet.status = stat;
		
		var obj = {}
		obj.timesheet = timeSheet;
		if(AuthService.isAuthenticated()) {
			// time sheet action 
			console.log(stat + " TimeSheet");
			AuthService.approveOrReject(obj).then(function(data){
			
			console.log(data);
			


			});


		}
		else {
			$state.go('login');
		}
		
	}


})






var month = new Array();
month[0] = "Jan";
month[1] = "Feb";
month[2] = "Mar";
month[3] = "Apr";
month[4] = "May";
month[5] = "Jun";
month[6] = "Jul";
month[7] = "Aug";
month[8] = "Sep";
month[9] = "Oct";
month[10] = "Nov";
month[11] = "Dec";
function addZero(number) {
	if(number < 10) {
		return "0" + number;
	}
	return number;
}
slbApp.controller('tsController', function($scope, $sce, $http, API_ENDPOINT, AuthService, $state, $compile) {

	/* Checking Pending Timesheets if the user is manager */
    $scope.isManager = false;
	$scope.weekNo = 1;
	$scope.currentMonth = 10;
	$scope.currentYear = 2016;
	
	$scope.tsChooseMonth = function($e) {
		
		$scope.currentMonth = ($e.target.attributes['data-month'].value);
		
		// Make default week as "1" for chosen month
		$scope.weekNo = 1;
		
		buildWeeksMenu();
		updateScreenWithTimeSheet();
	}

	$scope.moveState = function(state) {

		$state.go('approve');
	}
	
    // For any week selection, show the corresponding timesheet
	$scope.showTimeSheet = function($e) {
		$scope.weekNo = ($e.target.attributes['data-week'].value);
		// Using jquery to add or remove classes
		$(".list-group-item.active").removeClass('active');
		$($e.target).addClass('active');
		
		updateScreenWithTimeSheet();
	}
	
	$scope.tsCancel = function() {
		saveOrSubmitTimeSheet("cancelled");
	}
	
	$scope.tsSubmit = function() {
		saveOrSubmitTimeSheet("submitted");
	}
	
	$scope.tsSave = function() {
		saveOrSubmitTimeSheet("saved");
	}
	
	
	$scope.username = window.localStorage.getItem("loggedusername");
	$scope.weeksHTML = "";

	// If user is authenticated 
	if(AuthService.isAuthenticated()) {
		//Load weeks menu for the current month
		buildWeeksMenu();
		// Load Main Window // Query for one, if not load the default 
		updateScreenWithTimeSheet();

		if(AuthService.isManager()) {
			$scope.isManager = true;
			// Get Pending TimeSheets for Manager
			AuthService.getPendingTS().then(function(data){
				$scope.pendingTS= data.timesheets.length;
			})
		}
	}
	else {
		console.log('logoput');
		$state.go('login');
	}
	
	
	function saveOrSubmitTimeSheet(stat) {
		
		if(stat == null || typeof stat == "undefined") {
			// Do nothing if there is no status.
			return;
		}
		
		// TODO: Validate all the inputs of hours
		var timeSheet = {};
		timeSheet.username = $scope.username;
		timeSheet.weekno = $scope.weekNo;
		timeSheet.month = $scope.currentMonth;
		timeSheet.year = $scope.currentYear;
		timeSheet.status = stat;
		timeSheet.projects = $scope.timesheet.projects;
		
		var obj = {}
		obj.timesheet = timeSheet;
		if(AuthService.isAuthenticated()) {
			// time sheet action 
			console.log(stat + " TimeSheet");
			AuthService.saveTimeSheet(obj).then(function(data){
				$scope.timesheet = data.timesheet;
			});


		}
		else {
			$state.go('login');
		}
		
	}

	
	
	
	/* Helper function to load the window time sheet */
	function updateScreenWithTimeSheet() {
		var query = "year="+$scope.currentYear+"&month="+$scope.currentMonth+"&week="+$scope.weekNo;
		AuthService.getTimeSheet(query).then(function(timesheet){
			if(timesheet == null || typeof timesheet == "undefined" || timesheet.length <=0) {
				
				/* Load a default template, In production, this has to be fetched by */
				$scope.timesheet = defaultTS;
			}
			else {
				console.log(timesheet[0]);
				$scope.timesheet = (timesheet[0]);	
			}
		});
	}
	
	
	/* Helper function to list the weeks on the leftside */
	function buildWeeksMenu () {
		// Load left timesheets
		console.log("Buuilding weeks for the month " + $scope.currentMonth)
		var currentYear = $scope.currentYear;
		var currentMonth = $scope.currentMonth;
		var numberOfWeeks = (getNumberOfWeeks(currentYear, currentMonth));
		$scope.weeksHTML = "<div class='list-group'>";
		for(var i=1; i<=numberOfWeeks; i++)
		{
			var stDate = getStartDate(currentYear, currentMonth, i-1);
			var enDate = getEndDate(currentYear, currentMonth, i-1);
			var activeClass="";
            if($scope.weekNo == i) {
				activeClass = "active";
			}

			$scope.weeksHTML = $scope.weeksHTML + "<button ng-click='showTimeSheet($event)' class='list-group-item "+activeClass+"' data-week='"+i+"'>" + addZero(stDate.getDate()) + " " + (month[stDate.getMonth()]) + " - "+ addZero(enDate.getDate())+" "+ (month[enDate.getMonth()])+"</button>";
		}
		
		 var element = angular.element(document.querySelector('#weeksMenu'));
		 
		$scope.weeksHTML = $sce.trustAsHtml($scope.weeksHTML + "</div> ");
		
		var generated = element.html($scope.weeksHTML);
		$compile(generated.contents())($scope);
		
	}
	
	
})

var task1 = {};
task1.name="ADM Configuration";
task1.monHours = 0;
task1.tueHours = 0;
task1.wedHours = 0;
task1.thuHours = 0;
task1.friHours = 0;
task1.satHours = 0;
task1.sunHours = 0;

var task2 = {};


task2.name=" Defect Prevention"
task2.monHours = 0;
task2.tueHours = 0;
task2.wedHours = 0;
task2.thuHours = 0;
task2.friHours = 0;
task2.satHours = 0;
task2.sunHours = 0;


var task3 = {};


task3.name=" ADM Configuration"
task3.monHours = 0;
task3.tueHours = 0;
task3.wedHours = 0;
task3.thuHours = 0;
task3.friHours = 0;
task3.satHours = 0;
task3.sunHours = 0;


var task4 = {};


task4.name=" Defect Prevention"
task4.monHours = 0;
task4.tueHours = 0;
task4.wedHours = 0;
task4.thuHours = 0;
task4.friHours = 0;
task4.satHours = 0;
task4.sunHours = 0;

var project1 = {};
project1.name = "proj 1"
project1.tasks = [task1, task2];

var project2 = {};
project2.name = "proj 2"
project2.tasks = [task3, task4];


var defaultTS = {}
defaultTS.projects = [project1, project2];
defaultTS.status="yet to save";


var defTimeSheet = '<div class="panel panel-default"><form class="form"><table class="table table-striped "><thead ng-bind-html class="text-center"><th>Project</th><th class="text-center">Task</th><th>Mon 26 </th><th>Tue 27 </th><th>Wed 28 </th><th>Thu 29 </th><th>Fri 30 </th><th>Sat 01 </th><th>Sun 02 </th></thead><tbody><tr><td valign="middle" class="vertical-center " style="vertical-align: middle;" rowspan="2"><b>Proj_1</b></td><td>Adm Configuration 1</td><td><input type="text" name="mon" size="3"></td><td><input type="text" name="tue" size="3"></td><td><input type="text" name="wed" size="3"></td><td><input type="text" name="thu" size="3"></td><td><input type="text" name="fri" size="3"></td><td><input type="text" name="sat" size="3"></td><td><input type="text" name="sun" size="3"></td></tr><tr><td>Defect Prevention 1</td><td><input type="text" name="mon" size="3"></td><td><input type="text" name="tue" size="3"></td><td><input type="text" name="wed" size="3"></td><td><input type="text" name="thu" size="3"></td><td><input type="text" name="fri" size="3"></td><td><input type="text" name="sat" size="3"></td><td><input type="text" name="sun" size="3"></td></tr><tr><td valign="middle" class="vertical-center " style="vertical-align: middle;" rowspan="2"><b>Proj_2</b></td><td>Adm Configuration 2</td><td><input type="text" name="mon" size="3"></td><td><input type="text" name="tue" size="3"></td><td><input type="text" name="wed" size="3"></td><td><input type="text" name="thu" size="3"></td><td><input type="text" name="fri" size="3"></td><td><input type="text" name="sat" size="3"></td><td><input type="text" name="sun" size="3"></td></tr><tr><td>Defect Prevention 2</td><td><input type="text" name="mon" size="3"></td><td><input type="text" name="tue" size="3"></td><td><input type="text" name="wed" size="3"></td><td><input type="text" name="thu" size="3"></td><td><input type="text" name="fri" size="3"></td><td><input type="text" name="sat" size="3"></td><td><input type="text" name="sun" size="3"></td></tr><tr><td valign="middle" class="vertical-center " style="vertical-align: middle;" rowspan="2"><b>Proj_3</b></td><td>Adm Configuration 3</td><td><input type="text" name="mon" size="3"></td><td><input type="text" name="tue" size="3"></td><td><input type="text" name="wed" size="3"></td><td><input type="text" name="thu" size="3"></td><td><input type="text" name="fri" size="3"></td><td><input type="text" name="sat" size="3"></td><td><input type="text" name="sun" size="3"></td></tr><tr><td>Defect Prevention 3</td><td><input type="text" name="mon" size="3"></td><td><input type="text" name="tue" size="3"></td><td><input type="text" name="wed" size="3"></td><td><input type="text" name="thu" size="3"></td><td><input type="text" name="fri" size="3"></td><td><input type="text" name="sat" size="3"></td><td><input type="text" name="sun" size="3"></td></tr><tbody></table></form></div> <div class="pull-right"><button class="btn btn-default">Save</button> <button class="btn btn-primary">Submit</button></div>';
function getStartDate(year, month_number, week_number) {
	var date = new Date();
	date.setYear(year);
	date.setMonth(month_number-1);
	date.setDate(week_number * 7);
	//console.log(date.getcurrentWeekMonday());
	return date.getcurrentWeekMonday();
}
function getEndDate(year, month_number, week_number) {
	var date = new Date();
	date.setYear(year);
	date.setMonth(month_number-1);
	date.setDate(week_number * 7);
	//console.log(date.getcurrentWeekSunday());
	return date.getcurrentWeekSunday();
}
Date.prototype.getcurrentWeekMonday = function() {
    var d = new Date(this.getTime());
    var diff = d.getDate() - d.getDay() + 1;
    if (d.getDay() == 0)
        diff -= 7;
    //diff += 7; // ugly hack to get next monday instead of current one
    return new Date(d.setDate(diff));
};
Date.prototype.getcurrentWeekSunday = function() {
    var d = new Date(this.getTime());
    var diff = d.getDate() - d.getDay() + 7;
    if (d.getDay() == 0)
        diff -= 7;
    //diff += 7; // ugly hack to get next monday instead of current one
    return new Date(d.setDate(diff));
};

function getNumberOfWeeks(year, month_number) {
    var firstOfMonth = new Date(year, month_number-1, 1);
    var lastOfMonth = new Date(year, month_number, 0);
    var used = firstOfMonth.getDay() + lastOfMonth.getDate();
    return Math.ceil( used / 7);
}