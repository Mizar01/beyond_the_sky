// Main file for main operations, settings and all

var ace3 = null
var test_logic = null
var gameManager = null // shortcut to ace3.defaultActorManager
var hudManager = null  // in game menu
var menuManager = null // shortcut to another ActorManager for menus
var upgradeManager = null //an upgrade menu during game
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
    basePlatform = new Platform(posPrec, 400, 0xff0000);
    basePlatform.setReady();
    gameManager.registerActor(basePlatform);
    // var nPlatforms = 150;
    // var cpIter = 0;
    // for (var i=0; i < nPlatforms; i++) {
    //     var c = GameUtils.getRandomHexColor();
    //     // var rx = THREE.Math.randFloat(width * 1, width * 2);
    //     // var rz = THREE.Math.randFloat(width * 1, width * 2);
    //     // var rxSign = THREE.Math.randInt(0,1) == 0 ? -1:1; 
    //     // var rzSign = THREE.Math.randInt(0,1) == 0 ? -1:1;

    //     //The distance is constant. So the position of the next plaform 
    //     //(x, z) is in a circle around the former platform.
    //     var rAngle = THREE.Math.randFloat(0, Math.PI * 2);
    //     var rx = dist * Math.cos(rAngle);
    //     var rz = dist * Math.sin(rAngle);

    //     var p = new Platform(new THREE.Vector3(rx, 0, rz), width, c, 0);
    //     p.obj.position.add(posPrec);
    //     p.obj.position.y = (i + 1) * 2.5; // note : the position is not set before, because it must be absolute.
    //     p.setPickable();
    //     gameManager.registerActor(p);
    //     posPrec = p.obj.position;

    //     // placing a checkpoint each nFreq platforms.
    //     var nFreq = 3;
    //     if ((i + 1) % nFreq == 0) {
    //         checkPoints[cpIter] = p.placeCheckPoint(cpIter);
    //         cpIter++;
    //     }

    //     platforms[i] = p;
    // }

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

    //selectorLogic.info = new ACE3.DisplayValue("Force", "0", ace3.getFromRatio(5, 5));
    //gameManager.registerActor(selectorLogic.info);

    selectorLogic.run = function() {
        var pm = ace3.pickManager
        // if (ace3.eventManager.mousePressed()) {
        //     if (this.selectedPlatform != null) {
        //         this.jumpForce += 1;
        //         this.info.setValue(this.jumpForce);
        //     }else if (this.selectedBird != null) {

        //     }else {
        //         pm.pickActor();
        //         var p = pm.pickedActor;
        //         if (p != null) {
        //             // console.log(p.getType());
        //             if (p.getType() == 'Platform') {
        //                 this.selectedPlatform = p;
        //                 this.jumpForce = 0;
        //                 player.lookAtXZFixed(this.selectedPlatform.obj.position);
        //                 player.obj.__dirtyRotation = true;
        //             }else if (p.getType() == 'Bird') {
        //                 this.selectedBird = p;
        //             }
        //         }
        //     }
        // }

        if (ace3.eventManager.mouseReleased()) { // 'x'
            pm.pickActor();
            var p = pm.pickedActor;
            if (p != null) {  
                // console.log(p.getType());
                if (p.getType() == 'Platform') {
                    this.selectedPlatform = p;
                    player.lookAtXZFixed(this.selectedPlatform.obj.position);
                    player.obj.__dirtyRotation = true;
                }else if (p.getType() == 'Bird') {
                    this.selectedBird = p;
                }               
            }        
            if (this.selectedPlatform != null) {
                // player.jump(this.selectedPlatform, this.jumpForce);
                player.autoJump(this.selectedPlatform);
                this.jumpForce = 0;
                this.selectedPlatform = null;
                //this.info.setValue("0");
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
    // add alternative controls to player (DISABLED)
    //gameManager.registerLogic(player.playerControlsLogic)
    //DISABLE DEFAULT CAMERA BEHAVIOUR
    ace3.camera.control = function() {};
    gameManager.registerLogic(birdCallLogic);
    gameManager.registerLogic(new ESCPauseGameLogic());

    //Adjust the pitch of the camera
    camera_reset_position()
    


    defineInGameHUD()
    defineUpgradeManager()
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
    menuManager.pause()
    gameManager.play()
    if (hudManager) {
        hudManager.play()
    }
}

function game_pause() {
    upgradeManager.pause();
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
    upgradeManager.play();   
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

function defineInGameHUD() {
    mgr = new ACE3.PureHTMLActorManager();
    //HUD IN GAME ELEMENTS
    // PAUSE TO MENU BUTTON
    var escButton = new DefaultGameButton("PAUSE", ace3.getFromRatio(2, 2),
                            new THREE.Vector2(60, 60), null)
    escButton.onClickFunction = function() {game_pause()}
    mgr.registerActor(escButton)

    //PAUSE TO UPGRADE BUTTON
    var upButton = new DefaultGameButton("UPGRADES", ace3.getFromRatio(70, 2),
                            new THREE.Vector2(60, 60), null)
    upButton.onClickFunction = function() {game_upgrades()}
    mgr.registerActor(upButton)


    
    ace3.actorManagerSet.push(mgr);
    hudManager = mgr;
}

function defineMenuManager() {
    mgr = new ACE3.PureHTMLActorManager();
    ace3.actorManagerSet.push(mgr);
    menuManager = mgr;
}

function defineUpgradeManager() {
    mgr = new ACE3.PureHTMLActorManager();
    ace3.actorManagerSet.push(mgr);
    upgradeManager = mgr;

    var displayInfo = new ACE3.DisplayValue("", "", ace3.getFromRatio(15, 7))
    displayInfo.separator = ""
    mgr.registerActor(displayInfo)

    // some properties and functions for all buttons in the upgradegrid
    function _makeButton(title, indexX, indexY, callbackInfoMessage, onClickFunction) {
        var b = new DefaultGameButton("UP-W", 
                                      ace3.getFromRatio(5 + (indexX - 1) * 8, (4 + (indexY -1) * 5)),
                                      new THREE.Vector2(70, 45), 
                                      null)

        b.displayInfo = displayInfo
        b.getInfoMessage = function() {}
        if (callbackInfoMessage != null) {
            b.getInfoMessage = callbackInfoMessage;
        }else {
            console.warn("Game message : the Default game button [" + title + "] has been defined without info");
        }

        b.onClickFunction = onClickFunction;

        mgr.registerActor(b)
        return b
    }

    _makeButton("UP-W", 1, 1, 
        function() {return "Upgrade Weapon Power to level " + player.weaponPowerLevel + 1},
        function() {player.levels.verifyAndUpgrade(player.levels.weaponPower)}
        );
    _makeButton("F-UP", 10, 10, 
        function() {return "Hello Final"},
        function() {}
        );











}




