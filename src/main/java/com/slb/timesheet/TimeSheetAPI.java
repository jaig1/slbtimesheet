/**
 * Copyright 2016 Google Inc. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

package com.slb.timesheet;

import java.util.ArrayList;
import java.util.List;

import javax.inject.Named;
import javax.servlet.http.HttpServletRequest;

import com.google.api.server.spi.config.Api;
import com.google.api.server.spi.config.ApiMethod;
import com.google.api.server.spi.config.ApiNamespace;
import com.googlecode.objectify.Key;
import com.googlecode.objectify.Result;
import com.slb.timesheet.model.OfyService;
import com.slb.timesheet.model.ProjectModel;
import com.slb.timesheet.model.TaskModel;
import com.slb.timesheet.model.TimesheetModel;
import com.slb.timesheet.model.UserModel;
import com.slb.timesheet.Constants;

// [START header]
/** An endpoint class we are exposing */
@Api(name = "timesheet", version = "v2", scopes = { Constants.EMAIL_SCOPE }, clientIds = {
		Constants.WEB_CLIENT_ID, Constants.API_EXPLORER_CLIENT_ID }, description = "API for the SLB Timesheet application.")
// [END header]

public class TimeSheetAPI {

  //Authenticate
	@ApiMethod(
		      name = "signup",
		      httpMethod = ApiMethod.HttpMethod.POST
		  )
	public Response signup(UserDTO user)
	{
		  UserModel userEntity=new UserModel();
		  userEntity.setApprover(user.getApprover());
		  userEntity.setIsManager(user.getIsManager());
		  userEntity.setPassword(user.getPassword());
		  userEntity.setUsername(user.getUsername());
		  OfyService.ofy().save().entity(userEntity).now();
		  Response resp=new Response();
		  resp.setSuccess(true);
		  resp.setMsg("Successful created new user.");
		  return resp;
	}  
	
	
@ApiMethod(
	      name = "authenticate",
	      httpMethod = ApiMethod.HttpMethod.POST
	  )
public AuthenticationResponse authenticate(AuthenticateRequest authenticateRequest)
{
	 AuthenticationResponse resp=new AuthenticationResponse();
	 System.out.println("authenticateRequest.getUsername()"+authenticateRequest.getUsername());
	Result<UserModel> result=OfyService.ofy().load().key(Key.create(UserModel.class,authenticateRequest.getUsername()));
	UserModel user = result.now(); 
	if(user==null)
	{
		resp.setSuccess(false);
		resp.setMsg("Authentication failed");
		return resp;
	}
	else if(authenticateRequest.getPassword().equals(user.getPassword()))
	{
		resp.setSuccess(true);
		  if(user.getIsManager())
		  {
			  resp.setRole("manager");
		  }
		  else
		  {
			  resp.setRole("regular");
		  }
		  resp.setToken(authenticateRequest.getUsername());
		  return resp;
	}
	else
	{
		resp.setSuccess(false);
		resp.setMsg("Wrong Password.. Authentication Failed");
		return resp;
	}
	  
}

  
  @ApiMethod(
	      name = "getTimeSheet",
	      path="getTimeSheet",
	      httpMethod = ApiMethod.HttpMethod.GET)
  
  public TimeSheetResponse getTimeSheet(@Named("year") int year, @Named("month") int month,@Named("week") int week,HttpServletRequest req)         
  {
	 
	  TimeSheetResponse response=new TimeSheetResponse();
	  TimesheetModel resp=new TimesheetModel();
	  System.out.println("week*****"+week);
	  String userName=null;
	  if(req.getHeader("Authorization")!=null)
	  {
		  userName=req.getHeader("Authorization").trim();
	  }
	  resp= OfyService.ofy().load().type(TimesheetModel.class).filter("year", year).filter("month", month).filter("weekno",week).filter("username",userName).first().now();
	  
	  /*resp.setStatus("saved");
	  resp.setMonth(month);
	  resp.setYear(year);
	  resp.setWeekno(week);
	  if(req.getHeader("Authorization")!=null)
	  {
		  resp.setUsername(req.getHeader("Authorization").trim());
	  }
	  //String projects[]={"abc","def"};
	 // resp.setProjects(projects);
	  resp.setWeekstartdatestring("26-Sep-2016");
	  resp.setWeekenddatestring("02-Oct-2016");*/
	  /*if(resp==null)
	  {
		  response.setSuccess(false);
		  response.setMsg("No Timesheet present");
		  return response;
	  } */
			  
	  response.setSuccess(true);
	  response.setTs(resp);
	  
  	  return response;
  }
  
  
@ApiMethod(
	      name = "savetimesheet",
	      path="savetimesheet",
	      httpMethod = ApiMethod.HttpMethod.POST
	  )
public TimeSheetResponse savetimesheet(TimeSheetRequest timesheetReq,HttpServletRequest req)
{
	
	 TimeSheetResponse response=new TimeSheetResponse();
	  String userName=null;
	  if(req.getHeader("Authorization")!=null)
	  {
		  userName=req.getHeader("Authorization").trim();
	  }
	 
	  if(timesheetReq==null)
	  {
		  response.setSuccess(true);
		  response.setMsg("No Timesheet provided to save");
		  return response;
	  }
	  else if (timesheetReq.getTimesheet()==null)
	  {
		  response.setSuccess(true);
		  response.setMsg("No Timesheet provided to save");
		  return response;
	  }
	  Timesheet timesheet=timesheetReq.getTimesheet();
	  //Finding the existing timesheet
	  TimesheetModel resp= OfyService.ofy().load().type(TimesheetModel.class).filter("year", timesheet.getYear()).filter("month", timesheet.getMonth()).filter("weekno",timesheet.getWeekno()).filter("username",userName).first().now();
	  if(resp!=null)
	  {
		  OfyService.ofy().delete().entity(resp).now();
	  }
	  
	  TimesheetModel savedTimeSheet=new TimesheetModel();
	  savedTimeSheet.setStatus(timesheet.getStatus());
	  savedTimeSheet.setMonth(timesheet.getMonth());
	  savedTimeSheet.setYear(timesheet.getYear());
	  savedTimeSheet.setWeekno(timesheet.getWeekno());
	  savedTimeSheet.setUsername(userName);
	  savedTimeSheet.setWeekenddatestring(timesheet.getWeekenddatestring());
	  savedTimeSheet.setWeekstartdatestring(timesheet.getWeekstartdatestring());
	  savedTimeSheet.setComments(timesheet.getComments());
	  List<Project> projects=timesheet.getProjects();
	  List<ProjectModel> projectModels=new ArrayList();
	  for (Project project : projects) {
		ProjectModel projectModel=new ProjectModel();
		projectModel.setName(project.getName());
		List<Task> tasks = project.getTasks();
		List<TaskModel> taskModels=new ArrayList<>();
		for (Task task : tasks) {
			TaskModel taskModel=new TaskModel();
			taskModel.setName(task.getName());
			taskModel.setMonHours(task.getMonHours());
			taskModel.setTueHours(task.getTueHours());
			taskModel.setWedHours(task.getWedHours());
			taskModel.setThuHours(task.getThuHours());
			taskModel.setFriHours(task.getFriHours());
			taskModel.setSatHours(task.getSatHours());
			taskModel.setSunHours(task.getSunHours());
			taskModel.setDescription(task.getDescription());
			taskModels.add(taskModel);
		}
		projectModel.setTasks(taskModels);
		projectModels.add(projectModel);
	}
	  
	  savedTimeSheet.setProjects(projectModels);
	  OfyService.ofy().save().entity(savedTimeSheet).now();
	  response.setTs(savedTimeSheet);
	  response.setMsg("Timesheet saved successfully");
	  response.setSuccess(true);
	  
	  return response;
}
 
@ApiMethod(
	      name = "getPendingTS",
	      path="getPendingTS",
	      httpMethod = ApiMethod.HttpMethod.GET)

public PendingTSResponse getPendingTS(HttpServletRequest req)         
{
	 String userName=null;
	 String userNames[] = new String[5]; 
	 PendingTSResponse response=new PendingTSResponse();
	  if(req.getHeader("Authorization")!=null)
	  {
		  userName=req.getHeader("Authorization").trim();
		  Result<UserModel> result=OfyService.ofy().load().key(Key.create(UserModel.class,userName));
		  UserModel user = result.now(); 
		  if(user!=null&&!user.getIsManager())
		  {
			  response.setMsg("User is not a Manager");
			  response.setSuccess(false);
		  }
		  else if(user==null)
		  {
			  response.setMsg("Authentication failed. User not found.");
			  response.setSuccess(false); 
		  }
	  }
	List<UserModel> userModels =OfyService.ofy().load().type(UserModel.class).filter("approver", userName).list();
	int i=0;
	for (UserModel userModel : userModels) {
		userNames[i++]=userModel.getUsername();
	}
	  
	String[] statuses = new String[]{"submitted", "rejected"};
	 List<TimesheetModel> timesheetModels= OfyService.ofy().load().type(TimesheetModel.class).filter("status IN", statuses).filter("username IN",userNames).list(); //.filter("status IN", statuses).filter("username IN",userNames)
	 response.setSuccess(true);
	 response.setTimesheets(timesheetModels);
	  return response;
}

@ApiMethod(
	      name = "approveorreject",
	      path="approveorreject",
	      httpMethod = ApiMethod.HttpMethod.POST
	  )
public TimeSheetResponse approveorreject(TimeSheetRequest timesheetReq,HttpServletRequest req)
{
	
	 TimeSheetResponse response=new TimeSheetResponse();
	  String userName=null;
	  if(req.getHeader("Authorization")!=null)
	  {
		  userName=req.getHeader("Authorization").trim();
	  }
	 
	  if(timesheetReq==null)
	  {
		  response.setSuccess(true);
		  response.setMsg("No Timesheet provided to save");
		  return response;
	  }
	  else if (timesheetReq.getTimesheet()==null)
	  {
		  response.setSuccess(true);
		  response.setMsg("No Timesheet provided to save");
		  return response;
	  }
	  Timesheet timesheet=timesheetReq.getTimesheet();
	  //Finding the existing timesheet
	  TimesheetModel resp= OfyService.ofy().load().type(TimesheetModel.class).filter("year", timesheet.getYear()).filter("month", timesheet.getMonth()).filter("weekno",timesheet.getWeekno()).filter("username",timesheet.getUsername()).first().now();
	  if(resp!=null)
	  {
		  OfyService.ofy().delete().entity(resp).now();
	  }
	 // System.out.println("resp"+resp);
	 // TimesheetModel savedTimeSheet=new TimesheetModel();
	  resp.setStatus(timesheet.getStatus());
	  resp.setApproverComments(timesheet.getApproverComments());
	  resp.setApprover(userName);
	  OfyService.ofy().save().entity(resp).now();
	  response.setTs(resp);
	  response.setMsg("Timesheet saved successfully");
	  response.setSuccess(true);
	  
	  return response;
}


}
