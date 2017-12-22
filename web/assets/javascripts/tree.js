
/* MAIN */
const OpenTimestamps = require('javascript-opentimestamps');
const MerkleTree = OpenTimestamps.MerkleTree;

// Const blockHash = "000000000000000000e45bba92056fab483a3588e4936cc495831728969d749e";
// const blockHash = "000000000003ba27aa200b1cecaad478d2b00432346c3f1f3986da1afd33e506"; // 2 tx
// const blockHash = "0000000000010ac94a7f73848a32a33238e34162df6b4118e6e37fa2ae986e72"; // 3 tx
//const blockHash = "00000000000237a048b03b9faa713cf3d95d25c76f82f8083a1267ee12d74ae9"; // 4 tx
// const blockHash = '000000000000b0b8b4e8105d62300d63c8ec1a1df0af1c2cdbd943b156a8cd79'; // 6 tx
// const blockHash = "00000000000475b5f4f382fe7468e8f2b02e91fb715ac8ed58472ef16d85ffba"; // 8 tx
//const blockHash = "00000000000080b66c911bd5ba14a74260057311eaeb1982802f7010f1a9f090"; // 12 tx
//const blockHash = '000000000000000000e45bba92056fab483a3588e4936cc495831728969d749e';

var merkleRoots;
var maxDepth;
var blockHash;

function search(){
    console.log("search");
    blockHash = $("#blockHash").val();
    MerkleTree.tree(blockHash).then( (roots)=>{
        maxDepth = Math.ceil(Math.log(roots.length) / Math.log(2));
        merkleRoots = roots;
        $("#merkleRoot").html("Merkle tree from "+toHexString(getMerkleRoot(merkleRoots[0])));
        regenerate(roots, maxDepth, true);
    }).catch(err => {
        console.log("err "+err);
    });
}

function getMerkleRoot(merkleRoot){
    if ( merkleRoot.ops === undefined || merkleRoot.ops.size == 0) {
        return merkleRoot.msg;
    }
    return getMerkleRoot(merkleRoot.ops.values().next().value)
}

function refresh(){
    console.log("refresh");
    regenerate(merkleRoots, maxDepth, false);
}

function toHexString(byteArray) {
    return Array.from(byteArray, function(byte) {
        return ('0' + (byte & 0xFF).toString(16)).slice(-2);
    }).join('')
}

// set default init
var enableRefresh=true;
function init(){
    $("#blockHash").val('000000000000000000e45bba92056fab483a3588e4936cc495831728969d749e');
    search();
    //setInterval(function(){ if(enableRefresh){refresh();} }, 1000);
    $("#chart").mouseenter(function(){
        enableRefresh = false;
    }).mouseleave(function(){
        enableRefresh = true;
    });
}

// document ready
$( document ).ready(function() {
    init();
});

// print merkle receipt
function printing(branch) {
    clearing();
    var obj = branch.stamp.toJson();
    print(obj);
}

function clearing(){
    $("#table").empty();
}






/*
* OPENTIMESTAMPS INFO PAGE
* */
/*
const ots = getParameterByName('ots');
var bytes=[];

if(ots) {
    bytes = ots;
} else {
}
var jsonString = OpenTimestamps.json(hex2ascii(bytes));
var obj = JSON.parse(jsonString);

$("#hash").html(obj.hash);
if(obj.result=="KO"){
    $("#error").html(obj.error);
}

$("#digest").html(obj.hash);
$("#type").html(obj.op);
$("#title_digest").html(obj.hash.substring(0, 12));
$("#download").click(function(){
    download('Timestamp.ots', new Uint8Array( hexToBytes(bytes) ));
});*/

function hexToBytes (hex) {
    const bytes = [];
    for (var c = 0; c < hex.length; c += 2) {
        bytes.push(parseInt(hex.substr(c, 2), 16));
    }
    return bytes;
};


function print(timestamp){

    var container = $("#table");


    if(timestamp.attestations !== undefined ){
        timestamp.attestations.forEach(function(item){
            var div = printAttestation(item,item.fork);
            $(container).append(div);
            if(item.merkle !== undefined){
                div = printMerkle(item.merkle,item.fork);
                $(container).append(div);
            }
        });
    }


    if(timestamp.tx !== undefined ) {
        var div = printTx(timestamp.tx,timestamp.ops[0].fork);
        $(container).append(div);
    }

    if(timestamp.ops === undefined ){
        return;
    }

    if(timestamp.ops.length > 1){
        var subdiv = printFork(timestamp.fork,timestamp.ops.length);
        $(container).append(subdiv);

        var div = document.createElement('div');
        $(div).addClass("table-i");
        $(div).append("<div class='table'></div>");
        $(div).appendTo(container);
        container=$(div).find('div');

    }

    if(timestamp.ops.length > 0){
        timestamp.ops.forEach(function(item){
            var div = printTimestamp(item.op,item.arg,item.result,item.fork);
            $(container).append(div);
            print(item.timestamp);
        });
    }

}


function printAttestation (item,fork){
    var div = document.createElement('div');
    $(div).addClass("table-i");

    var title="Attestation";
    var color="grey";
    var content = "";
    if(item.type == "BitcoinBlockHeaderAttestation"){
        title = "Bitcoin Attestation";
        content = 'Merkle root of Bitcoin block ' +
            '<strong class="hash" style="display: inline;">'+item.param+'</strong>' +
            '<a class="copy"></a>' +
            //'<p>'+item.merkle+'</p>'+
            '</div>';
        color="green";
    } else if(item.type == "EthereumBlockHeaderAttestation"){
        title = "Ethereum Attestation";
        content = 'Merkle root of Ethereum block ' +
            '<strong class="hash" style="display: inline;">'+item.param+'</strong>' +
            '<a class="copy"></a>' +
            //'<p>'+item.merkle+'</p>'+
            '</div>';
        color="gold";
    } else if(item.type == "PendingAttestation"){
        title = "Pending Attestation";
        content = "Pending attestation: server "+"<a href=''>"+item.param+"</a>";
        color="gold";
    } else if(item.type == "UnknownAttestation"){
        title = "Unknown attestation";
        content = "Unknown Attestation: payload "+"<a href=''>"+item.param+"</a>";
        color="grey"
    }

    var first = document.createElement('div');
    $(first).addClass("table-name "+color);
    $(first).html(title);
    $(first).appendTo(div);

    var second = document.createElement('div');
    $(second).addClass("table-value table-value_copy");
    $(second).append(content);
    $(second).appendTo(div);

    return div;
}

function printMerkle (merkle,fork){
    var div = document.createElement('div');
    $(div).addClass("table-i");

    var title="Merkle Root";
    var content=merkle;
    var color="purple";

    var first = document.createElement('div');
    $(first).addClass("table-name "+color);
    $(first).html(title);
    $(first).appendTo(div);

    var second = document.createElement('div');
    $(second).addClass("table-value table-value_copy");
    $(second).append('<div class="badge"></div>');
    if(fork>0) {
        $(second).find(".badge").append('<p class="step">'+fork+'</p>');
    }
    $(second).find(".badge").append('<p class="hash">'+content+'</p>');
    $(second).find(".badge").append('<a class="copy"></a>');
    $(second).appendTo(div);

    return div;
}


function printTx (tx,fork){
    var div = document.createElement('div');
    $(div).addClass("table-i");

    var title="Parse TX";
    var content=tx;
    var color="purple";

    var first = document.createElement('div');
    $(first).addClass("table-name "+color);
    $(first).html(title);
    $(first).appendTo(div);

    var second = document.createElement('div');
    $(second).addClass("table-value table-value_copy");
    $(second).append('<p>Bitcoin transaction</p>');
    $(second).append('<div class="badge"></div>');

    if(fork>0) {
        $(second).find(".badge").append('<p class="step">'+fork+'</p>');
    }
    $(second).find(".badge").append('<p class="hash">'+content+'</p>');
    $(second).find(".badge").append('<a class="copy"></a>');
    $(second).appendTo(div);

    return div;
}

function printFork (fork,totfork){
    var div = document.createElement('div');
    $(div).addClass("table-i");

    var title="Fork";
    var content="Fork in " + totfork + " paths";
    var color="blue";

    var first = document.createElement('div');
    $(first).addClass("table-name "+color);
    $(first).html(title);
    $(first).appendTo(div);


    var second = document.createElement('div');
    $(second).addClass("table-value");
    if(fork>0) {
        $(second).append('<p class="step">'+fork+'</p>');
    }
    $(second).append('<p class="">'+content+'</p>');
    $(second).appendTo(div);

    return div;
}

function printTimestamp (op,arg,result,fork){
    var div = document.createElement('div');
    $(div).addClass("table-i");

    var content = result;
    if(arg.length>0){
        var start = content.indexOf(arg);
        var end = start+arg.length;
        content = result.substring(0, start)+"<span class='green'>"+arg+"</span>"+result.substring(end, result.length)
    }
    var title = op+"("+((arg.length>0)?arg.substring(0, 6)+'...':'')+")";
    var color="purple";

    var first = document.createElement('div');
    $(first).addClass("table-name ");
    $(first).html(title);
    $(first).appendTo(div);

    var second = document.createElement('div');
    $(second).addClass("table-value");
    $(second).append('<div class="badge"></div>');
    if(fork>0) {
        $(second).find(".badge").append('<p class="step">'+fork+'</p>');
    }
    $(second).find(".badge").append('<p class="hash">'+content+'</p>');
    $(second).appendTo(div);

    return div;
}

// get parameters
function getParameterByName(name, url) {
    if (!url) {
        url = window.location.href;
    }
    name = name.replace(/[\[\]]/g, "\\$&");
    var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, " "));
}

function hex2ascii(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
function ascii2hex(str) {
    var arr = [];
    for (var i = 0, l = str.length; i < l; i ++) {
        var hex = Number(str.charCodeAt(i)).toString(16);
        arr.push(hex);
    }
    return arr.join('');
}

// Download file
function download(filename, text) {
    var blob = new Blob([text], {type: "octet/stream"});
    saveAs(blob,  filename + '.ots');
}

var clipboard = new Clipboard('.copy', {
    text: function(event) {
        var text = $(event).parent().find(".hash").html();
        console.log(text);

        $(".clipboard-copy")
          .css('display','block')
          .find('.badge-copy .hash')
          .html(text);

        setTimeout(function(){
          $(".clipboard-copy").css('display','none');
        },3000)

        return text;
    }
});
