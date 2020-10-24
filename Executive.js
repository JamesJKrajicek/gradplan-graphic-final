class Executive {
	constructor() {
		// Initialize drag-and-drop
		REDIPS.drag.dropMode = "single";
		REDIPS.drag.event.dropped = targetCell => console.log(targetCell);
		
		this.render = new Render(3, 4); // TODO hard-coded rows/cols
		this.createTestPlan();
		this.renderCourseGrid();
	}
	
	createTestPlan() {
		this.plan = new Plan("Computer Science", FALL, 2018);
		this.plan.semesters[0].semester_courses[1] = this.plan.course_id_to_object("EECS 168");
		this.plan.semesters[0].semester_courses[2] = this.plan.course_id_to_object("EECS 140");
		this.plan.semesters[1].semester_courses[1] = this.plan.course_id_to_object("MATH 526");
		this.plan.semesters[1].semester_courses[3] = this.plan.course_id_to_object("GE 2.2");
		this.plan.semesters[2].semester_courses[0] = this.plan.course_id_to_object("EECS 268");
		this.plan.semesters[2].semester_courses[1] = this.plan.course_id_to_object("PHSX 210");
		this.plan.semesters[2].semester_courses[2] = this.plan.course_id_to_object("EECS 388");
		this.plan.semesters[2].semester_courses[3] = this.plan.course_id_to_object("PHSX 216");
	}
	
	// Redrawing the course grid should only be needed after drastic changes (e.g. removing a semester)
	// The rest of the time, the users takes care of these steps by moving courses around
	renderCourseGrid() {
		let grid = document.getElementById("course-grid");
		// Clear grid
		while (grid.firstChild) grid.removeChild(grid.firstChild);
		
		let longestRow = 0;
		
		for (let semester of this.plan.semesters) {
			let tr = document.createElement("tr");
			let th = document.createElement("th");
			th.className = "redips-mark";
			th.innerText = semester.semester_year + " " + semester.season_name();
			tr.appendChild(th);
			
			for (let course of semester.semester_courses) {
				longestRow++;
				let td = document.createElement("td");
				if (course != undefined) {
					td.innerHTML = '<div class="redips-drag">' + course.course_code + "<br>(" + course.credit_hour + ")</div>";
				}
				tr.appendChild(td);
			}
			
			grid.appendChild(tr);
		}
		REDIPS.drag.init(); // Updates which elements have drag-and-drop
		this.render.resize(this.plan.semesters.length, longestRow); // Update position of SVG
		
		this.renderArrows(); // Will always need to render arrows after rendering course grid
	}
	
	renderArrows() {
		// TODO: Create list of arrows to draw either here or from a function in Plan.js
		
		// Test arrows from and to hard-coded course positions
		this.render.renderArrows([
			new Arrow(1, 0, 0, 2, false), // EECS 168 to EECS 268
			new Arrow(1, 0, 2, 2, false), // EECS 168 to EECS 388
			new Arrow(2, 0, 2, 2, false), // EECS 140 to EECS 388
			new Arrow(1, 1, 1, 2, true),  // MATH 126 to PHSX 210 (corequisite)
			new Arrow(1, 2, 3, 2, true),  // PHSX 210 to PHSX 216
		]);
	}
}