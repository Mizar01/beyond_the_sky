
/**
 * Advanced canvas extension for 3d
 *
 */

/**
* Some useful extensions for javascript
*/

/**
* Add a method to any function to speed up code generation when inheriting.
*/
Function.prototype.extends = function(baseClass, typeName) {
    this.prototype = Object.create(baseClass.prototype)
    this.prototype.constructor = this

    //The superClass must be used in a static way
    // example: ACE3.Object.superClass.method.call(instance,params)  
    // DON'T USE superClass with 'this' identifier.
    // Use this.getSuperClass instead
    this.superClass = baseClass.prototype //(USE WITH CAUTION : VERY DANGEROUS)

    this.prototype.type = typeName

    this.prototype.getSuperClass = function() {
        return eval(this.getType() + ".superClass")
    }

}


if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = (window.webkitRequestAnimationFrame ||
                                window.mozRequestAnimationFrame ||
                                window.oRequestAnimationFrame ||
                                window.msRequestAnimationFrame ||
                                function (callback) {
                                  return window.setTimeout(callback, 17 /*~ 1000/60*/);
                                });
}

// Utility to disables text selection, is annoying for the game
(function($){
    $.fn.disableSelection = function() {
        return this
                 .attr('unselectable', 'on')
                 .css('user-select', 'none')
                 .on('selectstart', false);
    };
})(jQuery);


var _ace3 = null

/**
 * Physijs scene is completely dependent from the status of 
 * defaultActorManager. So it's configured to stop and resume entire physics 
 * effects with stop and play of ace3.defaultActorManager
*/
__ace3_physics_load_scene = function() {
    var scene = new Physijs.Scene;
    scene.addEventListener(
            'update',
            function() {
                //Excluding the call to simulate() will stop 
                //completely any other update event. 
                if (!_ace3.defaultActorManager.paused) {
                    _ace3.scene.simulate( undefined, 1 );
                }
            }
    );
    return scene;
}

__ace3_physics_start = function(ace3scene) {
    ace3scene.simulate();
}
__ace3_physics_resume = function() {
    //Restart of physics simulation with a timestep of 1 fps
    _ace3.scene.simulate(0.0167, 1)
}

ACE3 = function(physicsEnabled, swidth, sheight) {

    this.physicsEnabled = physicsEnabled || false;
    
    if (_ace3 != undefined) {
        throw "ERROR! Sorry. You can't create two instances of ACE3"
    }
    this.created = true
    _ace3 = this
    var self = this //used to access this ace3 instance from inside inner functions.
    this.pickManager = new ACE3.PickManager()
    this.projector = new THREE.Projector();

    var w = swidth || 1200
    var h = sheight || 700

    
    $("body").append("<div id=\"_ace3_container\" style=\"width: " + w + "px; height: " + h + "px; background-color: black;\"> </div>");

    $("body").disableSelection()

    this.container = document.getElementById("_ace3_container")

    var offset = $(this.container).offset()

    this.vpOffset = new THREE.Vector2(offset.left, offset.top) //size vector of the viewport
    this.vpSize = new THREE.Vector2(w, h)  // size vector of the viewport

    this.renderer = new THREE.WebGLRenderer()
    this.renderClearColor = 0x000000 // 0xaaaaaa
    this.renderer.setClearColorHex(this.renderClearColor, 1)
    this.scene = null
    this.camera = null
    this.composer = null
    //this.mouse = { x : 0, y : 0}
    this.screen = {x: 0, y: 0}
    
    this.eventManager = new ACE3.EventManager()
    
    //this.cameraDir = ""
    
    this.renderer.setSize(this.container.offsetWidth, this.container.offsetHeight)
    this.container.appendChild(this.renderer.domElement)
    if (this.physicsEnabled) {
        this.scene = __ace3_physics_load_scene();
    }else {
        this.scene = new THREE.Scene();
    }
    
    this.camera = new ACE3.Camera(this.container)
    this.camera.pivot.position.set(0, 0, 10)
    this.scene.add(this.camera.pivot)
    
    //The defaultActorManager is entirely associated with the scene.
    //NOTE : if the defaultActorManager pauses, also the physics in the entire scene are paused.
    //This beahaviour is not always desired. Feel free to change the 'update' listener for the scene
    // (see the __ace3_physics_load_scene method)
    this.defaultActorManager = new ACE3.ActorManager(this.scene)
    // Override the default behaviour
    this.defaultActorManager.play = function () {
        this.paused = false
        if (_ace3.physicsEnabled) {
            __ace3_physics_resume()
        }
    }
    
    this.actorManagerSet = []
    this.actorManagerSet.push(this.defaultActorManager)

    this.time = new ACE3.TimeManager()
    
    //Setting controls of events
    $("body").keydown(function(e) {
        var c=e.keyCode || e.wich;
        self.eventManager.key[c] = "DOWN"
    });
    $("body").keyup(function(e) {
        var c=e.keyCode || e.wich;
        //console.log(c)
        self.eventManager.key[c] = "UP"
    });
    

    $(this.container).mousedown(function(e) {
        self.eventManager.mouseStatus = "DOWN"
    });
    $(this.container).mouseup(function(e) {
        self.eventManager.mouseStatus = "UP"
    });
   
    // TODO : for now mouse move is a time consuming operation.
    // He has to be calculated in some other way (Apparently this is IMPOSSIBLE)
    $(this.container).mousemove(function (e) {
        e.preventDefault()
        //var offset = $(this.container).offset();
        _ace3.screen.x = e.clientX
        _ace3.screen.y = e.clientY
    });

    if (this.physicsEnabled) {
        __ace3_physics_start(this.scene);
    }

}

ACE3.prototype = {
    constructor: ACE3,
    type: "ACE3",

    setBGColor: function(color) {
        this.renderClearColor = color
        this.renderer.setClearColorHex(this.renderClearColor, 1)
    },

    setFog: function(factor) {
        ace3.scene.fog = new THREE.FogExp2(this.renderClearColor, factor)
    },
    
    /**
     * Get x,y coords of the mouse related to canvas starting from the
     * stored x,y coords of the mouse in the screen.
     */
    getViewportMousePosition: function() {
        var offset = $(this.container).offset();
        var relposx = this.screen.x - offset.left
        var relposy = this.screen.y - offset.top
        var glx = ( relposx / this.container.offsetWidth ) * 2 - 1;
	    var gly = - ( relposy / this.container.offsetHeight ) * 2 + 1;
        return {x: glx, y: gly}
    },

    addPostProcessing: function(type) { 
        //TODO : actually type is not used
        this.composer = new THREE.EffectComposer(this.renderer);
        renderModel = new THREE.RenderPass(this.scene,this.camera.cameraObj);            
        renderModel.renderToScreen = false; 
        this.composer.addPass(renderModel); 
        //var effect10 = new THREE.DotScreenPass(new THREE.Vector2(0,0), 0.5, 0.8); 
        //effect10.renderToScreen = false; 
        //this.composer.addPass(effect10);
        // var effect14 = new THREE.ShaderPass(THREE.HueSaturationShader); 
        // effect14.renderToScreen = true; 
        // this.composer.addPass(effect14);       
        //var effect15 = new THREE.ShaderPass(THREE.ColorifyShader); 
        //effect15.renderToScreen = true; 
        //this.composer.addPass(effect15);
        var effect20 = new THREE.FilmPass();
        effect20.uniforms.grayscale.value = 0
        effect20.renderToScreen = true;
        this.composer.addPass(effect20);
        this.renderer.autoClear = false;

    },
    
   
    run: function() {
        //console.log(this.eventManager.pressed(16))
        //this.pickManager.run()
        this.time.run()
        requestAnimationFrame(function() {_ace3.run()})
        for (id in this.actorManagerSet) {
            this.actorManagerSet[id].run()
        }
        this.camera.run()
        if (this.composer) {
            // this.renderer.clear()
            this.composer.render(0.5)
        }else {
            this.renderer.render(this.scene, this.camera.cameraObj)
        }
        this.eventManager.standardReset()
        //setTimeout("_ace3.run()",10)
    },
    
    /**
     * Returns a three js intersected object
     */
    pick: function() {
        mp = this.getViewportMousePosition()
        var x = mp.x
        var y = mp.y
        //var realCam = new THREE.Object3D()
        //realCam.matrixWorld = this.camera.cameraObj.matrixWorld.getPosition()
        //realCam.matrixWorldRotation = this.camera.cameraObj.matrixRotationWorld.clone()
        var vector = new THREE.Vector3( x, y, 1 )
        this.projector.unprojectVector( vector, this.camera.cameraObj )
        var cp = this.camera.cameraObj.matrixWorld.getPosition().clone()
        var ray = new THREE.Raycaster( cp, vector.sub( cp ).normalize() )
        var intersects = ray.intersectObjects( this.pickManager.pickables )
        return intersects[0]
    },

    /**
    * Get the position, value based on the container size, given the percentage
    * The recalculation is done everytime we have a refresh
    * Return a THREE.Vector2 
    */
    getFromRatio: function(percX, percY) {
        var x = this.vpOffset.x + this.vpSize.x/100 * percX
        var y = this.vpOffset.y + this.vpSize.y/100 * percY
        return new THREE.Vector2(x, y) 
    },
    // TODO : TO FINISH do something when window is resized, like recalculate vpOffset and vpSize
    windowResized: function() {
        var offset = $(this.container).offset()
        var w = $(this.container).width()
        var h = $(this.container).height()
        this.vpOffset = new THREE.Vector2(offset.left, offset.top) //size vector of the viewport
        this.vpSize = new THREE.Vector2(w, h)  // size vector of the viewport
    },
    /**
    * Finds the actor scanning through all the managers.
    * TODO : possible improvements: scan also in subchildren, actually it scans only for
    *        direct children of a manager.
    */
    findActorById: function(actorId) {
        for (idm in this.actorManagerSet) {
            var a = this.actorManagerSet[idm].findActorById(actorId)
            if (a != null) {
                return a
            }
        }
        return null
    },



    
   
}

ACE3.Constants = {
    CONTROLLER_HUMAN : 0,
    CONTROLLER_CPU : 1
}



ACE3.Actor = function() {
    this.alive = true // when false, the cleanActor method of the manager will be called
                      // and the remove() function is called.
    this.visible = true //means the object is added to the scene
    this.running = true //means the object is in the running processes
    this.manager = null // the object that is managing this actor.
    this.actorChildren = {} // associative array of children actors ("id" -> actor)
                                     // you must implement the right way to add ids to this vector.
    this.parentActor = null // null only if this actor is not a direct children of another actor.

}

ACE3.Actor.prototype = {
    constructor: ACE3.Actor,
    type: "ACE3.Actor",

    /**
     *Default behaviour of init()
     */
    init: function() {
        //implement it in an extending class
    },

    getId: function() {
        //implement it in an extending class
    },

    /**
    * Default beahaviour for remove()
    * The remove() method should be called by manager
    * You can overwrite this method.
    */
    removeSelf: function() { 
        //implement it in an extending class 
        // console.log("Warning: Called a non implemented remove for " + this.getId())
    },

    setForRemoval: function() {
        this.alive = false
    },

    /**
    * I thought about it many times. This method is the real running method 
    * called by the manager. This force every actor to have a basic behaviour 
    * stated once and for all. Furthermore implementing run function will not
    * need this logic, so the developer can concentrate on the single actor logic.
    */
    __run: function() {
        if (this.alive) {
            this.run()
            for (id in this.actorChildren) {
                this.actorChildren[id].__run()
            }
        }      
    },
    

    run: function() {

    },  

    addActor: function(actor) {
        //console.log("superClass.addActor called!")
        this.actorChildren["" + actor.getId()] = actor
        //if the actor was previously attached to a manager it will be detached.
        actor.manager = null
        actor.parentActor = this
    },

    /**
    * Note : no object is really destroyed during this operation. The child is only detached
    * and is lost every reference inside this actor. But any other reference outside will keep 
    * the child object alive in memory.
    */
    removeActor: function(actor) {
        actor.removeSelf()
        actor.parentActor = null
        delete this.actorChildren["" + actor.getId()]  // DON'T USE SPLICE, we are not using iterative counts.
    },

    /**
     * NOTE : coloring can be challenging, because the nature of
     * an actor object can be very different every time. So
     * it's better (and simple) to implement a setColor on
     * a specific actor implementation.
     * 
     * The simplest will be
     *     this.setColor = function(color) {
     *         this.obj.material.color = new THREE.Color(color)
     *     }
     * 
     * 
     */
    setColor: function(color) {},  

    getType: function() {
        return this.type
    },

    typeOf: function(type) {
        return this.type == type
    },

    typeIn: function(typeList) {
        for (tli in typeList) {
            if (this.typeOf(typeList[tli])) {
                return true
            }
        }
        return false
    },

    /**
    * Finds the manager in the tree of this actor. The actor in facts can be a children
    * of some other actor.
    */
    getManager: function() {
        if (this.manager == null && this.parentActor == null) {
            return null
        }
        if (this.manager == null) {
            return this.parentActor.getManager()
        }
        return this.manager
    },
}

ACE3.Actor3D = function() {
    ACE3.Actor.call(this)
    this.obj = null
    this.picked = false
    this.pickable = false // true if the object has been added to pickable objects.
    /**
    In most cases the association to pick is the id of this.obj, but
    in other cases you may want to specify a specific three object representing
    the association between the picking system and the actor (for example one of 
    the children of this.obj). You can do that by setting the property of actor3d pickMaster
    **/
    this.pickMaster = null; // when null this.obj will be used by pickmanager.
}
ACE3.Actor3D.extends(ACE3.Actor, "ACE3.Actor3D")


/**
 *Default behaviour of init()
 */
ACE3.Actor3D.prototype.init = function() {
        this.addToScene()
}

ACE3.Actor3D.prototype.getId = function() {
        return this.obj.id
}

/**
* Default beahaviour for remove()
* The remove() method should be called by manager
* You can overwrite this method.
*/
ACE3.Actor3D.prototype.removeSelf = function() {
    console.log("removeSelf:")
    console.log(this.obj.parent)
    this.removeFromScene()
    this.alive = false
    if (this.pickable) {
        _ace3.pickManager.removeActor(this)
    }
}

ACE3.Actor3D.prototype.setPickable = function() {
    _ace3.pickManager.addActor(this)
    this.pickable = true
}

ACE3.Actor3D.prototype.addToScene = function () {
    _ace3.scene.add(this.obj)
}

ACE3.Actor3D.prototype.removeFromScene = function () {
    _ace3.scene.remove(this.obj)
}

ACE3.Actor3D.prototype.addActor = function(actor) {
    //Nothing is more wrong than this. 
    // this.superClass = Actor if the this object is not an extension of Actor3D
    // if 'this' is a successor of Actor3D this leads to infinite recursion (this.superClass is 'Actor3D' forever)
    ACE3.Actor3D.superClass.addActor.call(this, actor)
    this.obj.add(actor.obj)
}

/**
* Note : no object is really destroyed during this operation. The child is only detached
* and is lost every reference inside this actor. But any other reference outside will keep 
* the child object alive in memory.
*/
// ACE3.Actor3D.prototype.removeActor = function(actor) {
//     this.obj.remove(actor.obj)
//     ACE3.Actor3D.superClass.removeActor.call(this, actor)
// }

/**
* It executes the lookAt THREE js implementation, but after 
* the rotation, it revert the X,Z angles
* The concept is to using lookAt but with the y poistion of the current actor.
*/
ACE3.Actor3D.prototype.lookAtXZFixed = function (targetPos) {
    //var angX = this.obj.rotation.x
    //var ang = this.obj.rotation.z
    var pos = new THREE.Vector3( targetPos.x, this.obj.position.y, targetPos.z)
    this.obj.lookAt(pos)
}

/*
* Ignore the y gap between actor positions, and calculate only the xz distance
*/
ACE3.Actor3D.prototype.XZDistanceTo = function (targetActor) {
    targetPos = targetActor.obj.position
    var pos = new THREE.Vector3( targetPos.x, this.obj.position.y, targetPos.z)
    return this.obj.position.distanceTo(pos)
}

ACE3.Actor3D.prototype.setColor = function(color) {
    this.obj.material.color = new THREE.Color(color)
}

ACE3.Actor3D.prototype.hide = function() {
    this.obj.visible = false
}

ACE3.Actor3D.prototype.show = function() {
    this.obj.visible = true
}

    

/**
* HTML Actors are outside the _ace3_container, so their events are not managed, nor intercepted
* by the eventManager, for many reasons this is useful. 
* An html actor always call it's click function when it's clicked. He has a standard onclick event
* on it, intercepted only by this element alone. No other element can activate this event.
* So it doesn't interfere with object picking. It's like to be on another window, even if visually
* it is drawn on top of the ace3 container.
*/
ACE3.ActorHTML = function() {
    ACE3.Actor.call(this)
    this.obj = null
    this.baseCss = ""
    this.baseClasses = ""
    this.content = ""
    // this.clickReset = true  // if true, the click on this button is the only event fired, because 
                            // the mouse status will be reset. So it's not going to generate 
                            // mess with undeground pickable objects.
                            // TODO : I have yet to think how to implement this.
    this.id = this.getType().replace(/\./gi, "_")  + THREE.Math.randInt(0,999) + THREE.Math.randInt(0,999) //id of the element

    this.onClickFunction = null

    this.onclick = "onclick=\"_ace3.findActorById('" + this.id + "').click()\""

    //this.onmouseover = "onmousedown=\"_ace3.eventManager.ignoreMouseEvent(); console.log('cc')\""

    this.interceptAttrs = this.onclick


}

ACE3.ActorHTML.extends(ACE3.Actor, "ACE3.ActorHTML")


ACE3.ActorHTML.prototype.init = function() {
    this.content = this.buildContent()
    $("body").append(this.content)
    $("#" + this.id).addClass(this.baseClasses)
    $("#" + this.id).css(this.baseCss)
    //this.addClass(this.baseClasses)
    //this.css(this.baseCss)
}

ACE3.ActorHTML.prototype.getId = function() {
    return this.id
}

ACE3.ActorHTML.prototype.hide = function() {
    $("#" + this.id).hide()
}
ACE3.ActorHTML.prototype.show = function() {
    $("#" + this.id).show()
}
ACE3.ActorHTML.prototype.remove = function() {
    $("#" + this.id).remove()
}
ACE3.ActorHTML.prototype.addStyle = function(style) {
    var el = $("#" + this.id)
    if (el[0] != undefined) {
        this.style = el.attr("style") + style
        el.attr("style", this.style) //adding the style to the current DOM element
    }else {
        this.style += style
    }
    //console.log(this.style)
}
ACE3.ActorHTML.prototype.setStyle = function(style) {
    this.style = style
    var el = $("#" + this.id)       
    if (el[0] != undefined) {
        el.attr("style", this.style)   
    }else {
    }
}

/**
* Standard way to build or rebuild the content when needed before adding to DOM. When the content is already added to the DOM
* there's no sense to use this method.
*/
ACE3.ActorHTML.prototype.buildContent = function() {
    return "<div id='" + this.id + "' style='" + this.style + "'> " + this.label + " </div>"
}

/**
* Some jquery shortcuts
*/
ACE3.ActorHTML.prototype.css = function(name, value) {
    $("#" + this.id).css(name, value)
}
ACE3.ActorHTML.prototype.addClass = function(className) {
    $("#" + this.id).addClass(className)
}
ACE3.ActorHTML.prototype.removeClass = function(className) {
    $("#" + this.id).removeClass(className)
}


// TODO maybe the parameter is not neededs
ACE3.ActorHTML.prototype.click = function(className) {
    // if (this.clickReset) {
    //     // _ace3.eventManager.resetMousePressed()
    //     // _ace3.eventManager.resetMouseReleased()
    //     _ace3.eventManager.forceResetMouse()
    // }
    this.onClickFunction()
}

ACE3.Camera = function (container) {
    this.pivot = new THREE.Object3D() //is going to be very useful for most uses of camera moving and rotations
    this.cameraObj = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 1, 4000)
    //this.pivot.add(this.cameraObj)
    this.cameraObj.position = this.pivot.position // AVOID TO MAKE CameraObj as child of Pivot, 
                                                  // they only point to the same postion vector.
    //this.pivot = new THREE.PerspectiveCamera(45, container.offsetWidth / container.offsetHeight, 1, 4000)
    //this.cameraObj = this.pivot
    this.moveUp = false
    this.moveDown = false
    this.moveForward = false
    this.moveBackward = false
    this.moveLeft = false
    this.moveRight = false
    this.speed = 2
}

ACE3.Camera.prototype = {
    constructor: ACE3.Camera,
    type: "ACE3.Camera",   
    run: function() {
        this.control()
        var p = this.pivot.position
        var s = this.speed
        if (this.moveUp) p.y += s
        if (this.moveDown) p.y -= s
        if (this.moveForward) p.z -= s
        if (this.moveBackward) p.z += s
        if (this.moveLeft) p.x -= s
        if (this.moveRight) p.x += s       
    },
    /**
     * This sets the defaults keys for the camera
     */
    control: function() {
        var em = _ace3.eventManager
        var kc = em.keyCodes
        this.moveUp = em.pressed(kc.right_shift)
        this.moveDown = em.pressed(kc.right_control)
        this.moveForward = em.pressed(kc.arrow_up)
        this.moveBackward = em.pressed(kc.arrow_down)
        this.moveRight = em.pressed(kc.arrow_right)
        this.moveLeft = em.pressed(kc.arrow_left)
    }, 

    lookAt: function(vec3) {
        this.cameraObj.lookAt(vec3)
    },  
    
    
    
}

/**
 * This object implements purely a logic for thing to do. It must be
 * registered to an actorManager in order to be executed in each iteration
 */
ACE3.Logic = function() {
    this.paused = false
}

ACE3.Logic.prototype = {
    constructor: ACE3.Logic,
    type: "ACE3.Logic", 
    /**
     * run logic is void , you must implement your own logic overriding this method.
     */
    run: function() {
        // The logic is void , you must implement your own logic overriding this method.
    }
}

/**
* This is a wrapper for the Clock and it stores the elapsed time between frames.
* Actually it CAN'T (!!) be used as a contextual timer (so the time is always going on for
* every Actor/Manager, even if they are paused)
*/

ACE3.TimeManager = function() {
	this.clock = new THREE.Clock()  // the THREE clock object for custom uses.
	this.frameTime = this.clock.getElapsedTime() // the time when the current frame is executed
	this.frameDelta = this.clock.getElapsedTime() // the time passed from the previous frame.
}

/**
* This method should be called by ace3 core engine once per frame, so 
* the frameDelta stores exactly the time passed between frames.
*/
ACE3.TimeManager.prototype.run = function() {
	this.frameDelta = this.clock.getDelta()
	this.frameTime = this.clock.getElapsedTime()
}

/**
* The CooldownTimer is used as local timer for an Actor/Entity. 
* It must be called everytime it's needed through trigger() method.
* The method returns if the time has reached 0 and it can restart
* automatically if needed (default is restart = false) 
*/

ACE3.CooldownTimer = function(cooldownTime, autoRestart) {
    this.maxTime = cooldownTime
    this.time = cooldownTime
    this.autoRestart = autoRestart || false
    this.stopped = false
}

/* 
* If the timer is stopped the trigger is always true.
*/
ACE3.CooldownTimer.prototype.trigger = function() {
    if (this.stopped) {
        return true
    }
    this.time -= _ace3.time.frameDelta
    if (this.time <= 0) {
        if (this.autoRestart) {
            // TRIGGER AND RESET COOLDOWN
            this.time = this.maxTime
        }else {
            this.stopped = true
        }
        return true
    }else {
        return false
    }
}

ACE3.CooldownTimer.prototype.restart = function(newTime, autoRestart) {
    this.maxTime = newTime || this.maxTime
    this.time = newTime || this.maxTime
    this.autoRestart = autoRestart || this.autoRestart
    this.stopped = false
}

ACE3.Actor3D.prototype.getWorldCoords = function() {
    var wc = new THREE.Vector3(0, 0, 0)
    return this.obj.localToWorld(wc)
}

ACE3.ActorManager = function(scene) {
    this.scene = scene
    this.actors = {} // incremental array (normal)
    this.logics = new Array() // array of logics for the whole actorManager
    
    this.paused = true
}

ACE3.ActorManager.prototype = {
    constructor: ACE3.ActorManager,
    type: "ACE3.ActorManager", 
       
    registerActor: function(actor) {
        actor.manager = this
        actor.init()
        this.actors["" + actor.getId()] = actor 
    },

    unregisterActor: function(actor) {
        var id = "" + actor.getId()
        a = this.actors[id]
        a.removeSelf()
        a.alive = false // can be used if referenced from some other objects to control if it's alive.
        a.manager = null
        delete this.actors[id]
    },

    /**
    * Complete removal of every actor and logic, and status too
    */
    reset: function() {
        this.cleanActors()
        for (var i in this.logics) {
            delete this.logics[i]
        }
        this.actors =  {}
        this.logics = new Array()
        this.paused = true       
    },

    pause: function() {
        this.paused = true
    },
    play: function() {
        this.paused = false
    },

    run: function() {
        if (this.paused)
            return
      
        //for (var i = 0; i < this.actors.length; i++) {
        var deadActorIndexes = new Array()
        for (var id in this.actors) {
            var a = this.actors[id]
            if (a.alive) {
                a.__run()
            }else {
                this.unregisterActor(a)
            }
        }
        //this.cleanActors(deadActorIndexes)

        for (var i in this.logics) {
            if (!this.logics[i].paused)
                this.logics[i].run()
        }
    },

    /**
    * Clean the actors given a list of indexes of dead actors
    * The cleaning must be done sorting the deadActorIndexes array in numerical descending way
    * or we will probably mess with indexes during splicing.
    * NOTE: if deadActorIndexes is undefined the cleaning is total for all actors
    */
    cleanActors: function(deadActorIndexes) {

        if (deadActorIndexes == undefined) {
            deadActorIndexes = new Array()
            for (var index in this.actors) {
                deadActorIndexes.push(index)
            }
        }

        deadActorIndexes.sort(function(a,b) {return b-a;}) //VERY IMPORTANT !!!
        if (deadActorIndexes.length > 0) {
            for (var itemIndex in deadActorIndexes) {
                var a = this.actors[deadActorIndexes[itemIndex]]
                this.unregisterActor(a)
            }
        }
    },

    registerLogic: function(logicActor) {
        this.logics.push(logicActor)
    },

    unregisterLogic: function(logicActor) {
        // TODO
    },

    findActorById: function(actorId) {
        return this.actors["" + actorId]
    },
}

ACE3.EventManager = function() {
    //this.keyEvents = new Array()
    //this.mouseEvents = new Array()
    //this.addKeyEvent = function(keyCode, caller, fnDown, fnUp) {
    //    this.keyEvents[keyCode] = new ACE3Event(keyCode, caller, fnDown,fnUp)
    //}
    //TODO : event manager should store an array of current pressed keys.
    this.key = {} //Associative array code/status
    this.mouseStatus = "" //DOWN,UP
    this.ignoreNextMouseEvent = false

    this.keyCodes = {
        // some labeled key codes
        arrow_up : 38,
        arrow_down : 40,
        arrow_left: 37,
        arrow_right: 39,
        right_shift: 16,
        right_control: 17,
        escape: 27
    }
}

ACE3.EventManager.prototype = {
    constructor: ACE3.EventManager,
    type: "ACE3.EventManager", 
    
    resetUpKeys: function() {
        // At every step the eventManager must reset state of keys that are
        // in the UP state
        for (id in this.key) {
            if (this.key[id] == "UP") {
                delete this.key[id]
            }
        }
    },
    
    resetMouseReleased: function() {
        if (this.mouseStatus == 'UP') {
            this.mouseStatus = ""
        }
    },
    
    pressed: function(keyCode) {
        if (this.key[keyCode] != undefined){
            return this.key[keyCode] == "DOWN"
        }
        return false
    },
    released: function(keyCode) {
        if (this.key[keyCode] != undefined){
            return this.key[keyCode] == "UP"
        }
        return false
    },
    
    mousePressed: function() {
        return !this.ignoreNextMouseEvent && this.mouseStatus == 'DOWN'
    },
    
    mouseReleased: function() {
        return !this.ignoreNextMouseEvent && this.mouseStatus == "UP"
    }, 
    forceResetMouse: function() {
        this.mouseStatus = ""
    },
    // *
    // * EventManager manages only non HTML elements, so onclick could activate
    // * some html element and we don't want that the 3D environment could be affected
    // * by the event. This flag must be removed in the end of ace3 main loop.
    
    // ignoreMouseEvent: function() {
    //     this.ignoreNextMouseEvent = true
    // },
    /**
    * This resets all default imposed during a single cycle. It is at 99% mandatory 
    * to do it every loop of the game.
    */
    standardReset: function() {
        this.resetUpKeys()
        this.resetMouseReleased()
        this.ignoreNextMouseEvent = false
    }
}


ACE3.PickManager = function() {
    this.pickables = new Array() //DON'T REMOVE: It's useful during picking process. Array of three js objects
    this.actors = {} //Associative array (three "id" obj -> actor)
                     //If you redefine setPickable for an actor to use any THREE.Object as pickable and different
                     //from the standard obj id of the actor , probably this works. So the
                     //array this.actors does not have to be exactly id -> actor, but (id of some object) -> actor. 
    this.pickedActor = null // store the Actor currently over the mouse
    this.intersectedObj = null
}



//TODO : the new way should be that: 
//       the 3D object is storing a variable like object3D.actorRef set during the creation of the object.
//       so I can pick the object and get instantly the actor referenced. 
//       This involves to create a method in Actor3D object : setObject(mesh) and do it everywhere 
ACE3.PickManager.prototype = {
    constructor: ACE3.ActorManager,
    type: "ACE3.PickManager", 

    addActor: function(actor) {
        var obj = actor.obj;
        if (actor.pickMaster != null) {
            obj = actor.pickMaster;
        }
        this.pickables.push(obj);
        this.actors["" + obj.id] = actor;
    },
    
    removeActor: function(actor) {
        var idToFind = actor.obj.id;
        if (actor.pickMaster != null) {
            idToFind = actor.pickMaster.id;
        }
        for (var pi in this.pickables) {
            if (this.pickables[pi].id == idToFind) {
                this.pickables.splice(pi, 1)
                break
            }
        }
        delete this.actors["" + idToFind]
        // THE REST IS FOR LOGGING PURPOSES
        // if (actor.typeIn(['Rock', 'Paper', 'Scissors'])) {
        //     console.log("Removed player " + actor.owner.name +" type " + actor.getType() +" id " + actor.getId())
        //     var s = ""
        //     for (var i = 0 ; i< this.pickables.length; i++) {
        //         s += this.pickables[i].id + " "
        //     }
        //     console.log(s)
        // }
    },
    
    // TODO : an old implementation makes the pickManager to run
    // at every cycle but this is not always necessary. It must be implemented
    // by a specific logicActor calling ace3pick and storeActorByObject.
    //this.run = function() {
    //    po = _ace3.pick()
    //    this.storeActorByObject(po)
    //}
    //
    
    
    /**
     * set an actor as picked given the correspondent three js Intersect object
     * it stores the first actor under the mouse pointer and the entire intersected object for some
     * purposes (like exact position in the 3d object)
     * if the mouse is not under any pickable object it returns null
     * The previous object stored in pickedActor is clened from every
     * picking status.
     */
    storeActorByObject: function(intersectedObj) {
        if (intersectedObj != undefined && intersectedObj.object != undefined) {
            if (this.pickedActor != undefined) {
                this.pickedActor.picked = false //unsetting the preceding selected object
            }
            this.pickedActor = this.actors["" + intersectedObj.object.id]
            this.pickedActor.picked = true
            this.intersectedObj = intersectedObj

        } else {
            this.pickedActor = null
            this.intersectedObj = null
        }
    },
    
    /**
     * Calculate the object under the mouse, stores it under
     * the mousoverActor variable and returns it.
     */
    pickActor: function() {
        this.storeActorByObject(_ace3.pick())
    },
}


/**
* Same as Actor Manager, but used only for pure HTML actors, like menus or HUD.
* HTML Actors inside the game and tied to 3d actors should not be managed by this.
*/
ACE3.PureHTMLActorManager = function() {
    ACE3.ActorManager.call(this)
}
ACE3.PureHTMLActorManager.extends(ACE3.ActorManager,"ACE3.PureHTMLActorManager")

ACE3.PureHTMLActorManager.prototype.pause = function() {
    this.paused = true
    // hide every actor
    for (id in this.actors) {
        this.actors[id].hide()
    }
}

ACE3.PureHTMLActorManager.prototype.play = function() {
    this.paused = false
    // show every actor
    for (id in this.actors) {
        this.actors[id].show()
    }
}

ACE3.Utils = {
    getColorableMesh: function(threeObj) {
        m = threeObj.material
        if (m != undefined)
            if (m.color != undefined) {
                return m
            }
        return null
    },
    /**
     * Get the C code for shader written in the DOM with a specific id
     *
     */
    getShader: function(id) {
        var sc = $("#"+id);
        if (sc.length > 0) {
            return sc.text();
        }else {
            return ACE3.VertexShaders[id];
        }

    },
    /**
    * Given a color in hex, returns a vec3 array with rgb values betwenn 0.0 and 1.0
    */ 
    getVec3Color: function(hexColor) {
        var c = new THREE.Color(hexColor)
        return new THREE.Vector3(c.r, c.g, c.b)
    },
    /**
    * Builds a standard uniform dictionary with these
    * variables : time(float), resolution(vec2), color(vec3)
    * It is useful for shaders.
    */
    getStandardUniform: function() {
            //Alternate mesh
        return {
                time: { type: "f", value: 1.0 },  //useful for timing
                resolution: { type: "v2", value: new THREE.Vector2() }, //mandatory for resolution
                color: { type: "v3", value: new THREE.Vector3(1.0, 1.0, 1.0) }, //useful to send a color
                cycles: { type: "f", value: 1.0 }, //useful for something else like iterations
            }
    },
    getStandardShaderMesh: function(uniform, vertexShader, fragmentShader, geometry) {
        var m = new THREE.ShaderMaterial( {
            uniforms: uniform,
            vertexShader: ACE3.Utils.getShader(vertexShader),
            fragmentShader: ACE3.Utils.getShader(fragmentShader),
        });
        return new THREE.Mesh(geometry, m) 
    },
    /**
    * Given a 256 value rgb vector, convert it to an hexadecimal number
    */
    rgb2hex: function(r, g, b) {
        var  hs = Math.floor(r).toString(16);
        hs = hs.length == 1 ? "0" + hs : hs;
        var rs = hs;
        var  hs = Math.floor(g).toString(16);
        hs = hs.length == 1 ? "0" + hs : hs;
        var gs = hs;
        var  hs = Math.floor(b).toString(16);
        hs = hs.length == 1 ? "0" + hs : hs;
        var bs = hs;
        hs = "0x" + rs + gs + bs;
        return parseInt(hs);
    },
}

ACE3.Math = {
    matrix: function(cols, rows) {
        clist = new Array(cols)
        for (var ci = 0; ci < clist.length; ci++) {
          clist[ci] = new Array(rows)
        }
        return clist
    },
    /**
    *   Build a Vector2 object with random values between -spread/2 and spread/2
    */
    randVector2: function(spread) {
        return new THREE.Vector2(THREE.Math.randFloatSpread(spread), THREE.Math.randFloatSpread(spread))
    },
    randVector3: function(spread) {
        return new THREE.Vector3(THREE.Math.randFloatSpread(spread), 
                                THREE.Math.randFloatSpread(spread),
                                THREE.Math.randFloatSpread(spread))
    },
    /**
    *   vec2Start and vec2End are covering a rectangle area. But i don't know what rectangle 
    *   vertices they are representing.
    *   Returns 2 new vector2 that represent the area covered between vec2Start e vec2End
    *   but with the vectors sorted starting from top-left to bottom-right
    *   The returning format is {v2Start: Vector2, v2End: Vector2}
    */
    getSortedCoords: function(vec2Start, vec2End) {
        var vstart = new THREE.Vector2(Math.min(vec2Start.x, vec2End.x),
                                   Math.min(vec2Start.y, vec2End.y))
        var vend = new THREE.Vector2(Math.max(vec2Start.x, vec2End.x),
                                   Math.max(vec2Start.y, vec2End.y))
        return {v2Start: vstart, v2End: vend}
    },
    /**
    *   get the directional vector from the vec3start looking at vec3end.
    *   The result is a vector3 useful. For example you could use it to
    *   add it to the vec3end to get closer/far to vec3Star
    *   Remember that if you have 3d objects you could use the lookAt method,
    *   but this force the object to lose it's original rotations.
    *   The getDirection method prevents any rotation to be modified. 
    */
    getDirection: function(vec3Start, vec3End) {
        var dist = vec3Start.distanceTo(vec3End)
        var dirv = new THREE.Vector3()
        dirv.sub(vec3End, vec3Start)
        return dirv.multiplyScalar(1/dist)
    },
}

ACE3.Builder = {
    squareXZ: function(sx, sy, color) {
        var geometry = new THREE.PlaneGeometry(sx, sy)
        var s = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({'color':color}))
        s.rotation.x = - Math.PI/2
        return s
    },
    squareXZWireFrame: function(sx, sy, color) {
        var s = this.squareXZ(sx, sy, color)
        s.material.wireframe = true
        s.material.wireframeLinewidth = 55
        return s
    },
    dot: function(color) {
        var g = new THREE.SphereGeometry(0.01)
        var s = new THREE.Mesh(g, new THREE.MeshBasicMaterial({'color':color}))
        return s
    },
    cube: function(size,color) {
        var g = new THREE.CubeGeometry(size, size, size)
        var s = new THREE.Mesh(g, new THREE.MeshBasicMaterial({'color':color}))
        return s        
    },
    /**
     * Same as cube but with different sizes in every axis
     */
    cube2: function(sizex, sizey, sizez, color) {
        var g = new THREE.CubeGeometry(sizex, sizey, sizez)
        var s = new THREE.Mesh(g, new THREE.MeshBasicMaterial({'color':color}))
        return s
    },
    // NOTE : in windows the linewidth doesn't work (see the three js documentation)
    line: function(vec3orig, vec3dest, color, linewidth) {
        var g = new THREE.Geometry();
        g.vertices.push(vec3orig);
        g.vertices.push(vec3dest);
        var m = new THREE.LineBasicMaterial({color: color, linewidth : linewidth});
        var s = new THREE.Line(g, m)
        return s  
    },
    cylinder: function(radius, height, color, radius2) {
        radius2 = radius2 || radius
        var g = new THREE.CylinderGeometry(radius, radius2, height)
        var s = new THREE.Mesh(g, new THREE.MeshBasicMaterial({'color':color}))
        return s
    },

    sphere: function(radius, color) {
        var g = new THREE.SphereGeometry(radius)
        var s = new THREE.Mesh(g, new THREE.MeshBasicMaterial({'color':color}))
        return s        
    },
    shaderCube: function() {
        var g = new THREE.SphereGeometry(1, 16, 12)
        var attributes = {
          displacement: {
            type: 'f', // a float
            value: [] // an empty array
          }
        };
        var uniforms = {
          amplitude: {
            type: 'f', // a float
            value: 0
          }
        };
        var m = new THREE.ShaderMaterial({
                attributes: attributes,
		uniforms: uniforms,
                vertexShader: _ace3.getShader("test2_vertexShader"),
                fragmentShader: _ace3.getShader("test2_fragmentShader")})
        var s = new THREE.Mesh(g, m)
        
        //Putting some random values in the attributes object
        var verts = s.geometry.vertices;
        var values = attributes.displacement.value;
        for(var v = 0; v < verts.length; v++) {
            values.push(Math.random() * 0.4);
        }
        return s         
    },
    /**
    * Draw squares placed around a pivot point.
    * The size of squares is proportional to nsquares and radius, so to leave a little space
    * between one another.
    * It's rotated to be placed on XZ Plane
    */
    radialSquares: function(radius, nsquares, color, opacity) {
        var p = new THREE.Object3D() //intermediate pivot
        var circ = 2 * Math.PI * radius
        var size = circ / (nsquares * 2)
        for (var i = 0; i < nsquares; i++) {
            angle = i * (Math.PI * 2) / nsquares
            var xp = Math.cos(angle) * radius
            var zp = Math.sin(angle) * radius
            var geometry = new THREE.PlaneGeometry(size, size)
            var sq = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({'color':color}))
            sq.rotation.z = angle
            sq.position.set(xp, zp, 0)
            p.add(sq)
            sq.material.transparent = true
            sq.material.opacity = opacity            
        }
        p.rotation.x = - Math.PI / 2
        var obj = new THREE.Object3D()
        obj.add(p)
        return obj
    }
}

//ACE3.ShaderSnippets = {
//    simpleVertex : "void main() {gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0);}",
//    simpleFragment : "void main() {gl_FragColor = vec4(1.0, 0.0, 1.0, 1.0);}"
//}





ACE3.SkyBox = function(texturePrefix, extension) {

	// The skybox is based on the article at http://learningthreejs.com/blog/2011/08/15/lets-do-a-sky/

	var ext = extension || "jpg"

	ACE3.Actor3D.call(this)
	var urls = [ texturePrefix + "posx." + ext, texturePrefix + "negx." + ext,
			     texturePrefix + "posy." + ext, texturePrefix + "negy." + ext,
			     texturePrefix + "posz." + ext, texturePrefix + "negz." + ext ];
	var textureCube = THREE.ImageUtils.loadTextureCube( urls );
	textureCube.format = THREE.RGBFormat;
	var shader = THREE.ShaderLib["cube"];
	var uniforms = THREE.UniformsUtils.clone( shader.uniforms );
	uniforms['tCube'].value = textureCube; // textureCube has been init before
	var material = new THREE.ShaderMaterial({
	    fragmentShader  : shader.fragmentShader,
	    vertexShader    : shader.vertexShader,
	    uniforms    : uniforms,
	    depthWrite: false,
		side: THREE.BackSide
	});
	// build the skybox Mesh 
	this.obj = new THREE.Mesh( new THREE.CubeGeometry( 4000, 4000, 4000, 1, 1, 1), material );
	this.obj.flipSided = true;

}

ACE3.SkyBox.extends(ACE3.Actor3D, "ACE3.SkyBox")

/**
* The ParticleActor creates some particles, and the default disposition of them
* is within a box with size given by spread property.
* You must to implement your own reset method to change disposition.
*/
ACE3.ParticleActor = function(props) {
	ACE3.Actor3D.call(this)

	this.texture = props.texture || null
	this.size = props.size || 10
	this.color = props.color || 0xFFFFFF
	this.particleCount = props.particleCount || 1000
	this.spread = props.spread

    var particles = new THREE.Geometry()
    var pMaterial = null
    if (this.texture != null) {
	    pMaterial = new THREE.ParticleBasicMaterial({color: this.color, size: this.size,
	                        map: THREE.ImageUtils.loadTexture(this.texture),
	                        blending: THREE.AdditiveBlending, transparent: true});
	}else {
	    pMaterial = new THREE.ParticleBasicMaterial({color: this.color, size: this.size})		
	}
    // now create the individual particles
    for(var p = 0; p < this.particleCount; p++) {
        particle = ACE3.Math.randVector3(this.spread)
        particles.vertices.push(particle);
    }
    // create the particle system
    this.obj = new THREE.ParticleSystem(particles, pMaterial);

}
ACE3.ParticleActor.extends(ACE3.Actor3D, "ACE3.ParticleActor")

/**
* Updates geometry of the vertices
*/
ACE3.ParticleActor.prototype.refresh = function() {
    //this.obj.geometry.__dirtyVertices = true;
    this.obj.geometry.verticesNeedUpdate = true
}

/**
* Build a sphere-disposed particle system, like a starry sky seen by earth surface.
* The system is slowly rotating (y-rotation)
*/
ACE3.StellarSky = function(origin, radius) {
    ACE3.ParticleActor.call(this, {
        texture: 'media/particle2.png',
        size: 10,
        spread: 0,
        particleCount: 2000,
    });
    this.radius = radius || 800
    this.origin = origin || new THREE.Vector3(0, 0, 0)
    this.needReset = true
    //this.growSpeed = 0.3
}

ACE3.StellarSky.extends(ACE3.ParticleActor, "ACE3.StellarSky")

ACE3.StellarSky.prototype.reset = function(vec3Pos) {
	//this.duration = 0.3
	this.hide()
	var vec3Pos = vec3Pos || this.origin
	this.obj.position.copy(vec3Pos)
	for (var pi = 0; pi < this.particleCount; pi++) {
		var p = this.obj.geometry.vertices[pi]
		p.copy(new THREE.Vector3(0, 0, 0))
		var radius = this.radius + THREE.Math.randInt(0, this.radius/8)
		var mult = ACE3.Math.randVector3(1).normalize().multiplyScalar(radius);
		p.add(mult)
	}
	this.origin.copy(vec3Pos)
	this.refresh()
	this.show()
	this.needReset = false
}

ACE3.StellarSky.prototype.run = function() {
	if (this.needReset) {
		this.reset()
	}
	// TODO : finish to implement rotations.
	this.obj.rotation.y += 0.0002

}

ACE3.Explosion = function(origin) {
    ACE3.ParticleActor.call(this, {
        texture: 'media/particle2.png',
        size: 1.3,
        spread: 0,
        particleCount: 35,
    });
    this.origin = origin || new THREE.Vector3(0, 0, 0)
    this.needReset = true
    this.growSpeed = 0.3
}

ACE3.Explosion.extends(ACE3.ParticleActor, "ACE3.Explosion")

ACE3.Explosion.prototype.reset = function(vec3Pos) {
	this.duration = 0.3
	this.hide()
	var vec3Pos = vec3Pos || this.origin
	this.obj.position.copy(vec3Pos)
	for (var pi = 0; pi < this.particleCount; pi++) {
		var p = this.obj.geometry.vertices[pi]
		p.copy(new THREE.Vector3(0, 0, 0))
		p.direction = ACE3.Math.randVector3(this.growSpeed) // random direction chosen for every particle.
	}
	this.origin.copy(vec3Pos)
	this.refresh()
	this.show()
	this.needReset = false
}

ACE3.Explosion.prototype.run = function() {
	if (this.needReset) {
		this.reset()
	}
	var o = this.origin
	for (var pi = 0; pi < this.particleCount; pi++) {
		var p = this.obj.geometry.vertices[pi]
		p.add(p.direction)
	}
	this.refresh()
	this.duration -= ace3.time.frameDelta
	if (this.duration <= 0) {
		// this.needReset = true
		this.alive = false
	}
}

ACE3.Ascension = function(origin) {
    ACE3.ParticleActor.call(this, {
        texture: 'media/particle.png',
        size: 1.3,
        spread: 3,
        particleCount: 5,
    });
    this.origin = origin || new THREE.Vector3(0, 0, 0)
    this.needReset = true
}

ACE3.Ascension.extends(ACE3.ParticleActor, "ACE3.Ascension")

ACE3.Ascension.prototype.reset = function() {
	this.hide()
	for (var pi = 0; pi < this.particleCount; pi++) {
		this.resetParticle(this.obj.geometry.vertices[pi])
	}
	this.refresh()
	this.show()
	this.needReset = false
}

ACE3.Ascension.prototype.resetParticle = function(p) {
	p.y = -this.spread/2
	p.x = THREE.Math.randFloatSpread(this.spread)
	p.z = THREE.Math.randFloatSpread(this.spread)
	p.velocity = THREE.Math.randFloat(0.01, 0.05)
	p.velocity = THREE.Math.randFloat(0.01, 0.05)
	return p // this is not really needed as the method operates on an object passed, but may be useful.
}

ACE3.Ascension.prototype.run = function() {
	if (this.needReset) {
		this.reset()
	}
	for (var pi = 0; pi < this.particleCount; pi++) {
		var p = this.obj.geometry.vertices[pi]
		p.y += p.velocity
		if (p.y > this.spread/2) {
			this.resetParticle(p)
		}
	}
	this.refresh()
}

ACE3.HTMLButton = function(label, x, y, width, height, onclick, zindex, textColor, backColor) {
    ACE3.ActorHTML.call(this)
    this.x = x 
    this.y = y
    this.width = width
    this.height = height
    this.label = label
    this.zindex = zindex
    this.center = { x: ( width + x) / 2, y: (height + y) / 2}
    this.onClickFunction = onclick
    this.textColor = textColor || "white"
    this.backColor = backColor || "blue"

    this.baseClasses = "ace3_html_button"

    this.baseCss = {
               top: this.y + "px",
               left: this.x + "px",
               height: this.height + "px",
               width: this.width + "px",
               zIndex: this.zindex,
               backgroundColor: this.backColor,
               color: this.textColor,
               borderRadius: "10px",
               border: "3px solid " + this.textColor,
            }
}

ACE3.HTMLButton.extends(ACE3.ActorHTML, "ACE3.HTMLButton")

ACE3.HTMLButton.prototype.buildContent = function() {
    var s = "<div id='" + this.id + "' " + this.interceptAttrs + " > " + this.label + " </div>"
    // console.log(s)
    return s 
}

ACE3.HTMLButton.prototype.changeLabel = function(newLabel) {
    this.label = newLabel
    $("#" + this.id).html(this.label)
}


/**
* This is the class for the default action button in the game. The
* run() function is managing some situations to decide whether to 
* display itself or to display grayed out (disabled), or to not display at all.
*/

DefaultGameButton = function(label, vec2pos, vec2size, onclick) {
	ACE3.HTMLButton.call(this, label, vec2pos.x, vec2pos.y, vec2size.x, vec2size.y, 
		onclick, 10, "gold", "black")
	this.baseCss.fontSize = "0.8em"
	this.hidden = false
	this.disabled = false
	//this.onmouseover = "onmouseover=\"_ace3.findActorById('" + this.id + "').mouseover()\""
	this.onMouseOverFunction = null
	this.onMouseOutFunction = null
	this.displayInfo = null //the reference to the displayInfoActor
	this.displayInfoMessage = "" // the message to be pushed in the displayInfo Actor only when needed.
	this.mouseStatus = "OUT" // "OVER", "OUT"
}

DefaultGameButton.extends(ACE3.HTMLButton, "DefaultGameButton")

DefaultGameButton.prototype.init = function() {
	this.getSuperClass().init.call(this)
	$("#" + this.getId()).attr("onmouseover", "_ace3.findActorById('" + this.id + "').mouseover()")
	$("#" + this.getId()).attr("onmouseout", "_ace3.findActorById('" + this.id + "').mouseout()")
}

DefaultGameButton.prototype.mouseover = function() {
	this.mouseStatus = "OVER"
}
DefaultGameButton.prototype.mouseout = function() {
	this.mouseStatus = "OUT"
	if (this.displayInfo) {
		this.displayInfo.hide()  //this is done here only once when going out of the view of the button !!!
	}
}

/**
* This is the initLoop logic executed at every cycle, you should simply 
* implement here some initialization you need at every loop of the game
*/
DefaultGameButton.prototype.initLoopLogic = function() {}
/**
* This function should return if the button is hidden from screen
* You should override this function for your own logic on hiding the button
*/
DefaultGameButton.prototype.hiddenLogic = function () {
	return false
}

/**
* This function should return if the button is shown but disabled.
* You should override this function for your own logic on disabling the button
*/
DefaultGameButton.prototype.disableLogic = function() {
	return false
}

DefaultGameButton.prototype.run = function() {
	if (this.displayInfo) {
		if (this.mouseStatus == "OVER") {
			// console.log(this.getInfoMessage())
			this.displayInfo.setValue(this.getInfoMessage())	
			this.displayInfo.show()
		}
	}

	this.initLoopLogic()
	if (this.hiddenLogic()) {
		this.hide()
	}else {
		this.show()
		if (this.disableLogic()) {
			this.disable()
		}else {
			this.enable()
		}
	}
}

DefaultGameButton.prototype.enable = function() {           
	this.disabled = false
	this.css("color", "gold")
    this.css("border", "3px solid green")
}
DefaultGameButton.prototype.disable = function() {
    this.disabled = true
    this.css("color", "gray")
    this.css("border", "3px solid gray")
}

DefaultGameButton.prototype.getInfoMessage = function() {
	return "Override this method to get info when the mouse is over this button"
}

DefaultGameButton.prototype.click = function() {
	if (!this.disabled) {
		this.getSuperClass().click.call(this)
	}
}

ACE3.HTMLBox = function(label, text, x, y, w, h, zindex, textColor, backColor) {
    ACE3.ActorHTML.call(this)
    this.x = x 
    this.y = y
    this.width = w
    this.height = h
    this.label = label
    this.text = text
    this.zindex = zindex
    this.textColor = textColor || "white"
    this.backColor = backColor || "blue"
    this.style = "top: " + this.y + "px; left:" + this.x + "px; height:" + this.height + 
                "px; width: " + this.width + "px; position: fixed; z-index:" + this.zindex + ";" +
                "background-color: " + this.backColor + "; color: " + this.textColor + "; border-radius:10px;";
}

ACE3.HTMLBox.extends(ACE3.ActorHTML, "ACE3.HTMLBox")

ACE3.HTMLBox.prototype.buildContent = function() {
    this.label = "<div style='text-align: center; font-weight: bold;'>" + this.label + "</div>"
    return "<div id='" + this.id +"' style='" + this.style + "'> " + this.label + this.text + " </div>" 
}    

/**
 * shows an html div positioned on top,left coords of screen for now
 * TODO : give the coords from the viewport screen.
 */
ACE3.DisplayValue = function(label, defaultValue, vec2pos) {
    ACE3.ActorHTML.call(this)
    this.obj = null
    this.div = null
    this.label = label  // label can be html code
    this.defaultValue = defaultValue
    this.labelId = null //html id of the element
    this.valueId = null //html id of the element
    this.value = defaultValue
    this.pos = vec2pos
    this.separator = ": "
    this.valueFunction = null

    this.baseCss = {
       position: "fixed",
       top: this.pos.y + "px",
       left: this.pos.x + "px",
       /*height: this.height + "px",*/
       /*width: this.width + "px",*/
       zIndex: 10,
       backgroundColor: "gold",
       color: "black",
       borderRadius: "3px",
    }

}

ACE3.DisplayValue.extends(ACE3.ActorHTML, "ACE3.DisplayValue")
    
ACE3.DisplayValue.prototype.buildContent = function() {
    this.labelId = "display_value_actor_label" + this.id
    this.valueId = "display_value_actor_value" + this.id
    var spanLabel = "<span id='" + this.labelId + "'>" + this.label + "</span>"
    var spanValue = "<span id='" + this.valueId + "'>" + this.value + "</span>"
    return "<div id='" + this.getId() + "'>" + spanLabel + this.separator + spanValue + "</div>"
}
    
ACE3.DisplayValue.prototype.setValue = function(value) {
    if (this.value != value) {
        this.value = value
        $("#" + this.valueId).html(value)
    }
}

ACE3.DisplayValue.prototype.run = function() {
  if (this.valueFunction != null) {
      this.setValue(this.valueFunction())
  }
}

ACE3.VertexShaders = {
	generic: "varying vec2 vUv;"+
             "void main() { "+
             "         vUv = uv;"+
             "         vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );" +
             "         gl_Position = projectionMatrix * mvPosition;" +
             "}",

}
