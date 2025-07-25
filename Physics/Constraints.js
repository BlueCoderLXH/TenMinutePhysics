﻿
class Constraints {
    // temp buffer
    static temp = new Float32Array(4 * 3);
    
    // the indices order to calc gradient
    // the calc formula:
    // (volIdOrder[j][1] - volIdOrder[j][0]) × (volIdOrder[j][2] - volIdOrder[j][0])
    static volIdOrder = [[1,3,2], [0,2,3], [0,3,1], [0,1,2]];
    
    /**
     * handle edge constraint
     * 
     * constraint function:
     *                      Len - Len(rest)
     *                      
     * gradient:
     *          p0 - p1
     * 
     * @param pos the vertices position array
     * @param edgeLengths the edge length array
     * @param edgeIds edge's two vertices index in pos array
     * @param invMass the inverse mass value for each mass point
     * @param grads gradient array
     * @param compliance edge constraint compliance
     * @param dt delta simulation time (equal to delta tick time commonly)
     */
    static solveEdges(pos, edgeLengths, edgeIds, invMass, grads, compliance, dt) {
        let alpha = compliance / dt /dt;

        for (let i = 0; i < edgeLengths.length; i++) {
            let id0 = edgeIds[2 * i];
            let id1 = edgeIds[2 * i + 1];
            
            let w0 = invMass[id0];
            let w1 = invMass[id1];
            let w = w0 + w1;
            if (w === 0.0)
                continue;

            vecSetDiff(grads,0, pos,id0, pos,id1);
            let len = Math.sqrt(vecLengthSquared(grads,0));
            if (len === 0.0)
                continue;
            
            vecScale(grads,0, 1.0 / len);
            let restLen = edgeLengths[i];
            let C = len - restLen;
            let lambda = -C / (w + alpha);
            vecAdd(pos,id0, grads,0, lambda * w0);
            vecAdd(pos,id1, grads,0, -lambda * w1);
        }
    }
    
    /**
     * handle volume constraint
     * 
     * constraint function:
     *                      V - V(rest)
     * gradient:
     * gradient(p0) = (p3 - p1) × (p2 - p1)
     * gradient(p1) = (p2 - p0) × (p3 - p0)
     * gradient(p2) = (p3 - p0) × (p1 - p0)
     * gradient(p3) = (p1 - p0) × (p2 - p0)
     * 
     * @param pos the vertices position array
     * @param tetIds the tetrahedron vertices index array
     * @param grads gradient array
     * @param invMass the inverse mass value for each mass point
     * @param restVols last volume array for all tetrahedrons
     * @param compliance edge constraint compliance
     * @param dt delta simulation time (equal to delta tick time commonly)
     */
    static solveVolumes(pos, tetIds, grads, invMass, restVols, compliance, dt) {
        let tempArr = Constraints.temp;
        let alpha = compliance / dt /dt;
        let numTets = tetIds.length / 4;

        for (let i = 0; i < numTets; i++) {
            let w = 0.0;

            for (let j = 0; j < 4; j++) {
                // calc gradient for vertices of tetrahedron
                let id0 = tetIds[4 * i + Constraints.volIdOrder[j][0]];
                let id1 = tetIds[4 * i + Constraints.volIdOrder[j][1]];
                let id2 = tetIds[4 * i + Constraints.volIdOrder[j][2]];

                vecSetDiff(tempArr,0, pos,id1, pos,id0);
                vecSetDiff(tempArr,1, pos,id2, pos,id0);
                vecSetCross(grads,j, tempArr,0, tempArr,1);
                // vecScale(this.grads,j, 1.0/6.0);

                w += invMass[tetIds[4 * i + j]] * vecLengthSquared(grads,j);
            }

            if (w === 0.0)
                continue;

            let vol = Constraints.getTetVolume(pos, tetIds, i);
            let restVol = restVols[i];
            let C = vol - restVol;
            let lambda = -C / (w + alpha);

            for (let j = 0; j < 4; j++) {
                let id = tetIds[4 * i + j];
                vecAdd(pos,id, grads,j, lambda * invMass[id]);
            }
        }
    }
    
    /**
     * calc the volume of tetrahedron
     * V = 1/6 * [ [(pos[2] - pos[0]) × (pos[1] - pos[0])] · (pos[3] - pos[0]) ]
     * V: the volume of tetrahedron
     * ×: cross product
     * ·: dot product
     */
    static getTetVolume(pos, tetIds, nr) {
        let tempArr = Constraints.temp;

        let id0 = tetIds[4 * nr];
        let id1 = tetIds[4 * nr + 1];
        let id2 = tetIds[4 * nr + 2];
        let id3 = tetIds[4 * nr + 3];
        
        vecSetDiff(tempArr,0,  pos,id1,  pos,id0);
        vecSetDiff(tempArr,1,  pos,id2,  pos,id0);
        vecSetDiff(tempArr,2,  pos,id3,  pos,id0);
        
        vecSetCross(tempArr,3, tempArr,0, tempArr,1);
        return vecDot(tempArr,3, tempArr,2) / 6.0;
    }    
}