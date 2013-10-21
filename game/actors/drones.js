Drone = function(owner) {
	ACE3.Actor3D.call(this);
	this.speed = 0.05 + Math.random() * 0.05;
	this.lifeTime = new ACE3.CooldownTimer(2, false);
	// A drone has a pivot in the center of the owner, and it's a child of the owner object
	this.obj = new THREE.Object3D();//new ACE3.Builder.cube(0.5, 0x000000);


	this.life = 30;


}

Drone.extends(ACE3.Actor3D, "Drone");


Drone.prototype.run = function() {
	this.obj.rotation.y+= this.speed
	if (this.lifeTime.trigger()) {
		this.setForRemoval()
	}
}

HealingDrone = function(owner) {
	Drone.call(this, owner)
    this.droneObj = ACE3.Builder.sphere(0.3, 0xffffff)
    this.droneObj.position.set(0, 0, 3)
	this.obj.add(this.droneObj)
}

HealingDrone.extends(Drone, "HealingDrone")

HealingDrone.prototype.run = function() {
	this.getSuperClass().run.call(this)
}


DefenseDrone = function(owner) {
	Drone.call(this, owner)
    this.droneObj = ACE3.Builder.sphere(0.3, 0xffff00)
    this.droneObj.position.set(0, 0, 4)
	this.obj.add(this.droneObj)
	this.speed = - this.speed
}

DefenseDrone.extends(Drone, "DefenseDrone")

DefenseDrone.prototype.run = function() {
	this.getSuperClass().run.call(this)
}


