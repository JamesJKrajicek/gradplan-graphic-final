const UP = 1, DOWN = 2, LEFT = 3, RIGHT = 4;

// Position of all arrows relative to top-left of svg
const LEFT_OFFSET = 120; // Offset due to the column of the chart with the semester names
const TOP_OFFSET = 0; // Currently zero, but of padding is added for outside channels may increase

const CHANNELS = [2, 1, 3, 0, 4]; // Order channels will be filled
const NUM_CHANNELS = CHANNELS.length; //5

const TD_WIDTH = 120;
const TD_HEIGHT = 80;
const COURSE_WIDTH = 90;
const COURSE_HEIGHT = 50;

// The depth and half the width of an arrow head
const ARROW_SIZE = 4;

// The thickness of each individual channel (line drawn in middle)
const HORIZ_CHANNEL_SIZE = (TD_HEIGHT-COURSE_HEIGHT)/NUM_CHANNELS;
const VERT_CHANNEL_SIZE = (TD_WIDTH-COURSE_WIDTH)/NUM_CHANNELS;

class Render {
	constructor() {
		// Rows and columns of courses in the grid (not counting column of semester names)
		// TODO: These shouldn't be hard-coded and should change based on things like number of semesters
		this.rows = 3;
		this.cols = 4;
		
		// Initialize drag-and-drop (perhaps this should be moved to Executive.js)
		REDIPS.drag.init();
		REDIPS.drag.dropMode = "single";
		
		this.draw = SVG().addTo(document.getElementById("arrows"));
		this.rescale();
		
		// Test arrows from and to hard-coded course positions
		let arrows = [
			new Arrow(1, 0, 0, 2, false), // EECS 168 to EECS 268
			new Arrow(1, 0, 2, 2, false), // EECS 168 to EECS 388
			new Arrow(2, 0, 2, 2, false), // EECS 140 to EECS 388
			new Arrow(1, 1, 1, 2, true),  // MATH 126 to PHSX 210 (corequisite)
			new Arrow(1, 2, 3, 2, true),  // PHSX 210 to PHSX 216
		];
		this.renderArrows(arrows);
	}
	
	rescale() {
		// Place svg behind the course-grid and make it the same size
		document.querySelector("#arrows svg").style.width = document.getElementById("course-grid").offsetWidth;
		document.querySelector("#arrows svg").style.height = document.getElementById("course-grid").offsetHeight;
		document.querySelector("#arrows svg").style.marginBottom = -document.getElementById("course-grid").offsetHeight;
	}
	
	renderArrows(arrows) {
		this.arrows = arrows;
		
		// Initialize all channels as unused (false)
		// Note there is one more set of channels than the number of course rows/cols as the channels go between and around them
		this.vertChannels = [];
		this.horizChannels = [];
		for (var row = 0; row <= this.rows; row++) {
			this.vertChannels[row] = [];
			this.horizChannels[row] = [];
			for (var col = 0; col <= this.cols; col++) {
				this.vertChannels[row][col] = [];
				this.horizChannels[row][col] = [];
				for (var chan = 0; chan < NUM_CHANNELS; chan++) {
					this.vertChannels[row][col][chan] = false;
					this.horizChannels[row][col][chan] = false;
				}
			}
		}
		
		for (let arrow of this.arrows) {
			let path = [];
			
			if (arrow.fromSide) { // corequisite
				// If the course is not in the adjacent column, will need 3 line segments through channels
				if (arrow.xIn+1 != arrow.xOut) {
					let [firstChannelX, startOffset] = this.findVertChannel(...arrow.node1(), arrow.yIn);
					let [secondChannelY] = this.findHorizChannel(arrow.node1()[0], ...arrow.node2());
					let [thirdChannelX, endOffset] = this.findVertChannel(...arrow.node2(), arrow.yOut);
					path.push(
						arrow.startPoint(startOffset), // Start right of starting course
						[firstChannelX, arrow.startPoint(startOffset)[1]], // Enter first channel
						[firstChannelX, secondChannelY], // Traverse down first channel to node1, the junction between channels 1 and 2
						[thirdChannelX, secondChannelY], // Traverse along second channel to node2, the junction between channels 2 and 3
						[thirdChannelX, arrow.endPoint(endOffset)[1]], // Traverse down third channel to the point beside the ending course
						...this.arrowHead(...arrow.endPoint(endOffset), RIGHT) // Connect to ending course with an arrowhead
					);
				}
				// If the course is in the adjacent column, but not directly beside, will need 1 line segment through a channel
				else if (arrow.yIn != arrow.yOut) {
					let [channelX, startEndOffset] = this.findVertChannel(arrow.xOut, arrow.yIn, arrow.yOut);
					path.push(
						arrow.startPoint(startOffset), // Start right of starting course
						[channelX, arrow.startPoint(startEndOffset)[1]], // Enter channel
						[channelX, arrow.endPoint(startEndOffset)[1]], // Traverse along channel to the point directly above the ending course
						...this.arrowHead(...arrow.endPoint(startEndOffset), RIGHT) // Connect to ending course with an arrowhead
					);
				}
				// Course directly right of current one - just draw the line straight to it
				else {
					path.push(
						arrow.startPoint(), // Start at starting course
						...this.arrowHead(...arrow.endPoint(), RIGHT) // Connect to ending course with an arrowhead
					); 
				}
			}
			else { // prerequisite
				// If the course is not in the next semester, will need 3 line segments through channels
				if (arrow.yIn+1 != arrow.yOut) {
					// Find the coordinates of the channels the arrow will go through
					let [firstChannelY, startOffset] = this.findHorizChannel(arrow.xIn, ...arrow.node1());
					let [secondChannelX] = this.findVertChannel(...arrow.node1(), arrow.node2()[1]);
					let [thirdChannelY, endOffset] = this.findHorizChannel(arrow.xOut, ...arrow.node2());
					path.push(
						arrow.startPoint(startOffset), // Start below middle of starting course
						[arrow.startPoint(startOffset)[0], firstChannelY], // Enter first channel
						[secondChannelX, firstChannelY], // Traverse along first channel to node1, the junction between channels 1 and 2
						[secondChannelX, thirdChannelY], // Traverse down second channel to node2, the junction between channels 2 and 3
						[arrow.endPoint(endOffset)[0], thirdChannelY], // Traverse along third channel to the point above the ending course
						...this.arrowHead(...arrow.endPoint(endOffset), DOWN) // Connect to ending course with an arrowhead
					);
				}
				// If the course is in the next semester, but not directly below, will need 1 line segment through a channel
				else if (arrow.xIn != arrow.xOut) {
					let [channelY, startEndOffset] = this.findHorizChannel(arrow.xIn, arrow.xOut, arrow.yOut);
					path.push(
						arrow.startPoint(startOffset), // Start below middle of starting course
						[arrow.startPoint(startEndOffset)[0], channelY], // Enter channel
						[arrow.endPoint(startEndOffset)[0], channelY], // Traverse along channel to the point directly above the ending course
						...this.arrowHead(...arrow.endPoint(startEndOffset), DOWN) // Connect to ending course with an arrowhead
					);
				}
				// Course directly below current one - just draw the line straight to it
				else {
					path.push(
						arrow.startPoint(), // Start at starting course
						...this.arrowHead(...arrow.endPoint(), DOWN) // Connect to ending course with an arrowhead
					); 
				}
			}
			
			// Find the minimum x and y coordinates in the path (needed to properly offset the arrow)
			let mins = path.reduce((acc, val) => [
				val[0] < acc[0] ? val[0] : acc[0], 
				val[1] < acc[1] ? val[1] : acc[1]
			], [Number.MAX_VALUE, Number.MAX_VALUE]);
			
			// TODO: Temporary random colors - in the future, the color should match the course the arrow starts at
			let color = "hsl(" + Math.floor(90+Math.random()*270) + ", 100%, 50%)";
			this.draw.polyline(path).fill('none').move(LEFT_OFFSET+mins[0], TOP_OFFSET+mins[1]).stroke({color: color, width: 2, linecap: 'round', linejoin: 'round'});
		}
	}
	
	// Return the y coordinate (pixel) to draw the channel at
	// startX and endX can be in either order
	findHorizChannel(startX, endX, y) {
		// Find an available channel (all segments along length of line available)
		var chan;
		for (chan of CHANNELS) {
			var channelValid = true;
			for (var col = Math.min(startX, endX); col <= Math.max(startX, endX); col++) {
				// if this segment of the channel is already taken
				if (this.horizChannels[y][col][chan]) { 
					channelValid = false;
					break;
				}
			}
			// Available channel found
			if (channelValid) break;
		}
		
		// Mark channel as unavailable
		for (var col = Math.min(startX, endX); col <= Math.max(startX, endX); col++) {
			this.horizChannels[y][col][chan] = true;
		}
		
		// Channel number with 0 as center
		let relChan = chan - ((NUM_CHANNELS-1)/2);
		
		// X coordinate pixel of the channel and Y offset of the start/end position (if applicable)
		return [relChan * HORIZ_CHANNEL_SIZE + y*TD_HEIGHT, relChan * ARROW_SIZE*2.5];
	}
	
	findVertChannel(x, startY, endY) {
		// Find an available channel (all segments along length of line available)
		var chan;
		for (chan of CHANNELS) {
			var channelValid = true;
			for (var row = Math.min(startY, endY); row <= Math.max(startY, endY); row++) {
				// if this segment of the channel is already taken
				if (this.vertChannels[row][x][chan]) { 
					channelValid = false;
					break;
				}
			}
			// Available channel found
			if (channelValid) break;
		}
		
		// Mark channel as unavailable
		for (var row = Math.min(startY, endY); row <= Math.max(startY, endY); row++) {
			this.vertChannels[row][x][chan] = true;
		}
		
		// Channel number with 0 as center
		let relChan = chan - ((NUM_CHANNELS-1)/2);
		
		// X coordinate pixel of the channel and Y offset of the start/end position (if applicable)
		return [relChan * VERT_CHANNEL_SIZE + x*TD_WIDTH, relChan * ARROW_SIZE*2.5];
	}
	
	arrowHead(x, y, dir = DOWN, length = ARROW_SIZE) {
		if (dir == UP)    return [[x, y], [x-length, y+length], [x, y], [x+length, y+length], [x, y]];
		if (dir == DOWN)  return [[x, y], [x-length, y-length], [x, y], [x+length, y-length], [x, y]];
		if (dir == LEFT)  return [[x, y], [x+length, y-length], [x, y], [x+length, y+length], [x, y]];
		if (dir == RIGHT) return [[x, y], [x-length, y-length], [x, y], [x-length, y+length], [x, y]];
	}
}

class Arrow {
	// In = course arrow starts at; Out = course arrow ends at; fromSide = if arrows should be in/out the side of courses (corequisite)
	constructor(xIn, yIn, xOut, yOut, fromSide) {
		this.xIn = xIn;
		this.yIn = yIn;
		this.xOut = xOut;
		this.yOut = yOut;
		this.fromSide = fromSide;
	}
	
	// Pixels of start point (out of the bottom or right of course)
	startPoint(offset = 0) {
		if (this.fromSide) return [(this.xIn+.5)*TD_WIDTH + COURSE_WIDTH/2, (this.yIn+.5)*TD_HEIGHT+offset];
		else return [(this.xIn+.5)*TD_WIDTH+offset, (this.yIn+.5)*TD_HEIGHT + COURSE_HEIGHT/2];
	}
	
	// Pixels of end point (into the top or left of course)
	endPoint(offset = 0) {
		if (this.fromSide) return [(this.xOut+.5)*TD_WIDTH - COURSE_WIDTH/2, (this.yOut+.5)*TD_HEIGHT+offset];
		else return [(this.xOut+.5)*TD_WIDTH+offset, (this.yOut+.5)*TD_HEIGHT - COURSE_HEIGHT/2];
	}
	
	// Grid coordinates of junction point between first and second channels (for !fromSide, diagonally down-left or down-right from starting course)
	node1() {
		if (this.fromSide) return [this.xIn+1, (this.yOut > this.yIn) ? this.yIn+1 : this.yIn];
		else return [(this.xOut > this.xIn) ? this.xIn+1 : this.xIn, this.yIn+1];
	}
	
	// Grid coordinates of the junction point between the second and third channels (for !fromSide, below node1)
	node2() {
		if (this.fromSide) return [this.xOut, (this.yOut > this.yIn) ? this.yIn+1 : this.yIn];
		else return [(this.xOut > this.xIn) ? this.xIn+1 : this.xIn, this.yOut];
	}
}

/*
	Line positioning logic:
	 - "Channels" exist in between the courses 
	 - Each channel is the length/width of a single course, i.e. not the full size of the chart
	 - There is a fixed number of channels available (5)
	 - When drawing a line, the middle channel is used if available, if not it works its way outward
	 - Prerequisite lines go out of the bottom of a box, then left/right to the nearest vertical channel in the direction of the class below, then down all the way, then over to the class
	 - Corequisite lines are the same logic transposed (swap all x and y - out of the right side and into the left side of courses)
	 - As the lines are placed booleans are set to indicate which channels are in use so future lines don't draw on top of them
	 - Lines could be made different colors to make them easier to tell apart
	 - Channels are stored as two 3D arrays of booleans (x, y, and which of the 5 channels; one array for vertical and one for horizontal)
	 - Lines stay within the same channel when moving along horizontally or vertically - looks for a fully open one (findChannel function, takes start and end/dir/length)
	 - Could add 45 degree diagonal lines from starting/ending points to entering channels and rounding the nodes between channels
	 - If I wanted to allow shared lines for a course (like colored lines in draw.io), the 3D arrays would store which course/node the line is coming from instead of booleans)
*/