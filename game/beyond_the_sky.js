// Main file for main operations, settings and all

var ace3 = null
var test_logic = null
var gameManager = null // shortcut to ace3.defaultActorManager
var hudManager = null
var menuManager = null // shortcut to another ActorManager for menus
var chooseMapMenuManager = null 

var mainThemeSound = null

var testShader = null

var optimizer = null // optimizer is a memory used throughout the entire game to store useful calculations like
                     // special sectors and other stuff in order to avoid long loops through all the objects.

// var displayInfo = null //actor that shows dynamic info on screen during game.
var player = null;

Physijs.scripts.worker = 'ace3/lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

function game_init() {
    ace3 = new ACE3(true);
    ace3.setBGColor(0xffffff);
    ace3.scene.setGravity(new THREE.Vector3( 0, -9.8, 0 )); 
    //ace3.addPostProcessing();
    //ace3.setFog(0.02)
    //mainThemeSound = $("#main_theme").get(0)
    //mainThemeSound.play()
    // optimizer = new Optimizer()
    gameManager = ace3.defaultActorManager

    var posPrec = new THREE.Vector3(0, 0, 0);
    var width = 4
    firstPlatform = new Platform(posPrec, width * 100, 0xff0000);
    gameManager.registerActor(firstPlatform);
    var nPlatforms = 150;
    for (var i=0; i < nPlatforms; i++) {
        var c = GameUtils.getRandomHexColor();
        var rx = THREE.Math.randFloat(width * 1, width * 2);
        var rz = THREE.Math.randFloat(width * 1, width * 2);
        var rxSign = THREE.Math.randInt(0,1) == 0 ? -1:1; 
        var rzSign = THREE.Math.randInt(0,1) == 0 ? -1:1;
        var p = new Platform(new THREE.Vector3(rx * rxSign, 0, rz * rzSign), width, c, 0);
        p.obj.position.add(posPrec);
        p.obj.position.y = (i + 1) * 2.5; // note : the position is not set before, because it must be absolute.
        p.setPickable();
        gameManager.registerActor(p);
        posPrec = p.obj.position;

        // placing a checkpoint each nFreq platforms.
        var nFreq = 1;
        if ((i + 1) % nFreq == 0) {
            p.placeCheckPoint();
        }
    }

    player = new Player(firstPlatform);
    player.obj.position = firstPlatform.obj.position.clone();
    player.obj.position.y += 0.3 * 3;
    gameManager.registerActor(player);

    //adding ascending polygons (as background)
    for (var i=0; i < 25; i++) {
        gameManager.registerActor(new AscendingPolygon());
    }

    var skyBox = new ACE3.SkyBox("media/sb1-")
    gameManager.registerActor(skyBox)








    var cameraFollowLogic = new ACE3.Logic();
    cameraFollowLogic.followSpeed = 0.1;
    cameraFollowLogic.run = function() {
        var tp = new THREE.Vector3(player.obj.position.x, 
                                               player.obj.position.y + 10,   //10
                                               player.obj.position.z + 28);  //28
        var cp = ace3.camera.pivot.position;
        if (cp.distanceTo(tp) > 0.3) { 
            var d = ACE3.Math.getDirection(cp, tp);
            cp.add(d.multiplyScalar(this.followSpeed)); 
        } else {
            cp.x = tp.x; cp.y = tp.y; cp.z = tp.z;
        }
        ace3.camera.lookAt(player.obj.position);
    }


    var selectorLogic = new ACE3.Logic();
    selectorLogic.selectedPlatform = null;
    selectorLogic.selectedBird = null;
    selectorLogic.jumpForce = 0;

    selectorLogic.info = new ACE3.DisplayValue("Force :", "0", ace3.getFromRatio(5, 5));
    gameManager.registerActor(selectorLogic.info);

    selectorLogic.run = function() {
        var pm = ace3.pickManager
        if (ace3.eventManager.mousePressed()) {
            if (this.selectedPlatform != null) {
                this.jumpForce += 1;
                this.info.setValue(this.jumpForce);
            }else if (this.selectedBird != null) {

            }else {
                pm.pickActor();
                var p = pm.pickedActor;
                if (p != null) {
                    // console.log(p.getType());
                    if (p.getType() == 'Platform') {
                        this.selectedPlatform = p;
                        this.jumpForce = 0;
                    }else if (p.getType() == 'Bird') {
                        this.selectedBird = p;
                    }
                }
            }
        }

        if (ace3.eventManager.mouseReleased()) { // 'x'
            if (this.selectedPlatform != null) {
                player.jump(this.selectedPlatform, this.jumpForce);
                this.jumpForce = 0;
                this.selectedPlatform = null;
                this.info.setValue("0");
            }else if (this.selectedBird != null) {
                //this.selectedBird.setForRemoval();
                player.shootAt(this.selectedBird);
                this.selectedBird = null;
            }
        }            
    }

    var birdCallLogic = new ACE3.Logic();
    birdCallLogic.birdCallRate = 5; // seconds between calls
    birdCallLogic.lastTimeCall = ace3.time.frameTime + 1;
    birdCallLogic.run = function() {
        var t = ace3.time.frameTime;
        if (t - this.lastTimeCall > this.birdCallRate) {
            var b = new Bird();
            b.setPickable();
            gameManager.registerActor(b);
            this.lastTimeCall = t;
        } 
    }

    gameManager.registerLogic(cameraFollowLogic);
    gameManager.registerLogic(selectorLogic);
    //gameManager.registerLogic(birdCallLogic);

    //Adjust the pitch of the camera
    camera_reset_position()
    gameManager.play()
    //menu_define()
    //game_pause()
    //game_play()


}

function camera_reset_position() {
    ace3.camera.cameraObj.rotation.y = 0
    ace3.camera.cameraObj.rotation.z = 0
    ace3.camera.cameraObj.rotation.x = - Math.PI/8  
    ace3.camera.pivot.position.set(0, 10, 28)
    ace3.camera.speed = 0.1
}


function game_run() {
    ace3.run()
}





GameUtils = {
    getRandomHexColor: function() {
        var colors = ["ff","00","33", "a5", "88", "f0", "0f"];
        var randR = colors[THREE.Math.randInt(0,6)];
        var randG = colors[THREE.Math.randInt(0,6)];
        var randB = colors[THREE.Math.randInt(0,6)];
        return c = parseInt("0x" + randR + randG + randB);
    },
}



