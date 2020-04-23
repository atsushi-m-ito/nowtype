"use strict";


let MO_IME_node_origin = null;
let MO_IME_offset_origin = 0;

let MO_update_list = [];
let MO_observer = null;
let MO_in_composition = false;

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
                        console.log("MutationObserver detect (not new):",last.record.type,"\n", last.record.oldValue, "\nto\n", last.record.target);
                    }
                }
                if(new_target_update){
                    MO_update_list.push({record:record, offset: GetIndex(record.target.parentNode, record.target)});
                    console.log("MutationObserver detect:",record.type,"\n", record.oldValue, "\nto\n", record.target);
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
            }
            
        });
    }

    //for Chrome (case that the last MutationObserver just after compositionend by Delete/Bakspace key)//
    if((!MO_in_composition) && (MO_update_list.length > 0)){ 
        undo_man.GetChangeEventDispatcher().Disable();
        MO_RegisterIMEUpdate();
        //undo because DOM is broken by Chrome bug//
        ExecUndo();
        undo_man.Shrink();
        undo_man.GetChangeEventDispatcher().Enable();
    }
}

function MO_OnCompositionstart(event){
    MO_in_composition = true;
    console.log("compositionstart: \"", event.data, "\"");
    MO_update_list.length = 0;//clear//

    //br is automatically removed by IME input.
    //then original br is kept before input IME//
    const selection = document.getSelection();
    if(selection.rangeCount === 0){event.currentTarget.blur();return false;}
   
    
    const range = selection.getRangeAt(0);    
    let focus_node = range.startContainer;
    let focus_offset = range.startOffset;
    let anchor_node = range.endContainer;
    let anchor_offset = range.endOffset;
    
    if(focus_node.nodeType!==Node.TEXT_NODE){
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
    
    
    undo_man.Begin(MO_IME_node_origin, MO_IME_offset_origin);
    
    MO_update_list.forEach( (record_offset) => {
        const record = record_offset.record;
        if(record.type==="characterData"){
            console.log("IME: regarded, replace all text data in the node");
                        
            undo_man.Register(UR_TYPE.DELETE_IN_TEXT, record.oldValue, record.target, 0, record.oldValue.length);
            undo_man.Register(UR_TYPE.INSERT_TEXT_INTO_TEXT, record.target.data, record.target, 0, record.target.length);
            modified_text_list.push(record.target);
            
        }else if(record.type==="childList"){
            if(record.addedNodes.length>0){
                const parent = record.target;
                let offset = record_offset.offset;
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
                    }else if( parent.parentNode.className == "math"){
                        if(node.nodeType != Node.TEXT_NODE){
                            warning_math_list.push(parent.parentNode);
                        }
                    }

                });
            }
            else if(record.removedNodes.length>0){
                const parent = record.target;
                const offset = record_offset.offset;
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


    const selection = document.getSelection();
    if(selection.rangeCount===0){
        console.log("IME input is cancel: case 4 (by focus blur)");
        undo_man.End(null, 0);
        return;
    }

    //Check position where IME Text is inserted //
    modified_text_list.forEach( (text_node) => {
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
            
        }else{
            //(2) inserting IME Text into ZWBR node//
            //Note that the above math node does not have ZWBR//
            if(text_node.data == nt_ZWBR) return;
            let pos = text_node.data.indexOf(nt_ZWBR);
            if(pos>=0){
                DeleteText(text_node, pos, 1);
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


    let focus_node = document.getSelection().focusNode;
    let focus_offset = document.getSelection().focusOffset;
    if(focus_node.nodeType!==Node.TEXT_NODE){
        [focus_node, focus_offset] = RefineFocusToText(focus_node, focus_offset);        
    }

    undo_man.End(focus_node, focus_offset);
    
    MO_update_list.length = 0;//clear//
    modified_text_list.length = 0;//clear//
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

