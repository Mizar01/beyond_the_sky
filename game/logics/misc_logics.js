
ESCPauseGameLogic = function() {
    ACE3.Logic.call(this);
}
ESCPauseGameLogic.prototype.run = function() {
    if (ace3.eventManager.released(ace3.eventManager.keyCodes.escape)) {
        game_pause()
    }		
}



