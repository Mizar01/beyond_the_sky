beyond_the_sky
==============

* Verify if GunTurret object is executed (put a log in the run() method.) (fragment shader was missing)

- Verify if setForRemoval is going to delete an Actor even if it's a child of some other actor (ACE3 bug)
  IMPORTANT : begin to develop the removal of children objects.
* (WAITING FOR THE RESPONSE OF phisijs developer.) Modify the ACE3 Code in scene.addEventListener...  in order to pause simulation if gameManager is paused,  and add the claryfing comment in the definition of the defaultActorManager.
* add line() method to ACE3.Builder
* the method findNearestTarget for the icetower finds always the same target. This is incorrect.
* find a new way to shoot with missile turrets. For now almost every shot is useless because other bullets reach
  the target first.
- improve drone movements.
  
