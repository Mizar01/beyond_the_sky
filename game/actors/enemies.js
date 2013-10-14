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
	var height = THREE.Math.randInt(pp.y , pp.y + 3); // initial height
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