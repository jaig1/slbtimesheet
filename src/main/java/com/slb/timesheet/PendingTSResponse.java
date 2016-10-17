package com.slb.timesheet;

import java.util.List;

import com.slb.timesheet.model.TimesheetModel;

public class PendingTSResponse {
	
	private boolean success;
	private List<TimesheetModel> timesheets;
	private String msg;
	private int status;
	public boolean isSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
	}
	
	public List<TimesheetModel> getTimesheets() {
		return timesheets;
	}
	public void setTimesheets(List<TimesheetModel> timesheets) {
		this.timesheets = timesheets;
	}
	public String getMsg() {
		return msg;
	}
	public void setMsg(String msg) {
		this.msg = msg;
	}
	public int getStatus() {
		return status;
	}
	public void setStatus(int status) {
		this.status = status;
	}
	

}
