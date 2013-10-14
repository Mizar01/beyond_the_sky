/**
* Useful for all types of projectiles.
* This is a repository of reusable code.
*/
ProjectileFunctions = {
    damageTarget: function() {
        var bt = this.bulletType
        if (bt == "freeze") {
            this.target.addSlowEffect(this.damage, 30)
            return
        }
        if (bt == "fire" || bt == "laser" || bt == "missile") {
            //evaluate the random accuracy
            var maxDiff = this.accuracy
            var diffAcc = maxDiff - THREE.Math.randInt(0, 100)
            var realDamage = 0
            if (diffAcc < 0) {
                realDamage = this.damage/10
            }else {
                if (diffAcc < maxDiff/2) {
                    realDamage = this.damage
                }else {
                    realDamage = this.damage/2
                }
            }
            // console.log("Damage(real/max/accuracy%/diffAcc) : " + 
            //     realDamage + "/" + this.damage + "/" + this.accuracy +
            //     "/" + diffAcc)
            this.target.getDamage(realDamage, this.bulletType);
            return
        }
    }
} 

Bullet = function(owner, target, damage, accuracyPerc, type) {
    this.bulletType = type || "fire"   // fire, freeze (for Bullet instances)
    this.texture = { "fire": "media/particle2.png", 
                     "freeze": "media/particle.png"
                   }
    ACE3.ParticleActor.call(this, {
            texture: this.texture[this.bulletType],
            size: 2,
            spread: 0,
            particleCount: 1,
        });
    this.owner = owner
    this.ownerName = owner.name 
    this.target = target

    var tp = owner.getWorldCoords()
    this.origin = tp.clone();
    // NOTE : don't put the lookAt here, put in reset or in run function.
    this.collisionDistance = 0.5;
    this.speed = 0.2;
    this.needReset = true;
    this.timeToLive = 3; //seconds
    this.startTime = ace3.time.frameTime;
    this.damage = damage
    this.accuracy = accuracyPerc || 100

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

Bullet.prototype.damageTarget = ProjectileFunctions.damageTarget

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
    //Accuracy is no more used as random angle of shooting, but as a critical hit chance.
    //var prAngle = this.owner.getPrecisionRandomnessAngle();
    //this.obj.rotation.x += THREE.Math.randFloat(-1, 1) * prAngle; 
    //this.obj.rotation.y += THREE.Math.randFloat(-1, 1) * prAngle; 
    this.refresh()
    this.show()
    this.needReset = false
}

/**
* Special type of missile that point high in the sky and slowly point to the enemy after a lifting phase.
*/
MissileWarHead = function(owner, target, damage, accuracyPerc, type) {
    ACE3.Actor3D.call(this);
    this.bulletType = type || "missile" 
    this.speed = 0.005 + Math.random() * 0.005;
    this.obj = new THREE.Object3D();//new ACE3.Builder.cube(0.5, 0x000000);
    //var g = new THREE.CylinderGeometry(0.1, 0.3, 1.2)
    //this.polygon = new THREE.Mesh(g, new THREE.MeshBasicMaterial({'color':0x000000}))
    this.polygon = ACE3.Builder.cube2(0.2, 1.2, 0.2, 0x00ffff)
    this.polygon.rotation.x = + Math.PI/2;
    this.obj.add(this.polygon);
    this.obj.position.copy(owner.getWorldCoords())
    this.collisionDistance = 0.5;
    this.speed = 0.2;
    this.needReset = true;
    this.damage = damage
    this.accuracy = accuracyPerc || 100 
    this.target = target     
    //Actually the missile has always a target, so, there's no need for a time to live.
    this.timeToLive = null
    this.heightDelay = 25 //position to look above the position of target. It decreases at every frame.
}

MissileWarHead.extends(ACE3.Actor3D, "MissileWarHead")

MissileWarHead.prototype.run = function() {

    var te = this.target
    if (te == null || !te.alive) {
        this.setForRemoval()
    }else {
        var tp = te.obj.position
        var p = this.obj.position
        var tPoint = new THREE.Vector3(tp.x, tp.y + this.heightDelay, tp.z)
        if ( this.heightDelay <= 0 && tp.distanceTo(p) < this.collisionDistance) {
            this.damageTarget()
            this.target = null
            this.setForRemoval()
        }

        //moving and looking
        this.obj.lookAt(tPoint);
        this.obj.translateZ(this.speed);

        //decrease heightDelay
        if (this.heightDelay > 0) {
            this.heightDelay -= 0.2
        }else {
            this.heightDelay = 0
        }
    }
}

MissileWarHead.prototype.damageTarget = ProjectileFunctions.damageTarget



Laser = function(owner, target, damage, accuracyPerc) {
    this.bulletType = "laser"
    ACE3.Actor3D.call(this);
    this.damage = damage
    this.accuracy = accuracyPerc || 100
    this.timeToLive = new ACE3.CooldownTimer(.3)
    this.owner = owner
    this.target =target
    this.obj = new ACE3.Builder.line(owner.getWorldCoords(), target.getWorldCoords(), 0xffffff, 1)
}

Laser.extends(ACE3.Actor3D, "Laser")

Laser.prototype.run = function() {
    if (this.timeToLive.trigger()) {
        this.setForRemoval()
        ProjectileFunctions.damageTarget.call(this)

    }
}