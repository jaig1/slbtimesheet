'use strict';

var app = angular.module('myTimeSheetApp', [ 'ngRoute' ]);
app.constant("AUTH_EVENTS", {
  notAuthenticated : 'auth-not-authenticated'
})
app.constant('API_ENDPOINT', {
  url: 'https://slbtimesheet.appspot.com/_ah/api/timesheet/v2'
  //url : 'http://localhost:8080/_ah/api/timesheet/v2'
});
app.service('AuthService', function($q, $http, API_ENDPOINT) {
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
      $http.post(API_ENDPOINT.url + '/approveorreject', timeSheet).then(
          function(result) {
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
      $http.post(API_ENDPOINT.url + '/savetimesheet', timeSheet).then(
          function(result) {
            if (result.data.success) {
              resolve(result.data);
            } else {
              reject(result.data.msg);
            }
          });
    });
  }

  var getTimeSheet = function (week, month, year) {
      //https://slbtimesheet.appspot.com/_ah/api/timesheet/v2/getTimeSheet?month=10&week=43&year=2016
      var query = "month=" + month + "&week=" + week + "&year=" + year;
      return $q(function (resolve, reject) {
          $http.get(API_ENDPOINT.url + '/getTimeSheet?' + query).then(
              function (result) {
                  if (result.data.success) {
                      //resolve(result.data.timesheet);                      
                      resolve(result.data.ts);
                  } else {                      
                      reject(result.data.msg);
                  }
              });
      });
  }

  var getPendingTS = function () {
      return $q(function (resolve, reject) {
          $http.get(API_ENDPOINT.url + '/getPendingTS').then(function (result) {

              if (result.data.success) {
                  resolve(result.data.timesheets);
              } else {
                  reject(result.data.msg);
              }
          });
      });

  }

  var login = function(user) {

    return $q(function(resolve, reject) {
      $http.post(API_ENDPOINT.url + '/authenticate', user).then(
          function(result) {
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
    return (role == "manager") ? true : false;
  }

  var getRole = function() {
    return window.localStorage.getItem(LOCAL_USER_ROLE);
  }

  var logout = function() {
    destroyUserCredentials();
  };
  loadUserCredentials();
  return {
    approveOrReject : approveOrReject,
    getPendingTS : getPendingTS,
    getTimeSheet : getTimeSheet,
    saveTimeSheet : saveTimeSheet,
    signup : signup,
    login : login,
    logout : logout,
    isAuthenticated : function() {
      return isAuthenticated;
    },
    isManager : isManager,
    getRole : getRole,
  };
})
/*
 * slbApp.factory('AuthInterceptor', function($rootScope, $q, AUTH_EVENTS) {
 * return { responseError : function(response) { $rootScope.$broadcast({ 401 :
 * AUTH_EVENTS.notAuthenticated, }[response.status], response); return
 * $q.reject(response); } }; }) app.config(function($httpProvider) {
 * $httpProvider.interceptors.push('AuthInterceptor'); });
 */
app.config([ '$routeProvider', function($routeProvider) {
  $routeProvider.when('/', {
    templateUrl : 'Login.html',
    controller : 'LoginController'
  }).when('/home', {
    templateUrl : 'HomePage.html',
    controller : 'DashboardController'
  }).when('/approver', {
    templateUrl : 'Approver.html',
    controller : 'ApproverController'
  }).otherwise({
    redirectTo : '/'
  });
} ]);

app.controller('LoginController', [
    '$scope',
    '$rootScope',
    '$http',
    '$location',
    '$window',
    'myservice',
    'AuthService',
    function($scope, $rootScope, $http, $location, $window, myservice,
        AuthService) {

      $scope.username = myservice.userName;

      $scope.LoadPage = function() {
        $http.get('data/roles.json').success(function(data) {
          $scope.roles = data;
        });
      };
      $scope.selectedItem = "Select Employee";
      $scope.dropboxitemselected = function(item) {
        $scope.selectedItem = item;
        angular.forEach($scope.roles, function(role) {
          if ($scope.selectedItem === role.username) {
            $scope.id = role.employeeId;

            $scope.pass = role.password;

            $scope.role = role.role;

          }
        });
      };
      $scope.user = [];
      $scope.validate = function(username, pwd) {
        $scope.user = {
          username : username,
          password : pwd
        };
        AuthService.login($scope.user).then(function(msg) {
          /*
           * console.log("Logged In.. ", msg); window.localStorage .setItem(
           * "loggedusername", $scope.user.username); $state.go('dashboard');
           */

          $rootScope.employeeId = username;
          $rootScope.user_role = AuthService.getRole();
          myservice.userName = username;
          if ($rootScope.user_role == "manager") {
            myservice.isManager = true;
            myservice.managerName = "DM@infosys.com";
          } else {
            myservice.isManager = false;
            myservice.managerName = "Manager@infosys.com";
          }

          if ($rootScope.employeeId !== "") {
            $window.location.href = "#/home";
          } else {
            alert("Please provide valid login credentials!!!");
            $location.path("#/");
          }
        }, function(errMsg) {
          console.log("Login Failed ");
        });
      };
    } ]);

app.controller('timeSheetCtrl', [ '$rootScope', '$scope', '$http',
    '$routeParams', function($rootScope, $scope, $http, $routeParams) {
      $http.get('data/timeSheet.json').success(function(data) {
        $scope.timeSheet = data;
        console.log(data);
      });
    } ]);

app
    .controller(
        "DashboardController",
        [
            '$scope',
            '$location',
            '$window',
            'myservice',
            'filterFilter',
            '$document',
            '$filter',
            'AuthService',
            function($scope, $location, $window, myservice, filterFilter,
                $document, $filter, AuthService) {

              $scope.visible = false;
              $scope.approver = function() {
                myservice.isApprove = true;
                myservice.isReject = true;
                $window.location.href = "#/approver";
              };

              // $scope.reject = function()
              // {
              // myservice.isApprove = false;
              // myservice.isReject = true;
              // $window.location.href = "#/approver";
              // };

              $scope.visible = false;


              $scope.currDefaultUserTimesheet = [{
                      username: "",
                      weekno: "",
                      month: 0,
                      year: "",
                      status: "",
                      projects: [
                         {
                             name: "ProjectCode1",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                },
                                {
                                    name: "Task2",
                                    description: "Defect prevention Activities",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         },
                         {
                             name: "ProjectCode2",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         },
                         {
                             name: "ProjectCode3",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                },
                                {
                                    name: "Task2",
                                    description: "Defect prevention Activities",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         },
                         {
                             name: "ProjectCode4",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                },
                                {
                                    name: "Task2",
                                    description: "Defect prevention Activities",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         }
                      ]                  
              }];

              //$scope.currDefaultUserTimesheet = [{
              //    "timesheet": {
              //        "username": "ramani_pandiyan@infosys.com",
              //        "weekno": "43",
              //        "month": 10,
              //        "year": "2016",
              //        "status": "submitted",
              //        "projects": [
              //           {
              //               "name": "ProjectCode1",
              //               "tasks": [
              //                  {
              //                      "name": "ADM Configuration",
              //                      "monHours": "0:00",
              //                      "tueHours": "0:00",
              //                      "wedHours": "0:00",
              //                      "thuHours": "0:00",
              //                      "friHours": "0:00",
              //                      "satHours": "0:00",
              //                      "sunHours": "0:00"
              //                  },
              //                  {
              //                      "name": "Defect prevention Activities",
              //                      "monHours": "0:00",
              //                      "tueHours": "0:00",
              //                      "wedHours": "0:00",
              //                      "thuHours": "0:00",
              //                      "friHours": "0:00",
              //                      "satHours": "0:00",
              //                      "sunHours": "0:00"
              //                  }
              //               ]
              //           },
              //           {
              //               "name": "ProjectCode2",
              //               "tasks": [
              //                  {
              //                      "name": "ADM Configuration",
              //                      "monHours": "0:00",
              //                      "tueHours": "0:00",
              //                      "wedHours": "0:00",
              //                      "thuHours": "0:00",
              //                      "friHours": "0:00",
              //                      "satHours": "0:00",
              //                      "sunHours": "0:00"
              //                  }
              //               ]
              //           },
              //           {
              //               "name": "ProjectCode3",
              //               "tasks": [
              //                  {
              //                      "name": "ADM Configuration",
              //                      "monHours": "0:00",
              //                      "tueHours": "0:00",
              //                      "wedHours": "0:00",
              //                      "thuHours": "0:00",
              //                      "friHours": "0:00",
              //                      "satHours": "0:00",
              //                      "sunHours": "0:00"
              //                  },
              //                  {
              //                      "name": "Defect prevention Activities",
              //                      "monHours": "0:00",
              //                      "tueHours": "0:00",
              //                      "wedHours": "0:00",
              //                      "thuHours": "0:00",
              //                      "friHours": "0:00",
              //                      "satHours": "0:00",
              //                      "sunHours": "0:00"
              //                  }
              //               ]
              //           },
              //           {
              //               "name": "ProjectCode4",
              //               "tasks": [
              //                  {
              //                      "name": "ADM Configuration",
              //                      "monHours": "0:00",
              //                      "tueHours": "0:00",
              //                      "wedHours": "0:00",
              //                      "thuHours": "0:00",
              //                      "friHours": "0:00",
              //                      "satHours": "0:00",
              //                      "sunHours": "0:00"
              //                  },
              //                  {
              //                      "name": "Defect prevention Activities",
              //                      "monHours": "0:00",
              //                      "tueHours": "0:00",
              //                      "wedHours": "0:00",
              //                      "thuHours": "0:00",
              //                      "friHours": "0:00",
              //                      "satHours": "0:00",
              //                      "sunHours": "0:00"
              //                  }
              //               ]
              //           }
              //        ]
              //    }
              //}];

              //$scope.projectCode = [ {
              //  projectcodes : "ProjectCode1",
              //  tasks : [ {
              //    code : "task1",
              //    description : "ADM Configuration"
              //  }, {
              //    code : "task2",
              //    description : "Defect prevention Activities"
              //  } ],
              //}, {
              //  projectcodes : "ProjectCode2",
              //  tasks : [ {
              //    code : "task1",
              //    description : "ADM Configuration"
              //  } ]
              //}, {
              //  projectcodes : "ProjectCode3",
              //  tasks : [ {
              //    code : "task1",
              //    description : "ADM Configuration"
              //  }, {
              //    code : "task2",
              //    description : "Defect prevention Activities"
              //  } ]
              //}, {
              //  projectcodes : "ProjectCode4",
              //  tasks : [ {
              //    code : "task1",
              //    description : "ADM Configuration"
              //  }, {
              //    code : "task2",
              //    description : "Defect prevention Activities"
              //  } ]
              //} ];

              //$scope.example = {
              //  value : new Date()
              //};

              //Date.prototype.getWeek = function () {
              //    debugger;
              //    var onejan = new Date(this.getFullYear(), 0, 1);
              //    return Math.ceil((((this - onejan) / 86400000) + onejan.getDay() + 1) / 7);
              //}
              
              //function test() {
              //    alert("hello....");
              //};
              $scope.m_date=new Date();

              $scope.myFunction = function () {
                  //debugger;
                  //alert("hiii");
                  //console.log("$scope.m_date1" + $scope.m_date);
                  //console.log("newdate1" + new Date());
                  //console.log("newdate2" + new Date());
                  //console.log("newdate3" + new Date());
                  //console.log("$scope.m_date2" + $scope.m_date);
                  var todaycurrdate = new Date();
                  $scope.m_date = todaycurrdate;
                  //var weekNumber = ($scope.m_date).getWeek();

                  var weeknewNumber = 0;
                  //var onejan = new Date($scope.m_date.getFullYear(), 0, 1);
                  //weeknewNumber= Math.ceil(((($scope.m_date - onejan) / 86400000) + onejan.getDay() + 1) / 7);

                  //var onejan = new Date($scope.m_date.getFullYear(), 0, 1);
                  //var today = new Date($scope.m_date.getFullYear(), this.getMonth(), this.getDate());
                  //var dayOfYear = ((today - onejan + 1) / 86400000);
                  //weeknewNumber = Math.ceil(dayOfYear / 7);


                  var mDate = new Date($scope.m_date);
                  mDate.setHours(0, 0, 0, 0);
                  // Thursday in current week decides the year.
                  mDate.setDate(mDate.getDate() + 3 - (mDate.getDay() + 6) % 7);
                  // January 4 is always in week 1.
                  var week1 = new Date(mDate.getFullYear(), 0, 4);
                  // Adjust to Thursday in week 1 and count number of weeks from date to week1.
                  weeknewNumber = 1 + Math.round(((mDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);


                  debugger;
                  $('#exampleInput').val(mDate.getFullYear() + "-W" + weeknewNumber);
                  //$scope.m_date = new Date(exampleInput.value);
                  console.log("$scope.m_date3" + $scope.m_date);
                  //console.log("newdate4" + new Date());
                  //$scope.m_date = new Date();
                  //console.log($scope.m_date);
                  $scope.dateChange();
                  //console.log($scope.m_date);
                  //debugger;
                  $scope.m_date = new Date();
                  console.log("todaycurrdate" + todaycurrdate);
                  console.log("$scope.m_date4" + $scope.m_date);
              };

              $scope.dateChange = function () {
                  debugger;
                  //var eve = e;
                  //var weekNumber = (new Date()).getWeek();

                var weeksArray = [];
                // $scope.value = new Date();
                var i = 0;
                var start = 1;
                var day1 = 1000 * 60 * 60 * 24;
                var day2 = $scope.m_date.getDay();
                day2 = $scope.m_date.getDay() - start;

                var date1 = $scope.m_date.getDate();
                date1 = $scope.m_date.getDate() - day2;

                // Grabbing Start/End Dates
                $scope.StartDate = new Date($scope.m_date.setDate(date1));
                $scope.EndDate = new Date($scope.m_date.setDate(date1 + 6));
                $scope.diff = ($scope.EndDate.getTime() - $scope.StartDate.getTime()) / day1;
                var xx = $scope.StartDate.getTime() + day1 * 0;
                var yy = new Date(xx);
                $scope.first = yy;
                var xx1 = $scope.StartDate.getTime() + day1 * 1;
                var yy1 = new Date(xx1);
                $scope.SecondDate = yy1;
                var xx2 = $scope.StartDate.getTime() + day1 * 2;
                var yy2 = new Date(xx2);
                $scope.ThirdDate = yy2;
                var xx3 = $scope.StartDate.getTime() + day1 * 3;
                var yy3 = new Date(xx3);
                $scope.fourthDate = yy3;
                var xx4 = $scope.StartDate.getTime() + day1 * 4;
                var yy4 = new Date(xx4);
                $scope.fifthDate = yy4;
                var xx5 = $scope.StartDate.getTime() + day1 * 5;
                var yy5 = new Date(xx5);
                $scope.sixDate = yy5;
                var xx6 = $scope.StartDate.getTime() + day1 * 6;
                var yy6 = new Date(xx6);
                $scope.EndDate = yy6;

                var preWkStart1 = new Date($scope.first.getTime()
                    - (24 * 7 * 60 * 60 * 1000));
                var preWkEnd1 = new Date($scope.EndDate.getTime()
                    - (24 * 7 * 60 * 60 * 1000));
                var preWkStart2 = new Date($scope.first.getTime()
                    - (24 * 14 * 60 * 60 * 1000));
                var preWkEnd2 = new Date($scope.EndDate.getTime()
                    - (24 * 14 * 60 * 60 * 1000));
                //if (weeksArray.length === 0) {
                //  weeksArray.push($filter('date')(new Date(preWkStart2),
                //      'EEE dd MMM')
                //      + ' - '
                //      + $filter('date')(new Date(preWkEnd2), 'EEE dd MMM'));
                //  weeksArray.push($filter('date')(new Date(preWkStart1),
                //      'EEE dd MMM')
                //      + ' - '
                //      + $filter('date')(new Date(preWkEnd1), 'EEE dd MMM'));
                //  weeksArray.push($filter('date')(new Date(yy),
                //      'EEE dd MMM')
                //      + ' - ' + $filter('date')(new Date(yy6), 'EEE dd MMM'));
                //}

                  //retrival of timesheet for the selected date
                debugger;
                $scope.gettimesheetdata();

              };
              $scope.show = function() {
                $scope.visible = true;
              };
              $scope.hide = function() {
                $scope.visible = false;
              };

              $scope.welcomeUserMsg = myservice.userName;
              $scope.managerName = myservice.managerName;
              $scope.myservice = myservice;
              if (myservice.isManager) {
                $scope.enableButtons = true;
              } else {
                $scope.enableButtons = false;
              }

              $scope.ChangeValue = function(value, row, column, rowIndex,
                  columnIndex) {
                if (value === 1) {
                  $scope.MonValue = $scope.ReturnScopeValues('input#Mon_', row,
                      column);
                }
                if (value === 2) {
                  $scope.TueValue = $scope.ReturnScopeValues('input#Tue_', row,
                      column);
                }
                if (value === 3) {
                  $scope.WedValue = $scope.ReturnScopeValues('input#Wed_', row,
                      column);
                }
                if (value === 4) {
                  $scope.ThuValue = $scope.ReturnScopeValues('input#Thu_', row,
                      column);
                }
                if (value === 5) {
                  $scope.FriValue = $scope.ReturnScopeValues('input#Fri_', row,
                      column);
                }
                if (value === 6) {
                  $scope.SatValue = $scope.ReturnScopeValues('input#Sat_', row,
                      column);
                }
                if (value === 7) {
                  $scope.SunValue = $scope.ReturnScopeValues('input#Sun_', row,
                      column);
                }

                var myEl = angular.element(document.querySelector('input#week_'
                    + rowIndex + '_' + columnIndex));
                myEl.val($scope.ReturnWeekScopeValues(rowIndex, columnIndex));

              };
              $scope.weekTot = "MonValue + TueValue + WedValue + ThuValue + FriValue + SatValue + SunValue";

                //$scope.timeSheetJSON; //RP
              $scope.currUserTimesheet = $scope.currDefaultUserTimesheet[0];
              $scope.disableFields = true;
              //$scope.currUserTimesheet = [];
              $scope.gettimesheetdata = function () {
                  debugger;
                  $scope.disableFields = true;
                  $scope.currUserTimesheet = $scope.currDefaultUserTimesheet[0];
                  debugger;
                  var selweekno = parseInt(exampleInput.value.split("-W")[1]);  //(new Date()).getWeek();

                  //var selweekno = parseInt((new Date($scope.example.value)).getWeek());
                  var selmonth = $scope.m_date.getMonth() + 1;
                  //var selyear = parseInt(exampleInput.value.split("-W")[0]);
                  var selyear = parseInt($scope.m_date.getFullYear());

                  AuthService.getTimeSheet(selweekno, selmonth, selyear).then(function (result) {
                      debugger;
                      if ((result != null) && (result != "")) {
                          alert("Timesheet Successfully Retrieved!!!");
                          $scope.currUserTimesheet = result;
                          if (result.status == "submitted")
                              $scope.disableFields = false;
                      }
                      else {
                          alert("No Timesheet available!!!");
                      }

                      console.log(result);
                  });
              };

              //$scope.getpendingtimesheetdata = function () {                  

              //    AuthService.getPendingTS().then(function (result) {
              //        debugger;
              //        if ((result != null) && (result != ""))
              //            $scope.currUserTimesheet = result;

              //        console.log(result);
              //    });
              //};
              

              $scope.projectsData = [];
              $scope.prjtasksData = [];
              $scope.projectsData1 = [];

              $scope.saveTimesheetData = function (val) {
                  //var abc = $scope.ReturnTotalScopeValues();
                  //console.log(abc);
                  //RP
                  var timesheetStatus = "";

                  if (val == "submit")
                  {
                      timesheetStatus = "submitted";
                  }
                  else {
                      timesheetStatus = "saved";
                  }


                  //RP
                  if ($scope.currUserTimesheet.projects.length > 0) {
                      $scope.projectsData1 = [];

                      for (var i = 0; i < $scope.currUserTimesheet.projects.length; i++) {
                          //$scope.projectsData.push({ name: $scope.projectCode[i].projectcodes });
                          //$scope.projectsData1.push(JSON.parse(JSON.stringify({ name: $scope.projectCode[i].projectcodes })));
                          $scope.prjtasksData = [];
                          for (var j = 0; j < $scope.currUserTimesheet.projects[i].tasks.length; j++) {
                              
                              var mon = "#Mon_" + i + "_" + j;
                              if ((angular.element(mon).val() == "") || (!(angular.element(mon).val())))
                                  mon = "0:00";
                              else
                                  mon = angular.element(mon).val();

                              var tue = "#Tue_" + i + "_" + j;
                              if ((angular.element(tue).val() == "") || (!(angular.element(tue).val())))
                                  tue = "0:00";
                              else
                                  tue = angular.element(tue).val();

                              var wed = "#Wed_" + i + "_" + j;
                              if ((angular.element(wed).val() == "") || (!(angular.element(wed).val())))
                                  wed = "0:00";
                              else
                                  wed = angular.element(wed).val();

                              var thu = "#Thu_" + i + "_" + j;
                              if ((angular.element(thu).val() == "") || (!(angular.element(thu).val())))
                                  thu = "0:00";
                              else
                                  thu = angular.element(thu).val();

                              var fri = "#Fri_" + i + "_" + j;
                              if ((angular.element(fri).val() == "") || (!(angular.element(fri).val())))
                                  fri = "0:00";
                              else
                                  fri = angular.element(fri).val();

                              var sat = "#Sat_" + i + "_" + j;
                              if ((angular.element(sat).val() == "") || (!(angular.element(sat).val())))
                                  sat = "0:00";
                              else
                                  sat = angular.element(sat).val();

                              var sun = "#Sun_" + i + "_" + j;
                              if ((angular.element(sun).val() == "") || (!(angular.element(sun).val())))
                                  sun = "0:00";
                              else
                                  sun = angular.element(sun).val();

                              $scope.prjtasksData.push({
                                  name: $scope.currUserTimesheet.projects[i].tasks[j].name,
                                  description: $scope.currUserTimesheet.projects[i].tasks[j].description,
                                  monHours: mon,
                                  tueHours: tue,
                                  wedHours: wed,
                                  thuHours: thu,
                                  friHours: fri,
                                  satHours: sat,
                                  sunHours: sun
                              });
                          } //tasks

                          $scope.projectsData1.push(JSON.parse(JSON.stringify({
                              name: $scope.currUserTimesheet.projects[i].name,
                              tasks: $scope.prjtasksData
                          })));


                      }


                      //$scope.projectsData.push(JSON.parse(JSON.stringify($scope.cC)));

                      $scope.timeSheetJSON = {
                          timesheet: {
                              username: $scope.welcomeUserMsg,
                              weekno: exampleInput.value.split("-W")[1],
                              month: $scope.m_date.getMonth() + 1,
                              year: exampleInput.value.split("-W")[0],
                              status: timesheetStatus,
                              projects: $scope.projectsData1,
                              comments: angular.element(comment_id).val()
                          }
                      };
                  }
                  //saveTimeSheet(JSON.stringify($scope.timeSheetJSON));
                  AuthService.saveTimeSheet(JSON.stringify($scope.timeSheetJSON)).then(function (msg) {
                      alert("Timesheet Successfully "+timesheetStatus+"!!!");
                      console.log(msg);
                  });
                  //RP
                
              };
              var minTot;
              $scope.ReturnTotalScopeValues = function () {
                  var inputElements = ['input#Mon_', 'input#Tue_', 'input#Wed_', 'input#Thu_', 'input#Fri_', 'input#Sat_', 'input#Sun_'];
                  angular.forEach($scope.currUserTimesheet.projects, function (pc, key1) {
                      angular.forEach(pc.tasks, function (tsk, key) {
                          var weekValues = "";
                          angular.forEach(inputElements, function (ele) {
                              var elements = $document.find(ele + key1 + '_' + key);
                              if (elements.length > 0 && elements[0].value !== "") {
                                  weekValues = weekValues + parseFloat(elements[0].value)
                                      + ";";
                                  var aHHMM = elements[0].value.split(":");

                                  var nMinutes = 0;
                                  nMinutes = aHHMM[0] * 60;
                                  nMinutes += Number(aHHMM[1]);
                                  minTot = minTot + nMinutes;
                                  var nHours = Math.floor(minTot / 60);
                                  var nMinutes = minTot % 60;
                                  weekValues = nHours + ":" + nMinutes;
                              } else {
                                  weekValues = weekValues + ";";
                              }
                          });
                          tsk.value = weekValues;
                      });
                  });
                  return $scope.$scope.currUserTimesheet.projects;
              };

              $scope.ReturnScopeValues = function(elementName, row, col) {
                var elements = [];
                var returnValue = 0;
                var minTot = 0;
                var i = 0;
                for (var i = 0; i < row; i++) {
                  for (var j = 0; j < col; j++) {
                    elements = $document.find(elementName + i + '_' + j);
                    if (elements.length > 0) {
                      angular.forEach(elements, function(ele) {
                        if (ele.value !== "") {
                          var aHHMM = ele.value.split(":");
                          var nMinutes = 0;
                          nMinutes = aHHMM[0] * 60;
                          nMinutes += Number(aHHMM[1]);
                          minTot = minTot + nMinutes;
                          if (minTot > 1440) {
                            alert("Value should not excceed 24 hrs");
                            returnValue = " ";
                          } else {
                            var nHours = Math.floor(minTot / 60);
                            var nMinutes = minTot % 60;
                            returnValue = nHours + ":" + nMinutes;
                          }
                        }
                      });
                    }
                  }
                }
                return returnValue;
              };

              $scope.ReturnWeekScopeValues = function(row, col) {
                var inputElements = [ 'input#Mon_', 'input#Tue_', 'input#Wed_',
                    'input#Thu_', 'input#Fri_', 'input#Sat_', 'input#Sun_' ];
                var returnValue = 0;
                var minTot = 0;
                angular.forEach(inputElements, function(ele) {
                  var elements = $document.find(ele + row + '_' + col);
                  if (elements.length > 0) {
                    if (elements[0].value !== "") {

                      var aHHMM = elements[0].value.split(":");

                      var nMinutes = 0;
                      nMinutes = aHHMM[0] * 60;
                      nMinutes += Number(aHHMM[1]);
                      minTot = minTot + nMinutes;
                      var nHours = Math.floor(minTot / 60);
                      var nMinutes = minTot % 60;
                      returnValue = nHours + ":" + nMinutes;
                    }
                  }
                });

                return returnValue;
              };

            } ]);

app.controller("ApproverController", [
    '$scope',
            '$location',
            '$window',
            'myservice',
            'filterFilter',
            '$document',
            '$filter',
            'AuthService',
            function ($scope, $location, $window, myservice, filterFilter,
                $document, $filter, AuthService) {




                $scope.back = function () {
                    $window.location.href = "#/home";
                };
                $scope.welcomeUserMsg = myservice.userName;
                $scope.myservice = myservice;
                $scope.currpendingTimesheets = [];
                $scope.getpendingtimesheetdata = function () {
                    debugger;
                    if (myservice.isApprove && !myservice.isReject) {
                        $scope.enableApprove = true;
                        $scope.enableReject = false;
                    } else {
                        $scope.enableApprove = false;
                        $scope.enableReject = true;
                    }

                    $scope.currpendingTimesheets = [];
                    AuthService.getPendingTS().then(function (result) {
                        debugger;
                        if ((result != null) && (result != ""))
                            $scope.currpendingTimesheets = result;

                        console.log(result);
                    });
                    debugger;
                    var testweekdate = getDateRangeOfWeek($scope.WeekSelnumber);
                    var wkstartdate = new Date(testweekdate.split(" to ")[0]);
                    $scope.m_date = wkstartdate;
                    $scope.weeksetting();
                    debugger;
                };

                //$scope.currSelpendingTimesheet = [];
                 $scope.currDefaultUserTimesheet = [{
                      username: "",
                      weekno: "",
                      month: 0,
                      year: "",
                      status: "",
                      projects: [
                         {
                             name: "ProjectCode1",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                },
                                {
                                    name: "Task2",
                                    description: "Defect prevention Activities",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         },
                         {
                             name: "ProjectCode2",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         },
                         {
                             name: "ProjectCode3",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                },
                                {
                                    name: "Task2",
                                    description: "Defect prevention Activities",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         },
                         {
                             name: "ProjectCode4",
                             tasks: [
                                {
                                    name: "Task1",
                                    description: "ADM Configuration",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                },
                                {
                                    name: "Task2",
                                    description: "Defect prevention Activities",
                                    monHours: "0:00",
                                    tueHours: "0:00",
                                    wedHours: "0:00",
                                    thuHours: "0:00",
                                    friHours: "0:00",
                                    satHours: "0:00",
                                    sunHours: "0:00"
                                }
                             ]
                         }
                      ]                  
                 }];
                 $scope.currSelpendingTimesheet = $scope.currDefaultUserTimesheet[0];
                 $scope.WeekSelnumber = 1;
                 $scope.onTimesheetChange = function (event) {
                     debugger;
                     //
                     var selvalue = $scope.currpendingTimesheets[angular.element(empdataid)[0].selectedIndex - 1].id;


                     $scope.currSelpendingTimesheet = $scope.currDefaultUserTimesheet[0];
                     $scope.WeekSelnumber = 1;
                     for (var i = 0; i < $scope.currpendingTimesheets.length; i++) {

                         if ($scope.currpendingTimesheets[i].id == selvalue) {
                             //$scope.currSelpendingTimesheet.push($scope.currpendingTimesheets[i]);
                             $scope.currSelpendingTimesheet = $scope.currpendingTimesheets[i];
                             $scope.WeekSelnumber = $scope.currSelpendingTimesheet.weekno;
                             

                             break;
                         }
                     }
                     
                     debugger;
                     var testweekdate = getDateRangeOfWeek($scope.WeekSelnumber);
                     var wkstartdate = new Date(testweekdate.split(" to ")[0]);
                     $scope.m_date = wkstartdate;
                     $scope.weeksetting();
                     debugger;
                     //$scope.weeksetting();

                     //

                 };



                //

                 function getDateRangeOfWeek(weekNo) {
                     var d1 = new Date();
                     var numOfdaysPastSinceLastMonday = eval(d1.getDay() - 1);
                     d1.setDate(d1.getDate() - numOfdaysPastSinceLastMonday);

                     //

                     var mDate = new Date(d1);
                     mDate.setHours(0, 0, 0, 0);
                     // Thursday in current week decides the year.
                     mDate.setDate(mDate.getDate() + 3 - (mDate.getDay() + 6) % 7);
                     // January 4 is always in week 1.
                     var week1 = new Date(mDate.getFullYear(), 0, 4);
                     // Adjust to Thursday in week 1 and count number of weeks from date to week1.
                     var weeknewNumber = 1 + Math.round(((mDate.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);

                     //
                     //var weekNoToday = d1.getWeek();
                     var weekNoToday = weeknewNumber;
                     var weeksInTheFuture = eval(weekNo - weekNoToday);
                     d1.setDate(d1.getDate() + eval(7 * weeksInTheFuture));
                     var rangeIsFrom = eval(d1.getMonth() + 1) + "/" + d1.getDate() + "/" + d1.getFullYear();
                     d1.setDate(d1.getDate() + 6);
                     var rangeIsTo = eval(d1.getMonth() + 1) + "/" + d1.getDate() + "/" + d1.getFullYear();
                     return rangeIsFrom + " to " + rangeIsTo;
                 };



                //



                $scope.weeksetting = function () {
                    // $scope.value = new Date();
                    debugger;

                    $scope.i = 0;
                    $scope.start = 1;
                    $scope.day1 = 1000 * 60 * 60 * 24;
                    $scope.day = $scope.m_date.getDay() - $scope.start;
                    var date1 = $scope.m_date.getDate() - $scope.day;
                    // Grabbing Start/End Dates
                    $scope.StartDate = new Date($scope.m_date.setDate(date1));
                    $scope.EndDate = new Date($scope.m_date.setDate(date1 + 6));
                    $scope.diff = ($scope.EndDate.getTime() - $scope.StartDate.getTime())
                        / $scope.day1;
                    var xx = $scope.StartDate.getTime() + $scope.day1 * 0;
                    var yy = new Date(xx);
                    $scope.first = yy;
                    var xx1 = $scope.StartDate.getTime() + $scope.day1 * 1;
                    var yy1 = new Date(xx1);
                    $scope.SecondDate = yy1;
                    var xx2 = $scope.StartDate.getTime() + $scope.day1 * 2;
                    var yy2 = new Date(xx2);
                    $scope.ThirdDate = yy2;
                    var xx3 = $scope.StartDate.getTime() + $scope.day1 * 3;
                    var yy3 = new Date(xx3);
                    $scope.fourthDate = yy3;
                    var xx4 = $scope.StartDate.getTime() + $scope.day1 * 4;
                    var yy4 = new Date(xx4);
                    $scope.fifthDate = yy4;
                    var xx5 = $scope.StartDate.getTime() + $scope.day1 * 5;
                    var yy5 = new Date(xx5);
                    $scope.sixDate = yy5;
                    var xx6 = $scope.StartDate.getTime() + $scope.day1 * 6;
                    var yy6 = new Date(xx6);
                    $scope.EndDate = yy6;
                };

                //$scope.totalRow = function (valueString) {
                //    var valueArray = valueString.split(';');
                //    var totalValue = 0;

                //    for (var i = 0; i < valueArray.length; i++) {
                //        if (valueArray[i] === "") {
                //            valueArray[i] = 0;
                //        }
                //        totalValue = parseFloat(totalValue) + parseFloat(valueArray[i]);
                //    }
                //    return totalValue;
                //};
                //$scope.finalRows = function (projectCode) {
                //    var taskValues = [];
                //    angular.forEach(projectCode, function (tasks) {
                //        if (tasks.tasks.length > 1) {
                //            angular.forEach(tasks.tasks, function (ts) {
                //                taskValues.push(ts);
                //            });
                //        } else {
                //            taskValues.push(tasks.tasks[0]);
                //        }
                //    });

                //    $scope.finalRow = [];
                //    var tempRow1 = [];
                //    var tempRow2 = [];
                //    var tempRow3 = [];
                //    var tempRow4 = [];
                //    var tempRow5 = [];
                //    var tempRow6 = [];
                //    var tempRow7 = [];
                //    for (var j = 0; j < taskValues.length; j++) {
                //        var valueArray = taskValues[j].value.split(';');
                //        if (valueArray[0] === "") {
                //            valueArray[0] = 0;
                //        }
                //        tempRow1.push(parseFloat(valueArray[0]));
                //        if (valueArray[1] === "") {
                //            valueArray[1] = 0;
                //        }
                //        tempRow2.push(parseFloat(valueArray[1]));
                //        if (valueArray[2] === "") {
                //            valueArray[2] = 0;
                //        }
                //        tempRow3.push(parseFloat(valueArray[2]));
                //        if (valueArray[3] === "") {
                //            valueArray[3] = 0;
                //        }
                //        tempRow4.push(parseFloat(valueArray[3]));
                //        if (valueArray[4] === "") {
                //            valueArray[4] = 0;
                //        }
                //        tempRow5.push(parseFloat(valueArray[4]));
                //        if (valueArray[5] === "") {
                //            valueArray[5] = 0;
                //        }
                //        tempRow6.push(parseFloat(valueArray[5]));
                //        if (valueArray[6] === "") {
                //            valueArray[6] = 0;
                //        }
                //        tempRow7.push(parseFloat(valueArray[6]));

                //    }

                //    $scope.finalRow.push($scope.CalculateSum(tempRow1));
                //    $scope.finalRow.push($scope.CalculateSum(tempRow2));
                //    $scope.finalRow.push($scope.CalculateSum(tempRow3));
                //    $scope.finalRow.push($scope.CalculateSum(tempRow4));
                //    $scope.finalRow.push($scope.CalculateSum(tempRow5));
                //    $scope.finalRow.push($scope.CalculateSum(tempRow6));
                //    $scope.finalRow.push($scope.CalculateSum(tempRow7));
                //    $scope.finalSum = $scope.CalculateSum($scope.finalRow);
                //};
                $scope.onLoad = function () {
                    //$scope.example = {
                    //  value : new Date()
                    //};
                    if (myservice.isApprove && !myservice.isReject) {
                        $scope.enableApprove = true;
                        $scope.enableReject = false;
                    } else {
                        $scope.enableApprove = false;
                        $scope.enableReject = true;
                    }

                    $scope.date = function () {
                        // $scope.value = new Date();
                        debugger;

                        $scope.i = 0;
                        $scope.start = 1;
                        $scope.day1 = 1000 * 60 * 60 * 24;
                        $scope.day = $scope.m_date.getDay() - $scope.start;
                        var date1 = $scope.m_date.getDate() - $scope.day;
                        // Grabbing Start/End Dates
                        $scope.StartDate = new Date($scope.m_date.setDate(date1));
                        $scope.EndDate = new Date($scope.m_date.setDate(date1 + 6));
                        $scope.diff = ($scope.EndDate.getTime() - $scope.StartDate.getTime())
                            / $scope.day1;
                        var xx = $scope.StartDate.getTime() + $scope.day1 * 0;
                        var yy = new Date(xx);
                        $scope.first = yy;
                        var xx1 = $scope.StartDate.getTime() + $scope.day1 * 1;
                        var yy1 = new Date(xx1);
                        $scope.SecondDate = yy1;
                        var xx2 = $scope.StartDate.getTime() + $scope.day1 * 2;
                        var yy2 = new Date(xx2);
                        $scope.ThirdDate = yy2;
                        var xx3 = $scope.StartDate.getTime() + $scope.day1 * 3;
                        var yy3 = new Date(xx3);
                        $scope.fourthDate = yy3;
                        var xx4 = $scope.StartDate.getTime() + $scope.day1 * 4;
                        var yy4 = new Date(xx4);
                        $scope.fifthDate = yy4;
                        var xx5 = $scope.StartDate.getTime() + $scope.day1 * 5;
                        var yy5 = new Date(xx5);
                        $scope.sixDate = yy5;
                        var xx6 = $scope.StartDate.getTime() + $scope.day1 * 6;
                        var yy6 = new Date(xx6);
                        $scope.EndDate = yy6;
                    };
                    $scope.projectCode = [{
                        projectcodes: "ProjectCode1",
                        tasks: [{
                            code: "task1",
                            description: "ADM Configuration",
                            value: "1;2;3;4;5;6;7"
                        }, {
                            code: "task2",
                            description: "Defect prevention Activities",
                            value: "1;2;3;4;5;6;7"
                        }]
                    }, {
                        projectcodes: "ProjectCode2",
                        tasks: [{
                            code: "task1",
                            description: "ADM Configuration",
                            value: ";;3;4;;6;7"
                        }]
                    }, {
                        projectcodes: "ProjectCode3",
                        tasks: [{
                            code: "task1",
                            description: "ADM Configuration",
                            value: "1;2;3;4;5;6;7"
                        }, {
                            code: "task2",
                            description: "ADM Configuration",
                            value: ";;3;4;;6;7"
                        }]
                    }, {
                        projectcodes: "ProjectCode4",
                        tasks: [{
                            code: "task1",
                            description: "ADM Configuration",
                            value: ";;3;4;;6;7"
                        }, {
                            code: "task2",
                            description: "ADM Configuration",
                            value: ";;3;4;;6;7"
                        }]
                    }];

                    $scope.welcomeUserMsg = myservice.userName;
                    $scope.myservice = myservice;

                    $scope.totalRow = function (valueString) {
                        var valueArray = valueString.split(';');
                        var totalValue = 0;

                        for (var i = 0; i < valueArray.length; i++) {
                            if (valueArray[i] === "") {
                                valueArray[i] = 0;
                            }
                            totalValue = parseFloat(totalValue) + parseFloat(valueArray[i]);
                        }
                        return totalValue;
                    };

                    $scope.finalRows = function (projectCode) {
                        var taskValues = [];
                        angular.forEach(projectCode, function (tasks) {
                            if (tasks.tasks.length > 1) {
                                angular.forEach(tasks.tasks, function (ts) {
                                    taskValues.push(ts);
                                });
                            } else {
                                taskValues.push(tasks.tasks[0]);
                            }
                        });

                        $scope.finalRow = [];
                        var tempRow1 = [];
                        var tempRow2 = [];
                        var tempRow3 = [];
                        var tempRow4 = [];
                        var tempRow5 = [];
                        var tempRow6 = [];
                        var tempRow7 = [];
                        for (var j = 0; j < taskValues.length; j++) {
                            var valueArray = taskValues[j].value.split(';');
                            if (valueArray[0] === "") {
                                valueArray[0] = 0;
                            }
                            tempRow1.push(parseFloat(valueArray[0]));
                            if (valueArray[1] === "") {
                                valueArray[1] = 0;
                            }
                            tempRow2.push(parseFloat(valueArray[1]));
                            if (valueArray[2] === "") {
                                valueArray[2] = 0;
                            }
                            tempRow3.push(parseFloat(valueArray[2]));
                            if (valueArray[3] === "") {
                                valueArray[3] = 0;
                            }
                            tempRow4.push(parseFloat(valueArray[3]));
                            if (valueArray[4] === "") {
                                valueArray[4] = 0;
                            }
                            tempRow5.push(parseFloat(valueArray[4]));
                            if (valueArray[5] === "") {
                                valueArray[5] = 0;
                            }
                            tempRow6.push(parseFloat(valueArray[5]));
                            if (valueArray[6] === "") {
                                valueArray[6] = 0;
                            }
                            tempRow7.push(parseFloat(valueArray[6]));

                        }

                        $scope.finalRow.push($scope.CalculateSum(tempRow1));
                        $scope.finalRow.push($scope.CalculateSum(tempRow2));
                        $scope.finalRow.push($scope.CalculateSum(tempRow3));
                        $scope.finalRow.push($scope.CalculateSum(tempRow4));
                        $scope.finalRow.push($scope.CalculateSum(tempRow5));
                        $scope.finalRow.push($scope.CalculateSum(tempRow6));
                        $scope.finalRow.push($scope.CalculateSum(tempRow7));
                        $scope.finalSum = $scope.CalculateSum($scope.finalRow);
                    };
                };

                $scope.CalculateSum = function (valueArray) {
                    var totalValue = 0;
                    angular.forEach(valueArray, function (value) {
                        totalValue = totalValue + value;
                    });
                    return totalValue;
                };

            } ]);

app.service('myservice', function() {
  var getUserName = this;
  // For Username
  getUserName.userName = "";

  // For Role
  getUserName.isManager = false;

  // For Approve Button
  getUserName.isApprove = false;

  // For Reject Button
  getUserName.isReject = false;

  getUserName.managerName = "";
});

app.filter('selected', function($filter) {
    return function (projectCode) {
        debugger;
    var i, len;
    var checkedprojectcode = $filter('filter')(projectCode, {
      checked : true
    });
    if (checkedprojectcode.length === 0) {
      return projectCode;
    }
    var code = {};
    for (i = 0, len = checkedprojectcode.length; i < len; ++i) {
      if (!code.hasOwnProperty(checkedprojectcode[i].projectcodes)) {
        code[checkedprojectcode[i].projectcodes] = true;
      }
    }
    var ret = [];
    for (i = 0, len = projectCode.length; i < len; ++i) {
      if (code[projectCode[i].projectcodes]) {
        ret.push(projectCode[i]);
      }
    }
    return ret;
  };
});

app.directive('ngModelOnblur', function() {
  return {
    restrict : 'A',
    require : 'ngModel',
    priority : 1, // needed for angular 1.2.x
    link : function(scope, elm, attr, ngModelCtrl) {
      if (attr.type === 'radio' || attr.type === 'checkbox')
        return;

      elm.unbind('input').unbind('keydown').unbind('change');
      elm.bind('blur', function() {
        scope.$apply(function() {
          ngModelCtrl.$setViewValue(elm.val());
        });
      });
    }
  };
});