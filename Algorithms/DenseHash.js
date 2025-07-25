// DenseHash
class DenseHash {
    constructor(spacing, maxNumObjects) {
        // grid size
        this.spacing = spacing;
        // prefix sum array size
        this.tableSize = 2 * maxNumObjects;
        // prefix sum array: save prefix sum for cell count array to solve hash collision problem
        this.prefixSum = new Int32Array(this.tableSize + 1);
        // cell array for saving all cells continuous (for performance)
        this.cellArray = new Int32Array(maxNumObjects);
        // query cells' id
        this.queryIds = new Int32Array(maxNumObjects);
        // queryIds size
        this.querySize = 0;
    }

    // hash function
    // calc hash value using big prime number and ^ operation
    // xi/yi/zi: the grid index on each coordinates
    calcHash(xi, yi, zi) {
        let h = (xi * 92837111) ^ (yi * 689287499) ^ (zi * 283923481);	// fantasy function
        return Math.abs(h) % this.tableSize;
    }

    // calc grid index for current coordinates
    calcGridIndex(coord) {
        return Math.floor(coord / this.spacing);
    }

    // get hash value for current position
    hashPos(pos, nr) {
        return this.calcHash(
            this.calcGridIndex(pos[3 * nr]),
            this.calcGridIndex(pos[3 * nr + 1]),
            this.calcGridIndex(pos[3 * nr + 2]));
    }

    // update prefixSum/cellArray
    update(pos) {
        let numObjects = Math.min(pos.length / 3, this.cellArray.length);

        // determine cell sizes

        this.prefixSum.fill(0);
        this.cellArray.fill(0);

        for (let i = 0; i < numObjects; i++) {
            let h = this.hashPos(pos, i);
            this.prefixSum[h]++;
        }

        // determine cells starts

        let start = 0;
        for (let i = 0; i < this.tableSize; i++) {
            start += this.prefixSum[i];
            this.prefixSum[i] = start;
        }
        this.prefixSum[this.tableSize] = start;	// guard

        // fill in objects ids

        for (let i = 0; i < numObjects; i++) {
            let h = this.hashPos(pos, i);
            this.prefixSum[h]--;
            this.cellArray[this.prefixSum[h]] = i;
        }
    }

    // query the neighbouring 27 grids for next collision
    // save query cell's grid index into queryIds array
    query(pos, nr, maxDist) {
        let x0 = this.calcGridIndex(pos[3 * nr] - maxDist);
        let y0 = this.calcGridIndex(pos[3 * nr + 1] - maxDist);
        let z0 = this.calcGridIndex(pos[3 * nr + 2] - maxDist);

        let x1 = this.calcGridIndex(pos[3 * nr] + maxDist);
        let y1 = this.calcGridIndex(pos[3 * nr + 1] + maxDist);
        let z1 = this.calcGridIndex(pos[3 * nr + 2] + maxDist);

        this.querySize = 0;

        for (let xi = x0; xi <= x1; xi++) {
            for (let yi = y0; yi <= y1; yi++) {
                for (let zi = z0; zi <= z1; zi++) {
                    let h = this.calcHash(xi, yi, zi);
                    let start = this.prefixSum[h];
                    let end = this.prefixSum[h + 1];

                    for (let i = start; i < end; i++) {
                        this.queryIds[this.querySize] = this.cellArray[i];
                        this.querySize++;
                    }
                }
            }
        }
    }
}