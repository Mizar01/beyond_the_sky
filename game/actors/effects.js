AscendingPolygon = function() {
	ACE3.Actor3D.call(this);
	this.speed = Math.random() * 0.1;
	this.obj = new THREE.Object3D(); // pivot
	this.polygon = ACE3.Builder.cube(Math.random() * 5 + 5, GameUtils.getRandomHexColor());
	this.obj.add(this.polygon);
	var baseRay = 130; //ray of distance from 0
	var height = THREE.Math.randInt(player.obj.position.y - 50, player.obj.position.y + 50); // initial height
	var angle = Math.random() * 6.28;

	var px = baseRay * Math.cos(angle); var pz = baseRay * Math.sin(angle);
	this.obj.position = new THREE.Vector3(px, height, pz);
}

AscendingPolygon.extends(ACE3.Actor3D, "AscendingPolygon");

AscendingPolygon.prototype.run = function() {
	this.polygon.rotation.x += 0.01;
	this.polygon.rotation.y += 0.02;
	this.obj.position.y += this.speed;
	if (this.obj.position.y > player.obj.position.y + 50) {
		this.obj.position.y = player.obj.position.y - 50;
	}
}