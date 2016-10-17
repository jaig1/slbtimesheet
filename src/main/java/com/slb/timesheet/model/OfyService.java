package com.slb.timesheet.model;

import com.googlecode.objectify.Objectify;
import com.googlecode.objectify.ObjectifyFactory;
import com.googlecode.objectify.ObjectifyService;

public class OfyService {
	
	static {
        ObjectifyService.register(UserModel.class);
        ObjectifyService.register(TimesheetModel.class);
        ObjectifyService.register(ProjectModel.class);
        ObjectifyService.register(TaskModel.class);
    }

    public static Objectify ofy() {
        return ObjectifyService.ofy();
    }

    public static ObjectifyFactory factory() {
        return ObjectifyService.factory();
    }

}
