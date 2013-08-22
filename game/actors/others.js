Bird = function() {
	ACE3.Actor3D.call(this);
	this.speed = 0.005 + Math.random() * 0.005;
	this.obj = new THREE.Object3D();//new ACE3.Builder.cube(0.5, 0x000000);
    var g = new THREE.CylinderGeometry(0.1, 0.3, 1.2)
    this.polygon = new THREE.Mesh(g, new THREE.MeshBasicMaterial({'color':0x000000}))
    this.polygon.rotation.x = + Math.PI/2;
	this.obj.add(this.polygon);
	var pp = player.obj.position;
	var baseRay = 15; //ray of distance from 0
	var height = THREE.Math.randInt(pp.y - 1, pp.y + 1); // initial height
	var angle = Math.random() * 6.28;
	var px = baseRay * Math.cos(angle) + pp.x; var pz = baseRay * Math.sin(angle) + pp.z;
	this.obj.position = new THREE.Vector3(px, height, pz);

	this.pickMaster = this.polygon;

	this.life = 10;


}

Bird.extends(ACE3.Actor3D, "Bird");

Bird.prototype.run = function() {
	var tp = player.obj.position;
	this.obj.lookAt(tp);
	this.obj.translateZ(this.speed);
	this.polygon.rotation.y += 0.1;
	if (this.obj.position.distanceTo(tp) < 0.5) {
		this.setForRemoval();
	}
}

Bird.prototype.getDamage = function(qta) {
	this.life -= qta;
	if (this.life <= 0) {
        player.addExp(10)
        currentPlatform.overrideTime--
		this.setForRemoval();
	}
}



Bullet = function(owner, target, damage) {
    ACE3.ParticleActor.call(this, {
            texture: 'media/particle2.png',
            size: 2,
            spread: 0,
            particleCount: 1,
        });
    this.owner = owner
    this.ownerName = owner.name 
    this.target = target

    var tp = owner.obj.position;
    this.origin = tp.clone();
    // NOTE : don't put the lookAt here, put in reset or in run function.
    this.collisionDistance = 0.5;
    this.speed = 0.2;
    this.needReset = true;
    this.timeToLive = 3; //seconds
    this.startTime = ace3.time.frameTime;
    this.damage = damage

}
Bullet.extends(ACE3.ParticleActor, "Bullet")

Bullet.prototype.run = function() {
    if (this.needReset) {
        this.reset()
    }
    if (ace3.time.frameTime - this.startTime > this.timeToLive) {
        this.setForRemoval()
        return
    }
    if (this.target != null) {
    	var d = this.obj.position.distanceTo(this.target.obj.position)
	    if (d < this.collisionDistance) {
	        this.damageTarget()
	        this.target = null
	        this.setForRemoval()
	    }else { 
	    	this.obj.translateZ(this.speed);
	    }
    }

}

Bullet.prototype.damageTarget = function() {
	this.target.getDamage(this.damage);
}

Bullet.prototype.reset = function(vec3Pos) {
    //this.duration = 0.3
    this.hide()
    var vec3Pos = vec3Pos || this.origin
    this.obj.position.copy(vec3Pos)
    for (var pi = 0; pi < this.particleCount; pi++) {
        var p = this.obj.geometry.vertices[pi]
        p.copy(new THREE.Vector3(0, 0 , pi * 6))
    }
    this.origin.copy(vec3Pos)
    this.obj.lookAt(this.target.obj.position.clone());
    var prAngle = this.owner.getPrecisionRandomnessAngle();
    this.obj.rotation.x += THREE.Math.randFloat(-1, 1) * prAngle; 
    this.obj.rotation.y += THREE.Math.randFloat(-1, 1) * prAngle; 
    this.refresh()
    this.show()
    this.needReset = false
}


GunTurret = function() {
    alert("TODO : new turret created")
}



// CheckPoint = function(vec3pos, index) {
//     ACE3.ParticleActor.call(this, {
//             texture: 'media/particle2.png',
//             size: 2,
//             spread: 0,
//             particleCount: 1,
//         });   
//     this.origin = vec3pos;
//     // NOTE : don't put the lookAt here, put in reset or in run function.
//     this.collisionDistance = 0.5;
//     this.needReset = true;
//     this.index = index;  //index in the checkpointArray
// }

// CheckPoint.extends(ACE3.ParticleActor, "CheckPoint")

// CheckPoint.prototype.run = function() {
//     if (this.needReset) {
//         this.reset()
//     }
//     this.obj.rotation.z += 0.1;
// }

// CheckPoint.prototype.reset = function(vec3Pos) {
//     //this.duration = 0.3
//     this.hide()
//     var vec3Pos = vec3Pos || this.origin
//     this.obj.position.copy(vec3Pos)
//     for (var pi = 0; pi < this.particleCount; pi++) {
//         var p = this.obj.geometry.vertices[pi]
//         p.copy(new THREE.Vector3(0, 0 , pi * 6))
//     }
//     this.refresh()
//     this.show()
//     this.needReset = false
// }






