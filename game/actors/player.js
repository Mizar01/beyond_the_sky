Player = function(firstPlatform) {
    ACE3.Actor3D.call(this);
    //this.obj = ACE3.Builder.sphere(0.5, 0x0000ff);
    var color = 0x0000ff;
    var g = new THREE.SphereGeometry(0.5);
    var m = Physijs.createMaterial(new THREE.MeshBasicMaterial({'color':color}),
            .4, // low friction
            .6 // high restitution
            );
    this.obj = new Physijs.BoxMesh(g, m,
            1 // mass
            );

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
}

Player.extends(ACE3.Actor3D, "Player");

Player.prototype.run = function() {

    if (this.target != null && this.target.checkPoint != null) {
        var cp = this.target.checkPoint.obj.position;
        if (this.obj.position.distanceTo(cp) < 1) {
            this.basePlatform = this.target;
            var newCPIndex = this.target.checkPoint.index;
            //removes all the previous checkpoints from the scene
            for (var i = this.checkPointIndex + 1; i <= newCPIndex; i++) {
                checkPoints[i].setForRemoval();
            }
            this.checkPointIndex = newCPIndex;
        }
    }

    if (this.obj.position.y < this.basePlatform.obj.position.y) {
        this.jumping = false;
        player.resetJump();
        this.target = null;            
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

Player.prototype.resetJump = function() {
    player.obj.position = this.basePlatform.obj.position.clone();
    player.obj.position.y += 1;
    player.obj.__dirtyPosition = true;
    player.obj.setLinearVelocity(new THREE.Vector3(0, 0, 0));
    //player.obj.applyImpulse(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0));      
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


Player.prototype.jump = function(platform, force) {
    //if (!this.jumping) {
        // position for jumping
        //var pz = platform.obj.position.z;
        //var px = platform.obj.position.x;
        var tvpos = platform.obj.position.clone().add(new THREE.Vector3(0, 25, 0));
        var dir = ACE3.Math.getDirection(this.obj.position, tvpos);
        this.forceForward = force / 4;
        this.forceVertical = force/100;
        this.obj.applyImpulse(dir.multiplyScalar(this.forceForward), new THREE.Vector3(0, 0, 0));
        //console.log(dir.multiplyScalar(1));
        this.jumping = true;
        this.target = platform;
    //}
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