// Main file for main operations, settings and all

var ace3 = null
var test_logic = null
var test_object = null
var gameManager = null // shortcut to ace3.defaultActorManager
var hudManager = null  // in game menu
var menuManager = null // shortcut to another ActorManager for menus
var upgradeManager = null //an upgrade menu during game
var buildManager = null //a build menu during game
var chooseMapMenuManager = null 

var mainThemeSound = null

var testShader = null

var optimizer = null // optimizer is a memory used throughout the entire game to store useful calculations like
                     // special sectors and other stuff in order to avoid long loops through all the objects.

// var displayInfo = null //actor that shows dynamic info on screen during game.
var player = null;

var platforms = []; // unused
var currentPlatform = null; // the platform where the robot resides
var prevPlatform = null; // the going-away platform
var nextPlatform = null; // the coming platform 

var checkPoints = [];

Physijs.scripts.worker = 'ace3/lib/physijs_worker.js';
Physijs.scripts.ammo = 'ammo.js';

function game_init() {
    ace3 = new ACE3(true, 1000, 500);
    ace3.setBGColor(0xffffff);
    ace3.scene.setGravity(new THREE.Vector3( 0, -9.8, 0 )); 
    //ace3.addPostProcessing();
    //ace3.setFog(0.02)
    //mainThemeSound = $("#main_theme").get(0)
    //mainThemeSound.play()
    // optimizer = new Optimizer()
    gameManager = ace3.defaultActorManager

    var posPrec = new THREE.Vector3(0, 0, 0);
    basePlatform = new Platform(posPrec, 400, 0xff0000);
    basePlatform.ground = true
    basePlatform.setReady()
    basePlatform.overrideTime = 0

    gameManager.registerActor(basePlatform);

    player = new Player(basePlatform);
    player.obj.position = basePlatform.obj.position.clone();
    player.obj.position.y += 0.3 * 3;
    //player keyboard controls are discontinued
    //player.addControls();
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
                                               player.obj.position.y + 13,   //10
                                               player.obj.position.z + 18);  //28
        var cp = ace3.camera.pivot.position;
        if (cp.distanceTo(tp) > 0.6) { 
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

    //selectorLogic.info = new ACE3.DisplayValue("Force", "0", ace3.getFromRatio(5, 5));
    //gameManager.registerActor(selectorLogic.info);

    selectorLogic.run = function() {
        var pm = ace3.pickManager
        if (ace3.eventManager.mouseReleased()) { // 'x'
            pm.pickActor();
            var p = pm.pickedActor;
            if (p != null && p.getType() == 'Enemy') {
                this.selectedBird = p;               
            }        
            if (this.selectedBird != null) {
                //this.selectedBird.setForRemoval();
                player.shootAt(this.selectedBird);
                this.selectedBird = null;
            }
        }            
    }

    var enemyCallLogic = new ACE3.Logic();
    enemyCallLogic.spawnTimer = new ACE3.CooldownTimer(0.5, true)
    enemyCallLogic.run = function() {
        if (this.spawnTimer.trigger()) {
            var b = new Enemy();
            b.setPickable();
            gameManager.registerActor(b);
        } 
    }

    //Display infos (temporary)
    var playerLifeInfo = new ACE3.DisplayValue("LIFE", "", ace3.getFromRatio(15, 97))
    playerLifeInfo.valueFunction = function() {
        return "" + player.life
    }
    var playerNrgInfo = new ACE3.DisplayValue("NRG", "", ace3.getFromRatio(35, 97))
    playerNrgInfo.valueFunction = function() {
        return "" + player.energy
    }
    var playerExpInfo = new ACE3.DisplayValue("XP", "", ace3.getFromRatio(55, 97))
    playerExpInfo.valueFunction = function() {
        return "" + player.levels.exp
    }
    var platformOverrideInfo = new ACE3.DisplayValue("override progress", "", ace3.getFromRatio(75, 97))
    platformOverrideInfo.valueFunction = function() {
        return "" + currentPlatform.overrideTime
    }



    gameManager.registerActor(playerLifeInfo)
    gameManager.registerActor(playerNrgInfo)
    gameManager.registerActor(playerExpInfo)
    gameManager.registerActor(platformOverrideInfo)

    gameManager.registerLogic(cameraFollowLogic);
    gameManager.registerLogic(selectorLogic);
    // add alternative controls to player (DISABLED)
    //gameManager.registerLogic(player.playerControlsLogic)
    //DISABLE DEFAULT CAMERA BEHAVIOUR
    ace3.camera.control = function() {};
    gameManager.registerLogic(enemyCallLogic);
    gameManager.registerLogic(new ESCPauseGameLogic());

    //Adjust the pitch of the camera
    camera_reset_position()
    


    defineInGameHUD()
    defineUpgradeManager()
    defineBuildManager()
    defineMenuManager()


    game_play();
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

function game_play() {
    upgradeManager.pause();
    buildManager.pause();
    menuManager.pause()
    gameManager.play()
    if (hudManager) {
        hudManager.play()
    }
}

function game_pause() {
    upgradeManager.pause();
    buildManager.pause();
    if (hudManager) {
        hudManager.pause()
    }
    gameManager.pause()
    menuManager.play()
}

function game_upgrades() {
    if (hudManager) {
        hudManager.pause()
    }
    gameManager.pause()
    menuManager.pause()
    buildManager.pause();
    upgradeManager.play();

}

function game_builds() {
    if (hudManager) {
        hudManager.pause()
    }
    gameManager.pause()
    menuManager.pause()
    upgradeManager.pause(); 
    buildManager.play();
 
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


// TODO : add to the ace3 source code !!!!

ACE3.Test = []

ACE3.Test.makeTestCube = function(position, color){
    var color = color || 0xffffff
    var obj = ACE3.Builder.cube(1, color)
    obj.position = position
    _ace3.scene.add(obj)

    return obj
}








