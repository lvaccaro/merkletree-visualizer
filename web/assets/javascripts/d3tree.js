/* D3 Tree */
/* Copyright 2013 Peter Cook (@prcweb); Licensed MIT */

// Tree configuration
var branches = [];
var seed = {i: 0, x: 420, y: 600, a: 0, l: 130, d:0}; // a = angle, l = length, d = depth
var da = 0.5; // Angle delta
var dl = 0.8; // Length delta (factor)
var ar = 0.7; // Randomness
var maxDepth = 0;


// Tree creation functions
function branch(b) {
    var end = endPt(b), daR, newB;

    branches.push(b);

    if (b.d === maxDepth)
        return;

    // Left branch
    daR = ar * Math.random() - ar * 0.5;
    newB = {
        i: branches.length,
        x: end.x,
        y: end.y,
        a: b.a - da + daR,
        l: b.l * dl,
        d: b.d + 1,
        parent: b.i
    };
    branch(newB);

    // Right branch
    daR = ar * Math.random() - ar * 0.5;
    newB = {
        i: branches.length,
        x: end.x,
        y: end.y,
        a: b.a + da + daR,
        l: b.l * dl,
        d: b.d + 1,
        parent: b.i
    };
    branch(newB);
}

function binding(merkleRoots, branches) {
    var count = 0;
    branches.forEach((b,i)=>{
        if (b.d == maxDepth) {
            if (count < merkleRoots.length){
                b.stamp = merkleRoots[count];
                count++;
            }
        }
    });
    //console.log('count',count);
}


function regenerate(merkleRoots, depth, initialise) {
    maxDepth = depth;
    branches = [];
    branch(seed);
    initialise ? create() : update();
    binding(merkleRoots, branches);
}

function endPt(b) {
    // Return endpoint of branch
    var x = b.x + b.l * Math.sin( b.a );
    var y = b.y - b.l * Math.cos( b.a );
    return {x: x, y: y};
}


// D3 functions
function x1(d) {return d.x;}
function y1(d) {return d.y;}
function x2(d) {return endPt(d).x;}
function y2(d) {return endPt(d).y;}
function highlightParents(d) {
    var colour = d3.event.type === 'mouseover' ? 'brown' : '#777';
    var depth = d.d;
    var branch = d;
    for(var i = 0; i <= depth; i++) {
        d3.select('#id-'+parseInt(d.i)).style('stroke', colour);
        d = branches[d.parent];
    }

    writeOTS(branch);
}
function writeOTS(branch){

    if (branch.d == maxDepth){
        // is a tips
        if (branch.stamp === undefined ){
            // incomplete
            incompletePath(branch);
            clearing();
        } else {
            // exist
            completePath(branch);
            printing(branch);
        }
    } else {
        // intermediate path
        clearing();
    }
}

function completePath(d) {
    console.log("incompletePath");
    var colour = d3.event.type === 'mouseover' ? 'green' : '#777';
    var depth = d.d;
    if (depth!=maxDepth)
        return;
    for(var i = 0; i <= depth; i++) {
        d3.select('#id-'+parseInt(d.i)).style('stroke', colour);
        d = branches[d.parent];
    }
}
function incompletePath(d) {
    console.log("incompletePath");
    var colour = d3.event.type === 'mouseover' ? 'red' : '#777';
    var depth = d.d;
    if (depth!=maxDepth)
        return;
    for(var i = 0; i <= depth; i++) {
        d3.select('#id-'+parseInt(d.i)).style('stroke', colour);
        d = branches[d.parent];
    }
}

function create() {
    d3.select('svg')
        .selectAll('line')
        .data(branches)
        .enter()
        .append('line')
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2)
        .style('stroke-width', function(d) {return parseInt(maxDepth + 1 - d.d) + 'px';})
        .attr('id', function(d) {return 'id-'+d.i;})
        .on('mouseover', highlightParents)
        .on('mouseout', highlightParents);
}

function update() {
    d3.select('svg')
        .selectAll('line')
        .data(branches)
        .transition()
        .attr('x1', x1)
        .attr('y1', y1)
        .attr('x2', x2)
        .attr('y2', y2);
}

//d3.selectAll('.regenerate')
//    .on('click', regenerate);
