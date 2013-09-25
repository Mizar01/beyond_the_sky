Platform = function(vec3pos, width, color, mass) {
	ACE3.Actor3D.call(this);
	this.mass = mass || 0;
	this.width = width;
	this.color = color;
	this.uniform = ACE3.Utils.getStandardUniform();
	this.uniform.borderSize = { type: 'f', value: '0.1'};
	this.uniform.borderColor = {type: 'v3', value: ACE3.Utils.getVec3Color(0xffffff)};
	this.uniform.color.value = ACE3.Utils.getVec3Color(color);
	var g = new THREE.CubeGeometry(width, 0.3, width)
	var smTemp = ACE3.Utils.getStandardShaderMesh(this.uniform, "generic", "borderShader", g)
	var physMesh = Physijs.createMaterial(smTemp.material, 0.4, 0.6);
	this.obj = new Physijs.BoxMesh(g, physMesh, this.mass);
	this.checkPoint = null;

	this.spawnPosition = new THREE.Vector3(vec3pos.x, 0, vec3pos.z); // position where the platform spawn and move towards the first of the move positions.
	this.obj.position = this.spawnPosition
	this.movePositions = [vec3pos]; //array of positions for an eventual moving of the platform during game.
	this.overrideTime = 100;

	this.ground == false

	this.movePhase = "moveToStart"  //moveToStart = when the platform spawn and move towards the first move position
	                                //waitingRobotJump = the platform is in place and is waiting the coming of robot
	                                //ready = the platform is ready to play with robot
	                                //waitingRobotGo = the platform is waiting that the robot goes away 
	                                //dismiss = the platform has been kicked away from the game

	this.buildingSlots = new Array(8) //array of buiding slots. For now there are only 8 slots

}

Platform.extends(ACE3.Actor3D, "Platform");

Platform.prototype.run = function() {

	if (this.movePhase == 'moveToStart') {
		var distY = Math.abs(this.obj.position.y - this.movePositions[0].y);
		//console.log(this.obj.position.y + " ---- " + this.movePositions[0].y); 
		if (distY < 0.3) {
			// console.log("reached dest");
			this.obj.position = this.movePositions[0].clone();
			this.movePhase = "waitingRobotJump";
		}else {
			this.obj.position.y += 0.1;
		}
		this.obj.__dirtyPosition = true;
		return;
	}

	if (this.movePhase == 'waitingRobotJump') {
		// do nothing. The robot will send the signal to change movePhase
		return;
	}

	if (this.movePhase == 'ready') {
		if (this.overrideTime <= 0) {
			this.spawnNextPlatform();
			this.movePhase = 'waitingRobotGo';
		}else {
			this.overrideTime-=.5;
			// TODO : move eventually trough rally points (array of movePositions)
		}
		return;
	}

	if (this.movePhase == 'waitingRobotGo') {
		// do nothing
		return;
	}


	if (this.movePhase == 'dismiss') {
		// For now the object is falling down to the ground.
		if (this.obj.position.y < 0.5) {
			this.setForRemoval();
		}

		return;
	}

}

Platform.prototype.isWaitingRobotJump = function() {
	return this.movePhase == 'waitingRobotJump'
}

/**
* Set the phase to ready. This is called by robot when he jumps in
**/
Platform.prototype.setReady = function() {
	this.movePhase = 'ready';

	if (!this.ground) {
		prevPlatform = currentPlatform;
		if (!prevPlatform.ground) {
			prevPlatform.setDismiss();
		}
	}
	currentPlatform = this;
	nextPlatform = null;
}

Platform.prototype.setDismiss  = function() {
	this.movePhase = 'dismiss';
	this.obj.rotation.z = -0.1
	this.obj.__dirtyRotation = true
	this.obj.__dirtyPosition = true
	this.obj.mass = 0.2
}


/**
* Spawns a brand new platform after this one
**/
Platform.prototype.spawnNextPlatform = function() {
	var width = 8;
    var dist = 11; //x,z distance between sequential platforms
    var c = GameUtils.getRandomHexColor();
    //The distance is constant. So the position of the next plaform 
    //(x, z) is in a circle around the former platform.
    var rAngle = THREE.Math.randFloat(0, Math.PI * 2);
    var rx = dist * Math.cos(rAngle);
    var rz = dist * Math.sin(rAngle);

    initPos = new THREE.Vector3(rx, 0, rz);
    initPos.add(this.obj.position);
    initPos.y = this.obj.position.y + 2.5;

    var p = new Platform(initPos, width, c, 0);

    //p.setPickable();
    gameManager.registerActor(p);
    nextPlatform = p;
}

Platform.prototype.getUsedSlots = function() {
	var c = 0
	for (var i = 0; i < this.buildingSlots.length; i++) {
		if (this.buildingSlots[i] != null) {
			c++
		}
	}
	return c
}

Platform.prototype.getFreeSlot = function() {
	for (var i = 0; i < this.buildingSlots.length; i++) {
		if (this.buildingSlots[i] == null) {
			return i
		}
	}
	return -1
}

Platform.prototype.getSlotPosition = function(index) {
	var pos = [ new THREE.Vector2(-1, -1),
				new THREE.Vector2(-1, 0),
				new THREE.Vector2(-1, 1),
				new THREE.Vector2(0, -1),
				new THREE.Vector2(0, 1),
				new THREE.Vector2(1, -1),
				new THREE.Vector2(-1, 0),
				new THREE.Vector2(-1, 1)
			   ]
	return pos[index]

}


Platform.prototype.addBuild = function(typeName, owner) {

	var iFreeSlot = this.getFreeSlot()
	if (iFreeSlot != -1) {
		var bPos = this.getSlotPosition(iFreeSlot)
		var b = new window[typeName](owner)
		b.place(this, bPos)
		this.buildingSlots[iFreeSlot] = b
	}else {
		console.log("WARNING: no free slots available.")
	}


}





