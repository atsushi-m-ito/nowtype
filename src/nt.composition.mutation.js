"use strict";

        
let MO_IME_node_origin = null;
let MO_IME_offset_origin = 0;

let MO_update_list = [];
let MO_observer = null;
let MO_in_composition = false;
let MO_highlight = null;
let MO_update_parents = null;

function MO_InitComposition(master_node){
    console.log("MutationObserver Create");
    MO_observer = new MutationObserver(MO_OnCompositionChange);
    MO_observer.observe(master_node,{childList:true, characterData:true, characterDataOldValue:true, subtree:true});    
    
}

function MO_OnCompositionChange(record_list){
    

    if((MO_in_composition) || (MO_update_list.length > 0)){  // Here, (MO_update_list.length > 0) is for Chrome below //

        record_list.forEach((record) => {
            if(record.type==="characterData"){
                let new_target_update = true;
                if(MO_update_list.length > 0){
                    const last = MO_update_list[MO_update_list.length-1];
                    if((last.record.type == record.type) && (last.record.target === record.target)){
                        new_target_update = false;

                        const old_for_log = last.record.oldValue;
                        const new_for_log = last.record.target;
                        console.log("MutationObserver detect (not new):",last.record.type,"\n", old_for_log,"(",old_for_log.length,")", "\nto\n", new_for_log);
                    }
                }
                if(new_target_update){
                    const offset = GetIndex(record.target.parentNode, record.target);
                    MO_update_list.push({record:record, offset:offset});
                    const old_for_log = record.oldValue;
                    const new_for_log = record.target;                        
                    console.log("MutationObserver detect:",record.type,"\n", old_for_log,"(",old_for_log.length,")", "\nto\n", new_for_log);
            
                    //for highlight: parent is memorized for both add and remove//                    
                    const parent = record.target.parentNode;
                    MO_update_parents.add((parent.nodeName=="MARK")?parent.parentNode:parent);
                    
                    
                }
            }else if(record.type==="childList"){
                if(record.addedNodes.length>0){
                    const offset = (record.previousSibling === null) ? 0 : (GetIndex(record.target, record.previousSibling) + 1);
                    MO_update_list.push({record:record, offset: offset});
                    console.log("MutationObserver detect: add\n", 
                        record.addedNodes.item(0), "\non offset=",offset,"\n", record.target);
                    
                }else{
                    //const offset = GetIndex(record.target, record.nextSibling);
                    const offset = (record.previousSibling === null) ? 0 : (GetIndex(record.target, record.previousSibling) + 1);
                    MO_update_list.push({record:record, offset: offset});
                    console.log("MutationObserver detect: remove\n", 
                        record.removedNodes.item(0), "\non offset=",offset,"\n", record.target);
                }

                //for highlight: parent is memorized for both add and remove//                    
                MO_update_parents.add((record.nodeName=="MARK")?record.parentNode:record);
                
            }
            
        });
    }

    //for Chrome (rollback when the last MutationObserver occurs just after compositionend by Delete/Bakspace key)//
    if((!MO_in_composition) && (MO_update_list.length > 0)){ 
        undo_man.GetChangeEventDispatcher().Disable();
        const num_undo_history = undo_man.numHistory;
        MO_RegisterIMEUpdate();
        //undo because DOM is broken by Chrome bug//
        if(IsHighlightMode()){
            NT_HighlightClear();
        }
        
        /////////////////////////////////////////////////
        //This is force rollback for IME canncel by delete/backspace key in Chromium.
        //Example of bug is as follows:
        // In the case that $math$ span node and text node adjoints,
        // the IME input start between the $math$ span and text_node (example: the position of "|" in "$f(x)$|ABCD")
        // and cancel all charactors by backspace key before putting enter key.
        // Then, the original text "ABCD" is also removed and it inserted in the math span.
        //Here, the comparison of numHistory is to check actual update of DOM.
        //In anycas, the DOM is not actually update by IME cancel,
        //and the rollback of DOM without update is the next bug.
        if( undo_man.numHistory != num_undo_history){
            ExecUndo();
            undo_man.Shrink();
        }
        ///////////////////////////////////////////
        
        undo_man.GetChangeEventDispatcher().Enable();
    }
}

function MO_OnCompositionstart(event){
    MO_in_composition = true;
    console.log("compositionstart: \"", event.data, "\"");
    MO_update_list.length = 0;//clear//
    MO_highlight = nt_highlight;
    MO_update_parents = new Set();

    //br is automatically removed by IME input.//
    //then original br is kept before input IME//
    const selection = document.getSelection();
    if(selection.rangeCount === 0){event.currentTarget.blur();return false;}
   
    
    const range = selection.getRangeAt(0);    
    let focus_node = range.startContainer;
    let focus_offset = range.startOffset;
    let anchor_node = range.endContainer;
    let anchor_offset = range.endOffset;
    
    if(focus_node.nodeType!==Node.TEXT_NODE){
        console.log("focus(before refine): ", focus_node,  focus_offset); 
        [focus_node, focus_offset] = RefineFocusToText(focus_node, focus_offset);
    }
    if(anchor_node.nodeType!==Node.TEXT_NODE){
        [anchor_node, anchor_offset] = RefineFocusToText(anchor_node, anchor_offset);
    }
    
    MO_IME_node_origin= focus_node;
    MO_IME_offset_origin = focus_offset;
  
        
    console.log("focus: ", focus_node,  focus_offset); 
    if((focus_node!==anchor_node) || (focus_offset !== anchor_offset )){
        console.log("anchor: ", anchor_node,  anchor_offset);
    }

    

    if(!selection.isCollapsed){// not colappsed
        let will_canceled = (anchor_node !== focus_node);
        
        if(anchor_node !== focus_node){
            
            const [fnode, foffset] = CorrectFocusToText(focus_node, focus_offset);
            selection.collapse(fnode, foffset);   
            console.log("colapse before IME:", fnode, foffset);
            will_canceled = false;
        }

        //If browser is Legacy Edge, de_selection should be false// 
        
        
        if(will_canceled){
            console.log("Cancel IME")
           
            //cancel IME input//            
            event.preventDefault();
            //event.stopImmediatePropagation();
            event.currentTarget.blur();
            selection.removeAllRanges();
            //alert("IME is cancelled to avoid bug"); 
            //!!!!This alert is very important to vanish IME subwindow on Chrome!!!!//
            
            
        }
        
    }

}


function MO_OnCompositionupdate(event){
    const subtext = event.data;
    console.log("composition update: ", subtext.length);
    
}


function MO_OnCompositionend(event){
    const subtext = event.data;
    console.log("compositionend: ", subtext.length);   

    MO_in_composition = false;

    MO_RegisterIMEUpdate();
    
}


function MO_OnCompositionendForChrome(event){
    const subtext = event.data;    
    if(subtext.length == 0){
        console.log("compositionend (finished by Delete/Backspace): ", subtext.length);
        MO_in_composition = false;
                
    }else{
        console.log("compositionend (finished by Enter): ", subtext.length);
        MO_in_composition = false;
        MO_RegisterIMEUpdate();
    }
}


function MO_RegisterIMEUpdate(){


    if(MO_update_list.length === 0) return; //no update//

    console.log("MO_RegisterIMEUpdate");

    let modified_text_list = [];

    let warning_math_list = [];

    const selection = document.getSelection();

    
    if(MO_highlight){
        const org_focus = MO_highlight.OriginalFocus(MO_IME_node_origin, MO_IME_offset_origin);
        undo_man.Begin(org_focus.node, org_focus.offset);
        MO_highlight.RegisterUndo(MO_update_parents, undo_man);
    }else{    
        undo_man.Begin(MO_IME_node_origin, MO_IME_offset_origin);
    }



    
    MO_update_list.forEach( (update_info) => {
        const record = update_info.record;
        if(record.type==="characterData"){
            console.log("IME: regarded, replace all text data in the node");
            
            const change = StrEnclosureComp(record.oldValue, record.target.data);
            if(change.width1 > 0){
                undo_man.Register(UR_TYPE.DELETE_IN_TEXT, record.oldValue.substring(change.begin, change.begin+change.width1), record.target, change.begin, change.width1);                
            }
            if(change.width2 > 0){
                undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, record.target.data.substring(change.begin, change.begin+change.width2), record.target, change.begin, change.width2);                
            }
            modified_text_list.push({text_node:record.target, offset:change.begin, length:change.width2});

            /*
            //original//
            undo_man.Register(UR_TYPE.DELETE_IN_TEXT, record.oldValue, record.target, 0, record.oldValue.length);
            undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, record.target.data, record.target, 0, record.target.length);
            modified_text_list.push(record.target);
            */
        }else if(record.type==="childList"){
            if(record.addedNodes.length>0){
                const parent = record.target;
                let offset = update_info.offset;
                record.addedNodes.forEach( (node)=>{
                    console.log("IME: added node", node, ", offset=", offset);
                    undo_man.Register(UR_TYPE.ADD_NODE, node, parent, offset, 1);
                    ++offset;

                    // Chromium bug! //
                    // original text is also removed when the IME new text is removed by delete/backspace//
                    // After that, original text is inputed into the previus span.math->span.edit //
                    // Then this text should be fixed //
                    if(parent.className=="math"){
                        warning_math_list.push(parent);
                    }else if( (parent.parentNode) && (parent.parentNode.className == "math")){
                        if(node.nodeType != Node.TEXT_NODE){
                            warning_math_list.push(parent.parentNode);
                        }
                    }

                });
            }
            else if(record.removedNodes.length>0){
                const parent = record.target;
                const offset = update_info.offset;
                record.removedNodes.forEach( (node)=>{
                    console.log("IME: removed node", node, ", offset=", offset);
                    undo_man.Register(UR_TYPE.REMOVE_NODE, node, parent, offset, 1);        
                    
                    if(parent.className=="math"){
                        warning_math_list.push(parent);
                    }

                });
            }
        }
    });


    
    if(selection.rangeCount===0){
        console.log("IME input is cancel: case 4 (by focus blur)");
        undo_man.End(null, 0);
        return;
    }

    //Check position where IME Text is inserted //
    modified_text_list.forEach( (value) => {
        const text_node = value.text_node;

        // (1) inserting IME Text into margin text of math node//
        if(IsTextNodeInMath(text_node)){
            //const margin = GetEditMarginByClassName(text_node.parentNode.className);
            let info;
            switch(text_node.parentNode.className){
            case "editmath":
                info = {beginMark:"$", endMark:"$", reservedChars:["$"]};
                break;
            case "editmathdisp":
                info = {beginMark:"$$", endMark:"$$", reservedChars:["$"]};
                break;
            case "editcode":
                info = {beginMark:"`", endMark:"`", reservedChars:["`"]};
                break;    
            case "editcodedisp":
                info = {beginMark:"```", endMark:"```", reservedChars:["`"]};                
                break;
            case "editem1":
                info = {beginMark:"*", endMark:"*", reservedChars:["*","_"]};
                break;
            case "editem2":
                info = {beginMark:"**", endMark:"**", reservedChars:["*","_"]};
                break;
            case "editem3":
                info = {beginMark:"***", endMark:"***", reservedChars:["*","_"]};
                break;
            case "edita":
                info = {beginMark:"[", endMark:")", reservedChars:["[",")"]};
                break;      
            case "editimg":
                info = {beginMark:"![", endMark:") ", reservedChars:["!","[",")"]};
                break;               
            case "editcite":
                info = {beginMark:"[^", endMark:"] ", reservedChars:["^","[","]"]};
                break;            
            case "editref":
                info = {beginMark:"[^", endMark:"]:", reservedChars:["^","[","]",":"]};
                break;            
            default:
                console.error("ERROR: IME input into invalid edit class in math ");                
                return;
            }

            if( !text_node.data.startsWith(info.beginMark) || !text_node.data.endsWith(info.endMark)){
                //invalid IME input//
                info.reservedChars.forEach( (c) =>{
                    let pos = text_node.data.indexOf(c);
                    while(pos >= 0){
                        DeleteText(text_node, pos, 1);
                        pos = text_node.data.indexOf(c);                        
                    }
                });
                InsertTextIntoText(info.beginMark, text_node, 0);
                InsertTextIntoText(info.endMark, text_node, text_node.length);            
            }        
            
        
        }else{//(2) inserting IME Text into text node//
        
            
            //check the charactors for math tags.//
            {
                const target_text = text_node.data.substring(value.offset, value.offset+value.length);
                let fragment = MD2DOM_OneLine(target_text);
                let is_including_math = false;
                let last_math = null;
                fragment.childNodes.forEach((child)=>{
                    if(child.className == "math"){
                        is_including_math = true;
                        last_math = child;                  
                    }
                });
                if(is_including_math){
                    let node_next = null;
                    if(value.offset+value.length < text_node.data.length){
                        DivideTextNode(text_node, value.offset+value.length);
                        node_next = text_node.nextSibling;
                    }
                    let removable_node = text_node;
                    if(value.offset > 0){
                        DivideTextNode(text_node, value.offset);
                        removable_node = text_node.nextSibling;
                    }
                    let parent = text_node.parentNode;
                    RemoveNode(removable_node);
                    let first = AddNodeList(parent, node_next, fragment);     //combine node//
                    //focus_by_math = SafeJunctionPoint(parent, node_next);
                    for(let node = first; node !== node_next; node = node.nextSibling){
                        DisableEdit(node, true);
                    }
                    const focus_by_math = SafeJunctionPoint(parent, node_next);
                    if(first.parentNode === parent){ //here, sometimes first is deleted by the above SafeJunctionPoint//
                        SafeJunctionPoint(parent, first);
                    }
                    document.getSelection().collapse(focus_by_math.node, focus_by_math.offset);

                }else{
                    //just only text node//
                    //Note that the above math node does not have ZWBR//
                    if(text_node.data == nt_ZWBR) return;
                    
                    const pos = text_node.data.indexOf(nt_ZWBR);
                    if(pos>=0){
                        DeleteText(text_node, pos, 1);
                    }                                        

                }
            }

        }        
    });
    
    //Chromium bug: SPAN for math is chenge by IME when the new input text is removed by delete/backspace key//
    /*
    warning_math_list.forEach((math) => {
        //fix the math node by some operation//
        However, the current way is simply ExecUndo is called
    });
    */

    

    let focus = {node:document.getSelection().focusNode, offset:document.getSelection().focusOffset};
    if(focus.node.nodeType!==Node.TEXT_NODE){
        [focus.node, focus.offset] = RefineFocusToText(focus.node, focus.offset);        
    }

    if(MO_highlight){
        
        const org_end_focus = MO_highlight.ForceRepairWithRegister(MO_update_parents, focus.node, focus.offset);
        if(org_end_focus) focus = org_end_focus;
        undo_man.End(focus.node, focus.offset);
        
        MO_highlight.SearchIn(MO_update_parents);        
        const hi_focus = MO_highlight.HighlightFocus(focus.node, focus.offset);
        document.getSelection().collapse(hi_focus.node, hi_focus.offset);
    }else{
        undo_man.End(focus.node, focus.offset);
    }


    MO_update_list.length = 0;//clear//
    modified_text_list.length = 0;//clear//

    MO_update_parents = null;
    
////////////////////////////////////////////////////////////
    

}


/*
key lock to suppress that focus moves out of IME region
*/
function MO_OnKeydownForIME(event){
    if(MO_in_composition){
        switch(event.key){
            case "ArrowLeft":
            case "ArrowRight":
            case "ArrowUp":
            case "ArrowDown":
            case "PageUp":
            case "PageDown":
            case "Home":
            case "End":
                event.preventDefault();
                event.stopImmediatePropagation();
            break;
        }        
        
    }
    /*
    else{
        
        if(event.key==="Process"){
            //console.log("catch Process key before compositionstart: ",event.key, event.code);
            if(event.code==="Convert"){
                console.log("catch Convert code, and escape here!");
                event.preventDefault();
                event.stopImmediatePropagation();
                document.getSelection().removeAllRanges();
                nt_render_div.blur();
                
            }
        }
    }
    */
}



function MO_OnContextmenuForIME(event){
    if(MO_in_composition){
        console.log("contextmenu: ");
        event.preventDefault();
        event.stopImmediatePropagation();
    }
}


function RefineFocusToText(focus_node, focus_offset){
    const ch = focus_node.childNodes.item(focus_offset);
    if(ch){
        if(ch.nodeType===Node.TEXT_NODE){
            focus_node = ch;
            focus_offset = 0;
        }
    }else{
        const back = focus_node.childNodes.item(focus_offset-1);
        if(back){
            if(back.nodeType===Node.TEXT_NODE){
                focus_node = back;
                focus_offset = focus_node.length;
            }
        }
    }

    return [focus_node, focus_offset];
}

