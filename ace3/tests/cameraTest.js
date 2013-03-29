var ace3 = null
var test_logic = null
var gameManager = null // shortcut to ace3.defaultActorManager

var clock = new THREE.Clock();

var target = null
var actorArr = new Array()


$(document).ready(function() {
    init()
});


function init() {
    ace3 = new ACE3()
    ace3.setBGColor(0x000000)
    //ace3.setFog(0.02)
    gameManager = ace3.defaultActorManager
    //Adjust the pitch of the camera
    camera_init()

    for (var i = 0; i < 30; i++) {
        var d = 15
        var x = THREE.Math.randInt(-d, d)
        var y = THREE.Math.randInt(-d, d)
        var z = THREE.Math.randInt(-d, d)
        var tb = new TestBox(x,y,z, 0x00ff00)
        actorArr.push(tb)
        gameManager.registerActor(tb)
        tb.setPickable()
    }

    for (var i = 0; i < 30; i++) {
        var d = 15
        var x = THREE.Math.randInt(-d, d)
        var y = THREE.Math.randInt(-d, d)
        var z = THREE.Math.randInt(-d, d)
        var tb = new TestBox(x,y,z + 60, 0x0000ff)
        actorArr.push(tb)
        gameManager.registerActor(tb)
        tb.setPickable()
    }

    gameManager.registerLogic(new PickLogic())

    ace3.run()
    gameManager.play()
}

function camera_init() {
    //ace3.camera.cameraObj.rotation.x = - Math.PI/3
    //ace3.camera.pivot.position.z = 16
    //ace3.camera.pivot.position.y = 28
    ace3.camera.pivot.position.set(0, 0, 60)
    ace3.camera.speed = 0.1
}

function select(actor) {
    if (target != null) target.setColor(target.baseColor)
    actor.setColor(0xff0000)
    target = actor
    ace3.camera.lookAt(actor.obj.position)
}


TestBox = function(x, y, z, color) {
    ACE3.Actor3D.call(this)
    this.obj = ACE3.Builder.cube(1, color)
    this.obj.position.set(x, y, z)
    this.baseColor = color
}
TestBox.extends(ACE3.Actor3D, "TestBox")
TestBox.prototype.run = function() {
    this.obj.rotation.y += 0.01
}

PickLogic = function() {
    ACE3.Logic.call(this)
}
PickLogic.extends(ACE3.Logic, "PickLogic")
PickLogic.prototype.run = function() {
    var em = ace3.eventManager
    var pm = ace3.pickManager
    if (em.mouseReleased()) {
        pm.pickActor()
        var a = pm.pickedActor
        if (a != null) {
            select(a)
        }
    }
}




