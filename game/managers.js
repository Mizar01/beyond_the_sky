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
    function _makeButton(title, indexX, indexY, onClickFunction, callbackInfoMessage) {
        var b = new DefaultGameButton(title, 
                                      ace3.getFromRatio(5 + (indexX - 1) * 8, (4 + (indexY -1) * 15)),
                                      new THREE.Vector2(70, 70), 
                                      null)

        b.displayInfo = displayInfo
        b.getInfoMessage = function() {}
        if (callbackInfoMessage != null) {
            b.getInfoMessage = callbackInfoMessage;
        }
        b.onClickFunction = onClickFunction;

        //static disabling for now
        b.disableLogic = function() {
            return this.disabled;
        }

        mgr.registerActor(b)
        return b
    }

    function _makeLevelUpButton(levProp, gridX, gridY) {

        //build strings from levProp
        var lp = player.levels[levProp]
        var upgradeStr = lp.name + "<br/><b>[" + lp.level + "]</b>"

        var b = _makeButton(upgradeStr,gridX, gridY, 
            function() { 
                        player.levels.verifyAndUpgrade(lp)
                        upgradeStr = lp.name + "<br/><b>[" + lp.level + "]</b>"
                        if (lp.levelMax != 'INF') {
                            upgradeStr = lp.name + "<br/><b>[" + lp.level + "/" + lp.levelMax + "]</b>"
                        }
                        this.changeLabel(upgradeStr)
                       }
            );
        b.disableLogic = function() {
            return !player.canUpgrade(lp) 
        }

        return b;
    } 

    _makeLevelUpButton("weaponPower", 1, 1)
    _makeLevelUpButton("weaponAccuracy", 2, 1)
    _makeLevelUpButton("weaponRate", 3, 1)

    _makeLevelUpButton("turretPower", 1, 2)
    _makeLevelUpButton("turretRate", 2, 2)
    _makeLevelUpButton("turretSlots", 3, 2)

    _makeLevelUpButton("shieldMax", 1, 3)
    _makeLevelUpButton("shieldRegeneration", 2, 3)
    _makeLevelUpButton("shieldStrength", 3, 3)

    _makeButton("<-", 10, 6,
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
                                      ace3.getFromRatio(5 + (indexX - 1) * 8, (4 + (indexY -1) * 15)),
                                      new THREE.Vector2(70, 45), 
                                      null)

        b.displayInfo = displayInfo
        b.getInfoMessage = function() {}
        if (callbackInfoMessage != null) {
            b.getInfoMessage = callbackInfoMessage;
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
                    //console.log(res)
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
    _makeBuildButton("MissileTurret", 4, 1)

    _makeBuildButton("DefenseDrone", 1, 2)
    _makeBuildButton("HealingDrone", 2, 2)

    _makeButton("<-", 10, 6,
        function() {return "Back to game"},
        function() {game_play()}
    )
}
