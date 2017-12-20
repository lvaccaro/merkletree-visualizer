'use strict';

/**
 * Merkle module.
 * @module Utils
 * @author EternityWall
 * @license LPGL3
 */

// Dependencies
const crypto = require('crypto');
const OpenTimestamps = require('javascript-opentimestamps');
const Insight = require('./insight.js');
const Tools = require('./tools.js');

// OpenTimestamps shortcuts
const Timestamp = OpenTimestamps.Timestamp;
const Ops = OpenTimestamps.Ops;
const Utils = OpenTimestamps.Utils;
const Notary = OpenTimestamps.Notary;


exports.makeMerkleTree = function (timestamps) {
  let stamps = timestamps;
  let prevStamp;

  for (;;) {
    stamps = stamps[Symbol.iterator]();
    prevStamp = stamps.next().value;

    const nextStamps = [];
    for (const stamp of stamps) {
      if (prevStamp === undefined) {
        prevStamp = stamp;
      } else {
        nextStamps.push(this.catSha256d(prevStamp, stamp));
        prevStamp = undefined;
      }
    }

    if (nextStamps.length === 0) {
      return prevStamp;
    }
    if (prevStamp !== undefined) {
      nextStamps.push(this.catSha256d(prevStamp, prevStamp));
    }
    stamps = nextStamps;
  }
};

exports.catThenUnaryOp = function (UnaryOpCls, left, right) {
  if (!(left instanceof Timestamp)) {
    left = new Timestamp(left);
  }
  if (!(right instanceof Timestamp)) {
    right = new Timestamp(right);
  }

  const opAppend = new Ops.OpAppend(right.msg);
  const opPrepend = new Ops.OpPrepend(left.msg);

  left.add(opAppend);
  const rightPrependStamp = right.add(opPrepend);

    // Left and right should produce the same thing, so we can set the timestamp
    // of the left to the right
    // left.ops[OpAppend(right.msg)] = right_prepend_stamp
  left.ops.forEach((subStamp, subOp) => {
    if (Utils.arrEq(opAppend.arg, subOp.arg)) {
      subStamp.msg = rightPrependStamp.msg;
      subStamp.ops = rightPrependStamp.ops;
      subStamp.attestations = rightPrependStamp.attestations;
    }
  });

  if (Utils.arrEq(right.msg, left.msg)) {
    right.ops.delete(opPrepend);
  }

    // Return right_prepend_stamp.ops.add(unaryOpCls())
  const res = rightPrependStamp.add(new Ops.OpSHA256());
  return res;
};

exports.catSha256 = function (left, right) {
  return this.catThenUnaryOp(Ops.OpSHA256, left, right);
};

exports.catSha256d = function (left, right) {
  const sha256Timestamp = this.catSha256(left, right);
  return sha256Timestamp.add(new Ops.OpSHA256());
};

// Proof functions
exports.calculateMerkleRoot = function (targetHash, proof) {
  let left;
  let right;
  let prev = targetHash;

  for (let i = 0; i < proof.length; i++) {
    const item = proof[i];
    if (item.left !== undefined) {
      left = item.left;
      right = prev;
    } else if (item.right !== undefined) {
      left = prev;
      right = item.right;
    }
    const result = crypto.createHash('sha256').update(Tools.hexToString(left)).update(Tools.hexToString(right)).digest('hex');
    prev = result;
  }
  return prev;
};
