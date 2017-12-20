#!/usr/bin/env node
'use strict';

/**
 *
 * @module Index
 * @author EternityWall
 * @license LPGL3
 */

// Dependencies
const fs = require('fs');
const Promise = require('promise');
const OpenTimestamps = require('javascript-opentimestamps');

// OpenTimestamps shortcuts
// const Timestamp = OpenTimestamps.Timestamp;
const Ops = OpenTimestamps.Ops;
// Const Utils = OpenTimestamps.Utils;
// Const Notary = OpenTimestamps.Notary;
const Context = OpenTimestamps.Context;
const DetachedTimestampFile = OpenTimestamps.DetachedTimestampFile;

// Local dependecies
const Tools = require('./tools.js');
const Insight = require('./insight.js');
const Merkle = require('./merkle.js');


// Const blockHash = "000000000000000000e45bba92056fab483a3588e4936cc495831728969d749e";
 const blockHash = "000000000003ba27aa200b1cecaad478d2b00432346c3f1f3986da1afd33e506"; // 2 tx
// const blockHash = "0000000000010ac94a7f73848a32a33238e34162df6b4118e6e37fa2ae986e72"; // 3 tx
// const blockHash = "00000000000237a048b03b9faa713cf3d95d25c76f82f8083a1267ee12d74ae9"; // 4 tx
// const blockHash = '000000000000b0b8b4e8105d62300d63c8ec1a1df0af1c2cdbd943b156a8cd79'; // 6 tx
// const blockHash = "00000000000475b5f4f382fe7468e8f2b02e91fb715ac8ed58472ef16d85ffba"; // 8 tx
//const blockHash = "00000000000080b66c911bd5ba14a74260057311eaeb1982802f7010f1a9f090"; // 12 tx
//const blockHash = '000000000000000000e45bba92056fab483a3588e4936cc495831728969d749e';



module.exports = {

    tree(blockHash) {
        return new Promise((resolve, reject) => {
            const url = 'https://search.bitaccess.co/insight-api';
            const insight = new Insight.Insight(url);
            insight.block(blockHash).then(function (block) {
                // Prepare digest tx list
                const merkleRoots = [];
                block.tx.forEach(function (hash) {
                    const bytes = Tools.hexToBytes(hash).reverse();
                    const digest = OpenTimestamps.DetachedTimestampFile.fromHash(new Ops.OpSHA256(), bytes);
                    merkleRoots.push(digest.timestamp);
                });

                // Build merkle tree
                const merkleTip = Merkle.makeMerkleTree(merkleRoots);
                const merkleRoot = Tools.hexToBytes(block.merkleroot).reverse();
                //console.log(Tools.bytesToHex(merkleRoot));
                if (!Tools.arrEq(merkleTip.msg, merkleRoot)) {
                    reject(String("Invalid merkle root"));
                }

                resolve(merkleRoots);
            }).catch(err => {reject(err);})
        });

    }
};

function multiConcat(row, length){
        var buffer = [];
    for (var i =0; i < length; i++){
        buffer.push(row[i]);
    }
    return buffer;
}

function treePrint(tree){
    tree.forEach(row => {
        console.log(row);
    });
}
function treeHas(tree,row){
    for (var i =0; i < tree.length; i++){
        if (tree[i] === row.join('.'))
            return true;
    }
    return false;
}

function treeAdd(tree,row){

}

function arrayRow(timestamp){
    const msg = Tools.bytesToHex(timestamp.msg);

    if (timestamp.ops.size === 0 ) {
        return [msg];
    }

    var stamp = timestamp.ops.values().next().value;
    return arrayRow(stamp).concat(msg);
}

