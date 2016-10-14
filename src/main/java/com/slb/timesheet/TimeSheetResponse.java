package com.slb.timesheet;

public class TimeSheetResponse {
	
	private boolean success;
	private Timesheet ts;
	private String msg;
	
	public boolean isSuccess() {
		return success;
	}
	public void setSuccess(boolean success) {
		this.success = success;
	}
	public Timesheet getTs() {
		return ts;
	}
	public void setTs(Timesheet ts) {
		this.ts = ts;
	}
	public String getMsg() {
		return msg;
	}
	public void setMsg(String msg) {
		this.msg = msg;
	}
	
	

}
