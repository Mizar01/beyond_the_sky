Drone = function(owner) {
	ACE3.Actor3D.call(this);
	this.speed = 0.03 + Math.random() * 0.02;
	this.lifeTime = new ACE3.CooldownTimer(20, false);
	// A drone has a pivot in the center of the owner, and it's a child of the owner object
	this.obj = new THREE.Object3D();//new ACE3.Builder.cube(0.5, 0x000000);
	this.owner = owner

	this.life = 30;

	this.realPosition = null //used to store the value without beiing asked every time.
	                         //it will be updated every cycle once.


}

Drone.extends(ACE3.Actor3D, "Drone");

/**
* Because the drone has its center to the owner position but 
* we want the real appearing position there's a custom method here.
*/
Drone.prototype.updateRealPosition = function() {
	var wc = new THREE.Vector3(0, 0, 0)
	return this.droneObj.localToWorld(wc)
}



Drone.prototype.run = function() {
	this.realPosition = this.updateRealPosition()
	this.obj.rotation.y+= this.speed
	if (this.lifeTime.trigger()) {
		this.owner.removeDrone(this.getType())
	}
}

HealingDrone = function(owner) {
	Drone.call(this, owner)
    this.droneObj = ACE3.Builder.sphere(0.3, 0xffffff)
    this.droneObj.position.set(0, 0, 3)
	this.obj.add(this.droneObj)
	this.healingTimer = new ACE3.CooldownTimer(1, true)
	this.healPower = 2
}

HealingDrone.extends(Drone, "HealingDrone")

HealingDrone.prototype.run = function() {
	this.getSuperClass().run.call(this)
	if (this.healingTimer.trigger()) {
		this.owner.heal()
	}
}

DefenseDrone = function(owner) {
	Drone.call(this, owner)
    this.droneObj = ACE3.Builder.sphere(0.3, 0xffff00)
    this.droneObj.position.set(0, 0, 4)
	this.obj.add(this.droneObj)
	this.bladeObj1 = ACE3.Builder.cylinder(0.15, 0.5, 0x0000ff, 0.01)
	this.bladeObj1.position.set(0, -0.45 , 0)
	this.bladeObj2 = ACE3.Builder.cylinder(0.15, 0.5, 0x0000ff, 0.01)
	this.bladeObj2.position.set(0, 0.45 , 0)
	this.bladeObj2.rotation.set(0, 0, -Math.PI)	

	this.bladeObj3 = ACE3.Builder.cylinder(0.15, 0.5, 0x0000ff, 0.01)
	this.bladeObj3.position.set(-0.45, 0, 0)
	this.bladeObj3.rotation.set(0, 0, -Math.PI/2)		
	this.bladeObj4 = ACE3.Builder.cylinder(0.15, 0.5, 0x0000ff, 0.01)
	this.bladeObj4.position.set(0.45, 0, 0)
	this.bladeObj4.rotation.set(0, 0, Math.PI/2)	
	this.droneObj.add(this.bladeObj1)
	this.droneObj.add(this.bladeObj2)
	this.droneObj.add(this.bladeObj3)
	this.droneObj.add(this.bladeObj4)
	this.speed = - this.speed

}

DefenseDrone.extends(Drone, "DefenseDrone")

DefenseDrone.prototype.run = function() {
	this.getSuperClass().run.call(this)
	this.droneObj.rotation.add(new THREE.Vector3(0.1, 0.08, 0))
}