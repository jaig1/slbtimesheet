package com.slb.timesheet;

import java.util.List;

public class Timesheet {
	
	private String username;
	private int month;
	private int weekno;
	private String status;
	private String weekstartdatestring;
	private String weekenddatestring;
	private int year;
	private List<Project> projects;
	private String comments;
	private String approver;
	private String approverComments;
	
	public String getApproverComments() {
		return approverComments;
	}
	public void setApproverComments(String approverComments) {
		this.approverComments = approverComments;
	}
	public String getUsername() {
		return username;
	}
	public void setUsername(String username) {
		this.username = username;
	}
	public int getMonth() {
		return month;
	}
	public void setMonth(int month) {
		this.month = month;
	}
	public int getWeekno() {
		return weekno;
	}
	public void setWeekno(int weekno) {
		this.weekno = weekno;
	}
	public String getStatus() {
		return status;
	}
	public void setStatus(String status) {
		this.status = status;
	}
	public String getWeekstartdatestring() {
		return weekstartdatestring;
	}
	public void setWeekstartdatestring(String weekstartdatestring) {
		this.weekstartdatestring = weekstartdatestring;
	}
	public String getWeekenddatestring() {
		return weekenddatestring;
	}
	public void setWeekenddatestring(String weekenddatestring) {
		this.weekenddatestring = weekenddatestring;
	}
	public int getYear() {
		return year;
	}
	public void setYear(int year) {
		this.year = year;
	}
	public List<Project> getProjects() {
		return projects;
	}
	public void setProjects(List<Project> projects) {
		this.projects = projects;
	}
	public String getComments() {
		return comments;
	}
	public void setComments(String comments) {
		this.comments = comments;
	}
	public String getApprover() {
		return approver;
	}
	public void setApprover(String approver) {
		this.approver = approver;
	}
	
	
	

}
