"use strict";

const nt_ZWBR = '\u200B';

/***

struct for focus
 
***/
class SelectionInfo {
    constructor(focusNode_, focusOffset_, anchorNode_ = focusNode_, anchorOffset_ = focusOffset_) {
        this.focusNode = focusNode_;
        this.focusOffset = focusOffset_;
        this.anchorNode = anchorNode_;
        this.anchorOffset = anchorOffset_;
    }

}

/***

struct for dom operation

***/
class OperationInfo {
    constructor(update_type, data_, parent_, offset_, length_) {
        this.updateType = update_type;
        this.data = data_;
        this.parent = parent_;
        this.offset = offset_;
        this.length = length_;
        this.is_connect_to_past = false;
        this.is_connect_to_future = false;
    }
}

/***
struct for undo/redo history
***/
class History {
    constructor(selection_before, operation_begin) {
        this.selectionBefore = selection_before;
        this.selectionAfter = null;
        this.operationBegin = operation_begin;
        this.operationEnd = operation_begin;
    }
}


var UR_TYPE = {
    NONE: 0,
    INSERT_TEXT_INTO_TEXT: 1,
    DELETE_IN_TEXT: 101,
    
    DIVIDE_TEXT_NODE: 202,
    ADD_NODE: 1001,
    ADD_TEXT_NODE: 1002,    
    ADD_MATH_NODE: 1007,

    REMOVE_NODE: 2001,
    COMBINE_TEXT_NODE: 3002,

    REMOVE_NODE_LIST: 3004,
    ADD_NODE_LIST: 3005,
};

class UndoManager {
    constructor() {
        this.name = "undo_manager";
        this.operations = [];
        this.history = [];
        this.index_history = 0;
        this.index_operation = 0;
        this.acceptable = false;
        this.begin_selection = null; /* focus state when begin is called */
        this.begin_index_ope = 0;
        this.event_dispatcher = null;   /* changing event is dispatched when the first change to show file is updateed or not*/        
    }

    get numHistory() {
        return this.history.length;
    }

    Begin(focusNode_, focusOffset_, anchorNode_ = focusNode_, anchorOffset_ = focusOffset_) {
        
        if (this.acceptable) {
            alert("ERROR: invalid Undo registration");
            
        }

        this.Shrink();


        this.begin_selection = new SelectionInfo(focusNode_, focusOffset_, anchorNode_, anchorOffset_);
        this.begin_index_ope = this.index_operation;

        if(this.operations.length > this.index_operation){
            this.operations.splice(this.index_operation);
        }

        this.acceptable = true;
    }

    End(focusNode_, focusOffset_, anchorNode_ = focusNode_, anchorOffset_ = focusOffset_) {

        if(this.begin_index_ope < this.index_operation){
            let hist = new History(this.begin_selection, this.begin_index_ope);
            hist.selectionAfter = new SelectionInfo(focusNode_, focusOffset_, anchorNode_, anchorOffset_);
            hist.operationEnd = this.index_operation;
            this.history.push(hist);
            this.index_history++;
        }
        this.acceptable = false;

        if (this.event_dispatcher){
            this.event_dispatcher.Dispatch();
        }
    }


    /*
    Continue(){
        if (this.acceptable) {
            alert("ERROR: invalid Undo continue");            
        }
        const hist = GetUndo();
        
        this.begin_selection = hist.selectionBefore;
        this.begin_index_ope = hist.operationBegin;

        this.acceptable = true;

    }
    */

    Cancel() {
        if (this.acceptable) {
            this.index_operation = this.begin_index_ope;
            this.acceptable = false;
        }
    }

    Shrink() {
        if(this.acceptable === false){
            if (this.history.length > this.index_history) {
                this.index_operation = this.history[this.index_history].operationBegin;
                this.operations.splice(this.index_operation);
                this.history.splice(this.index_history);
                console.log("shurink: ",this.history.length);
            }
        }
    }

    Register(ur_type, data, parent, offset, length) {
        if (!this.acceptable) { alert("ERROR: Undo Manager: call Begin before calling Register!");}

        this.operations.push(new OperationInfo(ur_type, data, parent, offset, length));
        this.index_operation++;
    }

    GetUndo() {
        if (this.index_history === 0) { return null; }
        this.index_history--;
        const hist = this.history[this.index_history];
        this.operation_begin = hist.operationBegin;
        return hist;
    }
    GetRedo() {
        if (this.index_history === this.history.length) { return null; }
        const hist = this.history[this.index_history];
        this.index_history++;
        this.operation_begin = hist.operationEnd;
        return hist;
    }
    GetOperation(index_ope) {
        return this.operations[index_ope];
    }

    SetChangeEventDispatcher(event_dispatcher){
        this.event_dispatcher = event_dispatcher
    }
    
    GetChangeEventDispatcher(){
        return (this.event_dispatcher);
    }
}

class ChangeEventDispatcher {
    constructor(event_target) {
        this.event_target = event_target;   /* changing event is dispatched when the first change*/
        this.has_changed = false;   /* changing event is dispatched when the first change*/
        this.enable = true;
    }
    
    Reset(){
        this.has_changed = false;
    }
    Dispatch(){
        if(this.has_changed===false){
            if(this.event_target && this.enable){
                this.has_changed=true;
                this.event_target.dispatchEvent(new CustomEvent('nt_changed'));
            }
        }
    }
    Enable(){
        this.enable = true;
    }
    Disable(){
        this.enable = false;
    }
}

let undo_man = null;

function CreateSelectionInfo(selection) {
    return new SelectionInfo(selection.focusNode, selection.focusOffset, selection.anchorNode, selection.anchorOffset);
}

function CloneSelectionInfo(si) {
    return new SelectionInfo(si.focusNode, si.focusOffset, si.anchorNode, si.anchorOffset);
}

/*
If undo is succsess, return value is true.
*/
function ExecUndo() {
    let history = undo_man.GetUndo();
    if (!history) { return false;}
    for (let i = history.operationEnd - 1; i >= history.operationBegin; i--) {

        console.log("Undo: " + i + " ------------------ ");
        const ope = undo_man.GetOperation(i);

        switch (ope.updateType) {
            case UR_TYPE.INSERT_TEXT_INTO_TEXT:
                UndoInsertTextToText(ope);
                break;
            case UR_TYPE.ADD_TEXT_NODE:
                UndoAddTextNode(ope);
                break;
            case UR_TYPE.ADD_NODE:
            case UR_TYPE.ADD_MATH_NODE:
                UndoAddNode(ope);
                break;
            case UR_TYPE.DELETE_IN_TEXT:
                UndoDeleteText(ope);
                break;
            case UR_TYPE.DIVIDE_TEXT_NODE:
                UndoDivideTextNode(ope);
                break;
            case UR_TYPE.REMOVE_NODE:
                UndoRemoveNode(ope);
                break;
            case UR_TYPE.COMBINE_TEXT_NODE:
                UndoCombineTextNode(ope);
                break;
            case UR_TYPE.REMOVE_NODE_LIST:
                UndoRemoveNodeList(ope);
                break;
            case UR_TYPE.ADD_NODE_LIST:
                UndoAddNodeList(ope);
                break;

        }
        
    }

    if(history.selectionBefore.focusOffset == NT_SELECT_CELL_MODE){
        SetSelectTable(history.selectionBefore.anchorNode, history.selectionBefore.focusNode);
    }else if((history.selectionBefore.focusNode === history.selectionBefore.anchorNode) &&
        (history.selectionBefore.focusOffset === history.selectionBefore.anchorOffset)){
        document.getSelection().collapse(history.selectionBefore.focusNode, history.selectionBefore.focusOffset);
    }else{
        document.getSelection().setBaseAndExtent(
            history.selectionBefore.anchorNode, history.selectionBefore.anchorOffset,
            history.selectionBefore.focusNode, history.selectionBefore.focusOffset);        
    }
    CheckEditPreview(null, true);
    undo_man.GetChangeEventDispatcher().Dispatch();
    return true;
}

/*
If redo is succsess, return value is true.
*/
function ExecRedo() {
    let history = undo_man.GetRedo();
    if (!history) { return false; }
    for (let i = history.operationBegin; i < history.operationEnd; i++) {

        console.log("Redo: " + i + " ------------------ ");
        const ope = undo_man.GetOperation(i);

        switch (ope.updateType) {
            case UR_TYPE.INSERT_TEXT_INTO_TEXT:
                RedoInsertTextToText(ope);
                break;
            case UR_TYPE.ADD_TEXT_NODE:
                RedoAddTextNode(ope);
                break;
            case UR_TYPE.ADD_NODE:
            case UR_TYPE.ADD_MATH_NODE:
                RedoAddNode(ope);
                break;
            case UR_TYPE.DELETE_IN_TEXT:
                RedoDeleteText(ope);
                break;
            case UR_TYPE.DIVIDE_TEXT_NODE:
                RedoDivideTextNode(ope);
                break;
            case UR_TYPE.REMOVE_NODE:
                RedoRemoveNode(ope);
                break;
            case UR_TYPE.COMBINE_TEXT_NODE:
                RedoCombineTextNode(ope);
                break;
            case UR_TYPE.REMOVE_NODE_LIST:
                RedoRemoveNodeList(ope);
                break;
            case UR_TYPE.ADD_NODE_LIST:
                RedoAddNodeList(ope);
                break;
        }
        
    }

    
    if(history.selectionAfter.focusOffset == NT_SELECT_CELL_MODE){
        SetSelectTable(history.selectionAfter.anchorNode, history.selectionAfter.focusNode);
    }else if((history.selectionAfter.focusNode === history.selectionAfter.anchorNode) &&
        (history.selectionAfter.focusOffset === history.selectionAfter.anchorOffset)){
            document.getSelection().collapse(history.selectionAfter.focusNode, history.selectionAfter.focusOffset);
    }else{
        document.getSelection().setBaseAndExtent(
            history.selectionAfter.anchorNode, history.selectionAfter.anchorOffset,
            history.selectionAfter.focusNode, history.selectionAfter.focusOffset);
    }
    CheckEditPreview(null, true);
    undo_man.GetChangeEventDispatcher().Dispatch();
    return true;
}



function InsertTextIntoText(text, node, offset) {

    console.log("insert text into text");

    node.insertData(offset, text);

    //register undo/redo
    undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, text, node, offset, text.length);


}


function UndoInsertTextToText(operation_info) {

    let node = operation_info.parent;
    if (node.nodeType !== Node.TEXT_NODE) {
        alert("Undo: node is not text in UndoInsertTextToText");
    }

    node.deleteData(operation_info.offset, operation_info.length);
    
}

function RedoInsertTextToText(operation_info) {

    let node = operation_info.parent;
    if (node.nodeType !== Node.TEXT_NODE) {
        alert("Undo: node is not text in RedoInsertTextToText");
    }

    node.insertData(operation_info.offset, operation_info.data);

}



function DeleteText(node, offset, length = 1) {
    console.log("delete text", offset, length);

    if (node.length <= offset) {
        alert("node focus is invalid"); return null;
    }


    const text = node.data.slice(offset, offset + length);
    
    node.deleteData(offset, length);


    undo_man.Register(UR_TYPE.DELETE_IN_TEXT, text, node, offset, length);
    return text;
}

function UndoDeleteText(operation_info) {
    console.log("undo delete text");

    let node = operation_info.parent;
        
    node.insertData(operation_info.offset, operation_info.data);
    
}

function RedoDeleteText(operation_info) {
    console.log("redo delete text");
    
    let node = operation_info.parent;

    node.deleteData(operation_info.offset, operation_info.length);
    
}



/////////////////////////////////////////////////////////////////////////////////
function AddMathNode(mark, parent, ref_node) {
    
    const offset = GetIndex(parent, ref_node);
    
    let math = CreateMathNode(mark);
    if(math){

        parent.insertBefore(math, ref_node);

        undo_man.Register(UR_TYPE.ADD_MATH_NODE, math, parent, offset, 1);
        // here, the reference of later_text node must be kept by UndoManager. If the reference of later_text is not kept, the later_text is deleted when doing undo.
    }
    return math;
}

function CreateMathNode(mark) {
    switch(mark){
    case "$":
        {
            let math = document.createElement("SPAN");
            math.className = "math";
            
            math.insertAdjacentHTML('afterbegin', katex.renderToString("", { throwOnError: false }));
            math.insertAdjacentHTML('beforeend', "<span class='editmath'>$$</span>");

            return math;
        }
    case "$$":
        {
            let math = document.createElement("SPAN");
            math.className = "math";
            
            katexAutoNumber("", math, 0);
            math.insertAdjacentHTML('beforeend', "<span class='editmathdisp'>$$\n\n$$</span>");

            math.dataset.eqnumberBegin=0;
            math.dataset.eqnumberEnd=0;

            return math;
        }
    case "`":
        {
            let math = document.createElement("SPAN");
            math.className = "math";
            
            math.insertAdjacentHTML('afterbegin', "<span class='previewcode'>dummy</span>");
            math.insertAdjacentHTML('beforeend', "<span class='editcode'>``</span>");

            return math;
        }
    case "```":
        {
            const math = document.createElement("SPAN");
            math.className = "math";
            
            math.insertAdjacentHTML('afterbegin', "<span class='previewcodedisp'>dummy</span>");
            math.insertAdjacentHTML('beforeend', "<span class='editcodedisp'>```\n\n```</span>");

            return math;
        }
    case "*":
    case "_":
        {
            const math = document.createElement("SPAN");
            math.className = "math";
                
            math.insertAdjacentHTML('afterbegin', "<em>dummy</em>");
            math.insertAdjacentHTML('beforeend', "<span class='editem1'>"+mark+mark+"</span>");

            return math;
        }
    case "**":
    case "__":
        {
            const math = document.createElement("SPAN");
            math.className = "math";
                
            math.insertAdjacentHTML('afterbegin', "<strong>dummy</strong>");
            math.insertAdjacentHTML('beforeend', "<span class='editem2'>"+mark+mark+"</span>");

            return math;
        }
        
    case "***":
    case "___":
        {
            const math = document.createElement("SPAN");
            math.className = "math";
                
            math.insertAdjacentHTML('afterbegin', "<em><strong>dummy</strong></em>");
            math.insertAdjacentHTML('beforeend', "<span class='editem3'>"+mark+mark+"</span>");

            return math;
        }
    case "[":
        {
            const math = document.createElement("SPAN");
            math.className = "math";
                
            math.insertAdjacentHTML('afterbegin', '<a href="'+ NT_LINK_DEFAULT_URL + '" target="_blank" ref="noopener noreferrer">' + NT_LINK_DEFAULT_TEXT + '</a>');
            math.insertAdjacentHTML('beforeend', "<span class='edita'>["+ NT_LINK_DEFAULT_TEXT + "](" + NT_LINK_DEFAULT_URL + ")</span>");

            return math;
        }
    case "![":
        {
            const math = document.createElement("SPAN");
            math.className = "math";
                
            math.insertAdjacentHTML('afterbegin', '<img src="sample.jpg" alt="AltWord">');
            math.insertAdjacentHTML('beforeend', "<span class='editimg'>![AltwWord](image.png) </span>");

            return math;
        }
    case "[^":
        {
            const math = document.createElement("SPAN");
            math.className = "math";
                
            math.insertAdjacentHTML('afterbegin', "<a class='previewcite'>dummy</span>");
            math.insertAdjacentHTML('beforeend', "<span class='editcite'>[^] </span>");

            return math;
        }
    }
    return null;
}




function AddTextNode(text, parent, ref_node) {

    
    console.log("add text node");

    const offset = GetIndex(parent, ref_node);
    
    let text_node = document.createTextNode(text);
    parent.insertBefore(text_node, ref_node);


    //console.log("input: num_child=" + parent.childNodes.length);

    undo_man.Register(UR_TYPE.ADD_TEXT_NODE, text_node, parent, offset, 1);

    return text_node;
}

function UndoAddTextNode(operation_info) {

    
    console.log("undo add text node");

    let node = operation_info.data;
    node.remove();


}

function RedoAddTextNode(operation_info) {

    
    console.log("redo add text node");
    
    let parent = operation_info.parent;
    let text_node = operation_info.data;
    let ref_node = parent.childNodes.item(operation_info.offset);
    parent.insertBefore(text_node, ref_node);

}



function GetIndex(parent, child) {
    let ch = parent.firstChild;
    let index = 0;
    while (ch) {
        if (child === ch) {
            return index;
        }
        ch = ch.nextSibling;
        ++index;
    }
    return index;
}

function RemoveNode(node) {

    
    console.log("remove node");

    const offset = GetIndex(node.parentNode, node);
    const parent = node.parentNode;
   
    node.remove();
    
    undo_man.Register(UR_TYPE.REMOVE_NODE, node, parent, offset, 1);

    return node;
}


function UndoRemoveNode(operation_info) {

    
    console.log("undo remove node");

    let parent = operation_info.parent;
    parent.insertBefore(operation_info.data, parent.childNodes.item(operation_info.offset));

}

function RedoRemoveNode(operation_info) {

    
    console.log("redo remove node");


    let node = operation_info.data;
    
    node.remove();


}



function AddNode(tag_name, parent, ref_node) {

    
    console.log("add node: " + tag_name);

    let offset = GetIndex(parent, ref_node);
    
    let new_node = document.createElement(tag_name);
    
    parent.insertBefore(new_node, ref_node);
    
    undo_man.Register(UR_TYPE.ADD_NODE, new_node, parent, offset, 1);
    return new_node;

}

function UndoAddNode(operation_info) {

    
    console.log("undo add node");

    let node = operation_info.data;
    const parent = operation_info.parent;
    const offset = operation_info.offset;
    if(parent.childNodes.item(offset)!== node){
        if(parent.childNodes.item(offset).nodeName!==node.nodeName){
            alert("ERROR: added node does not exist!");
            return;
        }else{
            console.log("NOTINE: added node does not exist, but same type node is added already.");
            node = parent.childNodes.item(offset);
        }
    }
    node.remove();

}

function RedoAddNode(operation_info) {

    
    console.log("redo add node");

    let parent = operation_info.parent;
    let new_node = operation_info.data;
    let ref_node = parent.childNodes.item(operation_info.offset);
    parent.insertBefore(new_node, ref_node);

}



function DivideTextNode(node, offset) {
    console.log("divide text node");

    let new_node = node.splitText(offset);
    undo_man.Register(UR_TYPE.DIVIDE_TEXT_NODE, new_node, node, offset, new_node.length);
    return new_node;
}


function UndoDivideTextNode(operation_info) {
    console.log("undo divide text node");

    let node = operation_info.data;
    let org_node = operation_info.parent;
    org_node.appendData(node.data);    
    node.remove();

}

function RedoDivideTextNode(operation_info) {
    console.log("redo divide text node");

    let new_node = operation_info.data;
    let node = operation_info.parent;
    node.deleteData(operation_info.offset, operation_info.length);
    node.after(new_node);

}



function CombineTextNode(node) {
    console.log("combine text node");

    let next = node.nextSibling;

    const offset = node.length;
    node.appendData(next.data);
    next.remove();

    undo_man.Register(UR_TYPE.COMBINE_TEXT_NODE, next, node, offset, next.length);
}


function UndoCombineTextNode(operation_info) {
    console.log("undo combine text node");

    let node = operation_info.parent;
    let next = operation_info.data;

    node.deleteData(operation_info.offset, operation_info.length);
    node.after(next);


}

function RedoCombineTextNode(operation_info) {
    console.log("redo combine text node");

    let node = operation_info.parent;
    let next = operation_info.data;
    node.appendData(next.data);
    next.remove();

}



function RemoveNodeList(parent, start_node, end_node = null) {
    console.log("remove node list");

    let offset = GetIndex(parent, start_node);
    let fragment = new DocumentFragment();

    let pos = start_node;
    while (pos !== end_node) {
        let next = pos.nextSibling;
        pos.remove();
        fragment.appendChild(pos);
        pos = next;
    }
    
    
    undo_man.Register(UR_TYPE.REMOVE_NODE_LIST, fragment, parent, offset, fragment.childNodes.length);
    return fragment;
}

function UndoRemoveNodeList(operation_info) {
    console.log("undo remove node list");

    let fragment = operation_info.data;
    let parent = operation_info.parent;
    let offset = operation_info.offset;

    parent.insertBefore(fragment, parent.childNodes.item(offset));


}

function RedoRemoveNodeList(operation_info) {
    console.log("redo remove node list");

    let fragment = operation_info.data;
    let parent = operation_info.parent;
    let offset = operation_info.offset;
    let offset_end = offset + operation_info.length;
    const end_node = parent.childNodes.item(offset_end);

    let pos = parent.childNodes.item(offset);
    while (pos !== end_node) {
        let next = pos.nextSibling;
        pos.remove();
        fragment.appendChild(pos);
        pos = next;
    }
    
}


function AddNodeList(parent, ref_node, fragment) {
    console.log("add node list");
    const offset = GetIndex(parent, ref_node);
    const length = fragment.childNodes.length;
    const first = fragment.firstChild;
    parent.insertBefore(fragment, ref_node);

    undo_man.Register(UR_TYPE.ADD_NODE_LIST, fragment, parent, offset, length);
    return first;
}

function UndoAddNodeList(operation_info) {
    console.log("undo add node list");

    let fragment = operation_info.data;
    let parent = operation_info.parent;
    let offset = operation_info.offset;
    let offset_end = offset + operation_info.length;
    const end_node = parent.childNodes.item(offset_end);

    let pos = parent.childNodes.item(offset);
    while (pos !== end_node) {
        let next = pos.nextSibling;
        pos.remove();
        fragment.appendChild(pos);
        pos = next;
    }
    
}

function RedoAddNodeList(operation_info) {
    console.log("redo add node list");

    let fragment = operation_info.data;
    let parent = operation_info.parent;
    let offset = operation_info.offset;

    parent.insertBefore(fragment, parent.childNodes.item(offset));
    

}

/*
Check and repair the first and last child node, which must satisfy the following condition.
- If the first/last child node is math, ZWBR is added.
- If the first child and last child is null, BR tag is added.
- If the first child is null, BR tag is added.
- If the first child is OL/UL, BR tag is added.

*/
function RepairLastBr(node){
    if(node===null) return;
    if((node.nodeName === "OL") || (node.nodeName === "UL")){        
        let last = node.lastChild;
        if(last===null){
            let ref = AddNode("LI", node, null);
            AddNode("BR", ref, null);
        }
        return;
    }else{
        let last = node.lastChild;
        if(last===null){
            AddNode("BR", node, null);
            return;
        }
        if(last.nodeName === "BR") return; //nothing to do//
        
        if((last.nodeName !== "OL") && (last.nodeName !== "UL")){
            AddNode("BR", node, null);
            return;
        }

        if((node.firstChild.nodeName === "OL") || (node.firstChild.nodeName === "UL")){
            AddNode("BR", node, node.firstChild);
        }
        return;
    }
}

/*
Move and join a node list into the parent1.childNodes from parent2.childNodes//
After that, parent2.childNodes becomes empty.
"Safe" means that this function check and fix the following points.

(1)If both side of connection point are TEXT node, they are combined into a single node.
(2)If the charactor of connection point is ZWBR("\u200B"), this is removed.
(3)If the connection point is BR node and the BR is not required in combined node, the BR is removed
*/

function SafePushNodeList(parent1, parent2){
    const latter_first = parent2.firstChild;
    if(latter_first===null){
        return null;
    }

    const fragment = (parent2.nodeName=="#document-fragment") ? parent2 : RemoveNodeList(parent2, latter_first, null );
    AddNodeList(parent1, null, fragment);     //combine node//
    
    const focus = SafeJunctionPoint(parent1, latter_first);
    SafeTailPoint(parent1);
    return focus;
}

/*
Wrapper of SafePushNodeList
*/
function SafeCombineNode(parent1){
    if(parent1.nextSibling===null) return null;
    if(parent1.nextSibling.firstChild===null) return null;
    const fragment = RemoveNodeList(parent1.nextSibling, parent1.nextSibling.firstChild, null );
    RemoveNode(parent1.nextSibling);
    return SafePushNodeList(parent1, fragment);
}

/*
Check the adjacent nodes as follows:

(former = ref.previousSibling)
(latter = ref)

Initially, 
if former is ZWBR or BR tag, former = former.prev and remove the ZWBR or BR tag;
if latter is ZWBR of BR tag, latter = latter.next and remove the ZWBR or BR tag;
After that,
former will be TEXT, math, or null.
latter will be TEXT, math, OL, UL, FIGCAPTION, or null.

- If the both former and latter are null, insert BR tag.
- If the both former and latter are TEXT, combine them
- If the both former and latter are math, insert ZWBR.

- If the former is null and latter is math, insert ZWBR before latter
- If the former is null and latter is OL, UL, or FIGCAPTION, insert BR tag before latter
- If the former is math and latter is null, insert ZWBR after former
- If the former is math and latter is OL, UL, or FIGCAPTION, insert ZWBR after former
- If the former is OL, UL or FIGCAPTION and latter is same, combine childNodes//

*/
function SafeJunctionPoint(parent, ref){
    //const former_length_org = parent.childNodes.length;

    const is_BR_ZWBR = (node)=>{
        if(node){
            if(node.nodeName == "BR"){
                return true;            
            }else if(node.nodeType === Node.TEXT_NODE){
                if(node.data == nt_ZWBR){
                    return true;
                }
            }
        }
        return false;
    };

    let former = (ref) ? ref.previousSibling : parent.lastChild;
    if(is_BR_ZWBR(former)){
        const org = former;
        former = former.previousSibling;
        RemoveNode(org);
    }

    let latter = ref;
    if(is_BR_ZWBR(latter)){
        const org = latter;
        latter = latter.nextSibling;
        RemoveNode(org);
    }

    if(former === null){
        return SafeHeadPoint(parent);        
    }
    
    if(former.nodeName == "SPAN"){ //expect math//
        if(latter){
            if(latter.nodeType === Node.TEXT_NODE){
                return {node: latter, offset:0};
            }
        }

        const fnode = AddTextNode(nt_ZWBR, parent, latter);
        return {node: fnode, offset:0};
    }

    if((former.nodeName == "UL") || (former.nodeName == "OL")){
        if(latter){
            if(latter.nodeName == former.nodeName){
                const focus = {node: latter.firstChild, offset: 0};
                const fragment = RemoveNodeList(latter, latter.firstChild, null); //not to need safe operation because of LI operation//
                AddNodeList(former, null, fragment);//not to need safe operation because of LI operation//
                RemoveNode(latter);
                return focus;
            }
        }

        return {node: former.lastChild, offset: 0};
    }
    if(former.nodeName == "FIGCAPTION"){
        if(latter){
            if(latter.nodeName == former.nodeName ){
                const fragment = RemoveNodeList(latter, latter.firstChild, null); //not to need safe operation because this will be removed//
                const focus = SafePushNodeList(former, fragment);
                RemoveNode(latter);
                return focus;
            }
        }

        return {node: former.lastChild, offset: 0};
    }


    //here, former is TEXT//
    if(former.nodeType !== Node.TEXT_NODE){
        console.log("ERROR: unexpect adjacent node(2)", former.nodeName);
        
    }

    const foffset = former.length;

    if(latter){
        if(latter.nodeType === Node.TEXT_NODE){            
            CombineTextNode(former);
            return {node:former, offset:foffset};
        }
    }

    return {node:former, offset:foffset};
    

}

function SafeHeadPoint(parent){
    const head = parent.firstChild;
    
    if(head === null){
        if(parent.nodeName=="DIV"){
            const p = AddNode("P", parent, null);
            AddNode("BR", p, null);
            return {node: p, offset:0};
        }else{        
        AddNode("BR", parent, null);
        return {node: parent, offset:0};
        }
    }
    
    if(head.nodeName == "BR"){        
        if(head.nextSibling){
            if((head.nextSibling.nodeName != "OL") && (head.nextSibling.nodeName != "UL") && (head.nextSibling.nodeName != "FIGCAPTION")){
                RemoveNode(head);
            }
        }        
        return {node: parent, offset:0};
    }
    
    if(head.nodeName === "SPAN"){ //expect math//
        const fnode = AddTextNode(nt_ZWBR, parent, head);
        return {node: fnode, offset:0};
    }
    if((head.nodeName === "OL") || (head.nodeName === "UL") || (head.nodeName === "FIGCAPTION")) {
        AddNode("BR", parent, head);
        return {node: parent, offset:0};
    }
    if(head.nodeType == Node.TEXT_NODE){
        return {node: head, offset:0};
        
    }

    //here, tail is P, Table, and unexpect node//
    console.log("HINT: unexpect head node", head.nodeName);
    return SafeHeadPoint( head);
}


function SafeTailPoint(parent){
    const tail = parent.lastChild;
    
    if(tail === null){
        if(parent.nodeName=="DIV"){
            const p = AddNode("P", parent, null);
            AddNode("BR", p, null);
            return {node: p, offset:0};
        }else{
            AddNode("BR", parent, null);
            return {node: parent, offset:0};
        }
    }
    if(tail.nodeName == "BR"){
        if(tail.previousSibling){
            RemoveNode(tail);
            return SafeTailPoint(parent);
        }
        return {node: parent, offset:0};
    }
    if(tail.nodeName == "SPAN"){ //expect math//
        const fnode = AddTextNode(nt_ZWBR, parent, null);
        return {node: fnode, offset:0};
    }
    if((tail.nodeName == "OL") || (tail.nodeName == "UL")){
        return SafeTailPoint(tail.lastChild);
    }
    if(tail.nodeName === "FIGCAPTION"){
        return SafeTailPoint(tail);
    }
    if(tail.nodeType == Node.TEXT_NODE){
        return {node: tail, offset:tail.length};
    }

    //console.log("ERROR: unexpect adjacent node", tail.nodeName);
    
    //here, tail is P, Table, and unexpect node//
    console.log("HINT: unexpect tail node", tail.nodeName);
    return SafeTailPoint( tail);
}


function SafeRemoveNodeList(parent, start_node, end_node = null) {
    const fragment = RemoveNodeList(parent, start_node, end_node);
    SafeJunctionPoint(parent, end_node);
    return fragment;
}


/*
validation the math node in P, H1, Li, TD, TH, FIGCAPTION, and FIGURE.
Required conditions:
The adjacent nodes on both side of math mush be TEXT.
*/
function ValidateMathInParent(parent){
    let prev = null;
    let next = null;
    for(let node = parent.firstChild; node; node = next ){
        next = node.nextSibling;

        if(node.nodeName == "SPAN"){
            if(prev===null) return false;
            if(prev.nodeType !== Node.TEXT_NODE) return false;
            if(next===null) return false;
            if(next.nodeType !== Node.TEXT_NODE) return false;
        }

        prev = node;
    }   

    return true;
}

function AssertValidateMathInParent(parent){
    if(! ValidateMathInParent(parent)){
        alert("ERROR: invalid for the adjacent nodes of math", parent);
        ValidateMathInParent(parent);
        return false;
    }
    return true;
}

/*

*/
function IsTextNode(node){
    if(node) {
        if(node.nodeType === Node.TEXT_NODE){
            return true;
        }
    }
    return false;
}
