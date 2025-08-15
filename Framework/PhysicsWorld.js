let gWorld = null;

class PhysicsWorldBase
{
    constructor(physicsScene, container, bWithGrabber) {
        this.PhysicsScene = physicsScene;

        this.ThreeScene = null;
        this.Renderer = null;
        this.Camera = null;
        this.CameraControl = null;
   
        this.container = container;
        
        this.Grabber = null;
        this.UseGrabber = bWithGrabber;
    }
    
    initThreeScene() {
        this.ThreeScene = new THREE.Scene();
        
        this.initThreeScene_Light();
        this.initThreeScene_Geometry();
        this.initThreeScene_Render();
        this.initThreeScene_Camera()
        
        if (this.UseGrabber)
            this.Grabber = new Grabber(this.ThreeScene, this.Renderer, this.Camera, this.CameraControl, this.PhysicsScene, this.container);
    }

    initThreeScene_Light() {
        this.ThreeScene.add( new THREE.AmbientLight( 0x505050 ) );
        this.ThreeScene.fog = new THREE.Fog( 0x000000, 0, 15 );

        let spotLight = new THREE.SpotLight( 0xffffff, 1 );
        spotLight.angle = Math.PI / 5;
        spotLight.penumbra = 0.2;
        spotLight.position.set( 2, 3, 3 );
        spotLight.castShadow = true;
        spotLight.shadow.camera.near = 3;
        spotLight.shadow.camera.far = 10;
        spotLight.shadow.mapSize.width = 1024;
        spotLight.shadow.mapSize.height = 1024;
        this.ThreeScene.add( spotLight );

        let dirLight = new THREE.DirectionalLight( 0x55505a, 1 );
        dirLight.position.set( 0, 3, 0 );
        dirLight.castShadow = true;
        dirLight.shadow.camera.near = 1;
        dirLight.shadow.camera.far = 10;

        dirLight.shadow.camera.right = 1;
        dirLight.shadow.camera.left = - 1;
        dirLight.shadow.camera.top	= 1;
        dirLight.shadow.camera.bottom = - 1;

        dirLight.shadow.mapSize.width = 1024;
        dirLight.shadow.mapSize.height = 1024;
        this.ThreeScene.add( dirLight );        
    }

    initThreeScene_Geometry() {
        let ground = new THREE.Mesh(
            new THREE.PlaneBufferGeometry( 20, 20, 1, 1 ),
            new THREE.MeshPhongMaterial( { color: 0xa0adaf, shininess: 150 } )
        );

        ground.rotation.x = - Math.PI / 2; // rotates X/Y to X/Z
        ground.receiveShadow = true;
        this.ThreeScene.add( ground );

        let helper = new THREE.GridHelper( 20, 20 );
        helper.material.opacity = 1.0;
        helper.material.transparent = true;
        helper.position.set(0, 0.002, 0);
        this.ThreeScene.add( helper );        
    }

    initThreeScene_Render() {
        this.Renderer = new THREE.WebGLRenderer();
        this.Renderer.shadowMap.enabled = true;
        this.Renderer.setPixelRatio( window.devicePixelRatio );
        this.Renderer.setSize( 0.8 * window.innerWidth, 0.8 * window.innerHeight );
        window.addEventListener( 'resize', this.onWindowResize, false );
        this.container.appendChild( this.Renderer.domElement );        
    }

    initThreeScene_Camera() {
        this.Camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.01, 100 );
        this.Camera.position.set(0, 1, 4);
        this.Camera.updateMatrixWorld();

        this.ThreeScene.add(this.Camera);

        this.CameraControl = new THREE.OrbitControls(this.Camera, this.Renderer.domElement);
        this.CameraControl.zoomSpeed = 2.0;
        this.CameraControl.panSpeed = 0.4;        
    }
    
    setTargetLayer(targetLayer) {
        this.Grabber.setTargetLayer(targetLayer);
    }
    
    initUI() {
    }

    initPhysics() {
    }
    
    simulate() {
        let ps = this.PhysicsScene;
        if (ps.paused)
            return;

        let sdt = ps.dt / ps.numSubsteps;

        for (let step = 0; step < ps.numSubsteps; step++) {
            for (let i = 0; i < ps.objects.length; i++)
                ps.objects[i].simulate(sdt, ps.gravity);
        }

        for (let i = 0; i < ps.objects.length; i++) {
            if (ps.objects[i].endFrame) 
                ps.objects[i].endFrame();
        }

        if (this.Grabber)
            this.Grabber.increaseTime(ps.dt);
    }    
    
    update() {
        this.simulate();

        this.Renderer.render(this.ThreeScene, this.Camera);
        
        this.handleUpdate = this.update.bind(this);
        requestAnimationFrame(this.handleUpdate);
    }

    onWindowResize() {
        this.Camera.aspect = window.innerWidth / window.innerHeight;
        this.Camera.updateProjectionMatrix();
        this.Renderer.setSize( window.innerWidth, window.innerHeight );
    }

    restart() {
        location.reload();
    }

    run() {
        let button = document.getElementById("buttonRun");

        if (this.PhysicsScene.paused)
            button.innerHTML = "Stop";
        else
            button.innerHTML = "Run";

        this.PhysicsScene.paused = !this.PhysicsScene.paused;
    }

    squash() {
        let ps = this.PhysicsScene;
        
        for (let i = 0; i < ps.objects.length; i++)
            ps.objects[i].squash();
        
        if (!ps.paused)
            run();        
    }

    onShowTets() {
        let ps = this.PhysicsScene;

        ps.showTetMesh = !ps.showTetMesh;
        for (let i = 0; i < ps.objects.length; i++)
            ps.objects[i].tetMesh.visible = ps.showTetMesh;
    }    
}

function registerWorld(newWorld) {
    gWorld = newWorld;

    gWorld.initThreeScene();
    gWorld.onWindowResize();
    gWorld.initPhysics();
    gWorld.initUI();
    
    gWorld.update();
}