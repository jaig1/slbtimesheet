package com.slb.timesheet.model;

import java.util.ArrayList;
import java.util.List;

import com.googlecode.objectify.Ref;
import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
import com.googlecode.objectify.annotation.Index;
import com.googlecode.objectify.annotation.Load;

@Entity
public class TimesheetModel {
	@Id Long id;
	@Index
	private String username;
	@Index
	private int month;
	@Index
	private int weekno;
	@Index
	private String status;
	private String weekstartdatestring;
	private String weekenddatestring;
	@Index
	private int year;
	//@Load private List<Ref<ProjectModel>> projects=new ArrayList<Ref<ProjectModel>>();
	private List<ProjectModel> projects=new ArrayList<ProjectModel>();
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
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public List<ProjectModel> getProjects() {
		return projects;
	}
	public void setProjects(List<ProjectModel> projects) {
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
