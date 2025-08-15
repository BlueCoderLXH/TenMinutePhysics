// ------- grabber -----------------------------------------------------------
class Grabber {
    constructor(threeScene, renderer, camera, cameraCtl, physicsScene, container, targetLayer = 0) {
        this.threeScene = threeScene;
        this.renderer = renderer;
        this.camera = camera;
        this.cameraCtl = cameraCtl;
        this.physicsScene = physicsScene;
        
        this.mouseDown = false;
        
        this.raycaster = new THREE.Raycaster();
        this.raycaster.layers.set(targetLayer);
        this.raycaster.params.Line.threshold = 0.1;
        this.physicsObject = null;
        this.distance = 0.0;
        this.prevPos = new THREE.Vector3();
        this.vel = new THREE.Vector3();
        this.time = 0.0;
        
        this.handleOnPointer = this.onPointer.bind(this);
        container.addEventListener( 'pointerdown', this.handleOnPointer, false );
        container.addEventListener( 'pointermove', this.handleOnPointer, false );
        container.addEventListener( 'pointerup', this.handleOnPointer, false );
    }

    setTargetLayer(targetLayer) {
        this.raycaster.layers.set(targetLayer);
    }
    
    increaseTime(dt) {
        this.time += dt;
    }
    
    updateRaycaster(x, y) {
        let rect = this.renderer.domElement.getBoundingClientRect();

        const screenPos = new THREE.Vector2();
        screenPos.x = x - rect.left;
        screenPos.y = y - rect.top;

        this.mousePos = new THREE.Vector2();
        // Map coordinate from screen to NDC(Normalize Device Coordinate, [-1, 1])
        // Screen y coordinate is from top to down, opposite to NDC y coordinate
        this.mousePos.x =  (screenPos.x / rect.width  ) * 2 - 1;
        this.mousePos.y = -(screenPos.y / rect.height ) * 2 + 1;

        this.raycaster.setFromCamera( this.mousePos, this.camera );
    }
    
    start(x, y) {
        this.physicsObject = null;
        this.updateRaycaster(x, y);
        let intersects = this.raycaster.intersectObjects( this.threeScene.children );
        if (intersects.length > 0) {
            let obj = intersects[0].object.userData;
            if (obj) {
                this.physicsObject = obj;
                this.distance = intersects[0].distance;
                let pos = this.raycaster.ray.origin.clone();
                pos.addScaledVector(this.raycaster.ray.direction, this.distance);
                this.physicsObject.startGrab(pos);
                this.prevPos.copy(pos);
                this.vel.set(0.0, 0.0, 0.0);
                this.time = 0.0;
                if (this.physicsScene.paused)
                    run();
            }
        }
    }
    
    move(x, y) {
        if (this.physicsObject) {
            this.updateRaycaster(x, y);
            let pos = this.raycaster.ray.origin.clone();
            pos.addScaledVector(this.raycaster.ray.direction, this.distance);

            this.vel.copy(pos);
            this.vel.sub(this.prevPos);
            if (this.time > 0.0)
                this.vel.divideScalar(this.time);
            else
                this.vel.set(0.0, 0.0, 0.0);
            this.prevPos.copy(pos);
            this.time = 0.0;

            this.physicsObject.moveGrabbed(pos, this.vel);
        }
    }
    
    end(x, y) {
        if (this.physicsObject) {
            this.physicsObject.endGrab(this.prevPos, this.vel);
            this.physicsObject = null;
        }
    }
    
    onPointerDown(evt) {
        this.start(evt.clientX, evt.clientY);
        this.mouseDown = true;

        if (this.physicsObject) {
            this.cameraCtl.saveState();
            this.cameraCtl.enabled = false;
        }        
    }

    onPointerMove(evt) {
        this.move(evt.clientX, evt.clientY);
    }

    onPointerUp(evt) {
        if (this.physicsObject) {
            this.end();
            this.cameraCtl.reset();
        }

        this.mouseDown = false;
        this.cameraCtl.enabled = true;        
    }

    onPointer( evt ) {
        event.preventDefault();
        if (evt.type === "pointerdown") {
            this.onPointerDown(evt);
        }
        else if (evt.type === "pointermove" && this.mouseDown) {
            this.onPointerMove(evt);
        }
        else if (evt.type === "pointerup") {
            this.onPointerUp(evt);
        }
    }
}