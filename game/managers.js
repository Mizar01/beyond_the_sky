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

    //the buttons are not labeled
    var buildButton = new DefaultGameButton("", ace3.getFromRatio(80, 2),
                            new THREE.Vector2(60, 60), null)
    buildButton.onClickFunction = function() {game_builds()}
    buildButton.baseClasses += " bts_button build_button"
    buildButton.baseCss.backgroundColor = "transparent";
    buildButton.baseCss.borderRadius = "17px";


    console.log("----------------------------------------")
    console.log($("#" + buildButton.id).attr("style"))
    console.log(buildButton.baseCss)
    console.log("----------------------------------------")

    mgr.registerActor(buildButton)



    
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
        var b = new DefaultGameButton(title, 
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

        //static disabling for now
        b.disableLogic = function() {
            return this.disabled;
        }

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

    _makeButton("<-", 10, 12,
        function() {return "Back to game"},
        function() {game_play()}
    );



}


function defineBuildManager() {
    mgr = new ACE3.PureHTMLActorManager();
    ace3.actorManagerSet.push(mgr);
    buildManager = mgr;

    var displayInfo = new ACE3.DisplayValue("", "", ace3.getFromRatio(15, 7))
    displayInfo.separator = ""
    mgr.registerActor(displayInfo)

    // some properties and functions for all buttons in the build grid
    function _makeButton(title, indexX, indexY, callbackInfoMessage, onClickFunction) {
        var b = new DefaultGameButton(title, 
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

        //static disabling for now
        b.disableLogic = function() {
            return this.disabled;
        }

        mgr.registerActor(b)
        return b
    }

    function _makeBuildButton(title, indexX, indexY) {
        return _makeButton(title, indexX, indexY, 
            function() {return "Build " + title},
            function() {
                var res = currentPlatform.addBuild(title)
                if (res != "") {
                    console.log(res)
                }else {
                    game_play()
                }
            }
        )        
    }

    _makeBuildButton("Tower 1", 1, 1)
    var bt2 = _makeBuildButton("Tower 2", 2, 1)
    bt2.disable()
    _makeBuildButton("Tower 3", 3, 1)

    _makeButton("<-", 10, 12,
        function() {return "Back to game"},
        function() {game_play()}
    )
}
