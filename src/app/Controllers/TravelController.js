define(
[
  'Models/Moon',
  'Modules/ColorManager'
],
function(Moon, ColorManager) {
  'use strict';

  class TravelController {
    constructor(scene) {
      this.scene = scene;
      this.camera = this.scene.camera;
      this.travelObjectType = 'planet'; // default
      this.colorManager = new ColorManager();
    }

    static calculateDestinationCoordinates(targetObject) {
      var x = targetObject.core.position.x;
      var y = targetObject.core.position.y;
      var z = targetObject.core.position.z;

      var destinationX = x;
      var destinationY = y;
      var destinationZ = z;

      var quadrant1 = x > 0 && y > 0;
      var quadrant2 = x < 0 && y > 0;
      var quadrant3 = x < 0 && y < 0;
      var quadrant4 = x > 0 && y < 0;

      var offset = targetObject.threeDiameter > 3 ? targetObject.threeDiameter * 6 : targetObject.threeDiameter * 3;

      if (quadrant1) {
        destinationX = destinationX + offset;
        destinationY = destinationY + offset;
      }

      if (quadrant2) {
        destinationX = destinationX - offset;
        destinationY = destinationY + offset;
      }

      if (quadrant3) {
        destinationX = destinationX - offset;
        destinationY = destinationY - offset;
      }

      if (quadrant4) {
        destinationX = destinationX + offset;
        destinationY = destinationY - offset;
      }

      return {
        x: destinationX,
        y: destinationY,
        z: destinationZ + (targetObject.threeDiameter * 0.15)
      };
    }

    dispatchTravelStartEvent(data) {
      var event = new CustomEvent('solarsystem.travel.'+ this.travelObjectType +'.start', {
        detail: data
      });

      document.dispatchEvent(event);
    }

    dispatchTravelCompleteEvent(data) {
      var event = new CustomEvent('solarsystem.travel.'+ this.travelObjectType +'.complete', {
        detail: data
      });

      document.dispatchEvent(event);
    }

    prepareForTravel(takeOffHeight, targetObject) {
      var travelDuration = 3000;

      return new TWEEN.Tween(this.camera.position)
        .to({
          x: this.camera.position.x,
          y: this.camera.position.y,
          z: this.camera.position.z + takeOffHeight + 700
        }, travelDuration)
        .easing(TWEEN.Easing.Cubic.InOut)
        .onUpdate(()=> {
            this.camera.lookAt(targetObject.threeObject.position);
        })
      ;
    }

    travelToObject(currentPosition, targetObject, takeOffHeight) {
      var travelDuration = 5000;

      this.travelObjectType = targetObject instanceof Moon ? 'moon' : 'planet';
      this.dispatchTravelStartEvent(targetObject);

      THREE.SceneUtils.detach(this.camera, this.camera.parent, this.scene);
      THREE.SceneUtils.attach(this.camera, this.scene, targetObject.orbitCentroid);

      targetObject.core.updateMatrixWorld();
      targetObject.orbitCentroid.updateMatrixWorld();

      this.camera.lookAt(targetObject.threeObject.position);

      var destinationCoordinates = TravelController.calculateDestinationCoordinates(targetObject);
      var takeOff = this.prepareForTravel(takeOffHeight, targetObject);

      var cameraTarget = targetObject instanceof Moon ? targetObject.core : targetObject.objectCentroid;

      return takeOff.start().onComplete(()=> {
        var self = this;
        var cameraTween = new TWEEN.Tween(this.camera.position)
          .to(destinationCoordinates, travelDuration)
          .easing(TWEEN.Easing.Cubic.InOut)
          .onUpdate(function() {
            var destinationCoordinates = TravelController.calculateDestinationCoordinates(targetObject);

            cameraTween.to(destinationCoordinates);

            this.camera.lookAt(targetObject.threeObject.position);

            if (targetObject.highlight.geometry.boundingSphere.radius > targetObject.threeDiameter / 1.25) {
              self.updateTargetHighlight(targetObject);
            }
          }.bind(this))
          .onComplete(this.handleComplete.bind(this, targetObject, cameraTarget))
          .start();
      });
    }

    handleComplete(targetObject, cameraTarget) {
      cameraTarget = cameraTarget || targetObject.objectCentroid;

      THREE.SceneUtils.detach(this.camera, this.camera.parent, this.scene);
      THREE.SceneUtils.attach(this.camera, this.scene, cameraTarget);

      var transition = this.colorManager.fadeTo(
        targetObject.highlight,
        targetObject.highlight.material.color,
        { r: 59, g: 234, b: 247 },
        3000
      ).onComplete(()=> {
        targetObject.core.remove(targetObject.highlight);
      });

      this.camera.lookAt(new THREE.Vector3());

      targetObject.core.updateMatrixWorld();
      targetObject.orbitCentroid.updateMatrixWorld();

      this.dispatchTravelCompleteEvent(targetObject);
    }

    updateTargetHighlight(target) {
      target.core.remove(target.highlight);

      var distanceTo = this.camera.position.distanceTo(target.threeObject.position);
      target.highlight = distanceTo * 0.011;
      target.highlight.material.opacity = 0.9;
    }
  }

  return TravelController;
});
