package com.slb.timesheet;

import com.slb.timesheet.model.TimesheetModel;

public class TimeSheetResponse {
	
	private boolean success;
	private TimesheetModel ts;
	private String msg;
	
	public boolean isSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
	}
	
	public TimesheetModel getTs() {
		return ts;
	}
	public void setTs(TimesheetModel ts) {
		this.ts = ts;
	}
	public String getMsg() {
		return msg;
	}
	public void setMsg(String msg) {
		this.msg = msg;
	}
	
	

}
