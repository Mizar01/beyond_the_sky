Player = function(firstPlatform) {
    ACE3.Actor3D.call(this);
    //this.obj = ACE3.Builder.sphere(0.5, 0x0000ff);
    var color = 0x0000ff;
    var g = new THREE.SphereGeometry(0.5);
    var m = Physijs.createMaterial(new THREE.MeshBasicMaterial({'color':color}),
            50, // low friction (sliding)
            .1 // very low restitution (bouncing)
            );
    this.obj = new Physijs.BoxMesh(g, m,
            1 // mass
            );

    //ARMS ---------------------------
    this.armLeftPivot = new THREE.Object3D()
    this.armLeftPivot.position.x = 0.4;
    this.armLeftPivot.rotation.set(0.4, -Math.PI/2, 0);
    this.armLeft = ACE3.Builder.cube2(0.5, 0.15, 0.15, 0x00ff00)
    this.armLeft.position.x = 0.4;
    this.armLeftPivot.add(this.armLeft)

    this.armRightPivot = new THREE.Object3D()
    this.armRightPivot.position.x = - 0.4;
    this.armRightPivot.rotation.set(0.4, -Math.PI/2, 0);
    this.armRight = ACE3.Builder.cube2(0.5, 0.15, 0.15, 0x00ffaa)
    this.armRight.position.x = 0.4;
    this.armRightPivot.add(this.armRight)

    this.obj.add(this.armLeftPivot);
    this.obj.add(this.armRightPivot);
    //---------------------------------

    this.jumping = false;
    this.forceVertical = 0;
    this.forceForward = 0;
    this.target = null;
    this.basePlatform = firstPlatform;
    this.checkPointIndex = -1;
    this.damage = 5;
    this.precision = 50; // percentage
    this.cooldown = 0.5; 
    this.currentCooldown = 0;
    this.playerControlsLogic = null;
    this.currentRotationY = 0;
    this.rotationSpeed = 0.08;
    this.speed = 0.03;

    this.verifyStableMax = 4;  //for some iteration i have to verify the velocity to be less 
                                //to a value to decide to re-enable jumps.
    this.verifyStableCount = this.verifyStableMax;

    //rpg like properties
    this.levels = new LevelDB();
}

Player.extends(ACE3.Actor3D, "Player");

Player.prototype.run = function() {

    // if (this.target != null && this.target.checkPoint != null) {
    //     var cp = this.target.checkPoint.obj.position;
    //     if (this.obj.position.distanceTo(cp) < 1) {
    //         this.basePlatform = this.target;
    //         var newCPIndex = this.target.checkPoint.index;
    //         //removes all the previous checkpoints from the scene
    //         for (var i = this.checkPointIndex + 1; i <= newCPIndex; i++) {
    //             checkPoints[i].setForRemoval();
    //         }
    //         this.checkPointIndex = newCPIndex;
    //     }
    // }

    if (this.target != null) {
        var pf = this.target.obj.position;
        var pp = this.obj.position;
        if (pp.distanceTo(pf) < 3 && pp.y > pf.y) {
            if (this.target.checkPoint != null) {
                this.checkPointReached();
            }
            //this.resetJump(this.target);
        }
    }

    if (this.obj.position.y < this.basePlatform.obj.position.y) {
        player.resetJump(this.basePlatform);
        this.target = null;            
    }


    // this block controls if the player has a poor velocity for 
    // a sequence of iterations. If the player does not verify this 
    // situation, the counter for verifications is reset to Max.

    if (this.jumping) {
        var lv = this.obj.getLinearVelocity();
        if (lv.lengthSq() < 0.4) {
            this.verifyStableCount--;
            if (this.verifyStableCount <= 0) {
                this.jumping = false;
                this.verifyStableCount = this.verifyStableMax;
            }
        }else {
            this.verifyStableCount  = this.verifyStableMax;
        }
    }
    //this.obj.translateZ(this.forceForward);
    //this.obj.position.y += this.forceVertical;

    //this.forceVertical -= 0.02;
    //this.forceForward -= 0.005;
    //if (this.forceForward < 0) {
    //    this.forceForward = 0;
    //}

    // if (this.forceVertical < 0 && this.target.obj.position.y > this.obj.position.y + 3) {

    // } else {
    //     if (this.targetReached()) {
    //         this.jumping = false;
    //         this.adjustHeightOnTarget();
    //         this.basePlatform = this.target;
    //         this.target = null;
    //         // this.changeBGColor();
    //     }
    // }

}


Player.prototype.checkPointReached = function() {
    this.basePlatform = this.target;
    var newCPIndex = this.target.checkPoint.index;
    //removes all the previous checkpoints from the scene
    for (var i = this.checkPointIndex + 1; i <= newCPIndex; i++) {
        checkPoints[i].setForRemoval();
    }
    this.checkPointIndex = newCPIndex;
}

/**
* This method works only for non post processing mode.
*/ 
Player.prototype.changeBGColor = function() {
    var h = this.obj.position.y;
    var hr = 255 - h;
    var hg = 255 - h;
    var hb = 255;
    var hc = ACE3.Utils.rgb2hex(hr, hg, hb);
    ace3.setBGColor(hc);
}

Player.prototype.resetJump = function(resetPlatform) {
    this.obj.position = resetPlatform.obj.position.clone();
    this.obj.position.y += 1;
    //this.obj.rotation.y = this.currentRotationY;
    this.obj.rotation.x = 0;
    this.obj.rotation.z = 0;
    this.obj.updateMatrix();
    this.obj.__dirtyPosition = true;
    this.obj.__dirtyRotation = true;
    this.obj.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    //player.obj.applyImpulse(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));  
    this.jumping = false;    
}

// Player.prototype.targetReached = function() {
//     var tp = this.target.obj.position;
//     var p = this.obj.position;
//     var tolerancePerc = 0.9;
//     var tw = this.target.width * tolerancePerc;
//     if (p.x > tp.x - tw/2 && p.x < tp.x + tw/2 && 
//         p.z > tp.z - tw/2 && p.z < tp.z + tw/2 && 
//         p.y > tp.y + 0.2  && p.y < tp.y + 0.7) {
//         return true;
//     }
//     return false;
// }

Player.prototype.adjustHeightOnTarget = function() {
    this.obj.position.y = this.target.obj.position.y + 0.6;
}

/**
* direction = -1 for left, 1 for right
*/
Player.prototype.rotate = function(direction) {
    this.currentRotationY += direction * this.rotationSpeed;
    this.obj.rotation.y = this.currentRotationY;
    this.obj.rotation.z = 0;
    this.obj.rotation.x = 0;
    player.obj.__dirtyRotation = true;
    // console.log(this.obj.rotation.y);
}

/**
* direction = 1 for forward, -1 for backward
*/
Player.prototype.move = function(direction) {
    this.obj.translateZ(this.speed * direction);
    player.obj.__dirtyPosition = true;
    // console.log(this.obj.rotation.y);
}


Player.prototype.jump = function(platform, force) {
    if (!this.jumping) {
        // position for jumping
        //var pz = platform.obj.position.z;
        //var px = platform.obj.position.x;

        // adjust angle
        var fakeHeightAdded = 10;
        var tvpos = platform.obj.position.clone().add(new THREE.Vector3(0, fakeHeightAdded, 0));
        var dir = ACE3.Math.getDirection(this.obj.position, tvpos);
        this.forceForward = force / 4;
        this.forceVertical = force/100;

        // JUMP !!
        this.obj.applyImpulse(dir.multiplyScalar(this.forceForward), new THREE.Vector3(0, 0, 0));

        //console.log(dir.multiplyScalar(1));
        this.jumping = true;
        this.target = platform;
    }
}

/*
* Auto calculates the force needed to jump
*/
Player.prototype.autoJump = function(platform) {
    if (!this.jumping) {
        var forceRatio = 38;
        //console.log("forceRatio:" + forceRatio);

        // var dist = this.obj.position.distanceTo(platform.obj.position);
        // var distXZ = player.XZDistanceTo(platform);
        //console.log("distXZ: " + distXZ);
        // if (distXZ > 1 && distXZ < 5) {
        //     console.log("applying special ratio");
        //     forceRatio *= 10/distXZ;
        // }
        this.jump(platform, forceRatio);
    }
}

Player.prototype.lookAtXZFixed = function(targetPos) {
    // is taking into consideration the phisics engine, so the rotation must be reset
    // before doing anything.
    this.obj.rotation.set(0, 0, 0);
    this.obj.updateMatrix();
    this.getSuperClass().lookAtXZFixed.call(this, targetPos);
    //this.currentRotationY = this.obj.rotation.y;
    this.obj.__dirtyRotation = true;

}

Player.prototype.shootAt = function(target) {
    gameManager.registerActor(new Laser(this, target));
}

Player.prototype.getPrecisionRandomnessAngle = function() {
    // a vector 0,0,0 it's the 100% precision !
    var randPrecision = THREE.Math.randInt(0, 50) + this.precision;
    var maxOut = Math.PI/8; // this should happens if randomPrecision is 0
    return maxOut - randPrecision/100 * maxOut; // value between 0 and maxOut
}

Player.prototype.addControls = function() {
    playerControlsLogic = new ACE3.Logic();
    playerControlsLogic.selectedPlatform = null;
    playerControlsLogic.selectedBird = null;
    playerControlsLogic.jumpForce = 0;
    playerControlsLogic.player = this;

    //selectorLogic.info = new ACE3.DisplayValue("Force", "0", ace3.getFromRatio(5, 5));

    playerControlsLogic.run = function() {
        var pm = ace3.pickManager
        var em = ace3.eventManager
        // rotation left / right
        if (em.pressed(em.keyCodes.arrow_left)) {
            this.player.rotate(1);
        }else if (em.pressed(em.keyCodes.arrow_right)) {
            this.player.rotate(-1);
        }
        if (em.pressed(em.keyCodes.arrow_up)) {
            this.player.move(-1);
        }else if (em.pressed(em.keyCodes.arrow_down)) {
            this.player.move(1);
        }
        
    }
    this.playerControlsLogic = playerControlsLogic;
}


/**
   Set of levels for player (or other units as well in some cases)
*/
function LevelDB() {

    this.exp = 0
    
    this.weaponPower = new LevelProperty("Weapon Power", 1, 3)
    this.weaponAccuracy = new LevelProperty("Accuracy", 1, 3)
    this.weaponRate = new LevelProperty("Fire Rate", 1, 3)

    this.shieldMax = new LevelProperty("Shield Max Capacity", 1, 3)
    this.shieldRegeneration = new LevelProperty("Shield Gen", 1, 3)
    this.shieldStrength = new LevelProperty("Shield Repulsion", 1, 3)

    this.turretPower = new LevelProperty("Turret Fire Power", 1, 3)
    this.turretRate = new LevelProperty("Turret Fire Rate", 1, 3)
    this.turretMax = new LevelProperty("Max no. of turrets", 0, 10)

    this.life = new LevelProperty("Life", 1, 3)
    this.lifeRegeneration = new LevelProperty("Life Gen", 1, 3)

    this.expGain = new LevelProperty("Exp Gain", 1, 3)

    this.canUpgrade = function(lvlProp) {
        return lvlProp.canUpgrade(this.exp);
    }

    this.verifyAndUpgrade = function(lvlProp) {
        return lvlProp.verifyAndUpgrade(this.exp);
    }


}

function LevelProperty(name, initLevel, expNeeded) {
    this.name = name;
    this.level = initLevel;
    this.expNeeded = expNeeded;

    this.canUpgrade = function(exp) {
        return this.expNeeded <= exp;
    }

    /**
      upgrade 
      @return the experience taken or -1 if no upgrade happened.
    */
    this.verifyAndUpgrade = function(exp) {
        if (this.canUpgrade(exp)) {
            this.level++;
            var expTaken = this.expNeeded;
            this.expNeeded = this.getExpForNextLevel();
            return expTaken;
        }else {
            return -1;
        }
    }

    /**
     A formula used to calculate the experience needed for a particular
     level of any thing
    **/
    this.getExpForNextLevel = function() {
        // for now it's very simple
        return Math.round(Math.pow(this.level + 1, 2.5));
    }
}