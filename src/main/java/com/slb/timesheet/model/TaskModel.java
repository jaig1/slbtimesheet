package com.slb.timesheet.model;

import com.googlecode.objectify.annotation.Entity;
import com.googlecode.objectify.annotation.Id;

@Entity
public class TaskModel {
	@Id Long id;
	private String name;
	private String monHours;
	private String tueHours;
	private String wedHours;
	private String thuHours;
	private String friHours;
	private String satHours;
	private String sunHours;
	
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
	public String getMonHours() {
		return monHours;
	}
	public void setMonHours(String monHours) {
		this.monHours = monHours;
	}
	public String getTueHours() {
		return tueHours;
	}
	public void setTueHours(String tueHours) {
		this.tueHours = tueHours;
	}
	public String getWedHours() {
		return wedHours;
	}
	public void setWedHours(String wedHours) {
		this.wedHours = wedHours;
	}
	public String getThuHours() {
		return thuHours;
	}
	public void setThuHours(String thuHours) {
		this.thuHours = thuHours;
	}
	public String getFriHours() {
		return friHours;
	}
	public void setFriHours(String friHours) {
		this.friHours = friHours;
	}
	public String getSatHours() {
		return satHours;
	}
	public void setSatHours(String satHours) {
		this.satHours = satHours;
	}
	public String getSunHours() {
		return sunHours;
	}
	public void setSunHours(String sunHours) {
		this.sunHours = sunHours;
	}
	
	
}
