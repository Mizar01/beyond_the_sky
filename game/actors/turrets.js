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
    this.child1 = ACE3.Builder.cube2(3, 0.2, 0.2, 0xff00ff)
    this.obj.add(this.child1)
    this.child1.position.set(-1, 0, 0)

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
    var fireTrigger = this.cooldown.trigger()
    var te = this.targetEnemy
    var enemyAngle = null
    var isFacingTarget = true
    if (ACE3.Actor.isAlive(te)) {
        var enemyAngle = this.getYaw(te.getWorldCoords())
        var modAngle = this.obj.rotation.y%(Math.PI * 2) - Math.PI 
        //onsole.log(modAngle + "--" + enemyAngle)
        if (Math.abs(modAngle - enemyAngle) < 0.05) {
            isFacingTarget = true;
        } else {
            isFacingTarget = false
        }
    }
    var canFire = fireTrigger && isFacingTarget
    //console.log(canFire)
    if (canFire) {
        if (te != null && te.alive) {
            //this.lookAtXZFixed(te.obj.position)
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
    //anyway rotate towards the target
    if (te != null && te.alive && enemyAngle != null) {
        this.rotateTowardsAngle(enemyAngle)
    }
}

Turret.prototype.rotateTowardsAngle = function(angle) {
    var d = ACE3.Math.getAngleDirection(this.obj.rotation.y, this.enemyAngle)
    this.obj.rotation.y += 0.01 * d
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



