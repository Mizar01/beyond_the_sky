Drone = function(owner) {
	ACE3.Actor3D.call(this);
	this.speed = 0.005 + Math.random() * 0.005;
	this.lifeTime = new ACE3.CooldownTimer(10, false);
	// A drone has a pivot in the center of the owner, and it's a child of the owner object
	this.obj = new THREE.Object3D();//new ACE3.Builder.cube(0.5, 0x000000);
    this.droneObj = ACE3.Builder.sphere(0.3, 0xffffff)
    this.droneObj.position.set(0, 0, 4)
	this.obj.add(this.droneObj);

	this.life = 30;


}

Drone.extends(ACE3.Actor3D, "Drone");


Drone.prototype.run = function() {
	this.obj.rotation.y+= 0.3
	if (this.lifeTime.trigger()) {
		this.setForRemoval()
	}
}

HealingDrone = function(owner) {
	Drone.call(this, owner)
}

HealingDrone.extends(Drone, "HealingDrone")

