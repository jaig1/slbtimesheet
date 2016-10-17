package com.slb.timesheet.model;

import java.util.List;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;
@Entity
public class ProjectModel {
	@Id 
	Long id;
	private String name;
	private List<TaskModel> tasks;
	
	
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public List<TaskModel> getTasks() {
		return tasks;
	}
	public void setTasks(List<TaskModel> tasks) {
		this.tasks = tasks;
	}
	

}
