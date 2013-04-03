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
	this.obj.position = vec3pos;
	this.checkPoint = null;
}

Platform.extends(ACE3.Actor3D, "Platform");

Platform.prototype.placeCheckPoint = function() {
	var cp = new CheckPoint(this.obj.position.clone().add(new THREE.Vector3(0, 1, 0)));
	//checkpoints are not children of platform.
	gameManager.registerActor(cp);
	this.checkPoint = cp;

}

