Platform = function(vec3pos, width, color) {
	ACE3.Actor3D.call(this);
	this.width = width;
	this.color = color;
	this.uniform = ACE3.Utils.getStandardUniform();
	this.uniform.borderSize = { type: 'f', value: '0.1'};
	this.uniform.borderColor = {type: 'v3', value: ACE3.Utils.getVec3Color(0xffffff)};
	this.uniform.color.value = ACE3.Utils.getVec3Color(color);
	var g = new THREE.CubeGeometry(width, 0.3, width)
	this.obj = ACE3.Utils.getStandardShaderMesh(this.uniform, "generic", "borderShader", g)
	this.obj.position = vec3pos;
}

Platform.extends(ACE3.Actor3D, "Platform");
