
ESCPauseGameLogic = function() {
    ACE3.Logic.call(this);
}
ESCPauseGameLogic.prototype.run = function() {
    if (ace3.eventManager.released(ace3.eventManager.keyCodes.escape)) {
        game_pause()
    }		
}

EnemyCallLogic = function(timeRate) {
    ACE3.Logic.call(this);
    this.timeRate = timeRate || 5
    this.spawnTimer = new ACE3.CooldownTimer(timeRate, true)
    this.spawnTimer.time = 0.01 //make the first spawn instantly
}
EnemyCallLogic.prototype.run = function() {
    if (this.spawnTimer.trigger()) {
        var b = new Enemy();
        b.setPickable();
        gameManager.registerActor(b);
    } 
}





