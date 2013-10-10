Enemy = function() {
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

	this.life = 3;

    this.isEnemy = true

    this.slowEffectPower = 0
    this.slowEffectTimer = null


}

Enemy.extends(ACE3.Actor3D, "Enemy");

Enemy.prototype.run = function() {
	var tp = player.obj.position;
	this.obj.lookAt(tp);
	this.obj.translateZ(this.calculateSpeed());
	this.polygon.rotation.y += 0.1;
	if (this.obj.position.distanceTo(tp) < 0.5) {
		this.setForRemoval();
	}
}

Enemy.prototype.getDamage = function(qta, bulletType) {
    //the last damage must be done only once, 
    //so if the enemy is dead the damage does not apply.

    //The variable bulletType is used to some special
    //enemies that has special properties when getting damage from
    //some types of projectiles.

    if (!this.alive) {
        return
    }
	this.life -= qta;
	if (this.life <= 0) {
        player.addExp(10)
        currentPlatform.overrideTime--
		this.setForRemoval();
        gameManager.registerActor(new ACE3.Explosion(this.obj.position))
	}
}


Enemy.prototype.addSlowEffect = function(power, duration) {
    /* Only one slow effect if no other slow effect is already applied */
    if (this.slowEffectPower <= 0) {
        this.slowEffectPower = power
        this.slowEffectTimer = new ACE3.CooldownTimer(duration)
    }
    // console.log("added slow effect to " + this.getId() + "with power of " + this.slowEffectPower)
}

Enemy.prototype.calculateSpeed =function() {
    if (this.slowEffectPower > 0) {
        var tr = this.slowEffectTimer.trigger()
        if (tr) {
            this.slowEffectPower = 0
            this.slowEffectTimer = null
            return this.speed
        }else {
            return Math.max(0, this.speed - this.slowEffectPower)
        }
    }else {
        return this.speed
    }
}

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




Turret = function(height, hexColor, textureJpg, owner) {
    ACE3.Actor3D.call(this);
    this.height = height || 2
    this.owner = owner || player
    this.uniform = ACE3.Utils.getStandardUniform()
    this.uniform.color.value = ACE3.Utils.getVec3Color(hexColor) || ACE3.Utils.getVec3Color(0xffffff)
    this.texture = textureJpg || "media/tower.jpg"
    this.uniform.texture1 = {type: 't', value: THREE.ImageUtils.loadTexture( this.texture )}
    var g = new THREE.CylinderGeometry(0.5, 0.7, this.height)  //high base, low base, height  
    this.obj = ACE3.Utils.getStandardShaderMesh(this.uniform, "generic", "fragmentShaderTower", g)

    // power and cooldown time are calculated every time they are needed to 
    // syncrhronize with the player upgrades.
    this.power = 0
    this.cooldown = new ACE3.CooldownTimer(this.calculateCooldown())
    this.targetEnemy = null
}

Turret.extends(ACE3.Actor3D, "Turret")

Turret.prototype.calculateCooldown = function() {
    return Math.max(1,4 - this.owner.levels.turretRate.level)
}
Turret.prototype.calculatePower = function() {
    return this.owner.levels.turretPower.level
}

Turret.prototype.place = function(platform, vec2pos) {
    var pp = platform.obj.position;
    this.obj.position.set(vec2pos.x, this.height/2, vec2pos.y)
}

Turret.prototype.run = function() {
    var canFire = this.cooldown.trigger()
    var te = this.targetEnemy
    //console.log(canFire)
    if (canFire) {
        if (te != null && te.alive) {
            this.lookAtXZFixed(te.obj.position)
            this.shoot(te)
            this.cooldown.restart(this.calculateCooldown())
            return
        }

        //here the enemy is not set or is dead
        this.targetEnemy = null
        if (this.owner != null) {
            this.targetEnemy = this.findNearestTarget()
        }
    }
    this.obj.rotation.y += 0.003
}

/**
Find the nearest target among the first n enemy found.
I limit the search to the first n enemies because they probably
are the older on the screen and in any case this should give
a little shooting variation to tower (different towers have different targets)
**/
Turret.prototype.findNearestTarget = function() {
    var guessLimit = 4
    var guessIndex = 0
    var minDistance = -1
    var nearestTarget = null
    for (ia in gameManager.actors) {
        var a = gameManager.actors[ia]
        if (a.isEnemy && a.alive) {
            var d = this.getWorldCoords().distanceTo(a.obj.position)
            if (guessIndex == 0 || d < minDistance) {
                minDistance = d
                nearestTarget = a
            }
            if (guessIndex >= guessLimit) {
                break //force to exit main search loop.
            }
            guessIndex ++
        }
    }
    return nearestTarget
}

Turret.prototype.shoot = function(target) {
    gameManager.registerActor(new Bullet(this, target, this.calculatePower()));
}

Turret.prototype.destroy = function() {
    this.setForRemoval()
    gameManager.registerActor(new ACE3.Explosion(this.getWorldCoords()))
}

GunTurret = function() {
    Turret.call(this, 1, 0xff0000)
}
GunTurret.extends(Turret, "GunTurret")

/**
* Laser Turret has great power and very high cooldown time
* and it shoot lasers objects
*/
LaserTurret = function() {
    Turret.call(this, 1, 0xffffaa)
}
LaserTurret.extends(Turret, "LaserTurret")

LaserTurret.prototype.calculateCooldown = function() {
    //TODO : for now the cooldown is low for testing
    return Math.max(1,5 - this.owner.levels.turretRate.level)
}

LaserTurret.prototype.calculatePower = function() {
    return this.owner.levels.turretPower.level * 30
}
LaserTurret.prototype.shoot = function(target) {
    gameManager.registerActor(new Laser(this, target, this.calculatePower()))
}


MissileTurret = function() {
    Turret.call(this, 1, 0xff00ff)
}
MissileTurret.extends(Turret, "MissileTurret")

MissileTurret.prototype.calculateCooldown = function() {
    //TODO : for now the cooldown is low for testing
    return Math.max(1,8 - this.owner.levels.turretRate.level)
}

MissileTurret.prototype.calculatePower = function() {
    return this.owner.levels.turretPower.level * 30
}
MissileTurret.prototype.shoot = function(target) {
    gameManager.registerActor(new MissileWarHead(this, target, this.calculatePower()))
}
/**
* Finds a randomTarget
* TODO : that can lead to slowdowns. Try other solutions.
*/
MissileTurret.prototype.findNearestTarget = function() {
    var filterProperty = "isEnemy"
    var filterValue = "true"
    var to = ACE3.Math.getRandomObject(gameManager.actors, filterProperty, filterValue)
    if (to.isEnemy && to.alive) {
        return to
    }
    return null
}



IceTurret = function() {
    Turret.call(this, 1, 0x0000ff)
}
IceTurret.extends(Turret, "IceTurret")

IceTurret.prototype.calculateCooldown = function() {
    //TODO : for now the cooldown is low for testing
    return Math.max(1,6 - this.owner.levels.turretRate.level)
}

IceTurret.prototype.calculatePower = function() {
    return this.owner.levels.turretPower.level/50
}
IceTurret.prototype.shoot = function(target) {
    gameManager.registerActor(new Bullet(this, target, this.calculatePower(), 100, "freeze"))
}

//rewrite run so it can find a new target every time
IceTurret.prototype.run = function() {
    //It's useless to call this every frame, i'll call it whenever the tower can fire.
    if (this.cooldown.trigger()) {
        //time to find a new target
        this.targetEnemy = this.findNearestTarget()
    }
    IceTurret.superClass.run.call(this)
}

// rewrite the findNearestTarget for the IceTurret, so it can fire 
// at enemies that are not already affect by the slowdown.
IceTurret.prototype.findNearestTarget = function() {
    var guessLimit = 4
    var guessIndex = 0
    var minDistance = -1
    var nearestTarget = null
    for (ia in gameManager.actors) {
        var a = gameManager.actors[ia]
        // if (a.isEnemy && a.alive) {
        //     console.log(a.getId() + "-> " + a.slowEffectPower)
        // }
        if (a.isEnemy && a.alive && a.slowEffectPower <= 0) {
            var d = this.getWorldCoords().distanceTo(a.obj.position)
            if (guessIndex == 0 || d < minDistance) {
                minDistance = d
                nearestTarget = a
            }
            if (guessIndex >= guessLimit) {
                break //force to exit main search loop.
            }
            guessIndex ++
        }
    }
    // if (nearestTarget != null) {
    //     console.log(">>>>> " + nearestTarget.getId() + "->" + nearestTarget.slowEffectPower)
    // }
    return nearestTarget
}



