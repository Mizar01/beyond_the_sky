function defineInGameHUD() {
    mgr = new ACE3.PureHTMLActorManager();
    ace3.actorManagerSet.push(mgr);
    hudManager = mgr;


    function _makeHUDButton(ratioX, ratioY, onClickFunction, image) {
        //the buttons are not labeled
        var b = new DefaultGameButton("", ace3.getFromRatio(ratioX, ratioY),
                                new THREE.Vector2(60, 60), null)
        b.onClickFunction = onClickFunction
        b.baseCss.backgroundColor = "transparent";
        b.baseCss.backgroundImage = "url('" + image + "')";
        b.baseCss.borderRadius = "17px";
        mgr.registerActor(b)
        return b
    }

    //HUD IN GAME ELEMENTS
    //PAUSE TO MENU BUTTON
    _makeHUDButton(2, 2, game_pause, "media/button_builds.png")
    //UPGRADE MENU BUTTON
    _makeHUDButton(70, 2, game_upgrades, "media/button_builds.png")
    //BUILD MENU BUTTON
    _makeHUDButton(80, 2, game_builds, "media/button_builds.png")
   

}

function defineMenuManager() {
    mgr = new ACE3.PureHTMLActorManager();
    ace3.actorManagerSet.push(mgr);
    menuManager = mgr;

    function _makeMenuButton(title, ratioX, ratioY, onClickFunction, image) {
        //the buttons are not labeled
        var b = new DefaultGameButton(title, ace3.getFromRatio(ratioX, ratioY),
                                new THREE.Vector2(120, 60), null)
        b.onClickFunction = onClickFunction
        b.baseCss.backgroundColor = "blue";
        if (image) {
            b.baseCss.backgroundImage = "url('" + image + "')";
        }
        b.baseCss.borderRadius = "17px";
        mgr.registerActor(b)
        return b
    }

    _makeMenuButton("NEW GAME", 20, 10, game_play)
    _makeMenuButton("RESUME GAME", 20, 20, game_play)
    _makeMenuButton("ABOUT", 20, 40, function(){alert("by Mizar (2013)")})





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
            //console.warn("Game message : the Default game button [" + title + "] has been defined without info");
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

    var displayInfo = new ACE3.DisplayValue("", "", ace3.getFromRatio(15, 93))
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
            //console.warn("Game message : the Default game button [" + title + "] has been defined without info");
        }
        b.onClickFunction = onClickFunction;

        mgr.registerActor(b)
        return b
    }

    function _makeBuildButton(typeName, indexX, indexY) {
        var b = _makeButton(typeName, indexX, indexY, 
            function() {return "Build " + typeName},
            function() {
                var res = player.addBuild(typeName)
                if (res != "") {
                    console.log(res)
                }else {
                    game_play()
                }
            }
        )
        //static disabling for now
        b.disableLogic = function() {
            return !player.canBuild(typeName)
        }
        return b    
    }

    _makeBuildButton("GunTurret", 1, 1)
    _makeBuildButton("IceTurret", 2, 1)
    _makeBuildButton("LaserTurret", 3, 1)

    _makeButton("<-", 10, 12,
        function() {return "Back to game"},
        function() {game_play()}
    )
}
