class PhysicsObject
{
    constructor() {
        this.numParticles = 0;
    }
    
    // XPBD simulation
    simulate(dt, gravity) {
        this.preSolve(dt, gravity);
        this.solve(dt, gravity);
        this.postSolve(dt, gravity);
    }

    preSolve(dt, gravity) {

    }

    solve(dt, gravity) {

    }

    postSolve(dt, gravity) {

    }
}

class PhysicsObjectGrabable extends PhysicsObject
{
    static Index_None = -1;
    
    constructor() {
        super();
        
        this.grabId = PhysicsObjectGrabable.Index_None;
        this.grabInvMass = 0.0;        
    }
    
    startGrab(pos) {
        let p = [pos.x, pos.y, pos.z];
        let minD2 = Number.MAX_VALUE;
        this.grabId = -1;
        for (let i = 0; i < this.numParticles; i++) {
            let d2 = vecDistSquared(p,0, this.pos,i);
            if (d2 < minD2) {
                minD2 = d2;
                this.grabId = i;
            }
        }

        if (this.grabId >= 0) {
            this.grabInvMass = this.invMass[this.grabId];
            this.invMass[this.grabId] = 0.0;
            vecCopy(this.pos,this.grabId, p,0);
        }
    }

    moveGrabbed(pos, vel) {
        if (this.grabId >= 0) {
            let p = [pos.x, pos.y, pos.z];
            vecCopy(this.pos,this.grabId, p,0);
        }
    }

    endGrab(pos, vel) {
        if (this.grabId >= 0) {
            this.invMass[this.grabId] = this.grabInvMass;
            let v = [vel.x, vel.y, vel.z];
            vecCopy(this.vel,this.grabId, v,0);
        }
        this.grabId = PhysicsObjectGrabable.Index_None;
    }
}